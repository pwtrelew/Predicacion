// === REGLA DE ORO: Cambia este número de versión cada vez que modifiques tu index.html ===
const CACHE_NAME = 'predicacion-v4'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación: Guardamos la app y forzamos la actualización inmediata
self.addEventListener('install', event => {
  self.skipWaiting(); // Obliga al celular a instalar la nueva versión sin esperar
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache actualizado a', CACHE_NAME);
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activación: Tomamos el control y limpiamos la basura vieja
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Aplica los cambios a todas las pestañas abiertas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de red: Estrategia "Network First" (Red primero, luego Caché)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si hay internet, obtenemos la versión más fresca de GitHub
        return response;
      })
      .catch(() => {
        // Si NO hay internet (modo avión o sin señal), servimos la versión guardada
        return caches.match(event.request);
      })
  );
});
