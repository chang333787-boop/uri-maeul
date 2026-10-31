export const RHY_V = 1;

export const LVS = {
  1: { bpm: 66, rows: 3, tw: null, K: 11, name: ['느린 논', 'Slow paddy'] },
  2: { bpm: 78, rows: 4, tw: 'pp', K: 18, name: ['보통 논', 'Steady paddy'] },
  3: { bpm: 90, rows: 4, tw: 'rest', K: 11, name: ['바쁜 논', 'Busy paddy'] },
  4: { bpm: 90, rows: 4, tw: 'mix', K: 15, name: ['장인 시험', 'Master test'] } };
export const GOOD = 0.32, GOOD_PP = 0.30, WIN = 0.6;

export const CALLS = [
  ['c5 c5 d5 c5 a4 c5 a4 -', '이 논배미 모를 심어', 'Plant the seedlings in this paddy'],
  ['e5 - d5 c5 d5 c5 a4 -', '줄 맞춰서 꽂아 보세', 'Line them up along the rope'],
  ['a4 c5 d5 e5 d5 c5 a4 -', '해가 떴네 모를 심세', 'The sun is up, let us plant'],
  ['d5 d5 c5 a4 c5 a4 g4 -', '한 줄 넘겨 뒤로 가세', 'One row done, step back now']];
export const RAIN_CALL = ['d5 c5 a4 c5 d5 e5 d5 -', '비가 오니 물이 좋다', 'Rain is here, the water is good'];
export const RESP = 'e5 - d5 c5 d5 - c5 a4 c5 - a4 c5 a4 g4 e4 -';
export const RESP2 = 'a4 - - - a4 - - - e4 - - - e4 - - -';
const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export const midi = s => { const m = /^([a-g])(\d)$/.exec(s); return m ? 12 * (+m[2] + 1) + PC[m[1]] : null; };
export function cells(str) { const out = []; let cur = null; str.trim().split(/\s+/).forEach((t, i) => { if (t === '-') { if (cur) cur[2]++; } else if (t === '.') cur = null; else { cur = [i, midi(t), 1]; out.push(cur); } }); return out; }

export const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const today = (d = new Date()) => '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

export function rhyPlan(lv, seed = 0, o = {}) {
  const L = LVS[lv] || LVS[1], beat = 60 / L.bpm, rows = [], slots = [], R = { s: seed >>> 0 || 1 }, rnd = () => ((R.s = (Math.imul(R.s, 1103515245) + 12345) >>> 0) / 4294967296);
  let kinds = Array(L.rows).fill(L.tw === 'pp' ? 'pp' : L.tw === 'rest' ? 'rest' : 'n');
  if (L.tw === 'mix') { kinds = ['pp', 'rest', 'pp', 'rest']; for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; } }
  const song = o.first ? 0 : ((o.song ?? seed) >>> 0) % CALLS.length;
  for (let r = 0; r < L.rows; r++) { const b0 = 4 + r * 12, kind = kinds[r], rb = kind === 'pp' ? [0, 2, 4, 5, 6] : [0, 2, 4, 6];
    const call = o.rain && !o.first && r === 1 ? -1 : (song + r) % CALLS.length; rows.push({ b0, t0: b0 * beat, call, kind, n: 0 }); let col = 0;
    for (const q of rb) { const t = (b0 + 4 + q) * beat, rest = kind === 'rest' && q === 4, k = rest ? 'rest' : kind === 'pp' && (q === 5 || q === 6) ? 'pp' : 'p'; slots.push({ t, k, row: r, col: rest ? -1 : col, A: WIN, G: GOOD }); if (!rest) { col++; rows[r].n++; } } }
  for (let i = 0; i < slots.length; i++) { const s = slots[i], g0 = i > 0 ? s.t - slots[i - 1].t : 9, g1 = i < slots.length - 1 ? slots[i + 1].t - s.t : 9; s.A = Math.min(WIN, Math.min(g0, g1) / 2); if (s.A < WIN - 1e-6) s.G = GOOD_PP; }
  const len = (4 + L.rows * 12) * beat;
  return { lv, bpm: L.bpm, beat, rows, slots, len, n: slots.filter(s => s.k !== 'rest').length, song, rain: !!o.rain };
}

export const rhyJudge = (slot, o) => (Math.abs(o) <= slot.G ? 's' : Math.abs(o) <= slot.A ? 'c' : null);

export function rhyRun(plan, presses) { const R = plan.slots.map(() => null); let rh = 0, st = 0, j = 0; const P = presses.slice().sort((a, b) => a - b);
  for (const tp of P) { while (j < plan.slots.length && plan.slots[j].t + plan.slots[j].A < tp) j++; const s = plan.slots[j]; if (!s || tp < s.t - s.A || R[j] != null) { st++; continue; }
    if (s.k === 'rest') { R[j] = 'h'; rh++; continue; } R[j] = rhyJudge(s, tp - s.t) || 'x'; }
  return rhyRes(plan, R, rh, st); }
export function rhyRes(plan, R, rh, st = 0) { let s = 0, c = 0, x = 0, ppA = true; plan.slots.forEach((q, i) => { if (q.k === 'rest') return; const r = R[i]; if (r === 's') s++; else if (r === 'c') c++; else x++; if (q.k === 'pp' && r !== 's') ppA = false; }); return { n: plan.n, s, c, x, rh, st, ppA, R }; }
export const strayMax = n => Math.ceil(n / 3);

export function rhyStars(lv, res, quit) { if (quit) return 0; const L = LVS[lv] || LVS[1]; if (res.s < L.K || (res.st | 0) > strayMax(res.n)) return 1;
  if (lv === 1) return res.s >= res.n ? 3 : 2; if (lv === 2) return res.ppA && res.s >= res.n - 1 ? 3 : 2; if (lv === 3) return res.rh === 0 && res.s >= res.n ? 3 : 2; return res.rh === 0 && res.ppA && res.s >= res.n - 1 ? 3 : 2; }

export function rhySim(lv, N = 20000, seed = 7, o = {}) { let S = seed >>> 0; const rnd = () => ((S = (Math.imul(S, 1664525) + 1013904223) >>> 0) / 4294967296), gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * rnd()); };
  const st = [0, 0, 0, 0]; for (let g = 0; g < N; g++) { const plan = rhyPlan(lv, Math.floor(rnd() * 1e9)), mu = 0.04 + rnd() * 0.18, sd = 0.08 + rnd() * 0.08, pr = rnd() * 0.12, P = []; let k = 0;
    for (const s of plan.slots) { if (s.k === 'rest') { if (rnd() < pr) P.push(s.t + mu * 0.6 + gauss() * sd); continue; } if (rnd() < (o.miss ?? 0.1)) { k++; continue; } P.push(s.t + mu * (k < 3 ? 1 : 0.6) + gauss() * sd); k++; }
    st[rhyStars(lv, rhyRun(plan, P))]++; }
  return { n: N, s1: (st[1] + st[2] + st[3]) / N, s2: (st[2] + st[3]) / N, s3: st[3] / N }; }

export function rhyMash(lv, iv, N = 2000, seed = 11) { let S = seed >>> 0; const rnd = () => ((S = (Math.imul(S, 1664525) + 1013904223) >>> 0) / 4294967296); let s2 = 0, callHit = 0;
  for (let g = 0; g < N; g++) { const plan = rhyPlan(lv, Math.floor(rnd() * 1e9)), P = []; for (let t = rnd() * iv; t < plan.len; t += iv) P.push(t); const res = rhyRun(plan, P); if (rhyStars(lv, res) >= 2) s2++;
    for (const r of plan.rows) { const c0 = r.t0, c1 = r.t0 + 4 * plan.beat; for (const tp of P) if (tp >= c0 && tp < c1 - WIN) callHit += plan.slots.some(s => Math.abs(tp - s.t) <= s.A) ? 1 : 0; } }
  return { s2: s2 / N, callPlants: callHit }; }

export function rhyEvents(plan, o = {}) { const ev = [], b = plan.beat, e8 = b / 2, lv = plan.lv;
  for (let i = 0; i < 4; i++) ev.push({ t: i * b, ch: 'dk', d: 'G', v: i ? 0.34 : 0.46 });
  for (const r of plan.rows) { const C = r.call < 0 ? RAIN_CALL : CALLS[r.call];
    for (const [s, m, l] of cells(C[0])) ev.push({ t: r.t0 + s * e8, ch: 'lead', i: 'voice', m, l: l * e8 * 0.95, v: s === 0 ? 0.1 : 0.088 });
    const rt = r.t0 + 4 * b; for (const [s, m, l] of cells(RESP)) ev.push({ t: rt + s * e8, ch: 'r1', i: 'choir', m, l: l * e8 * 0.95, v: s % 4 === 0 ? 0.085 : 0.07 });
    for (const [s, m, l] of cells(RESP2)) ev.push({ t: rt + s * e8, ch: 'r2', i: 'choir', m, l: l * e8 * 0.96, v: 0.045 });
    if (!o.master) { if (lv === 1) { for (const q of [0, 2, 4, 6]) ev.push({ t: rt + q * b, ch: 'dk', d: 'G', v: q ? 0.26 : 0.34 }); } else for (const q of [0, 4]) ev.push({ t: rt + q * b, ch: 'dk', d: 'G', v: 0.3 }); }
    else ev.push({ t: r.t0, ch: 'dk', d: 'G', v: 0.3 });
    if (r.kind === 'rest') ev.push({ t: rt + 3.1 * b, ch: 'lead', i: 'shout', m: 76, l: b * 0.85, v: 0.085 }); }
  ev.push({ t: plan.len, ch: 'dk', d: 'G', v: 0.38 }); return ev; }

const TX = {
  task: ['할 일: 일꾼이 손을 내릴 때 같이 꽂아요', 'Task: plant when the worker lowers a hand'],
  taskM: ['할 일: 소리를 듣고 같이 꽂아요', 'Task: listen and plant together'],
  hi: [['자, 소리 맞춰 심어 봐요.', 'Let us plant along with the song.'], ['소리에 맞춰 같이 꽂아요.', 'Plant with the song, together.'], ['오늘도 줄 맞춰 심어 볼까요?', 'Shall we plant in a straight row today?']],
  reg: ['지난번에도 같이 했지요? 오늘도 잘 부탁해요.', 'You helped last time too. Thanks again!'],
  busy: ['모내기 중이에요', 'Planting rice now'],
  quit: ['다음에 또 해요.', 'See you next time.'],
  again: ['한 번 더', 'Again'], plant: ['꽂기', 'Plant'],
  up: { 2: ['이제 보통 논도 같이 해요. 받는 소리 끝에 두 포기를 꽂을 때가 있어요.', 'Now the steady paddy. Sometimes we plant two at the end.'], 3: ['이제 바쁜 논이에요. 못줄을 머리 위로 들면 한 박 쉬어요.', 'Now the busy paddy. When the rope goes up, skip one beat.'] },
  easy: ['느린 논에서 한 번 해 볼까요? E를 누르면 느린 논으로 해요.', 'Want to try the slow paddy? Press E.'],
  inv: ['오늘은 나 없이 소리만 듣고 해 볼래요? E를 누르면 시작해요.', 'Today, try it with only the song? Press E to start.'],
  master: ['내 못줄을 받았어요. 이제 이 논배미는 내 논배미예요.', 'You got your own planting rope. This paddy row is yours now.'],
  masterNo: ['아쉬워요. 내일 다시 해 봐요.', 'So close. Try again tomorrow.'],
  fact: [['모는 못줄에 맞춰 줄지어 심어요. 그래야 바람이 잘 통하고 김매기가 쉬워요.', 'Seedlings go in rows along a rope, so air flows and weeding is easy.'],
    ['여럿이 모를 심을 때 한 사람이 메기고 모두 받으며 노래로 손을 맞췄어요.', 'When many people planted, one sang a line and all answered to keep hands together.'],
    ['빈 자리는 남은 모로 다시 꽂아 메워요.', 'Empty spots are filled with leftover seedlings.']],
  ok: ['됐어요: ', 'Done: '], next: [' 다음엔: ', ' Next: '],
  okAll: ['줄이 곧게 섰어요.', 'the row stands straight.'], okMost: ['모가 거의 다 곧게 섰어요.', 'most seedlings stand straight.'], okSome: ['한 줄을 다 심었어요.', 'we planted the rows.'],
  early: ['손이 다 내려갈 때까지 조금 기다려 봐요.', 'wait a little until the hand is all the way down.'],
  late: ['손이 올라가면 미리 준비해 봐요.', 'get ready when the hand goes up.'],
  miss: ['받는 소리가 나오면 같이 꽂아요.', 'plant along when everyone sings back.'],
  rest: ['못줄이 머리 위로 오르면 한 박 쉬어요.', 'skip a beat when the rope goes overhead.'],
  pp: ['두 손을 들면 두 포기를 꽂아요.', 'when both hands go up, plant two.'],
  keep: ['다음 줄도 이렇게 해요.', 'keep this up on the next row.'],
  practice: ['오늘 몫은 다 했어요. 연습으로 더 해요.', 'Today’s share is done. Let us practice.'],
  fix: ['빈 자리는 내가 메울게요.', 'I will fill the empty spots.'] };
const tx = (k, en) => (Array.isArray(k) ? k : TX[k])[en ? 1 : 0];

export function rhyL(S) { const L0 = S.lad && typeof S.lad === 'object' ? S.lad : (S.lad = {}); let L = L0.mo; if (!L || typeof L !== 'object') L = L0.mo = { lv: 1, good: 0, best: {}, fail: 0, n: 0, tool: 0, mt: '', reg: {}, plot: null };
  if (!L.best || typeof L.best !== 'object') L.best = {}; if (!L.reg || typeof L.reg !== 'object') L.reg = {}; L.lv = Math.max(1, Math.min(3, L.lv | 0 || 1)); return L; }

export function rhyAfter(L, lv, stars) { L.n = (L.n | 0) + 1; L.best[lv] = Math.max(L.best[lv] | 0, stars); let up = 0;
  if (lv === 4) return { up: 0, pass: stars >= 2 };
  if (lv !== L.lv) return { up: 0 };
  if (stars === 0) L.fail = (L.fail | 0) + 1; else L.fail = 0;
  if (stars >= 2) { L.good = (L.good | 0) + 1; if (L.good >= 3 && L.lv < 3) { L.lv++; L.good = 0; up = L.lv; } }
  return { up }; }

function seedGeo(T3) {     const P = [], C = [], N = [], blade = (ang, lean, w) => { const ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, pz = ca;
    const pt = (r, h, s) => [ca * r + px * s, h, sa * r + pz * s], b0 = pt(0, 0, -w), b1 = pt(0, 0, w), m0 = pt(lean * 0.45, 0.55, -w * 0.6), m1 = pt(lean * 0.45, 0.55, w * 0.6), tp = pt(lean, 1, 0);
    for (const [v, c] of [[b0, 0.62], [b1, 0.62], [m1, 0.85], [b0, 0.62], [m1, 0.85], [m0, 0.85], [m0, 0.85], [m1, 0.85], [tp, 1]]) { P.push(...v); C.push(c, c, c); N.push(0, 1, 0); } };
  blade(0.3, 0.32, 0.085); blade(1.55, 0.24, 0.08); blade(2.7, 0.34, 0.08); blade(3.9, 0.28, 0.08); blade(5.1, 0.32, 0.075);
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.computeBoundingSphere(); return g; }

function ropeGeo(T3, L, v0) { const P = [], C = [], N = [], bx = (x0, y0, z0, x1, y1, z1, col) => { const c = [(col >> 16 & 255) / 255, (col >> 8 & 255) / 255, (col & 255) / 255], F = [[[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], 1, 0, 0], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], -1, 0, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], 0, 1, 0], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1]];
    for (const f of F) for (const k of [0, 1, 2, 0, 2, 3]) { P.push(...f[k]); C.push(...c); N.push(f[4], f[5], f[6]); } };
  bx(-0.008, 0.1, v0, 0.008, 0.116, v0 + L, 0xe8e0c8); for (let v = v0 + 0.11; v < v0 + L - 0.05; v += 0.22) bx(-0.014, 0.098, v - 0.016, 0.014, 0.12, v + 0.016, 0xd8463a);
  bx(-0.03, -0.25, v0 - 0.03, 0.03, 0.55, v0 + 0.03, 0x8a6038);
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.computeBoundingSphere(); return g; }

const CAP = 96, PLOT0 = 0, PLOTN = 40, TMP0 = 40, TMPN = 54, BUN = 94;
export function createRhy(A) {
  const T3 = A.T3, map = A.map, M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), V3 = new T3.Vector3(), S3 = new T3.Vector3(), E3 = new T3.Euler(), C3 = new T3.Color();
  let root = null, IM = null, MAT = null, GEO = null, ROPE = null, RGEO = null, RMAT = null, G = null, btn = null, onPtr = null, lastDay = -1, lastSea = '', inv = null, latO = null, noComp = false, lastRes = null, again = null;
  const TMP = { day: -1, ring: 0, row: 0 }, en = () => A.en(), TPA = [0, 0, 0], PO = { y: 0 }, PA = { x: 0, g: 0, z: 0 }, PB = { x: 0, g: 0, z: 0 };
  const IN = new Float32Array(CAP * 8);
  for (let i = 0; i < CAP; i++) IN[i * 8 + 7] = -1;
  const COL = [0xb4ec7c, 0x7ed05a, 0xe2bc4e, 0x8cc860];

  function spotFor(w) { const F = A.fields(); let best = null, bd = 1e9;
    for (const r of F) { const x0 = Math.min(r[0], r[2]), x1 = Math.max(r[0], r[2]), z0 = Math.min(r[1], r[3]), z1 = Math.max(r[1], r[3]); if (x1 - x0 < 8 || z1 - z0 < 6) continue; const dx = Math.max(x0 - w.x, 0, w.x - x1), dz = Math.max(z0 - w.z, 0, w.z - z1), d = Math.hypot(dx, dz); if (d < bd) { bd = d; best = [x0, z0, x1, z1]; } }
    if (!best || bd > 45) return null; const [x0, z0, x1, z1] = best, along = (x1 - x0) >= (z1 - z0), a0 = along ? x0 : z0, a1 = along ? x1 : z1, b0 = along ? z0 : x0, b1 = along ? z1 : x1, wa = along ? w.x : w.z, wb = along ? w.z : w.x;
    const nGap = Math.floor((b1 - b0) / 1.6) - 1; if (nGap < 4) return null; let k = Math.round((wb - b0) / 1.6 - 1); k = Math.max(1, Math.min(nGap - 3, k)); const v0 = b0 + (k + 1) * 1.6;
    const sg = wa - a0 < a1 - wa ? 1 : -1, ua = Math.max(a0 + 1.2, Math.min(a1 - 1.2, wa)), u0 = sg > 0 ? Math.min(ua, a1 - 18) : Math.max(ua, a0 + 18);
    const vs = wb > v0 ? 1 : -1;
    return { ax: along ? 'x' : 'z', u0, sg, v0, vs, uMin: a0, uMax: a1 }; }
  const W = (P, u, v, out) => { if (P.ax === 'x') { out[0] = u; out[1] = v; } else { out[0] = v; out[1] = u; } return out; }, XZ = new Float32Array(2);
  const rowU = (P, r) => P.u0 + P.sg * (0.9 + r * 0.3);
  const colV = (n, c) => (c - (n - 1) / 2) * 0.22;
  const headOf = (P, du, dv) => { const dx = P.ax === 'x' ? du : dv, dz = P.ax === 'x' ? dv : du; return Math.atan2(dx, -dz) * 180 / Math.PI; };
  const ryOf = (P, du, dv) => { const dx = P.ax === 'x' ? du : dv, dz = P.ax === 'x' ? dv : du; return Math.atan2(dx, dz); };

  function mesh() { if (IM || !root) return; GEO = seedGeo(T3); MAT = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }); IM = new T3.InstancedMesh(GEO, MAT, CAP); IM.count = 0; IM.frustumCulled = false; IM.matrixAutoUpdate = false; IM.userData.fx = 1; IM.instanceMatrix.setUsage(T3.DynamicDrawUsage);
    for (let i = 0; i < CAP; i++) IM.setColorAt(i, C3.set(COL[0])); root.add(IM); }
  function put(i, x, z, ry, tilt, h, w, ck) { const o = i * 8; IN[o] = x; IN[o + 1] = A.ty(x, z) + 0.035; IN[o + 2] = z; IN[o + 3] = ry; IN[o + 4] = tilt; IN[o + 5] = h; IN[o + 6] = w; IN[o + 7] = ck; }
  function writeOne(i, pop) { if (!IM) return; const o = i * 8; if (IN[o + 7] < 0) { M4.makeScale(0, 0, 0); IM.setMatrixAt(i, M4); return; } const h = IN[o + 5] * (pop == null ? 1 : pop), w = IN[o + 6] * h * 0.95;
    E3.set(IN[o + 4], IN[o + 3], 0, 'YXZ'); Q4.setFromEuler(E3); V3.set(IN[o], IN[o + 1], IN[o + 2]); S3.set(w, h, w); M4.compose(V3, Q4, S3); IM.setMatrixAt(i, M4); IM.setColorAt(i, C3.set(COL[IN[o + 7]])); }
  function flush(all) { if (!IM) return; if (all) for (let i = 0; i < CAP; i++) writeOne(i); let n = 0; for (let i = CAP - 1; i >= 0; i--) if (IN[i * 8 + 7] >= 0) { n = i + 1; break; } IM.count = n; IM.visible = n > 0; IM.instanceMatrix.needsUpdate = true; if (IM.instanceColor) IM.instanceColor.needsUpdate = true; }

  function drawPlot() { const L = rhyL(A.S()), P = L.plot, S = A.S(), autumn = A.season() === 'autumn';
    for (let i = PLOT0; i < PLOT0 + PLOTN; i++) IN[i * 8 + 7] = -1;
    if (P && P.rows) P.rows.forEach((R9, r) => { if (r >= 8) return; const n = R9.g.length, u = rowU(P, r), nt = Math.max(0, (S.day | 0) - (R9.d | 0)), h = nt <= 0 ? 0.36 : nt <= 2 ? 0.48 : 0.62, wk = nt <= 0 ? 1 : nt <= 2 ? 1.15 : 1.35, ripe = autumn && nt >= 1;
      for (let c = 0; c < n && c < 5; c++) { const g = R9.g[c], crook = g !== 's', v = P.v0 + colV(n, c) + (crook ? 0.08 * (c % 2 ? 1 : -1) : 0); W(P, u, v, XZ); put(PLOT0 + r * 5 + c, XZ[0], XZ[1], (r * 1.7 + c) % 6.28, crook ? 0.21 : 0, h * (ripe && !crook ? 1.08 : 1), wk * (ripe && !crook ? 1.2 : 1), ripe ? 2 : nt <= 0 ? 0 : 1); } });
    if (L.bun === S.day && P) { W(P, P.u0 - P.sg * 0.9, P.v0 + 0.9 * P.vs, XZ); put(BUN, XZ[0], XZ[1], 0.4, 0, 0.3, 2.6, 3); } else IN[BUN * 8 + 7] = -1; }
  function dayCheck() { const S = A.S(), sea = A.season(); if (TMP.day !== S.day) { TMP.day = S.day; TMP.row = 0; for (let i = TMP0; i < TMP0 + TMPN; i++) IN[i * 8 + 7] = -1; } if (lastDay !== S.day || lastSea !== sea) { lastDay = S.day; lastSea = sea; drawPlot(); flush(true); } }
  const tmpPut = (x, z, ry, tilt) => { const i = TMP0 + (TMP.ring++ % TMPN); put(i, x, z, ry, tilt, 0.36, 1, 0); return i; };

  const wkB = () => A.wk();

  const wph = (L, D, f) => Math.round(Math.max(0, Math.min(1, D)) * 15) + 16 * f + Math.max(0, Math.min(1, L)) * 0.98;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function clock() { if (!G) return 0; if (G.au) { const lat = latO != null ? latO : G.au.lat; return G.au.ac.currentTime - (noComp ? 0 : lat) - G.T0; } return performance.now() / 1000 - G.T0; }
  function evT(e) { if (!G) return 0; const ts = e && e.timeStamp > 0 ? e.timeStamp : performance.now(), back = Math.max(0, Math.min(0.5, (performance.now() - ts) / 1000)); return clock() - back; }

  function can(w) { if (!w || w.k !== 'paddy' || G) return false; if (A.off()) return false; const c = A.ctx(w); return !!(c && (c.sea === 'spring' || c.st)); }
  function start(w, o = {}) { if (G || !root) return false; const P0 = spotFor(w); if (!P0) return false; const S = A.S(), L = rhyL(S), c = A.ctx(w) || {}, master = !!(o.master || (inv && inv.w === w && !c.st)), lv = c.st ? 1 : master ? 4 : (o.lv || L.lv), en9 = en();
    dayCheck(); const rows0 = L.tool && L.plot ? (L.plot.rows || []).length : 99; let P, r0, useTmp;
    if (master) { P = { ax: P0.ax, u0: P0.u0 + P0.sg * 0.3 * TMP.row, sg: P0.sg, v0: P0.v0, vs: P0.vs }; r0 = 0; useTmp = false; }
    else if (rows0 + LVS[lv].rows <= 8) { P = L.plot; r0 = rows0; useTmp = false; }
    else { P = L.tool && L.plot ? L.plot : P0; r0 = (L.tool ? 9 : 0) + TMP.row; useTmp = true; }
    const L4 = wkB(), Wb = w, Wa = L4.list.find(q => q !== w && q.k === 'paddy' && q.wid && q.wid === w.wid && Math.hypot(q.x - w.x, q.z - w.z) < 120) || null;
    const day = today(), rain = A.wx() === 'rain', first = (L.n | 0) < 3 && !master, plan = rhyPlan(lv, hashS(day + ':' + lv), { song: hashS(day) % 4, rain: rain && !first, first });
    const me = map.player.pos();
    G = { w, P, plan, lv, master, st: !!c.st, pr: !!c.pr, en: en9, ph: 'in', t: 0, r0, useTmp, Wa, Wb, res: plan.slots.map(() => null), ins: plan.slots.map(() => -1), bIns: plan.slots.map(() => -1), rh: 0, st: 0, offs: [], early: 0, late: 0, combo: 0, my: { L: 0, D: 0, dip: -9, flick: -9 }, from: [me.x, me.z], to: null, row: -1, au: null, T0: 0, bigHint: (L.fail | 0) >= 2, pitch: map.player.pitch, line: -1, fixQ: [], pop: -1, popT: 0, hd: 0, again: !!o.again };
    W(P, rowU(P, r0) + P.sg * 0.55, P.v0 + colV(plan.rows[0].n, 0), XZ); G.to = [XZ[0], XZ[1]];
    if (inv && inv.w === w) { inv = null; A.relabel(); } if (master) L.mt = day;
    G.d0 = Math.hypot(G.to[0] - me.x, G.to[1] - me.z); G.v = G.d0 > 6 ? 4.2 : 2.2; G.tLim = Math.min(12, G.d0 / G.v + 1.5); G.wo = [Wb ? [Wb.x, Wb.z] : null, Wa ? [Wa.x, Wa.z] : null];
    map.player.jump(false); map.player.run(false); map.player.steer(G.to[0] - me.x, G.to[1] - me.z, G.d0 > 6 ? 4.2 : 2.2, false); A.goal(tx(master ? 'taskM' : 'task', en9));
    const reg = L.reg['논 일꾼'] || (L.reg['논 일꾼'] = { n: 0 }); reg.n = (reg.n | 0) + 1; const hi = reg.n >= 3 && reg.last ? tx('reg', en9) : tx(TX.hi[(L.n | 0) % 3], en9); PB.x = Wb.x; PB.g = Wb.g; PB.z = Wb.z; if (Wa) { PA.x = Wa.x; PA.g = Wa.g; PA.z = Wa.z; } if (master) A.bubble(PB, tx('taskM', en9).replace(/^[^:]+: /, '')); else A.bubble(Wa ? PA : PB, G.pr ? tx('practice', en9) : hi);
    A.mark(); return true; }

  function placeWorkers(u) { const P = G.P, K = wkB(), ry = ryOf(P, -P.sg, 0);
    if (G.Wb) { W(P, u + P.sg * 0.55, P.v0 + 1.6 * P.vs, XZ); PB.x = XZ[0]; PB.z = XZ[1]; PB.g = A.ty(XZ[0], XZ[1]); K.set(G.Wb.i, PB.x, PB.g + 0.02, PB.z, ry); K.act(G.Wb.i, 16, 0); }
    if (G.Wa) { W(P, u + P.sg * 0.3, P.v0 + 3.3 * P.vs, XZ); PA.x = XZ[0]; PA.z = XZ[1]; PA.g = A.ty(XZ[0], XZ[1]); K.set(G.Wa.i, PA.x, PA.g + 0.02, PA.z, ryOf(P, 0, -P.vs)); K.act(G.Wa.i, 16, 0); } }

  function walkWorkers(k) { const P = G.P, K = wkB(), u = rowU(P, G.r0) - P.sg * 0.3; for (let q = 0; q < 2; q++) { const w9 = q ? G.Wa : G.Wb, o9 = G.wo[q]; if (!w9 || !o9) continue; W(P, u + P.sg * (q ? 0.3 : 0.55), P.v0 + (q ? 3.3 : 1.6) * P.vs, XZ); const x = o9[0] + (XZ[0] - o9[0]) * k, z = o9[1] + (XZ[1] - o9[1]) * k, B9 = q ? PA : PB; B9.x = x; B9.z = z; B9.g = A.ty(x, z);
      K.set(w9.i, x, B9.g + 0.02, z, k < 1 ? Math.atan2(XZ[0] - o9[0], XZ[1] - o9[1]) : ryOf(P, -P.sg, 0)); K.act(w9.i, k < 1 ? 1 : 16, 0); } }
  function ropeAt(u) { if (!ROPE) { RGEO = ropeGeo(T3, 5.6, -2.2); RMAT = new T3.MeshLambertMaterial({ vertexColors: true }); ROPE = new T3.Mesh(RGEO, RMAT); ROPE.matrixAutoUpdate = false; ROPE.userData.fx = 1; ROPE.frustumCulled = false; root.add(ROPE); }
    const P = G.P; ROPE.visible = true; W(P, u, P.v0, XZ); ROPE.position.set(XZ[0], A.ty(XZ[0], XZ[1]), XZ[1]); ROPE.rotation.set(0, P.ax === 'x' ? 0 : Math.PI / 2, 0); ROPE.scale.set(1, 1, P.vs); ROPE.updateMatrix(); }
  function beginPlay() { const g = G, en9 = g.en; map.player.steer(null); map.player.freeze(true); g.ph = 'play';
    const P = g.P; g.hd = headOf(P, -P.sg, 0); map.player.aim(g.hd); map.player.face(headOf(P, -P.sg * 0.72, P.vs * 0.7)); map.player.setPitch(0.62);
    A.mus().hold(true); g.au = A.mus().playEv ? A.mus().playEv(rhyEvents(g.plan, { master: g.master }), { lead: 0.35 }) : null;
    g.T0 = g.au ? g.au.t0 : performance.now() / 1000 + 0.35; g.u = rowU(P, g.r0); ropeAt(g.u - P.sg * 0.3); void en9;
    if (A.touch()) { btn = document.createElement('button'); btn.className = 'twn-rhy-b'; btn.textContent = tx('plant', en9); btn.style.cssText = 'position:fixed;right:22px;bottom:118px;width:96px;height:96px;border-radius:50%;border:3px solid #2b2622;background:#7cc45a;color:#14240c;font-family:inherit;font-weight:900;font-size:20px;line-height:1;z-index:60;box-shadow:0 4px 0 #2b2622;touch-action:none';
      btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); down(e); }); document.body.appendChild(btn); }
    onPtr = e => { if (!G || e.button !== 0 || !(e.target && e.target.tagName === 'CANVAS')) return; down(e); }; addEventListener('pointerdown', onPtr, true); }

  function down(e) { const g = G; if (!g) return false; if (g.ph === 'again') { const w = g.w; finish(false); start(w, { again: true }); return true; } if (g.ph !== 'play') return true; if (e && e.repeat) return true;
    const t = evT(e), S9 = g.plan.slots; g.my.flick = t;
    for (let j = 0; j < S9.length; j++) { const s = S9[j]; if (t < s.t - s.A) break; if (t > s.t + s.A) continue; if (g.res[j] != null) { g.st++; return true; }
      if (s.k === 'rest') { g.res[j] = 'h'; g.rh++; return true; } const o = t - s.t, r = rhyJudge(s, o) || 'c'; g.res[j] = r; g.offs.push(o); if (o < -0.15) g.early++; else if (o > 0.18) g.late++;
      g.my.dip = t; plantMine(j, r); return true; }
    g.st++; return true; }
  function plantMine(j, r) { const g = G, s = g.plan.slots[j], P = g.P, n = g.plan.rows[s.row].n, u = rowU(P, g.r0 + s.row), crook = r !== 's', v = P.v0 + colV(n, s.col) + (crook ? 0.08 * (s.col % 2 ? 1 : -1) : 0);
    W(P, u, v, XZ); const i = g.useTmp ? tmpPut(XZ[0], XZ[1], j * 1.3, crook ? 0.21 : 0) : (put(PLOT0 + (g.r0 + s.row) * 5 + s.col, XZ[0], XZ[1], j * 1.3, crook ? 0.21 : 0, 0.36, 1, 0), PLOT0 + (g.r0 + s.row) * 5 + s.col); g.ins[j] = i; writeOne(i, 0.55); flush(false); g.pop = i; g.popT = 0;
    g.combo = r === 's' ? g.combo + 1 : 0; const au = g.au; if (au) au.hit(Math.min(6, Math.max(0, g.combo - 1))); else if (A.sfx) A.sfx('pop');
    if (g.combo === 3 || g.combo === 5 || g.combo === 8) { if (A.tone) { A.tone(659, 0, 0.09, 'triangle', 0.035); setTimeout(() => A.tone && A.tone(880, 0, 0.12, 'triangle', 0.03), 90); } } }
  function plantB(j) { const g = G, s = g.plan.slots[j], P = g.P, n = g.plan.rows[s.row].n, u = rowU(P, g.r0 + s.row); W(P, u, P.v0 + 1.6 * P.vs + colV(n, s.col), XZ); g.bIns[j] = tmpPut(XZ[0], XZ[1], j * 2.1, 0); writeOne(g.bIns[j]); flush(false); }

  function tick(dt) { const g = G; if (!g) return; g.t += dt; const P = g.P, K = wkB();
    if (g.ph === 'in') { const me = map.player.pos(), d = Math.hypot(g.to[0] - me.x, g.to[1] - me.z); walkWorkers(Math.min(1, g.t * g.v / Math.max(1, g.d0)));
      if (d < 0.18) { beginPlay(); return; } if (g.t < g.tLim) { map.player.steer(g.to[0] - me.x, g.to[1] - me.z, g.v, false); return; }
      map.player.steer(null); const st9 = Math.min(d, 3 * dt); TPA[0] = me.x + (g.to[0] - me.x) / d * st9; TPA[2] = me.z + (g.to[1] - me.z) / d * st9; TPA[1] = map.q.groundAt(TPA[0], TPA[2], A.ty(TPA[0], TPA[2]) + 2) + 0.03; g.tp = 1; map.player.teleport(TPA); g.tp = 0; if (d - st9 < 0.05) beginPlay(); return; }
    if (g.ph === 'play') { if (document.hidden) { stop('hidden'); return; } const t = clock(), pl = g.plan, b = pl.beat, S9 = pl.slots;
      for (let j = 0; j < S9.length; j++) { const s = S9[j]; if (s.k === 'rest') continue; if (g.bIns[j] < 0 && t >= s.t + 0.08) plantB(j); if (g.res[j] == null && t > s.t + s.A) { g.res[j] = 'x'; g.combo = 0; } }

      let r = -1; for (let k = 0; k < pl.rows.length; k++) if (t >= pl.rows[k].t0 - 0.01) r = k; const rr = Math.max(0, r), R9 = pl.rows[rr], k01 = r < 0 ? 0 : smooth(R9.t0, R9.t0 + 2 * b, t), uPrev = rowU(P, g.r0 + rr - 1), uNow = rowU(P, g.r0 + rr), uRope = r <= 0 ? uNow : uPrev + (uNow - uPrev) * k01;
      if (r !== g.row) { g.row = r; if (r >= 0) { const C = R9.call < 0 ? RAIN_CALL : CALLS[R9.call]; A.bubble(g.Wa ? PA : PB, '♪ ' + C[g.en ? 2 : 1]); } }
      if (uRope !== g.lastU) { g.lastU = uRope; ropeAt(uRope); placeWorkers(uRope); }     const me = map.player.pos(), nx = pl.rows[rr].n;
      let nj = -1; for (let j = 0; j < S9.length; j++) if (S9[j].k !== 'rest' && S9[j].t > t - 0.25 && S9[j].row === rr) { nj = j; break; }
      const col = nj >= 0 ? S9[nj].col : 0; W(P, uRope + P.sg * 0.55, P.v0 + colV(nx, col), XZ); const ex = me.x + (XZ[0] - me.x) * Math.min(1, dt * 6), ez = me.z + (XZ[1] - me.z) * Math.min(1, dt * 6);
      if (Math.hypot(ex - me.x, ez - me.z) > 0.002) { TPA[0] = ex; TPA[1] = map.q.groundAt(ex, ez, A.ty(ex, ez) + 2) + 0.03; TPA[2] = ez; g.tp = 1; map.player.teleport(TPA); g.tp = 0; map.player.aim(g.hd); }

      let L9 = 0, D9 = 0, f = 0; for (let j = 0; j < S9.length; j++) { const s = S9[j]; if (s.k === 'rest') continue; const lo = s.t - b, l = smooth(lo, lo + 0.3 * (g.bigHint ? 1.4 : 1), t) * (1 - smooth(s.t + 0.05, s.t + 0.35, t)), d = t < s.t - 0.1 ? 0 : t < s.t ? (t - s.t + 0.1) / 0.1 : 1 - smooth(s.t + 0.1, s.t + 0.45, t);
        if (l > L9) L9 = l; if (d > D9) D9 = d; if (s.k === 'pp' && l > 0.05) f |= 2; }
      const inCall = r >= 0 && t < R9.t0 + 4 * b - b * 0.9; if (inCall && rr < 2 && g.lv <= 2 && !g.master) { f |= 1; L9 = 0; D9 = 0; }
      if (G.Wb) K.pose(G.Wb.i, wph(L9 * (g.bigHint ? 1 : 0.92), D9, f));
      if (G.Wa) { let ov = 0; for (const s of S9) if (s.k === 'rest' && t > s.t - b && t < s.t + 0.3) ov = 4; K.pose(G.Wa.i, wph(0, 0, 8 | ov)); }
      if (!G.Wa && G.Wb) { for (const s of S9) if (s.k === 'rest' && t > s.t - b && t < s.t + 0.3) K.pose(G.Wb.i, wph(0, 0, 4)); }

      const md = t - g.my.dip, mf = t - g.my.flick, Dm = md >= 0 && md < 0.35 ? Math.sin(md / 0.35 * Math.PI) : 0, Lm = Math.max(L9 * 0.85, mf >= 0 && mf < 0.25 ? Math.sin(mf / 0.25 * Math.PI) * 0.5 : 0);
      PO.y = Math.round(Lm * 99) + Math.min(0.999, Dm); map.player.pose('plant', PO);
      if (g.pop >= 0) { g.popT += dt; writeOne(g.pop, Math.min(1, 0.55 + g.popT * 3)); IM.instanceMatrix.needsUpdate = true; if (g.popT > 0.2) g.pop = -1; }
      if (t > pl.len + 0.4) endPlay(); return; }
    if (g.ph === 'end') { const t = g.t - g.endT; if (g.fixQ.length && t > 0.6 + g.fixI * 0.45 && g.fixI < g.fixQ.length) { const j = g.fixQ[g.fixI++]; plantFix(j); if (G.Wb) K.pose(G.Wb.i, wph(0, 1, 0)); } else if (G.Wb && t > 0.4) K.pose(G.Wb.i, wph(0, 0, 0));
      PO.y = 0; map.player.pose('plant', PO); if (t > 0.9 + g.fixQ.length * 0.45 + 1.6 && !g.said) { g.said = true; summary(); } if (t > 3.2 + g.fixQ.length * 0.45) { g.ph = 'again'; g.t2 = 0; againShow(); } return; }
    if (g.ph === 'again') { g.t2 += dt; if (g.t2 > 6) finish(false); } }
  function plantFix(j) { const g = G, s = g.plan.slots[j], P = g.P, n = g.plan.rows[s.row].n, u = rowU(P, g.r0 + s.row), v = P.v0 + colV(n, s.col) + 0.08 * (s.col % 2 ? 1 : -1); W(P, u, v, XZ);
    const i = g.useTmp ? tmpPut(XZ[0], XZ[1], j, 0.21) : (put(PLOT0 + (g.r0 + s.row) * 5 + s.col, XZ[0], XZ[1], j, 0.21, 0.36, 1, 0), PLOT0 + (g.r0 + s.row) * 5 + s.col); g.ins[j] = i; writeOne(i); flush(false); if (A.sfx) A.sfx('pop'); }

  function endPlay() { const g = G, S = A.S(), L = rhyL(S), res = rhyRes(g.plan, g.res.map(r => (r === 'h' ? null : r)), g.rh, g.st); g.ph = 'end'; g.endT = g.t; g.fixI = 0; g.fixQ = []; g.plan.slots.forEach((s, j) => { if (s.k !== 'rest' && g.res[j] === 'x') g.fixQ.push(j); });
    if (g.au) { g.au.stop(); } A.mus().hold(false); if (btn) { btn.remove(); btn = null; } if (onPtr) { removeEventListener('pointerdown', onPtr, true); onPtr = null; }
    const stars = rhyStars(g.lv, res, false); g.stars = stars; lastRes = { lv: g.lv, stars, ...res, R: undefined, early: g.early, late: g.late, master: g.master, st: g.st, pr: g.pr, len: g.plan.len, at: [g.to[0], g.to[1]] };
    const af = g.st ? { up: 0 } : rhyAfter(L, g.lv, stars), reg = L.reg['논 일꾼']; if (reg) reg.last = stars >= 2 ? 'good' : 'ok';

    const rowsG = g.plan.rows.map((R9, r) => { let s9 = ''; g.plan.slots.forEach((s, j) => { if (s.row === r && s.k !== 'rest') s9 += g.res[j] === 's' ? 's' : g.res[j] === 'c' ? 'c' : 'x'; }); return s9; });
    if (g.master && af.pass) { L.tool = 1; L.plot = { ax: g.P.ax, u0: g.P.u0, sg: g.P.sg, v0: g.P.v0, vs: g.P.vs, rows: rowsG.map(s9 => ({ d: S.day | 0, g: s9 })) }; TMP.row += g.plan.rows.length; }
    else if (g.master) { for (const i of g.ins) if (i >= 0) { const o = i * 8; tmpPut(IN[o], IN[o + 2], IN[o + 3], IN[o + 4]); IN[o + 7] = -1; } TMP.row += g.plan.rows.length; flush(true); }
    else if (!g.useTmp && L.plot) { for (const s9 of rowsG) if (L.plot.rows.length < 8) L.plot.rows.push({ d: S.day | 0, g: s9 }); }
    else TMP.row += g.plan.rows.length;
    if (res.s === res.n && res.n > 0) L.bun = S.day | 0;
    A.mark(); g.af = af; g.res9 = res;
    g.msg = A.reward(g.w, stars, { st: g.st, pr: g.pr, master: g.master, lv: g.lv, again: g.again }) || ''; }
  function summary() { const g = G, en9 = g.en, res = g.res9, af = g.af, n = res.n;
    const ok = res.s >= n ? tx('okAll', en9) : res.s >= n - 3 ? tx('okMost', en9) : tx('okSome', en9);
    const nx = res.rh > 0 ? tx('rest', en9) : g.lv >= 2 && g.plan.slots.some((s, j) => s.k === 'pp' && g.res[j] !== 's') ? tx('pp', en9) : res.x > n / 3 ? tx('miss', en9) : g.early > g.late && g.early >= 2 ? tx('early', en9) : g.late >= 2 ? tx('late', en9) : tx('keep', en9);
    A.bubble(g.Wa ? PA : PB, tx('ok', en9) + ok + tx('next', en9) + nx);
    const L = rhyL(A.S()), fact = tx(TX.fact[(L.n | 0) % 3], en9);
    if (g.master) { if (af.pass) { A.banner('🌱 ' + tx('master', en9), 4); drawPlot(); flush(true); } else A.say(tx('masterNo', en9), 3); }
    else if (af.up) { A.banner('🌱 ' + tx(TX.up[af.up], en9), 4.2); }
    else if ((L.fail | 0) >= 3 && L.lv > 1) A.say(tx('easy', en9), 4);
    g.fact = (g.msg ? g.msg + ' ' : '') + '💡 ' + (en9 ? 'Did you know? ' : '알고 있었나요? ') + fact; }
  function againShow() { const g = G; if (!g) return; A.goal(null); if (g.fact) A.say(g.fact, 5.2); again = document.createElement('button'); again.className = 'twn-rhy-a'; again.textContent = tx('again', g.en) + (A.touch() ? '' : ' (E)'); again.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);padding:12px 26px;border-radius:12px;border:3px solid #2b2622;background:#fff8e6;color:#2b2622;font-family:inherit;font-weight:900;font-size:19px;line-height:1;z-index:60;box-shadow:0 4px 0 #2b2622;cursor:pointer';
    again.onclick = e => { e.preventDefault(); down(e); }; document.body.appendChild(again); }

  function finish(free) { const g = G; if (!g) return; G = null; const K = wkB(); for (const w9 of [g.Wa, g.Wb]) if (w9) { K.set(w9.i, w9.x, w9.g + 0.02, w9.z, w9.ry); K.reset(w9.i); K.pose(w9.i, null); }
    if (ROPE) ROPE.visible = false; if (btn) { btn.remove(); btn = null; } if (again) { again.remove(); again = null; } if (onPtr) { removeEventListener('pointerdown', onPtr, true); onPtr = null; }
    if (g.au && g.ph === 'play') g.au.stop(); if (g.ph === 'play' || g.ph === 'in') A.mus().hold(false);
    map.player.steer(null); map.player.pose(null); map.player.aim(null); map.player.jump(true); map.player.run(true); if (g.pitch != null) map.player.setPitch(g.pitch); map.player.freeze(false); A.goal(null);
    drawPlot(); flush(true); if (free) A.bubble(g.Wa || g.Wb, tx('quit', g.en)); }

  function stop(why) { const g = G; if (!g) return; if (g.ph === 'play' || g.ph === 'in') { const L = rhyL(A.S()); if (!g.st && g.lv === L.lv) L.fail = (L.fail | 0) + 1; A.mark(); lastRes = { lv: g.lv, stars: 0, quit: why }; if (g.ph === 'play') TMP.row += g.useTmp ? g.plan.rows.length : 0; A.say(tx('quit', g.en), 2.4); }
    finish(false); }
  function key(e) { if (!G) return false; const c = e.code; if (c === 'Escape') { if (G.ph === 'again' || G.ph === 'end') finish(true); else stop('esc'); return true; }
    if (c === 'Space' || c === 'KeyE' || c === 'Enter') { if (G.ph === 'again' && c === 'Space') return true; down(e); return true; }
    if (/^(Tab|Shift|Control|Alt|Meta|F\d+)/.test(c)) return false; if (/^(Key[JMIFQBYKNUHGV]|Digit\d)$/.test(c) && !e.repeat) A.toast('🌱 ' + tx('busy', G.en), 1.4); return true; }

  function sec() { if (!root) return; dayCheck(); if (G) return; const L = rhyL(A.S()); if (L.tool || L.lv < 3 || (L.good | 0) < 3 || L.mt === today() || A.season() !== 'spring' || A.off()) { if (inv) { inv = null; A.relabel(); } return; }
    const me = map.player.pos(), K = wkB(); let bw = null, bd = 20; for (const w of K.list) if (w.k === 'paddy') { const d = Math.hypot(w.x - me.x, w.z - me.z); if (d < bd) { bd = d; bw = w; } } if (!bw) return;
    if (!inv || inv.w !== bw) { inv = { w: bw }; A.bubble(bw, tx('inv', en())); A.relabel(); } }
  function label(w) { if (inv && inv.w === w) return en() ? '🌱 Master test: rice planting' : '🌱 장인 시험 (모내기)'; return en() ? '🌱 Plant rice seedlings (together)' : '🌱 모내기 (같이 해요)'; }
  function harvest() { const L = rhyL(A.S()); if (L.plot && L.plot.rows && L.plot.rows.length) { L.plot.rows = []; A.mark(); drawPlot(); flush(true); return true; } return false; }
  function built(R) { root = R; IM = null; ROPE = null; mesh(); lastDay = -1; dayCheck(); }
  function reset() { if (G) finish(false); if (IM) { IM.removeFromParent(); IM.dispose(); GEO.dispose(); MAT.dispose(); IM = null; } if (ROPE) { ROPE.removeFromParent(); RGEO.dispose(); RMAT.dispose(); ROPE = null; } root = null; inv = null; }
  return { get busy() { return !!G; }, get tp() { return !!(G && G.tp); }, can, start, tick, key, down, stop, sec, label, harvest, built, reset, dispose: reset,

    info: () => ({ on: !!G, ph: G && G.ph, lv: G && G.lv, master: G && G.master, au: !!(G && G.au), lat: G && G.au ? G.au.lat : 0, t: G ? clock() : 0, len: G && G.plan.len, n: G && G.plan.n, res: G ? G.res.slice() : null, last: lastRes, L: JSON.parse(JSON.stringify(rhyL(A.S()))), inst: IM ? IM.count : 0, rope: !!(ROPE && ROPE.visible), inv: !!inv, tmp: TMP.ring, row: TMP.row }),
    cue: () => { if (!G || G.ph !== 'play') return null; const t = clock(); for (let j = 0; j < G.plan.slots.length; j++) { const s = G.plan.slots[j]; if (s.t > t - 0.05) return { dt: s.t - t, k: s.k, j }; } return null; },
    cueRaw: () => { if (!G || G.ph !== 'play' || !G.au) return null; const now = G.au.ac.currentTime - G.T0; for (let j = 0; j < G.plan.slots.length; j++) { const s = G.plan.slots[j]; if (s.t > now - 0.05) return { dt: s.t - now, k: s.k, j }; } return null; },
    ff: () => { if (G && G.ph === 'play') G.T0 -= G.plan.len + 0.5 - clock(); },
    spotOf: i => { const w = wkB().list[i], F = A.fields(); let bd = 1e9; for (const r of F) { const x0 = Math.min(r[0], r[2]), x1 = Math.max(r[0], r[2]), z0 = Math.min(r[1], r[3]), z1 = Math.max(r[1], r[3]); bd = Math.min(bd, Math.hypot(Math.max(x0 - w.x, 0, w.x - x1), Math.max(z0 - w.z, 0, w.z - z1))); } return { d: +bd.toFixed(1), P: spotFor(w), nF: F.length }; },
    plotInfo: () => { const out = []; for (let i = PLOT0; i < PLOT0 + PLOTN; i++) if (IN[i * 8 + 7] >= 0) out.push([+IN[i * 8 + 5].toFixed(2), IN[i * 8 + 7]]); return out; },
    lat: v => { latO = v; }, noComp: v => { noComp = !!v; }, plan: () => (G ? G.plan : null), draws: () => (IM && IM.visible ? 1 : 0) + (ROPE && ROPE.visible ? 1 : 0), redraw: () => { lastDay = -1; dayCheck(); } };
}
