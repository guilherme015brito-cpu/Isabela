const CACHE = 'isabela-shell-v9';
const SHELL = ['./', './index.html', './style.css', './navigation.css', './controls.css', './photo.js', './ocr.js', './app.js', './controls.js', './mobile-calendar.js', './mobile-calendar.css', './install.css', './task-filters.css', './cloud.css', './nutrition.js', './nutrition.css', './cloud-config.js', './cloud-core.js', './cloud.js', './vendor/supabase.js', './reminders.js', './reminders.css', './install.js', './manifest.webmanifest', './icons/isabela-192.png', './icons/isabela-180.png', './icons/isabela-512.png', './icons/isabela-32.png', './icons/isabela-16.png', './icons/isabela-maskable-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('isabela-shell-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy))); }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
