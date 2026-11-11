/* END TIMES COMMAND STATION */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const TZ = 'America/Chicago';
const LAT = 35.6145, LON = -88.8139;
const JERU = [31.778, 35.235];
const DATA = (() => {
  const h = location.hostname;
  if (h.endsWith('.github.io')) {
    const owner = h.split('.')[0], repo = location.pathname.split('/').filter(Boolean)[0];
    return `https://raw.githubusercontent.com/${owner}/${repo}/data/`;
  }
  return 'https://raw.githubusercontent.com/Rileyg410/end-times-command-station/data/';
})();
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full */ } },
};
const pad = n => String(n).padStart(2, '0');
const ymd = (d = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(d);
function ago(ts) {
  const s = Math.max(0, Date.now() / 1000 - ts);
  if (s < 90) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' hr ago';
  const d = Math.round(s / 86400); return d + (d === 1 ? ' day ago' : ' days ago');
}
function ct(ts) {
  const d = new Date(ts * 1000);
  const t = d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: TZ});
  return (ymd(d) === ymd() ? t : d.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ}) + ', ' + t) + ' CT';
}

window.ETCS = {$, $$, esc, ymd, ago, ct, store, pad, TZ, LAT, LON, DATA};
// ---------------------------------------------------------------- sparkles
(() => {
  const box = $('.sparkles'), em = ['💗', '✨', '🌸', '🎀', '💖', '🩷', '✨', '🌷'];
  for (let i = 0; i < 12; i++) { const p = document.createElement('i'); p.className = 'petal'; p.style.left = (Math.random() * 100) + '%'; p.style.animationDuration = (12 + Math.random() * 14) + 's'; p.style.animationDelay = (-Math.random() * 26) + 's'; box.appendChild(p); }
  for (let i = 0; i < 22; i++) { const t = document.createElement('s'); t.textContent = i % 3 ? '✦' : '✧'; t.style.left = (Math.random() * 100) + '%'; t.style.top = (Math.random() * 100) + '%'; t.style.fontSize = (8 + Math.random() * 12) + 'px'; t.style.animationDuration = (2 + Math.random() * 3) + 's'; t.style.animationDelay = (-Math.random() * 5) + 's'; box.appendChild(t); }
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('i');
    e.textContent = em[i % em.length];
    e.style.left = (Math.random() * 100) + '%';
    e.style.fontSize = (12 + Math.random() * 14) + 'px';
    e.style.animationDuration = (14 + Math.random() * 16) + 's';
    e.style.animationDelay = (-Math.random() * 30) + 's';
    box.appendChild(e);
  }
})();

// ---------------------------------------------------------------- tabs
function go(t) {
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === t));
  window.scrollTo({top: 0});
  if (t === 'news') { store.set('etcs_seen', Math.floor(Date.now() / 1000)); $('#newsdot').classList.remove('on'); }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go === 'quakes' ? 'sky' : b.dataset.go); });

// ---------------------------------------------------------------- clocks
function clocks() {
  const f = z => new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: z});
  $('#clocks').innerHTML = `<span>🏡 Jackson <b>${f(TZ)}</b></span><span>🇮🇱 Jerusalem <b>${f('Asia/Jerusalem')}</b></span>`;
}

// ---------------------------------------------------------------- daily verse (KJV)
const VERSES = [
  ['And when these things begin to come to pass, then look up, and lift up your heads; for your redemption draweth nigh.', 'Luke 21:28'],
  ['Now learn a parable of the fig tree; When his branch is yet tender, and putteth forth leaves, ye know that summer is nigh: So likewise ye, when ye shall see all these things, know that it is near, even at the doors.', 'Matthew 24:32–33'],
  ['For I, saith the LORD, will be unto her a wall of fire round about, and will be the glory in the midst of her.', 'Zechariah 2:5'],
  ['Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ;', 'Titus 2:13'],
  ['He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus.', 'Revelation 22:20'],
  ['Pray for the peace of Jerusalem: they shall prosper that love thee.', 'Psalm 122:6'],
  ['I have set watchmen upon thy walls, O Jerusalem, which shall never hold their peace day nor night: ye that make mention of the LORD, keep not silence,', 'Isaiah 62:6'],
  ['In my Father\'s house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.', 'John 14:2'],
  ['Behold, I shew you a mystery; We shall not all sleep, but we shall all be changed, In a moment, in the twinkling of an eye, at the last trump:', '1 Corinthians 15:51–52'],
  ['And what I say unto you I say unto all, Watch.', 'Mark 13:37'],
  ['Watch ye therefore, and pray always, that ye may be accounted worthy to escape all these things that shall come to pass, and to stand before the Son of man.', 'Luke 21:36'],
  ['The flowers appear on the earth; the time of the singing of birds is come, and the voice of the turtle is heard in our land;', 'Song of Solomon 2:12'],
  ['My beloved spake, and said unto me, Rise up, my love, my fair one, and come away.', 'Song of Solomon 2:10'],
  ['And it shall come to pass afterward, that I will pour out my spirit upon all flesh; and your sons and your daughters shall prophesy, your old men shall dream dreams, your young men shall see visions:', 'Joel 2:28'],
  ['For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry.', 'Habakkuk 2:3'],
  ['Because thou hast kept the word of my patience, I also will keep thee from the hour of temptation, which shall come upon all the world, to try them that dwell upon the earth.', 'Revelation 3:10'],
  ['Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets.', 'Amos 3:7'],
  ['Come, my people, enter thou into thy chambers, and shut thy doors about thee: hide thyself as it were for a little moment, until the indignation be overpast.', 'Isaiah 26:20'],
  ['And I will bless them that bless thee, and curse him that curseth thee: and in thee shall all families of the earth be blessed.', 'Genesis 12:3'],
  ['Behold, he that keepeth Israel shall neither slumber nor sleep.', 'Psalm 121:4'],
  ['And that, knowing the time, that now it is high time to awake out of sleep: for now is our salvation nearer than when we believed.', 'Romans 13:11'],
  ['For yet a little while, and he that shall come will come, and will not tarry.', 'Hebrews 10:37'],
  ['I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.', 'John 8:12'],
  ['For the Lord himself shall descend from heaven with a shout, with the voice of the archangel, and with the trump of God: and the dead in Christ shall rise first:', '1 Thessalonians 4:16'],
  ['Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air: and so shall we ever be with the Lord.', '1 Thessalonians 4:17'],
  ['Speak to Zerubbabel, governor of Judah, saying, I will shake the heavens and the earth;', 'Haggai 2:21'],
];
let vIdx = null, vTimer = null;
function showVerse() {
  const [t, r] = VERSES[vIdx % VERSES.length];
  const dots = VERSES.map((_, i) => i === vIdx % VERSES.length ? '♥' : '·').join('');
  $('#verse').innerHTML = `<div class="vl">✨ ${vIdx === vBase() ? "Today's verse" : 'Verse of the moment'} ✨</div><div class="vt">“${esc(t)}”</div><div class="vr">${esc(r)} 💗</div><div class="dots">tap for the next verse 🌸</div>`;
}
const vBase = () => Math.floor(new Date(ymd() + 'T12:00:00Z').getTime() / 86400000) % VERSES.length;
function verse() {
  vIdx = vBase(); showVerse();
  clearInterval(vTimer); vTimer = setInterval(() => { vIdx = (vIdx + 1) % VERSES.length; showVerse(); }, 15000);
}
document.addEventListener('click', e => { if (e.target.closest('#versebox')) { vIdx = (vIdx + 1) % VERSES.length; showVerse(); clearInterval(vTimer); vTimer = setInterval(() => { vIdx = (vIdx + 1) % VERSES.length; showVerse(); }, 15000); } });

// ---------------------------------------------------------------- watch dates
const WATCH = [
  {t: '🇮🇱 3 Days of Prayer for Israel', when: 'Fri–Sun, Nov 13–15', s: '2026-11-13T00:00:00-06:00', e: '2026-11-16T00:00:00-06:00',
    p: 'Hamas called for 3 days of “global rage.” I\'m answering with 3 days of prayer. “Pray for the peace of Jerusalem” — Psalm 122:6 🕊️', days: 3},
  {t: '✨ Watch date', when: 'Sunday, November 15, 2026', s: '2026-11-15T00:00:00-06:00', e: '2026-11-16T00:00:00-06:00', p: 'Eyes up, lamp full 🪔'},
  {t: '✨ Watch dates', when: 'Mon Nov 30 – Tue Dec 1, 2026', s: '2026-11-30T00:00:00-06:00', e: '2026-12-02T00:00:00-06:00', p: 'Two days on the wall 👀💗', days: 2},
  {t: '🕎 December 4 · 24 Kislev', when: 'Friday, December 4, 2026', s: '2026-12-04T00:00:00-06:00', e: '2026-12-05T00:00:00-06:00', id: 'kislev',
    p: '“Consider now from this day and upward, from the four and twentieth day of the ninth month… I will shake the heavens and the earth” — Haggai 2:18–22. Hanukkah begins at sundown 🕯️'},
];
let candleNote = '';
function cdBox(ms) {
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return `<div class="cd"><div><b>${d}</b><small>days</small></div><div><b>${pad(h)}</b><small>hrs</small></div><div><b>${pad(m)}</b><small>min</small></div><div><b>${pad(x)}</b><small>sec</small></div></div>`;
}
function watch() {
  const now = Date.now();
  const list = WATCH.map(w => ({...w, S: Date.parse(w.s), E: Date.parse(w.e)}));
  list.sort((a, b) => (a.E < now) - (b.E < now) || a.S - b.S);
  $('#watch').innerHTML = list.map(w => {
    const live = now >= w.S && now < w.E, past = now >= w.E;
    let body;
    if (live) {
      const dn = Math.floor((now - w.S) / 86400000) + 1;
      body = `<span class="nowtag">💗 It's here${w.days ? ` — day ${dn} of ${w.days}` : ' — today!'}</span>`;
    } else if (past) body = '<span class="when">✔ Watched 💗</span>';
    else body = cdBox(w.S - now);
    const extra = w.id === 'kislev' && candleNote ? `<p class="small muted">🕯️ ${esc(candleNote)}</p>` : '';
    return `<div class="wcard${live ? ' now' : ''}${past ? ' past' : ''}"><h4>${w.t}</h4><div class="when">${w.when}</div>${body}<p>${w.p}</p>${extra}</div>`;
  }).join('');
}

// ---------------------------------------------------------------- testimony days
const TESTI = [
  ['👶', 'Elliana was born', '2024-08-28', 'Aug 28, 2024 · my miracle'],
  ['🔥', 'My fire vision', '2025-09-18', 'Sept 18, 2025 · 25 Elul'],
  ['🕰️', 'The clock fell', '2026-04-13', 'April 13, 2026'],
  ['🤍', 'My white-light dream', '2026-04-28', 'April 28, 2026'],
  ['🤍', "Riley's white-light dream", '2026-04-30', 'April 30, 2026'],
];
function testi() {
  const today = Date.parse(ymd() + 'T00:00:00Z');
  $('#testi').innerHTML = TESTI.map(([e, n, d, w]) => {
    const days = Math.round((today - Date.parse(d + 'T00:00:00Z')) / 86400000);
    return `<div class="tcard"><div class="e">${e}</div><b>${days}</b><small>days since</small><div class="tl">${esc(n)}</div><small>${esc(w)}</small></div>`;
  }).join('');
}

// ---------------------------------------------------------------- Hebrew date + feasts (Hebcal)
async function hebrew() {
  try {
    const today = ymd();
    let after = false;
    try {
      const z = await (await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${LAT}&longitude=${LON}&tzid=${TZ}&date=${today}`)).json();
      if (z.times && z.times.sunset) after = Date.now() > Date.parse(z.times.sunset);
    } catch (e) { /* use daytime date */ }
    const h = await (await fetch(`https://www.hebcal.com/converter?cfg=json&date=${today}&g2h=1&strict=1${after ? '&gs=on' : ''}`)).json();
    const ev = (h.events || []).filter(x => !/^Parashat/.test(x)).join(' · ');
    $('#hebday').innerHTML = `✡ ${after ? 'Tonight' : 'Today'} is <b>${esc(h.hd)} ${esc(h.hm)} ${esc(h.hy)}</b><span class="he">${esc(h.hebrew)}</span>${ev ? `<span class="small">${esc(ev)}</span>` : ''}`;
  } catch (e) { $('#hebday').textContent = '✡ Hebrew date will show when I\'m back online'; }
}
const FEASTS = [
  [/^Chanukah: 1 Candle/, '🕎 Hanukkah · Feast of Dedication', 'Jesus walked in the temple at this feast (John 10:22–23). The Light of the world at the festival of lights.', true],
  [/^Purim$/, '👑 Purim', 'Esther, “for such a time as this” (Esther 4:14). God turning the enemy\'s plot upside down for His people.'],
  [/^Pesach I$/, '🐑 Passover', '“Christ our passover is sacrificed for us” (1 Corinthians 5:7). The Lamb whose blood covers.'],
  [/^Shavuot I$/, '🔥 Shavuot · Pentecost', 'The Spirit poured out (Acts 2). The harvest feast, wheat and firstfruits.'],
  [/^Rosh Hashana \d/, '🎺 Feast of Trumpets', '“At the last trump… we shall be changed” (1 Corinthians 15:52). The day of the shout and the shofar.'],
  [/^Yom Kippur$/, '🤍 Yom Kippur · Day of Atonement', 'Our High Priest entered once for all (Hebrews 9:12). The day Israel looks on Him.'],
  [/^Sukkot I$/, '⛺ Sukkot · Tabernacles', '“The tabernacle of God is with men” (Revelation 21:3). God dwelling with us.'],
];
async function feast() {
  try {
    const start = ymd(), end = ymd(new Date(Date.now() + 400 * 86400000));
    const r = await (await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=off&nx=off&ss=off&mf=off&c=on&geo=pos&latitude=${LAT}&longitude=${LON}&tzid=${TZ}&start=${start}&end=${end}`)).json();
    const items = r.items || [];
    const ch = items.find(i => /^Chanukah: 1 Candle/.test(i.title));
    if (ch && /T/.test(ch.date)) {
      const d = new Date(ch.date);
      candleNote = `First candle at sundown, ${d.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ})} at ${d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: TZ})} in Jackson`;
      watch();
    }
    let hit = null;
    for (const i of items) {
      const f = FEASTS.find(x => x[0].test(i.title));
      if (f) { hit = {i, f}; break; }
    }
    if (!hit) throw new Error('none');
    const day = hit.i.date.slice(0, 10);
    const tgt = /T/.test(hit.i.date) ? Date.parse(hit.i.date) : Date.parse(day + 'T00:00:00-06:00');
    const days = Math.ceil((Date.parse(day + 'T00:00:00Z') - Date.parse(ymd() + 'T00:00:00Z')) / 86400000);
    const nice = new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
    const startsNote = hit.f[3] ? 'First candle at sundown that evening' : 'Begins at sundown the evening before';
    $('#feast').innerHTML = `<h2>🕎 Next biblical feast</h2><h3>${hit.f[1]}</h3><div class="when muted">${esc(nice)} · ${esc(hit.i.hdate || '')}</div>` +
      `<div><span class="big">${days <= 0 ? 'Today! 💗' : days}</span> ${days > 0 ? (days === 1 ? 'day to go' : 'days to go') : ''}</div>` +
      `<p class="small muted">${startsNote}.</p><p>${esc(hit.f[2])}</p>`;
    void tgt;
  } catch (e) { $('#feast').innerHTML = '<h2>🕎 Next biblical feast</h2><p class="muted">God\'s calendar will load when I\'m back online 💗</p>'; }
}

// ---------------------------------------------------------------- news
const ME_TAG = {iran: 'IRAN', israel: 'ISRAEL', lebanon: 'LEBANON', syria: 'SYRIA', yemen: 'YEMEN', gulf: 'GULF'};
const W_TAG = {war: '⚔️ WAR', nuclear: '☢️ NUCLEAR', disaster: '🌋 DISASTER', cyber: '💡 CYBER / GRID', money: '💸 MONEY', temple: '🕍 TEMPLE MOUNT', plague: '🦠 PLAGUE'};
const EZ_TAG = {russia: '🇷🇺 RUSSIA', iran: '🇮🇷 IRAN', turkey: '🇹🇷 TURKEY', allies: '🤝 ALLIES', north: '⛰️ ISRAEL’S NORTH'};
const SG_TAG = {fig: '🌿 FIG TREES', bloom: '🌸 BLOOMS', sky: '☁️ SKIES', water: '🌊 WATERSPOUTS', earth: '🌍 EARTH', animals: '🐟 CREATURES', temple: '🕍 TEMPLE'};
const meBig = s => (s.mil || []).includes('STRIKE') && (s.tags || []).some(t => t === 'israel' || t === 'iran');
const milArr = s => Array.isArray(s.mil) ? s.mil : (s.mil ? [s.mil] : []);
const DESKS = {
  mideast: {file: 'mideast.json', key: 'tags', map: ME_TAG, banner: 'b-jerusalem', title: 'Israel & Mideast', sub: 'Live from the newsrooms · Psalm 122:6',
    intro: 'The newest Israel, Iran and Middle East news. ⚔ marks military moves.',
    chips: [['all', 'All'], ['israel', 'Israel'], ['iran', 'Iran'], ['lebanon', 'Lebanon / Hezbollah'], ['syria', 'Syria'], ['yemen', 'Yemen / Houthis'], ['gulf', 'Gulf']],
    hot: s => milArr(s).length, hotLabel: '⚔ Military only', hotKey: 'mil', badge: s => milArr(s).length ? `<i class="alarm">${meBig(s) ? '🚨' : '⚔'} ${esc(milArr(s).join(' · '))}</i>` : ''},
  world: {file: 'world.json', key: 'cats', map: W_TAG, banner: 'b-milky', title: 'World watch', sub: 'Wars, quakes, money & more · Matthew 24',
    intro: 'Wars and rumors of wars, nuclear, quakes, disasters, cyberattacks, money and the Temple Mount.',
    chips: [['all', 'All'], ['war', '⚔️ Wars'], ['nuclear', '☢️ Nuclear'], ['disaster', '🌋 Quakes & disasters'], ['cyber', '💡 Cyber & blackouts'], ['money', '💸 Money'], ['temple', '🕍 Temple Mount'], ['plague', '🦠 Plagues']],
    hot: s => s.big, hotLabel: '🚨 Big only', hotKey: 'big', badge: s => s.big ? '<i class="alarm">🚨 BIG</i>' : ''},
  ezekiel: {file: 'ezekiel.json', key: 'tags', map: EZ_TAG, banner: 'b-hermon', title: 'Ezekiel 38 watch', sub: 'Russia · Iran · Turkey & allies · Israel’s north',
    intro: '“Thou shalt come from thy place out of the north parts… against my people of Israel” (Ezekiel 38:15–16). Military moves by Russia, Iran (Persia), Turkey and their allies around Syria, Lebanon and the Golan.',
    chips: [['all', 'All'], ['russia', '🇷🇺 Russia'], ['iran', '🇮🇷 Iran'], ['turkey', '🇹🇷 Turkey'], ['allies', '🤝 Allies'], ['north', '⛰️ Israel’s north']],
    hot: s => milArr(s).length, hotLabel: '⚔ Military only', hotKey: 'mil', badge: s => milArr(s).length ? `<i class="alarm">⚔ ${esc(milArr(s).join(' · '))}</i>` : ''},
  signs: {file: 'signs.json', key: 'cats', map: SG_TAG, banner: 'b-fig', title: 'Fig tree & signs', sub: '“Now learn a parable of the fig tree” · Matthew 24:32',
    intro: 'Out-of-season figs and blooms, strange skies and lights, waterspouts, booms and sinkholes, creatures, the red heifer.',
    chips: [['all', 'All'], ['fig', '🌿 Figs'], ['bloom', '🌸 Blooms'], ['sky', '☁️ Skies'], ['water', '🌊 Waterspouts'], ['earth', '🌍 Earth'], ['animals', '🐟 Creatures'], ['temple', '🕍 Temple']],
    hot: null, badge: () => ''},
};
const DD = {};
let desk = 'mideast', chip = 'all', hotOnly = false, openSeen = store.get('etcs_seen', 0);
let ME = null, WD = null;
function ncard(s, cfg) {
  const hot = cfg.hot ? cfg.hot(s) : false;
  const fresh = openSeen && (s.seen || s.t) > openSeen;
  let b = (fresh ? '<i class="newb">NEW ✨</i>' : '') + cfg.badge(s) + (s[cfg.key] || []).map(t => `<i>${cfg.map[t] || esc(t)}</i>`).join('');
  return `<a class="ncard${hot ? ' hot' : ''}" href="${esc(s.link)}" target="_blank" rel="noopener"><div class="top"><span class="src">${esc(s.src)}</span><span class="ago">${esc(ago(s.t))} · ${esc(ct(s.t))}</span></div>` +
    `<div class="badges">${b}</div><h4>${esc(s.title)}</h4>${s.snip ? `<p>${esc(s.snip)}</p>` : ''}</a>`;
}
function news() {
  const cfg = DESKS[desk], D = DD[desk];
  const all = (D && D.stories) || [], c = (D && D.counts) || {};
  if (!cfg.chips.some(x => x[0] === chip)) chip = 'all';
  const bn = $('#newsbanner'); bn.className = 'banner ' + cfg.banner; $('#nbt').textContent = cfg.title; $('#nbs').textContent = cfg.sub;
  $('#deskintro').textContent = cfg.intro;
  $('#chips').innerHTML = cfg.chips.map(([k, n]) => `<button data-chip="${k}" class="${chip === k ? 'on' : ''}">${esc(n)} <small>${k === 'all' ? all.length : (c[k] || 0)}</small></button>`).join('') +
    (cfg.hot ? `<button data-hot="1" class="bigchip${hotOnly ? ' on' : ''}">${cfg.hotLabel} <small>${c[cfg.hotKey] || all.filter(cfg.hot).length}</small></button>` : '');
  $('#newssub').textContent = D ? `Updated ${ago(D.updated)} · ${all.length} stories from the last ${Math.round((D.keep_hours || 48) / 24)} days · refreshes about every 10 min` : 'Linking to the newsroom…';
  if (!D) { $('#newslist').innerHTML = '<div class="empty">Loading the news… 💌</div>'; return; }
  let list = all;
  if (chip !== 'all') list = list.filter(s => (s[cfg.key] || []).includes(chip));
  if (hotOnly && cfg.hot) list = list.filter(cfg.hot);
  $('#newslist').innerHTML = list.length ? list.map(s => ncard(s, cfg)).join('') + '<div class="foot">Newest first · tap a story to read it all 💗</div>'
    : '<div class="empty">Nothing here right now 🌸 It fills in as stories come in.</div>';
}
document.addEventListener('click', e => {
  const d = e.target.closest('[data-desk]');
  if (d) { desk = d.dataset.desk; chip = 'all'; hotOnly = false; $$('[data-desk]').forEach(b => b.classList.toggle('on', b === d)); news(); return; }
  const c = e.target.closest('[data-chip]');
  if (c) { chip = c.dataset.chip; news(); return; }
  if (e.target.closest('[data-hot]')) { hotOnly = !hotOnly; news(); }
});
function bigcard() {
  const a = ((ME && ME.stories) || []).filter(meBig).map(s => ({...s, me: 1}));
  const b = ((WD && WD.stories) || []).filter(s => s.big);
  let list = a.concat(b).sort((x, y) => y.t - x.t).slice(0, 4);
  if (!list.length) list = ((ME && ME.stories) || []).filter(s => milArr(s).length).slice(0, 3);
  $('#biglist').innerHTML = list.length ? list.map(s => `<a href="${esc(s.link)}" target="_blank" rel="noopener"><b>${esc(s.title)}</b><small>${esc(s.src)} · ${esc(ago(s.t))}</small></a>`).join('')
    : (ME || WD ? '<p class="muted">All quiet on the wall right now 🕊️</p>' : '<p class="muted">Loading the latest…</p>');
  const seen = store.get('etcs_seen', 0);
  const newHot = a.concat(b).some(s => (s.seen || s.t) > seen);
  $('#newsdot').classList.toggle('on', !!seen && newHot && !$('#p-news').classList.contains('on'));
}
async function loadNews() {
  const get = async f => { try { const r = await fetch(DATA + f + '?t=' + Math.floor(Date.now() / 60000)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
  const keys = Object.keys(DESKS);
  const got = await Promise.all(keys.map(k => get(DESKS[k].file)));
  keys.forEach((k, i) => { if (got[i]) DD[k] = got[i]; });
  ME = DD.mideast || null; WD = DD.world || null;
  news(); bigcard();
}

// ---------------------------------------------------------------- earthquakes (USGS)
const RING = /japan|indonesia|philippines|papua|new zealand|tonga|fiji|vanuatu|solomon|chile|peru|ecuador|colombia|mexico|guatemala|el salvador|nicaragua|costa rica|panama|alaska|aleutian|california|oregon|washington|kuril|kamchatka|taiwan|mariana|guam|kermadec|samoa|new caledonia|bougainville|honshu|hokkaido|kyushu|okinawa|ryukyu|mindanao|luzon|sumatra|java|sulawesi|halmahera|banda|molucca|timor|bonin|izu|russia|british columbia|canada|bolivia|argentina|loyalty islands/i;
const QCH = [['all', 'All'], ['m6', '🚨 M6+'], ['israel', '🇮🇱 Near Israel'], ['ring', '🔥 Ring of Fire']];
let Q = null, qchip = 'all';
function km(a, b, c, d) {
  const r = x => x * Math.PI / 180, R = 6371;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function quakes() {
  if (!Q) return;
  const all = Q.features.map(f => {
    const [lon, lat, dep] = f.geometry.coordinates, p = f.properties;
    const dI = km(lat, lon, JERU[0], JERU[1]);
    return {m: p.mag, place: p.place || 'Somewhere on earth', t: Math.floor(p.time / 1000), url: p.url, dep, isr: dI < 1000, dI, ring: RING.test(p.place || ''), tsu: p.tsunami};
  }).sort((a, b) => b.t - a.t);
  const cnt = {all: all.length, m6: all.filter(q => q.m >= 6).length, israel: all.filter(q => q.isr).length, ring: all.filter(q => q.ring).length};
  $('#qchips').innerHTML = QCH.map(([k, n]) => `<button data-q="${k}" class="${qchip === k ? 'on' : ''}">${n} <small>${cnt[k]}</small></button>`).join('');
  const list = all.filter(q => qchip === 'all' || (qchip === 'm6' ? q.m >= 6 : qchip === 'israel' ? q.isr : q.ring));
  $('#qlist').innerHTML = list.length ? list.map(q => `<a class="qcard${q.m >= 6 ? ' m6' : ''}${q.isr ? ' isr' : ''}" href="${esc(q.url)}" target="_blank" rel="noopener"><div class="mag">${q.m.toFixed(1)}</div><div><h4>${esc(q.place)}</h4>` +
    `<small>${esc(ago(q.t))} · ${esc(ct(q.t))} · ${Math.round(q.dep)} km deep</small><div class="badges">${q.m >= 6 ? '<i class="alarm">🚨 M6+</i>' : ''}${q.isr ? `<i>🇮🇱 ${Math.round(q.dI)} km from Jerusalem</i>` : ''}${q.ring ? '<i>🔥 Ring of Fire</i>' : ''}${q.tsu ? '<i class="alarm">🌊 Tsunami flag</i>' : ''}</div></div></a>`).join('')
    : '<div class="empty">No quakes like that this week 🌸</div>';
  const day = all.filter(q => Date.now() / 1000 - q.t < 86400), big = all.filter(q => q.m >= 6)[0];
  const near = all.filter(q => q.isr)[0];
  $('#quakemini').innerHTML = `<h2>🌍 Earth today</h2><p><b>${day.length}</b> quakes of 4.5+ in the last 24 hours · <b>${cnt.m6}</b> of 6.0+ this week.</p>` +
    (big ? `<p class="small">🚨 Biggest recent: <b>M${big.m.toFixed(1)}</b> ${esc(big.place)} (${esc(ago(big.t))})</p>` : '') +
    (near ? `<p class="small">🇮🇱 Near Israel: <b>M${near.m.toFixed(1)}</b> ${esc(near.place)} (${esc(ago(near.t))})</p>` : '<p class="small">🇮🇱 Nothing 4.5+ near Israel this week.</p>') +
    '<button class="pillbtn" data-go="quakes">See every quake 🌍</button>';
}
document.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { qchip = b.dataset.q; quakes(); } });
async function loadQuakes() {
  try { Q = await (await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson')).json(); quakes(); }
  catch (e) { if (!Q) $('#qlist').innerHTML = '<div class="empty">Quakes will load when I\'m back online</div>'; }
}

// ---------------------------------------------------------------- my logs
const STYPE = {bloom: '🌸 Blooms & plants', fig: '🌿 Fig trees', sky: '☁️ Skies', water: '🌊 Water & waterspouts', earth: '🌍 Earth & quakes', dream: '🕊️ Dreams & visions', other: '✨ Something else'};
let signs = store.get('etcs_signs', null);
if (!signs) {
  signs = [
    {id: 's2', d: '2026-11-11', k: 'bloom', n: 'My pink impatiens are in full bloom, sunflower seeds are sprouting in a pot, and wheat grass is growing all across the backyard. In November!'},
    {id: 's1', d: '2026-11-09', k: 'fig', n: 'Fig trees in Israel putting out new leaves and new little figs in November (Ashley Hayes video, Nov 6). “When his branch is yet tender, and putteth forth leaves…”'},
  ];
  store.set('etcs_signs', signs);
}
function fmtD(d) { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'}); }
function renderSigns() {
  signs.sort((a, b) => b.d.localeCompare(a.d) || b.id.localeCompare(a.id));
  $('#signlist').innerHTML = signs.length ? signs.map(s => `<div class="lcard"><button class="x" data-dels="${esc(s.id)}" aria-label="Delete">×</button><div class="ld">${esc(fmtD(s.d))} · ${esc(STYPE[s.k] || '')}</div><p>${esc(s.n)}</p></div>`).join('')
    : '<div class="empty">No signs logged yet 🌸</div>';
}
$('#sdate').value = ymd();
$('#signform').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#snote').value.trim(); if (!n) return;
  signs.push({id: 's' + Date.now(), d: $('#sdate').value || ymd(), k: $('#stype').value, n});
  store.set('etcs_signs', signs); $('#snote').value = ''; $('#sdate').value = ymd(); renderSigns();
});
const PG = {israel: '🇮🇱 Israel', family: '💗 Family', request: '🙏 Requests'};
let prayers = store.get('etcs_prayers', null);
if (!prayers) {
  prayers = [
    {id: 'p1', g: 'israel', n: 'Peace of Jerusalem and protection over Israel'},
    {id: 'p2', g: 'israel', n: 'Eyes opened to Yeshua, the Messiah'},
    {id: 'p3', g: 'family', n: 'Riley'}, {id: 'p4', g: 'family', n: 'Elliana'},
    {id: 'p5', g: 'family', n: 'Tamm'}, {id: 'p6', g: 'family', n: 'Nanny'},
  ];
  store.set('etcs_prayers', prayers);
}
function renderPrayers() {
  const t = ymd();
  $('#praylist').innerHTML = Object.keys(PG).map(g => {
    const items = prayers.filter(p => p.g === g);
    if (!items.length) return '';
    return `<div class="pgroup">${PG[g]}</div>` + items.map(p => {
      const done = p.last === t;
      return `<div class="prow"><div class="pn">${esc(p.n)}${p.last && !done ? `<span class="pd">Last prayed ${esc(fmtD(p.last))}</span>` : ''}</div>` +
        `<button class="pray${done ? ' done' : ''}" data-pray="${esc(p.id)}">${done ? 'Prayed today 💗' : '🙏 Pray'}</button><button class="x" data-delp="${esc(p.id)}" aria-label="Remove">×</button></div>`;
    }).join('');
  }).join('') || '<div class="empty">My prayer list is empty 🌸</div>';
}
$('#prayform').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#pname').value.trim(); if (!n) return;
  prayers.push({id: 'p' + Date.now(), g: $('#pgroup').value, n});
  store.set('etcs_prayers', prayers); $('#pname').value = ''; renderPrayers();
});
document.addEventListener('click', e => {
  const l = e.target.closest('[data-log]');
  if (l) { $$('[data-log]').forEach(b => b.classList.toggle('on', b === l)); $('#log-signs').hidden = l.dataset.log !== 'signs'; $('#log-prayer').hidden = l.dataset.log !== 'prayer'; return; }
  const ds = e.target.closest('[data-dels]');
  if (ds && confirm('Delete this sign?')) { signs = signs.filter(s => s.id !== ds.dataset.dels); store.set('etcs_signs', signs); renderSigns(); return; }
  const pr = e.target.closest('[data-pray]');
  if (pr) { const p = prayers.find(x => x.id === pr.dataset.pray); if (p) { p.last = p.last === ymd() ? p.prev || null : (p.prev = p.last, ymd()); store.set('etcs_prayers', prayers); renderPrayers(); } return; }
  const dp = e.target.closest('[data-delp]');
  if (dp && confirm('Take this off my list?')) { prayers = prayers.filter(p => p.id !== dp.dataset.delp); store.set('etcs_prayers', prayers); renderPrayers(); }
});

// ---------------------------------------------------------------- start
let lastDay = ymd();
function tick() { clocks(); watch(); }
function daily() { verse(); testi(); hebrew(); feast(); }
verse(); testi(); tick(); renderSigns(); renderPrayers(); news(); bigcard();
hebrew(); feast(); loadNews(); loadQuakes();
setInterval(tick, 1000);
setInterval(() => { loadNews(); loadQuakes(); if (ymd() !== lastDay) { lastDay = ymd(); daily(); } }, 3 * 60 * 1000);
setInterval(() => { const z = $('#hebday'); if (z && /Today/.test(z.textContent) && new Date().getHours() >= 16) hebrew(); }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { loadNews(); loadQuakes(); if (ymd() !== lastDay) { lastDay = ymd(); daily(); } } });
})();
