/* Batch 4: Threads + the Reshaping station */
(() => {
const {$, $$, esc, ago, store, DATA} = window.ETCS;
const J = async f => { try { const r = await fetch(/^https?:/.test(f) ? f : DATA + f + '?t=' + Math.floor(Date.now() / 60000)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const now = () => Date.now() / 1000;
const fmtDay = ds => new Date(ds + 'T12:00:00').toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'});

// =============================================================== THREADS
let TH = null;
function tcard(t) {
  return `<div class="thread ${t.strong ? 'strong' : ''}"><span class="te">${esc(t.e)}</span><div><b>${esc(t.t)}</b>${t.strong ? '<i class="tgold">✨ strong</i>' : ''}<p>${esc(t.p)}</p>` +
    (t.h ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">📰 ${esc(t.h)} <small>${esc(t.src || '')}</small></a>` : '') + `</div></div>`;
}
function threads() {
  const mini = $('#thmini .thm'), box = $('#thtoday');
  if (!TH) { if (mini) mini.innerHTML = '<p class="muted small">Threads will show up here 🧵</p>'; return; }
  const list = TH.threads || [], h = TH.hebrew || {};
  const heb = h.hd ? `${h.hd} ${h.hm} ${h.hy}` : '';
  const dn = TH.vision_day ? `Day ${TH.vision_day.toLocaleString()} since my fire vision` : '';
  const head = `<p class="thdate">${esc(fmtDay(TH.day))}${heb ? ' · ' + esc(heb) : ''}${h.he ? `<span class="he">${esc(h.he)}</span>` : ''}</p>`;
  const none = '<p class="thnone">No new threads today 🧵<small>Nothing truly lines up today, and that\'s okay. I\'ll look again in the morning 💗</small></p>';
  if (mini) {
    mini.innerHTML = list.length
      ? list.slice(0, 2).map(t => `<p class="thline">${esc(t.e)} <b>${esc(t.t)}</b></p>`).join('') + (list.length > 2 ? `<small>+${list.length - 2} more · tap to see them all</small>` : '<small>Tap to see why 💗</small>')
      : '<p class="thline">No new threads today 🧵</p><small>' + esc(dn) + ' · tap for the history</small>';
    $('#thmini').classList.toggle('glow', list.some(t => t.strong));
  }
  if (box) {
    const dan = (TH.daniel || []).map(d => `<span><b>${d.left > 0 ? d.left.toLocaleString() : 0}</b><small>days to ${d.n.toLocaleString()}</small></span>`).join('');
    box.innerHTML = `<h2>🧵 Today</h2>${head}<div class="thdan"><span><b>${(TH.vision_day || 0).toLocaleString()}</b><small>days since my vision</small></span>${dan}</div>` +
      (list.length ? list.map(tcard).join('') : none) + `<p class="tiny muted">Lined up ${esc(TH.made_ct || '')}${(h.events || []).length ? ' · today on God\'s calendar: ' + esc(h.events.join(', ')) : ''}</p>`;
  }
  const soon = $('#thsoon');
  if (soon) {
    soon.hidden = !(TH.soon || []).length;
    soon.innerHTML = '<h2>🗓️ Coming this week</h2>' + (TH.soon || []).map(t => `<p class="thline">${esc(t.e)} <b>${esc(t.when)}</b> · ${esc(t.t)}</p>`).join('');
  }
  const hist = (TH.hist || []).filter(d => d.day !== TH.day);
  const hb = $('#thhist');
  if (hb) hb.innerHTML = hist.length ? hist.map(d => `<div class="card thday"><p class="thdate">${esc(fmtDay(d.day))}${d.heb ? ' · ' + esc(d.heb) : ''}</p>${(d.threads || []).length ? d.threads.map(tcard).join('') : '<p class="small muted">No new threads that day 🧵</p>'}</div>`).join('')
    : '<div class="empty">This is the first day of threads. Each morning gets saved here 🧵💗</div>';
}
async function loadThreads() { const d = await J('threads.json'); if (d) TH = d; threads(); }

// =============================================================== RESHAPING STATION
const home = $('#p-home');
const ORIG = Array.from(home.children);
const banner = document.createElement('div'); banner.id = 'rsbanner'; banner.className = 'rsbanner'; banner.hidden = true;
const isr = document.createElement('div'); isr.id = 'rsisrael'; isr.className = 'card fl rsisrael'; isr.hidden = true;
home.prepend(banner); home.insertBefore(isr, banner.nextSibling);

const ISRX = /israel|idf|gaza|hezbollah|lebanon|iran|tehran|houthi|jerusalem|west bank|syria/i;
const SAFE_THREAT = new Set([3, 4]);  // earthquake / tsunami alerts are not attacks
let S = {}, state = 'calm', why = '';

function decide() {
  const t = now(), out = [];
  // Israel heating up
  const groups = (S.sir && S.sir.groups) || [];
  const atk = groups.filter(g => !SAFE_THREAT.has(+g.threat));
  const sirNow = atk.filter(g => t - g.t < 1800), sir6 = atk.filter(g => t - g.t < 6 * 3600);
  const mil3 = ((S.me && S.me.stories) || []).filter(s => s.mil && s.mil.length && t - s.t < 3 * 3600).length;
  const ez6 = ((S.ez && S.ez.stories) || []).filter(s => s.mil && s.mil.length && t - s.t < 6 * 3600).length;
  const bigIl = ((S.w && S.w.stories) || []).filter(s => s.big && t - s.t < 6 * 3600 && ISRX.test(s.title + ' ' + (s.snip || '')));
  const vl = window.ETCS.visionLvl ? window.ETCS.visionLvl() : null;
  const ir = [];
  if (sirNow.length) ir.push('sirens are sounding');
  else if (sir6.length >= 3) ir.push(`${sir6.length} siren alerts in the last 6 hours`);
  if (bigIl.length) ir.push('major breaking news');
  if (mil3 >= 25) ir.push(`${mil3} military stories in 3 hours`);
  if (ez6 >= 8) ir.push(`the Ezekiel 38 desk spiking (${ez6} military moves in 6 hours)`);
  if (vl != null && vl >= 0.85) ir.push(`the vision gauge at ${Math.round(vl * 100)}%`);
  if (ir.length) out.push(['israel', ir.join(' · ')]);
  // Elijah
  const el = ((S.el && S.el.stories) || []).filter(s => t - s.t < 86400);
  if (el.length) out.push(['elijah', el[0].title]);
  // big quake
  const qk = ((S.q && S.q.features) || []).filter(f => f.properties.mag >= 7 && t - f.properties.time / 1000 < 12 * 3600).sort((a, b) => b.properties.mag - a.properties.mag);
  if (qk.length) out.push(['quake', `M${qk[0].properties.mag.toFixed(1)} · ${qk[0].properties.place || ''}`]);
  // peace and safety
  if (S.ps && S.ps.level === 'spike') out.push(['peace', `${(S.ps.ratio || 0).toFixed(1)}× the usual peace talk`]);
  return out[0] || ['calm', ''];
}

const LOOK = {
  calm: {cls: 'rs-calm', e: '🕊️', t: 'A calm day', s: 'Resting in His word first today', top: ['#versebox', 'H:Walk with Jesus', '#walk', '#thmini']},
  israel: {cls: 'rs-israel', e: '🇮🇱', t: 'Israel is heating up', s: '', top: ['#rsisrael', '#vision', '#sirenflash', 'H:Live from Jerusalem', '#livestrip', '#bigcard']},
  elijah: {cls: 'rs-elijah', e: '🔥', t: 'Elijah watch lit up', s: '', top: ['#elijah', '#bigcard']},
  quake: {cls: 'rs-quake', e: '🌍', t: 'The earth is shaking', s: '', top: ['#quakemini', '#vision', '#bigcard']},
  peace: {cls: 'rs-peace', e: '☮️', t: 'Peace and safety is spiking', s: '', top: ['#psmini', '#bigcard']},
};
function pick(sel) {
  if (sel.startsWith('H:')) return ORIG.find(n => n.tagName === 'H3' && n.textContent.trim() === sel.slice(2));
  return sel === '#rsisrael' ? isr : ORIG.find(n => n.matches && n.matches(sel));
}
function layout(st, usual) {
  const L = LOOK[st];
  document.body.classList.remove(...Object.values(LOOK).map(l => l.cls));
  const top = usual ? [] : L.top.map(pick).filter(Boolean);
  if (!usual) document.body.classList.add(L.cls);
  isr.hidden = usual || st !== 'israel';
  const order = [banner, ...top, ...ORIG.filter(n => !top.includes(n))];
  if (!top.includes(isr)) order.splice(1, 0, isr);
  order.forEach(n => home.appendChild(n));
  // banner
  banner.hidden = false;
  banner.className = 'rsbanner ' + (usual ? 'usual' : L.cls);
  banner.innerHTML = usual
    ? `<span>${L.e} ${esc(L.t)}</span><button id="rsback">Show it ✨</button>`
    : `<span><b>${L.e} ${esc(L.t)}</b><small>${esc(why || L.s)}</small></span><button id="rsnorm">My usual layout</button>`;
}
function israelCard() {
  const t = now(), groups = ((S.sir && S.sir.groups) || []).filter(g => !SAFE_THREAT.has(+g.threat));
  const last = groups[0];
  const mil = ((S.me && S.me.stories) || []).filter(s => s.mil && s.mil.length).slice(0, 4);
  isr.innerHTML = `<h2>🔥 Israel · a wall of fire</h2><p class="script vz">“For I, saith the LORD, will be unto her a wall of fire round about.” <small>Zechariah 2:5</small></p>` +
    `<div class="grid2"><button class="tile ${last && t - last.t < 1800 ? 'red' : ''}" data-open="sirens"><b>🚨</b><span>Sirens</span><small>${last ? (t - last.t < 1800 ? 'SOUNDING NOW' : 'last ' + esc(ago(last.t))) : 'Quiet'}</small></button>` +
    `<button class="tile camtile" data-open="cam"><span class="lp">● LIVE</span><b>📹</b>Kotel cam</button></div>` +
    `<div class="minilist">${mil.map(s => `<a href="${esc(s.link)}" target="_blank" rel="noopener"><b>⚔️ ${esc(s.title)}</b><small>${esc(s.src)} · ${esc(ago(s.t))}</small></a>`).join('') || '<p class="muted small">Loading Israel news…</p>'}</div>` +
    `<button class="pillbtn" data-go="news">All the Israel news 💌</button>`;
}
let lastState = null, usualFor = store.get('etcs_rs_usual', '');
function reshape() {
  if (document.body.classList.contains('lb')) return;
  [state, why] = decide();
  const usual = usualFor === state;
  if (state === 'israel') israelCard();
  if (state !== lastState || usual !== reshape.u) {
    layout(state, usual);
    if (state === 'israel' && !usual && lastState !== 'israel' && window.ETCS.vFocusIsrael) setTimeout(() => window.ETCS.vFocusIsrael(), 1200);
  } else if (!usual && state !== 'calm') {
    const sm = banner.querySelector('small'); if (sm) sm.textContent = why;
  }
  lastState = state; reshape.u = usual;
  if (usualFor && usualFor !== state) { usualFor = ''; store.set('etcs_rs_usual', ''); }
}
banner.addEventListener('click', e => {
  if (e.target.id === 'rsnorm') { usualFor = state; store.set('etcs_rs_usual', state); reshape(); window.scrollTo({top: 0, behavior: 'smooth'}); }
  if (e.target.id === 'rsback') { usualFor = ''; store.set('etcs_rs_usual', ''); reshape(); }
});
async function loadWorld() {
  const [sir, me, ez, w, el, ps, q] = await Promise.all([J('sirens.json'), J('mideast.json'), J('ezekiel.json'), J('world.json'), J('elijah.json'), J('peace.json'),
    J('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')]);
  S = {sir: sir || S.sir, me: me || S.me, ez: ez || S.ez, w: w || S.w, el: el || S.el, ps: ps || S.ps, q: q || S.q};
  reshape();
}
window.ETCS.reshape = () => ({state, why, usual: usualFor === state});

loadThreads(); loadWorld();
setTimeout(reshape, 4000);  // once the vision gauge has read the fire
setInterval(loadWorld, 60000);
setInterval(loadThreads, 15 * 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { loadWorld(); loadThreads(); } });
})();
