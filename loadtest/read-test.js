import http from 'k6/http';
import { check, sleep } from 'k6';

const GRAPHQL_URL = 'https://diplomprog-1.onrender.com/graphql';

export const options = {
  insecureSkipTLSVerify: true,
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.post(GRAPHQL_URL, JSON.stringify({
    query: `query { products(take: 5) { items { id title price } } }`
  }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'products 200': (r) => r.status === 200 });
  sleep(0.5);
}