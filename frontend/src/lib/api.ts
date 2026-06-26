// frontend/src/lib/api.ts

// На Vercel эту переменную нужно задать в Environment Variables
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// GraphQL эндпоинт
export const API_URL = `${API_BASE}/graphql`;

// Основная функция для GraphQL-запросов
export const graphqlRequest = async (query: string, variables?: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    credentials: 'include', // оставляем для кук (если пригодятся)
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Ошибка запроса');
  }

  const result = await response.json();
  if (result.errors) {
    const isAuthError = result.errors.some((e: any) =>
      e.message.includes('Unauthorized') || e.message.includes('not authenticated')
    );
    if (isAuthError) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(result.errors.map((e: any) => e.message).join(', '));
  }
  return result.data;
};