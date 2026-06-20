'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Если нет токена - отправляем на логин
    if (!token) {
      router.push('/login');
      return;
    }

    // Если есть токен, но нет данных пользователя - тоже на логин
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Пользователь:', user); // Для отладки

      // Перенаправляем в зависимости от роли
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'SELLER':
          router.push('/seller');
          break;
        case 'USER':
          router.push('/buyer');
          break;
        default:
          // Если роль неизвестна - на логин
          router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка при разборе user:', error);
      // Если данные повреждены - на логин
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  // Показываем загрузку, пока происходит редирект
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-4 text-sm">Загрузка профиля...</p>
      </div>
    </div>
  );
}