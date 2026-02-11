/**
 * Service Worker for RAIS2 Newsletter
 * Provides offline caching and background sync
 */

const CACHE_NAME = 'rais2-newsletter-v1';
const STATIC_CACHE = 'rais2-static-v1';
const PROXY_CACHE = 'rais2-proxy-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/builder.html',
    '/viewer.html',
    '/settings.html',
    '/subscribers.html',
    '/cms-export.html',
    '/css/variables.css',
    '/css/main.css',
    '/css/animations.css',
    '/js/storage.js',
    '/js/scraper.js',
    '/js/tracker.js',
    '/js/newsletter.js',
    '/js/email.js',
    '/js/subscribers.js',
    '/js/motion.js',
    '/js/app.js',
    '/js/idb-storage.js',
    '/js/scrape-dashboard.js'
];

// Proxy domains to cache
const PROXY_DOMAINS = [
    'api.allorigins.win',
    'corsproxy.io',
    'api.cors.lol',
    'api.codetabs.com',
    'corsproxy.org',
    'thingproxy.freeboard.io'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { cache: 'reload' });
                })).catch(err => {
                    console.warn('[SW] Some static assets failed to cache:', err);
                });
            })
            .then(() => {
                console.log('[SW] Service worker installed');
                return self.skipWaiting();
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete old versions of our caches
                            return name.startsWith('rais2-') &&
                                   name !== CACHE_NAME &&
                                   name !== STATIC_CACHE &&
                                   name !== PROXY_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Handle proxy requests with network-first strategy
    if (isProxyRequest(url)) {
        event.respondWith(networkFirstProxy(event.request));
        return;
    }

    // Handle static assets with cache-first strategy
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // Handle same-origin requests with stale-while-revalidate
    if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(event.request));
        return;
    }
});

/**
 * Check if request is to a proxy domain
 */
function isProxyRequest(url) {
    return PROXY_DOMAINS.some(domain => url.hostname.includes(domain));
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
    const path = url.pathname;
    return path.endsWith('.css') ||
           path.endsWith('.js') ||
           path.endsWith('.html') ||
           path.endsWith('.png') ||
           path.endsWith('.jpg') ||
           path.endsWith('.svg') ||
           path.endsWith('.woff2');
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('[SW] Cache-first fetch failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network-first strategy for proxy requests
 * Falls back to cache if network fails
 */
async function networkFirstProxy(request) {
    const cache = await caches.open(PROXY_CACHE);

    try {
        const response = await fetch(request, { cache: 'no-store' });

        if (response.ok) {
            // Cache successful proxy responses
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for proxy request');

        const cached = await cache.match(request);
        if (cached) {
            console.log('[SW] Returning cached proxy response');
            return cached;
        }

        // Return error response
        return new Response(JSON.stringify({
            error: 'Network unavailable and no cache',
            offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const networkPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || networkPromise || new Response('Offline', { status: 503 });
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CACHE_SCRAPED_CONTENT':
            // Store scraped content in cache
            cacheScrapedContent(data).then(() => {
                event.ports[0]?.postMessage({ success: true });
            });
            break;

        case 'GET_CACHED_CONTENT':
            // Retrieve cached content
            getCachedContent().then((content) => {
                event.ports[0]?.postMessage({ success: true, content });
            });
            break;

        case 'CLEAR_PROXY_CACHE':
            caches.delete(PROXY_CACHE).then(() => {
                event.ports[0]?.postMessage({ success: true });
            });
            break;

        case 'GET_CACHE_STATUS':
            getCacheStatus().then((status) => {
                event.ports[0]?.postMessage(status);
            });
            break;
    }
});

/**
 * Cache scraped content
 */
async function cacheScrapedContent(content) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(JSON.stringify({
            content,
            timestamp: Date.now()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/api/scraped-content', response);
        console.log('[SW] Scraped content cached');
    } catch (error) {
        console.warn('[SW] Failed to cache scraped content:', error);
    }
}

/**
 * Get cached scraped content
 */
async function getCachedContent() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match('/api/scraped-content');
        if (response) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.warn('[SW] Failed to get cached content:', error);
    }
    return null;
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    const status = {
        staticCache: 0,
        proxyCache: 0,
        mainCache: 0
    };

    try {
        const staticCache = await caches.open(STATIC_CACHE);
        const staticKeys = await staticCache.keys();
        status.staticCache = staticKeys.length;

        const proxyCache = await caches.open(PROXY_CACHE);
        const proxyKeys = await proxyCache.keys();
        status.proxyCache = proxyKeys.length;

        const mainCache = await caches.open(CACHE_NAME);
        const mainKeys = await mainCache.keys();
        status.mainCache = mainKeys.length;
    } catch (error) {
        console.warn('[SW] Failed to get cache status:', error);
    }

    return status;
}
