/* END TIMES COMMAND STATION · live rooms: Kotel cam, sirens, Third Temple, markets, phone alerts */
(() => {
'use strict';
const {$, $$, esc, ago, ct, store, DATA} = window.ETCS;
const FEED = 'etcs-sirens-live-q8v3n6';
const J = async f => { try { const r = await fetch(DATA + f + '?t=' + Math.floor(Date.now() / 60000)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const ilt = ts => new Date(ts * 1000).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Jerusalem'}) + ' Israel';
const both = ts => `${ct(ts)} · ${ilt(ts)}`;
const now = () => Date.now() / 1000;

// ---------------------------------------------------------------- live sub-rooms
let sub = 'cam';
const liveOn = () => $('#p-live').classList.contains('on');
function showLive(k) {
  sub = k;
  $$('[data-live]').forEach(b => b.classList.toggle('on', b.dataset.live === k));
  $$('.lsub').forEach(d => { d.hidden = d.id !== 'l-' + k; });
  camState();
  if (k === 'markets') btc();
  if (k === 'sirens') $('#livedot').classList.remove('on');
}
function openLive(k) { $('.tabs [data-go="live"]').click(); showLive(k); }
document.addEventListener('click', e => {
  const l = e.target.closest('[data-live]');
  if (l) { showLive(l.dataset.live); return; }
  const o = e.target.closest('[data-open]');
  if (o) { openLive(o.dataset.open); return; }
  if (e.target.closest('[data-go]')) setTimeout(camState, 0);
  const c = e.target.closest('[data-cam]');
  if (c) { cam = +c.dataset.cam; camChips(); playCam(); }
  const m = e.target.closest('[data-why]');
  if (m) { const x = m.closest('.mkt'); x.classList.toggle('open'); m.textContent = x.classList.contains('open') ? 'Got it, close 💗' : 'What am I looking at? 💡'; }
  const t = e.target.closest('[data-tt]');
  if (t) { ttChip = t.dataset.tt; temple(); }
});
document.addEventListener('visibilitychange', () => camState());

// ---------------------------------------------------------------- Kotel cam
let CAMS = [
  {id: 'LMHUcDktP-w', title: 'The Western Wall · Main Plaza', owner: 'Western Wall Heritage Foundation'},
  {id: 'Y3v2WGY-SDc', title: 'The Western Wall', owner: 'Western Wall Heritage Foundation'},
  {id: '77akujLn4k8', title: 'Western Wall · EarthCam', owner: 'EarthCam'},
  {id: 'zp6LNSoq000', title: 'Western Wall & Temple Archaeological Park', owner: 'Mt. of Olives Prayer Bridge'},
];
let cam = 0, playing = '';
const short = t => t.replace(/^EarthCam\s*-\s*/i, '').replace(/\(Jerusalem, Israel\)/i, '').replace(/^The /, '').trim();
function camChips() {
  $('#camchips').innerHTML = CAMS.map((c, i) => `<button data-cam="${i}" class="${i === cam ? 'on' : ''}">📹 Cam ${i + 1} <small>${esc(short(c.title).slice(0, 28))}</small></button>`).join('');
}
function camNow() {
  const h = +new Date().toLocaleString('en-US', {hour: 'numeric', hour12: false, timeZone: 'Asia/Jerusalem'}) % 24;
  const t = new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Jerusalem'});
  const mood = h >= 5 && h < 7 ? 'sunrise over the Wall 🌅' : h >= 7 && h < 17 ? 'daytime at the Wall ☀️' : h >= 17 && h < 19 ? 'golden hour at the Wall 🌇' : 'nighttime, the stones glowing under the lights 🌙';
  const c = CAMS[cam] || {};
  $('#camnow').innerHTML = `It's <b>${t}</b> in Jerusalem · ${mood}<br><small>${esc(c.title || '')}${c.owner ? ' · ' + esc(c.owner) : ''} · <a href="https://www.youtube.com/watch?v=${esc(c.id)}" target="_blank" rel="noopener">open in YouTube</a></small>`;
}
function playCam() {
  const c = CAMS[cam]; if (!c) return;
  playing = c.id;
  $('#camframe').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.id)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" title="${esc(c.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  camNow();
}
function stopCam() {
  const c = CAMS[cam]; if (!c) return;
  playing = '';
  $('#camframe').innerHTML = `<button class="camposter" data-cam="${cam}" style="background-image:url(https://i.ytimg.com/vi/${encodeURIComponent(c.id)}/hqdefault_live.jpg)"><span>▶</span></button>`;
}
function camState() {
  const want = liveOn() && sub === 'cam' && !document.hidden;
  if (want && playing !== (CAMS[cam] || {}).id) playCam();
  else if (!want && playing) stopCam();
}
async function loadCams() {
  const d = await J('cams.json');
  if (d && d.cams && d.cams.length) {
    const cur = (CAMS[cam] || {}).id;
    CAMS = d.cams;
    cam = Math.max(0, CAMS.findIndex(c => c.id === cur));
    if (playing && playing !== CAMS[cam].id) playCam();
  }
  camChips(); if (!playing) stopCam(); camNow();
}

// ---------------------------------------------------------------- sirens
const TI = {0: '🚀', 1: '☣️', 2: '⚠️', 3: '🌍', 4: '🌊', 5: '✈️', 6: '☢️', 7: '🚀', 8: '🚨'};
const TN = {0: 'Rockets & missiles', 1: 'Hazardous materials', 2: 'Terrorist infiltration', 3: 'Earthquake', 4: 'Tsunami', 5: 'Hostile drone / aircraft', 6: 'Radiological event', 7: 'Unconventional missile', 8: 'Alert'};
let SH = null, LIVE = [], relay = 'connecting';
function allGroups() {
  const h = (SH && SH.groups) || [];
  const lv = LIVE.filter(g => !h.some(x => Math.abs(x.t - g.t) < 120 && x.threat === g.threat && g.cities.every(c => x.cities.includes(c))));
  return lv.concat(h).sort((a, b) => b.t - a.t);
}
function townsHTML(c) {
  const first = c.slice(0, 10).map(esc).join(', ');
  return c.length > 10 ? `${first} <details><summary>+${c.length - 10} more towns</summary>${c.slice(10).map(esc).join(', ')}</details>` : first;
}
function gcard(g) {
  const lbl = (g.threats && g.threats.join(' + ')) || TN[g.threat] || 'Alert';
  const fresh = now() - g.t < 600;
  return `<div class="scard${fresh ? ' hot' : ''}${g.threat === 0 || g.threat === 7 ? ' rk' : ''}"><div class="top"><b>${TI[g.threat] || '🚨'} ${esc(lbl)}</b><span>${esc(ago(g.t))}</span></div>` +
    `<small class="tm">🕐 ${esc(both(g.t))}</small>` +
    (g.areas && g.areas.length ? `<div class="badges">${g.areas.slice(0, 6).map(a => `<i>${esc(a)}</i>`).join('')}</div>` : '') +
    `<p class="towns">${townsHTML(g.cities)}</p></div>`;
}
function sirens() {
  const all = allGroups();
  const recent = all.filter(g => now() - g.t < 600);
  const last = all[0];
  const rk = all.find(g => g.threat === 0 || g.threat === 7);
  const st = $('#sirenstat');
  const rl = relay === 'live' ? '<span class="relay on">● live relay connected</span>' : relay === 'down' ? '<span class="relay">○ reconnecting… history still updates</span>' : '<span class="relay">○ connecting…</span>';
  if (recent.length) {
    const n = recent.reduce((s, g) => s + g.cities.length, 0);
    st.className = 'card sirenstat red';
    st.innerHTML = `<h2>🚨 SIRENS RIGHT NOW</h2><p><b>${n} ${n === 1 ? 'town' : 'towns'}</b> in the last 10 minutes · ${esc(recent[0].areas.slice(0, 3).join(', ') || recent[0].cities.slice(0, 3).join(', '))}</p><p class="script">Lord, cover Your people 🙏</p>${rl}`;
  } else {
    st.className = 'card sirenstat calm';
    st.innerHTML = `<h2>🕊️ All quiet right now</h2><p>${last ? `Last alert ${esc(ago(last.t))}: ${esc(TN[last.threat] || 'Alert')} in ${esc(last.cities.slice(0, 2).join(', '))}` : 'No alerts in the recent history'}${rk && rk !== last ? `<br>Last rocket sirens ${esc(ago(rk.t))}` : ''}</p>${rl}`;
  }
  $('#sirennow').innerHTML = recent.map(gcard).join('');
  const d1 = all.filter(g => now() - g.t < 86400), d7 = all.filter(g => now() - g.t < 7 * 86400);
  const tw = l => l.reduce((s, g) => s + g.cities.length, 0);
  $('#sirenstats').innerHTML = `<div class="stat"><b>${d1.length}</b><small>alerts today</small></div><div class="stat"><b>${tw(d1)}</b><small>towns today</small></div><div class="stat"><b>${d7.length}</b><small>alerts this week</small></div>`;
  const old = all.filter(g => now() - g.t >= 600).slice(0, 40);
  $('#sirenlist').innerHTML = old.length ? old.map(gcard).join('') + '<div class="foot">Newest first · times in Central and Israel time 💗</div>' : (SH ? '<div class="empty">No other alerts in the history 🕊️</div>' : '<div class="empty">Loading alert history… 🚨</div>');
  // home
  const tile = $('#t-sirens');
  tile.classList.toggle('red', !!recent.length);
  tile.querySelector('small').textContent = recent.length ? 'SIRENS NOW' : last ? 'Quiet · last ' + ago(last.t) : 'Quiet';
  const fl = $('#sirenflash');
  fl.hidden = !recent.length;
  if (recent.length) fl.innerHTML = `<button data-open="sirens">🚨 SIRENS IN ISRAEL NOW · ${esc(recent[0].cities.slice(0, 3).join(', '))}${recent[0].cities.length > 3 ? ' +' + (recent[0].cities.length - 3) : ''} · tap</button>`;
}
function addLive(msg) {
  try {
    const g = JSON.parse(msg.message);
    if (!g || !g.towns) return false;
    const x = {t: g.t || msg.time, threat: g.threat, cities: g.towns, areas: g.areas || [], threats: [TN[g.threat] || 'Alert'], live: 1};
    if (LIVE.some(y => y.t === x.t && y.threat === x.threat && y.cities.join() === x.cities.join())) return false;
    LIVE.push(x); return true;
  } catch (e) { return false; }
}
async function loadLive() {
  try {
    const r = await fetch(`https://ntfy.sh/${FEED}/json?poll=1&since=12h`);
    (await r.text()).split('\n').filter(Boolean).forEach(l => { try { const m = JSON.parse(l); if (m.event === 'message') addLive(m); } catch (e) { /* skip */ } });
  } catch (e) { /* offline */ }
  sirens();
  if (!window.EventSource) return;
  const es = new EventSource(`https://ntfy.sh/${FEED}/sse`);
  es.onopen = () => { relay = 'live'; sirens(); };
  es.onerror = () => { relay = 'down'; sirens(); };
  es.onmessage = e => {
    try {
      const m = JSON.parse(e.data);
      if (m.event === 'message' && addLive(m)) {
        sirens();
        if (!(liveOn() && sub === 'sirens')) $('#livedot').classList.add('on');
      }
    } catch (x) { /* skip */ }
  };
}
async function loadSirens() { const d = await J('sirens.json'); if (d) SH = d; sirens(); }

// ---------------------------------------------------------------- Third Temple tracker
const TT = [['all', '✨ All'], ['heifer', '🐄 Red heifers'], ['mount', '⛰️ Temple Mount'], ['institute', '🕍 Temple Institute'], ['altar', '🔥 Altar & priests'], ['sanhedrin', '📜 Sanhedrin']];
const TTN = {heifer: '🐄 Red heifer', mount: '⛰️ Temple Mount', institute: '🕍 Temple', altar: '🔥 Altar & priests', sanhedrin: '📜 Sanhedrin'};
let TD = null, ttChip = 'all';
function temple() {
  const all = (TD && TD.stories) || [], c = (TD && TD.counts) || {};
  $('#ttchips').innerHTML = TT.map(([k, n]) => `<button data-tt="${k}" class="${ttChip === k ? 'on' : ''}">${n} <small>${k === 'all' ? all.length : (c[k] || 0)}</small></button>`).join('');
  $('#ttsub').textContent = TD ? `Updated ${ago(TD.updated)} · ${all.length} stories from the last ${Math.round((TD.keep_hours || 240) / 24)} days · refreshes about every 10 min` : '';
  const list = ttChip === 'all' ? all : all.filter(s => (s.tags || []).includes(ttChip));
  $('#ttlist').innerHTML = !TD ? '<div class="empty">Loading the tracker… 🕍</div>' : list.length ? list.map(s =>
    `<a class="ncard" href="${esc(s.link)}" target="_blank" rel="noopener"><div class="top"><span class="src">${esc(s.src)}</span><span class="ago">${esc(ago(s.t))}</span></div>` +
    `<div class="badges">${(s.tags || []).map(t => `<i>${TTN[t] || esc(t)}</i>`).join('')}</div><h4>${esc(s.title)}</h4>${s.snip ? `<p>${esc(s.snip)}</p>` : ''}</a>`).join('') + '<div class="foot">Newest first · tap a story to read it all 💗</div>'
    : '<div class="empty">Nothing here right now 🌸 It fills in as stories come in.</div>';
  const t = $('#t-temple small');
  if (TD) t.textContent = all.length ? `${all.length} stories · newest ${ago(all[0].t)}: ${all[0].title.slice(0, 70)}${all[0].title.length > 70 ? '…' : ''}` : 'Watching the Mount';
}
async function loadTemple() { const d = await J('temple.json'); if (d) TD = d; temple(); }

// ---------------------------------------------------------------- markets
const usd = (n, d = 2) => '$' + n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
const MK = {
  gold: {e: '🥇', n: 'Gold', f: p => usd(p), u: 'per ounce', what: 'The price of one ounce of gold in US dollars. Gold is the “safe place” people run to when they get scared: wars, banks wobbling, or money losing its value.',
    up: 'Gold going up usually means people are nervous and moving their money somewhere safe. A big jump often comes with war news, bank trouble or a weaker dollar.', down: 'Gold going down usually means people feel calmer and are taking money back out of “safety” and into stocks.'},
  silver: {e: '🥈', n: 'Silver', f: p => usd(p), u: 'per ounce', what: 'The price of one ounce of silver. It moves a lot like gold (a safe place in scary times), but it’s also used in electronics and solar panels, so it swings harder.',
    up: 'Silver rising usually follows gold: fear, or a weaker dollar. Because it’s smaller, it jumps further than gold does.', down: 'Silver dropping usually means calmer days, or less demand from factories.'},
  oil: {e: '🛢️', n: 'Oil', f: p => usd(p), u: 'a barrel', what: 'The price of a barrel of crude oil (about 42 gallons), what gasoline and diesel are made from. “See thou hurt not the oil” is right there in Revelation 6:6.',
    up: 'Oil going up means gas, shipping and groceries usually cost more a few weeks later. Big spikes often come from war in the Middle East, since a lot of the world’s oil ships past Iran through the Strait of Hormuz.', down: 'Oil going down usually means cheaper gas at the pump soon. Sometimes a big drop means people expect business to slow down.'},
  wheat: {e: '🌾', n: 'Wheat', f: p => usd(p / 100), u: 'a bushel', what: 'The price of a bushel of wheat (about 60 pounds), what bread, cereal and pasta are made from. “A measure of wheat for a penny” (Revelation 6:6) meant a whole day’s pay for bread.',
    up: 'Wheat going up means bread and baked goods can cost more down the road. Big spikes come from droughts, bad harvests or war in big farm countries like Ukraine and Russia.', down: 'Wheat going down usually means good harvests and plenty to go around.'},
  dollar: {e: '💵', n: 'US dollar', f: p => p.toFixed(2), u: 'index', what: 'The dollar index: how strong the US dollar is compared to other big money like the euro, yen and pound. It’s a score, not a price, so 100 is just a middle-ish number.',
    up: 'A stronger dollar means things made overseas can get cheaper for us. A sudden jump can mean the world is scared and running to the dollar for safety.', down: 'A weaker dollar means our money buys a little less, especially imported things and travel abroad. Gold usually goes up when the dollar goes down.'},
  sp500: {e: '📈', n: 'Stock market (S&P 500)', f: p => p.toLocaleString('en-US', {maximumFractionDigits: 0}), u: 'points', what: 'The 500 biggest US companies rolled into one number. It’s “the stock market” you hear about on the news, and what most retirement savings follow.',
    up: 'Stocks going up means people feel good about business and the future.', down: 'Stocks going down means people are worried. A drop of 2% or more in one day is a scary day on Wall Street, and if it falls 7% in a day, trading is paused to calm things down.'},
  bitcoin: {e: '₿', n: 'Bitcoin', f: p => usd(p, 0), u: 'per coin', what: 'A digital money that only lives online and isn’t run by any government or bank. It swings much more than the others, so only a 5%+ day counts as a big move.',
    up: 'Bitcoin going up means people are in a risk-taking, excited mood, or don’t trust regular money as much.', down: 'Bitcoin going down means people are pulling back from risky bets.'},
};
const ORDER = ['gold', 'silver', 'oil', 'wheat', 'dollar', 'sp500', 'bitcoin'];
let MD = null;
function spark(a, up) {
  if (!a || a.length < 2) return '';
  const lo = Math.min(...a), hi = Math.max(...a), w = 120, h = 36, r = hi - lo || 1;
  const pts = a.map((v, i) => `${(i / (a.length - 1) * w).toFixed(1)},${(h - 3 - (v - lo) / r * (h - 6)).toFixed(1)}`).join(' ');
  const col = up ? '#22a06b' : '#e0306f';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function mword(k, c) { const n = MK[k].n.replace(/ \(.*\)/, '').toLowerCase(); return `${k === 'sp500' ? 'stocks' : n} ${c >= 0 ? 'up' : 'down'} ${Math.abs(c).toFixed(1)}%`; }
function summary(m) {
  const g = m.gold, s = m.sp500, o = m.oil;
  const movers = ORDER.filter(k => m[k]).sort((a, b) => Math.abs(m[b].chg) / m[b].limit - Math.abs(m[a].chg) / m[a].limit);
  const bigs = movers.filter(k => m[k].big);
  let mood;
  if (s && g && s.chg <= -1 && g.chg >= 0.3) mood = 'Fear is in the air: money is leaving stocks and running to gold.';
  else if (s && g && s.chg >= 0.5 && g.chg <= 0) mood = 'People feel confident today: stocks up, gold down.';
  else if (o && o.chg >= 3) mood = 'Oil is jumping, so gas prices could creep up soon.';
  else if (s && s.chg <= -1.5) mood = 'A rough day for stocks: people are worried.';
  else mood = 'A pretty normal day, nothing wild.';
  const top = movers.slice(0, 2).map(k => mword(k, m[k].chg)).join(' and ');
  return (bigs.length ? `<p class="flagline">🚩 Big move: ${bigs.map(k => `<b>${esc(mword(k, m[k].chg))}</b>`).join(', ')}</p>` : '') +
    `<p class="sumline">${esc(mood)}</p><p class="muted small">Biggest moves today: ${esc(top)}.</p>`;
}
function markets() {
  const m = (MD && MD.m) || {};
  if (!MD) return;
  $('#mktsum').innerHTML = `<h2>💬 Today in plain words</h2>${summary(m)}<p class="muted small">Updated ${esc(ago(MD.updated))}</p>`;
  $('#mktlist').innerHTML = ORDER.filter(k => m[k]).map(k => {
    const x = m[k], c = MK[k], up = x.chg >= 0;
    return `<div class="mkt${x.big ? ' bigm' : ''}" id="mk-${k}"><div class="mh"><span class="me">${c.e}</span><div class="mn"><b>${esc(c.n)}</b><small>${x.open ? 'live' : 'market closed · last price'}</small></div>` +
      `<div class="mp"><b class="px">${esc(c.f(x.price))}</b><small>${esc(c.u)}</small></div></div>` +
      `<div class="mrow"><span class="chg ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(x.chg).toFixed(2)}% today</span>${x.big ? '<span class="flag">🚩 big move</span>' : ''}${spark(x.spark, x.month >= 0)}</div>` +
      `<small class="mmon">Past month: ${x.month >= 0 ? '+' : ''}${x.month.toFixed(1)}%</small>` +
      `<div class="why"><p><b>What it is:</b> ${esc(c.what)}</p><p><b>${up ? '▲ Up today' : '▼ Down today'}:</b> ${esc(up ? c.up : c.down)}</p><p class="muted small">🚩 A big move for ${esc(c.n.replace(/ \(.*\)/, '').toLowerCase())} is more than ${x.limit}% in one day.</p></div>` +
      `<button class="mini wide" data-why="${k}">What am I looking at? 💡</button></div>`;
  }).join('');
  const t = $('#t-mkt small');
  const pick = ['gold', 'oil', 'sp500'].filter(k => m[k]);
  t.innerHTML = pick.map(k => `${MK[k].e} <span class="${m[k].chg >= 0 ? 'up' : 'down'}">${m[k].chg >= 0 ? '▲' : '▼'}${Math.abs(m[k].chg).toFixed(1)}%</span>`).join(' ') + (ORDER.some(k => m[k] && m[k].big) ? ' 🚩' : '');
}
async function btc() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const d = (await r.json()).bitcoin;
    if (!d || !MD || !MD.m.bitcoin) return;
    MD.m.bitcoin = {...MD.m.bitcoin, price: d.usd, chg: +d.usd_24h_change.toFixed(2), big: Math.abs(d.usd_24h_change) >= 5 ? 1 : 0, open: 1};
    markets();
  } catch (e) { /* keep last */ }
}
async function loadMarkets() { const d = await J('markets.json'); if (d) { MD = d; markets(); btc(); } }

// ---------------------------------------------------------------- phone alerts (ntfy)
function topic() { return ($('#ntopic').value || '').trim(); }
(() => {
  const h = location.hash;
  const m = /ntfy=([\w-]{6,64})/.exec(h);
  if (m) { store.set('etcs_ntfy', m[1]); history.replaceState(null, '', location.pathname); }
  $('#ntopic').value = store.get('etcs_ntfy', '');
  $('#ntopic').addEventListener('input', () => store.set('etcs_ntfy', topic()));
  $('#ncopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(topic()); $('#ncopy').textContent = 'Copied 💗'; } catch (e) { $('#ntopic').select(); } setTimeout(() => { $('#ncopy').textContent = 'Copy'; }, 1800); });
  $('#ntest').addEventListener('click', async () => {
    const t = topic(), msg = $('#nmsg');
    if (!/^[\w-]{6,64}$/.test(t)) { msg.textContent = 'Type my topic name first (it’s in my texts) 🎀'; return; }
    msg.textContent = 'Sending…';
    try {
      const r = await fetch('https://ntfy.sh/', {method: 'POST', body: JSON.stringify({topic: t, title: '💗 Command Station test', message: 'It works! Sirens and big breaking news will show up right here 🎀🚨', tags: ['sparkling_heart'], priority: 4, click: location.origin + location.pathname})});
      msg.textContent = r.ok ? 'Sent! Check my phone 💗 If nothing shows up, make sure I subscribed to this exact name in the ntfy app and allowed notifications.' : 'Hmm, that didn’t go through. Try again in a minute 🌸';
    } catch (e) { msg.textContent = 'Hmm, that didn’t go through. Check my internet and try again 🌸'; }
  });
  if (m) setTimeout(() => $('.bell').click(), 50);
  if (/sirens/.test(h)) setTimeout(() => openLive('sirens'), 50);
})();

// ---------------------------------------------------------------- start
loadCams(); loadSirens(); loadLive(); loadTemple(); loadMarkets();
setInterval(() => { loadSirens(); loadTemple(); loadMarkets(); }, 3 * 60 * 1000);
setInterval(() => { loadCams(); }, 15 * 60 * 1000);
setInterval(() => { if (liveOn() && sub === 'markets') btc(); }, 60 * 1000);
setInterval(() => { sirens(); if (liveOn() && sub === 'cam') camNow(); }, 30 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { loadSirens(); loadMarkets(); } });
})();
