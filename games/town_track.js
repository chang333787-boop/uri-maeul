export const TRK_V = 1;
const GRACE = { story: 15, em: 2, task: 2, pin: 1 };
const PIN_N = 3, PIN_MS = 900000;
const fmtM = d => (d < 1000 ? Math.round(d / 10) * 10 + 'm' : (d / 1000).toFixed(1) + 'km');
const ro = w => { const s = String(w || ''), c = s.charCodeAt(s.length - 1); if (c >= 0xac00 && c <= 0xd7a3) { const j = (c - 0xac00) % 28; return j && j !== 8 ? '으로' : '로'; } return '(으)로'; };
const CSS = '.twn-trk{position:fixed;left:10px;top:180px;z-index:30;display:none;align-items:center;gap:8px;box-sizing:border-box;max-width:min(460px,calc(100vw - 20px));background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-left:9px solid #3b6fb6;border-radius:12px;box-shadow:0 3px 0 #2b2420;padding:4px 6px 4px 10px;font:800 14px/1.3 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji}'
  + '.twn-trk.on{display:flex}.twn-trk .t{flex:1 1 auto;min-width:0;word-break:keep-all}.twn-trk .t b{color:#3b6fb6;margin-right:3px}'
  + '.twn-trk button{flex:none;font:inherit;font-weight:900;background:#3b6fb6;color:#fff;border:3px solid #2b2420;border-radius:10px;box-shadow:0 3px 0 #2b2420;padding:3px 11px;min-height:34px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none}'
  + '.twn-trk button:active{transform:translateY(2px);box-shadow:0 1px 0 #2b2420}body.touch .twn-trk button{min-height:var(--ui-tap,44px);min-width:var(--ui-tap,44px)}body.small .twn-trk{max-width:min(400px,60vw)}@media (orientation:landscape){body.small .twn-trk{max-width:min(400px,46vw)}}'
  + '.twn-p[data-k=trk]{--rib:#3b6fb6}.twn-p .trk-l{display:grid;gap:8px;margin:6px 0 4px}'
  + '.twn-p .trk-l button.trk-r{display:flex;align-items:center;gap:10px;width:100%;min-height:54px;text-align:left;background:#fffdf7;color:var(--ink);border:3px solid var(--ink);box-shadow:0 3px 0 var(--ink);padding:6px 10px}'
  + '.twn-p .trk-l button.trk-r.on{background:#e3eefb;border-color:#3b6fb6;box-shadow:0 3px 0 #3b6fb6}.twn-p .trk-r .ic{flex:none;font-size:22px;width:30px;text-align:center}'
  + '.twn-p .trk-r .nm{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;word-break:keep-all}.twn-p .trk-r .nm small{font-size:12px;font-weight:700;color:var(--mut,#6b6457)}'
  + '.twn-p .trk-r .dm{flex:none;font-size:13px;font-weight:800;text-align:right;color:#2b2420;min-width:58px}.twn-p .trk-r .st{flex:none;font-size:12px;font-weight:900;color:#fff;background:#3f8f4e;border-radius:8px;padding:2px 8px}.twn-p .trk-r.on .st{background:#3b6fb6}';

export function createTrack(A) {
  const en = () => A.en(), L = (ko, e) => (en() ? e : ko), esc = t => A.esc(t);
  const S = () => { const G = A.GAME.S; let t = G.trk; if (!t || typeof t !== 'object' || Array.isArray(t)) t = G.trk = { v: TRK_V, k: null, by: '', pin: null }; return t; };
  const REQ = {}, PINS = [], ENG = new Set();
  let LC = [], acc = 0, gone = 0, endAt = 0, el = null, css = null, dead = false, boot = true, healT = 0, rowSig = '', HAS9 = false;
  const DBG = { set: 0, ends: 0, held: 0, heal: 0, notes: [], log: [] };
  const log = (k, x) => { DBG.log.push([k, x, Math.round(performance.now() / 100) / 10]); if (DBG.log.length > 40) DBG.log.shift(); };
  const slim = o => { if (!o) return {}; const r = {}; for (const k of ['icon', 'name', 'en', 'kind', 'arrive', 'isle', 'tk', 'x', 'z']) if (o[k] != null) r[k] = o[k]; if (o.door) r.door = [+o.door[0], +o.door[1]]; return r; };
  function keyOf(own, info) { const ic = (info && info.icon) || '';
    if (own === 'story') return 'story'; if (own === 'em') return 'em:emerg'; if (own === 'fix') return 'em:fix'; if (own === 'case') return 'em:case';
    if (own === 'jobs' && /🔥|🚒/.test(ic)) return 'em:fire'; if (own === 'task') return 'task:' + ((info && info.tk) || '');
    return 'pin:' + own; }
  const ownOf = k => (!k ? '' : k === 'story' ? 'story' : k === 'em:emerg' ? 'em' : k === 'em:fix' ? 'fix' : k === 'em:case' ? 'case' : k === 'em:fire' ? 'jobs' : k.startsWith('task:') ? 'task' : k.startsWith('pin:') ? k.slice(4) : '');
  const srcOf = k => (!k ? '' : k === 'story' ? 'story' : k.startsWith('em:') ? 'em' : k.startsWith('task:') ? 'task' : 'pin');
  const reqOf = k => { const r = REQ[ownOf(k)]; return r && r.k === k ? r : null; };
  const pinSnap = r => (r ? { own: r.own, to: r.to.slice(), info: r.info, via: r.via, p: r.p } : null);
  function pinAdd(r) { pinDel(r.own); PINS.unshift(r); while (PINS.length > PIN_N) PINS.pop(); }
  function pinDel(own) { for (let i = PINS.length - 1; i >= 0; i--) if (PINS[i].own === own) PINS.splice(i, 1); }
  const pinC = r => ({ k: 'pin:' + r.own, src: 'pin', own: r.own, tag: L('고른 곳', 'Picked place'), icon: (r.info && r.info.icon) || '📍', name: (r.info && (en() && r.info.en ? r.info.en : r.info.name)) || L('고른 곳', 'Picked place'), at: r.to.slice() });

  function cands() { const out = A.cands() || [], k = S().k;
    for (const r of PINS) if (!out.some(c => c.k === 'pin:' + r.own)) out.push(pinC(r));
    const sp = S().pin; if (k && k.startsWith('pin:') && sp && sp.own === k.slice(4) && !out.some(c => c.k === k)) out.push(pinC(sp));
    return out; }
  const near = L9 => { const me = A.me(); let b = null, bd = 1e18; for (const c of L9) { const d = (c.at[0] - me.x) ** 2 + (c.at[1] - me.z) ** 2; if (d < bd) { bd = d; b = c; } } return b; };
  const sudden = c => c.k === 'em:emerg' || c.k === 'em:fire';
  const dflt = L9 => L9.find(c => c.src === 'story') || near(L9.filter(c => c.at && !c.self && !sudden(c))) || null;

  function want(own, to, info, how, via, p) { own = own || 'find'; if (how === 'redraw') return true;
    const k = keyOf(own, info), r = REQ[own] = { own, k, to: [+to[0], +to[1]], info: slim(info), via: via || 'path', p: p ? slim(p) : null, t: performance.now(), fail: 0 };
    if (k.startsWith('pin:')) pinAdd(r);
    const cur = S().k;
    if (cur === k) { endAt = 0; gone = 0; }
    if (how === 'pick') { if (cur !== k) set(k, 'kid', { noDraw: true, why: 'pick' }); else if (k.startsWith('pin:')) { S().pin = pinSnap(r); A.GAME.mark(); } return true; }
    if (cur === k) { if (k.startsWith('pin:')) { S().pin = pinSnap(r); A.GAME.mark(); } return true; }
    if (!cur) { set(k, 'auto', { noDraw: true, quiet: true }); return true; }
    DBG.held++; log('held', k); return false; }

  function off(own) { if (!own) return; delete REQ[own]; pinDel(own); if (S().k === 'pin:' + own && !endAt) endAt = performance.now() + 600; }

  function arrived(own) { if (!own) return; delete REQ[own]; pinDel(own); if (S().k === 'pin:' + own && !endAt) endAt = performance.now() + 2600; }
  function set(k, by, o) { o = o || {}; const s = S(), was = s.k; s.k = k || null; s.by = by; s.pin = k && k.startsWith('pin:') ? pinSnap(REQ[k.slice(4)]) || (s.pin && s.pin.own === k.slice(4) ? s.pin : null) : null; gone = 0; endAt = 0; A.GAME.mark();
    if (was === k) return; DBG.set++; log('set', (was || '-') + '>' + (k || '-') + ' ' + by + (o.why ? ' ' + o.why : '')); LC = cands();
    if (!o.noDraw) redraw();
    A.goalSync(); if (A.changed) A.changed(); if (!o.quiet && k) note(k, by); rowSig = ''; row(); }
  function redraw() { const k = S().k, r = k ? reqOf(k) : null; if (r && !r.fail) A.draw(r); else if (A.drawnK() != null) A.draw(null); }
  const labOf = c => c.icon + ' ' + c.name;
  const cellT = c => { const n = A.cell(c.at[0], c.at[1]); return /^([가-힣]\d+|\d+[가-힣])$/.test(n) ? n + L(' 칸', '') : n; };
  const fmtC = (c, d) => (A.fmt ? A.fmt(c, d) : fmtM(d));
  function note(k, by) { const c = LC.find(q => q.k === k) || cands().find(q => q.k === k); if (!c) return; const nm9 = String(c.name).replace(/\s*\([A-Za-z0-9~ ]+\)\s*$/, '')  , t = '🧭 ' + (en() ? 'Now guiding you to ' + labOf(c) : '이제 ' + c.icon + ' ' + nm9 + ro(nm9) + ' 안내해요'); DBG.notes.push(t); if (DBG.notes.length > 10) DBG.notes.shift(); A.say(t, 2.8, by === 'kid' ? 0 : 3); }
  function next(why) { const was = S().k, L9 = LC.filter(c => c.k !== was); const n = L9.find(c => c.src === 'story') || near(L9.filter(c => c.at && !c.self)) || L9[0] || null;
    DBG.ends++; log('end', (was || '-') + ' ' + (why || '')); set(n ? n.k : null, 'auto', { why: why || 'end', quiet: !n }); }
  function pick(k) { if (!k || dead) return false; LC = cands(); if (!LC.some(c => c.k === k)) return false; if (S().k === k) return true; set(k, 'kid', { why: 'pick' }); return true; }

  function heal(now) { const k = S().k, r = k ? reqOf(k) : null; if (!r || r.fail || A.drawnK() === k || !A.canHeal() || now - healT < 3000) return; healT = now; DBG.heal++; A.draw(r); if (A.drawnK() !== k) r.fail = 1; }
  function sec() { if (dead) return; const now = performance.now(); LC = cands(); const s = S(), k = s.k, me = A.me();
    for (let i = PINS.length - 1; i >= 0; i--) if (now - PINS[i].t > PIN_MS && 'pin:' + PINS[i].own !== k) PINS.splice(i, 1);
    for (const c of LC) if (c.eng && !ENG.has(c.k)) { ENG.add(c.k); if (k !== c.k) { set(c.k, 'kid', { why: 'eng' }); boot = false; return; } }
    for (const q of [...ENG]) if (!LC.some(c => c.k === q && c.eng)) ENG.delete(q);
    if (k && k.startsWith('pin:') && !endAt) { const c = LC.find(q => q.k === k); if (c && c.at && Math.hypot(c.at[0] - me.x, c.at[1] - me.z) < 7) arrived(c.own); }
    if (endAt) { if (now >= endAt && !A.busy()) { endAt = 0; const o9 = ownOf(k); delete REQ[o9]; pinDel(o9); LC = LC.filter(c => c.k !== k); next('arrive'); } boot = false; row(); return; }
    if (k && !LC.some(c => c.k === k)) { if (!A.busy()) gone += 0.5; if (boot && k !== 'story') gone = 99; if (gone >= (GRACE[srcOf(k)] || 2)) { gone = 0; next('end'); boot = false; row(); return; } } else gone = 0;
    boot = false;
    { const hs = LC.some(c => c.src === 'story'); if (hs && !HAS9 && s.k && s.k !== 'story' && s.by === 'auto') { HAS9 = true; set('story', 'auto', { why: 'story' }); row(); return; } HAS9 = hs; }
    if (!s.k) { const d = dflt(LC); if (d) set(d.k, 'auto', { quiet: true }); }
    heal(now); row(); }
  function tick(dt) { if (dead) return; acc += dt; if (acc < 0.5) return; acc = 0; sec(); }

  function ensure() { if (el) return; css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css); el = document.createElement('div'); el.className = 'twn-trk'; el.setAttribute('role', 'status'); el.innerHTML = '<span class="t"></span><button type="button"></button>';
    el.querySelector('button').addEventListener('click', e => { e.stopPropagation(); open(); }); el.addEventListener('pointerdown', e => e.stopPropagation()); document.body.appendChild(el); }
  const rowWant = () => { const k = S().k; return !A.hidden() && (LC.length >= 2 || (!!k && k !== 'story')); };
  const D8K = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], D8E = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const dirW = c => { const m = A.me(), b = (Math.atan2(c.at[0] - m.x, -(c.at[1] - m.z)) * 57.29578 + 360) % 360, i = Math.round(b / 45) % 8; return en() ? D8E[i] : D8K[i] + '쪽'; };
  function row() { if (dead) return; const k = S().k, c = k ? LC.find(q => q.k === k) : null;
    if (!rowWant()) { if (el && el.classList.contains('on')) { el.classList.remove('on'); rowSig = ''; A.stack(); } return; }
    ensure(); const d = c && c.at && !c.self ? A.dist(c) : -1;
    const tx = c ? labOf(c) + (c.at && !c.self ? (d >= 0 ? ' · ' + dirW(c) : ' · ' + cellT(c)) : c.self ? L(' · 스스로 찾는 중', ' · finding it yourself') : '') : L('없음', 'nothing');
    const sig = tx + '|' + (en() ? 1 : 0); if (sig !== rowSig) { rowSig = sig; el.querySelector('.t').innerHTML = '<b>🧭 ' + L('따라가는 중', 'Following') + '</b> ' + esc(tx); el.querySelector('button').textContent = L('바꾸기', 'Change'); }
    if (!el.classList.contains('on')) { el.classList.add('on'); S().seen = 1; A.stack(); }
    if (LC.length >= 2) A.tipWant(); }
  const rowOn = () => !!(el && el.classList.contains('on'));

  function sorted(L9) { const me = A.me(), dOf = c => (c.at && !c.self ? Math.hypot(c.at[0] - me.x, c.at[1] - me.z) : 1e9); return L9.slice().sort((a, b) => (b.src === 'story') - (a.src === 'story') || dOf(a) - dOf(b)); }
  function open() { if (dead) return false; ensure(); LC = cands(); const k = S().k, me = A.me();
    const rows = sorted(LC).map(c => { const on = c.k === k, d = c.at && !c.self ? (on ? A.dist(c) : Math.hypot(c.at[0] - me.x, c.at[1] - me.z)) : -1, sub = c.tag + (c.what && c.what !== c.name ? ' — ' + c.what : '');
      return '<button type="button" class="trk-r' + (on ? ' on' : '') + '" data-k="' + esc(c.k) + '"' + (on ? ' aria-pressed="true"' : '') + '><span class="ic">' + esc(c.icon) + '</span><span class="nm"><b>' + esc(c.name) + '</b><small>' + esc(sub) + '</small></span><span class="dm">' + (d >= 0 ? esc(cellT(c)) + '<br>' + fmtC(c, d) : c.self ? L('스스로<br>찾기', 'find<br>it') : '') + '</span><span class="st">' + (on ? L('따라가는 중', 'Following') : L('따라가기', 'Follow')) + '</span></button>'; }).join('');
    const P = A.openP('<h3>🧭 ' + L('무엇을 따라갈까요?', 'What do you want to follow?') + '</h3><div class="sm">' + L('고른 것 하나만 나침반과 지도, 위 가운데 줄이 가리켜요. 나머지는 지도에 흐린 점으로 보여요.', 'Only the one you pick shows on the compass, the map and the top line. The others are faint dots on the map.') + '</div><div class="trk-l">' + (rows || '<div class="sm">' + L('지금 따라갈 것이 없어요.', 'Nothing to follow right now.') + '</div>') + '</div><div class="row"><button class="sub" data-a="x">' + L('닫기', 'Close') + '</button></div>', false, 'trk');
    if (!P) return false; P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const kk = b.dataset.k; if (kk == null) return; A.closeP(); if (kk !== S().k) pick(kk); };
    A.tipUsed(); return true; }

  function dots(g, P, big) { const k = S().k, r = big ? 6 : 3.6; g.save(); for (const c of LC) { if (c.k === k || !c.at || c.self || c.dot === 0) continue; const [x, y] = P(c.at[0], c.at[1]); g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.strokeStyle = '#2b2420'; g.lineWidth = big ? 2 : 1.4; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); if (big) { g.globalAlpha = 0.6; g.font = '12px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2b2420'; g.fillText(c.icon, x, y + 0.5); } } g.restore(); }
  const tgt0 = () => { const k = S().k; return k ? LC.find(c => c.k === k) || null : null; };
  const tgt = () => { const c = tgt0(); return c && c.at && !c.self ? c : null; };
  function adopt(k9, own, to, info, via, p) { if (!own || !to) return; REQ[own] = { own, k: k9 || keyOf(own, info), to: [+to[0], +to[1]], info: slim(info), via: via || 'path', p: p ? slim(p) : null, t: performance.now(), fail: 0 }; }
  function restore() { const sp = S().pin; if (sp && sp.own && Array.isArray(sp.to)) { REQ[sp.own] = { own: sp.own, k: 'pin:' + sp.own, to: sp.to.slice(), info: sp.info || {}, via: sp.via || 'path', p: sp.p || null, t: performance.now(), fail: 0 }; pinAdd(REQ[sp.own]); } }
  function dispose() { dead = true; if (el) el.remove(); if (css) css.remove(); el = css = null; }
  restore();
  const api = { key: () => S().k, by: () => S().by, drawn: () => A.drawnK(), pick: k => pick(k), open: () => open(), sec: () => sec(), cands: () => (LC = cands()).map(c => ({ k: c.k, src: c.src, icon: c.icon, name: c.name, at: c.at ? c.at.map(v => +(+v).toFixed(1)) : null, self: !!c.self, eng: !!c.eng })),
    req: own => (REQ[own] ? { k: REQ[own].k, to: REQ[own].to.slice(), via: REQ[own].via } : null), reqs: () => Object.keys(REQ), pins: () => PINS.map(r => r.own), row: () => (el && rowOn() ? el.querySelector('.t').textContent : ''), rowOn: () => rowOn(), rowBox: () => { if (!el || !rowOn()) return null; const r = el.getBoundingClientRect(), b = el.querySelector('button').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, bx: b.left, by: b.top, bw: b.width, bh: b.height }; },
    dbg: () => ({ ...DBG, notes: DBG.notes.slice(), log: DBG.log.slice(), gone, endAt: endAt ? Math.round(endAt - performance.now()) : 0 }), reset: () => { const s = S(); s.k = null; s.by = ''; s.pin = null; for (const k in REQ) delete REQ[k]; PINS.length = 0; ENG.clear(); gone = 0; endAt = 0; A.GAME.mark(); } };
  return { tick, sec, want, off, arrived, keyOf, ownOf, pick, open, dots, tgt, tgt0, adopt, dispose, api, get k() { return S().k; }, is: src => srcOf(S().k) === src, req: own => REQ[own] || null, rowOn, sig: () => (rowOn() ? rowSig : ''), el: () => el, fmtM };
}
