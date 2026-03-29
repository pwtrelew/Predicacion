const CACHE_NAME = 'predicacion-ios17-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación: Guardamos la app en la memoria del dispositivo
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto exitosamente');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activación: Limpiamos cachés antiguos si actualizamos la versión
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de red: Priorizamos el caché para una carga instantánea y soporte Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en el caché, lo devolvemos al instante
        if (response) {
          return response;
        }
        // Si no, lo buscamos en internet
        return fetch(event.request);
      })
  );
});
