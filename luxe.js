/* Heavenly jewelry box: the sky, the light, the opening, and three little gifts */
(() => {
const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
const body = document.body;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

/* ---- the heavens behind the lace ---- */
const hv = document.createElement('div'); hv.className = 'heaven'; hv.setAttribute('aria-hidden', 'true');
hv.innerHTML = '<div class="hv-sky"></div><div class="hv-stars"></div><div class="hv-stars b"></div><div class="hv-aurora"></div><div class="hv-rays"></div><div class="hv-glory"></div><div class="hv-cur l"></div><div class="hv-cur r"></div><div class="hv-valance"></div>';
body.prepend(hv);
const motes = document.createElement('div'); motes.className = 'hv-motes'; motes.setAttribute('aria-hidden', 'true');
let m = '';
for (let i = 0; i < 16; i++) m += `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--s:${(2 + Math.random() * 4).toFixed(1)}px;--t:${(14 + Math.random() * 14).toFixed(1)}s;--d:-${(Math.random() * 26).toFixed(1)}s;--dx:${(Math.random() * 60 - 30).toFixed(0)}px"></i>`;
for (let i = 0; i < 5; i++) m += `<b style="--x:${(8 + Math.random() * 84).toFixed(1)}%;--t:${(16 + Math.random() * 10).toFixed(1)}s;--d:-${(Math.random() * 24).toFixed(1)}s;--dx:${(Math.random() * 120 - 60).toFixed(0)}px"></b>`;
motes.innerHTML = m; body.prepend(motes);

function sky() {
  const h = new Date().getHours();
  const s = h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
  ['dawn', 'day', 'dusk', 'night'].forEach(k => body.classList.toggle('sky-' + k, k === s));
}
sky(); setInterval(sky, 5 * 60000);

if (!calm) {
  let tick = false;
  addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { const y = Math.min(scrollY, 900); hv.style.setProperty('--py', y + 'px'); tick = false; }); }, {passive: true});
}

/* a soft verse of heaven under the greeting, one a day */
const GV = [
  ['And the city had no need of the sun, neither of the moon, to shine in it: for the glory of God did lighten it, and the Lamb is the light thereof.', 'Revelation 21:23'],
  ['Arise, shine; for thy light is come, and the glory of the LORD is risen upon thee.', 'Isaiah 60:1'],
  ['And the twelve gates were twelve pearls; every several gate was of one pearl.', 'Revelation 21:21'],
  ['And there shall be no night there; and they need no candle, neither light of the sun; for the Lord God giveth them light.', 'Revelation 22:5'],
  ['Thine eyes shall see the king in his beauty: they shall behold the land that is very far off.', 'Isaiah 33:17'],
  ['In thy presence is fulness of joy; at thy right hand there are pleasures for evermore.', 'Psalm 16:11'],
  ['He brought me to the banqueting house, and his banner over me was love.', 'Song of Solomon 2:4'],
  ['And God shall wipe away all tears from their eyes.', 'Revelation 21:4']
];
const greet = $('#greet');
if (greet) {
  const dn = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5), g = GV[dn % GV.length];
  const p = document.createElement('p'); p.className = 'gverse'; p.innerHTML = `“${esc(g[0])}”<small>${esc(g[1])}</small>`;
  greet.appendChild(p);
}

/* the globe sits in a pearl-studded ring */
const vw = $('.vwrap'); if (vw) { const r = document.createElement('div'); r.className = 'vring'; vw.appendChild(r); }

/* rooms take their jewel color; a breath of light between pages */
const ROOMS = ['watch', 'word', 'signs', 'me'];
const veil = document.createElement('div'); veil.className = 'veil'; body.appendChild(veil);
function setRoom(t) {
  let r = ROOMS.includes(t) ? t : '';
  if (!r && t !== 'home') { const c = $('.crumb'); r = c && ROOMS.includes(c.dataset.go) ? c.dataset.go : ''; }
  if (r) body.dataset.room = r; else delete body.dataset.room;
}
let first = true;
addEventListener('etcs-go', e => {
  setTimeout(() => setRoom(e.detail), 0);
  if (!first && !calm) { veil.classList.remove('go'); void veil.offsetWidth; veil.classList.add('go'); }
  first = false;
});
setRoom(body.dataset.pane || 'home');

/* ============ gift 1: His Name for my heart ============ */
const HEARTS = [{"k": "anx", "e": "😮‍💨", "f": "Anxious", "he": "יְהוָה שָׁלוֹם", "tr": "Jehovah Shalom", "m": "The LORD is peace", "v": "…and called it Jehovah-shalom", "r": "Judges 6:24", "j": "6.6.24", "v2": "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.", "r2": "Isaiah 26:3", "j2": "22.26.3", "p": "Jesus, You are my peace. I lay this worry down at Your feet, and I let You hold it. 🤍"}, {"k": "money", "e": "🪙", "f": "Money’s tight", "he": "יְהוָה יִרְאֶה", "tr": "Jehovah Jireh", "m": "The LORD will see to it", "v": "And Abraham called the name of that place Jehovah-jireh: as it is said to this day, In the mount of the LORD it shall be seen.", "r": "Genesis 22:14", "j": "0.22.14", "v2": "But my God shall supply all your need according to his riches in glory by Christ Jesus.", "r2": "Philippians 4:19", "j2": "49.4.19", "p": "You saw the ram in the thicket before Abraham ever looked up. You already see what we need. 💗"}, {"k": "unseen", "e": "🫧", "f": "Unseen", "he": "אֵל רֳאִי", "tr": "El Roi", "m": "The God who sees me", "v": "And she called the name of the LORD that spake unto her, Thou God seest me: for she said, Have I also here looked after him that seeth me?", "r": "Genesis 16:13", "j": "0.16.13", "v2": "Thou compassest my path and my lying down, and art acquainted with all my ways.", "r2": "Psalm 139:3", "j2": "18.139.3", "p": "You see me, Lord. Every little thing, every quiet tear. I am never invisible to You. 🌸"}, {"k": "hurt", "e": "💔", "f": "Hurting", "he": "יְהוָה רֹפְאֶךָ", "tr": "Jehovah Rapha", "m": "The LORD who heals", "v": "…for I am the LORD that healeth thee.", "r": "Exodus 15:26", "j": "1.15.26", "v2": "He healeth the broken in heart, and bindeth up their wounds.", "r2": "Psalm 147:3", "j2": "18.147.3", "p": "Healer, touch the sore places in me, the ones I can name and the ones I can’t. 🕊️"}, {"k": "wait", "e": "⏳", "f": "Weary of waiting", "he": "אֵל עוֹלָם", "tr": "El Olam", "m": "The everlasting God", "v": "And Abraham planted a grove in Beer-sheba, and called there on the name of the LORD, the everlasting God.", "r": "Genesis 21:33", "j": "0.21.33", "v2": "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", "r2": "Isaiah 40:31", "j2": "22.40.31", "p": "You are never late. Renew my strength while I wait for You, and let me mount up with wings. ✨"}, {"k": "israel", "e": "🇮🇱", "f": "Afraid for Israel", "he": "שׁוֹמֵר יִשְׂרָאֵל", "tr": "Shomer Yisrael", "m": "The Keeper of Israel", "v": "Behold, he that keepeth Israel shall neither slumber nor sleep.", "r": "Psalm 121:4", "j": "18.121.4", "v2": "For I, saith the LORD, will be unto her a wall of fire round about, and will be the glory in the midst of her.", "r2": "Zechariah 2:5", "j2": "37.2.5", "p": "Keeper of Israel, be her wall of fire round about tonight, and the glory in the midst of her. 🔥"}, {"k": "lost", "e": "🧭", "f": "Need direction", "he": "יְהוָה רֹעִי", "tr": "Jehovah Raah", "m": "The LORD my shepherd", "v": "The LORD is my shepherd; I shall not want.", "r": "Psalm 23:1", "j": "18.23.1", "v2": "I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye.", "r2": "Psalm 32:8", "j2": "18.32.8", "p": "Shepherd me. I will follow Your voice one step at a time. 🐑"}, {"k": "home", "e": "☁️", "f": "Longing for home", "he": "יְהוָה שָׁמָּה", "tr": "Jehovah Shammah", "m": "The LORD is there", "v": "…and the name of the city from that day shall be, The LORD is there.", "r": "Ezekiel 48:35", "j": "25.48.35", "v2": "And the city had no need of the sun, neither of the moon, to shine in it: for the glory of God did lighten it, and the Lamb is the light thereof.", "r2": "Revelation 21:23", "j2": "65.21.23", "p": "Even so, come, Lord Jesus. And until that day, You are here with me too. 💫"}];
const heart = document.createElement('div'); heart.className = 'card heart'; heart.id = 'heart';
heart.innerHTML = `<h2><span>💗</span> His Name for my heart</h2><p class="hk">How is your heart right now? He has a name for that.</p>
<div class="hchips">${HEARTS.map(h => `<button data-hk="${h.k}"><b>${h.e}</b>${esc(h.f)}</button>`).join('')}</div>
<div class="hbox" aria-live="polite"><div class="hcase"><div class="hbase"></div><div class="hlid"></div><i></i></div><div class="hreveal" id="hreveal"></div></div>`;
const rooms = $('#p-home .rooms'); if (rooms) rooms.appendChild(heart); /* lives inside the rooms box so the reshaping station carries it along */
heart.addEventListener('click', e => {
  const b = e.target.closest('[data-hk]'); if (!b) return;
  const h = HEARTS.find(x => x.k === b.dataset.hk);
  $$('.hchips button').forEach(x => x.classList.toggle('on', x === b));
  heart.classList.remove('open'); void heart.offsetWidth;
  $('#hreveal').innerHTML = `<p class="hhe" lang="he">${h.he}</p><p class="htr">${esc(h.tr)}</p><p class="hm">${esc(h.m)}</p>
<p class="hv">“${esc(h.v)}”</p><p class="hr">${esc(h.r)} <a href="#" data-bjump="${h.j}">📖</a></p>
<p class="hv">“${esc(h.v2)}”</p><p class="hr">${esc(h.r2)} <a href="#" data-bjump="${h.j2}">📖</a></p>
<p class="hp">${esc(h.p)}</p>`;
  heart.classList.add('open');
  put('etcs_heart', {k: h.k, d: today()});
});

/* ============ gift 2: Bless my house ============ */
const BL = [
  ['יְבָרֶכְךָ יְהוָה וְיִשְׁמְרֶךָ', 'Yevarekhekha Adonai veyishmerekha', 'The LORD bless thee, and keep thee:'],
  ['יָאֵר יְהוָה פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ', 'Ya’er Adonai panav elekha vichunekka', 'The LORD make his face shine upon thee, and be gracious unto thee:'],
  ['יִשָּׂא יְהוָה פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם', 'Yisa Adonai panav elekha veyasem lekha shalom', 'The LORD lift up his countenance upon thee, and give thee peace.']
];
let names = get('etcs_bless', ['Riley', 'Elliana', 'Tamm', 'Nanny', 'Israel 🇮🇱']);
const bless = document.createElement('div'); bless.className = 'card bless'; bless.id = 'bless';
function blessHTML() {
  bless.innerHTML = `<h2><span>🕯️</span> Bless my house</h2>
<div class="candle"><div class="flame"></div></div>
<div class="bnames">${names.map((n, i) => `<span data-bn="${i}">${esc(n)}<em data-bx="${i}" aria-label="Remove">✕</em></span>`).join('')}</div>
<div class="badd"><input id="bnew" maxlength="24" placeholder="Add a name…"><button class="pillbtn" id="bplus" style="width:auto;margin:0;padding:8px 14px">Add</button></div>
<div class="blines"><p class="bidle">Light the candle and speak the priestly blessing over the ones you love, the way Aaron blessed Israel.</p>
${BL.map((l, i) => `<div class="bline" data-bl="${i}"><p class="bh" lang="he">${l[0]}</p><p class="btl">${l[1]}</p><p class="be">${l[2]}</p></div>`).join('')}
<div class="bline" data-bl="3"><p class="be">“And they shall put my name upon the children of Israel; and I will bless them.”</p><p class="hp">Amen. They are Yours, Lord 🤍</p></div></div>
<p class="bref">Numbers 6:24–27 <a href="#" data-bjump="3.6.24" style="color:#b4577e">📖</a></p>
<button class="pillbtn" id="blight">🕯️ Light the candle & bless</button>
<button class="bedit" id="bedit">Change the names</button>`;
}
blessHTML();
let bt = [];
function runBless() {
  bt.forEach(clearTimeout); bt = [];
  const lines = $$('#bless .bline'), sp = $$('#bless .bnames span');
  bless.classList.add('lit'); $('#bless .bidle').style.display = 'none'; lines.forEach(l => l.classList.remove('on')); sp.forEach(s => s.classList.remove('on'));
  const step = calm ? 3000 : 4200;
  lines.forEach((l, i) => bt.push(setTimeout(() => {
    lines.forEach(x => x.classList.toggle('on', x === l));
    sp.forEach((s, k) => { if (k < Math.ceil(sp.length * (i + 1) / 3)) s.classList.add('on'); });
  }, 700 + i * step)));
  bt.push(setTimeout(() => { $('#blight').textContent = '🕯️ Bless them again'; }, 700 + 3 * step));
  put('etcs_bless_last', today());
}
bless.addEventListener('click', e => {
  if (e.target.closest('#blight')) return runBless();
  if (e.target.closest('#bedit')) { bless.classList.toggle('edit'); $('#bedit').textContent = bless.classList.contains('edit') ? 'Done' : 'Change the names'; return; }
  const x = e.target.closest('[data-bx]'); if (x) { names.splice(+x.dataset.bx, 1); put('etcs_bless', names); blessHTML(); bless.classList.add('edit'); $('#bedit').textContent = 'Done'; return; }
  if (e.target.closest('#bplus')) { const v = $('#bnew').value.trim(); if (v) { names.push(v); put('etcs_bless', names); blessHTML(); bless.classList.add('edit'); $('#bedit').textContent = 'Done'; } }
});
bless.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'bnew') $('#bplus').click(); });

/* ============ gift 3: Pearls of thanks ============ */
let pearls = get('etcs_thanks', []);
const th = document.createElement('div'); th.className = 'card thanks'; th.id = 'thanks';
th.innerHTML = `<h2><span>🦪</span> My pearls of thanks</h2><p class="hk">“In every thing give thanks: for this is the will of God in Christ Jesus concerning you.” <b style="color:#a9845a">1 Thessalonians 5:18</b></p>
<svg class="neck" id="neck" viewBox="0 0 320 170" aria-label="My necklace of thanks"></svg>
<div class="tread" id="tread"></div>
<div class="tform"><input id="tnew" maxlength="140" placeholder="Today I'm thankful for…"><button class="pillbtn" id="tadd">String it 🤍</button></div>
<p class="tcount" id="tcount"></p>`;
const NP = (t) => { const x = (1 - t) * (1 - t) * 14 + 2 * (1 - t) * t * 160 + t * t * 306, y = (1 - t) * (1 - t) * 14 + 2 * (1 - t) * t * 196 + t * t * 14; return [x, y]; };
let sel = -1;
function neck(newest) {
  const n = pearls.length, show = pearls.slice(-28), k = show.length, off = n - k;
  let s = `<defs><radialGradient id="pg" cx=".34" cy=".28" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#fdf4f7"/><stop offset=".8" stop-color="#ecd2dd"/><stop offset="1" stop-color="#d6b0c1"/></radialGradient><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#e9cf98"/><stop offset=".5" stop-color="#b5884a"/><stop offset="1" stop-color="#e9cf98"/></linearGradient></defs>
<path d="M14 14 Q160 196 306 14" fill="none" stroke="url(#cg)" stroke-width="1.2" stroke-dasharray="${k ? '0' : '2 3'}"/>
<g transform="translate(160 112)"><line y1="-6" y2="6" stroke="url(#cg)" stroke-width="1"/><path d="M0 6 L6 18 L0 40 L-6 18Z" fill="url(#cg)" stroke="#fff3d6" stroke-width=".6"/><path d="M0 14 V32 M-4 20 H4" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></g>`;
  if (!k) s += `<text x="160" y="62" text-anchor="middle" font-family="Dancing Script" font-size="18" fill="#c78aa6">your first pearl goes here</text>`;
  show.forEach((p, i) => {
    const t = k === 1 ? .5 : .5 + (i - (k - 1) / 2) * Math.min(.034, .9 / (k - 1)), [x, y] = NP(t), r = 7.2 + (i % 3 === 1 ? 1 : 0), idx = off + i;
    s += `<g class="pp${idx === n - 1 && newest ? ' new' : ''}${idx === sel ? ' sel' : ''}" data-pi="${idx}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#pg)" stroke="rgba(201,162,92,.35)" stroke-width=".5"/><circle cx="${(x - r * .35).toFixed(1)}" cy="${(y - r * .4).toFixed(1)}" r="${(r * .28).toFixed(1)}" fill="#fff" opacity=".9"/></g>`;
  });
  $('#neck').innerHTML = s;
  $('#tcount').textContent = n ? `${n} pearl${n === 1 ? '' : 's'} of thanks${n > 28 ? ' · showing the newest 28' : ''}` : '';
  const p = pearls[sel];
  $('#tread').innerHTML = p ? `“${esc(p.t)}”<small>${new Date(p.d).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}<a href="#" id="tdel">remove</a></small>` : (n ? '<small>Tap a pearl to read it</small>' : '');
}
th.addEventListener('click', e => {
  const g = e.target.closest('[data-pi]'); if (g) { sel = +g.dataset.pi; neck(); return; }
  if (e.target.closest('#tdel')) { e.preventDefault(); pearls.splice(sel, 1); sel = -1; put('etcs_thanks', pearls); neck(); return; }
  if (e.target.closest('#tadd')) { const v = $('#tnew').value.trim(); if (!v) { $('#tnew').focus(); return; } pearls.push({t: v, d: Date.now()}); put('etcs_thanks', pearls); $('#tnew').value = ''; sel = pearls.length - 1; neck(true); }
});
th.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'tnew') $('#tadd').click(); });
const meList = $('#p-me .rlist'); if (meList) { meList.after(bless); bless.after(th); }
neck();

/* ============ the opening: once a day, lace parts and the lights come on ============ */
function reveal() {
  if (get('etcs_rv', '') === today() || body.classList.contains('lb') || (body.dataset.pane && body.dataset.pane !== 'home')) return;
  put('etcs_rv', today());
  const h = new Date().getHours(), hi = h < 5 ? 'Peace be with you tonight' : h < 12 ? 'Good morning, Zo' : h < 17 ? 'Good afternoon, Zo' : 'Good evening, Zo';
  let bulbs = '';
  for (let i = 0; i < 11; i++) { const x = 4 + i * 9.2, y = 14 + Math.sin(i / 10 * Math.PI) * 22; bulbs += `<g style="animation-delay:${(.2 + i * .12).toFixed(2)}s"><circle cx="${x}%" cy="${y}" r="9" fill="rgba(255,226,180,.35)"/><circle cx="${x}%" cy="${y}" r="3.2" fill="#fff6e0"/></g>`; }
  const arcs = Array.from({length: 13}, (_, i) => { const a = Math.PI + Math.PI * i / 12; return `<circle class="gp" style="--d:${i}" cx="${(100 + 78 * Math.cos(a)).toFixed(1)}" cy="${(110 + 78 * Math.sin(a)).toFixed(1)}" r="3.2" fill="#fff"/>`; }).join('');
  const el = document.createElement('div'); el.className = 'reveal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Welcome');
  el.innerHTML = `<div class="rv-half l"></div><div class="rv-half r"></div>
<div class="rv-strand"><svg>${bulbs}</svg></div>
<div class="rv-in"><div class="rv-gate"><svg viewBox="0 0 200 250"><defs><linearGradient id="rvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset=".5" stop-color="#f1d08e"/><stop offset="1" stop-color="#e7b9c8"/></linearGradient></defs><path class="ga" d="M22 248 V110 A78 78 0 0 1 178 110 V248" fill="none" stroke="url(#rvg)" stroke-width="2.2" stroke-linecap="round"/><path class="ga" d="M36 248 V113 A64 64 0 0 1 164 113 V248" fill="none" stroke="url(#rvg)" stroke-width="1" stroke-dasharray="2 4" stroke-linecap="round"/>${arcs}</svg><div class="rv-pearl"></div></div>
<p class="rv-v">${hi} 🤍</p><p class="rv-r" style="max-width:290px;line-height:1.7">“Arise, shine; for thy light is come” · Isaiah 60:1</p></div>
<p class="rv-skip">tap to come in</p>`;
  body.appendChild(el); body.classList.add('revealing');
  let done = false;
  const open = () => {
    if (done) return; done = true;
    el.classList.add('part'); body.classList.remove('revealing'); body.classList.add('revealed');
    setTimeout(() => el.classList.add('gone'), 1300);
    setTimeout(() => { el.remove(); body.classList.remove('revealed'); }, 2100);
  };
  el.addEventListener('click', open);
  setTimeout(open, calm ? 1200 : 3300);
}
reveal();
})();
