import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Diplom Market',
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b p-4">
          <div className="max-w-6xl mx-auto flex justify-between">
            <a href="/" className="text-xl font-black text-blue-600">
              DIPLOM MARKET
            </a>
            <nav className="flex space-x-4 text-xs font-bold">
              <a href="/catalog">Каталог</a>
              <a href="/profile">Кабинет</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full">{children}</main>
        <footer className="bg-white border-t p-4 text-center text-xxs text-gray-400">
          &copy; 2026 СУБД Prisma 7 & Next.js.
        </footer>
      </body>
    </html>
  );
}
