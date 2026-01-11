// Simple runtime image caching service worker
const CACHE_NAME = 'image-cache-v1';
const IMAGE_HOSTS = [
  'images.unsplash.com',
  'api.unsplash.com', // rarely useful for images, but included
  'images.pexels.com',
  'pixabay.com',
  'cdn.pixabay.com'
];

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients so SW starts controlling pages ASAP
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isImageHost = IMAGE_HOSTS.includes(url.hostname);
  const isImageReq = req.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp)$/i);

  if (!isImageHost || !isImageReq) {
    return; // Let non-image requests pass through
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) {
        // Stale-while-revalidate: return cached, update in background
        try {
          fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
          });
        } catch {}
        return cached;
      }
      // No cache: fetch and store
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        // If fetch fails, just return a Response error
        return new Response('Image fetch failed', { status: 503 });
      }
    })
  );
});
