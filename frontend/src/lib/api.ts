const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/graphql';

export const graphqlRequest = async (query: string, variables?: any) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Ошибка запроса');
  }

  return response.json();
};