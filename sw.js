const CACHE = 'agroterra-citas-v2';   // ← bump de versión: purga el cache viejo (que tenía el HTML roto)
const ASSETS = [
  '/Agroterra-citas/',
  '/Agroterra-citas/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // No interceptar la API de Google
  if (e.request.url.includes('script.google.com')) return;
  // Red primero; si responde bien, ACTUALIZAR el cache con la versión fresca.
  // Así la copia de emergencia nunca queda vieja.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok && e.request.method === 'GET') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
