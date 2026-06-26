import http from 'k6/http';
import { check, sleep } from 'k6';

// ===== КОНФИГУРАЦИЯ =====
const GRAPHQL_URL = 'https://diplomprog-1.onrender.com/graphql';
const FRONTEND_URL = 'https://diplomprog.vercel.app/';

const TEST_USER = {
  email: 'buyer@test.com',      // можно использовать любого существующего пользователя
  password: 'buyer123',         // пароль из seed
};

// === ID товара (взят из базы) ===
const PRODUCT_ID = 'cmqxi0lrl001c1h81kwtaxdp0';

// ===== НАСТРОЙКИ НАГРУЗКИ =====
export const options = {
  insecureSkipTLSVerify: true, // <-- Добавьте эту строку
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // 1. Логин
  const loginPayload = JSON.stringify({
    query: `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
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
  if (!token) return;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Проверка товара (опционально)
  const checkProduct = http.post(
    GRAPHQL_URL,
    JSON.stringify({
      query: `query { product(id: "${PRODUCT_ID}") { id } }`,
    }),
    { headers: authHeaders }
  );
  if (!checkProduct.json('data.product')) {
    console.error('❌ Товар не найден');
    return;
  }

  // 3. Главная страница
  http.get(FRONTEND_URL);
  sleep(0.5);

  // 4. Карточка товара
  http.get(`${FRONTEND_URL}/product/${PRODUCT_ID}`);
  sleep(0.5);

  // 5. Добавление в корзину
  const addToCart = http.post(
    GRAPHQL_URL,
    JSON.stringify({
      query: `
        mutation AddToCart($productId: String!, $quantity: Int!) {
          addToCart(productId: $productId, quantity: $quantity) { id }
        }
      `,
      variables: { productId: PRODUCT_ID, quantity: 1 },
    }),
    { headers: authHeaders }
  );
  check(addToCart, { 'addToCart 200': (r) => r.status === 200 });
  sleep(0.5);

  // 6. Создание заказа
  const createOrder = http.post(
    GRAPHQL_URL,
    JSON.stringify({
      query: `
        mutation CreateOrder($deliveryMethod: String!, $items: [OrderItemInput!]!) {
          createOrder(deliveryMethod: $deliveryMethod, items: $items) { id }
        }
      `,
      variables: {
        deliveryMethod: 'cdek',
        items: [{ productId: PRODUCT_ID, quantity: 1 }],
      },
    }),
    { headers: authHeaders }
  );
  check(createOrder, { 'createOrder 200': (r) => r.status === 200 });
  const orderId = createOrder.json('data.createOrder.id');
  sleep(0.5);

  // 7. Инициация платежа
  if (orderId) {
    const payment = http.post(
      GRAPHQL_URL,
      JSON.stringify({
        query: `
          mutation InitiatePayment($orderId: String!, $method: String!, $returnUrl: String!) {
            initiatePayment(orderId: $orderId, method: $method, returnUrl: $returnUrl) { paymentUrl }
          }
        `,
        variables: {
          orderId,
          method: 'bank_card',
          returnUrl: `${FRONTEND_URL}/payment-success?orderId=${orderId}`,
        },
      }),
      { headers: authHeaders }
    );
    check(payment, { 'payment 200': (r) => r.status === 200 });
    sleep(0.5);
  }

  // 8. Проверка статуса платежа (REST)
  if (orderId) {
    const status = http.get(`${FRONTEND_URL}/api/payment/order/${orderId}/status`);
    check(status, { 'status 200': (r) => r.status === 200 });
  }

  sleep(1);
}