// Minimal service worker so Chrome treats the site as an installable app.
// It does NOT cache anything, so you always get the latest version.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
