const CACHE = 'comissario-v1.0.0';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './src/app.js', './src/content.js', './src/state.js', './src/sim.js',
  './src/persistence.js', './src/render.js', './src/map.js', './src/precinct.js',
  './src/art.js', './src/campaign.js', './src/phone.js', './src/routes.js',
  './src/icons.js', './src/view-helpers.js', './src/world-detail.js',
  './src/audio.js', './src/i18n.js', './assets/manifest.json',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon.svg',
  ...['c01','c02','c03','c04','c05'].map(id=>'./assets/backgrounds/'+id+'.webp'),
  ...Array.from({length:10},(_,i)=>'./assets/references/c'+String(i+1).padStart(2,'0')+'.webp')
];
// Cache the complete release before activating. A failed download leaves the
// previous release available; addAll commits this request set atomically.
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' }))))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('comissario-') && key !== CACHE).map(key => caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  const url = new URL(event.request.url);
  const known = ASSETS.some(path => new URL(path, self.registration.scope).pathname === url.pathname);
  if (!known && event.request.mode !== 'navigate') return;
  // Serve one coherent cached release; do not mix old JS and newly fetched JS.
  // Browser SW update checks fetch this script independently of these routes.
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    if (event.request.mode === 'navigate') return cache.match(new URL('./index.html', self.registration.scope));
    return fetch(event.request);
  }));
});
