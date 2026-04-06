const CACHE_NAME = 'predi-cache-v2026-1';

// Recursos estáticos iniciales a guardar en memoria
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 1. INSTALACIÓN: Guarda los archivos esenciales en el caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caché abierto');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// 2. ACTIVACIÓN: Limpia cachés antiguos si hay una nueva versión
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Borrando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. INTERCEPCIÓN DE PETICIONES (FETCH): Estrategia Stale-While-Revalidate
self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    // IGNORAR PETICIONES DE FIREBASE:
    // Firebase Firestore y Auth manejan su propia persistencia de datos. 
    // Interferir aquí rompería la base de datos en tiempo real.
    if (requestUrl.includes('firestore.googleapis.com') || 
        requestUrl.includes('identitytoolkit.googleapis.com') ||
        requestUrl.includes('securetoken.googleapis.com')) {
        return; // Deja que el navegador haga la petición normalmente
    }

    // IGNORAR EXTENSIONES DE CHROME O SCHEMES NO SOPORTADOS
    if (!requestUrl.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Devuelve la respuesta del caché si existe
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en el caché, la busca en internet
                return fetch(event.request).then(networkResponse => {
                    // Validar que la respuesta sea válida antes de cachearla
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Guardar una copia en caché para la próxima vez (Caché dinámico)
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        if (event.request.method === 'GET') {
                            cache.put(event.request, responseToCache);
                        }
                    });

                    return networkResponse;
                });
            }).catch(() => {
                // Fallback por si no hay internet y el recurso no estaba cacheado
                console.log('[SW] Petición fallida y sin caché disponible:', requestUrl);
            })
    );
});
