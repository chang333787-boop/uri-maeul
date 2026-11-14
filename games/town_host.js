import { SPM } from './town_game.js?v=63';
const WXN = ['clear', 'rain', 'snow'], SEAN = ['now', 'spring', 'summer', 'autumn', 'winter'];
const FRESH = 30000, EVERY = 10, NIGHT_MAX = 40000, HAND_MAX = 6;
export function createHost({ GAME, say, en, act }) {

  let t = 0, room = '', joinTs = 0, role = '', mid = '', mOwn = false, mP = 0, nOth = 0, lastQ = -1, lastSl = null, pend = 0, pendAt = 0, nightBusy = false;
  let pubT = 0, lastPub = '', pubM = 0, pubAt = 0, presAt = -1e9, wxAp = '', wxDayAp = -1, wxHoldDay = -1, handT = 0, onlyT = -1e9, saidK = '', own = false;
  const C = [], noShow = new Map();
  const guestLike = () => role === 'guest' || role === 'wait' || role === 'hand';
  const L = (ko, e9) => (en() ? e9 : ko);
  function note(k) { if (k === saidK) return; saidK = k; const m = {
    fo: L('⏰ 방장 시계를 따라요. 시각과 날씨, 계절이 방장 마을과 같아요', '⏰ Following the host’s clock. Time, weather and season match the host’s town'),
    ff: L('⏰ 방장이 마을에 없어서 먼저 온 친구의 시계를 따라요', '⏰ The host isn’t in the town, so we follow the friend who came first'),
    mo: L('⏰ 내 시계가 방 시계예요. 내가 자면 친구들도 아침이 돼요', '⏰ Your clock is the room clock. When you sleep, friends wake up too'),
    mf: L('⏰ 방장이 마을에 없어서 친구들이 내 시계를 따라요', '⏰ The host isn’t in the town, so friends follow your clock'),
    solo: L('⏰ 이제 내 시계로 흘러요', '⏰ Your own clock runs now'),
    out: L('⏰ 방에서 나와서 내 시계로 이어 흘러요', '⏰ You left the room. Your own clock keeps going'),
  }[k]; if (m) say(m, 3.4, 1); }

  function aim(f, N) { const b = f.b || {}, ts = +b[0] || 0, a = f.a || {}; lastQ = f.q; mP = a[2] === 1 ? 1 : 0;
    GAME.host = { m: +f.s || 0, at: performance.now() - Math.max(0, Math.min(60000, N.srvNow - ts)), p: mP === 1 }; }
  function apply(f) { const a = f.a || {}, sn = SEAN[a[1]] || 'now', wn = WXN[a[0]] || 'clear';
    if (sn !== act.sea()) { if (act.free()) act.setSea(sn); return; }
    if (wn !== wxAp || GAME.S.day !== wxDayAp) { act.setWx(wn, !wxAp || wn === wxAp); wxAp = wn; wxDayAp = GAME.S.day; wxHoldDay = GAME.S.day; } }
  async function tryNight() { if (nightBusy) return; if (!act.free() && performance.now() - pendAt < NIGHT_MAX) return; nightBusy = true; let ok = false;
    try { ok = await act.night(); } finally { nightBusy = false; if (ok) { pend = 0; GAME.host = null; lastQ = -1; wxDayAp = -1; } } }
  function follow(c, N) { const f = c.f, a = f.a || {}, sl = +a[3] || 0;
    if (c.id !== mid) { mid = c.id; mOwn = c.own; lastSl = sl; lastQ = -1; }
    if (lastSl == null || sl < lastSl) lastSl = sl;
    if (sl > lastSl) { lastSl = sl; if (!pend) { pend = 1; pendAt = performance.now(); } }
    if (pend) { if (!GAME.host || !GAME.host.p) GAME.host = { m: GAME.minF(), at: performance.now(), p: true }; tryNight(); return; }
    if (f.q !== lastQ || !GAME.host) aim(f, N);
    apply(f); }
  function lead(N) { GAME.host = null; GAME.cont = nOth > 0;
    const wx = act.wx(), sea = act.sea(), p = GAME.S.clock && GAME.flow !== false ? 0 : 1, sl = GAME.S.day | 0, sig = wx + sea + p + ':' + sl + GAME.phase + (own ? 1 : 0) + (nOth > 0 ? 1 : 0), m9 = GAME.minF(), n9 = performance.now();
    const jump = nOth > 0 && Math.abs(m9 - (pubM + (p ? 0 : (n9 - pubAt) / 1000 / SPM))) > 3;
    if (sig !== lastPub || jump || (pubT -= 1) <= 0) { lastPub = sig; pubT = EVERY; pubM = m9; pubAt = n9; presAt = n9; N.fx({ s: +m9.toFixed(3), a: [Math.max(0, WXN.indexOf(wx)), Math.max(0, SEAN.indexOf(sea)), p, sl, own ? 1 : 0, joinTs, 1], b: [{ '.sv': 'timestamp' }] }); } }
  function presence(N, force) { const F = N.myFx, a = F && F.a; if (!force && a && +a[5] === joinTs && a[6] !== 1) return; if (!force && performance.now() - presAt < 5000) return;
    presAt = performance.now(); N.fx({ s: 0, a: [0, 0, 0, 0, own ? 1 : 0, joinTs, 0], b: [{ '.sv': 'timestamp' }] }); }
  function leave(said) { if (GAME.host) { GAME.host = null; GAME.mark(); if (said) note('out'); } GAME.cont = false; role = ''; room = ''; mid = ''; pend = 0; lastSl = null; lastQ = -1; joinTs = 0; handT = 0; nOth = 0; lastPub = ''; noShow.clear(); saidK = ''; }
  function sec() {
    const M = window.SM_MP, rm = M && M.room ? M.room() : null, N = rm && M.net ? M.net() : null;
    if (!N || !document.body.classList.contains('mp-in')) { if (room) leave(guestLike()); return; }
    if (rm !== room) { if (room) leave(false); room = rm; }
    if (!joinTs) { if (!N.srvOk) return; joinTs = Math.round(N.bornAt); }
    own = !!(M.isOwner && M.isOwner()); const now = N.srvNow;
    C.length = 0; C.push({ id: N.id, own, j: joinTs, me: true, fresh: true, f: null });
    N.fxPeers((pid, f, inTown) => { const a = f.a || {}, j = +a[5] || 0; if (!inTown || !j) return; const ts = +((f.b || {})[0]) || 0; C.push({ id: pid, own: a[4] === 1, j, me: false, fresh: a[6] === 1 && now - ts < FRESH, f }); });
    for (const c of C) if (c.fresh && !c.me) noShow.delete(c.id);
    const ok = c => c.me || c.fresh || !(now - (noShow.get(c.id) || now) > FRESH), cmp = (x, y) => x.j - y.j || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
    let pick = null; for (const c of C) if (c.own && ok(c) && (!pick || cmp(c, pick) < 0)) pick = c;
    if (!pick) for (const c of C) if (!c.own && ok(c) && (!pick || cmp(c, pick) < 0)) pick = c;
    if (!pick.me && !pick.fresh && !noShow.has(pick.id)) noShow.set(pick.id, now);
    nOth = C.length - 1; const was = role;
    if (pick.me) {
      if (pend) { tryNight(); return; }
      if (was !== 'master' && was !== 'guest' && was !== 'hand') { let oc = null; for (const c of C) if (!c.me && c.fresh && (!oc || cmp(c, oc) < 0)) oc = c; if (oc) { role = 'hand'; handT = 0; mid = ''; } else role = 'master'; }
      if (role === 'hand') { let oc = null; for (const c of C) if (!c.me && c.fresh && (!oc || cmp(c, oc) < 0)) oc = c;
        if (oc && ++handT <= HAND_MAX) { follow(oc, N); const g9 = GAME.hostAim(), d = g9 == null ? 0 : Math.abs(g9 - GAME.minF()); if (!(d < 1 && !pend && SEAN[(oc.f.a || {})[1]] === act.sea())) return; }
        role = 'master'; }
      if (role !== 'master') { role = 'master'; mid = ''; lastSl = null; }
      lead(N);
      if (nOth > 0) note(own ? 'mo' : 'mf'); else if (was === 'guest' || was === 'wait') note('solo');
      return; }
    if (was === 'master') { lastPub = ''; presence(N, true); }
    else presence(N, false);
    GAME.cont = false;
    if (!pick.fresh) { role = 'wait'; if (pend) tryNight(); return; }
    role = 'guest'; follow(pick, N); note(pick.own ? 'fo' : 'ff'); }
  const API = {
    tick(dt) { if ((t += dt) < 1) return; t = 0; sec(); },
    guest: () => guestLike(),
    master: () => role === 'master',

    only() { const n = performance.now(); if (n - onlyT < 1200) return; onlyT = n; say(mOwn || role === 'hand' ? L('⏰ 방장만 할 수 있어요. 시간과 날씨는 방장 마을을 따라요', '⏰ Only the host can do that. Time and weather follow the host’s town') : L('⏰ 지금 시계를 맡은 친구만 할 수 있어요. 시간과 날씨는 그 친구 마을을 따라요', '⏰ Only the friend keeping the clock can do that. Time and weather follow their town'), 3); },

    tag(e9) { const g = guestLike() && !!GAME.host, m = role === 'master' && nOth > 0; if (!g && !m) return ''; const o = g ? mOwn : own, p = g ? mP === 1 : !GAME.S.clock; return ' ' + (p ? '⏸' : '⏰') + (o ? (e9 ? 'Host clock' : '방장 시계') : (e9 ? 'Room clock' : '방 시계')); },
    wxHold: () => guestLike() || wxHoldDay === GAME.S.day,
    seaHold: () => guestLike(),
    st: () => ({ room, role, mid, mOwn, own, joinTs, nOth, pend, host: GAME.host ? { ...GAME.host } : null, cont: GAME.cont, wxAp, sl: lastSl, noShow: [...noShow.keys()] }),
    dispose() { GAME.host = null; GAME.cont = false; if (GAME.guard === guard) GAME.guard = null; },
  };
  const guard = () => { if (!guestLike()) return false; API.only(); return true; };
  GAME.guard = guard; GAME.tag = e9 => API.tag(e9);
  window.SM_HOST = API;
  return API;
}
