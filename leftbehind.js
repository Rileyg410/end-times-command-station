/* END TIMES COMMAND STATION · Left behind mode
   My phone checks in each time I open the station. If I don't check in for my set number of days,
   the station changes itself for whoever opens it next. It flips only on a CONFIRMED stale check-in:
   on my phone from my own last open, anywhere else only from a fresh checkin.json the minute loop just wrote. */
(() => {
'use strict';
const {$, esc, ct, store, DATA} = window.ETCS;
const CI_TOPIC = 'etcs-checkin-33008373';
const CLAIM = '05a8fc2f441cdb61f75c8e6c4d80c1cb058f7a9a744543aa08909221666c5134';
const DAYS = [3, 5, 7, 10, 14, 21, 30];
const now = () => Math.floor(Date.now() / 1000);
const DAY = 86400;
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const me = () => store.get('etcs_me', null);
const days = () => store.get('etcs_lb_days', 7);
const nice = t => new Date(t * 1000).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: window.ETCS.TZ});

// ---------------------------------------------------------------- the station's copy of my last check-in
let remote = null; // only set when the loop checked it in the last 45 minutes
async function readRemote() {
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(DATA + 'checkin.json?t=' + Date.now(), {cache: 'no-store', signal: ctl.signal});
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !j.checked || Math.abs(now() - j.checked) > 2700) return null; // old copy or the loop is down: never decide from it
    remote = j; store.set('etcs_lb_remote', j); return j;
  } catch (e) { return null; }
}
const remoteStale = j => !!(j && j.last > 0 && j.checked - Math.max(j.last, j.from || 0) > (j.days || 7) * DAY);

// ---------------------------------------------------------------- check in (my phone only)
async function checkIn(force) {
  const t = me(); if (!t) return;
  store.set('etcs_lb_last', now());
  const sent = store.get('etcs_lb_sent', 0);
  if (!force && now() - sent < 1800) { paint(); return; }
  try {
    const r = await fetch('https://ntfy.sh/' + CI_TOPIC, {method: 'POST', body: days() + '.' + t, headers: {Title: 'check-in', Priority: '1'}});
    if (r.ok) { store.set('etcs_lb_sent', now()); store.set('etcs_lb_pending', false); } else store.set('etcs_lb_pending', true);
  } catch (e) { store.set('etcs_lb_pending', true); }
  paint();
}
window.addEventListener('online', () => { if (me() && store.get('etcs_lb_pending', false) && !document.body.classList.contains('lb')) checkIn(true); });

// ---------------------------------------------------------------- flip / preview
let wentHome = 0;
function show(preview, since) {
  wentHome = since || 0;
  document.body.classList.add('lb');
  document.body.classList.toggle('lbprev', !!preview);
  $('#lbtop').hidden = false;
  $('#lbtop').innerHTML = preview
    ? '<b>👀 Previewing Left behind mode</b><button class="pillbtn" id="lbexit">Back to my station</button>'
    : '<b>🕊️ I\'ve gone home to be with Jesus</b>' + (me() ? '<button class="linkbtn" id="lbme">It\'s me, I\'m still here</button>' : '');
  counter(); timeline();
  window.ETCS.go ? window.ETCS.go('left') : document.querySelector('[data-go="left"]').click();
}
function hide() { document.body.classList.remove('lb', 'lbprev'); $('#lbtop').hidden = true; document.querySelector('.tabs [data-go="home"]').click(); }

function counter() {
  const box = $('#lbday');
  if (!wentHome) { box.innerHTML = '<p class="lbdn"><b>Day 1</b> since I went home</p><p class="tiny muted">(Preview: the real count starts from my last check-in)</p>'; return; }
  const d = Math.max(1, Math.floor((now() - wentHome) / DAY) + 1);
  box.innerHTML = `<p class="lbdn"><b>Day ${d}</b> since I went home</p><p class="tiny muted">My last check-in was ${esc(nice(wentHome))}</p>`;
}

// the 70th week: 7 years of 360 days = 2,520 days, split in half at 1,260 (Daniel 9:27, Revelation 11:3, 12:6)
function timeline() {
  const cov = store.get('etcs_lb_cov', '');
  let start = cov ? Date.parse(cov + 'T12:00:00Z') / 1000 : (wentHome || now());
  const day = Math.max(0, Math.floor((now() - start) / DAY));
  const pct = Math.min(100, day / 2520 * 100);
  const yr = Math.min(7, Math.floor(day / 360) + 1);
  $('#lbtl').innerHTML =
    `<div class="lbbar"><span class="half"></span><i class="you${pct < 18 ? ' l' : pct > 82 ? ' r' : ''}" style="left:${pct.toFixed(1)}%"><em>You are about here</em></i></div>` +
    '<div class="lbmarks"><span>⚖️ Covenant<small>Day 1</small></span><span>🕍 The middle<small>Day 1,260</small></span><span>👑 Jesus returns<small>Day 2,520</small></span></div>' +
    `<p class="small center"><b>${cov ? 'Day ' + (day + 1).toLocaleString() + ' since the covenant' : 'Roughly year ' + yr + ' of 7'}</b>${cov ? '' : ', counting from when I left.'}</p>` +
    `<p class="small">The real clock starts when the covenant with Israel is confirmed (Daniel 9:27). That might not be the same day I left. When you know the date it was signed, put it here and the timeline will count from it:</p>` +
    `<div class="lbcov"><input type="date" id="lbcovd" value="${esc(cov)}" aria-label="Date the covenant was signed"><button class="pillbtn" id="lbcovs">Count from it</button></div>`;
}

// ---------------------------------------------------------------- settings + home tap
function paint() {
  const t = me(), last = store.get('etcs_lb_last', 0), d = days();
  const mini = $('#lbmini');
  if (mini) { mini.hidden = !t; if (t) mini.innerHTML = `🙋‍♀️ I'm still here <small>${last ? 'checked in ' + esc(window.ETCS.ago(last)) : 'tap to check in'} · Left behind mode after ${d} days</small>`; }
  const box = $('#lbset'); if (!box) return;
  const r = remote || store.get('etcs_lb_remote', null);
  box.innerHTML = '<h2>🕊️ Left behind mode</h2>' +
    '<p class="small">If I don\'t open my station for a while, it changes itself for whoever picks up my phone or opens my link: my testimony, the gospel, what\'s coming and how to be saved, so my watch keeps going after I\'m gone.</p>' +
    (t ? `<p class="small"><b>✅ This is my phone.</b> I check in every time I open the station.<br>Last check-in: <b>${last ? esc(ct(last)) : 'not yet'}</b>${r && r.last ? `<br>The station has me at: <b>${esc(ct(r.last))}</b>` : ''}</p>` +
      `<label class="lbdays">Change after <select id="lbdsel">${DAYS.map(n => `<option value="${n}"${n === d ? ' selected' : ''}>${n} days</option>`).join('')}</select> without a check-in</label>` +
      '<div class="btnrow"><button class="pillbtn" id="lbhere">🙋‍♀️ I\'m still here</button><button class="pillbtn ghost" id="lbprev">👀 Preview it</button></div>' +
      '<p class="tiny muted">It only changes when it\'s sure I really haven\'t checked in. If the internet or the station has a hiccup, it stays the same. <button class="linkbtn" id="lbforget">This isn\'t my phone</button></p>'
    : '<p class="small">This phone isn\'t set as mine yet, so opening it here doesn\'t check me in.</p>' +
      '<div class="lbcov"><input id="lbcode" type="text" autocomplete="off" autocapitalize="none" placeholder="My station code"><button class="pillbtn" id="lbclaim">💗 This is my phone</button></div>' +
      '<div class="btnrow"><button class="pillbtn ghost" id="lbprev">👀 Preview it</button></div>');
}

async function claim(code) {
  code = (code || '').trim().toLowerCase();
  if (!code || await sha('etcs-me|' + code) !== CLAIM) return false;
  store.set('etcs_me', await sha('etcs-ci|' + code));
  await checkIn(true);
  return true;
}

document.addEventListener('click', async e => {
  const id = e.target.closest('button') && e.target.closest('button').id;
  if (!id) return;
  if (id === 'lbmini' || id === 'lbhere') { await checkIn(true); const b = $('#' + id); if (b) { b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 900); } }
  else if (id === 'lbprev') show(true, 0);
  else if (id === 'lbexit') hide();
  else if (id === 'lbme') { if (confirm('Only the owner of this phone should tap this. Go back to the station?')) { hide(); checkIn(true); } }
  else if (id === 'lbclaim') { const ok = await claim($('#lbcode').value); if (!ok) alert('That code doesn\'t match 💗'); paint(); }
  else if (id === 'lbforget') { if (confirm('Stop counting this phone as mine?')) { localStorage.removeItem('etcs_me'); paint(); } }
  else if (id === 'lbcovs') { const v = $('#lbcovd').value; store.set('etcs_lb_cov', v); timeline(); }
});
document.addEventListener('change', e => { if (e.target.id === 'lbdsel') { store.set('etcs_lb_days', +e.target.value); checkIn(true); } });

// ---------------------------------------------------------------- on open
async function start() {
  const m = /[#&]me=([\w-]{4,40})/.exec(location.hash);
  if (m) { await claim(m[1]); history.replaceState(null, '', location.pathname + location.search); }
  paint();
  if (me()) {
    const last = store.get('etcs_lb_last', 0);
    if (last && now() - last > days() * DAY) {
      // my phone hasn't opened in a while: ask the station whether I checked in from my other copy first
      const r = await readRemote();
      const newest = Math.max(last, r ? r.last : 0);
      if (now() - newest > days() * DAY) { show(false, newest); return; }
    }
    await checkIn(false);
    readRemote().then(paint);
    return;
  }
  const r = await readRemote();
  if (r) {
    if (remoteStale(r)) { store.set('etcs_lb_flip', r.last); show(false, r.last); }
    else localStorage.removeItem('etcs_lb_flip');
  } else {
    const f = store.get('etcs_lb_flip', 0); // confirmed earlier, now offline
    if (f) show(false, f);
  }
  paint();
}
start();
setInterval(paint, 60000);
})();
