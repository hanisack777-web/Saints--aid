// Service Worker: Caches the app shell for fast loading and offline use.
// Safely preserves Google Apps Script backend calls and local data synchronization.

const CACHE_NAME = 'saints-aid-2026-v1';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png'
];

// 1. Install Event: Cache app shell files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// 2. Activate Event: Clean up old outdated caches
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
        })
    );
    self.clients.claim();
});

// 3. Fetch Event: Handle requests with Network-First / Cache-Fallback strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Never cache calls to Google Apps Script or Google Content (keeps Google Drive sync fully functional)
    if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
        return;
    }

    // Only handle same-origin GET requests for the app shell
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return cached;
                });

            return cached || networkFetch;
        })
    );
});
