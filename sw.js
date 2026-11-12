/* Blackout mode: keeps the station, the Bible and the last news on the phone */
const V = 'etcs-v2';
const SHELL = 'etcs-shell-' + V, RUN = 'etcs-run-' + V, BIBLE = 'etcs-bible';
const CORE = ['./', 'index.html', 'style.css?v=7', 'app.js?v=6', 'more.js?v=4', 'live.js?v=5', 'vision.js?v=2', 'blackout.js?v=1', 'mark.js?v=1',
  'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'img/bow.svg', 'img/cluster.svg', 'img/divider.svg', 'img/peony.svg', 'img/rose.svg',
  'img/aurora.jpg', 'img/fig.jpg', 'img/hermon.jpg', 'img/jerusalem.jpg', 'img/milky.jpg', 'img/moon.jpg', 'img/peonies.jpg', 'img/roses.jpg', 'img/wheat.jpg'];
const KEEP = /earthquake\.usgs\.gov|hebcal\.com|swpc\.noaa\.gov|usno\.navy\.mil/;
const SKIP = /ntfy\.sh|api\.github\.com|youtube|ytimg|googlevideo|tzevaadom|\.m3u8|\.ts(\?|$)/;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(CORE.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => null)));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SHELL && k !== RUN && k !== BIBLE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// the news data lives at raw.githubusercontent.com/<owner>/<repo>/<branch or commit>/<file>?t=… : keep one copy per file
function dataKey(u) {
  const m = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/([^?]+)/.exec(u);
  return m ? 'https://etcs.offline/data/' + m[1] : null;
}
async function netFirst(req, cacheName, key) {
  const c = await caches.open(cacheName);
  try {
    const r = await fetch(req);
    if (r && (r.ok || r.type === 'opaque')) c.put(key || req, r.clone()).catch(() => null);
    return r;
  } catch (err) {
    const hit = await c.match(key || req) || await c.match(key || req, {ignoreSearch: true});
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const u = req.url;
  if (SKIP.test(u)) return;
  const url = new URL(u);
  if (req.mode === 'navigate') {
    const saved = async () => (await caches.match('index.html')) || (await caches.match('./'));
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(SHELL).then(c => c.put('index.html', cp)); } return r; });
    // a weak signal shouldn't keep the station from opening: after 6 seconds use the saved copy
    e.respondWith(new Promise(res => {
      let done = false;
      const t = setTimeout(async () => { const s = await saved(); if (s && !done) { done = true; res(s); } }, 6000);
      net.then(r => { if (!done) { done = true; clearTimeout(t); res(r); } })
        .catch(async () => { clearTimeout(t); if (!done) { done = true; res((await saved()) || Response.error()); } });
    }));
    return;
  }
  if (url.origin === location.origin) {
    if (/\/bible\//.test(url.pathname)) {
      e.respondWith(caches.open(BIBLE).then(async c => (await c.match(req, {ignoreSearch: true})) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
      return;
    }
    // app files: fresh when online, saved copy in a blackout
    e.respondWith(netFirst(req, SHELL).catch(async () => (await caches.match(req, {ignoreSearch: true})) || Response.error()));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host)) {
    e.respondWith(caches.open(RUN).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; })));
    return;
  }
  const dk = dataKey(u);
  if (dk) { e.respondWith(netFirst(req, RUN, dk)); return; }
  if (KEEP.test(url.host)) { url.searchParams.delete('t'); e.respondWith(netFirst(req, RUN, url.href)); }
});
