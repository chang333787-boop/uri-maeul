const KEY = 'sm-diag', RING = 20, MINS = 40, V = 1;
const r1 = x => Math.round(x * 10) / 10, sec = ms => (ms == null || !(ms > 0) ? null : Math.round(ms / 100) / 10);

export function gpuShort(s) { s = String(s || ''); const m = s.match(/^ANGLE \((.*)\)$/);
  if (m) { const seg = []; let d = 0, cur = ''; for (const ch of m[1]) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { seg.push(cur.trim()); cur = ''; } else cur += ch; } seg.push(cur.trim()); s = seg[1] || seg[0] || ''; }
  const v = s.match(/^Vulkan [\d.]+ \((.*)\)$/); if (v) s = v[1];
  return s.replace(/ANGLE Metal Renderer:\s*/, '').replace(/\s*\(0x[0-9a-f]+\)/ig, '').replace(/\s*Direct3D.*$/, '').replace(/^Mesa\s+/, '').replace(/\((R|TM)\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }
export function gpuName(renderer) { try { const gl = renderer && renderer.getContext && renderer.getContext(), x = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gpuShort(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { return ''; } }

export function osBr() { const ua = navigator.userAgent || '';
  const os = /CrOS\s/.test(ua) ? 'CrOS ' + ((ua.match(/CrOS\s+\S+\s+([\d.]+)/) || [])[1] || '') : /Windows NT [\d.]+/.test(ua) ? ua.match(/Windows NT [\d.]+/)[0] : /Mac OS X/.test(ua) ? 'Mac' : /Android [\d.]+/.test(ua) ? ua.match(/Android [\d.]+/)[0] : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'etc';
  const br = (ua.match(/(Edg|Chrome|Firefox|Version)\/(\d+)/) || []).slice(1, 3).join(' ').replace(/^Version/, 'Safari');
  return [os, br]; }

function readRing() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter(o => o && typeof o === 'object' && o.v === V && o.id) : []; } catch (e) { return []; } }
const hm = at => { const d = new Date(at), p = n => String(n).padStart(2, '0'); return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
const ENDK = { hide: '닫음', hid: '숨긴 채 끝', ctx: '화면 멈춤(문맥 잃음)', open: '끊김', start: '끊김', build: '끊김', '5m': '끊김', err: '끊김(오류 뒤)', look: '지금 판' };
const CRASH = new Set(['open', 'start', 'build', '5m', 'err']);

function sumRun(r) { const M = Array.isArray(r.min) ? r.min : [], med = A => { if (!A.length) return null; const S = A.slice().sort((a, b) => a - b); return S[Math.floor(S.length / 2)]; };
  const first = M[0] || null, last = M.length > 1 ? M[M.length - 1] : null;
  return { p50: med(M.map(m => m[2])), p95: med(M.map(m => m[3])), max: M.reduce((a, m) => Math.max(a, m[4] || 0), 0), n100: M.reduce((a, m) => a + (m[5] || 0), 0), spd: M.length ? Math.min(...M.map(m => m[6])) : null,
    first95: first ? first[3] : null, last95: last ? last[3] : null, mins: M.length }; }
function lineOf(r, i) { const s = sumRun(r), t = r.t || {}, kind = r.pg === 'school' ? '학교' : String(r.pg || '').startsWith('town:') ? '마을' : String(r.pg || '').replace(/^game:/, '놀이 ');
  const L = [(i != null ? (i + 1) + ') ' : '') + hm(r.at) + ' ' + kind + ' ' + Math.round((r.len || 0) / 60) + '분'];
  const rdy = t.rdy != null ? t.rdy : t.ff; if (rdy != null) L.push('첫 조작 ' + rdy + '초');
  if (r.bms) L.push('짓기 ' + r1(r.bms / 1000) + '초' + (t.net != null ? '(받기 끝 ' + t.net + '초)' : ''));
  if (s.p50 != null) L.push('프레임 중앙 ' + s.p50 + 'ms · 느린 5% ' + s.p95 + 'ms' + (s.last95 != null ? '(첫 1분 ' + s.first95 + ' → 끝 1분 ' + s.last95 + ')' : '') + ' · 가장 긴 ' + s.max + 'ms · 100ms 넘음 ' + s.n100 + '번 · 게임 속도 ' + s.spd + '%');
  if (r.gm || r.dpr) L.push((r.gm ? r.gm + ' · ' : '') + '해상도 ' + (r.dpr || '?') + (r.lv ? ' · 단계 ' + r.lv : ''));
  if (r.ctx && (r.ctx[0] || r.ctx[1])) L.push('문맥 잃음 ' + r.ctx[0] + '(이 탭 10분 ' + r.ctx[1] + ')');
  if (r.err && r.err[0]) L.push('오류 ' + r.err[0] + '번(첫: ' + r.err[1] + ')');
  if (r.disc) L.push('메모리로 버려졌다 다시 열림');
  if (r.mem) L.push('힙 ' + r.mem[0] + 'MB(참고)');
  L.push('끝: ' + (ENDK[r.end] || r.end));
  return L.join(' · '); }

export function createDiag(o) {
  const canvas = o.canvas, env = o.env;
  const T0 = Date.now(), id = (T0 % 1e9).toString(36) + Math.random().toString(36).slice(2, 5), q = new URLSearchParams(location.search);
  let prev = readRing();
  const nav = (() => { try { const e = performance.getEntriesByType('navigation')[0]; return e ? e.type : ''; } catch (e) { return ''; } })();
  const okName = s => /^[a-z0-9_-]{1,24}$/i.test(s || '');
  const pg = q.get('town') ? 'town:' + (okName(q.get('town')) ? q.get('town') : '?') : q.get('game') ? 'game:' + (okName(q.get('game')) ? q.get('game') : '?') : q.get('tour') === '1' ? 'tour' : 'school';
  const sw = ['ti', 'q8', 'g3', 'sg8', 'g3fl', 'dpr', 'hq', 'lq', 'aa', 'adapt', 'bench', 'tifail'].filter(k => q.has(k)).map(k => k + '=' + String(q.get(k)).slice(0, 6)).join('&');
  try { if (performance.setResourceTimingBufferSize) performance.setResourceTimingBufferSize(600); } catch (e) {   }
  const R = { v: V, id, at: T0, pg, sw, nav, disc: !!document.wasDiscarded, hw: null, mode: '', gm: '', t: { ff: null, rdy: null, in1: null, net: null, b0: null, b1: null }, bms: null, nres: 0,
    min: [], fm: [], ad: [], dpr: null, lv: 0, ctx: [0, 0], err: [0, ''], safe: null, st: null, mem: null, len: 0, end: 'open', n: 0 };

  const FB = new Float32Array(9000); let fn = 0, fmx = 0, n100 = 0, fgame = 0, freal = 0, lastTs = 0, mStart = 0, hidAt = 0, bld = 0;
  function frame(ts, rd, dt) {
    if (window.SM_BUILD > 0) { bld = 1; lastTs = 0; return; }
    if (bld) { bld = 0; setTimeout(built, 2500); }
    if (!ts || window.SM_HOLD3D > 0) { lastTs = 0; return; }
    if (!lastTs || lastTs < hidAt) { lastTs = ts; if (!mStart) mStart = ts; return; }
    const g = ts - lastTs; lastTs = ts;
    if (fn < FB.length) FB[fn++] = g; if (g > fmx) fmx = g; if (g > 100) n100++;
    if (rd < 1) { freal += rd; fgame += dt; }
    if (ts - mStart >= 60000) roll(ts);
  }
  function roll(ts) { const n = fn;
    if (n >= 20) { const S = FB.subarray(0, n).sort(), p = k => S[Math.min(n - 1, Math.floor(n * k))]; let E = null; try { E = env(); } catch (e) { E = null; }
      R.min.push([Math.round((Date.now() - T0) / 60000), n, r1(p(0.5)), r1(p(0.95)), Math.round(fmx), n100, freal > 0 ? Math.round(fgame / freal * 100) : 100, E ? E.GFX.dpr : null, E ? E.FM.lv : 0]);
      if (R.min.length > MINS) R.min.splice(1, 1); }
    fn = 0; fmx = 0; n100 = 0; fgame = freal = 0; mStart = ts; }

  const in1 = () => { if (R.t.in1 == null) R.t.in1 = sec(performance.now()); removeEventListener('keydown', in1, true); removeEventListener('pointerdown', in1, true); };
  addEventListener('keydown', in1, { capture: true, passive: true }); addEventListener('pointerdown', in1, { capture: true, passive: true });
  function built() { const T = window.SM_TOWN, now = performance.now(); if (!T || !T.load || !(T.load.ms > 0)) return;
    R.bms = Math.round(T.load.ms); R.t.b1 = sec(now - 2500); R.t.b0 = sec(now - 2500 - T.load.ms);
    R.t.rdy = sec(window.SM_T_RDY > 0 && window.SM_T_RDY < now ? window.SM_T_RDY : now - 2500);
    try { const E = performance.getEntriesByType('resource'); let mx = 0; for (const e of E) if (/\/games\//.test(e.name) && e.responseEnd > mx) mx = e.responseEnd; R.t.net = sec(mx); R.nres = E.length; } catch (e) {   }
    save('build'); }

  function fill(why) { R.end = why; R.len = Math.round((Date.now() - T0) / 1000);
    let E = null; try { E = env(); } catch (e) { E = null; }
    if (E) { const { GFX, FM, ADAPT, renderer, TIMING } = E;
      if (!R.hw) { const [os, br] = osBr(); R.hw = { c: navigator.hardwareConcurrency || 0, m: navigator.deviceMemory || 0, gpu: gpuName(renderer), os, br, w: innerWidth, h: innerHeight, dev: Math.round((window.devicePixelRatio || 1) * 100) / 100 }; }
      R.mode = GFX.mode; R.gm = FM.mode + (FM.on ? (FM.q ? '30' : '60') : ''); R.dpr = GFX.dpr; R.lv = FM.lv; R.fm = FM.log.slice(-10); R.ad = ADAPT.log.slice(-10);
      if (TIMING && TIMING.firstFrameMs) R.t.ff = sec(TIMING.firstFrameMs); }
    try { R.ctx[1] = JSON.parse(sessionStorage.getItem('sm-ctxlost') || '[]').filter(t => Date.now() - t < 600000).length; } catch (e) {   }
    try { R.safe = JSON.parse(localStorage.getItem('sm-gfx-safe') || 'null'); } catch (e) { R.safe = null; }
    try { const T = window.SM_TOWN, G = T && T.game && T.game(); if (G && G.st) R.st = { n: G.st.n, ms: Math.round(G.st.ms || 0), max: Math.round(G.st.max || 0), len: G.st.len }; } catch (e) {   }
    try { const m = performance.memory; if (m) R.mem = [Math.round(m.usedJSHeapSize / 1048576), Math.round(m.totalJSHeapSize / 1048576), Math.round(m.jsHeapSizeLimit / 1048576)]; } catch (e) {   }
  }
  let lastW = 0, hidW = 0, gone = false;
  function save(why) { const now = performance.now();
    if (gone && why !== 'hide') return;
    if (why === 'hid') { if (now - hidW < 30000) return; hidW = now; } else if (why !== 'hide' && why !== 'ctx' && now - lastW < 2000) return;
    lastW = now; R.n++;
    try { fill(why); const L = readRing().filter(x => x.id !== id); L.push(R); while (L.length > RING) L.shift();
      try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) { try { localStorage.removeItem(KEY); localStorage.setItem(KEY, JSON.stringify([R])); } catch (e2) { try { localStorage.removeItem(KEY); } catch (e3) {   } } }
    } catch (e) {   } }
  document.addEventListener('visibilitychange', () => { hidAt = performance.now(); if (document.hidden) save('hid'); });
  addEventListener('pagehide', () => { save('hide'); gone = true; }); addEventListener('pageshow', e => { if (e && e.persisted) gone = false; });
  if (canvas) canvas.addEventListener('webglcontextlost', () => { R.ctx[0]++; save('ctx'); }, false);
  const onErr = e => { R.err[0]++; if (R.err[0] === 1) { const m = e && (e.message || (e.reason && (e.reason.message || String(e.reason)))) || '?'; R.err[1] = String(m).slice(0, 90); save('err'); } };
  addEventListener('error', onErr); addEventListener('unhandledrejection', onErr);
  setInterval(() => save('5m'), 300000);

  function get() { fill('look');
    const runs = readRing().filter(x => x.id !== id), last = runs.length ? runs[runs.length - 1] : null;
    const crashes = runs.filter(r => CRASH.has(r.end) || r.end === 'ctx' || (r.ctx && r.ctx[0])).map(r => ({ at: hm(r.at), pg: r.pg, why: ENDK[r.end] || r.end, len: r.len, mem: r.mem ? r.mem[0] : null, ctx: r.ctx ? r.ctx[0] : 0, err: r.err ? r.err[1] : '' }));
    if (R.disc) crashes.push({ at: hm(R.at), pg: R.pg, why: '앞 판이 메모리 부족으로 버려짐(이번 판이 다시 연 것)', len: 0, mem: null, ctx: 0 });
    let town = []; try { town = (JSON.parse(localStorage.getItem('sm-town-stuck') || '[]') || []).slice(-10); } catch (e) { town = []; }
    const SD2 = window.SD2, school = SD2 && SD2.map && SD2.map.stuckLog ? SD2.map.stuckLog.slice(-10) : [];
    return { now: { ...R, sum: sumRun(R) }, last: last ? { ...last, sum: sumRun(last) } : null, runs: runs.map((r, i) => lineOf(r, i)), crashes, stuck: { school, town }, line: lineOf(R) }; }
  function text() { fill('look'); const runs = readRing().filter(x => x.id !== id).concat([R]), hw = R.hw || {};
    const head = '📒 화면 기록(이 기기) · ' + hm(Date.now()) + ' · ' + runs.length + '판\n기기: ' + [hw.os, hw.br, hw.c ? hw.c + '코어' : '', hw.m ? hw.m + 'GB' : '', hw.gpu, (hw.w || '') + '×' + (hw.h || '') + ' ×' + (hw.dev || 1), R.mode].filter(Boolean).join(' · ');
    return head + '\n' + runs.map((r, i) => lineOf(r, i)).join('\n') + '\n---\n' + JSON.stringify(runs); }
  function clear() { prev = []; try { localStorage.removeItem(KEY); localStorage.removeItem('sm-town-stuck'); } catch (e) {   } const SD2 = window.SD2; if (SD2 && SD2.map && SD2.map.stuckLog) SD2.map.stuckLog.length = 0; R.min.length = 0; R.disc = false; R.ctx[0] = 0; return '📒 기록을 비웠어요(이번 판은 다음 쓰기부터 다시 쌓여요)'; }
  return { frame, boot: () => setTimeout(() => save('start'), 2000), get, text, clear, save, R, prevN: () => prev.length };
}
