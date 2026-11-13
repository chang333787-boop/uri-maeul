export const RES_V = 1;

export const WILD = {
  twig: { e: '🍂', days: 1, t: ['마른 가지', 'Dry twigs'], fact: ['바람에 떨어진 마른 가지예요 — 살아 있는 가지는 꺾지 않아요', 'Twigs blown down by the wind — we never snap living branches'], col: 0xa07a4a },
  cone: { e: '🌰', days: 2, t: ['솔방울', 'Pine cone'], fact: ['솔방울 비늘 사이에 소나무 씨앗이 들어 있어요', 'Pine seeds hide between the scales of a cone'], col: 0x8a5a34 },
  stone: { e: '⚪', days: 3, t: ['조약돌', 'Pebble'], fact: ['오랜 세월 물과 바람에 깎여 동글동글해졌어요', 'Water and wind wore it smooth over many years'], col: 0xc4c0b6 },
  herb: { e: '🍃', days: 2, sea: 'spring', t: ['산나물', 'Wild greens'], fact: ['봄에 돋는 산나물 — 뿌리는 남기고 잎만 조금 따요', 'Spring greens — leave the roots and take just a few leaves'], col: 0x5fae45 },
};
const MAX = 40;

const MIX = { pine: [['cone', 0.45], ['twig', 0.3], ['stone', 0.15], ['herb', 0.1]], broad: [['twig', 0.45], ['herb', 0.25], ['stone', 0.2], ['cone', 0.1]], mixed: [['twig', 0.35], ['cone', 0.25], ['herb', 0.2], ['stone', 0.2]] };
export const wildOf = e => Object.keys(WILD).find(k => WILD[k].e === e) || null;

function sprigGeo(T3) { const P = [], N = [], C = [], part = (g, m, v) => { g.applyMatrix4(m); const q = g.toNonIndexed(), p = q.attributes.position, n = q.attributes.normal; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); C.push(v, v, v); } g.dispose(); q.dispose(); };
  const M = new T3.Matrix4(), Q = new T3.Quaternion(), E = new T3.Euler(), V = new T3.Vector3(), S1 = new T3.Vector3(1, 1, 1), mk = (x, y, z, rx, ry, rz) => M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S1);
  part(new T3.BoxGeometry(0.05, 0.05, 0.9), mk(0, 0.03, 0, 0, 0, 0), 0.62); part(new T3.BoxGeometry(0.035, 0.035, 0.4), mk(0.1, 0.03, 0.12, 0, 0.7, 0), 0.62); part(new T3.BoxGeometry(0.035, 0.035, 0.34), mk(-0.08, 0.03, -0.15, 0, -0.8, 0), 0.62);
  for (const [x, z, r] of [[0.2, 0.28, 0.4], [-0.16, -0.3, -0.5], [0.02, 0.44, 0.1]]) part(new T3.BoxGeometry(0.16, 0.02, 0.1), mk(x, 0.05, z, 0.2, r, 0.15), 1);
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); return g; }

export function createRes(A) {
  const T3 = A.T3, SP = [], GRID = new Map(), M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), E4 = new T3.Euler(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), C4 = new T3.Color();
  let G1 = null, G2 = null, MT = null, MT2 = null, M1 = null, M2 = null, H = null, cur = null, q = 0, lx = 1e9, lz = 1e9, dirty = true, dDay = -1, dSea = '', told = -1, busy = false;
  const S = () => A.GAME.S, R = () => S().res || (S().res = {});
  const avail = s => { const W = WILD[s.k]; return (R()[s.id] || 0) <= S().day && (!W.sea || A.sea() === W.sea); };
  const key = (x, z) => Math.floor(x / 16) + ':' + Math.floor(z / 16);
  function mesh() { if (M1) return; G1 = new T3.DodecahedronGeometry(1, 0); G2 = sprigGeo(T3); MT = new T3.MeshLambertMaterial({ flatShading: true }); MT2 = new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    M1 = new T3.InstancedMesh(G1, MT, MAX); M2 = new T3.InstancedMesh(G2, MT2, MAX); for (const m of [M1, M2]) { m.count = 0; m.matrixAutoUpdate = false; m.userData.fx = 1; m.setColorAt(0, C4.setHex(0xffffff)); } }

  function draw(s) { const m = s.m, on = avail(s); if (!on) { M4.makeScale(0, 0, 0); m.setMatrixAt(s.i, M4); return; }
    if (s.k === 'stone') { E4.set(0, s.ry, 0.3); S4.set(0.28, 0.15, 0.22); V4.set(s.x, s.y + 0.08, s.z); }
    else if (s.k === 'cone') { E4.set(0.25, s.ry, 1.35); S4.set(0.13, 0.21, 0.13); V4.set(s.x, s.y + 0.11, s.z); }
    else if (s.k === 'herb') { E4.set(-1.45, s.ry, 0); S4.set(1.25, 1.25, 0.8); V4.set(s.x, s.y + 0.02, s.z); }
    else { E4.set(0, s.ry, 0); S4.set(1.35, 1.35, 1.35); V4.set(s.x, s.y + 0.01, s.z); }
    M4.compose(V4, Q4.setFromEuler(E4), S4); m.setMatrixAt(s.i, M4); }
  function drawAll() { for (const s of SP) draw(s); for (const m of [M1, M2]) if (m) m.instanceMatrix.needsUpdate = true; dDay = S().day; dSea = A.sea(); dirty = true; }
  function clear() { SP.length = 0; GRID.clear(); cur = null; H = null; if (M1) { M1.count = 0; M2.count = 0; if (M1.parent) M1.parent.remove(M1); if (M2.parent) M2.parent.remove(M2); } }

  function init() { clear(); if (!A.on()) return; const FO = A.forests(); if (!FO.length) return; const rnd = A.rng('res:' + A.id), cand = [];
    for (const f of FO) { const [x0, z0, x1, z1] = A.bboxOf(f.sh); for (let z = z0 + 4.5; z < z1; z += 9) for (let x = x0 + 4.5; x < x1; x += 9) { const px = x + (rnd() - 0.5) * 7, pz = z + (rnd() - 0.5) * 7; if (!A.inShape(f.sh, px, pz) || A.sdOf(f.sh, px, pz) > -3 || !A.ok(px, pz)) continue; cand.push([px, pz, f.sub, rnd()]); } }
    cand.sort((a, b) => a[3] - b[3]); mesh(); let n1 = 0, n2 = 0;
    for (const [x, z, sub] of cand) { if (SP.length >= MAX) break; if (SP.some(s => Math.abs(s.x - x) < 8 && Math.abs(s.z - z) < 8)) continue; const mx = MIX[sub] || MIX.mixed; let r = rnd(), k = mx[mx.length - 1][0]; for (const [kk, p] of mx) { if (r < p) { k = kk; break; } r -= p; }
      const lump = k === 'cone' || k === 'stone', m = lump ? M1 : M2, s = { id: 'r' + SP.length, k, x, z, y: A.gy(x, z), ry: rnd() * 6.28, m, i: lump ? n1++ : n2++ }; SP.push(s); const g = key(x, z); if (!GRID.has(g)) GRID.set(g, []); GRID.get(g).push(s); m.setColorAt(s.i, C4.setHex(WILD[k].col)); }
    if (!SP.length) return; M1.count = n1; M2.count = n2; for (const m of [M1, M2]) { if (m.instanceColor) m.instanceColor.needsUpdate = true; } drawAll();
    const root = A.root(); for (const m of [M1, M2]) { if (!m.count) continue; root.add(m); m.computeBoundingSphere(); m.updateMatrix(); const b = m.boundingSphere; if (b && !A.FOGM.some(o => o.m === m)) A.FOGM.push({ m, cx: b.center.x, cz: b.center.z, r: b.radius }); }
    H = A.map.interact.add({ kind: 'game', x: SP[0].x, z: SP[0].z, y: SP[0].y, r: 1.7, label: '', use: () => pick(cur) }); H.hot.off = true; A.enth.push(H); lx = 1e9; }

  function pick(s) { if (!s || busy || !avail(s)) return; const W = WILD[s.k], en = A.lang() === 'en', day = S().day, n = 1 + (s.k === 'twig' && S().resRain === day ? 1 : 0); busy = true;
    R()[s.id] = day + W.days; A.GAME.mark(); if (H) H.hot.off = true; cur = null; dirty = true; try { A.map.player.act('shoes', { at: [s.x, s.y, s.z], reach: 0.5 }); } catch (e) {   }
    setTimeout(() => { busy = false; if (!A.alive()) return; draw(s); s.m.instanceMatrix.needsUpdate = true; A.got(W.e, n, 'res:' + s.k); A.skUp('explore', 1, 'res:' + s.k); A.tev('wild'); A.map.sfx && A.map.sfx('pick');
      A.map.hud.toast(W.e + ' ' + W.t[en ? 1 : 0] + (n > 1 ? ' ×' + n + (en ? ' (after the rain!)' : ' (비 온 뒤라 더!)') : '') + ' — ' + W.fact[en ? 1 : 0], 3); }, 950); }

  function tick(dt) { if (!H || !SP.length) return; if ((q += dt) < 0.25) return; q = 0;
    if (S().day !== dDay || A.sea() !== dSea) drawAll();
    if (A.inb() || busy) { if (!H.hot.off) H.hot.off = true; return; }
    const me = A.map.player.pos(); if (!dirty && Math.abs(me.x - lx) + Math.abs(me.z - lz) < 1) return; dirty = false; lx = me.x; lz = me.z;
    const cx = Math.floor(me.x / 16), cz = Math.floor(me.z / 16); let best = null, bd = 36;
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) { const L9 = GRID.get(i + ':' + j); if (L9) for (const s of L9) { if (!avail(s)) continue; const d = (s.x - me.x) ** 2 + (s.z - me.z) ** 2; if (d < bd && Math.abs(s.y - me.y) < 2.5) { bd = d; best = s; } } }
    if (!best) { if (!H.hot.off) H.hot.off = true; cur = null; return; }
    const en = A.lang() === 'en', W = WILD[best.k], lb = W.e + ' ' + W.t[en ? 1 : 0] + (en ? ' — pick up' : ' 줍기'); cur = best; const h = H.hot; h.x = best.x; h.z = best.z; h.y = best.y; if (h.label !== lb) h.label = lb; if (h.off) h.off = false;
    if (told !== S().day && bd < 36 && !(A.quiet && A.quiet())) {     told = S().day; A.map.hud.toast(en ? '🌲 Twigs, pine cones and pebbles lie on the forest floor — walk up close and press E' : '🌲 숲 바닥에 마른 가지·솔방울·조약돌이 떨어져 있어요 — 가까이 가서 E', 3); } }

  function day(rain) { const S9 = S(), R9 = R(); if (rain) S9.resRain = S9.day; for (const k of Object.keys(R9)) { if (rain) R9[k]--; if (R9[k] <= S9.day) delete R9[k]; } A.GAME.mark(); dDay = -1; }
  function dispose() { clear(); for (const o of [M1, M2, G1, G2, MT, MT2]) if (o) o.dispose(); M1 = M2 = G1 = G2 = MT = MT2 = null; }
  return { init, tick, day, dispose, has: e => { const k = wildOf(e); return !!k && SP.some(s => s.k === k); }, get n() { return SP.length; }, spots: () => SP.map(s => ({ id: s.id, k: s.k, x: +s.x.toFixed(1), z: +s.z.toFixed(1), y: +s.y.toFixed(2), on: avail(s) })), get hot() { return H && H.hot; } };
}
