/**
 * Smart ISP Platform - Service Worker
 * Advanced caching strategy for offline support and performance
 * Version: 2.0.0
 */

const CACHE_NAME = 'smart-isp-v2.0.0';
const STATIC_CACHE = 'smart-isp-static-v2.0.0';
const DYNAMIC_CACHE = 'smart-isp-dynamic-v2.0.0';
const IMAGE_CACHE = 'smart-isp-images-v2.0.0';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/pages/login.html',
    '/pages/dashboard.html',
    '/css/style.css',
    '/css/dashboard.css',
    '/css/responsive.css',
    '/css/animations.css',
    '/js/app.js',
    '/js/charts.js',
    '/js/ticket.js',
    '/js/ui.js'
];

// Cache sizes for cleanup
const CACHE_SIZE_LIMIT = {
    STATIC: 50 * 1024 * 1024, // 50MB
    DYNAMIC: 20 * 1024 * 1024, // 20MB
    IMAGES: 100 * 1024 * 1024 // 100MB
};

// Install event - precache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v2.0.0');
    
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            console.log('[SW] Precaching assets');
            await cache.addAll(PRECACHE_ASSETS);
            
            // Force the waiting service worker to become active
            self.skipWaiting();
        })()
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v2.0.0');
    
    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            const cachesToDelete = cacheNames.filter(name => 
                name !== CACHE_NAME && 
                name !== STATIC_CACHE && 
                name !== DYNAMIC_CACHE && 
                name !== IMAGE_CACHE
            );
            
            await Promise.all(
                cachesToDelete.map(name => {
                    console.log('[SW] Deleting old cache:', name);
                    return caches.delete(name);
                })
            );
            
            // Take control of all clients immediately
            self.clients.claim();
        })()
    );
});

// Fetch event - implement advanced caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // Strategy selection based on request type
    if (url.pathname.match(/\.(css|js)$/)) {
        // Static assets: Cache First with Network Fallback
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        // Images: Cache First with Network Fallback
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    } else if (url.pathname.match(/\/api\//)) {
        // API calls: Network First with Cache Fallback
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    } else if (url.pathname.match(/\.html$/)) {
        // HTML pages: Network First with Cache Fallback
        event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
    } else {
        // Other requests: Stale While Revalidate
        event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
    }
});

// Cache First Strategy - Serve from cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        fetchAndCache(request, cacheName);
        return cachedResponse;
    }
    
    // Network fallback
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Network request failed:', error);
        
        // Return offline fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }
        
        throw error;
    }
}

// Network First Strategy - Try network first, fallback to cache
async function networkFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Network request failed, trying cache:', error);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }
        
        throw error;
    }
}

// Stale While Revalidate Strategy - Serve from cache, update in background
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Always fetch in background to update cache
    const fetchPromise = fetchAndCache(request, cacheName);
    
    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Otherwise wait for network
    return fetchPromise;
}

// Helper function to fetch and cache
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            await cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] Fetch and cache failed:', error);
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-tickets') {
        event.waitUntil(syncTickets());
    } else if (event.tag === 'sync-audit-logs') {
        event.waitUntil(syncAuditLogs());
    }
});

// Sync tickets when back online
async function syncTickets() {
    try {
        // Get offline tickets from IndexedDB
        const offlineTickets = await getOfflineTickets();
        
        // Sync each ticket
        for (const ticket of offlineTickets) {
            await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket)
            });
        }
        
        console.log('[SW] Tickets synced successfully');
    } catch (error) {
        console.error('[SW] Ticket sync failed:', error);
    }
}

// Sync audit logs when back online
async function syncAuditLogs() {
    try {
        const offlineLogs = await getOfflineAuditLogs();
        
        for (const log of offlineLogs) {
            await fetch('/api/audit-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            });
        }
        
        console.log('[SW] Audit logs synced successfully');
    } catch (error) {
        console.error('[SW] Audit log sync failed:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/assets/icons/explore.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/icons/close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Smart ISP Platform', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.data);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/pages/dashboard.html')
        );
    }
});

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);
    
    if (event.tag === 'cleanup-cache') {
        event.waitUntil(cleanupCaches());
    }
});

// Clean up old cache entries
async function cleanupCaches() {
    const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        const sizeLimit = CACHE_SIZE_LIMIT[cacheName.split('-')[2].toUpperCase()] || CACHE_SIZE_LIMIT.STATIC;
        
        let totalSize = 0;
        const entriesToDelete = [];
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const size = await getResponseSize(response);
                totalSize += size;
                
                if (totalSize > sizeLimit) {
                    entriesToDelete.push(request);
                }
            }
        }
        
        // Delete oldest entries if over limit
        for (const request of entriesToDelete) {
            await cache.delete(request);
        }
        
        console.log(`[SW] Cleaned up cache ${cacheName}, deleted ${entriesToDelete.length} entries`);
    }
}

// Helper function to get response size
async function getResponseSize(response) {
    const blob = await response.blob();
    return blob.size;
}

// Message handling from clients
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'CACHE_URL') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.add(event.data.url);
            })
        );
    }
});

// IndexedDB helpers (simplified)
async function getOfflineTickets() {
    // This would interact with IndexedDB
    return [];
}

async function getOfflineAuditLogs() {
    // This would interact with IndexedDB
    return [];
}

console.log('[SW] Service Worker loaded successfully');
