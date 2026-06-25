// utils/api.ts
const API_URL = 'http://localhost:5000/graphql';

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