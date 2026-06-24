import './globals.css';
import { ReactNode } from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata = {
  title: 'Diplom Market',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-100 flex flex-col">
        <main className="flex-1 w-full pb-16 lg:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </body>
    </html>
  );
}