// frontend/src/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';
import ClientWrapper from './ClientWrapper';
import { YandexMetrica } from '@/components/YandexMetrica';
import { AmplitudeInitializer } from '@/components/AmplitudeInitializer'; 

export const metadata = {
  title: 'Diplom Market',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-100 flex flex-col">
        <YandexMetrica />
        <AmplitudeInitializer /> 
        <ClientWrapper>
          <main className="flex-1 w-full pb-16 lg:pb-0">
            {children}
          </main>
        </ClientWrapper>
        <MobileBottomNav />
      </body>
    </html>
  );
}