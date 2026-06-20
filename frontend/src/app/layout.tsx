'use client';

import './globals.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, BookOpen, User, ShoppingBag, Store, LogIn } from 'lucide-react';
import { YandexMetricaProviderWrapper, YandexMetricaPageView } from '@/components/YandexMetrica';
import { initAmplitude } from '@/lib/amplitude';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'USER' | 'SELLER' | 'ADMIN' | null>(null);

  useEffect(() => {
    // Инициализация Amplitude
    initAmplitude();

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role);
      } catch (e) {}
    }
  }, []);

  const getProfileLink = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'SELLER') return '/seller';
    if (role === 'USER') return '/buyer';
    return '/login';
  };

  const getProfileIcon = () => {
    if (role === 'ADMIN') return <User size={26} strokeWidth={1.8} />;
    if (role === 'SELLER') return <Store size={26} strokeWidth={1.8} />;
    if (role === 'USER') return <User size={26} strokeWidth={1.8} />;
    return <LogIn size={26} strokeWidth={1.8} />;
  };

  const getProfileLabel = () => {
    if (role === 'ADMIN') return 'Админ';
    if (role === 'SELLER') return 'Продавать';
    if (role === 'USER') return 'Профиль';
    return 'Войти';
  };

  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
        <YandexMetricaProviderWrapper>
          <YandexMetricaPageView />
          {/* Шапка */}
          <header className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-50">
            <div className="container-mobile flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <ShoppingBag size={28} className="text-blue-600" strokeWidth={1.8} />
                <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Diplom
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/catalog" className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition">
                  <BookOpen size={24} strokeWidth={1.8} />
                </Link>
                <Link href={getProfileLink()} className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition">
                  {getProfileIcon()}
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full">{children}</main>

          {/* Нижнее меню */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t z-50 md:hidden safe-bottom">
            <div className="flex items-center justify-around h-20">
              <Link href="/" className="flex flex-col items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition">
                <Home size={26} strokeWidth={1.8} />
                <span className="text-sm">Главная</span>
              </Link>
              <Link href="/catalog" className="flex flex-col items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition">
                <BookOpen size={26} strokeWidth={1.8} />
                <span className="text-sm">Каталог</span>
              </Link>
              <Link href={getProfileLink()} className="flex flex-col items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition">
                {getProfileIcon()}
                <span className="text-sm">{getProfileLabel()}</span>
              </Link>
            </div>
          </nav>
        </YandexMetricaProviderWrapper>
      </body>
    </html>
  );
}