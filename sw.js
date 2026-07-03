// ══════════════════════════════════════════════════════════════
//  SERVICE WORKER — Tablero de Citas Agroterra
//  Estrategia: RED SIEMPRE PRIMERO, cache solo como respaldo offline.
//  El HTML nunca se congela: cada carga exitosa renueva el respaldo.
// ══════════════════════════════════════════════════════════════
var CACHE = 'agroterra-citas-v3';

self.addEventListener('install', function(e) {
  // NO pre-cachear nada: así jamás se congela una copia mala en la instalación.
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;

  // No interceptar la API de Google ni requests que no sean GET
  if (req.method !== 'GET') return;
  if (req.url.indexOf('script.google.com') !== -1) return;

  // Para la página (navegación): pedir SIEMPRE la versión fresca a la red,
  // salteando también el cache HTTP del navegador.
  var isNav = req.mode === 'navigate';
  var netReq = isNav ? new Request(req.url, { cache: 'no-store' }) : req;

  e.respondWith(
    fetch(netReq).then(function(res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c) { c.put(req, copy); });
      }
      return res;
    }).catch(function() {
      // Solo si no hay internet: servir el último respaldo bueno conocido
      return caches.match(req).then(function(hit) {
        if (hit) return hit;
        if (isNav) return caches.match('/Agroterra-citas/index.html');
      });
    })
  );
});
