import http from 'k6/http';
import { check, sleep } from 'k6';

// ===== КОНФИГУРАЦИЯ =====
const GRAPHQL_URL = 'https://diplomprog-1.onrender.com/graphql';
const FRONTEND_URL = 'https://diplomprog-i2t7akffe-sem-id-s-projects.vercel.app/'; // поменяйте, если нужно

const TEST_USER = {
  email: 'testload@mail.ru',   // укажите реального пользователя
  password: '123456789',      // его пароль
};

// ===== НАСТРОЙКИ НАГРУЗКИ =====
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // разогрев до 100 пользователей
    { duration: '2m', target: 500 },   // рост до 500
    { duration: '3m', target: 1000 },  // рост до 1000
    // при необходимости добавьте больше ступеней
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],   // 95% запросов должны отвечать за <200 мс
    http_req_failed: ['rate<0.01'],     // ошибки менее 1%
  },
};

// ===== ОСНОВНОЙ СЦЕНАРИЙ =====
export default function () {
  // 1. Логин – получаем JWT-токен
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
  check(loginRes, { 'login status 200': (r) => r.status === 200 });

  const token = loginRes.json('data.login.token');
  if (!token) {
    console.error('❌ Токен не получен');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Получить ID первого товара (для остальных шагов)
  const productsQuery = JSON.stringify({
    query: `query { products(take: 1) { items { id } } }`,
  });
  const productsRes = http.post(GRAPHQL_URL, productsQuery, { headers: authHeaders });
  check(productsRes, { 'products query ok': (r) => r.status === 200 });

  const productId = productsRes.json('data.products.items[0].id');
  if (!productId) {
    console.error('❌ Нет товаров');
    return;
  }

  // 3. Просмотр главной страницы
  const mainRes = http.get(FRONTEND_URL);
  check(mainRes, { 'main page 200': (r) => r.status === 200 });
  sleep(0.5);

  // 4. Просмотр карточки товара
  const productRes = http.get(`${FRONTEND_URL}/product/${productId}`);
  check(productRes, { 'product page 200': (r) => r.status === 200 });
  sleep(0.5);

  // 5. Добавление в корзину
  const addToCartPayload = JSON.stringify({
    query: `
      mutation AddToCart($productId: String!, $quantity: Int!) {
        addToCart(productId: $productId, quantity: $quantity) {
          id
          quantity
        }
      }
    `,
    variables: { productId, quantity: 1 },
  });
  const cartRes = http.post(GRAPHQL_URL, addToCartPayload, { headers: authHeaders });
  check(cartRes, { 'add to cart 200': (r) => r.status === 200 });
  sleep(0.5);

  // 6. Создание заказа
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
      items: [{ productId, quantity: 1 }],
    },
  });
  const orderRes = http.post(GRAPHQL_URL, createOrderPayload, { headers: authHeaders });
  check(orderRes, { 'create order 200': (r) => r.status === 200 });
  const orderId = orderRes.json('data.createOrder.id');
  sleep(0.5);

  // 7. Инициация платежа
  if (orderId) {
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
    check(paymentRes, { 'initiate payment 200': (r) => r.status === 200 });
  }

  // 8. Проверка статуса платежа (REST)
  if (orderId) {
    const statusRes = http.get(`${FRONTEND_URL}/api/payment/order/${orderId}/status`);
    check(statusRes, { 'status check 200': (r) => r.status === 200 });
  }

  sleep(1); // пауза между итерациями
}