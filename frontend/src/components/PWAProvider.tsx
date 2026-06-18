'use client';

import { useEffect } from 'react';

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Безопасная проверка среды выполнения браузера (исключает сбой SSR)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('✔ [PWA]: Активирован. Зона:', reg.scope);
        })
        .catch((err) => {
          console.error('❌ [PWA]: Критический сбой:', err);
        });
    }
  }, []);

  return <>{children}</>;
}
