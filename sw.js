const CACHE_NAME = 'kids-dict-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
];

// 설치 — 정적 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 활성화 — 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API 요청은 캐시 안 함 — 항상 네트워크
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 정적 파일 — 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 성공한 GET 요청만 캐시
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 오프라인 + 캐시 없음 → index.html 반환
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
