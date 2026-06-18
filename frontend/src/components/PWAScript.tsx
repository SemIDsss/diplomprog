'use client';

import { useEffect } from 'react';

export default function PWAScript() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => console.log('✔ [PWA]: Активен. Зона:', reg.scope))
        .catch((err) => console.error('❌ [PWA]: Сбой:', err));
    }
  }, []);

  return null; // Ничего не рендерит, не ломает DOM и гидратацию
}
