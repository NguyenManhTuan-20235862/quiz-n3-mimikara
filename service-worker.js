// Service Worker for Quiz Từ Vựng N3 (Mimikara)
// Hỗ trợ lưu trữ toàn bộ ứng dụng để học Offline 100% không cần mạng
const CACHE_NAME = 'quiz-n3-mimikara-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js?v=4',
  './vocab_data.js',
  './grammar_data.js?v=4',
  './manifest.json',
  './icon.svg'
];

// Cài đặt và tải trước các file cốt lõi vào bộ nhớ máy
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting())
  );
});

// Xóa cache cũ khi có phiên bản mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('quiz-n3-mimikara-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Prefer current files online; retain cached files for offline study.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request, { cache: 'no-cache' });
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const home = await cache.match('./index.html');
          if (home) return home;
        }
        throw error;
      }
    })()
  );
});
