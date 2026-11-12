/* END TIMES COMMAND STATION · Mark of the beast tracker + Peace and safety meter */
(() => {
'use strict';
const {$, $$, esc, ago, ct, DATA} = window.ETCS;
const J = async f => { try { const r = await fetch(DATA + f + '?t=' + Math.floor(Date.now() / 60000)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const flag = c => c.length === 2 ? String.fromCodePoint(...[...c.toUpperCase()].map(ch => 127397 + ch.charCodeAt(0))) : '🏳️';
const card = (s, tagmap, hot) => `<a class="ncard${hot ? ' hot' : ''}" href="${esc(s.link)}" target="_blank" rel="noopener"><div class="top"><span class="src">${esc(s.src)}</span><span class="ago">${esc(ct(s.t))} · ${esc(ago(s.t))}</span></div>` +
  `<div class="badges">${hot ? '<i class="alarm">🚨 Israel deal</i>' : ''}${(s.tags || []).filter(t => tagmap[t]).map(t => `<i>${tagmap[t]}</i>`).join('')}${(s.cc || []).slice(0, 3).map(c => `<i>${flag(c)}</i>`).join('')}</div><h4>${esc(s.title)}</h4>${s.snip ? `<p>${esc(s.snip)}</p>` : ''}</a>`;

// ---------------------------------------------------------------- 💳 Mark of the beast
const MC = [['all', '✨ All'], ['id', '🪪 Digital ID'], ['cbdc', '💳 Digital money'], ['bio', '✋ Palm & face'], ['chip', '🔬 Chips'], ['social', '📊 Social credit'], ['cash', '💵 Cashless']];
const MN = {id: '🪪 Digital ID', cbdc: '💳 Digital money', bio: '✋ Palm & face', chip: '🔬 Chip / implant', social: '📊 Social credit', cash: '💵 Cashless'};
let MD = null, mChip = 'all', mCountry = '';
function cbdcBox(cb) {
  if (!cb || !(cb.timeline || cb.findings)) return '<p class="muted small">Loading the world map of digital money…</p>';
  let h = '';
  const tl = cb.timeline;
  if (tl) {
    const row = n => (tl.rows.find(r => r.label === n) || {values: []}).values;
    const last = a => a[a.length - 1] || 0;
    const L = row('Launched'), P = row('Pilot'), D = row('Development'), R = row('Research');
    h += `<div class="mstats"><div><b>${last(L)}</b><small>launched</small></div><div><b>${last(P)}</b><small>in pilot</small></div><div><b>${last(D)}</b><small>building</small></div><div><b>${last(R)}</b><small>researching</small></div></div>`;
    const tot = tl.when.map((_, i) => (L[i] || 0) + (P[i] || 0) + (D[i] || 0) + (R[i] || 0)), mx = Math.max(...tot, 1);
    h += '<div class="mbars">' + tl.when.map((w, i) => {
      const seg = (v, c) => `<span class="${c}" style="height:${(v / mx * 100).toFixed(1)}%"></span>`;
      return `<div class="mbar"><div class="mstack">${seg(R[i] || 0, 'r')}${seg(D[i] || 0, 'd')}${seg(P[i] || 0, 'p')}${seg(L[i] || 0, 'l')}</div><small>${esc(w.replace(/ 20/, ' ’'))}</small></div>`;
    }).join('') + '</div><p class="mkey"><i class="l"></i>launched <i class="p"></i>pilot <i class="d"></i>building <i class="r"></i>researching</p>';
  }
  if (cb.findings && cb.findings.length) h += '<ul class="mfind">' + cb.findings.map(f => `<li><b>${esc(f.h)}</b>${f.b ? ` <span>${esc(f.b)}</span>` : ''}</li>`).join('') + '</ul>';
  h += `<p class="tiny muted">From the Atlantic Council's CBDC tracker${cb.updated ? ` (last updated ${esc(cb.updated)})` : ''}, checked every day · <a href="${esc(cb.source || 'https://www.atlanticcouncil.org/cbdctracker/')}" target="_blank" rel="noopener">open the full map</a></p>`;
  return h;
}
function mark() {
  const all = (MD && MD.stories) || [], c = (MD && MD.counts) || {};
  $('#mcbdc').innerHTML = cbdcBox(MD && MD.cbdc);
  const cl = (MD && MD.countries) || [];
  $('#mcountries').innerHTML = !MD ? '<p class="muted small">Loading…</p>' : cl.length ? cl.slice(0, 24).map(e =>
    `<button class="mco${mCountry === e.cc ? ' on' : ''}" data-mco="${e.cc}"><span class="mf">${flag(e.cc)}</span><span class="mn">${esc(e.name)}<small>${Object.keys(e.tags).sort((a, b) => e.tags[b] - e.tags[a]).map(k => (MN[k] || '').split(' ')[0]).join(' ')}</small></span><b>${e.n}</b></button>`).join('') +
    '<p class="tiny muted">Countries named in the last two weeks of headlines · tap one to see its stories</p>' : '<p class="muted small">No countries named yet 🌸</p>';
  $('#mchips').innerHTML = MC.map(([k, n]) => `<button data-mc="${k}" class="${mChip === k ? 'on' : ''}">${n} <small>${k === 'all' ? all.length : (c[k] || 0)}</small></button>`).join('');
  let list = mChip === 'all' ? all : all.filter(s => (s.tags || []).includes(mChip));
  if (mCountry) list = list.filter(s => (s.cc || []).includes(mCountry));
  const cn = mCountry && (cl.find(e => e.cc === mCountry) || {}).name;
  $('#msub').innerHTML = MD ? `${cn ? `${flag(mCountry)} ${esc(cn)} only · <button class="linkbtn" data-mco="">show every country</button> · ` : ''}Updated ${esc(ago(MD.updated))} · ${all.length} stories from the last ${Math.round((MD.keep_hours || 336) / 24)} days · checks about every 10 minutes` : '';
  $('#mlist').innerHTML = !MD ? '<div class="empty">Loading the tracker… 💳</div>' : list.length ? list.slice(0, 80).map(s => card(s, MN)).join('') + '<div class="foot">Newest first · tap a story to read it all 💗</div>'
    : '<div class="empty">Nothing here right now 🌸 It fills in as stories come in.</div>';
  const t = $('#t-mark small');
  if (t && MD) t.textContent = all.length ? `${all.length} stories · newest ${ago(all[0].t)}: ${all[0].title.slice(0, 64)}${all[0].title.length > 64 ? '…' : ''}` : 'Watching the system';
}
async function loadMark() { const d = await J('beast.json'); if (d) MD = d; mark(); }

// ---------------------------------------------------------------- ☮️ Peace and safety
const PC = [['all', '✨ All'], ['il', '🇮🇱 Israel'], ['ps', '🗣️ “Peace and security”'], ['deal', '🕊️ Peace deals'], ['cease', '🏳️ Ceasefires'], ['norm', '🤝 Normalization'], ['cov', '📜 Covenants & pacts']];
const PN = {il: '🇮🇱 Israel', ps: '🗣️ “Peace and security”', deal: '🕊️ Peace deal', cease: '🏳️ Ceasefire', norm: '🤝 Normalization', cov: '📜 Covenant / pact'};
let PD = null, pChip = 'all';
function gauge(ratio, level, small) {
  const r = Math.max(0, Math.min(ratio || 0, 3)), a = Math.PI * (1 - r / 3);
  const cx = 100, cy = 100, R = 80, nx = cx + (R - 12) * Math.cos(a), ny = cy - (R - 12) * Math.sin(a);
  const arc = (f0, f1, col) => { const a0 = Math.PI * (1 - f0 / 3), a1 = Math.PI * (1 - f1 / 3); return `<path d="M${cx + R * Math.cos(a0)},${cy - R * Math.sin(a0)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a1)},${cy - R * Math.sin(a1)}" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="butt"/>`; };
  return `<svg class="psg${small ? ' sm' : ''} ${level || ''}" viewBox="0 0 200 112"><defs><linearGradient id="psgl${small ? 's' : ''}" x1="0" x2="1"><stop offset="0" stop-color="#ffb3cf"/><stop offset="1" stop-color="#ff8fbd"/></linearGradient></defs>` +
    arc(0, 1.25, `url(#psgl${small ? 's' : ''})`) + arc(1.25, 1.6, '#ff6f9f') + arc(1.6, 3, '#e0103f') +
    `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#5a2140" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="#5a2140"/>` +
    `<text x="22" y="110" class="gl">calm</text><text x="178" y="110" class="gl" text-anchor="end">3×</text></svg>`;
}
const LV = {calm: '🕊️ Calm · about a usual day', rising: '📈 Rising · more peace talk than usual', spike: '🚨 SPIKE · far more peace talk than usual'};
function peace() {
  const d = PD;
  const box = $('#psmeter'), mini = $('#psmini');
  if (!d) { box.innerHTML = '<p class="muted">Reading the headlines…</p>'; return; }
  const lvl = d.level || 'calm';
  [box, mini].forEach(b => b && b.classList.toggle('spike', lvl === 'spike'));
  const c = d.counts || {};
  const hist = (d.hist || []).slice(-8), mx = Math.max(...hist.map(h => h.n), 1);
  box.innerHTML = gauge(d.ratio, lvl) + `<p class="psbig">${(d.ratio || 0).toFixed(1)}× <small>the usual day</small></p><p class="pslv ${lvl}">${LV[lvl]}</p>` +
    `<p class="small center"><b>${d.n24}</b> peace headlines in the last 24 hours · a usual day has about <b>${Math.round(d.base)}</b>${d.il24 ? ` · <b>${d.il24}</b> about Israel` : ''}</p>` +
    `<div class="psbreak">${['ps', 'deal', 'cease', 'norm', 'cov'].map(k => `<span><b>${c[k] || 0}</b>${PN[k]}</span>`).join('')}</div>` +
    `<div class="psdays">${hist.map((h, i) => `<div><span style="height:${Math.max(4, h.n / mx * 100).toFixed(0)}%" class="${i === hist.length - 1 ? 'now' : ''}"></span><small>${i === hist.length - 1 ? 'today' : new Date(h.d + 'T12:00').toLocaleDateString('en-US', {weekday: 'short'})}</small><i>${h.n}</i></div>`).join('')}</div>` +
    `<p class="tiny muted center">Updated ${esc(ago(d.updated))} · counts every 10 minutes</p>`;
  if (mini) mini.querySelector('.psm').innerHTML = gauge(d.ratio, lvl, 1) + `<div><b>${(d.ratio || 0).toFixed(1)}× the usual</b><span class="pslv ${lvl}">${LV[lvl]}</span><small>${d.n24} peace headlines today${d.il24 ? ` · ${d.il24} about Israel` : ''} · tap to see them</small></div>`;
  const all = d.stories || [];
  $('#pchips').innerHTML = PC.map(([k, n]) => `<button data-pc="${k}" class="${pChip === k ? 'on' : ''}">${n} <small>${k === 'all' ? all.length : all.filter(s => (s.tags || []).includes(k)).length}</small></button>`).join('');
  const list = pChip === 'all' ? all : all.filter(s => (s.tags || []).includes(pChip));
  $('#plist').innerHTML = list.length ? list.slice(0, 80).map(s => card(s, PN, s.major)).join('') + '<div class="foot">Last 7 days · newest first · tap a story to read it all 💗</div>'
    : '<div class="empty">Nothing here right now 🌸</div>';
}
async function loadPeace() { const d = await J('peace.json'); if (d) PD = d; peace(); }

document.addEventListener('click', e => {
  const a = e.target.closest('[data-mc]'); if (a) { mChip = a.dataset.mc; mark(); return; }
  const b = e.target.closest('[data-mco]'); if (b) { mCountry = mCountry === b.dataset.mco ? '' : b.dataset.mco; mark(); $('#mchips').scrollIntoView({behavior: 'smooth', block: 'start'}); return; }
  const p = e.target.closest('[data-pc]'); if (p) { pChip = p.dataset.pc; peace(); }
});
loadMark(); loadPeace();
setInterval(() => { loadMark(); loadPeace(); }, 3 * 60 * 1000);
})();
