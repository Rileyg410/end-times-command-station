/* My vision: the earth on fire, the gauge on the left, Israel walled in fire, and a replay from Sept 18, 2025 */
(() => {
const {$, esc, ago, DATA} = window.ETCS;
const J = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const ld = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
const ISR = [35.0, 31.6];
const DAY = 86400;
// rough places for news headlines [lon, lat]
const PLACES = [
  [/\bgaza|rafah|khan younis/i, 34.4, 31.45], [/west bank|judea|samaria|jenin|nablus|hebron|ramallah/i, 35.2, 32.0],
  [/jerusalem|temple mount|al-aqsa|kotel/i, 35.23, 31.78], [/tel aviv/i, 34.78, 32.08], [/golan/i, 35.75, 33.0], [/eilat/i, 34.95, 29.56],
  [/beirut|hezbollah|leban/i, 35.5, 33.6], [/damascus|syria/i, 36.6, 34.2], [/tehran|iran|irgc|isfahan|natanz|fordow|bushehr/i, 53.0, 32.5],
  [/baghdad|iraq/i, 44.0, 33.2], [/houthi|yemen|sanaa|aden/i, 45.0, 15.5], [/red sea|bab el|bab al/i, 39.5, 18.0],
  [/hormuz/i, 56.3, 26.6], [/persian gulf|\bgulf\b/i, 51.5, 27.0], [/saudi|riyadh/i, 45.0, 24.0], [/qatar|doha/i, 51.2, 25.3],
  [/emirates|\buae\b|dubai|abu dhabi/i, 54.4, 24.4], [/jordan|amman/i, 36.2, 31.2], [/egypt|cairo|sinai/i, 31.2, 29.5],
  [/t(u|ü)rk(ey|iye)|ankara|istanbul|erdogan/i, 33.0, 39.0], [/cyprus/i, 33.3, 35.0], [/kyiv|ukrain|kharkiv|odesa|donbas|crimea/i, 31.5, 49.0],
  [/moscow|kremlin|russia|putin/i, 37.6, 55.75], [/belarus|minsk/i, 27.6, 53.9], [/poland|warsaw/i, 21.0, 52.2], [/baltic|lithuan|latvia|eston/i, 24.5, 56.5],
  [/germany|berlin/i, 13.4, 52.5], [/france|paris/i, 2.35, 48.86], [/britain|\buk\b|london|raf /i, -0.6, 52.0], [/nato|brussels/i, 4.4, 50.85],
  [/taiwan|taipei/i, 121.0, 23.7], [/north korea|pyongyang|kim jong/i, 125.75, 39.0], [/south korea|seoul/i, 127.0, 37.5],
  [/china|beijing|xi jinping|pla\b/i, 116.4, 39.9], [/japan|tokyo/i, 139.7, 35.7], [/philippine|manila|south china sea/i, 118.0, 13.0],
  [/india|delhi|kashmir/i, 77.2, 28.6], [/pakistan|islamabad/i, 73.0, 33.7], [/afghan|kabul/i, 69.2, 34.5],
  [/venezuela|caracas/i, -66.9, 10.5], [/cuba|havana/i, -82.4, 23.1], [/mexico/i, -99.1, 19.4], [/canada|ottawa/i, -75.7, 45.4],
  [/washington|pentagon|white house|\bu\.?s\.?\b|america|united states|trump|hegseth/i, -77.0, 38.9], [/sudan|khartoum/i, 32.5, 15.6],
  [/libya|tripoli/i, 13.2, 32.9], [/somalia/i, 45.3, 2.0], [/nigeria/i, 7.5, 9.1], [/congo/i, 25.0, -2.5], [/africa/i, 20.0, 5.0], [/europe/i, 10.0, 50.0]
];
const AREAS = {'gaza envelope': [34.5, 31.4], 'confrontation line': [35.4, 33.08], 'eilat': [34.95, 29.56], 'arabah': [35.15, 30.3], 'samaria': [35.2, 32.2], 'golan': [35.75, 33.0], 'judea': [35.1, 31.6], 'jerusalem': [35.23, 31.78], 'dan': [34.8, 32.08], 'sharon': [34.9, 32.3], 'haifa': [35.0, 32.8], 'galilee': [35.4, 32.9], 'negev': [34.8, 31.0], 'lachish': [34.6, 31.6], 'yarkon': [34.85, 32.1], 'shfelat': [34.9, 31.8], 'menashe': [35.0, 32.5]};
const where = t => { for (const [re, lo, la] of PLACES) if (re.test(t)) return [lo, la]; return null; };
const areaXY = a => { const k = Object.keys(AREAS).find(k => (a || '').toLowerCase().includes(k)); return k ? AREAS[k] : ISR; };
const qs = m => Math.pow(2, m - 4.5);

const box = $('#vision');
if (!box) return;
const cv = $('#vglobe'), ctx = cv.getContext('2d');
let W = 0, H = 0, R = 0, CX = 0, CY = 0, DPR = 1;
let proj, path, land, israel, circle;
let rot = [-20, -18, 0], zoom = 1, anim = null, dragging = false, lastTouch = 0;
let live = [], liveLvl = null, liveInfo = '', base = null, hist = null, day = -1, playing = null;
const embers = Array.from({length: 280}, () => [Math.random() * 360 - 180, Math.asin(Math.random() * 2 - 1) * 180 / Math.PI, Math.random() * 6.28, .5 + Math.random()]);

// glow sprite
const spr = document.createElement('canvas'); spr.width = spr.height = 64;
{ const g = spr.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(.18, 'rgba(255,214,90,.95)'); gr.addColorStop(.45, 'rgba(255,110,30,.55)'); gr.addColorStop(.75, 'rgba(220,30,60,.18)'); gr.addColorStop(1, 'rgba(200,0,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }

function size() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = cv.clientWidth; H = Math.round(W * .86);
  cv.style.height = H + 'px'; cv.width = W * DPR; cv.height = H * DPR;
  R = Math.min(W * .36, H * .43); CX = W * .55; CY = H * .5;
  const pw = cv.parentNode.style; pw.setProperty('--cx', CX + 'px'); pw.setProperty('--cy', CY + 'px'); pw.setProperty('--r', R + 'px');
}

function level() {
  if (day >= 0 && hist && day < hist.days.length - 1) {
    let s = 0, n = 0;
    for (let d = Math.max(0, day - 1); d <= Math.min(hist.days.length - 1, day + 1); d++) { const a = hist.days[d]; for (let i = 2; i < a.length; i += 3) s += qs(a[i] / 10); n++; }
    return (s / n) / hist.base;
  }
  return liveLvl;
}

function fires() {
  if (day >= 0 && hist && day < hist.days.length - 1) {
    const out = [];
    for (let k = 20; k >= 0; k--) {
      const a = hist.days[day - k]; if (!a) continue;
      const fade = 1 - k / 21;
      for (let i = 0; i < a.length; i += 3) out.push({lo: a[i + 1] / 10, la: a[i] / 10, s: 3 + qs(a[i + 2] / 10) * 2.2, a: k ? fade * .6 : 1});
    }
    return out;
  }
  return live;
}

function draw(t) {
  const L = Math.min(1.3, level() || .4);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const r = R * zoom;
  proj.translate([CX, CY]).scale(r).rotate(rot);
  // fiery halo around the whole earth
  const fl = .85 + .15 * Math.sin(t / 260) + .06 * Math.sin(t / 97);
  const halo = ctx.createRadialGradient(CX, CY, R * .92, CX, CY, R * (1.16 + .08 * L) * fl);
  halo.addColorStop(0, 'rgba(255,120,40,.85)'); halo.addColorStop(.4, 'rgba(255,60,90,.35)'); halo.addColorStop(1, 'rgba(255,80,140,0)');
  if (zoom < 1.5) { ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(CX, CY, R * 1.3, 0, 7); ctx.fill(); }
  ctx.save(); ctx.beginPath(); path({type: 'Sphere'}); ctx.clip();
  const oc = ctx.createRadialGradient(CX - r * .3, CY - r * .35, r * .1, CX, CY, r);
  oc.addColorStop(0, '#5b1838'); oc.addColorStop(1, '#22061a'); ctx.fillStyle = oc; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); path(land); ctx.fillStyle = '#7d2a45'; ctx.fill(); ctx.strokeStyle = 'rgba(255,170,200,.35)'; ctx.lineWidth = .6; ctx.stroke();
  ctx.beginPath(); path(israel); ctx.fillStyle = '#ffd1e3'; ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  const sh = ctx.createRadialGradient(CX, CY, r * .2, CX, CY, r);
  sh.addColorStop(0, `rgba(255,90,30,${.06 + .05 * Math.sin(t / 400)})`); sh.addColorStop(1, `rgba(255,60,40,${.22 + .06 * Math.sin(t / 230) + L * .1})`);
  ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
  // moving fire over the whole planet, stronger as the gauge rises
  for (const e of embers) {
    const p = proj([e[0] + Math.sin(t / 3000 + e[2]) * 2, e[1]]);
    if (!p || d3.geoDistance([e[0], e[1]], [-rot[0], -rot[1]]) > 1.5) continue;
    const s = (5 + 7 * e[3]) * (.55 + .45 * Math.sin(t / 180 * e[3] + e[2])) * (.5 + L * .7) * Math.sqrt(zoom);
    ctx.globalAlpha = .3 + L * .22;
    ctx.drawImage(spr, p[0] - s, p[1] - s, s * 2, s * 2);
  }
  // real events
  for (const f of fires()) {
    if (d3.geoDistance([f.lo, f.la], [-rot[0], -rot[1]]) > 1.52) continue;
    const p = proj([f.lo, f.la]); if (!p) continue;
    const s = f.s * (.8 + .2 * Math.sin(t / 120 + f.lo)) * Math.sqrt(zoom);
    ctx.globalAlpha = f.a; ctx.drawImage(spr, p[0] - s, p[1] - s, s * 2, s * 2);
  }
  // the wall of fire around Israel
  if (d3.geoDistance(ISR, [-rot[0], -rot[1]]) < 1.45) {
    const ring = circle.coordinates[0];
    for (let i = 0; i < ring.length; i++) {
      const p = proj(ring[i]); if (!p) continue;
      const s = (4 + 3 * Math.sin(t / 90 + i * 1.7) + 2 * Math.sin(t / 53 + i)) * Math.sqrt(zoom) * 1.2;
      ctx.globalAlpha = .9; ctx.drawImage(spr, p[0] - s, p[1] - s * 1.6, s * 2, s * 2.6);
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  ctx.beginPath(); path({type: 'Sphere'}); ctx.strokeStyle = 'rgba(255,214,190,.8)'; ctx.lineWidth = 1.5; ctx.stroke();
  gauge(L, t);
}

// curved gauge hugging the earth's left side, filling from the bottom up
function gauge(L, t) {
  const gr = R * 1.13, a0 = Math.PI * .72, a1 = Math.PI * 1.28; // bottom-left to top-left (counterclockwise in canvas = going up the left)
  const fill = Math.min(1, (L || 0) * .9);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(CX, CY, gr, a1, a0, true); ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(CX, CY, gr, a1, a0, true); ctx.lineWidth = 10; ctx.strokeStyle = '#ffd6e6'; ctx.stroke();
  if (fill > 0) {
    const g = ctx.createLinearGradient(0, CY + gr, 0, CY - gr);
    g.addColorStop(0, '#ffd166'); g.addColorStop(.5, '#ff7a3d'); g.addColorStop(1, '#e0306f');
    ctx.beginPath(); ctx.arc(CX, CY, gr, a0, a0 + (a1 - a0) * fill, false); ctx.lineWidth = 10; ctx.strokeStyle = g;
    ctx.shadowColor = 'rgba(255,120,40,.9)'; ctx.shadowBlur = 8 + 4 * Math.sin(t / 200); ctx.stroke(); ctx.shadowBlur = 0;
  }
  // tick: the Sept 18, 2025 level (nearly full)
  const ta = a0 + (a1 - a0) * .9, x1 = CX + Math.cos(ta) * (gr - 9), y1 = CY + Math.sin(ta) * (gr - 9), x2 = CX + Math.cos(ta) * (gr + 9), y2 = CY + Math.sin(ta) * (gr + 9);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = 2.5; ctx.strokeStyle = '#b8245c'; ctx.stroke();
  ctx.font = '600 10px Quicksand, sans-serif'; ctx.fillStyle = '#b8245c'; ctx.textAlign = 'left';
  ctx.fillText('9/18/25', Math.max(2, x2 - 4), y2 - 6);
  ctx.lineCap = 'butt';
}

function loop(t) {
  if (anim) { const k = Math.min(1, (t - anim.t0) / anim.d), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    rot = [anim.r0[0] + (anim.r1[0] - anim.r0[0]) * e, anim.r0[1] + (anim.r1[1] - anim.r0[1]) * e, 0]; zoom = anim.z0 + (anim.z1 - anim.z0) * e; if (k >= 1) anim = null; }
  else if (!dragging && zoom < 1.2 && t - lastTouch > 2500) rot[0] += .12;
  if (box.offsetParent !== null) draw(t);
  requestAnimationFrame(loop);
}
function fly(r1, z1) { const r0 = rot.slice(); let dl = ((r1[0] - r0[0]) % 360 + 540) % 360 - 180; anim = {t0: performance.now(), d: 1600, r0, r1: [r0[0] + dl, r1[1]], z0: zoom, z1}; }

// touch: spin, tap Israel
let sx = 0, sy = 0, sr = null, moved = false;
cv.addEventListener('pointerdown', e => { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; sr = rot.slice(); anim = null; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
  const k = 70 / (R * zoom); rot = [sr[0] + dx * k * 2, Math.max(-80, Math.min(80, sr[1] - dy * k * 2)), 0]; lastTouch = performance.now(); });
cv.addEventListener('pointerup', e => { dragging = false; lastTouch = performance.now(); if (moved) return;
  const b = cv.getBoundingClientRect(), pt = [e.clientX - b.left, e.clientY - b.top], ll = proj.invert(pt);
  if (!ll || Math.hypot(pt[0] - CX, pt[1] - CY) > R * zoom) return;
  if (d3.geoDistance(ll, ISR) < (zoom > 2 ? .07 : .14)) { openSheet(); return; }
  let best = null, bd = 1e9;
  for (const f of fires()) { const p = proj([f.lo, f.la]); if (!p || d3.geoDistance([f.lo, f.la], [-rot[0], -rot[1]]) > 1.5) continue; const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]); if (d < bd) { bd = d; best = f; } }
  $('#vtap').innerHTML = best && bd < 22 && best.label ? '🔥 ' + esc(best.label) : '';
});
cv.addEventListener('pointercancel', () => { dragging = false; });
function openSheet() { $('#vsheet').hidden = false; $('#vsheet').scrollIntoView({behavior: 'smooth', block: 'nearest'}); }

$('#vIsrael').onclick = () => { fly([-ISR[0], -ISR[1]], 4.2); setTimeout(openSheet, 1700); };
$('#vEarth').onclick = () => { fly([rot[0], -18], 1); $('#vsheet').hidden = true; };
$('#vclose').onclick = () => { $('#vsheet').hidden = true; };
window.ETCS.visionLvl = () => liveLvl;
window.ETCS.vFocusIsrael = () => fly([-ISR[0], -ISR[1]], 4.2);
$('#vez').onclick = () => { $('.tabs [data-go="news"]').click(); setTimeout(() => { const d = document.querySelector('[data-desk="ezekiel"]'); if (d) d.click(); }, 30); };

function label() {
  const L = level(), el = $('#vlevel');
  if (L == null) { el.textContent = 'Reading the fire…'; return; }
  const pct = Math.round(L * 100);
  const rep = day >= 0 && hist && day < hist.days.length - 1;
  el.innerHTML = (rep ? '' : '🔥 <b>Today:</b> ') + `<b>${pct}%</b> of the Sept 18, 2025 level` + (rep && day === 0 ? ' · the day of my vision' : pct > 100 ? ' · past it 🚨' : pct >= 85 ? ' · nearly full' : '');
  $('#vinfo').innerHTML = rep ? replayInfo() : liveInfo;
}
function replayInfo() {
  const a = hist.days[day], n = a.length / 3; let mx = 0; for (let i = 2; i < a.length; i += 3) mx = Math.max(mx, a[i] / 10);
  return `${n} quake${n === 1 ? '' : 's'} M4.5+ that day${n ? ' · biggest M' + mx.toFixed(1) : ''}${day === 0 ? ' · an M7.8 shook off Kamchatka, Russia that afternoon' : ''} · the replay gauge uses quakes only`;
}
function dstr(i) { const d = new Date(hist.start + 'T12:00:00'); d.setDate(d.getDate() + i); return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}); }
function setDay(i) {
  if (!hist) return;
  const last = hist.days.length - 1; i = Math.max(0, Math.min(last, i));
  day = i === last ? -1 : i; $('#vday').value = i;
  $('#vdate').textContent = i === last ? 'Today 🔴 live' : dstr(i);
  label();
}
$('#vday').addEventListener('input', e => { stop(); setDay(+e.target.value); });
function stop() { if (playing) { clearInterval(playing); playing = null; $('#vplay').textContent = '▶ Replay'; } }
$('#vplay').onclick = () => {
  if (playing) { stop(); return; }
  if (!hist) return;
  let i = day < 0 ? 0 : day; if (zoom > 1.2) fly([rot[0], -18], 1);
  $('#vplay').textContent = '⏸ Pause';
  playing = setInterval(() => { setDay(i); i++; if (i > hist.days.length - 1) { setDay(i); stop(); } }, 110);
};

async function liveData() {
  const now = Date.now() / 1000, since = now - DAY;
  const [Q, S, M, E, Wd] = await Promise.all([J('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'),
    J(DATA + 'sirens.json?t=' + Math.floor(now / 60)), J(DATA + 'mideast.json?t=' + Math.floor(now / 60)), J(DATA + 'ezekiel.json?t=' + Math.floor(now / 60)), J(DATA + 'world.json?t=' + Math.floor(now / 60))]);
  const out = []; let qsum = 0, nq = 0, ns = 0, nm = 0, nb = 0; const seen = new Set();
  for (const f of (Q && Q.features) || []) { const m = f.properties.mag, c = f.geometry.coordinates; qsum += qs(m); nq++;
    out.push({lo: c[0], la: c[1], s: 3 + qs(m) * 2.2, a: 1, label: `M${m.toFixed(1)} quake · ${f.properties.place} · ${ago(f.properties.time / 1000)}`}); }
  for (const g of (S && S.groups) || []) { if (g.t < since) continue; ns++;
    const xy = areaXY((g.areas || [])[0]); out.push({lo: xy[0], la: xy[1], s: 9, a: 1, label: `Sirens · ${(g.threats || []).join(', ')} · ${(g.cities || []).slice(0, 3).join(', ')} · ${ago(g.t)}`}); }
  const story = (s, big) => { if (seen.has(s.id) || s.t < since) return; seen.add(s.id); big ? nb++ : nm++;
    const xy = where(s.title); if (xy) out.push({lo: xy[0] + (Math.random() - .5), la: xy[1] + (Math.random() - .5), s: big ? 10 : 6, a: big ? 1 : .8, label: (big ? '🚨 ' : '⚔ ') + s.title + ' · ' + ago(s.t)}); };
  for (const s of (Wd && Wd.stories) || []) if (s.big) story(s, true);
  for (const s of (M && M.stories) || []) if (s.mil && s.mil.length) story(s, false);
  for (const s of (E && E.stories) || []) if (s.mil && s.mil.length) story(s, false);
  for (const s of (Wd && Wd.stories) || []) if ((s.cats || []).some(c => c === 'war' || c === 'nuclear') && !s.big) story(s, false);
  live = out;
  const qb = base || 100, B = qb + 8 + 20 + 9;  // Sept 18, 2025: the quakes of Sept 18-19 + an estimated wartime day of sirens (4 alerts), military stories (40) and big stories (3)
  liveLvl = (qsum + ns * 2 + nm * .5 + nb * 3) / B;
  liveInfo = `Last 24 hours: ${nq} quake${nq === 1 ? '' : 's'} M4.5+ · ${ns} siren alert${ns === 1 ? '' : 's'} · ${nm} military stor${nm === 1 ? 'y' : 'ies'} · ${nb} 🚨 big stor${nb === 1 ? 'y' : 'ies'}`;
  label();
}

(async () => {
  try {
    await ld('https://cdn.jsdelivr.net/npm/d3-array@3');
    await ld('https://cdn.jsdelivr.net/npm/d3-geo@3');
    await ld('https://cdn.jsdelivr.net/npm/topojson-client@3');
    const w = await J('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    land = topojson.merge(w, w.objects.countries.geometries);
    israel = topojson.feature(w, w.objects.countries.geometries.filter(g => g.id === '376'));
    circle = d3.geoCircle().center(ISR).radius(2.6).precision(4)();
    proj = d3.geoOrthographic().clipAngle(90).precision(.6);
    path = d3.geoPath(proj, ctx);
    size(); window.addEventListener('resize', size);
    $('#vload').remove();
    requestAnimationFrame(loop);
  } catch (e) { $('#vload').textContent = 'The globe could not load right now. Pull down to refresh 💗'; }
  hist = await J(DATA + 'quakehist.json?t=' + Math.floor(Date.now() / 3600000));
  if (hist && hist.days && hist.days.length) { base = hist.base; $('#vday').max = hist.days.length - 1; setDay(hist.days.length - 1); $('#vreplay').hidden = false; }
  await liveData(); setInterval(liveData, 10 * 60 * 1000);
  window.addEventListener('etcs-live', e => { if (e.detail.some(f => /mideast|ezekiel|world/.test(f))) liveData(); });
})();
})();
