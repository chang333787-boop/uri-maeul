export const BUS_COL = [{ hex: '#2e9d4f', ink: '#ffffff', ko: '초록', en: 'Green' }, { hex: '#d63a8a', ink: '#ffffff', ko: '분홍', en: 'Pink' }, { hex: '#e0a400', ink: '#2b2420', ko: '노랑', en: 'Yellow' }, { hex: '#7b4fc9', ink: '#ffffff', ko: '보라', en: 'Purple' }];

const hPush = (H, d, u) => { H.push([d, u]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; const t = H[p]; H[p] = H[i]; H[i] = t; i = p; } };
const hPop = H => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; const t = H[m]; H[m] = H[i]; H[i] = t; i = m; } } return top; };

function netOf(G, small) { const NO = G && G.nodes, N = NO ? NO.length : 0; if (!N) return null; const E = [], EK = new Map(), INC = []; for (let i = 0; i < N; i++) INC.push([]);
  G.adj.forEach((L9, a) => { for (const ed of L9 || []) { const b = ed[0]; if (b == null || b === a) continue; const i = Math.min(a, b), j = Math.max(a, b), key = i * N + j, k0 = EK.get(key); if (k0 != null) { if (ed[2]) E[k0].big = 1; continue; } EK.set(key, E.length); INC[i].push(E.length); INC[j].push(E.length); E.push({ a: i, b: j, L: Math.max(0.05, Math.hypot(NO[j][0] - NO[i][0], NO[j][1] - NO[i][1])), big: ed[2] ? 1 : 0 }); } });
  if (!E.length) return null; const W0 = new Float64Array(E.length); for (let k = 0; k < E.length; k++) W0[k] = E[k].big ? 1 : small;
  const snap = s => { let best = null, b2 = null; for (let k = 0; k < E.length; k++) { const e = E[k], A = NO[e.a], B = NO[e.b], dx = B[0] - A[0], dz = B[1] - A[1], L2 = dx * dx + dz * dz || 1; let t = ((s.x - A[0]) * dx + (s.z - A[1]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = A[0] + dx * t, pz = A[1] + dz * t, d = Math.hypot(s.x - px, s.z - pz), q = { e: k, t, x: px, z: pz, d };
      if (!best || d < best.d) best = q; if (s.fx != null && Math.abs((dx * s.fx + dz * s.fz) / Math.sqrt(L2)) < 0.35 && (!b2 || d < b2.d)) b2 = q; }
    return b2 && b2.d < Math.max(25, best.d + 6) ? b2 : best; };
  const dijk = (P, W) => { const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), H = [], e = E[P.e]; dist[e.a] = W[P.e] * e.L * P.t; dist[e.b] = Math.min(dist[e.b], W[P.e] * e.L * (1 - P.t)); prev[e.a] = prev[e.b] = -2; hPush(H, dist[e.a], e.a); hPush(H, dist[e.b], e.b);
    while (H.length) { const [d, u] = hPop(H); if (d > dist[u]) continue; for (const k of INC[u]) { const q = E[k], v = q.a === u ? q.b : q.a, nd = d + W[k] * q.L; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; hPush(H, nd, v); } } }
    return { P, W, dist, prev }; };
  const dTo = (D, Q) => { const e = E[Q.e], W = D.W; let v = Math.min(D.dist[e.a] + W[Q.e] * e.L * Q.t, D.dist[e.b] + W[Q.e] * e.L * (1 - Q.t)); if (Q.e === D.P.e) v = Math.min(v, W[Q.e] * e.L * Math.abs(Q.t - D.P.t)); return v; };
  const pTo = (D, Q) => { const e = E[Q.e], W = D.W, va = D.dist[e.a] + W[Q.e] * e.L * Q.t, vb = D.dist[e.b] + W[Q.e] * e.L * (1 - Q.t); if (Q.e === D.P.e && W[Q.e] * e.L * Math.abs(Q.t - D.P.t) <= Math.min(va, vb) + 1e-9) return [[D.P.x, D.P.z], [Q.x, Q.z]];
    let u = va <= vb ? e.a : e.b; if (!isFinite(D.dist[u])) return null; const nodes = []; while (u >= 0) { nodes.push(u); u = D.prev[u]; } nodes.reverse(); return [[D.P.x, D.P.z], ...nodes.map(n => [NO[n][0], NO[n][1]]), [Q.x, Q.z]]; };

  const dirv = de => { const e = E[de >> 1], s = de & 1 ? -1 : 1; return [(NO[e.b][0] - NO[e.a][0]) * s / e.L, (NO[e.b][1] - NO[e.a][1]) * s / e.L]; }, endN = de => (de & 1 ? E[de >> 1].a : E[de >> 1].b), tc = (h, g, turn) => (h[0] * g[0] + h[1] * g[1] > 0.87 ? 0 : turn);
  const arm = (P, Q, W, turn, pen) => { const S = E.length * 2, dist = new Float64Array(S).fill(Infinity), prev = new Int32Array(S).fill(-1), H = [], he = E[P.e];
    if (Q.e === P.e) return [[P.x, P.z], [Q.x, Q.z]];
    for (const [de, c] of [[P.e * 2, W[P.e] * he.L * (1 - P.t)], [P.e * 2 + 1, W[P.e] * he.L * P.t]]) { const c9 = c + ((pen && pen[endN(de)]) || 0); if (c9 < dist[de]) { dist[de] = c9; prev[de] = -2; hPush(H, c9, de); } }
    while (H.length) { const [d, de] = hPop(H); if (d > dist[de]) continue; const v = endN(de), h = dirv(de); for (const k of INC[v]) { if (k === de >> 1) continue; const d2 = k * 2 + (E[k].a === v ? 0 : 1), nd = d + W[k] * E[k].L + tc(h, dirv(d2), turn); if (nd < dist[d2]) { dist[d2] = nd; prev[d2] = de; hPush(H, nd, d2); } } }
    const q = E[Q.e]; let best = Infinity, bs = -1; for (const [nd, toward, frac] of [[q.a, Q.e * 2, Q.t], [q.b, Q.e * 2 + 1, 1 - Q.t]]) for (const k of INC[nd]) { if (k === Q.e) continue; const de = k * 2 + (E[k].b === nd ? 0 : 1); if (!isFinite(dist[de])) continue; const c = dist[de] + W[Q.e] * q.L * frac + tc(dirv(de), dirv(toward), turn); if (c < best) { best = c; bs = de; } }
    if (bs < 0) return null; const st = []; for (let s = bs; s >= 0; s = prev[s]) st.push(s); st.reverse(); return [[P.x, P.z], ...st.map(s => [NO[endN(s)][0], NO[endN(s)][1]]), [Q.x, Q.z]]; };
  return { NO, N, E, INC, W0, snap, dijk, dTo, pTo, arm }; }

const clean = P => { const Q = [P[0]]; for (let i = 1; i < P.length; i++) if (Math.hypot(P[i][0] - Q[Q.length - 1][0], P[i][1] - Q[Q.length - 1][1]) > 0.05) Q.push(P[i]); return Q; };
const nearPoly = (Q, x, z) => { let bd = Infinity; for (let s = 0; s < Q.length - 1; s++) { const a = Q[s], b = Q[s + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz; if (L2 < 1e-9) continue; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; bd = Math.min(bd, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z)); } return bd; };

function planOnce(G, cands, hubI, o) { const T = netOf(G, o.small || 2); if (!T || !cands || !cands[hubI]) return null; const { E, W0 } = T, SP = cands.map(T.snap), D0 = T.dijk(SP[hubI], W0);
  const R = []; cands.forEach((c, i) => { if (i !== hubI && isFinite(T.dTo(D0, SP[i]))) R.push(i); }); const n = R.length, hx = SP[hubI].x, hz = SP[hubI].z;
  let K = o.K || (n < 10 ? 2 : n > 160 ? 4 : 3); K = Math.max(1, Math.min(K, 4, Math.ceil(n / 2)));

  const AN = [], S9 = [[hx, hz]], dh = i => Math.hypot(SP[i].x - hx, SP[i].z - hz);
  if (o.want && o.want.length) { const WI = []; for (const p of o.want) { let b = -1, bd = Infinity; for (const i of R) { const d = Math.hypot(SP[i].x - p[0], SP[i].z - p[1]); if (d < bd) { bd = d; b = i; } } if (b >= 0 && bd < 400 && !WI.includes(b)) WI.push(b); }
    WI.sort((p, q) => dh(q) - dh(p)); for (const i of WI) { if (AN.length >= 2 * K) break; if (AN.some(a => { const ax = SP[a].x - hx, az = SP[a].z - hz, L2 = ax * ax + az * az || 1, t = ((SP[i].x - hx) * ax + (SP[i].z - hz) * az) / L2; return t > 0 && t < 1.05 && Math.hypot(hx + ax * t - SP[i].x, hz + az * t - SP[i].z) < 160; })) continue; AN.push(i); S9.push([SP[i].x, SP[i].z]); } }
  while (AN.length < Math.min(2 * K, n)) { let b = -1, bd = -1; for (const i of R) { if (AN.includes(i)) continue; let m9 = Infinity; for (const s of S9) m9 = Math.min(m9, Math.hypot(SP[i].x - s[0], SP[i].z - s[1])); if (m9 > bd) { bd = m9; b = i; } } if (b < 0) break; AN.push(b); S9.push([SP[b].x, SP[b].z]); }
  AN.sort((p, q) => Math.atan2(SP[p].z - hz, SP[p].x - hx) - Math.atan2(SP[q].z - hz, SP[q].x - hx)); const half = Math.ceil(AN.length / 2), pairs = []; for (let i = 0; i < half; i++) pairs.push(AN[i + half] != null ? [AN[i], AN[i + half]] : [AN[i]]);
  const used = new Uint8Array(E.length), lines = [], turn = o.turn ?? 60;
  const mark = P => { for (let s = 0; s < P.length - 1; s++) { const mx = (P[s][0] + P[s + 1][0]) / 2, mz = (P[s][1] + P[s + 1][1]) / 2; const q = T.snap({ x: mx, z: mz }); if (q.d < 0.5) used[q.e] = 1; } };

  const goOn = P => { if (P.length < 2) return P; const Q = P[P.length - 1], Pp = P[P.length - 2], l = Math.hypot(Q[0] - Pp[0], Q[1] - Pp[1]); if (l < 1e-6) return P; const dx = (Q[0] - Pp[0]) / l, dz = (Q[1] - Pp[1]) / l, q = T.snap({ x: Q[0], z: Q[1] }); if (q.d > 0.5) return P;
    let k = q.e, ext = null; const pend = []; for (let g = 0; g < 40 && k >= 0; g++) { const e = E[k], A = T.NO[e.a], B = T.NO[e.b], nd = (B[0] - A[0]) * dx + (B[1] - A[1]) * dz > 0 ? e.b : e.a; let far = null, fd = 1; for (const i of R) if (SP[i].e === k) { const pr = (SP[i].x - Q[0]) * dx + (SP[i].z - Q[1]) * dz; if (pr > fd) { fd = pr; far = [SP[i].x, SP[i].z]; } } if (far) ext = pend.concat([far]);
      pend.push([T.NO[nd][0], T.NO[nd][1]]); let k2 = -1; for (const j of T.INC[nd]) { if (j === k) continue; const f = E[j], o9 = f.a === nd ? f.b : f.a, ux = T.NO[o9][0] - T.NO[nd][0], uz = T.NO[o9][1] - T.NO[nd][1]; if ((ux * dx + uz * dz) / (Math.hypot(ux, uz) || 1) > 0.95) { k2 = j; break; } } k = k2; }
    return ext ? P.concat(ext) : P; };
  for (const pr of pairs) { const arms = [];
    for (const a of pr) { const W = new Float64Array(E.length); for (let k = 0; k < E.length; k++) W[k] = W0[k] * (used[k] ? (o.other || 1.5) : 1);
      let pen = null; if (arms.length && arms[0].length > 1) { const he = E[SP[hubI].e], p1 = arms[0][1]; for (const nd of [he.a, he.b]) if (Math.hypot(T.NO[nd][0] - p1[0], T.NO[nd][1] - p1[1]) < 0.5) { pen = {}; pen[nd] = o.pen ?? 350; } }
      const P = T.arm(SP[hubI], SP[a], W, turn, pen) || T.pTo(T.dijk(SP[hubI], W), SP[a]); if (P) { arms.push(P); mark(P); } }
    if (!arms.length) continue; for (let a = 0; a < arms.length; a++) { arms[a] = goOn(arms[a]); mark(arms[a]); } lines.push(clean(arms.length > 1 ? arms[0].slice().reverse().concat(arms[1].slice(1)) : arms[0])); }
  let small = 0, share = 0; const segs = lines.map(Q => Q.slice(1).map((b, i) => [Q[i], b])); segs.forEach((S0, li) => { for (const [a, b] of S0) { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, q = T.snap({ x: mx, z: mz }); if (q.d < 0.5 && !E[q.e].big) small += l; if (Math.hypot(mx - hx, mz - hz) > 400 && segs.some((S1, lj) => lj !== li && S1.some(([c, d]) => Math.hypot((c[0] + d[0]) / 2 - mx, (c[1] + d[1]) / 2 - mz) < 1 && Math.abs(Math.hypot(d[0] - c[0], d[1] - c[1]) - l) < 1))) share += l; } });
  const keep = new Uint8Array(cands.length); SP.forEach((P, i) => { if (i === hubI || lines.some(Q => nearPoly(Q, P.x, P.z) < 1.6)) keep[i] = 1; }); let nk = 0; for (const v of keep) nk += v;
  const reg = (o.want || []).filter(p => lines.some(Q => nearPoly(Q, p[0], p[1]) < 250)).length;
  return { lines, keep, anchors: AN, n: nk, reg, small: Math.round(small), share: Math.round(share), score: nk * 10 + reg * 60 - small * 0.03 - share * 0.01 }; }

export function planBusLines(G, cands, hubI, o = {}) { if (o.K || o.only) return planOnce(G, cands, hubI, o); let best = null;
  const V = []; for (const turn of [40, 90]) for (const other of [1.2, 1.8]) for (const w of o.want && o.want.length ? [1, 0] : [0]) V.push({ ...o, turn, other, want: w ? o.want : null });
  const tryV = v => { const r = planOnce(G, cands, hubI, v); if (r && r.lines.length) { if (o.want) { r.reg = o.want.filter(p => r.lines.some(Q => nearPoly(Q, p[0], p[1]) < 250)).length; r.score = r.n * 10 + r.reg * 60 - r.small * 0.03 - r.share * 0.01; } if (!best || r.score > best.score) best = { ...r, v }; } };
  for (const v of V) tryV(v); if (best && best.n < cands.length * 0.4) for (const v of V) tryV({ ...v, K: 4 }); return best; }

export function makeBusLines(G, stops, hubI, o = {}) { const T = netOf(G, o.small || 2); if (!T || !stops || !stops[hubI]) return null; const SP = stops.map(T.snap);
  let L0 = o.lines; if (!L0) { const P9 = planBusLines(G, stops, hubI, o); L0 = P9 ? P9.lines : []; } const lines = L0.map(Q => Q.map(p => [p[0], p[1]])); const un = [];
  if (!lines.length) lines.push([[SP[hubI].x, SP[hubI].z], [SP[hubI].x + 0.1, SP[hubI].z]]);
  stops.forEach((s, i) => { const P = SP[i]; if (lines.some(Q => nearPoly(Q, P.x, P.z) < 1.6)) return; const D = T.dijk(P, T.W0); if (!isFinite(T.dTo(D, SP[hubI]))) { un.push(i); return; }
    let best = null; lines.forEach((Q, li) => { for (const end of [0, 1]) { const p = end ? Q[Q.length - 1] : Q[0]; if (end === 0 && Q.length > 1 && Math.hypot(p[0] - SP[hubI].x, p[1] - SP[hubI].z) < 0.5) continue; const q = T.snap({ x: p[0], z: p[1] }), d = T.dTo(D, q); if (!best || d < best.d) best = { d, li, end, q }; } });
    if (!best || !isFinite(best.d)) { un.push(i); return; } const ext = T.pTo(T.dijk(best.q, T.W0), P); if (!ext) { un.push(i); return; } const Q = lines[best.li]; lines[best.li] = clean(best.end ? Q.concat(ext.slice(1)) : ext.slice(1).reverse().concat(Q)); });
  const LINES = lines.map(Q => { const cum = [0]; for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1])); return { pts: Q, cum, len: cum[cum.length - 1], st: new Map() }; });
  for (const L of LINES) { const Q = L.pts; SP.forEach((P, i) => { const hits = []; for (let s = 0; s < Q.length - 1; s++) { const a = Q[s], b = Q[s + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz; if (L2 < 1e-9) continue; let t = ((P.x - a[0]) * dx + (P.z - a[1]) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(a[0] + dx * t - P.x, a[1] + dz * t - P.z) < 1.6) hits.push(L.cum[s] + t * Math.sqrt(L2)); }
      if (!hits.length) return; hits.sort((p, q) => p - q); const occ = [hits[0]]; for (const h of hits) if (h - occ[occ.length - 1] > 8) occ.push(h); L.st.set(i, occ); }); }
  const keepL = LINES.filter(L => L.st.size > 1 || (L.st.size === 1 && LINES.length === 1)); keepL.sort((p, q) => q.st.size - p.st.size || q.len - p.len);
  const stopsOut = SP.map(P => ({ x: P.x, z: P.z, e: P.e, d: P.d, lines: [] }));
  keepL.forEach((L, k) => { const c = BUS_COL[k % BUS_COL.length]; L.no = k + 1; L.hex = c.hex; L.ink = c.ink; L.ko = c.ko; L.en = c.en; for (const [i] of L.st) stopsOut[i].lines.push(k); });
  return { lines: keepL, stops: stopsOut, hub: hubI, un, K: keepL.length }; }

export function busRide(B, li, a, b) { const L = B && B.lines[li]; if (!L) return null; const A = L.st.get(a), Z = L.st.get(b); if (!A || !Z) return null; let r = null; for (const x of A) for (const y of Z) if (!r || Math.abs(y - x) < Math.abs(r[1] - r[0])) r = [x, y]; return r; }

export function busPlan(B, a, b) { if (!B || a === b) return []; const SA = B.stops[a], SB = B.stops[b]; if (!SA || !SB || !SA.lines.length || !SB.lines.length) return [];
  let best = null; for (const li of SA.lines) { if (!SB.lines.includes(li)) continue; const r = busRide(B, li, a, b); if (!r) continue; const len = Math.abs(r[1] - r[0]); if (!best || len < best.len) best = { legs: [{ li, a, b }], len }; } if (best) return [best];
  const C9 = []; for (const la of SA.lines) for (const lb of SB.lines) { if (la === lb) continue; for (const [t] of B.lines[la].st) { if (t === a || t === b || !B.lines[lb].st.has(t)) continue; const r1 = busRide(B, la, a, t), r2 = busRide(B, lb, t, b); if (!r1 || !r2) continue; C9.push({ legs: [{ li: la, a, b: t }, { li: lb, a: t, b }], len: Math.abs(r1[1] - r1[0]) + Math.abs(r2[1] - r2[0]), t }); } }
  C9.sort((p, q) => p.len - q.len); const out = []; for (const c of C9) { if (out.length >= 2) break; if (out.length && c.len > out[0].len * 1.8 + 200) break; if (out.some(r => r.t === c.t || Math.hypot(B.stops[r.t].x - B.stops[c.t].x, B.stops[r.t].z - B.stops[c.t].z) < 60)) continue; out.push(c); } return out; }

export function busLeg(B, li, a, b) { const r = busRide(B, li, a, b); if (!r) return null; const L = B.lines[li], P = L.pts, cum = L.cum, lo = Math.min(r[0], r[1]), hi = Math.max(r[0], r[1]);
  const at = s => { let i = 0; while (i < cum.length - 2 && cum[i + 1] < s) i++; const l = cum[i + 1] - cum[i] || 1, u = Math.max(0, Math.min(1, (s - cum[i]) / l)); return [i, [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u]]; };
  const [i0, p0] = at(lo), [i1, p1] = at(hi), out = [p0]; for (let i = i0 + 1; i <= i1; i++) if (Math.hypot(P[i][0] - out[out.length - 1][0], P[i][1] - out[out.length - 1][1]) > 0.05) out.push(P[i]); if (Math.hypot(p1[0] - out[out.length - 1][0], p1[1] - out[out.length - 1][1]) > 0.05) out.push(p1); else if (out.length === 1) out.push(p1);
  return r[1] < r[0] ? out.reverse() : out; }
