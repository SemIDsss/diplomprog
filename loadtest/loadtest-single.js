// loadtest-single.js
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

// ID товара (замените на актуальный из вашей БД)
const PRODUCT_ID = 'cmqxi0lrl001c1h81kwtaxdp0';

// ===== НАСТРОЙКИ =====
export const options = {
  insecureSkipTLSVerify: true,    // игнорируем ошибки сертификата
  vus: 1,                         // один пользователь
  duration: '30s',                // длительность теста 30 секунд
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% запросов < 1 секунды
    http_req_failed: ['rate<0.01'],    // ошибок менее 1%
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

  // 2. Проверка каталога (публичный запрос – без авторизации)
  const catalogRes = http.get(FRONTEND_URL);
  check(catalogRes, { 'catalog 200': (r) => r.status === 200 });
  sleep(0.5);

  // 3. Получение товаров через GraphQL (с авторизацией)
  const productsRes = http.post(
    GRAPHQL_URL,
    JSON.stringify({
      query: `query { products(take: 3) { items { id title price } } }`,
    }),
    { headers: authHeaders }
  );
  check(productsRes, { 'products 200': (r) => r.status === 200 });
  sleep(0.5);

  // 4. Добавление в корзину
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
  check(cartRes, { 'addToCart 200': (r) => r.status === 200 });
  sleep(0.5);

  // 5. Создание заказа
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

  // 6. Инициация платежа
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

  // 7. Проверка статуса платежа (REST)
  const statusRes = http.get(`${BACKEND_URL}/payment/order/${orderId}/status`);
  check(statusRes, { 'status 200': (r) => r.status === 200 });

  sleep(1);
}