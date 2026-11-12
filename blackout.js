/* Blackout mode + Elijah watch */
(() => {
'use strict';
const {$, esc, ago, ct, store, DATA} = window.ETCS;
const BIBLE_URL = new URL('bible/kjv.json', location.href).href;
const hasCaches = 'caches' in window;

// ---------------------------------------------------------------- save it all on the phone
let swOk = false, bibleOk = false;
async function bibleSaved() {
  if (!hasCaches) return false;
  try { return !!(await (await caches.open('etcs-bible')).match(BIBLE_URL, {ignoreSearch: true})); } catch (e) { return false; }
}
async function saveBible() {
  if (!hasCaches || await bibleSaved()) return true;
  try { const c = await caches.open('etcs-bible'); await c.add(BIBLE_URL); return true; } catch (e) { return false; }
}
async function prepare() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); const r = await navigator.serviceWorker.ready; swOk = !!r.active; } catch (e) { swOk = false; }
  }
  bibleOk = await saveBible();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => null);
  status();
}

// ---------------------------------------------------------------- status + badge
function status() {
  const sn = store.get('etcs_snap_news', null), sq = store.get('etcs_snap_quakes', null);
  const signs = store.get('etcs_signs', []), pr = store.get('etcs_prayers', null);
  const ready = swOk && bibleOk;
  const b = $('#bobadge');
  if (b) { b.classList.toggle('ready', ready); b.innerHTML = ready ? '🔦 Blackout ready <small>everything is saved on my phone</small>' : '🔦 Saving for blackout… <small>keep the app open a moment</small>'; }
  const row = (ok, t) => `<li class="${ok ? 'ok' : ''}"><span>${ok ? '✅' : '⏳'}</span>${t}</li>`;
  const box = $('#bostat');
  if (box) box.innerHTML = `<h2>${ready ? '🔦 Blackout ready' : '🔦 Getting ready…'}</h2><ul class="bolist">` +
    row(swOk, 'The station opens with no internet') +
    row(bibleOk, 'The whole King James Bible · 66 books, 31,102 verses') +
    row(swOk, 'How to be saved') +
    row(true, 'My testimony timeline') +
    row(true, `My signs log (${Array.isArray(signs) ? signs.length : 0}) and prayer list${Array.isArray(pr) ? ` (${pr.length})` : ''}`) +
    row(!!sn, sn ? `News saved ${esc(ct(sn.t))}` : 'News snapshot (saves when the news loads)') +
    row(!!sq, sq ? `Quakes saved ${esc(ct(sq.t))}` : 'Quake snapshot (saves when the quakes load)') +
    `</ul><p class="small muted">${navigator.onLine ? '📶 Online now. It all stays saved for when the lights go out.' : '🕯️ Offline now. Showing what I saved.'}</p>`;
}
window.addEventListener('online', status); window.addEventListener('offline', status);
window.ETCS.boStatus = status;

// ---------------------------------------------------------------- saved news + quakes
function snaps() {
  const sn = store.get('etcs_snap_news', null), sq = store.get('etcs_snap_quakes', null);
  const a = s => `<a href="${esc(s.link)}" target="_blank" rel="noopener"><b>${esc(s.title)}</b><small>${esc(s.src)} · ${esc(ct(s.t))}</small></a>`;
  $('#bonews').innerHTML = '<h2>💌 Last news I saved</h2>' + (sn ? `<p class="small muted">Saved ${esc(ct(sn.t))} (${esc(ago(sn.t))})</p>` +
    (sn.big && sn.big.length ? '<h4 class="boh">🚨 Big stories</h4><div class="minilist">' + sn.big.map(a).join('') + '</div>' : '') +
    '<h4 class="boh">🇮🇱 Israel &amp; Mideast</h4><div class="minilist">' + (sn.me || []).map(a).join('') + '</div>' +
    (sn.world && sn.world.length ? '<h4 class="boh">🌍 World watch</h4><div class="minilist">' + sn.world.map(a).join('') + '</div>' : '')
    : '<p class="muted">The news saves here as soon as it loads 💗</p>');
  $('#boquakes').innerHTML = '<h2>🌍 Last quakes I saved</h2>' + (sq ? `<p class="small muted">USGS · saved ${esc(ct(sq.t))} (${esc(ago(sq.t))})</p><div class="minilist">` +
    sq.q.map(q => `<a href="${esc(q.url)}" target="_blank" rel="noopener"><b>${q.m >= 6 ? '🚨 ' : ''}M${(+q.m).toFixed(1)} · ${esc(q.place)}</b><small>${esc(ct(q.t))}</small></a>`).join('') + '</div>'
    : '<p class="muted">Quakes save here as soon as they load 💗</p>');
}

// ---------------------------------------------------------------- testimony (no internet needed)
function testimony() {
  const TT = window.ETCS.TT || [];
  const day = d => Math.round((Date.parse(window.ETCS.ymd() + 'T00:00:00Z') - Date.parse(d + 'T00:00:00Z')) / 86400000);
  const nice = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
  $('#botesti').innerHTML = '<h2>🕊️ My testimony timeline</h2><div class="tl">' + TT.map(([d, h, p, end]) =>
    `<div class="tli past"><div class="td">${d ? esc(end ? nice(d) + ' – ' + nice(end) : nice(d)) : 'One of my signs'}</div><h4>${esc(h)}</h4>${p ? `<p>${esc(p)}</p>` : ''}${d ? `<span class="cnt">${day(end || d)} days ago</span>` : ''}</div>`).join('') +
    '<div class="tli here"><div class="td">Today</div><h4>💗 Still watching</h4></div></div>';
}

// ---------------------------------------------------------------- the Bible
let BIB = null, bibP = null;
function loadBible() {
  if (BIB) return Promise.resolve(BIB);
  if (!bibP) bibP = (async () => {
    let r = null;
    if (hasCaches) { try { r = await (await caches.open('etcs-bible')).match(BIBLE_URL, {ignoreSearch: true}); } catch (e) { r = null; } }
    if (!r) { r = await fetch(BIBLE_URL); if (r.ok && hasCaches) { try { (await caches.open('etcs-bible')).put(BIBLE_URL, r.clone()); } catch (e) { /* ok */ } } }
    BIB = await r.json(); bibleOk = true; status(); return BIB;
  })().catch(e => { bibP = null; throw e; });
  return bibP;
}
let pos = store.get('etcs_bpos', {b: 42, c: 1});
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^first/, '1').replace(/^second/, '2').replace(/^third/, '3');
function findBook(q) {
  const n = norm(q).replace(/^psalm$/, 'psalms').replace(/^song(s)?$/, 'songofsolomon');
  if (!n) return -1;
  let i = BIB.findIndex(x => norm(x[0]) === n);
  if (i < 0) i = BIB.findIndex(x => norm(x[0]).startsWith(n));
  return i;
}
function fillSel() {
  const bs = $('#bbook'), cs = $('#bchap');
  if (!bs.options.length) bs.innerHTML = BIB.map((x, i) => `<option value="${i}">${esc(x[0])}</option>`).join('');
  bs.value = pos.b;
  cs.innerHTML = BIB[pos.b][1].map((_, i) => `<option value="${i + 1}">Chapter ${i + 1}</option>`).join('');
  cs.value = pos.c;
}
function read(b, c, v) {
  b = Math.max(0, Math.min(65, b));
  const n = BIB[b][1].length;
  c = Math.max(1, Math.min(n, c));
  pos = {b, c}; store.set('etcs_bpos', pos); fillSel();
  const vs = BIB[b][1][c - 1];
  $('#bread').innerHTML = `<h3 class="bch">${esc(BIB[b][0])} ${c}</h3>` + vs.map((t, i) => `<p class="bv${v === i + 1 ? ' hi' : ''}" id="bv${i + 1}"><sup>${i + 1}</sup>${esc(t)}</p>`).join('');
  if (v) { const el = document.getElementById('bv' + v); if (el) setTimeout(() => el.scrollIntoView({block: 'center'}), 30); }
}
function search(q) {
  q = q.trim(); if (!q) return;
  const m = /^(.*?[a-z].*?)\s*(\d+)?(?:\s*[:.]\s*(\d+))?\s*$/i.exec(q);
  if (m) {
    const bi = findBook(m[1]);
    if (bi >= 0 && (m[2] || norm(m[1]).length >= 3)) { $('#bres').innerHTML = ''; read(bi, +m[2] || 1, +m[3] || 0); return; }
  }
  const low = q.toLowerCase(), out = [];
  let total = 0;
  BIB.forEach((bk, bi) => bk[1].forEach((ch, ci) => ch.forEach((t, vi) => { if (t.toLowerCase().includes(low)) { total++; if (out.length < 80) out.push([bi, ci + 1, vi + 1, t]); } })));
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
  $('#bres').innerHTML = `<p class="small muted">${total ? `${total.toLocaleString()} verse${total === 1 ? '' : 's'} with “${esc(q)}”${total > 80 ? ' · showing the first 80' : ''}` : `No verses with “${esc(q)}”`}</p>` +
    out.map(([b, c, v, t]) => `<button class="bhit" data-b="${b}" data-c="${c}" data-v="${v}"><b>${esc(BIB[b][0])} ${c}:${v}</b><span>${esc(t).replace(re, '<mark>$1</mark>')}</span></button>`).join('');
}
async function openBible() {
  $('#bread').innerHTML = '<p class="muted center">Opening the Bible… 📖</p>';
  try { await loadBible(); read(pos.b, pos.c); } catch (e) { $('#bread').innerHTML = '<p class="muted center">The Bible saves the first time I open the app online 💗</p>'; }
}
document.addEventListener('change', e => {
  if (!BIB) return;
  if (e.target.id === 'bbook') read(+e.target.value, 1);
  if (e.target.id === 'bchap') read(pos.b, +e.target.value);
});
document.addEventListener('click', e => {
  const h = e.target.closest('.bhit'); if (h) { read(+h.dataset.b, +h.dataset.c, +h.dataset.v); $('#bible').scrollIntoView({behavior: 'smooth'}); return; }
  if (e.target.closest('#bprev') && BIB) { pos.c > 1 ? read(pos.b, pos.c - 1) : pos.b > 0 && read(pos.b - 1, BIB[pos.b - 1][1].length); }
  if (e.target.closest('#bnext') && BIB) { pos.c < BIB[pos.b][1].length ? read(pos.b, pos.c + 1) : pos.b < 65 && read(pos.b + 1, 1); }
  const g = e.target.closest('[data-go="blackout"]'); if (g) { status(); snaps(); testimony(); openBible(); }
  const j = e.target.closest('[data-bjump]'); if (j) { e.preventDefault(); if (!document.getElementById('p-blackout').classList.contains('on')) document.querySelector('[data-go="blackout"]').click(); loadBible().then(() => { const [b, c, v] = j.dataset.bjump.split('.'); read(+b, +c, +v); $('#bible').scrollIntoView({behavior: 'smooth'}); }).catch(() => null); }
});
document.addEventListener('submit', e => { if (e.target.id === 'bsearch') { e.preventDefault(); const q = $('#bq').value; loadBible().then(() => search(q)).catch(() => { $('#bres').innerHTML = '<p class="muted">The Bible saves the first time I open the app online 💗</p>'; }); } });

// ---------------------------------------------------------------- Elijah watch
const ELAB = {claim: '🔥 Claims to be Elijah', witness: '👥 Two witnesses', carmel: '⛰️ Mount Carmel', olives: '🫒 Mount of Olives'};
async function elijah() {
  let j = null;
  try { const r = await fetch(DATA + 'elijah.json?t=' + Math.floor(Date.now() / 60000)); if (r.ok) j = await r.json(); } catch (e) { j = null; }
  const box = $('#elijah'); if (!box) return;
  const list = ((j && j.stories) || []).filter(s => Date.now() / 1000 - s.t < 7 * 86400);
  box.classList.toggle('lit', list.length > 0);
  $('#elist').innerHTML = list.length ? '<div class="minilist">' + list.slice(0, 6).map(s => `<a href="${esc(s.link)}" target="_blank" rel="noopener"><i class="etag">${esc(ELAB[(s.tags || [])[0]] || '🔥 Elijah watch')}</i><b>${esc(s.title)}</b><small>${esc(s.src)} · ${esc(ct(s.t))} · ${esc(ago(s.t))}</small></a>`).join('') + '</div>'
    : `<p class="small equiet">🕊️ Quiet. No one is claiming to be Elijah or one of the two witnesses, and nothing unusual at Mount Carmel or the Mount of Olives${j && j.updated ? ` · checked ${esc(ago(j.updated))}` : ''}.</p>`;
}

prepare(); elijah(); status();
setInterval(elijah, 3 * 60 * 1000);
})();
