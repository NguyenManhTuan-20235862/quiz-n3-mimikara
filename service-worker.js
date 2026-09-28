// Service Worker for Quiz Từ Vựng N3 (Mimikara)
// Hỗ trợ lưu trữ toàn bộ ứng dụng để học Offline 100% không cần mạng
const CACHE_NAME = 'quiz-n3-mimikara-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './vocab_data.js',
  './manifest.json',
  './icon.svg'
];

// Cài đặt và tải trước các file cốt lõi vào bộ nhớ máy
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Xóa cache cũ khi có phiên bản mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Chiến lược Cache-First: Lấy từ bộ nhớ máy trước (siêu nhanh & dùng được khi tắt máy/mất mạng)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Nếu là tài nguyên cùng origin thì lưu bổ sung vào cache
        if (event.request.url.startsWith(self.location.origin) && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback về trang chủ nếu mất mạng hoàn toàn
        return caches.match('./index.html');
      });
    })
  );
});
