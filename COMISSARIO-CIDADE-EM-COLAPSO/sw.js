const CACHE = 'comissario-v0.2.1-scroll';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './src/app.js', './src/content.js', './src/state.js', './src/sim.js',
  './src/persistence.js', './src/render.js', './src/map.js', './src/precinct.js',
  './src/art.js', './src/campaign.js', './src/phone.js', './src/routes.js',
  './src/icons.js', './src/view-helpers.js', './assets/manifest.json',
  ...['c01','c02','c03','c04','c05'].map(id=>'./assets/backgrounds/'+id+'.webp'),
  ...Array.from({length:10},(_,i)=>'./assets/references/c'+String(i+1).padStart(2,'0')+'.webp')
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('comissario-') && key !== CACHE).map(key => caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    if(response.ok)caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
