const CACHE_NAME = 'secret-garden-v1';
const ASSETS_TO_CACHE = [
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    '../assets/css/style.css',
    '../src/firebase.js',
    './index.html',
    './dashboard.html',
    './login.html'
];

// Install Event
self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Install');
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline pages');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (evt) => {
    if (!evt.request.url.startsWith('http')) return;

    // Cache First for static assets
    if (evt.request.url.includes('/assets/') || evt.request.url.includes('.png') || evt.request.url.includes('.css') || evt.request.url.includes('.js')) {
        evt.respondWith(
            caches.match(evt.request).then((cacheRes) => {
                return cacheRes || fetch(evt.request).then((fetchRes) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(evt.request.url, fetchRes.clone());
                        return fetchRes;
                    });
                });
            })
        );
    } else {
        // Network First for HTML
        evt.respondWith(
            fetch(evt.request).catch(() => {
                return caches.match(evt.request);
            })
        );
    }
});
