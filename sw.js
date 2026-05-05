// Service Worker — La Nave Padel App
// Versiona el caché para forzar actualización al cambiar el sw
const CACHE_NAME = 'padel-v1';

// Archivos que se cachean para uso offline
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: cachea los recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: limpia cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: Network First (intenta red, si falla usa caché)
// Así los datos de Firebase siempre están frescos cuando hay red
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones al mismo origen (no CDNs externos ni Firebase)
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  const isAsset = ASSETS.some(a => event.request.url.includes(a.replace('./','')));

  if (isSameOrigin && isAsset) {
    // Cache first para recursos estáticos propios
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
        return cached || networkFetch;
      })
    );
  }
  // El resto (Firebase, CDNs) pasa sin interceptar → siempre en tiempo real
});
