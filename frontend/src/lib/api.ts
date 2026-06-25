// frontend/src/lib/api.ts
// Используем переменную окружения, если она задана, иначе локальный хост
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/graphql';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:5000';

export { API_URL, API_BASE };

export const graphqlRequest = async (query: string, variables?: any) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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