// frontend/src/lib/api.ts
// =============================================================
// Универсальный клиент для GraphQL и REST запросов
// В продакшене (Vercel) используем относительные пути (через прокси)
// В разработке (localhost) — прямые URL к локальному бэкенду
// =============================================================

const isProduction = process.env.NODE_ENV === 'production';

// Константы для GraphQL и REST
export const API_URL = isProduction
  ? '/graphql'  // на Vercel запросы идут через прокси
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/graphql');

export const API_BASE = isProduction
  ? '/api'      // на Vercel REST-запросы через прокси
  : (process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:5000');

// Основная функция для GraphQL-запросов
export const graphqlRequest = async (query: string, variables?: any) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // отправляем куки (для аутентификации)
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