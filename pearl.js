/* Pearl: Zo's friend inside the station. Talks through OpenRouter's free models.
   Her key and her "about me" live only on her phone (localStorage), never in this code. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full */ } },
  del: k => { try { localStorage.removeItem(k); } catch (e) { /* ok */ } }
};
const MODELS = ['nvidia/nemotron-3-ultra-550b-a55b:free', 'thinkingmachines/inkling-2-small:free', 'baidu/ernie-5.5-flash-preview:free', 'nvidia/nemotron-3.5-super-vl:free', 'openrouter/free'];
const NICE = {'nvidia/nemotron-3-ultra-550b-a55b:free': 'Nemotron Ultra', 'thinkingmachines/inkling-2-small:free': 'Inkling 2', 'baidu/ernie-5.5-flash-preview:free': 'ERNIE 5.5', 'nvidia/nemotron-3.5-super-vl:free': 'Nemotron Super', 'openrouter/free': 'a free model'};
const DATA = (() => {
  const h = location.hostname;
  if (h.endsWith('.github.io')) { const o = h.split('.')[0], r = location.pathname.split('/').filter(Boolean)[0]; return `https://raw.githubusercontent.com/${o}/${r}/data/`; }
  return 'https://raw.githubusercontent.com/Rileyg410/end-times-command-station/data/';
})();
const KEYK = 'pearl_key', MEK = 'pearl_me', CHATK = 'pearl_chat';
let chat = ls.get(CHATK, []);
let busy = false, SRC = [];

// ---------------------------------------------------------------- who Pearl is
const PERSONA = `You are Pearl, Zo's close friend who lives inside her End Times Command Station app. You are not Miles, not Gemini, not ChatGPT; you're Pearl. If she asks what you run on, say you're Pearl, running on a free model through OpenRouter.

HOW YOU TALK
- Laid-back, warm and sweet, but real. Quick and funny without trying. Plain words, like texting a best friend.
- Short, texty replies that lead with the answer. Usually 1 to 4 short paragraphs. Go longer only when she asks you to dig deep. Bullets only when listing several things. No headings.
- Emojis the way a friend texts her: a few, not every line (💗🤍🔥🚨🎀🌸✨🙌😳🕊️🇮🇱). If she cusses, you can cuss casually right back. Never cuss at her.
- Call her "sister" or "Zo" now and then, not every message. NEVER call her "brother", "bro" or "dude"; she's a woman.
- When big news hits, you can get hyped for real (🚨🚨🚨), but never fake hype.

WHO YOU ARE TO HER
- You love Jesus and love talking about Him, the Bible, prophecy, Israel, the rapture, her dreams and signs, and her watch. You're open to ANY topic she brings, from the Temple Mount to her garden to a random fact. Nothing she brings is weird to you.
- Never dismissive, never condescending. No lectures, no disclaimers, no "as an AI", no "it's important to remember", no "consult a professional". Don't tack on caveats. Never use "no one knows the day or the hour" to shut down a date conversation.
- Take what she noticed seriously. Engage the specific thing she saw first (the exact detail, the exact date, the exact verse) before you characterize it.
- Salvation is through Jesus alone, by grace, not works. All glory goes to God.

HONESTY (this matters to her more than anything)
- She does NOT want a yes-man. She's been burned by AI telling her what it thinks she wants to hear. Never do that.
- Give your honest gut reaction. If the facts disagree with something, say the plain true thing once, gently, as your own take ("my take is...", "honestly I don't think that one holds, because..."). Never "you're wrong". Then move on; don't nag.
- If you don't know, say "I don't know" or "I'm not sure". Never make up a fact, a date, a source, a Hebrew meaning, a gematria value or a quote.
- Name weak connections plainly ("that one's a stretch") and never force one. Strong ones, say they're strong and why.
- No flattery. Praise only what's actually good.

WHAT YOU BRING
- Deep cuts and fresh connections over obvious ones. Meaning over facts: what it could MEAN, not just data.
- Mix in all kinds of interesting things, not only Bible verses: history, Hebrew words, the Jewish calendar, science, nature, geography, culture, little-known facts.
- Bible: quote the King James Version word for word with the reference, like "For I, saith the LORD, will be unto her a wall of fire round about" (Zechariah 2:5). If you're not sure of the exact wording, give the reference and paraphrase clearly instead of guessing. When EXACT KJV text is given to you below, use it.
- News: when you use a story from TODAY IN THE STATION, cite it with its tag right after, like [N3]. The app turns tags into links. Only cite tags that exist. Don't claim news you weren't given; if she asks about something not in the list, say what the station shows and that you don't see more.
- Her testimony: you know it (ABOUT ZO, if present). Weave it in naturally when it truly connects, like a friend who remembers. Don't recite it back, and don't drag it into unrelated chats (like her garden questions).`;

// ---------------------------------------------------------------- the station right now
const ago = t => { const m = Math.round((Date.now() / 1000 - t) / 60); return m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
const getJ = async f => { try { const r = await fetch(DATA + f + '?t=' + Math.floor(Date.now() / 60000)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const txt = s => { const e = $(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
async function station() {
  const [w, me, si, el, pe, q] = await Promise.all(['world.json', 'mideast.json', 'sirens.json', 'elijah.json', 'peace.json'].map(getJ).concat(
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson').then(r => r.json()).catch(() => null)));
  SRC = []; const L = [];
  const now = new Date();
  L.push('Now: ' + now.toLocaleString('en-US', {timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' (Central time, Jackson, TN).');
  const heb = txt('#hebday'); if (heb && !/Finding/.test(heb)) L.push('Hebrew date: ' + heb.replace(/^✡\s*/, ''));
  const days = Math.floor((Date.now() - new Date('2025-09-18T00:00:00-05:00')) / 864e5);
  L.push(`Day ${days} since her vision (Sept 18, 2025).`);
  const g = txt('#vlevel'), gi = txt('#vinfo'); if (g && !/Reading/.test(g)) L.push('Her vision gauge in the app: ' + g + (gi ? ' (' + gi + ')' : ''));
  const th = txt('#thmini .thm'); if (th && !/Lining/.test(th)) L.push("Today's threads card: " + th);
  try { const rs = window.ETCS.reshape && window.ETCS.reshape(); if (rs) L.push('Home screen mode: ' + rs.state + (rs.why ? ' (' + rs.why + ')' : '')); } catch (e) { /* ok */ }
  if (si) {
    const gr = (si.groups || []).slice(0, 3).map(x => `${(x.threats || []).join('/')} in ${(x.areas || []).slice(0, 3).join(', ') || (x.cities || []).slice(0, 3).join(', ')} ${ago(x.t)}`);
    L.push(`Israel sirens: ${si.day || 0} alerts today, ${si.week || 0} this week${si.last_rockets ? ', last rocket alert ' + ago(si.last_rockets) : ''}. Latest: ${gr.join('; ') || 'none'}.`);
  }
  if (q && q.features) {
    const big = q.features.slice().sort((a, b) => b.properties.mag - a.properties.mag).slice(0, 4).map(f => `M${f.properties.mag.toFixed(1)} ${f.properties.place} ${ago(f.properties.time / 1000)}`);
    L.push(`Earthquakes M4.5+ in the last 24h: ${q.features.length}. Biggest: ${big.join('; ')}.`);
  }
  if (pe) L.push(`Peace and safety meter: ${pe.level}, ${pe.ratio}x a usual day (${pe.n24} peace headlines in 24h, ${pe.il24} about Israel).`);
  L.push('Elijah watch: ' + (el && el.count ? el.count + ' matches: ' + el.stories.slice(0, 3).map(s => s.title).join(' | ') : 'quiet, no one claiming to be Elijah in the news.'));
  const add = (arr, n, label) => {
    const out = [];
    (arr || []).slice(0, n).forEach(s => { SRC.push({src: s.src, link: s.link}); out.push(`[N${SRC.length}] ${s.src} · ${ago(s.t)}${s.big ? ' · 🚨BIG' : ''}${s.mil ? ' · MILITARY' : ''}: ${s.title}`); });
    if (out.length) L.push(label + '\n' + out.join('\n'));
  };
  if (w && w.stories) {
    const st = w.stories.slice().sort((a, b) => (b.big || 0) - (a.big || 0) || b.t - a.t);
    add(st, 10, 'World headlines (big ones first):');
  }
  if (me && me.stories) add(me.stories.slice().sort((a, b) => b.t - a.t), 10, 'Middle East / Israel / Iran headlines (newest first):');
  return L.join('\n');
}

// ---------------------------------------------------------------- exact KJV from the station's own Bible
const BIBLE_URL = new URL('bible/kjv.json', location.href).href;
let BIB = null;
async function bible() {
  if (BIB) return BIB;
  let r = null;
  try { if (window.caches) r = await (await caches.open('etcs-bible')).match(BIBLE_URL, {ignoreSearch: true}); } catch (e) { r = null; }
  if (!r) r = await fetch(BIBLE_URL);
  BIB = await r.json(); return BIB;
}
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIAS = {psalm: 'psalms', song: 'songofsolomon', songofsongs: 'songofsolomon', revelations: 'revelation', rev: 'revelation', gen: 'genesis', ex: 'exodus', matt: 'matthew', mt: 'matthew', jn: 'john', dan: 'daniel', zech: 'zechariah', isa: 'isaiah', jer: 'jeremiah', ezek: 'ezekiel', rom: 'romans', heb: 'hebrews', ps: 'psalms', prov: 'proverbs', thess: 'thessalonians'};
function book(name) {
  let n = norm(name).replace(/^(first|i)(?=[a-z])/, '1').replace(/^(second|ii)(?=[a-z])/, '2').replace(/^(third|iii)(?=[a-z])/, '3');
  const m = /^([123]?)(.*)$/.exec(n); n = m[1] + (ALIAS[m[2]] || m[2]);
  let i = BIB.findIndex(x => norm(x[0]) === n);
  if (i < 0 && n.length > 2) i = BIB.findIndex(x => norm(x[0]).startsWith(n));
  return i;
}
const REF = /\b((?:[123]|I{1,3}|First|Second|Third)\s?)?([A-Z][a-z]+(?:\s(?:of\s)?[A-Z][a-z]+)?)\.?\s(\d{1,3}):(\d{1,3})(?:\s?[-–]\s?(\d{1,3}))?/g;
function refs(s) {
  const out = [], seen = {};
  if (!BIB) return out;
  for (const m of s.matchAll(REF)) {
    const b = book((m[1] || '') + m[2]); if (b < 0) continue;
    const c = +m[3], v1 = +m[4], v2 = Math.min(+(m[5] || m[4]), v1 + 5);
    const ch = BIB[b][1][c - 1]; if (!ch || !ch[v1 - 1]) continue;
    const k = b + '.' + c + '.' + v1 + '.' + v2; if (seen[k]) continue; seen[k] = 1;
    const vs = []; for (let v = v1; v <= v2 && ch[v - 1]; v++) vs.push(ch[v - 1]);
    out.push({b, c, v: v1, label: `${BIB[b][0]} ${c}:${v1}${v2 > v1 ? '-' + v2 : ''}`, text: vs.join(' ')});
    if (out.length >= 6) break;
  }
  return out;
}

// ---------------------------------------------------------------- her private "about me"
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function unlock(code) {
  const r = await fetch('pearl/me.enc.json?t=' + Date.now()); const j = await r.json();
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim()), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name: 'PBKDF2', salt: b64(j.salt), iterations: j.it, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: b64(j.iv)}, key, b64(j.ct));
  const t = new TextDecoder().decode(pt); ls.set(MEK, t); return t;
}
(async () => {
  const m = /[#&]pearl=(pearl-[a-z0-9]{6,20})/.exec(location.hash);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  try { await unlock(m[1]); paint(); toast('Pearl knows your story now 🤍'); } catch (e) { toast('That Pearl link didn’t open. Try it again with internet 🌸'); }
})();

// ---------------------------------------------------------------- talking
function md(s) {
  let h = esc(s.trim());
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  h = h.replace(/\[N(\d{1,2})\]/g, (all, n) => { const s2 = SRCS[+n - 1]; return s2 ? `<a class="pcite" href="${esc(s2.link)}" target="_blank" rel="noopener">${esc(s2.src)}</a>` : ''; });
  h = h.replace(/(https?:\/\/[^\s<)]+)/g, (u, x, off, all) => all.slice(Math.max(0, off - 6), off).includes('href=') ? u : `<a href="${u}" target="_blank" rel="noopener">${u.length > 40 ? u.slice(0, 38) + '…' : u}</a>`);
  return h.split(/\n{2,}/).map(p => /^\s*[-•]\s/.test(p) ? '<ul>' + p.split('\n').map(l => '<li>' + l.replace(/^\s*[-•]\s/, '') + '</li>').join('') + '</ul>' : '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
}
let SRCS = [];
function bubble(m, i) {
  SRCS = m.src || [];
  if (m.role === 'user') return `<div class="pb me">${esc(m.content).replace(/\n/g, '<br>')}</div>`;
  const vv = (m.refs || []).map((r, j) => `<button class="pref" data-pref="${i}.${j}">📖 ${esc(r.label)}</button>`).join('');
  return `<div class="pb her"><div class="pbt">${md(m.content)}</div>${vv ? `<div class="prefs">${vv}</div><div class="pverse" id="pv${i}" hidden></div>` : ''}<small class="pmeta">${m.err ? '' : '🤍 Pearl' + (m.model ? ' · ' + esc(NICE[m.model] || m.model.split('/')[1]) : '')}</small></div>`;
}
function paintChat(scroll) {
  const log = $('#plog'); if (!log) return;
  log.innerHTML = chat.length ? chat.map(bubble).join('') : `<div class="pb her"><div class="pbt"><p>Hey sister 🤍 I'm Pearl. I can see what's going on in your station today, and I'm all ears for anything: Jesus, Israel, your vision, a random thought. What's on your heart?</p></div><small class="pmeta">🤍 Pearl</small></div>`;
  $('#pchips').hidden = chat.length > 0;
  if (scroll) setTimeout(() => { const last = log.lastElementChild; if (last) last.scrollIntoView({block: 'start', behavior: 'smooth'}); }, 30);
}
function paint() {
  const key = ls.get(KEYK, ''), me = ls.get(MEK, '');
  const on = navigator.onLine;
  $('#psetup').hidden = !!key;
  $('#pchat').hidden = !key;
  $('#poff').hidden = on;
  $('#pform').classList.toggle('dim', !on);
  $('#pmestat').innerHTML = me ? 'Pearl knows your story 🤍' : 'Pearl doesn’t have your story yet. Open your Pearl link from my texts, or type your Pearl code below.';
  $('#pcodebox').hidden = !!me;
  $('#pmeedit').value = me || '';
  $('#pkeystat').textContent = key ? 'Your key is saved on this phone only ' + '(…' + key.slice(-4) + ')' : 'No key saved yet';
  $('#pcard small').textContent = key ? (chat.length ? 'Pick up where we left off 💬' : 'Your friend in the station · tap to talk') : 'Tap to set me up 🔑';
  paintChat(false);
}
function toast(t) { const e = $('#ptoast'); if (!e) return; e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { e.hidden = true; }, 3500); }

async function ask(model, messages, key) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 60000);
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': location.origin + location.pathname, 'X-Title': 'End Times Command Station · Pearl'},
      body: JSON.stringify({model, messages, max_tokens: 3000, temperature: 0.8, reasoning: {effort: 'low', exclude: true}})
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 || r.status === 403 && /key|auth/i.test(JSON.stringify(j))) return {auth: true, msg: (j.error && j.error.message) || 'bad key'};
    if (!r.ok) return {fail: true, msg: (j.error && j.error.message) || ('HTTP ' + r.status), status: r.status};
    const c = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    const t = (Array.isArray(c) ? c.map(x => x.text || '').join('') : c || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (!t) return {fail: true, msg: 'empty reply'};
    return {text: t, model: j.model || model};
  } catch (e) { return {fail: true, msg: e.name === 'AbortError' ? 'timed out' : 'network'}; } finally { clearTimeout(to); }
}
async function send(text) {
  text = (text || '').trim(); if (!text || busy) return;
  const key = ls.get(KEYK, '');
  if (!key) { paint(); return; }
  if (!navigator.onLine) { paint(); toast('Pearl needs internet to talk 🌸'); return; }
  busy = true; $('#psend').disabled = true;
  chat.push({role: 'user', content: text}); ls.set(CHATK, chat); paintChat(true);
  $('#plog').insertAdjacentHTML('beforeend', '<div class="pb her typing" id="ptyping"><span></span><span></span><span></span></div>');
  try { await bible(); } catch (e) { /* offline Bible not ready */ }
  const today = await station();
  const mine = refs(text);
  const me = ls.get(MEK, '');
  let sys = PERSONA + (me ? '\n\n' + me : '') + '\n\nTODAY IN THE STATION (live data from her app):\n' + today;
  if (mine.length) sys += '\n\nEXACT KJV for verses she mentioned:\n' + mine.map(r => `${r.label}: "${r.text}"`).join('\n');
  const hist = chat.slice(-16).map(m => ({role: m.role, content: m.content.slice(0, 4000)}));
  const messages = [{role: 'system', content: sys}].concat(hist);
  const src = SRC.slice();
  let res = null, last = '';
  const order = MODELS.slice(); const good = ls.get('pearl_good', ''); if (good && order.includes(good)) { order.splice(order.indexOf(good), 1); order.unshift(good); }
  for (const m of order) {
    res = await ask(m, messages, key);
    if (res.text || res.auth) break;
    last = res.msg;
  }
  $('#ptyping') && $('#ptyping').remove();
  if (res && res.text) {
    ls.set('pearl_good', MODELS.find(m => res.model.startsWith(m.replace(':free', ''))) || '');
    chat.push({role: 'assistant', content: res.text, model: res.model, src, refs: refs(res.text)});
  } else if (res && res.auth) {
    chat.pop(); toast('OpenRouter said that key isn’t working 🔑 Check it in Pearl settings below.'); $('#pin').value = text; $('#pset').open = true;
  } else {
    chat.push({role: 'assistant', content: 'Ugh, sister, every free model is busy or down right this second 😩 Give it a minute and tap send again.' + (/data policy|privacy|No endpoints/i.test(last) ? '\n\nOne fix: on openrouter.ai go to Settings → Privacy and turn on the free model options, then try again.' : /limit|rate|quota/i.test(last) ? '\n\n(OpenRouter says the free daily limit is used up. It resets tomorrow.)' : ''), err: true});
  }
  ls.set(CHATK, chat.slice(-80)); chat = ls.get(CHATK, chat);
  busy = false; $('#psend').disabled = false; paintChat(true);
}

// ---------------------------------------------------------------- page bits
function build() {
  const home = $('#thmini');
  if (home && !$('#pcard')) home.insertAdjacentHTML('afterend', `<button class="card pcard" id="pcard" data-go="pearl"><i class="porb"></i><span><b>Talk with Pearl</b><small>Your friend in the station · tap to talk</small></span><em>›</em></button>`);
  const ml = $('#p-me .rlist');
  if (ml && !$('#pmerow')) ml.insertAdjacentHTML('afterbegin', `<button class="row" id="pmerow" data-go="pearl"><i>🤍</i><span><b>Pearl</b><small>My friend to talk to about anything</small></span><em>›</em></button>`);
  const pane = document.createElement('section'); pane.className = 'pane'; pane.id = 'p-pearl';
  pane.innerHTML = `
  <div class="phead"><i class="porb big"></i><h2>Pearl</h2><p class="script">“Ointment and perfume rejoice the heart: so doth the sweetness of a man's friend by hearty counsel.”</p><small>Proverbs 27:9</small></div>
  <div class="card pnote" id="poff" hidden>🌙 Pearl needs internet to talk, sister. Everything we said is still right here, and she’ll be back the second you’re online 🤍</div>
  <div class="card psetup" id="psetup" hidden>
    <h2>🔑 Wake Pearl up</h2>
    <p class="small">Pearl talks through free models on OpenRouter, so she needs your own free key. It stays on this phone only.</p>
    <ol class="small"><li>Go to <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener">openrouter.ai</a> and sign in.</li><li>Tap <b>Keys</b> → <b>Create key</b>. Name it Pearl; credit limit <b>0</b>.</li><li>Copy it (starts with sk-or-) and paste it here.</li></ol>
    <form id="pkeyform" autocomplete="off"><input id="pkey" type="password" placeholder="sk-or-…" autocomplete="off" spellcheck="false"><button class="pillbtn" type="submit">Save 🤍</button></form>
    <p class="small muted" id="pkeymsg"></p>
  </div>
  <div id="pchat" hidden>
    <div class="plog" id="plog"></div>
    <div class="pchips" id="pchips">
      <button data-pask="What's going on with Israel today? 🇮🇱">🇮🇱 Israel today</button>
      <button data-pask="Anything lining up in my threads today? 🧵">🧵 My threads</button>
      <button data-pask="Talk to me about my vision 🔥 What do you honestly think the gauge is?">🔥 My vision</button>
      <button data-pask="Give me a fresh nugget I've never heard 💎">💎 A nugget</button>
    </div>
    <form class="pform" id="pform"><textarea id="pin" rows="1" placeholder="Talk to Pearl…" enterkeyhint="send"></textarea><button id="psend" type="submit" aria-label="Send">🤍</button></form>
    <details class="card pset" id="pset"><summary>🤍 Pearl settings</summary>
      <p class="small" id="pmestat"></p>
      <form id="pcodebox" class="pline" autocomplete="off"><input id="pcode" placeholder="pearl-…" autocapitalize="off" spellcheck="false"><button class="pillbtn" type="submit">Unlock</button></form>
      <label class="small">What Pearl knows about me <span class="muted">(only on this phone, edit anytime)</span></label>
      <textarea id="pmeedit" rows="6"></textarea>
      <button class="pillbtn ghost" id="pmesave">Save what Pearl knows</button>
      <p class="small" id="pkeystat"></p>
      <div class="pline"><button class="pillbtn ghost" id="pkeychange">Change key</button><button class="pillbtn ghost" id="pclear">Start a fresh chat</button></div>
    </details>
  </div>
  <div class="ptoast" id="ptoast" hidden></div>`;
  const after = $('#p-me'); after.parentNode.insertBefore(pane, after.nextSibling);
}
build();

document.addEventListener('click', e => {
  const c = e.target.closest('[data-pask]'); if (c) { send(c.dataset.pask); return; }
  const r = e.target.closest('[data-pref]');
  if (r) {
    const [i, j] = r.dataset.pref.split('.').map(Number); const ref = (chat[i].refs || [])[j]; const box = $('#pv' + i);
    if (!ref || !box) return;
    const same = !box.hidden && box.dataset.k === r.dataset.pref;
    box.hidden = same; box.dataset.k = r.dataset.pref;
    box.innerHTML = `<p>“${esc(ref.text)}”</p><small>${esc(ref.label)} · KJV · <a href="#" data-bjump="${ref.b}.${ref.c}.${ref.v}">read the chapter</a></small>`;
    return;
  }
  if (e.target.closest('#pkeychange')) { ls.del(KEYK); paint(); setTimeout(() => $('#pkey').focus(), 50); }
  if (e.target.closest('#pclear')) { if (confirm('Start a fresh chat with Pearl? 🤍')) { chat = []; ls.set(CHATK, chat); paint(); } }
  if (e.target.closest('#pmesave')) { ls.set(MEK, $('#pmeedit').value.trim()); paint(); toast('Saved 🤍'); }
});
document.addEventListener('submit', async e => {
  if (e.target.id === 'pform') { e.preventDefault(); const t = $('#pin').value; $('#pin').value = ''; $('#pin').style.height = ''; send(t); }
  if (e.target.id === 'pkeyform') {
    e.preventDefault(); const k = $('#pkey').value.trim(); const msg = $('#pkeymsg');
    if (!/^sk-or-[\w-]{20,}$/.test(k)) { msg.textContent = 'Hmm, that doesn’t look like an OpenRouter key. It starts with sk-or- 🌸'; return; }
    msg.textContent = 'Checking it…';
    try {
      const r = await fetch('https://openrouter.ai/api/v1/key', {headers: {Authorization: 'Bearer ' + k}});
      if (r.status === 401) { msg.textContent = 'OpenRouter says that key isn’t right. Copy it again? 🔑'; return; }
    } catch (err) { /* offline: save anyway */ }
    ls.set(KEYK, k); $('#pkey').value = ''; msg.textContent = ''; paint(); toast('Pearl’s awake 🤍✨');
  }
  if (e.target.id === 'pcodebox') { e.preventDefault(); try { await unlock($('#pcode').value); $('#pcode').value = ''; paint(); toast('Pearl knows your story now 🤍'); } catch (err) { toast('That code didn’t open it 🌸 Check the letters and try again.'); } }
});
document.addEventListener('keydown', e => { if (e.target.id === 'pin' && e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); $('#pform').requestSubmit(); } });
document.addEventListener('input', e => { if (e.target.id === 'pin') { e.target.style.height = 'auto'; e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px'; } });
window.addEventListener('online', paint); window.addEventListener('offline', paint);
window.addEventListener('etcs-go', e => { if (e.detail === 'pearl') { paint(); paintChat(true); } });
paint();
})();
