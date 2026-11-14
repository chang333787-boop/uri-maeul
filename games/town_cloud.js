const CF_HTTP = (() => { try { const q = new URLSearchParams(location.search).get('cf'); if (q === 'off') return ''; if (q && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(q)) return q; return 'https://sm-rooms.sm-rooms.workers.dev'; } catch (e) { return ''; } })();
const CLS_K = 'sm-town-cls';
export function classCode() { try { const q = new URLSearchParams(location.search).get('cls'); if (q != null) { const c = /^[A-Za-z0-9]{4,8}$/.test(q) ? q.toLowerCase() : ''; if (c) localStorage.setItem(CLS_K, c); else localStorage.removeItem(CLS_K); return CF_HTTP ? c : ''; } return CF_HTTP ? (localStorage.getItem(CLS_K) || '') : ''; } catch (e) { return ''; } }

let MPT = null; export const mpTicket = () => MPT;

export async function cloudCall(kind, code, num, body, ms = 5000, ka) {
  if (!CF_HTTP || !code) return { st: 0, j: null }; const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, t = ac ? setTimeout(() => ac.abort(), ms) : 0, raw = typeof body === 'string';
  try { const r = await fetch(CF_HTTP + '/' + kind + '/' + code + '/' + num, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ? body : JSON.stringify(body), signal: ac ? ac.signal : undefined, keepalive: kind === 'save' && !!(ka != null ? ka : !raw && body.k9) }); let j = null; try { j = await r.json(); } catch (e) {   } if (r.status === 200 && j && j.ok && 'mp' in j) MPT = j.mp && typeof j.mp.r === 'string' && typeof j.mp.tk === 'string' ? { r: j.mp.r, tk: j.mp.tk, u: j.mp.u | 0 } : null; return { st: r.status, j }; }
  catch (e) { return { st: 0, j: null }; } finally { if (t) clearTimeout(t); } }

export async function cloudTeach(kind, code, body, ms = 8000, num = 0) {
  const pc = kind === 'pinclear'; if (!CF_HTTP || !code || !/^(class|tclaim|pinclear|tset)$/.test(kind) || (pc && !(num >= 1 && num <= 40))) return { st: 0, j: null }; const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, t = ac ? setTimeout(() => ac.abort(), ms) : 0;
  try { const r = await fetch(CF_HTTP + '/' + kind + '/' + code + (pc ? '/' + (num | 0) : ''), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined }); let j = null; try { j = await r.json(); } catch (e) {   } return { st: r.status, j }; }
  catch (e) { return { st: 0, j: null }; } finally { if (t) clearTimeout(t); } }
export const cloudOn = () => !!CF_HTTP;
const metaK = key => 'sm-town-cloud:' + key;
const prog = S => (S && typeof S === 'object' ? (S.day || 0) * 100000 + (S.earned || 0) : -1);

const gOf = j => { const g = j && typeof j === 'object' ? j.gen : null; return g && typeof g === 'object' && typeof g.id === 'string' && g.id ? { id: g.id, dead: Array.isArray(g.dead) ? g.dead : [] } : { id: 'L0', dead: [] }; };
export const genWin = (a, b) => { const A = gOf(a), B = gOf(b); if (A.id === B.id) return ''; if (A.dead.includes(B.id)) return 'a'; if (B.dead.includes(A.id)) return 'b'; return ''; };
export const CHK_MS = 180000;
const SEEN = {};

export async function cloudPull(key, code, num, pin) {
  const r = await cloudCall('load', code, num, { pin }); if (r.st !== 200 || !r.j || !r.j.ok) return r.st === 403 ? 'bad' : r.st === 423 ? 'lock' : 'off'; if (r.j.none) { SEEN[key] = Date.now(); return 'none'; }
  let meta = {}, loc = null; try { meta = JSON.parse(localStorage.getItem(metaK(key)) || '{}') || {}; loc = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {   }
  let mk = null; if (!loc) { try { mk = JSON.parse(localStorage.getItem(key + ':gen') || 'null'); } catch (e) { mk = null; } }
  const gw = loc ? genWin(r.j.data, loc) : mk && Array.isArray(mk.dead) && mk.dead.includes(gOf(r.j.data).id) ? 'b' : '';
  const pS = prog(r.j.data), pL = prog(loc), newer = meta.at ? r.j.at > meta.at : pS >= pL;
  SEEN[key] = Date.now();
  if (gw === 'b' || (!gw && newer && loc && pL > pS)) { try { localStorage.setItem(key + ':cloud-bak', JSON.stringify({ at: r.j.at, data: r.j.data })); } catch (e) {   } return loc ? 'more' : 'fresh'; }
  if ((gw === 'a' || newer) && r.j.data && r.j.data.v) { try { if (loc) localStorage.setItem(key + ':local-bak', JSON.stringify(loc)); localStorage.setItem(key, JSON.stringify(r.j.data)); localStorage.setItem(metaK(key), JSON.stringify({ at: r.j.at })); } catch (e) { return 'off'; } return 'pulled'; }
  return 'kept'; }

export function cloudSync({ key, code, num, pin, alive, onFail, flush, more, onGen }) {
  let lastS = '', busy = false, failed = false, stop9 = false, blk = '', chk = SEEN[key] && Date.now() - SEEN[key] < CHK_MS ? SEEN[key] : 0;
  try { lastS = more ? '' : (localStorage.getItem(key) || ''); } catch (e) {   }
  const badPin = m => { stop9 = true; blk = 'pin'; if (!failed) { failed = true; if (onFail) onFail(m); } };
  const check = async () => { const r = await cloudCall('load', code, num, { pin, chk: 1 }); if (r.st === 409 && r.j && r.j.relog) return 'relog';     if (r.st === 403 && r.j && r.j.bad) { badPin(r.j.m); return ''; } if (r.st !== 200 || !r.j || !r.j.ok) return ''; chk = Date.now(); if (r.j.none) return 'ok';
    let loc = null, meta = {}; try { loc = JSON.parse(localStorage.getItem(key) || 'null'); meta = JSON.parse(localStorage.getItem(metaK(key)) || '{}') || {}; } catch (e) {   }
    const gw = genWin(r.j.data, loc); if (gw === 'a') return 'dead'; if (gw === 'b') return 'ok';
    if (!(meta.at && r.j.at <= meta.at) && prog(r.j.data) > prog(loc)) return 'behind';
    return 'ok'; };
  const okJ = s => s.charCodeAt(0) === 123 && s.charCodeAt(s.length - 1) === 125;
  const push = async (k9) => { if (busy || stop9 || !alive()) return; if (flush) { try { if (flush() === false) return; } catch (e) {   } } let s = '';     try { s = localStorage.getItem(key) || ''; } catch (e) { return; } if (!s || s === lastS || !okJ(s)) return;
    if (!chk || Date.now() - chk > CHK_MS) { if (k9) { if (!chk) return; } else { busy = true; const c = await check(); busy = false; if (stop9 || !alive() || !c) return; if (c !== 'ok') { stop9 = true; blk = c; if (onGen) onGen(c); return; } try { s = localStorage.getItem(key) || ''; } catch (e) { return; } if (!s || s === lastS || !okJ(s)) return; } }
    busy = true; const r = await cloudCall('save', code, num, '{' + (pin == null ? '' : '"pin":' + JSON.stringify(pin) + ',') + '"data":' + s + ',"k9":' + !!k9 + '}', 5000, !!k9); busy = false;
    if (r.st === 200 && r.j && r.j.ok) { lastS = s; failed = false; try { localStorage.setItem(metaK(key), JSON.stringify({ at: r.j.at })); } catch (e) {   } } else if (r.st === 409 && r.j && r.j.relog) { if (!stop9) { stop9 = true; blk = 'relog'; if (onGen && alive()) onGen('relog'); } }     else if (r.st === 403 && r.j && r.j.bad) badPin(r.j.m); else if (!failed) { failed = true; if (onFail) onFail(r.j && r.j.m); } };
  const iv = setInterval(() => { if (!alive()) { clearInterval(iv); removeEventListener('pagehide', ph); return; } push(false); }, 45000);
  const ph = () => { let n = 0; try { n = (localStorage.getItem(key) || '').length; } catch (e) {   } if (n < 60000) push(true); };
  addEventListener('pagehide', ph);
  return { now: () => push(false), stop: () => { stop9 = true; clearInterval(iv); removeEventListener('pagehide', ph); }, get blocked() { return blk; } }; }
