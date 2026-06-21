'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Проверяем, что Service Workers поддерживаются браузером
    if ('serviceWorker' in navigator) {
      // Регистрируем Service Worker только в продакшене (или всегда, если нужно)
      // Для разработки можно закомментировать условие
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker зарегистрирован:', registration);
          })
          .catch((error) => {
            console.error('❌ Ошибка регистрации Service Worker:', error);
          });
      } else {
        // В режиме разработки регистрируем, но с предупреждением
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => {
            console.log('📦 [DEV] Service Worker зарегистрирован (разработка)');
          })
          .catch(() => {
            // В разработке игнорируем ошибки, чтобы не мешать работе
          });
      }
    } else {
      console.warn('⚠️ Service Workers не поддерживаются этим браузером');
    }

    // Очистка при размонтировании (опционально)
    return () => {
      // Можно отключить SW при выходе, но обычно этого не делают
    };
  }, []);

  // Компонент ничего не рендерит
  return null;
}