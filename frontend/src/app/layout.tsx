import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Diplom Market — Книги, Мебель, Игрушки',
  description: 'Маркетплейс с модерацией и авторизацией Яндекс-ID',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col antialiased">
        
        {/* Единая глобальная шапка сайта */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4 md:px-8">
            <a href="/" className="text-xl md:text-2xl font-black text-blue-600 tracking-wider uppercase hover:opacity-80 transition">
              Diplom Market
            </a>
            <nav className="flex items-center space-x-6 text-sm font-semibold text-gray-600">
              <a href="/catalog" className="hover:text-blue-600 transition">Каталог</a>
              <a href="/profile" className="hover:text-blue-600 transition">Личный кабинет</a>
              <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
                Войти
              </a>
            </nav>
          </div>
        </header>

        {/* Основной контент страниц */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Единый глобальный футер */}
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400 font-medium">
          &copy; 2026 Diplom Market. Все права защищены. Дипломный проект СУБД Prisma 7 & Next.js.
        </footer>

      </body>
    </html>
  );
}
