self.addEventListener('install', (event) => {
	const CACHE_NAME = 'my-pwa-cache-v1';
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(['/', '/global.css', '/build/bundle.css', '/build/bundle.js']);
		})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			// Fetch in the background
			const fetchPromise = fetch(event.request).then((networkResponse) => {
				// Update cache
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
				return networkResponse;
			});
			// Return cached response first, then update
			return cachedResponse || fetchPromise;
		})
	);
});

self.addEventListener('activate', (event) => {
	const cacheWhitelist = [CACHE_NAME]; // Keep only the latest cache

	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
