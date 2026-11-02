const isHan = c => c >= 0xac00 && c <= 0xd7a3, isDig = c => c >= 0x30 && c <= 0x39, isLat = c => (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
export function readN(t) { let n = 0, e = 0; for (const ch of String(t || '')) { const c = ch.codePointAt(0); if (isHan(c) || isDig(c)) n++; else if (isLat(c)) e++; } return n + e / 3; }
export const READ_MAX = 12;
export function readSec(t) { const s = String(t || ''); return Math.min(READ_MAX, 1.5 + readN(s) / 5.5 + (/\d/.test(s) ? 1 : 0)); }

export const infoOf = t => /\d|[동서남북]쪽|→|\b(north|south|east|west)\b/i.test(String(t || ''));

export function createLineQ(o) {
  const Q = [], st = { put: 0, now: 0, wait: 0, drop: 0, same: 0, back: 0 }; let cur = null, h = 0;
  const T = () => performance.now(), held = () => !!(o.hold && o.hold());
  const curLeft = n => { if (!cur) return 0; if (!o.vis()) { cur = null; return 0; } return Math.max(0, cur.t0 + cur.min - n); };
  function show(q, n) { cur = { t: q.t, t0: n, min: q.min, end: n + q.dur * 1000, info: q.info }; o.show(q.t, q.dur); }
  function back(n) { const lf = curLeft(n); if (!cur || lf < 500 || !cur.info || Q.some(q => q.t === cur.t)) return; Q.unshift({ t: cur.t, dur: Math.max(lf, cur.end - n) / 1000, min: lf, at: n, info: cur.info }); st.back++; while (Q.length > (o.cap || 4)) { Q.pop(); st.drop++; } }
  function arm(ms) { if (h) clearTimeout(h); h = setTimeout(pump, Math.max(60, ms)); }
  function pump() { h = 0; const n = T(); while (Q.length && n - Q[0].at > (Q[0].info ? (o.maxAge || 20000) : (o.maxAge2 || 8000))) { Q.shift(); st.drop++; } if (!Q.length) return; if (held()) { arm(400); return; } const w = curLeft(n); if (w > 0) { arm(w + 40); return; } show(Q.shift(), n); if (Q.length) arm(cur.min + 40); }
  function put(t, sec, info) { if (t == null || t === '') return; t = String(t); info = !!info || infoOf(t); const n = T(), dur = Math.max(+sec || 0, readSec(t)), min = Math.min(dur, o.protect ? o.protect(t, dur, info) : readSec(t)) * 1000; st.put++;
    if (cur && cur.t === t && n < cur.end && o.vis()) { st.same++; show({ t, dur, min, info }, n); return; }
    if (Q.some(q => q.t === t)) { st.same++; return; }
    const q = { t, dur, min, at: n, info };
    if (o.cut && !held()) { back(n); st.now++; show(q, n); if (Q.length) arm(min + 40); return; }
    const ahead = info ? Q.filter(q9 => q9.info).length : Q.length;
    if (!ahead && !held() && (curLeft(n) <= 0 || (info && cur && !cur.info))) { st.now++; show(q, n); if (Q.length) arm(min + 40); return; }
    if (info) { const k = Q.findIndex(q9 => !q9.info); if (k >= 0) Q.splice(k, 0, q); else Q.push(q); } else Q.push(q); st.wait++; while (Q.length > (o.cap || 4)) { Q.shift(); st.drop++; } if (!h) arm(held() ? 400 : curLeft(n) + 40); }

  const left = () => { const n = T(); return curLeft(n) + Q.reduce((a, q) => a + q.min, 0); };
  return { put, left, busy: () => left() > 0, stat: () => ({ ...st, q: Q.length, cur: cur ? cur.t : '', left: Math.round(left()) }), clear() { Q.length = 0; if (h) clearTimeout(h); h = 0; cur = null; } };
}
