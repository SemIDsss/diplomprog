import http from 'k6/http';
import { check, sleep } from 'k6';

// ===== КОНФИГУРАЦИЯ =====
const GRAPHQL_URL = 'https://diplomprog-1.onrender.com/graphql';
const BACKEND_URL = 'https://diplomprog-1.onrender.com';
const FRONTEND_URL = 'https://diplomprog.vercel.app/';

const TEST_USER = {
  email: 'buyer@test.com',
  password: 'buyer123',
};

const PRODUCT_ID = 'cmqxi0lrl001c1h81kwtaxdp0';

// ===== НАСТРОЙКИ НАГРУЗКИ =====
export const options = {
  insecureSkipTLSVerify: true,
  stages: [
    { duration: '10s', target: 1 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.2'],
  },
};

export default function () {
  // 1. Логин – получаем токен и ID пользователя
  const loginPayload = JSON.stringify({
    query: `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user { id }
        }
      }
    `,
    variables: { email: TEST_USER.email, password: TEST_USER.password },
  });

  const loginRes = http.post(GRAPHQL_URL, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(loginRes, { 'login 200': (r) => r.status === 200 });

  const token = loginRes.json('data.login.token');
  const userId = loginRes.json('data.login.user.id');
  if (!token || !userId) {
    console.error('❌ Токен или userId не получены');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Проверка, что товар существует и имеет остаток
  const productCheck = http.post(
    GRAPHQL_URL,
    JSON.stringify({
      query: `query { product(id: "${PRODUCT_ID}") { id stock } }`,
    }),
    { headers: authHeaders }
  );
  const product = productCheck.json('data.product');
  if (!product) {
    console.error(`❌ Товар с ID ${PRODUCT_ID} не найден`);
    return;
  }
  if (product.stock <= 0) {
    console.error(`❌ Товар ${PRODUCT_ID} имеет нулевой остаток (stock=${product.stock})`);
    return;
  }

  // 3. Добавление в корзину (с userId)
  const addToCartPayload = JSON.stringify({
    query: `
      mutation AddToCart($userId: String!, $productId: String!, $quantity: Int!) {
        addToCart(userId: $userId, productId: $productId, quantity: $quantity) {
          id
          quantity
        }
      }
    `,
    variables: { userId, productId: PRODUCT_ID, quantity: 1 },
  });
  const cartRes = http.post(GRAPHQL_URL, addToCartPayload, { headers: authHeaders });
  const cartOk = check(cartRes, { 'addToCart 200': (r) => r.status === 200 });
  if (!cartOk) {
    console.error('❌ addToCart ответ:', cartRes.body);
  }
  sleep(0.5);

  // 4. Создание заказа
  const createOrderPayload = JSON.stringify({
    query: `
      mutation CreateOrder($deliveryMethod: String!, $items: [OrderItemInput!]!) {
        createOrder(deliveryMethod: $deliveryMethod, items: $items) {
          id
          totalAmount
        }
      }
    `,
    variables: {
      deliveryMethod: 'cdek',
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
    },
  });
  const orderRes = http.post(GRAPHQL_URL, createOrderPayload, { headers: authHeaders });
  check(orderRes, { 'createOrder 200': (r) => r.status === 200 });
  const orderId = orderRes.json('data.createOrder.id');
  if (!orderId) {
    console.error('❌ Не удалось создать заказ');
    return;
  }
  sleep(0.5);

  // 5. Инициация платежа
  const paymentPayload = JSON.stringify({
    query: `
      mutation InitiatePayment($orderId: String!, $method: String!, $returnUrl: String!) {
        initiatePayment(orderId: $orderId, method: $method, returnUrl: $returnUrl) {
          paymentUrl
        }
      }
    `,
    variables: {
      orderId,
      method: 'bank_card',
      returnUrl: `${FRONTEND_URL}/payment-success?orderId=${orderId}`,
    },
  });
  const paymentRes = http.post(GRAPHQL_URL, paymentPayload, { headers: authHeaders });
  check(paymentRes, { 'payment 200': (r) => r.status === 200 });
  sleep(0.5);

  // 6. Проверка статуса платежа (через бэкенд)
  const statusRes = http.get(`${BACKEND_URL}/payment/order/${orderId}/status`);
  check(statusRes, { 'status 200': (r) => r.status === 200 });
  if (statusRes.status !== 200) {
    console.error(`❌ Статус ответа: ${statusRes.status}, тело: ${statusRes.body}`);
  }

  sleep(1);
}