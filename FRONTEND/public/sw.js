// 🧹 SW limpio para Vite + React + PWA
// Este Service Worker solo se activa en PRODUCCIÓN,
// no intercepta nada durante el desarrollo local (vite).

self.addEventListener('install', (event) => {
  console.log('✅ [SW] Instalando Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activado correctamente');
  // Limpia caches antiguos
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
});

// 🧩 Controla los fetch sólo si estás en modo producción
self.addEventListener('fetch', (event) => {
  // Durante el desarrollo (vite localhost), no intercepta
  if (self.location.hostname === 'localhost') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        const clonedResponse = response.clone();
        caches.open('app-cache-v1').then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      });
    })
  );
});
