// frontend/public/sw.js
const CACHE_NAME = 'techmarket-v9';

// Кэшируем только манифест и иконки. Страницы и стили воркер сохранит целиком.
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [PWA] Фиксация базовых ассетов...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Жестко вычищаем старый кэш, чтобы он не конфликтовал со стилями Next.js
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
// Перехват трафика: Надежная стратегия Cache-First для стилей и страниц
self.addEventListener('fetch', (event) => {
  // Полностью игнорируем динамические запросы к базе данных (GraphQL/REST)
  if (event.request.url.includes('/graphql') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Если каркас страницы или файл стилей Tailwind уже есть в кэше — отдаем его мгновенно
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Автоматически кэшируем все успешные GET-запросы (страницы, CSS, JS, картинки)
        if (networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 🔥 ЗАЩИТА ОТ ПОЛОМКИ СТИЛЕЙ: Если сеть пропала, а браузер запрашивает HTML-страницу,
        // принудительно возвращаем из кэша уже сохраненную ранее страницу каталога
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/catalog') || caches.match('/catalog/') || caches.match('/');
        }
      });
    })
  );
});
