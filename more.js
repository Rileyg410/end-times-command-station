/* END TIMES COMMAND STATION · extra rooms */
(() => {
'use strict';
const {$, $$, esc, ymd, ago, ct, store, TZ, LAT, LON, DATA} = window.ETCS;
const DAY = 86400000;
const dnum = d => Math.round(Date.parse(d + 'T00:00:00Z') / DAY);
const today = () => dnum(ymd());
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const nice = (d, o = {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'}) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {...o, timeZone: 'UTC'});
const J = async u => { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return r.json(); };
const hebCache = store.get('etcs_hd', {});
async function hd(d) {
  if (hebCache[d]) return hebCache[d];
  try {
    const h = await J(`https://www.hebcal.com/converter?cfg=json&date=${d}&g2h=1&strict=1`);
    const v = {t: `${h.hd} ${h.hm} ${h.hy}`, he: h.hebrew, ev: (h.events || []).filter(x => !/^Parashat/.test(x))};
    hebCache[d] = v; store.set('etcs_hd', hebCache); return v;
  } catch (e) { return null; }
}
const plural = (n, w) => `${n.toLocaleString()} ${w}${Math.abs(n) === 1 ? '' : 's'}`;

// ================================================================ Walk with Jesus
const GOSPELS = [['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21]];
const CH = GOSPELS.flatMap(([b, n]) => Array.from({length: n}, (_, i) => `${b} ${i + 1}`));
const WQ = ['What did Jesus do in this chapter that made you love Him more?', 'Who in this chapter was watching and ready, and who was not?', 'What does this chapter show about the kingdom coming?',
  'Which verse would you want to tell Elliana about?', 'Where do you see Jesus as the Light in this chapter?', 'What promise here can you hold onto today?', 'Who came to Jesus here, and how did He answer them?'];
function walk() {
  let i = store.get('etcs_walk', 2);
  i = Math.max(0, Math.min(CH.length - 1, i));
  const ch = CH[i], pct = Math.round(i / CH.length * 100);
  const url = 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ch) + '&version=KJV';
  const doneToday = store.get('etcs_walk_day', '') === ymd();
  $('#walk').innerHTML = `<h2>👣 Walk with Jesus</h2><div class="muted small">Day ${i + 1} of ${CH.length} · one Gospel chapter a day</div>` +
    `<div class="ch shim">${esc(ch)}</div><div class="prog"><i style="width:${Math.max(3, pct)}%"></i></div><div class="small muted">${pct}% through the four Gospels 🌸</div>` +
    `<p class="q">💭 ${esc(WQ[i % WQ.length])}</p>` +
    `<div class="btnrow"><a class="pillbtn" href="${url}" target="_blank" rel="noopener">📖 Read ${esc(ch)}</a><button class="pillbtn ghost" data-walk="1">${doneToday ? 'Read today 💗' : '✔ I read it'}</button></div>` +
    (i > 0 ? `<p class="small center"><a href="#" data-walk="-1" style="color:#d6336c">← back to ${esc(CH[i - 1])}</a></p>` : '');
}
document.addEventListener('click', e => {
  const w = e.target.closest('[data-walk]'); if (!w) return;
  e.preventDefault();
  let i = store.get('etcs_walk', 2) + (+w.dataset.walk);
  store.set('etcs_walk', Math.max(0, Math.min(CH.length - 1, i)));
  if (+w.dataset.walk > 0) store.set('etcs_walk_day', ymd());
  walk();
});

// ================================================================ Hebrew word of the day
const WORDS = [
  ['אוֹר', 'Or', 'light', '“And God said, Let there be light: and there was light” (Genesis 1:3).', 'Add up its letters (א 1 + ו 6 + ר 200) and you get 207. The word רָז raz, “secret,” is also 207, and Daniel 2:22 says God “revealeth the deep and secret things… and the light dwelleth with him.”'],
  ['צֹפֶה', 'Tsofeh', 'watchman', '“So thou, O son of man, I have set thee a watchman unto the house of Israel” (Ezekiel 33:7).', 'The root means to lean forward and peer into the distance. A mitzpeh, a watchtower, comes from the same root, like the town of Mizpah.'],
  ['שׁוֹמֵר', 'Shomer', 'keeper, guard', '“Behold, he that keepeth Israel shall neither slumber nor sleep” (Psalm 121:4). That is Shomer Yisrael.', 'Shomer is the word for the one who keeps watch through the night, the same root as Shabbat being “kept” (shamor).'],
  ['תְּאֵנָה', 'Te’enah', 'fig tree', '“Now learn a parable of the fig tree… know that it is near, even at the doors” (Matthew 24:32–33).', 'A fig is really a flower turned inside out: hundreds of tiny blossoms bloom hidden inside the fruit. Jesus saw Nathanael “under the fig tree” before Philip called him (John 1:48).'],
  ['חוֹמָה', 'Chomah', 'wall', '“For I, saith the LORD, will be unto her a wall of fire round about” (Zechariah 2:5), chomat esh.', 'Nehemiah’s wall around Jerusalem was finished on the 25th of Elul (Nehemiah 6:15), the same Hebrew date as my fire vision.'],
  ['אֵשׁ', 'Esh', 'fire', '“For the LORD thy God is a consuming fire” (Deuteronomy 4:24).', 'The rabbis noticed that אִישׁ (man) and אִשָּׁה (woman) both hold esh. Add the yod and the hey, the letters of God’s name Yah, and you get a husband and wife. Take God out and only fire is left.'],
  ['מוֹעֵד', 'Moed', 'appointed time', '“These are the feasts of the LORD… which ye shall proclaim in their seasons” (Leviticus 23:4).', 'In Genesis 1:14 God made the sun and moon “for signs, and for seasons”: that word “seasons” is moadim, His appointed feasts. The sky is His calendar.'],
  ['מִקְרָא', 'Mikra', 'holy convocation, rehearsal', '“In the first day ye shall have an holy convocation” (Leviticus 23:7).', 'The same word means a public reading (Nehemiah 8:8). The feasts are dress rehearsals, read out loud every year until the real thing.'],
  ['שׁוֹפָר', 'Shofar', 'ram’s horn', '“For the Lord himself shall descend from heaven with a shout… and with the trump of God” (1 Thessalonians 4:16).', 'The Talmud says a shofar can’t be made from a cow’s horn, so it won’t remind God of the golden calf (Rosh Hashanah 26a). A ram’s horn points back to the ram caught in the thicket for Isaac.'],
  ['כַּלָּה', 'Kallah', 'bride', '“And as the bridegroom rejoiceth over the bride, so shall thy God rejoice over thee” (Isaiah 62:5).', 'Kallah sounds like kalah, “to complete, to finish.” The bride is where the story is made complete.'],
  ['חֻפָּה', 'Chuppah', 'wedding canopy, chamber', '“Let the bridegroom go forth of his chamber, and the bride out of her closet” (Joel 2:16). “Closet” there is chuppah.', 'In Isaiah 4:5 God promises a “defence” over the glory on Mount Zion, and that word is chuppah too: a canopy of cloud by day and fire by night.'],
  ['יְשׁוּעָה', 'Yeshuah', 'salvation', '“Therefore with joy shall ye draw water out of the wells of salvation” (Isaiah 12:3).', 'Jesus’ Hebrew name, Yeshua, comes from this word. Every time the Old Testament says “salvation,” His name is sitting right there.'],
  ['שָׁלוֹם', 'Shalom', 'peace, wholeness', '“Pray for the peace of Jerusalem” (Psalm 122:6), sha’alu shalom Yerushalayim.', 'Shalom comes from shalem, “whole, complete.” You can hear it at the end of Yerushalayim, and Salem was Jerusalem’s old name, the city of Melchizedek (Genesis 14:18).'],
  ['חֶסֶד', 'Chesed', 'steadfast love, lovingkindness', '“It is of the LORD’s mercies that we are not consumed” (Lamentations 3:22).', 'The stork is called chasidah in Hebrew, “the kind one,” because the Talmud says it shows kindness to its own (Chullin 63a). Storks still fly over Israel by the hundreds of thousands every fall.'],
  ['רוּחַ', 'Ruach', 'wind, breath, Spirit', '“The wind bloweth where it listeth… so is every one that is born of the Spirit” (John 3:8).', 'One word for wind, breath and Spirit. In Ezekiel 37 the dry bones live when the ruach comes from the four winds.'],
  ['הִנֵּנִי', 'Hineni', 'here I am', '“Then said I, Here am I; send me” (Isaiah 6:8).', 'Abraham, Moses, Samuel and Isaiah all answered God with hineni. It isn’t “I’m here,” it’s “I’m all yours, ready.”'],
  ['מָרָנָא תָא', 'Maranatha', 'Our Lord, come!', '“If any man love not the Lord Jesus Christ, let him be Anathema Maranatha” (1 Corinthians 16:22).', 'It’s Aramaic, the everyday language Jesus spoke. Paul left it untranslated in a Greek letter, so the first believers must have said it so often everyone knew it.'],
  ['אֱמוּנָה', 'Emunah', 'faithfulness, faith', '“The just shall live by his faith” (Habakkuk 2:4).', 'Emunah and Amen come from the same root: firm, solid, something you can lean your whole weight on.'],
  ['כָּבוֹד', 'Kavod', 'glory', '“The whole earth is full of his glory” (Isaiah 6:3).', 'Kavod literally means heavy, weighty. God’s glory isn’t a soft glow: it’s so heavy the priests couldn’t stand up in the temple (1 Kings 8:11).'],
  ['אַהֲבָה', 'Ahavah', 'love', '“Many waters cannot quench love” (Song of Solomon 8:7).', 'Ahavah adds up to 13, and echad (one) is also 13. Together they make 26, the number of God’s name YHWH.'],
  ['נֵר', 'Ner', 'lamp', '“Thy word is a lamp unto my feet, and a light unto my path” (Psalm 119:105).', 'The wise virgins kept their lamps full (Matthew 25). Hanukkah candles are called nerot, and Proverbs 20:27 says “the spirit of man is the candle (ner) of the LORD.”'],
];
function hword() {
  const [h, t, m, v, n] = WORDS[today() % WORDS.length];
  $('#hword').innerHTML = `<div class="bow"></div><div class="hb">${h}</div><div class="tr">${esc(t)}</div><div class="mn">“${esc(m)}”</div><p>${esc(v)}</p><div class="nug">💎 <b>Nugget:</b> ${esc(n)}</div>`;
}

// ================================================================ prophecy timelines
const START = '2025-09-18';
const DAN = [
  [START, '🔥 My fire vision', 'Day 0 · 25 Elul'],
  [addDays(START, 1260), '📜 1,260 days', 'Time, times and half a time (Daniel 12:7, Revelation 12:6)'],
  [addDays(START, 1290), '📜 1,290 days', '“From the time that the daily sacrifice shall be taken away… a thousand two hundred and ninety days” (Daniel 12:11)'],
  [addDays(START, 1335), '📜 1,335 days', '“Blessed is he that waiteth, and cometh to the thousand three hundred and five and thirty days” (Daniel 12:12)'],
];
const WDATES = [
  ['2026-11-13', '2026-11-15', '🇮🇱 3 days of prayer for Israel', 'Psalm 122:6'],
  ['2026-11-15', '2026-11-15', '✨ Watch date', 'Eyes up, lamp full'],
  ['2026-11-30', '2026-12-01', '✨ Watch dates', 'Two days on the wall'],
  ['2026-12-04', '2026-12-04', '🕎 December 4 · 24 Kislev', 'Haggai 2:18–22 · Hanukkah begins at sundown'],
];
async function timelines() {
  const t = today();
  const prog = Math.max(0, Math.min(100, (t - dnum(START)) / 1335 * 100));
  const rows = await Promise.all(DAN.map(async ([d, h, p]) => ({d, h, p, hd: await hd(d)})));
  $('#dantl').innerHTML = `<h2>📜 Daniel’s days from my vision</h2><p class="small muted">Counting 1,260 · 1,290 · 1,335 days from September 18, 2025, with the Hebrew date each one lands on.</p>` +
    `<div class="prog"><i style="width:${prog.toFixed(1)}%"></i></div><div class="small muted">Day ${(t - dnum(START)).toLocaleString()} of 1,335 · ${prog.toFixed(1)}% of the way 💗</div><div class="tl">` +
    rows.map(r => {
      const n = dnum(r.d) - t, cls = n < 0 ? 'past' : '';
      return `<div class="tli ${cls}"><div class="td">${esc(nice(r.d))}${r.hd ? ' · ' + esc(r.hd.t) : ''}</div><h4>${esc(r.h)}</h4><p>${esc(r.p)}</p>` +
        (r.hd && r.hd.ev.length ? `<p class="small"><b>🕎 ${esc(r.hd.ev.join(' · '))}</b></p>` : '') +
        `<span class="cnt">${n < 0 ? plural(-n, 'day') + ' ago' : n === 0 ? 'Today!' : plural(n, 'day') + ' to go'}</span></div>`;
    }).join('') + '</div>';
  $('#watchtl').innerHTML = '<div class="tl">' + WDATES.map(([s, e, h, p]) => {
    const a = dnum(s) - t, b = dnum(e) - t, here = a <= 0 && b >= 0;
    return `<div class="tli ${b < 0 ? 'past' : here ? 'here' : ''}"><div class="td">${esc(nice(s))}${e !== s ? ' – ' + esc(nice(e, {month: 'short', day: 'numeric'})) : ''}</div><h4>${esc(h)}</h4><p>${esc(p)}</p>` +
      `<span class="cnt">${here ? '💗 Happening now' : b < 0 ? 'Watched ✔' : plural(a, 'day') + ' to go'}</span></div>`;
  }).join('') + `<div class="tli"><div class="td">${esc(nice(DAN[1][0]))}</div><h4>📜 Daniel’s 1,260 days</h4><span class="cnt">${plural(dnum(DAN[1][0]) - t, 'day')} to go</span></div></div>`;
}

// ================================================================ feast calendar
const FC = [
  [/^Chanukah: 1 Candle/, '🕎', 'Hanukkah · Feast of Dedication', 'Jesus walked in the temple at this feast (John 10:22–23). The Light of the world at the festival of lights.'],
  [/^Tu BiShvat/, '🌳', 'Tu BiShvat · New Year of the Trees', 'The almond tree wakes first in Israel. God told Jeremiah, “I will hasten my word” over an almond branch (Jeremiah 1:11–12). “He shall be like a tree planted by the rivers” (Psalm 1:3).'],
  [/^Purim$/, '👑', 'Purim', 'Esther, “for such a time as this” (Esther 4:14). God turning the enemy’s plot upside down for His people.'],
  [/^Erev Pesach/, '🐑', 'Passover · 14 Nisan', '“Christ our passover is sacrificed for us” (1 Corinthians 5:7). The Lamb whose blood covers, crucified on Passover.'],
  [/^Pesach I$/, '🍞', 'Unleavened Bread', 'The sinless Bread of life laid in the tomb (John 6:35). No leaven, no sin.'],
  [/^Pesach II$/, '🌾', 'Firstfruits', '“Now is Christ risen from the dead, and become the firstfruits of them that slept” (1 Corinthians 15:20).'],
  [/^Shavuot I$/, '🔥', 'Shavuot · Pentecost', 'The Spirit poured out with tongues of fire (Acts 2). The wheat harvest feast, two loaves waved before the LORD.'],
  [/^Tish'a B'Av$/, '🕯️', 'Tisha B’Av', 'The day both temples burned. Jesus wept over Jerusalem and foretold it (Luke 19:41–44).'],
  [/^Rosh Hashana \d/, '🎺', 'Rosh Hashanah · Feast of Trumpets', '“At the last trump… we shall be changed” (1 Corinthians 15:52). The day of the shout and the shofar.'],
  [/^Yom Kippur$/, '🤍', 'Yom Kippur · Day of Atonement', 'Our High Priest entered once for all (Hebrews 9:12). “They shall look upon me whom they have pierced” (Zechariah 12:10).'],
  [/^Sukkot I$/, '⛺', 'Sukkot · Tabernacles', '“The Word was made flesh, and dwelt (tabernacled) among us” (John 1:14). “The tabernacle of God is with men” (Revelation 21:3).'],
  [/^Shmini Atzeret$/, '💧', 'Shemini Atzeret · The Eighth Day', 'On the great day of the feast Jesus cried, “If any man thirst, let him come unto me” (John 7:37). A new beginning after the seven.'],
];
let FEASTS = [];
async function feastcal() {
  try {
    const s = ymd(), e = addDays(s, 380);
    const r = await J(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=off&nx=off&ss=off&mf=off&c=off&geo=none&start=${s}&end=${e}`);
    const seen = new Set();
    FEASTS = [];
    for (const it of r.items || []) {
      const f = FC.find(x => x[0].test(it.title));
      if (!f || seen.has(f[2])) continue;
      seen.add(f[2]); FEASTS.push({d: it.date.slice(0, 10), hd: it.hdate, f});
    }
    const t = today();
    $('#feastcal').innerHTML = FEASTS.map((x, i) => {
      const n = dnum(x.d) - t;
      return `<div class="feastrow${i === 0 ? ' next' : ''}"><div class="fe">${x.f[1]}</div><div><h4>${esc(x.f[2])}</h4><div class="fd">${esc(nice(x.d, {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}))} · ${esc(x.hd || '')}</div>` +
        `<div class="small muted">${n <= 0 ? '💗 Today!' : plural(n, 'day') + ' away'} · begins at sundown the evening before</div><p>${esc(x.f[3])}</p></div></div>`;
    }).join('') + '<p class="foot">Dates from Hebcal · every feast points to Jesus 💗</p>';
  } catch (e) { $('#feastcal').innerHTML = '<div class="empty">God’s calendar will load when I’m back online 💗</div>'; }
}

// ================================================================ testimony timeline
const TT = [
  ['2024-07-02', '💊 The iron pill bottle fell', 'Sometime between July 2 and August 28, 2024, while I was carrying Elliana.', '2024-08-28'],
  ['2024-08-28', '👶 Elliana was born', 'My sweet girl, August 28, 2024.'],
  [null, '🦁 The toy lion', '“Behold, the Lion of the tribe of Juda… hath prevailed” (Revelation 5:5).'],
  ['2025-09-18', '🔥 My fire vision', 'Earth covered in moving fire, the gauge nearly full, and fire around Israel like a wall.'],
  ['2026-04-13', '🕰️ The clock fell', 'I asked Jesus to make something else fall if it was Him, and the kitchen clock came down.'],
  ['2026-04-28', '🤍 My white-light dream', ''],
  ['2026-04-30', '🤍 Riley’s white-light dream', ''],
  ['2026-11-05', '🧸 The WATCH block', 'Elliana handed me toy blocks, and one said WATCH.'],
];
async function testitl() {
  const t = today();
  const rows = await Promise.all(TT.map(async r => ({r, hd: r[0] && !r[3] ? await hd(r[0]) : null})));
  let prev = null;
  $('#testitl').innerHTML = '<h2>🕊️ My testimony timeline</h2><p class="small muted">God weaving it all together, day by day.</p><div class="tl">' + rows.map(({r: [d, h, p, end], hd: H}) => {
    let when = '', cnt = '';
    if (d && end) { when = `${nice(d, {month: 'short', day: 'numeric'})} – ${nice(end)}`; cnt = `about ${plural(t - dnum(end), 'day')} ago`; }
    else if (d) {
      when = nice(d) + (H ? ' · ' + H.t : '');
      cnt = plural(t - dnum(d), 'day') + ' ago' + (prev ? ` · ${plural(dnum(d) - dnum(prev), 'day')} after the last` : '');
      prev = d;
    } else when = 'One of my signs';
    return `<div class="tli past"><div class="td">${esc(when)}</div><h4>${esc(h)}</h4>${p ? `<p>${esc(p)}</p>` : ''}${cnt ? `<span class="cnt">${esc(cnt)}</span>` : ''}</div>`;
  }).join('') + `<div class="tli here"><div class="td">${esc(nice(ymd()))}</div><h4>💗 Today, still watching</h4></div></div>`;
}

// ================================================================ sky & space
const SC = {0: 'none', 1: 'minor', 2: 'moderate', 3: 'strong', 4: 'severe', 5: 'extreme'};
async function space() {
  const N = 'https://services.swpc.noaa.gov/';
  const [sc, kp, fl] = await Promise.all([J(N + 'products/noaa-scales.json').catch(() => null), J(N + 'products/noaa-planetary-k-index.json').catch(() => null), J(N + 'json/goes/primary/xray-flares-7-day.json').catch(() => null)]);
  let html = '<h2>☀️ Space weather</h2>';
  let kv = null;
  if (kp && kp.length) {
    const last = kp[kp.length - 1];
    kv = Array.isArray(last) ? parseFloat(last[1]) : parseFloat(last.Kp != null ? last.Kp : last.kp_index);
  }
  if (sc && sc['0']) {
    const c = sc['0'], one = sc['1'] || {};
    const box = (L, k, lab) => { const v = +(c[k].Scale || 0); return `<div class="${v > 0 ? 'lvl' : ''}"><b>${L}${v}</b><small>${lab}<br>${esc(SC[v] || c[k].Text || '')}</small></div>`; };
    html += `<p class="small muted">NOAA’s storm scales right now (0 is calm, 5 is extreme)</p><div class="scales">${box('R', 'R', '📻 Radio blackouts')}${box('S', 'S', '☢️ Solar radiation')}${box('G', 'G', '🧲 Geomagnetic storm')}</div>`;
    if (one.R && (one.R.MinorProb || one.G)) html += `<p class="small">Tomorrow: ${one.R.MinorProb ? `${esc(one.R.MinorProb)}% chance of R1–R2 flares, ${esc(one.R.MajorProb || 0)}% for R3+` : ''}${one.G && one.G.Scale ? ` · G${esc(one.G.Scale)} storm expected` : ''}</p>`;
  }
  if (kv != null && !isNaN(kv)) {
    html += `<p style="margin:12px 0 0"><b>Kp index ${kv.toFixed(2)}</b> ${kv >= 5 ? '🚨 geomagnetic storm!' : kv >= 4 ? '✨ active' : '🕊️ quiet'}</p><div class="gauge"><i style="left:${Math.min(100, kv / 9 * 100)}%"></i></div><div class="gl"><span>0 calm</span><span>5 storm</span><span>9 extreme</span></div>` +
      `<p class="small muted">Around Kp 7 or higher, the northern lights can reach Tennessee 💗</p>`;
  }
  if (fl && fl.length) {
    const big = fl.filter(f => /^[MX]/.test(f.max_class || '')).sort((a, b) => Date.parse(b.max_time) - Date.parse(a.max_time));
    const top = [...fl].sort((a, b) => cls(b.max_class) - cls(a.max_class))[0];
    html += `<h3 style="font-family:'Playfair Display',serif;color:#7a1f45;margin:14px 0 4px">🔆 Solar flares this week</h3><p class="small">${fl.length} flares in 7 days · <b>${big.filter(f => /^M/.test(f.max_class)).length}</b> M-class · <b>${big.filter(f => /^X/.test(f.max_class)).length}</b> X-class · strongest <b>${esc(top.max_class)}</b> (${esc(ago(Date.parse(top.max_time) / 1000))})</p>` +
      (big.length ? '<div class="minilist">' + big.slice(0, 4).map(f => `<a href="https://www.swpc.noaa.gov/products/goes-x-ray-flux" target="_blank" rel="noopener"><b>${/^X/.test(f.max_class) ? '🚨' : '☀️'} ${esc(f.max_class)} flare</b><small>${esc(ct(Date.parse(f.max_time) / 1000))}</small></a>`).join('') + '</div>' : '');
  }
  html += `<img class="aurimg" alt="Northern lights forecast" loading="lazy" src="https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?t=${Math.floor(Date.now() / 600000)}"><p class="small muted center">🌌 Tonight’s northern lights forecast · NOAA</p>`;
  $('#space').innerHTML = html + `<p class="foot">Live from NOAA’s Space Weather Prediction Center</p>`;
  window.ETCS.kp = kv; moonmini();
}
const cls = c => { const m = /^([ABCMX])([\d.]+)/.exec(c || ''); return m ? 'ABCMX'.indexOf(m[1]) * 10 + parseFloat(m[2]) : 0; };

const PH = {'New Moon': '🌑', 'First Quarter': '🌓', 'Full Moon': '🌕', 'Last Quarter': '🌗'};
let MOON = null;
function moonCalc() {
  const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14) / DAY;
  const age = (((Date.now() / DAY - ref) % syn) + syn) % syn;
  const ill = Math.round((1 - Math.cos(2 * Math.PI * age / syn)) / 2 * 100);
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return {age, ill, wax: age < syn / 2, name: names[Math.floor((age / syn) * 8 + 0.5) % 8]};
}
function moonBall(m) {
  const f = m.ill / 100, dark = 'rgba(40,10,40,.82)';
  const g = m.wax ? `linear-gradient(90deg, ${dark} ${(1 - f) * 100}%, transparent ${(1 - f) * 100 + 6}%)` : `linear-gradient(270deg, ${dark} ${(1 - f) * 100}%, transparent ${(1 - f) * 100 + 6}%)`;
  return `<div class="moonball"><i style="background:${g}"></i></div>`;
}
async function moon() {
  const m = moonCalc();
  let phases = [];
  try {
    const r = await J(`https://aa.usno.navy.mil/api/moon/phases/date?date=${ymd()}&nump=8`);
    phases = (r.phasedata || []).map(p => ({p: p.phase, ts: Date.UTC(p.year, p.month - 1, p.day, +p.time.slice(0, 2), +p.time.slice(3, 5)) / 1000}));
  } catch (e) { /* calc only */ }
  MOON = {m, phases};
  const full = phases.find(p => p.p === 'Full Moon'), nw = phases.find(p => p.p === 'New Moon');
  $('#moon').innerHTML = `<h2>🌕 The moon</h2><div class="moonrow">${moonBall(m)}<div><b style="font-family:'Playfair Display',serif;font-size:20px;color:#d6336c">${esc(m.name)}</b><div>${m.ill}% lit · day ${Math.floor(m.age) + 1} of the moon’s month</div>` +
    (full ? `<div class="small">🌕 Next full moon: ${esc(ct(full.ts))}</div>` : '') + (nw ? `<div class="small">🌑 Next new moon: ${esc(ct(nw.ts))}</div>` : '') + '</div></div>' +
    (phases.length ? '<div class="phases">' + phases.slice(0, 8).map(p => `<div><b>${PH[p.p] || '🌙'}</b>${esc(new Date(p.ts * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: TZ}))}</div>`).join('') + '</div>' : '') +
    '<p class="small muted">“He appointed the moon for seasons” (Psalm 104:19). A new moon starts each Hebrew month 🌙</p><p class="foot">Phases from the U.S. Naval Observatory</p>';
  moonmini();
}
function moonmini() {
  if (!MOON) return;
  const {m, phases} = MOON, full = phases.find(p => p.p === 'Full Moon'), kv = window.ETCS.kp;
  const nextE = ECL.find(e => Date.parse(e[0]) > Date.now());
  $('#moonmini').innerHTML = `<h2>🌙 Tonight’s sky</h2><div class="moonrow">${moonBall(m)}<div><b>${esc(m.name)}</b> · ${m.ill}% lit` +
    (full ? `<div class="small">Full moon ${esc(new Date(full.ts * 1000).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ}))}</div>` : '') +
    (kv != null && !isNaN(kv) ? `<div class="small">☀️ Kp ${kv.toFixed(1)} · ${kv >= 5 ? '🚨 solar storm' : 'sun is calm'}</div>` : '') +
    (nextE ? `<div class="small">${nextE[2]} Next eclipse: ${esc(nextE[1])}, ${esc(new Date(nextE[0]).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ}))}</div>` : '') +
    '</div></div><button class="pillbtn" data-go="sky">Open sky watch ✨</button>';
}
// NASA GSFC eclipse tables (greatest eclipse, UTC)
const ECL = [
  ['2027-02-06T16:00:47Z', 'Annular solar eclipse', '💍'], ['2027-02-20T23:14:06Z', 'Penumbral lunar eclipse', '🌕'],
  ['2027-07-18T16:04:09Z', 'Penumbral lunar eclipse', '🌕'], ['2027-08-02T10:07:49Z', 'Total solar eclipse', '🌑'],
  ['2027-08-17T07:14:59Z', 'Penumbral lunar eclipse', '🌕'], ['2028-01-12T04:14:13Z', 'Partial lunar eclipse', '🌖'],
  ['2028-01-26T15:08:58Z', 'Annular solar eclipse', '💍'], ['2028-07-06T18:20:57Z', 'Partial lunar eclipse', '🌖'],
  ['2028-07-22T02:56:39Z', 'Total solar eclipse', '🌑'], ['2028-12-31T16:53:15Z', 'Total lunar eclipse · blood moon', '🩸', 1],
  ['2029-01-14T17:13:47Z', 'Partial solar eclipse', '🌘'], ['2029-06-12T04:06:13Z', 'Partial solar eclipse', '🌘'],
  ['2029-06-26T03:23:22Z', 'Total lunar eclipse · blood moon', '🩸', 1], ['2029-07-11T15:37:18Z', 'Partial solar eclipse', '🌘'],
  ['2029-12-05T15:03:57Z', 'Partial solar eclipse', '🌘'], ['2029-12-20T22:43:12Z', 'Total lunar eclipse · blood moon', '🩸', 1],
  ['2030-06-01T06:29:13Z', 'Annular solar eclipse', '💍'], ['2030-06-15T18:34:34Z', 'Partial lunar eclipse', '🌖'],
  ['2030-11-25T06:51:37Z', 'Total solar eclipse', '🌑'], ['2030-12-09T22:28:51Z', 'Penumbral lunar eclipse', '🌕'],
];
async function eclipses() {
  const up = ECL.filter(e => Date.parse(e[0]) > Date.now());
  const hds = await Promise.all(up.map(e => e[3] ? hd(new Date(e[0]).toLocaleDateString('en-CA', {timeZone: 'Asia/Jerusalem'})) : null));
  $('#eclipses').innerHTML = `<h2>🌘 Eclipses &amp; blood moons</h2><p class="small muted">“The sun shall be turned into darkness, and the moon into blood, before the great and terrible day of the LORD come” (Joel 2:31). Blood moons are total lunar eclipses 🩸</p>` +
    up.map((e, i) => { const ts = Date.parse(e[0]) / 1000, n = Math.ceil((ts * 1000 - Date.now()) / DAY);
      return `<div class="ecl${e[3] ? ' blood' : ''}"><div class="ee">${e[2]}</div><div><b>${esc(e[1])}</b><small>${esc(new Date(ts * 1000).toLocaleDateString('en-US', {weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ}))} · ${esc(plural(n, 'day'))} away${hds[i] ? ' · ' + esc(hds[i].t) + (hds[i].ev.length ? ' · ' + esc(hds[i].ev.join(', ')) : '') : ''}</small></div></div>`; }).join('') +
    '<p class="foot">From NASA’s eclipse tables · no eclipses left in 2026 after the August ones</p>';
}

// ================================================================ videos
let VID = null, vch = 'all';
async function loadVideos() {
  try { const r = await fetch(DATA + 'videos.json?t=' + Math.floor(Date.now() / 60000)); if (r.ok) VID = await r.json(); } catch (e) { /* keep */ }
  videos();
}
function videos() {
  if (!VID) { $('#vlist').innerHTML = '<div class="empty">The newest videos will show here soon 📺💗</div>'; return; }
  const chans = VID.channels || [];
  const all = chans.flatMap(c => c.videos.map(v => ({...v, ch: c.name, key: c.key}))).sort((a, b) => b.t - a.t);
  $('#vchips').innerHTML = [['all', 'All', all.length], ...chans.map(c => [c.key, c.name, c.videos.length])].map(([k, n, c]) => `<button data-vch="${k}" class="${vch === k ? 'on' : ''}">${esc(n)} <small>${c}</small></button>`).join('');
  $('#vsub').textContent = `Updated ${ago(VID.updated)} · tap a video to watch it on YouTube`;
  const list = all.filter(v => vch === 'all' || v.key === vch).slice(0, 24);
  $('#vlist').innerHTML = list.map(v => `<a class="vcard${Date.now() / 1000 - v.t < 172800 ? ' newv' : ''}" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener"><div class="th" style="background-image:url('https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg')"></div>` +
    `<div class="vb"><div class="vch">🎀 ${esc(v.ch)}</div><h4>${esc(v.title)}</h4><small>${esc(ago(v.t))}${v.views ? ' · ' + v.views.toLocaleString() + ' views' : ''}</small></div></a>`).join('') || '<div class="empty">No videos yet 🌸</div>';
}
document.addEventListener('click', e => { const b = e.target.closest('[data-vch]'); if (b) { vch = b.dataset.vch; videos(); } });

// ================================================================ start
function daily() { walk(); hword(); timelines(); feastcal(); testitl(); eclipses(); }
daily(); space(); moon(); loadVideos();
let last = ymd();
setInterval(() => { loadVideos(); space(); if (ymd() !== last) { last = ymd(); daily(); moon(); } }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && ymd() !== last) { last = ymd(); daily(); moon(); } });
})();
