import Cookies from 'js-cookie';

export const setAuthData = (token: string, user: any) => {
  Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
  Cookies.set('user', JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' });
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthData = () => {
  const token = Cookies.get('token') || localStorage.getItem('token');
  const userStr = Cookies.get('user') || localStorage.getItem('user');
  
  if (!token || !userStr) return null;
  
  try {
    return {
      token,
      user: JSON.parse(userStr)
    };
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  Cookies.remove('token');
  Cookies.remove('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};