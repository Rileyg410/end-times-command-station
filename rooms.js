/* Pearl & lace: rooms, the pearl menu, twinkle lights, Jewel of the day, Be still */
(() => {
const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
const body = document.body;

// ------------------------------------------------ twinkle light strands
(() => {
  const el = $('#strand'); if (!el) return;
  const W = 400, cols = ['#fff6e8', '#ffd9e6', '#f3d9a4', '#fff', '#ffc2d6'];
  const strands = [[0, 4, 200, 46, 400, 6, 17], [0, 14, 120, 40, 250, 12, 9], [170, 10, 300, 36, 400, 20, 9]];
  let svg = `<svg viewBox="0 0 ${W} 60" preserveAspectRatio="none"><defs><radialGradient id="bg"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  let k = 0;
  strands.forEach(([x0, y0, cx, cy, x1, y1, n], si) => {
    svg += `<path d="M${x0} ${y0} Q${cx} ${cy * 2 - (y0 + y1) / 2} ${x1} ${y1}" fill="none" stroke="rgba(190,150,90,.55)" stroke-width=".6"/>`;
    for (let i = 1; i < n; i++) {
      const t = i / n, qy = cy * 2 - (y0 + y1) / 2;
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * qy + t * t * y1;
      const c = cols[k % cols.length], d = ((k * 0.37) % 3.2).toFixed(2), dur = (2.2 + (k * 0.53) % 2.4).toFixed(2);
      svg += `<g class="bulb" style="animation-delay:-${d}s;animation-duration:${dur}s"><circle cx="${x.toFixed(1)}" cy="${(y + 2.4).toFixed(1)}" r="${si ? 6 : 7.5}" fill="${c}" opacity=".35"/><circle cx="${x.toFixed(1)}" cy="${(y + 2.4).toFixed(1)}" r="${si ? 1.7 : 2.1}" fill="${c}"/></g>`;
      k++;
    }
  });
  el.innerHTML = svg + '</svg>';
})();

// ------------------------------------------------ greeting
function greet() {
  const d = new Date(), h = d.getHours();
  $('#ghello').textContent = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', Zo 🌸';
  $('#gdate').textContent = d.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
}
greet(); setInterval(greet, 60000);

// ------------------------------------------------ rooms, crumbs, pearl
const ROOMS = {watch: 'Watch', word: 'Word', signs: 'Signs', me: 'Me'};
const HOME = {live: 'watch', mark: 'watch', peace: 'watch', news: 'watch', videos: 'watch', threads: 'word', prophecy: 'word', sky: 'signs', blackout: 'me', alerts: 'me', logs: 'me'};
let lastRoom = '';
Object.keys(HOME).forEach(p => {
  const pane = $('#p-' + p); if (!pane) return;
  const b = document.createElement('button'); b.className = 'crumb'; b.dataset.go = HOME[p]; b.textContent = '‹ ' + ROOMS[HOME[p]];
  pane.prepend(b);
});
function onGo(t) {
  body.dataset.pane = t;
  body.classList.toggle('athome', t === 'home');
  if (ROOMS[t]) lastRoom = t;
  if (t === 'home') lastRoom = '';
  const c = $('#p-' + t + ' > .crumb');
  if (c) { const r = lastRoom || HOME[t]; c.dataset.go = r; c.textContent = '‹ ' + ROOMS[r]; }
  $$('.parc [data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === (ROOMS[t] ? t : t === 'home' ? 'home' : lastRoom || HOME[t])));
  pearlnav.classList.remove('open');
}
const pearlnav = $('#pearlnav');
window.addEventListener('etcs-go', e => onGo(e.detail));
onGo(($('.pane.on') || {id: 'p-home'}).id.slice(2));
$('#pearl').addEventListener('click', e => { e.stopPropagation(); pearlnav.classList.toggle('open'); });

document.addEventListener('click', e => {
  if (!e.target.closest('#pearlnav') || e.target === pearlnav) pearlnav.classList.remove('open');
  const b = e.target.closest('[data-deskgo],[data-scrollto],[data-replay],[data-logto]');
  if (!b) return;
  setTimeout(() => {
    if (b.dataset.deskgo) { const d = $(`#p-news [data-desk="${b.dataset.deskgo}"]`); if (d) d.click(); }
    if (b.dataset.logto) { const d = $(`[data-log="${b.dataset.logto}"]`); if (d) d.click(); }
    if (b.dataset.replay) { $('#vision').classList.add('vrep'); $('#vreplay').scrollIntoView({behavior: 'smooth', block: 'center'}); }
    if (b.dataset.scrollto) { const t = document.getElementById(b.dataset.scrollto); if (t) t.scrollIntoView({behavior: 'smooth'}); }
  }, 140);
});
const vr = $('#vRep'); if (vr) vr.addEventListener('click', () => { $('#vision').classList.toggle('vrep'); vr.textContent = $('#vision').classList.contains('vrep') ? '✕ Close replay' : '▶ Replay'; });

// ------------------------------------------------ surprise 1: Jewel of the day
const GEMS = [
  ['Jasper', 'first', 'clear as crystal, with a soft shimmer', ['#fdfcff', '#e9f3f7', '#cfe3ee'], 'Her light was “like a jasper stone, clear as crystal” (Revelation 21:11), and He that sat on the throne was “to look upon like a jasper” (Revelation 4:3).'],
  ['Sapphire', 'second', 'deep heavenly blue', ['#9fb8ff', '#3e5fd6', '#1d2f8a'], ''],
  ['Chalcedony', 'third', 'milky sky blue', ['#eef4fb', '#c7d8ec', '#a7bcd6'], ''],
  ['Emerald', 'fourth', 'rich glowing green', ['#b9f3d0', '#2fbf71', '#0f7a45'], '“There was a rainbow round about the throne, in sight like unto an emerald” (Revelation 4:3).'],
  ['Sardonyx', 'fifth', 'bands of red and white', ['#ffe9e2', '#e0775c', '#a3402e'], ''],
  ['Sardius', 'sixth', 'deep red', ['#ff9a9a', '#d0283c', '#7d0f22'], 'The One on the throne was “like a jasper and a sardine stone” (Revelation 4:3).'],
  ['Chrysolite', 'seventh', 'golden green', ['#f3ffb8', '#c4d64a', '#7f9420'], ''],
  ['Beryl', 'eighth', 'soft sea green', ['#d8fff6', '#7fd9c8', '#2f9e8f'], ''],
  ['Topaz', 'ninth', 'warm golden yellow', ['#fff2b8', '#f2c14e', '#b8860b'], ''],
  ['Chrysoprasus', 'tenth', 'bright apple green', ['#e2ffd6', '#8be07a', '#3e9b3a'], ''],
  ['Jacinth', 'eleventh', 'glowing orange red', ['#ffe0c2', '#ff8a3d', '#c4461a'], ''],
  ['Amethyst', 'twelfth', 'royal purple', ['#f1dcff', '#a65fe0', '#5e2595'], ''],
];
const dayN = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
let gemSel = null;
function jewel() {
  const today = dayN() % 12, i = gemSel == null ? today : gemSel, g = GEMS[i];
  const grad = c => `radial-gradient(circle at 32% 28%,#fff 0,${c[0]} 18%,${c[1]} 55%,${c[2]} 100%)`;
  $('#jewel').innerHTML = `<p class="jk">${gemSel == null || gemSel === today ? 'Jewel of the day' : 'Foundation ' + (i + 1) + ' of 12'}</p>` +
    `<div class="jstone" style="background:${grad(g[3])};--jg:${g[3][1]}"></div>` +
    `<h2>${g[0]}</h2><p class="jsub">The ${g[1]} foundation of the New Jerusalem · ${g[2]}</p>` +
    (g[4] ? `<p class="jnote">${g[4]}</p>` : '') +
    `<div class="jrow">${GEMS.map((x, k) => `<button data-gem="${k}" class="${k === i ? 'on' : ''}${k === today ? ' td' : ''}" style="background:${grad(x[3])}" aria-label="${x[0]}"></button>`).join('')}</div>` +
    `<p class="script jv">“And the twelve gates were twelve pearls; every several gate was of one pearl: and the street of the city was pure gold, as it were transparent glass.”</p>` +
    `<p class="jref">Revelation 21:19–21 · a new stone every day, all twelve foundations <a href="#" data-bjump="65.21.19">Read it 📖</a></p>`;
}
$('#jewel').addEventListener('click', e => { const b = e.target.closest('[data-gem]'); if (b) { gemSel = +b.dataset.gem; jewel(); } });
jewel(); setInterval(() => { if (gemSel == null) jewel(); }, 30 * 60000);

// ------------------------------------------------ surprise 2: Be still (a one-minute breath prayer)
const st = $('#still');
st.innerHTML = `<h2>🤍 Be still</h2><p class="small muted">One quiet minute with Him. Breathe in with the pearl, breathe out as it settles.</p>` +
  `<div class="sring"><div class="spearl" id="spearl"></div></div><p class="sword" id="sword">“Be still, and know that I am God.”</p><p class="sref" id="sref">Psalm 46:10</p>` +
  `<button class="pillbtn" id="sgo">Begin · 1 minute 🤍</button>`;
let sT = [];
function stopStill(done) {
  sT.forEach(clearTimeout); sT = []; st.classList.remove('run', 'in', 'out');
  $('#sgo').textContent = 'Begin · 1 minute 🤍';
  $('#sword').textContent = done ? '“Peace I leave with you, my peace I give unto you … Let not your heart be troubled, neither let it be afraid.”' : '“Be still, and know that I am God.”';
  $('#sref').textContent = done ? 'John 14:27 💗' : 'Psalm 46:10';
}
$('#sgo').addEventListener('click', () => {
  if (st.classList.contains('run')) return stopStill(false);
  st.classList.add('run'); $('#sgo').textContent = 'Stop';
  $('#sref').textContent = 'Psalm 46:10';
  for (let i = 0; i < 6; i++) {
    sT.push(setTimeout(() => { st.classList.remove('out'); st.classList.add('in'); $('#sword').textContent = 'Be still…'; }, i * 10000));
    sT.push(setTimeout(() => { st.classList.remove('in'); st.classList.add('out'); $('#sword').textContent = '…and know that I am God.'; }, i * 10000 + 4000));
  }
  sT.push(setTimeout(() => stopStill(true), 60000));
});
})();
