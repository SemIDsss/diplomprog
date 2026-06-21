// Service Worker для офлайн-режима и кэширования
const CACHE_NAME = 'diplom-market-v1';

// Базовые файлы, которые кэшируются при установке
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [PWA] Кэширование базовых файлов');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ [PWA] Некоторые файлы не закэшированы:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Очистка старого кэша при активации
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 [PWA] Удаление старого кэша:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия кэширования: сначала кэш, потом сеть
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Пропускаем запросы к API (GraphQL и REST)
  if (url.pathname.includes('/graphql') || url.pathname.includes('/api/')) {
    return;
  }

  // Пропускаем динамические данные Next.js
  if (url.pathname.includes('/_next/data/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Кэшируем успешные GET-запросы
        if (networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      }).catch(() => {
        // Офлайн-запасной вариант: показываем главную страницу или каталог
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/catalog') || caches.match('/') || caches.match('/catalog/');
        }
        // Для стилей и скриптов возвращаем пустой ответ, чтобы не ломать страницу
        if (event.request.url.match(/\.(css|js)$/)) {
          return new Response('', { status: 200, statusText: 'OK' });
        }
        return new Response('Страница не доступна офлайн', { status: 503 });
      });
    })
  );
});