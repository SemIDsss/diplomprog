// frontend/src/lib/auth.ts

// ============================================================
//  Управление пользовательскими данными
//  Токен НЕ хранится в localStorage – он в httpOnly куке
// ============================================================

const USER_KEY = 'user';
const SELLER_MODE_KEY = 'seller_mode_user_';

// ---------- Пользователь ----------
export const setUser = (user: any, token?: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    if (token) localStorage.setItem('token', token);
  }
};

export const getUser = (): any | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// ---------- Режим продавца (несессионные данные) ----------
export const setSellerMode = (userId: number | string, isSeller: boolean) => {
  localStorage.setItem(`${SELLER_MODE_KEY}${userId}`, String(isSeller));
};

export const getSellerMode = (userId: number | string): boolean => {
  return localStorage.getItem(`${SELLER_MODE_KEY}${userId}`) === 'true';
};

export const removeSellerMode = (userId: number | string) => {
  localStorage.removeItem(`${SELLER_MODE_KEY}${userId}`);
};

// ---------- Очистка всей сессии (кроме seller_mode) ----------
export const clearAuth = () => {
  removeUser();
  // seller_mode не очищаем – это настройка, а не сессия
};