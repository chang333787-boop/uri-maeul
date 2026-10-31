export const S = 0.3, OX = 6, OZ = 8;
export const RECT = [-90, -90, 64, 66];
const IX0 = -321, IZ0 = -328, NW = 518, NH = 525;
const DX = [1, -1, 0, 0], DZ = [0, 0, 1, -1];

export function* buildGen(q, o = {}) {
  const jump = o.jump || false, maxPops = o.maxPops || 900000, rec = o.recordBlocked ?? !jump;
  let cap = 262144, n = 0;
  let ix = new Int16Array(cap), iz = new Int16Array(cap), y = new Float32Array(cap), yb = new Int8Array(cap), next = new Int32Array(cap), e = new Int32Array(cap * 4).fill(-1);
  const colHead = new Int32Array(NW * NH).fill(-1);
  let stack = new Int32Array(65536), sp = 0, blocked = rec ? new Int32Array(65536) : null, nb = 0;
  const grow = () => {
    const c2 = Math.floor(cap * 1.5);
    const g = (A, k = 1) => { const B = new A.constructor(c2 * k); B.set(A); return B; };
    ix = g(ix); iz = g(iz); y = g(y); yb = g(yb); next = g(next); const e2 = new Int32Array(c2 * 4).fill(-1); e2.set(e); e = e2; cap = c2;
  };
  const col = (cix, ciz) => (cix - IX0) * NH + (ciz - IZ0);
  const add = (cix, ciz, gy, b) => {
    if (n >= cap) grow();
    ix[n] = cix; iz[n] = ciz; y[n] = gy; yb[n] = b; const c = col(cix, ciz); next[n] = colHead[c]; colHead[c] = n; return n++;
  };
  const find = (cix, ciz, b) => { for (let i = colHead[col(cix, ciz)]; i >= 0; i = next[i]) if (yb[i] === b) return i; return -1; };
  const push = v => { if (sp >= stack.length) { const s2 = new Int32Array(stack.length * 2); s2.set(stack); stack = s2; } stack[sp++] = v; };
  const sy = q.groundAt(OX, OZ, 2);
  push(add(0, 0, sy, Math.round(sy * 2)));
  const modes = jump === 'both' ? [[0, 0.55], [0.97, 1.5]] : jump ? [[0.97, 1.5]] : [[0, 0.55]];
  let pops = 0;
  while (sp && pops < maxPops) {
    const c = stack[--sp]; pops++;
    const cix = ix[c], ciz = iz[c], cy = y[c];
    for (let d = 0; d < 4; d++) {
      const nix = cix + DX[d], niz = ciz + DZ[d], nx = OX + nix * S, nz = OZ + niz * S;
      if (nx < RECT[0] || nx > RECT[2] || nz < RECT[1] || nz > RECT[3]) continue;
      for (let m = 0; m < modes.length; m++) {
        const [JY, UP] = modes[m];
        if (q.blockedAt(nx, nz, cy + JY)) { if (rec && m === 0) { if (nb >= blocked.length) { const b2 = new Int32Array(blocked.length * 2); b2.set(blocked); blocked = b2; } blocked[nb++] = c * 4 + d; } continue; }
        const g = q.groundAt(nx, nz, cy + JY);
        if (g > cy + UP) continue;
        const b = Math.round(g * 2);
        let j = find(nix, niz, b);
        if (j < 0) { j = add(nix, niz, g, b); push(j); }
        e[c * 4 + d] = j;
        break;
      }
    }
    if ((pops & 511) === 0) yield pops;
  }
  return finish({ n, ix, iz, y, yb, next, e, colHead, pops, jump, blocked: rec ? blocked.subarray(0, nb) : null });
}
export function buildSync(q, o = {}) { const g = buildGen(q, o); let r; while (!(r = g.next()).done); return r.value; }

export function buildSliced(q, o = {}, sliceMs = 6, ctl = null) { return sliced(buildGen(q, o), sliceMs, ctl); }

export function sliced(g, sliceMs = 6, ctl = null) {
  return new Promise((res, rej) => {
    const ric = typeof requestIdleCallback === 'function';
    const run = dl => { try {
        const t0 = performance.now(), idle = ctl && ctl.idle, lim = idle ? Math.max(1, Math.min(8, dl && dl.timeRemaining ? dl.timeRemaining() - 1 : 8)) : sliceMs;
        for (;;) { const r = g.next(); if (r.done) return res(r.value); if (performance.now() - t0 > lim) break; }
        if (ctl && ctl.onSlice) ctl.onSlice();
        if (ctl && ctl.idle && ric) requestIdleCallback(run, { timeout: 500 }); else requestAnimationFrame(() => run());
      } catch (err) { rej(err); } };
    if (ctl && ctl.idle && ric) requestIdleCallback(run, { timeout: 500 }); else run();
  });
}

function finish(B) {
  const n = B.n, ix = B.ix.subarray(0, n), iz = B.iz.subarray(0, n), y = B.y.subarray(0, n), yb = B.yb.subarray(0, n), next = B.next.subarray(0, n), e = B.e.subarray(0, n * 4), colHead = B.colHead;
  const col = (cix, ciz) => (cix < IX0 || ciz < IZ0 || cix >= IX0 + NW || ciz >= IZ0 + NH) ? -1 : (cix - IX0) * NH + (ciz - IZ0);
  const X = i => OX + ix[i] * S, Z = i => OZ + iz[i] * S;

  let rev = null;
  const revCSR = () => {
    if (rev) return rev;
    const cnt = new Int32Array(n + 1);
    const each = f => { for (let i = 0; i < n; i++) for (let d = 0; d < 4; d++) { const j = e[i * 4 + d]; if (j >= 0) f(i, j); } };
    each((i, j) => cnt[j + 1]++);
    for (let i = 0; i < n; i++) cnt[i + 1] += cnt[i];
    const pred = new Int32Array(cnt[n]), fill = cnt.slice(0, n);
    each((i, j) => { pred[fill[j]++] = i; });
    return (rev = { cnt, pred });
  };
  const back = () => {
    const { cnt, pred } = revCSR(), ok = new Uint8Array(n), st = new Int32Array(n); let sp = 0; ok[0] = 1; st[sp++] = 0;
    while (sp) { const v = st[--sp]; for (let p = cnt[v]; p < cnt[v + 1]; p++) { const u = pred[p]; if (!ok[u]) { ok[u] = 1; st[sp++] = u; } } }
    return ok;
  };
  const N = {
    S, ox: OX, oz: OZ, count: n, start: 0, pops: B.pops, jump: B.jump, ix, iz, y, e, blockedEdges: B.blocked,
    zone: null, inSchool: null, clr: null, canReturn: null, traps: 0, mask: new Uint8Array(n),
    X, Z, pos: i => [X(i), y[i], Z(i)],

    find(cix, ciz, b) { const c = col(cix, ciz); if (c < 0) return -1; for (let i = colHead[c]; i >= 0; i = next[i]) if (yb[i] === b) return i; return -1; },

    snap(x, yy, z, maxR = 1.5, lo = -0.6, hi = 1.6) {
      const bx = Math.round((x - OX) / S), bz = Math.round((z - OZ) / S), R = Math.ceil(maxR / S);
      let best = -1, bd = 1e9;
      for (let r = 0; r <= R; r++) {
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const c = col(bx + dx, bz + dz); if (c < 0) continue;
          for (let i = colHead[c]; i >= 0; i = next[i]) {
            const dy = yy - y[i]; if (!(dy > lo && dy < hi)) continue;
            const px = X(i) - x, pz = Z(i) - z, d2 = px * px + pz * pz; if (d2 > maxR * maxR) continue;
            const s2 = d2 + dy * dy * 4; if (s2 < bd) { bd = s2; best = i; }
          }
        }
        if (best >= 0 && (r - 1) * S > Math.sqrt(bd)) break;
      }
      return best;
    },

    finish(zoneFn, inFn) { const g = N.finishGen(zoneFn, inFn); let r; while (!(r = g.next()).done); return r.value; },

    *finishGen(zoneFn, inFn) {
      const zn = new Int16Array(n), ins = new Uint8Array(n);
      for (let i = 0; i < n; i++) { const x = X(i), z = Z(i); zn[i] = zoneFn ? zoneFn(x, y[i], z) : -1; ins[i] = inFn ? (inFn(x, z) ? 1 : 0) : 1; if ((i & 2047) === 2047) yield i; }
      N.zone = zn; N.inSchool = ins;

      const clr = new Uint8Array(n).fill(20), qq = new Int32Array(n); let h = 0, t = 0;
      for (let i = 0; i < n; i++) { let k = 0; for (let d = 0; d < 4; d++) if (e[i * 4 + d] >= 0) k++; if (k < 4) { clr[i] = 0; qq[t++] = i; } }
      while (h < t) { const v = qq[h++], cv = clr[v] + 1; if (cv >= 20) continue; for (let d = 0; d < 4; d++) { const j = e[v * 4 + d]; if (j >= 0 && clr[j] > cv) { clr[j] = cv; qq[t++] = j; } } }
      N.clr = clr; yield n;
      N.canReturn = back(); let tr = 0; for (let i = 0; i < n; i++) if (!N.canReturn[i]) tr++; N.traps = tr;
      return N;
    },

    block(rect) {
      const list = [];
      if (typeof rect === 'function') { for (let i = 0; i < n; i++) if (rect(i)) { N.mask[i]++; list.push(i); } }
      else {
        const a0 = Math.ceil((rect[0] - OX) / S - 1e-9), a1 = Math.floor((rect[2] - OX) / S + 1e-9), b0 = Math.ceil((rect[1] - OZ) / S - 1e-9), b1 = Math.floor((rect[3] - OZ) / S + 1e-9);
        for (let cx = a0 - 1; cx <= a1 + 1; cx++) for (let cz = b0 - 1; cz <= b1 + 1; cz++) { const c = col(cx, cz); if (c < 0) continue;
          for (let i = colHead[c]; i >= 0; i = next[i]) { const x = X(i), z = Z(i); if (x >= rect[0] && x <= rect[2] && z >= rect[1] && z <= rect[3]) { N.mask[i]++; list.push(i); } } } }
      return { remove() { for (const i of list) if (N.mask[i]) N.mask[i]--; list.length = 0; } };
    },
    path(a, b, opt = {}) { return astar(a, b, opt); },

    random(opt = {}) {
      const rng = opt.rng || Math.random, mc = opt.minClear ?? 2, far = opt.farFrom || [], f = opt.filter, pool = opt.pool;
      const cand = [];
      for (let pi = 0, pn = pool ? pool.length : n; pi < pn; pi++) { const i = pool ? pool[pi] : pi;
        if (N.mask[i] || (N.clr && N.clr[i] < mc) || (!opt.allowOutside && N.inSchool && !N.inSchool[i]) || (N.canReturn && !N.canReturn[i])) continue;
        if (f && !f(i)) continue;
        let ok = true; for (const p of far) { const dx = X(i) - p.x, dz = Z(i) - p.z; if (dx * dx + dz * dz < p.r * p.r) { ok = false; break; } }
        if (ok) cand.push(i);
      }
      return cand.length ? cand[Math.floor(rng() * cand.length)] : -1;
    },

    distField(a, maxLen = 1e9) {
      const D = new Float32Array(n).fill(Infinity); if (a < 0) return D;
      heapReset(); D[a] = 0; hpush(a, 0);
      while (hn) { const c = hpop(); const dc = D[c]; if (hkey > dc) continue; if (dc > maxLen) break;
        for (let d = 0; d < 4; d++) { const j = e[c * 4 + d]; if (j < 0 || N.mask[j]) continue; const nd = Math.fround(dc + S + Math.abs(y[j] - y[c]) * 0.5); if (nd < D[j]) { D[j] = nd; hpush(j, nd); } } }
      return D;
    },
    export() { return { v: 1, S, ox: OX, oz: OZ, n, ix, iz, y, e, zone: N.zone, clr: N.clr, inSchool: N.inSchool }; },
  };

  const gS = new Float32Array(n), came = new Int32Array(n), stamp = new Uint32Array(n), closed = new Uint32Array(n); let run = 0;
  let heap = new Int32Array(1024), hf = new Float32Array(1024), hn = 0, hkey = 0;
  const heapReset = () => { hn = 0; };
  const hpush = (i, f) => { if (hn >= heap.length) { const a = new Int32Array(heap.length * 2), b = new Float32Array(heap.length * 2); a.set(heap); b.set(hf); heap = a; hf = b; }
    let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; heap[k] = heap[p]; hf[k] = hf[p]; k = p; } heap[k] = i; hf[k] = f; };
  const hpop = () => { const top = heap[0]; hkey = hf[0]; const li = heap[--hn], lf = hf[hn]; let k = 0;
    for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && hf[c + 1] < hf[c]) c++; if (hf[c] >= lf) break; heap[k] = heap[c]; hf[k] = hf[c]; k = c; } heap[k] = li; hf[k] = lf; return top; };
  function astar(a, b, opt) {
    if (a < 0 || b < 0) return { ok: false, reason: 'snap', pts: [], len: 0, nodes: [] };
    const maxExp = opt.maxExp || 150000, bad = opt.bad, cost = opt.cost, out = !!opt.allowOutside;
    run++; heapReset(); let exp = 0;
    const bx = ix[b], bz = iz[b], by = y[b];
    const H = i => (Math.abs(ix[i] - bx) + Math.abs(iz[i] - bz)) * S + Math.abs(y[i] - by) * 0.5;
    stamp[a] = run; gS[a] = 0; came[a] = -1; hpush(a, H(a));
    while (hn) {
      const c = hpop(); if (closed[c] === run) continue; closed[c] = run; exp++;
      if (c === b) {
        const nodes = []; for (let i = b; i !== -1; i = came[i]) nodes.push(i); nodes.reverse();
        const keep = opt.smooth === false ? nodes : smooth(nodes);
        return { ok: true, len: gS[b], exp, nodes, pts: keep.map(i => [+X(i).toFixed(2), +y[i].toFixed(2), +Z(i).toFixed(2)]) };
      }
      if (exp > maxExp) return { ok: false, reason: 'limit', exp, pts: [], len: 0, nodes: [] };
      for (let d = 0; d < 4; d++) {
        const j = e[c * 4 + d]; if (j < 0 || closed[j] === run || N.mask[j]) continue;
        if (!out && N.inSchool && !N.inSchool[j] && j !== b) continue;
        if (bad && bad(j)) continue;
        const ng = gS[c] + (S + Math.abs(y[j] - y[c]) * 0.5) * (cost ? cost(j) : 1);
        if (stamp[j] !== run || ng < gS[j]) { stamp[j] = run; gS[j] = ng; came[j] = c; hpush(j, ng + H(j)); }
      }
    }
    return { ok: false, reason: 'unreachable', exp, pts: [], len: 0, nodes: [] };
  }

  function lineOK(a, b) {
    let i = a; const dx = ix[b] - ix[a], dz = iz[b] - iz[a], sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1, ax = Math.abs(dx), az = Math.abs(dz);
    let tx = ax ? 0.5 / ax : Infinity, tz = az ? 0.5 / az : Infinity; const ddx = ax ? 1 / ax : Infinity, ddz = az ? 1 / az : Infinity;
    for (let k = ax + az; k > 0; k--) {
      let d; if (tx < tz) { tx += ddx; d = sx > 0 ? 0 : 1; } else { tz += ddz; d = sz > 0 ? 2 : 3; }
      const j = e[i * 4 + d]; if (j < 0 || N.mask[j] || Math.abs(y[j] - y[i]) > 0.35) return false; i = j;
    }
    return i === b;
  }
  function smooth(p) {
    if (p.length < 3) return p.slice();
    const out = [p[0]]; let k = 0;
    while (k < p.length - 1) { let far = k + 1; for (let m = Math.min(p.length - 1, k + 400); m > k + 1; m--) if (lineOK(p[k], p[m])) { far = m; break; } out.push(p[far]); k = far; }
    return out;
  }
  return N;
}
