import * as THREE from 'three';
import { SCHOOL } from './layout.js?v=16';

const TRN = SCHOOL.terrain;

let TOVER = null;
export function setTerrainOver(f) { TOVER = typeof f === 'function' ? f : null; }
export function overAt(x, z, hy) { return TOVER ? TOVER(x, z, hy) : null; }
export function terrainAt(x, z, hy) {
  if (TOVER) { const v = TOVER(x, z, hy); if (v != null) return v; }
  if (z < TRN.TERR_Z || (x < TRN.westX && z < TRN.westZ) || (x < TRN.gymSouthX && z < TRN.gymSouthZ)) return TRN.yard;

  if (x >= TRN.westX && x < -27 && z < -3) { const t = Math.max(0, (x + 30) / 3) + Math.max(0, (z + 10) / 7); if (t < 1) return TRN.yard + (TRN.field - TRN.yard) * t; }
  return TRN.field;
}

const GARDEN_BARE = [];
export function buildWorld(scene) {
  const B = SCHOOL.building, FR = B.front;
  const FH = B.floorHeight, TR3 = SCHOOL.terrain, TERR_Z = TR3.TERR_Z;

  const YARD = TR3.yard, FIELD = TR3.field, COURT = TR3.court, GYF = SCHOOL.gym.floorY;
  const colliders = [], zones = [], allBoxes = [], doors = [];

  const OBJS = []; let OBJ = -1;
  const objBox = (x, y, z) => { const b = OBJS[OBJ].box; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (z < b[2]) b[2] = z; if (x > b[3]) b[3] = x; if (y > b[4]) b[4] = y; if (z > b[5]) b[5] = z; };
  function objScope(kind, fn, self, args) {
    if (OBJ >= 0 || PREC >= 0 || PSINK) return fn.apply(self, args || []);
    const rec = { id: OBJS.length, kind, c0: colliders.length, c1: 0, parts: [], box: [1e9, 1e9, 1e9, -1e9, -1e9, -1e9], g0: glassPos.length, s0: signList.length }; OBJS.push(rec); OBJ = rec.id;
    try { return fn.apply(self, args || []); } finally { OBJ = -1; rec.c1 = colliders.length; rec.g1 = glassPos.length; rec.s1 = signList.length; }
  }
  const objWrap = (fn, kind) => function (...a) { return objScope(kind, fn, this, a); };

  bookshelf = objWrap(bookshelf, 'shelf'); studentDesk = objWrap(studentDesk, 'desk'); chair = objWrap(chair, 'chair'); teacherDesk = objWrap(teacherDesk, 'desk');
  bigDesk = objWrap(bigDesk, 'desk'); officeDesk = objWrap(officeDesk, 'desk'); potPlant = objWrap(potPlant, 'plant'); extinguisher = objWrap(extinguisher, 'ext'); bigPot = objWrap(bigPot, 'plant');
  displayCase = objWrap(displayCase, 'case'); lockerBank = objWrap(lockerBank, 'locker'); instrumentShelf = objWrap(instrumentShelf, 'shelf'); angleShelf = objWrap(angleShelf, 'shelf'); steelShelf = objWrap(steelShelf, 'shelf');
  greenBoard = objWrap(greenBoard, 'board'); whiteLockers = objWrap(whiteLockers, 'locker'); tallCab = objWrap(tallCab, 'cab'); openShelf = objWrap(openShelf, 'shelf'); frameBoard = objWrap(frameBoard, 'board');
  acUnit = objWrap(acUnit, 'ac'); wallFan = objWrap(wallFan, 'fan'); tvCorner = objWrap(tvCorner, 'tv'); car = objWrap(car, 'car'); goal = objWrap(goal, 'goal');
  tree = objWrap(tree, 'tree'); bgTree = objWrap(bgTree, 'tree'); pine = objWrap(pine, 'tree'); prunedPine = objWrap(prunedPine, 'tree'); spreadPine = objWrap(spreadPine, 'tree'); ballJuniper = objWrap(ballJuniper, 'tree'); shrub = objWrap(shrub, 'bush');
  mound = objWrap(mound, 'bush');
  let busDoor = null;
  const hotspots = [];
  const hideSpots = [];
  const hideAt = (kind, label, ax, a0, a1, wall, f, D, H, yb) => { const L = a1 - a0, c = (a0 + a1) / 2; if (H >= 0.75 && L >= 0.9) hideSpots.push({ kind, label, x: ax === 'x' ? c : wall + f*D/2, y: yb, z: ax === 'x' ? wall + f*D/2 : c, face: ax === 'x' ? (f > 0 ? 180 : 0) : (f > 0 ? 90 : 270), w: L }); };
  const CHUNK = 16, chunks = new Map();
  const box_ = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const bpos = box_.attributes.position, bnrm = box_.attributes.normal;
  const _c = new THREE.Color();
  const tY = (z, x = 0) => terrainAt(x, z);

  function chunkOf(cx, cz) {
    const key = Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = chunks.get(key);
    if (!ch) { ch = { pos: [], col: [], ao: [] }; chunks.set(key, ch); }
    return ch;
  }

  const AO_NO = 30000, aoQ = v => Math.max(-32000, Math.min(AO_NO, Math.round(v * 100))), aoP = v => Math.max(0, aoQ(v));
  const aoPad = (A, n) => { for (let i = A.length; i < n; i++) A.push(AO_NO); };

  const NS = { ns: true };
  function noStand(c, min = 1.6) { if (c.vy1 == null) c.vy1 = c.y1; c.y1 = Math.max(c.y1, c.y0 + min); c.nc = true; c.ns = true; return c; }

  const AO_FL = [FIELD, YARD, 0, FH, 2 * FH];
  const aoFloor = y0 => { let f = null; for (const v of AO_FL) if (v <= y0 + 0.01) f = v; return f; };
  const aoF = (y, fl) => 0.8 + 0.2 * Math.min(1, Math.max(0, (y - fl) / FH));
  function addBox(w, h, d, hex, cx, baseY, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.1499) throw new Error('헌법① 위반 <0.15m: ' + [w, h, d]);
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2, wall: !!opt.wall });
    const ch = opt.at ? chunkOf(opt.at[0], opt.at[1]) : chunkOf(cx, cz);
    _c.set(hex); _c.multiplyScalar(0.97);
    const cy = baseY + h / 2, fl = opt.wall && !opt.flat ? aoFloor(baseY) : null, ao = fl !== null && baseY + h <= fl + FH + 0.01;

    let W = opt.flat ? null : opt.aoW || null;
    if (!W && !opt.flat && !opt.wall && h >= 2.0 && Math.min(w, d) <= 0.35 && Math.max(w, d) >= 0.6 && buildingOf(cx, cz) >= 0) {
      const f9 = aoFloor(baseY);
      if (f9 !== null && baseY - f9 < 0.35) W = w >= d ? { ax: 'x', a0: cx - w/2, a1: cx + w/2, fl: baseY, top: baseY + h, out: 0 } : { ax: 'z', a0: cz - d/2, a1: cz + d/2, fl: baseY, top: baseY + h, out: 0 };
    }
    if (W) { aoPad(ch.ao, ch.pos.length / 3 * 4); ch.aoUsed = true; }
    if (OBJ >= 0) { const OB = ch.obj || (ch.obj = []); for (let t = ch.pos.length / 9; OB.length < t;) OB.push(-1); for (let t = 0; t < bpos.count / 3; t++) OB.push(OBJ); objBox(cx - w/2, baseY, cz - d/2); objBox(cx + w/2, baseY + h, cz + d/2); }
    for (let i = 0; i < bpos.count; i++) {
      const vy = bpos.getY(i)*h+cy, vx = bpos.getX(i)*w+cx, vz = bpos.getZ(i)*d+cz;
      ch.pos.push(vx, vy, vz);
      const ny = bnrm.getY(i), nx = bnrm.getX(i), nz = bnrm.getZ(i);

      const f = opt.flat ? 1 : ny > .5 ? 1 : ny < -.5 ? .62 : (nx !== 0 ? .88 : .94) * (ao ? aoF(vy, fl) : 1);

      if (opt.wall && !opt.flat && nz !== 0) { const k = nz > 0 ? [1.025, 1.0, 0.965] : [0.985, 0.99, 1.015]; ch.col.push(_c.r*f*k[0], _c.g*f*k[1], _c.b*f*k[2]); }
      else ch.col.push(_c.r*f, _c.g*f, _c.b*f);
      if (W) {
        const along = W.ax === 'x' ? vx : vz, perp = W.ax === 'x' ? nz : nx;
        if (ny > .5 || ny < -.5) ch.ao.push(AO_NO, AO_NO, AO_NO, AO_NO);
        else if (W.out && perp === W.out) ch.ao.push(AO_NO, AO_NO, aoP(vy - W.fl), AO_NO);
        else ch.ao.push(aoP(along - W.a0), aoP(W.a1 - along), aoP(vy - W.fl), W.top == null ? AO_NO : aoP(W.top - vy));
      }
    }
    if (opt.collide !== false || opt.ns) colliders.push(opt.ns ? noStand({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 })
                                                  : { x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
  }
  function addPanel(w, d, hex, cx, y, cz) {
    const ch = chunkOf(cx, cz);
    _c.set(hex); _c.multiplyScalar(0.97);
    const x0 = cx-w/2, x1 = cx+w/2, z0 = cz-d/2, z1 = cz+d/2;
    PQ.push({ kind: 'panel', x0, x1, z0, z1, y });
    if (OBJ >= 0) { const OB = ch.obj || (ch.obj = []); for (let t = ch.pos.length / 9; OB.length < t;) OB.push(-1); OB.push(OBJ, OBJ); objBox(x0, y, z0); objBox(x1, y, z1); }
    ch.pos.push(x0,y,z0, x0,y,z1, x1,y,z1,  x0,y,z0, x1,y,z1, x1,y,z0);
    for (let i = 0; i < 6; i++) ch.col.push(_c.r, _c.g, _c.b);
  }

  const DNEAR = new Map(), DFAR = new Map();
  const _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _de = new THREE.Euler(), _dv = new THREE.Vector3(), _ds = new THREE.Vector3();
  const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
  const BLOB1 = new THREE.IcosahedronGeometry(1, 1), BLOB0 = new THREE.IcosahedronGeometry(1, 0);

  const BRECT = [[...B.front.x, ...B.front.z], [...B.entrance.x, ...B.entrance.z], [...B.wings[0].x, ...B.wings[0].z], [...B.kitchen.x, ...B.kitchen.z],
    [...B.centerLobby.x, ...B.centerLobby.z], [...B.linkCorridor.x, ...B.linkCorridor.z], [...B.eastWing.x, ...B.eastWing.z]];
  { const g = SCHOOL.gym; BRECT.push([g.center[0] - g.width/2, g.center[0] + g.width/2, g.center[1] - g.depth/2, g.center[1] + g.depth/2], [...g.annex.x, ...g.annex.z]); }
  const buildingOf = (x, z) => BRECT.findIndex(([a, b, c, d]) => x > a + 0.2 && x < b - 0.2 && z > c + 0.2 && z < d - 0.2);

  function dKey(cx, cz, cy = 0) { const bi = buildingOf(cx, cz), fl = bi >= 0 && cy > FH + 0.15 ? 2 : 1; return (bi >= 0 ? 'i' + bi + (fl === 2 ? 'u' : '') + ':' : 'o') + Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK); }

  const chBB = ch => { if (!ch.bb) { const P = ch.pos, b = ch.bb = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9]; for (let i = 0; i < P.length; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2];
      if (x < b[0]) b[0] = x; if (x > b[1]) b[1] = x; if (y < b[2]) b[2] = y; if (y > b[3]) b[3] = y; if (z < b[4]) b[4] = z; if (z > b[5]) b[5] = z; } } return ch.bb; };
  const inBB = (ch, x0, x1, y0, y1, z0, z1, m = 0.05) => { if (!ch) return false; const b = chBB(ch); return x0 >= b[0] - m && x1 <= b[1] + m && y0 >= b[2] - m && y1 <= b[3] + m && z0 >= b[4] - m && z1 <= b[5] + m; };
  function dChunk(far, cx, cz, cy = 0) {
    if (far) return chunkOf(cx, cz);
    const bi = buildingOf(cx, cz), inside = bi >= 0, fl = inside && cy > FH + 0.15 ? 2 : 1;
    const key = dKey(cx, cz, cy);
    let ch = DNEAR.get(key);
    if (!ch) { ch = { pos: [], col: [], cx: (Math.floor(cx / CHUNK) + 0.5) * CHUNK, cz: (Math.floor(cz / CHUNK) + 0.5) * CHUNK, inside, bi, fl }; DNEAR.set(key, ch); }
    return ch;
  }

  const _nm = new THREE.Matrix3(), _n0 = new THREE.Vector3();
  const triNormals = (P, out) => { for (let i = out.length; i + 8 < P.length; i += 9) {
    const ax = P[i + 3] - P[i], ay = P[i + 4] - P[i + 1], az = P[i + 5] - P[i + 2], bx = P[i + 6] - P[i], by = P[i + 7] - P[i + 1], bz = P[i + 8] - P[i + 2];
    const x = ay * bz - az * by, y = az * bx - ax * bz, z = ax * by - ay * bx, s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    out.push(x * s, y * s, z * s, x * s, y * s, z * s, x * s, y * s, z * s); } return out; };

  let PSINK = null, PREC = -1, PPART = 0;
  function dGeo(geo, m, hex, opt = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, N = opt.smooth && !opt.far ? g.attributes.normal : null;
    const ch = PSINK || (opt.at ? (opt.far ? chunkOf(opt.at[0], opt.at[1]) : dChunk(false, opt.at[0], opt.at[1], _dv.setFromMatrixPosition(m).y)) : dChunk(!!opt.far, _dv.setFromMatrixPosition(m).x, _dv.z, _dv.y));
    let OWN = null; if (PREC >= 0 && !PSINK) { OWN = ch.own || (ch.own = []); for (let t = ch.pos.length / 9; OWN.length < t;) OWN.push(-1); }
    let OB = null; if (OBJ >= 0 && !PSINK) { OB = ch.obj || (ch.obj = []); for (let t = ch.pos.length / 9; OB.length < t;) OB.push(-1); }
    const PART = PSINK ? PSINK.part : null;
    if (N && !ch.nor) ch.nor = triNormals(ch.pos, []);
    if (N) _nm.getNormalMatrix(m);
    const NO = ch.nor;
    _c.set(hex); _c.multiplyScalar(0.97);
    const jit = opt.jitter || 0;
    for (let i = 0; i < P.count; i += 3) {
      _p0.fromBufferAttribute(P, i).applyMatrix4(m); _p1.fromBufferAttribute(P, i + 1).applyMatrix4(m); _p2.fromBufferAttribute(P, i + 2).applyMatrix4(m);
      const ny = _ds.subVectors(_p1, _p0).cross(_dv.subVectors(_p2, _p0)).normalize().y;
      let f = opt.flat || N ? 1 : ny > .5 ? 1 : ny < -.5 ? .62 : .9;
      if (jit) f *= 1 + jit * (Math.sin(i * 12.9898 + _p0.x * 3.1) * 0.5);
      ch.pos.push(_p0.x, _p0.y, _p0.z, _p1.x, _p1.y, _p1.z, _p2.x, _p2.y, _p2.z);
      for (let k = 0; k < 3; k++) ch.col.push(_c.r * f, _c.g * f, _c.b * f);
      if (OWN) OWN.push(PREC); if (PART) PART.push(PPART, PPART, PPART);
      if (OB) { OB.push(OBJ); objBox(_p0.x, _p0.y, _p0.z); objBox(_p1.x, _p1.y, _p1.z); objBox(_p2.x, _p2.y, _p2.z); }
      if (NO) { if (N) for (let k = 0; k < 3; k++) { _n0.fromBufferAttribute(N, i + k).applyMatrix3(_nm).normalize(); NO.push(_n0.x, _n0.y, _n0.z); }
        else NO.push(_ds.x, _ds.y, _ds.z, _ds.x, _ds.y, _ds.z, _ds.x, _ds.y, _ds.z); }
    }
  }
  function dBox(w, h, d, hex, cx, y0, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.0299) throw new Error('DETAIL 부재 <3cm: ' + [w, h, d]);
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0, y1: y0+h, z0: cz-d/2, z1: cz+d/2, detail: true });
    if (opt.collide) colliders.push({ x0: cx-w/2, x1: cx+w/2, y0, y1: y0+h, z0: cz-d/2, z1: cz+d/2 });
    _dm.compose(_dv.set(cx, y0 + h/2, cz), _dq.identity(), _ds.set(w, h, d));
    dGeo(box_, _dm, hex, opt);
  }

  const CYLC = new Map();
  function dCyl(rt, rb, h, hex, cx, y0, cz, opt = {}) {
    const seg = opt.seg || 7, key = rt + ',' + rb + ',' + h + ',' + seg;
    let g = CYLC.get(key);
    if (!g) { const g0 = new THREE.CylinderGeometry(rt, rb, h, seg, 1); g0.translate(0, h / 2, 0); g = g0.toNonIndexed(); g0.dispose(); CYLC.set(key, g); }
    const r = opt.rot || [0, 0, 0];
    _dm.compose(_dv.set(cx, y0, cz), _dq.setFromEuler(_de.set(r[0], r[1], r[2])), _ds.set(1, 1, 1));
    dGeo(g, _dm, hex, opt);
  }

  function dBlob(sx, sy, sz, hex, cx, cy, cz, opt = {}) {
    _dm.compose(_dv.set(cx, cy, cz), _dq.setFromEuler(_de.set(0, opt.ry || 0, 0)), _ds.set(sx, sy, sz));
    dGeo(opt.chunky ? BLOB0 : BLOB1, _dm, hex, opt);
  }

  const ROD = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0).toNonIndexed(), _up = new THREE.Vector3(0, 1, 0), _rd = new THREE.Vector3();
  const visRods = [];
  const softVols = [];
  function dRod(x0, y0, z0, x1, y1, z1, r, hex, opt = {}) {
    visRods.push({ x0: Math.min(x0, x1) - r, x1: Math.max(x0, x1) + r, y0: Math.min(y0, y1) - r, y1: Math.max(y0, y1) + r, z0: Math.min(z0, z1) - r, z1: Math.max(z0, z1) + r, r, a: [x0, y0, z0], b: [x1, y1, z1] });
    _rd.set(x1 - x0, y1 - y0, z1 - z0); const L = _rd.length(); _rd.divideScalar(L);
    _dm.compose(_dv.set(x0, y0, z0), _dq.setFromUnitVectors(_up, _rd), _ds.set(r, L, r));
    dGeo(ROD, _dm, hex, opt);
  }
  const post = (x, z, y0, y1, r = 0.08) => colliders.push({ x0: x - r, x1: x + r, y0, y1, z0: z - r, z1: z + r });

  function partAt(x, y, z, face, s) {
    return (lx, ly, lz, w, h, d, hex, opt) => {
      const [fx, fz, rx, rz] = [[0, -1, 1, 0], [1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1]][face & 3];
      const wx = x + (lx * rx + lz * fx) * s, wz = z + (lx * rz + lz * fz) * s;
      const odd = face & 1;
      dBox((odd ? d : w) * s, h * s, (odd ? w : d) * s, hex, wx, y + ly * s, wz, opt);
    };
  }
  const hash2 = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };

  const plinths = [];
  function buildPlinths() {
    const low = []; let seen = 0;
    for (const p of plinths) {
      for (; seen < allBoxes.length; seen++) { const b = allBoxes[seen]; if (!(b.y0 >= 0.45 || b.y1 <= 0)) low.push(b); }
      const bb = p.ax === 'x' ? { z0: p.o - 0.02, z1: p.o + 0.02 } : { x0: p.o - 0.02, x1: p.o + 0.02 };
      const cut = [];
      for (const b of low) {
        const hit = p.ax === 'x'
          ? (b.z1 > bb.z0 + 0.004 && b.z0 < bb.z1 - 0.004 && b.x1 > p.a0 && b.x0 < p.a1)
          : (b.x1 > bb.x0 + 0.004 && b.x0 < bb.x1 - 0.004 && b.z1 > p.a0 && b.z0 < p.a1);
        if (hit) cut.push(p.ax === 'x' ? [b.x0 - 0.02, b.x1 + 0.02] : [b.z0 - 0.02, b.z1 + 0.02]);
      }
      cut.sort((u, v) => u[0] - v[0]);
      let a = p.a0;
      const emit = (u, v) => { if (v - u < 0.15) return; p.ax === 'x' ? dBox(v - u, 0.45, 0.04, 0x857563, (u + v)/2, 0, p.o) : dBox(0.04, 0.45, v - u, 0x857563, p.o, 0, (u + v)/2); };
      for (const [u, v] of cut) { if (u > a) emit(a, Math.min(u, p.a1)); a = Math.max(a, v); }
      if (a < p.a1) emit(a, p.a1);
    }
  }

  const baseboards = [], BB_FLOORS = [0, GYF, FH + 0.3], BB_H = 0.113, BB_T = 0.03, BB_COL = 0x8f7d6a;
  function buildBaseboards() {
    const G9 = new Map(), key = (i, j) => i * 4096 + j, add = b => { for (let i = Math.floor(b.x0 / 4); i <= Math.floor(b.x1 / 4); i++) for (let j = Math.floor(b.z0 / 4); j <= Math.floor(b.z1 / 4); j++) { const k = key(i, j); let L = G9.get(k); if (!L) G9.set(k, L = []); L.push(b); } };
    for (const b of allBoxes) if (b.x1 - b.x0 < 60 && b.z1 - b.z0 < 60) add(b);

    const FG = new Map(), fAdd = (r, y) => { if (!BB_FLOORS.some(v => y > v - 0.03 && y < v + 0.03)) return; for (let i = Math.floor(r.x0 / 4); i <= Math.floor(r.x1 / 4); i++) for (let j = Math.floor(r.z0 / 4); j <= Math.floor(r.z1 / 4); j++) { const k = key(i, j); let L = FG.get(k); if (!L) FG.set(k, L = []); L.push([r.x0, r.x1, r.z0, r.z1, y]); } };
    for (const q of PQ) fAdd(q, q.y); for (const b of allBoxes) if (!b.detail) fAdd(b, b.y1);
    const floorAt = (x, z, y) => (FG.get(key(Math.floor(x / 4), Math.floor(z / 4))) || []).some(r => r[4] > y - 0.03 && r[4] < y + 0.03 && x > r[0] - 0.02 && x < r[1] + 0.02 && z > r[2] - 0.02 && z < r[3] + 0.02);

    const K9 = p => [p.ax, p.o.toFixed(3), p.s, p.y.toFixed(3), p.h ?? BB_H, p.t ?? BB_T, p.col ?? BB_COL].join('|'), grp = new Map();
    for (const p of baseboards) { const k = K9(p); let L = grp.get(k); if (!L) grp.set(k, L = []); L.push({ ...p }); }
    const recs = [];
    for (const L of grp.values()) { L.sort((u, v) => u.a0 - v.a0); let c = null; for (const p of L) { if (c && p.a0 <= c.a1 + 0.001) c.a1 = Math.max(c.a1, p.a1); else recs.push(c = p); } }

    const SKIN = new Map(), skin = (ax, s, bot) => { const k = ax + s + bot; if (!SKIN.has(k)) { const P = box_.attributes.position.array, drop = [bot ? -1 : 3, ax === 'x' ? (s > 0 ? 5 : 4) : (s > 0 ? 1 : 0)], out = [];
        for (let f = 0; f < 6; f++) if (!drop.includes(f)) for (let i = f * 18; i < f * 18 + 18; i++) out.push(P[i]);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); SKIN.set(k, g); } return SKIN.get(k); };
    for (const p of recs) {
      const H9 = p.h ?? BB_H, T9 = p.t ?? BB_T, y0 = p.y, y1 = p.y + H9, t0 = p.s > 0 ? p.o : p.o - T9, t1 = t0 + T9;
      const vol = p.ax === 'x' ? { x0: p.a0, x1: p.a1, z0: t0, z1: t1 } : { x0: t0, x1: t1, z0: p.a0, z1: p.a1 };
      const cut = [], seen = new Set();
      for (let i = Math.floor(vol.x0 / 4); i <= Math.floor(vol.x1 / 4); i++) for (let j = Math.floor(vol.z0 / 4); j <= Math.floor(vol.z1 / 4); j++) for (const b of G9.get(key(i, j)) || []) {
        if (seen.has(b)) continue; seen.add(b);
        if (b.y1 <= y0 + 0.004 || b.y0 >= y1 - 0.004) continue;
        if (b.x1 <= vol.x0 + 0.004 || b.x0 >= vol.x1 - 0.004 || b.z1 <= vol.z0 + 0.004 || b.z0 >= vol.z1 - 0.004) continue;
        cut.push(p.ax === 'x' ? [b.x0 - 0.01, b.x1 + 0.01] : [b.z0 - 0.01, b.z1 + 0.01]);
      }
      cut.sort((u, v) => u[0] - v[0]);
      let a = p.a0;
      const emit = (u, v) => { if (v - u < 0.15) return; const c = (u + v) / 2, tc = (t0 + t1) / 2, at = p.ax === 'x' ? [c, p.o + p.s * 0.6] : [p.o + p.s * 0.6, c];
        const w = p.ax === 'x' ? v - u : T9, d = p.ax === 'x' ? T9 : v - u, cx = p.ax === 'x' ? c : tc, cz = p.ax === 'x' ? tc : c;

        const X0 = cx - w/2, X1 = cx + w/2, Z0 = cz - d/2, Z1 = cz + d/2, ok = [at, [cx, cz]].find(q => inBB(DNEAR.get(dKey(q[0], q[1], y0 + 0.05)), X0, X1, y0, y0 + H9, Z0, Z1, 0.3));
        const o9 = ok ? { at: ok } : inBB(chunks.get(Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK)), X0, X1, y0, y0 + H9, Z0, Z1, 0.3) ? { far: true, at: [cx, cz] } : null;
        if (!o9) return;
        const bx = { x0: X0, x1: X1, y0, y1: y0 + H9, z0: Z0, z1: Z1, detail: true, ts: true }; allBoxes.push(bx); add(bx);
        _dm.compose(_dv.set(cx, y0 + H9 / 2, cz), _dq.identity(), _ds.set(w, H9, d)); dGeo(skin(p.ax, p.s, !BB_FLOORS.some(v => Math.abs(p.y - v) < 0.01)), _dm, p.col ?? BB_COL, o9);
        };

      const onFloor = BB_FLOORS.some(v => Math.abs(p.y - v) < 0.01);
      const emitS = (u, v) => { if (!onFloor) return emit(u, v);
        const n = Math.max(1, Math.ceil((v - u) / 0.1)), ok = []; for (let i = 0; i <= n; i++) { const q = u + (v - u) * i / n; ok.push(floorAt(p.ax === 'x' ? q : p.o + p.s * 0.08, p.ax === 'x' ? p.o + p.s * 0.08 : q, p.y)); }
        let s = -1; for (let i = 0; i <= n; i++) { if (ok[i] && s < 0) s = i; if ((!ok[i] || i === n) && s >= 0) { const e = ok[i] ? i : i - 1; if (e > s) emit(u + (v - u) * s / n, u + (v - u) * e / n); s = -1; } } };
      for (const [u, v] of cut) { if (u > a) emitS(a, Math.min(u, p.a1)); a = Math.max(a, v); }
      if (a < p.a1) emitS(a, p.a1);
    }
  }

  function wallSeg(ax, len, h, cx, y0, z, hex, opt) {

    const ext = opt.ext ?? (hex === WALL);

    const RY0 = opt.y0 ?? 0, AOW = out => ({ wall: true, aoW: { ax, a0: opt._a0 ?? cx - len/2, a1: opt._a1 ?? cx + len/2, fl: opt.aoFl ?? RY0, top: opt.aoTop ?? RY0 + (opt.h ?? FH), out } });
    const box = (th, col, off, yy, hh) => { const W9 = AOW(ext && off * (opt.face ?? 1) > 0 ? (opt.face ?? 1) : 0);
      ax === 'x' ? addBox(len, hh, th, col, cx, yy, z + off, W9) : addBox(th, hh, len, col, z + off, yy, cx, W9); };

    if (Math.abs(y0 - RY0) < 0.01 && BB_FLOORS.some(v => Math.abs(RY0 - v) < 0.01) && !opt.noBase) {
      const f = opt.face ?? 1;
      for (const s of ext ? [-f] : [1, -1]) baseboards.push({ ax, a0: cx - len/2, a1: cx + len/2, o: z + s * 0.15, s, y: RY0 });
    }
    if ((opt.inner ?? ext) || opt.dado) {
      const f = opt.face ?? 1, d = opt.dado;
      box(0.15, hex, f*0.075, y0, h);

      if (opt.skin) patWall(opt.skin, ax, cx - len/2, cx + len/2, y0, y0 + h, z + f*0.162, f);

      if (ext && y0 === 0 && (opt.y0 ?? 0) === 0 && len >= 0.15) plinths.push({ ax, a0: cx - len/2, a1: cx + len/2, o: z + f*0.17 });
      const lo = d ? Math.max(0, Math.min(h, (opt.y0 ?? 0) + d.top - y0)) : 0;
      if (d && lo >= 0.15 && h - lo >= 0.15) { box(0.15, d.lo, -f*0.075, y0, lo); box(0.15, d.hi, -f*0.075, y0 + lo, h - lo); }
      else box(0.15, d ? (lo >= h - 0.15 ? d.lo : d.hi) : (opt.innerHex ?? INNER), -f*0.075, y0, h);
    } else box(0.3, hex, 0, y0, h);
  }

  function wallRun(ax, a0, a1, line, hex, opt0) {
    const opt = { ...opt0, _a0: opt0._a0 ?? a0, _a1: opt0._a1 ?? a1 };
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, doorGaps = opt.gaps ?? [];
    const gaps = doorGaps.map(g => ({ ...g }));
    if (opt.wins) {
      const n = opt.wins, span = (a1 - a0) / n, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5;
      for (let i = 0; i < n; i++) {
        const wc = a0 + span * (i + .5), ww = Math.min(2.2, span - 1.6);
        if (ww < 1) continue;
        if (doorGaps.some(g => Math.abs(g.c - wc) < g.w/2 + ww/2 + 0.3)) continue;
        if (opt.noWin && opt.noWin.some(([a, b]) => wc + ww/2 > a && wc - ww/2 < b)) continue;
        gaps.push({ c: wc, w: ww, sill, dh: sill + wh, win: true, frame: opt.frame });
      }
    }
    gaps.sort((p, q) => (p.c - p.w/2) - (q.c - q.w/2));
    let cur = a0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6, sl = g.sill ?? 0;
      if (g0 - cur > 0.1499) wallSeg(ax, g0 - cur, h, (cur + g0)/2, y0, line, hex, opt);
      if (sl > 0.1499) wallSeg(ax, g1 - g0, sl, (g0 + g1)/2, y0, line, hex, opt);
      if (h - dh > 0.1499) wallSeg(ax, g1 - g0, h - dh, (g0 + g1)/2, y0 + dh, line, hex, opt);
      if (g.win) { const fw = (opt.ext ?? hex === WALL) ? (opt.face ?? 1) : 0;

        glassPane(ax, g1 - g0, Math.min(dh, h) - sl, (g0 + g1)/2, y0 + sl, line, !fw && sl < 1.6 ? 0.304 : 0.16); winFrame(ax, g0, g1, y0 + sl, y0 + Math.min(dh, h), line, fw, g.frame, g.noLedge);
        winLog.push({ ax, g0, g1, yb: y0 + sl, yt: y0 + Math.min(dh, h), y0, line, f: fw }); }
      else {

        if (sl === 0 && !g.noSill) ax === 'x' ? addPanel(g1 - g0, 0.3, 0xb3aea4, (g0 + g1)/2, y0 + 0.012, line) : addPanel(0.3, g1 - g0, 0xb3aea4, line, y0 + 0.012, (g0 + g1)/2);

        const dy = g.door && sl > 0 ? sl : 0;
        if (!g.noDoor && dh - dy <= 2.8 && (g.w <= 2.2 || g.door)) {
          const d9 = ax === 'x' ? { ax, cx: g.c, cz: line, w: g.w, y0: y0 + dy, dh: dh - dy, lintel: h - dh > 0.1499, glass: !!g.glass, slideOver: !!g.slideOver, color: g.color } : { ax, cx: line, cz: g.c, w: g.w, y0: y0 + dy, dh: dh - dy, lintel: h - dh > 0.1499, glass: !!g.glass, slideOver: !!g.slideOver, color: g.color };
          if (g.swing) d9.swing = g.swing; if (g.late) d9.late = true; if (g.film) d9.film = true;
          doors.push(d9);
        }
      }
      cur = Math.max(cur, g1);
    }
    if (a1 - cur > 0.1499) wallSeg(ax, a1 - cur, h, (cur + a1)/2, y0, line, hex, opt);
  }

  const glassPos = [], winLog = [];
  function glassPane(ax, len, hh, c, y, line, cth = 0.16) {
    const w = ax === 'x' ? len : 0.16, d = ax === 'x' ? 0.16 : len, cx = ax === 'x' ? c : line, cz = ax === 'x' ? line : c;
    const cw = ax === 'x' ? w : cth, cd = ax === 'x' ? cth : d;
    colliders.push({ x0: cx - cw/2, x1: cx + cw/2, y0: y, y1: y + hh, z0: cz - cd/2, z1: cz + cd/2 });
    const iw = ax === 'x' ? w - 0.04 : w, id = ax === 'x' ? d : d - 0.04, ih = hh - 0.04;
    allBoxes.push({ x0: cx - iw/2, x1: cx + iw/2, y0: y + 0.02, y1: y + 0.02 + ih, z0: cz - id/2, z1: cz + id/2 });
    for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*iw + cx, bpos.getY(i)*ih + y + hh/2, bpos.getZ(i)*id + cz);
  }

  function winFrame(ax, g0, g1, yb, yt, line, f, frame, noLedge = false) {
    const FR9 = frame ?? (f ? 0x7a5a3e : 0xdfe3e6), T = 0.2, len = g1 - g0;
    const bx = (a0, a1, y0, y1, th = T, off = 0, col = FR9) => { ax === 'x'
      ? dBox(a1 - a0, y1 - y0, th, col, (a0 + a1)/2, y0, line + off)
      : dBox(th, y1 - y0, a1 - a0, col, line + off, y0, (a0 + a1)/2);
      allBoxes[allBoxes.length - 1].ts = true; };
    bx(g0, g0 + 0.06, yb, yt); bx(g1 - 0.06, g1, yb, yt);
    bx(g0 + 0.06, g1 - 0.06, yt - 0.06, yt); bx(g0 + 0.06, g1 - 0.06, yb, yb + 0.06);
    const nm = len > 2.3 ? 3 : len > 1.3 ? 1 : 0;
    for (let k = 1; k <= nm; k++) { const mc = g0 + len * k / (nm + 1); bx(mc - 0.025, mc + 0.025, yb + 0.06, yt - 0.06); }
    if (f && yt - yb > 1.4) bx(g0 + 0.06, g1 - 0.06, yt - 0.47, yt - 0.42, T - 0.03);
    if (f && !noLedge) bx(g0 - 0.05, g1 + 0.05, yb - 0.05, yb, 0.1, f * 0.2, 0xcfc8ba);
  }
  function wallX(x0, x1, z, hex, opt = {}) {
    if (x0 > x1) { console.warn('wallX 인자 역순 자동 정렬', x0, x1, z); const t = x0; x0 = x1; x1 = t; }
    wallRun('x', x0, x1, z, hex, opt);
  }
  function wallZ(z0, z1, x, hex, opt = {}) {

    if (z0 > z1) { console.warn('wallZ 인자 역순 자동 정렬', z0, z1, x); const t = z0; z0 = z1; z1 = t; }
    wallRun('z', z0 + 0.15, z1 - 0.15, x, hex, opt);
  }

  const signCanvas = new Map(), signList = []; let signMeasure = null;

  function sign(text, x, y, z, rotY = 0, h = 0.42, sty = null) {
    const key = text + (sty ? '|' + sty.bg + sty.fg : '');
    let c = signCanvas.get(key);
    if (!c && text === EXIT_KEY) { c = exitCanvas(); signCanvas.set(key, c); }
    if (!c && text === FLAG_KEY) { c = taegukCanvas(); signCanvas.set(key, c); }
    if (!c) {
      c = document.createElement('canvas');
      if (!signMeasure) { signMeasure = document.createElement('canvas').getContext('2d'); signMeasure.font = '900 84px sans-serif'; }
      c.width = Math.ceil(signMeasure.measureText(text).width) + 56; c.height = 128;
      const g3 = c.getContext('2d');
      if (!(sty && sty.bg === 'none')) { g3.fillStyle = sty ? sty.bg : '#2f6fd0'; g3.beginPath(); g3.roundRect(2,2,c.width-4,c.height-4,20); g3.fill(); }
      g3.font = '900 84px sans-serif'; g3.fillStyle = sty ? sty.fg : '#fff'; g3.textAlign='center'; g3.textBaseline='middle';
      g3.fillText(text, c.width/2, c.height/2 + 4);
      signCanvas.set(key, c);
    }
    const w = h * c.width / c.height;
    const m = new THREE.Object3D();
    m.position.set(x, y, z); m.rotation.y = rotY;
    signList.push({ m, c, w, h });
    return { m, w };
  }

  const EXIT_KEY = '\u0001EXIT', FLAG_KEY = '\u0001FLAG';

  function taegukCanvas() {
    const cv = document.createElement('canvas'); cv.width = 360; cv.height = 240; const g = cv.getContext('2d'), A = Math.atan2(2, 3);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 360, 240);
    g.save(); g.translate(180, 120); g.rotate(A);
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(0, 0, 60, Math.PI, 0); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(0, 0, 60, 0, Math.PI); g.fill();
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(-30, 0, 30, 0, Math.PI); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(30, 0, 30, Math.PI, 0); g.fill();
    g.restore();
    g.fillStyle = '#000000';
    const D = 110, ux = Math.cos(A), uy = Math.sin(A);
    [[-1, -1, A, [1, 1, 1]], [1, 1, A, [0, 0, 0]], [1, -1, -A, [0, 1, 0]], [-1, 1, -A, [1, 0, 1]]].forEach(([sx, sy, a, bars]) => {
      g.save(); g.translate(180 + sx * D * ux, 120 + sy * D * uy); g.rotate(a);
      bars.forEach((b, k) => { const x = -20 + k * 15; if (b) g.fillRect(x, -30, 10, 60); else { g.fillRect(x, -30, 10, 27.5); g.fillRect(x, 2.5, 10, 27.5); } });
      g.restore(); });
    return cv;
  }
  function exitCanvas() {
    const c = document.createElement('canvas'); c.width = 336; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#10a04e'; g.beginPath(); g.roundRect(2, 2, 332, 124, 14); g.fill();
    g.fillStyle = '#fff'; g.fillRect(222, 16, 90, 98); g.fillStyle = '#10a04e'; g.fillRect(236, 30, 62, 84);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(184, 30, 12, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
    const L = pts => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => g.lineTo(q[0], q[1])); g.stroke(); };
    L([[176, 48], [158, 80]]);
    L([[172, 55], [192, 64], [206, 54]]); L([[172, 55], [154, 60], [140, 72]]);
    L([[158, 80], [180, 92], [184, 114]]); L([[158, 80], [144, 100], [120, 106]]);
    g.font = '900 38px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('비상구', 66, 68);
    return c;
  }

  function exitSign(x, z, y, n) {
    const [nx, nz] = n, ry = Math.atan2(nx, nz);
    if (nx === 0) dBox(0.41, 0.18, 0.03, 0xf2f2ee, x, y - 0.09, z + nz * 0.015);
    else dBox(0.03, 0.18, 0.41, 0xf2f2ee, x + nx * 0.015, y - 0.09, z);
    sign(EXIT_KEY, x + nx * 0.032, y, z + nz * 0.032, ry, 0.14);
  }
  function buildSigns() {
    if (!signList.length) return;

    const AW = 2048, RH = 96, PAD = 8, uv = new Map();
    let x = PAD, y = PAD;
    for (const c of signCanvas.values()) {
      const w = Math.ceil(c.width * RH / c.height);
      if (x + w + PAD > AW) { x = PAD; y += RH + PAD; }
      uv.set(c, [x, y, w]); x += w + PAD;
    }
    const AH = y + RH + PAD;
    const at = document.createElement('canvas'); at.width = AW; at.height = AH;
    const g = at.getContext('2d');
    for (const [c, [ux, uy, uw]] of uv) g.drawImage(c, ux, uy, uw, RH);
    const tex = new THREE.CanvasTexture(at); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const pos = [], uvs = [], v = new THREE.Vector3();
    for (const { m, c, w, h } of signList) {
      m.updateMatrix();
      const [ux, uy, uw] = uv.get(c);
      const u0 = ux / AW, u1 = (ux + uw) / AW, v1 = 1 - uy / AH, v0 = 1 - (uy + RH) / AH;

      const quad = (zz, flip) => {
        const xs = flip ? [w/2, -w/2] : [-w/2, w/2];
        const P = [[xs[0], -h/2], [xs[1], -h/2], [xs[1], h/2], [xs[0], -h/2], [xs[1], h/2], [xs[0], h/2]];
        const U = [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];
        P.forEach(([px, py], i) => { v.set(px, py, zz).applyMatrix4(m.matrix); pos.push(v.x, v.y, v.z); uvs.push(U[i][0], U[i][1]); });
      };
      quad(0.008, false); quad(-0.008, true);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 }));
    mesh.matrixAutoUpdate = false; scene.add(mesh); signMesh = mesh;
  }
  let signMesh = null;

  function hangSign(text, x, y, zWall, dir, h = 0.3) {
    const s9 = sign(text, x, y, zWall, Math.PI / 2, h);
    s9.m.position.z = zWall + dir * (s9.w / 2 + 0.17); s9.m.updateMatrix();
  }

  const _tc = new THREE.Color(), _tc2 = new THREE.Color();
  function tree(x, z, s = 1, lite = false) {
    const y = tY(z, x), h = hash2(x, z), ry = h * Math.PI * 2, F = lite ? { far: true, seg: 5 } : { far: true };
    colliders.push({ x0: x-0.21*s, x1: x+0.21*s, y0: y, y1: y+12, z0: z-0.21*s, z1: z+0.21*s });
    dCyl(0.13*s, 0.22*s, 2.3*s, 0x6d4e32, x, y, z, F);
    dCyl(0.05*s, 0.08*s, 0.9*s, 0x6d4e32, x + Math.cos(ry)*0.1*s, y + 1.5*s, z + Math.sin(ry)*0.1*s, { ...F, rot: [0.7*Math.sin(ry), 0, 0.7*Math.cos(ry)] });
    dCyl(0.05*s, 0.08*s, 0.8*s, 0x6d4e32, x - Math.cos(ry)*0.1*s, y + 1.7*s, z - Math.sin(ry)*0.1*s, { ...F, rot: [-0.7*Math.sin(ry), 0, -0.7*Math.cos(ry)] });
    const G = [0x3f7a3f, 0x4d8b4d, 0x5c9a4f];
    const cl = [[0, 2.75, 0, 1.3, 1.0], [0.8, 2.45, 0.2, 0.9, 0.8], [-0.7, 2.5, -0.3, 0.95, 0.8], [0.15, 3.45, -0.15, 0.95, 0.8], [-0.2, 2.35, 0.75, 0.8, 0.7]];
    cl.forEach(([ox, oy, oz, r, sy], i) => {
      const c = Math.cos(ry), sn = Math.sin(ry), wx = x + (ox*c - oz*sn)*s, wz = z + (ox*sn + oz*c)*s;

      _tc.set(G[(i + Math.floor(h*3)) % 3]); if (i === 3) _tc.lerp(_tc2.set(0x6aa85a), 0.55); else if (oy < 2.6) _tc.multiplyScalar(0.86);
      dBlob(r*s, r*sy*s, r*s, _tc.getHex(), wx, y + oy*s, wz, { far: true, chunky: lite, ry: ry + i, jitter: lite ? 0.16 : 0.12 });
    });
  }

  function bgTree(x, z, s = 1) {
    const y = tY(z, x), h = hash2(x, z);
    colliders.push({ x0: x - 0.19*s, x1: x + 0.19*s, y0: y, y1: y + 12, z0: z - 0.19*s, z1: z + 0.19*s });
    canopyBox(x, z, y + 3.2*s, 1.35*s, 1.36*s, 1.36*s, 0);
    dCyl(0.14*s, 0.22*s, 2.6*s, 0x6d4e32, x, y, z, { far: true, seg: 5 });
    dBlob(1.6*s, 1.35*s, 1.6*s, [0x3f7a3f, 0x4d8b4d, 0x467f44][Math.floor(h*3) % 3], x, y + 3.2*s, z, { far: true, chunky: true, ry: h*6, jitter: 0.14 });
    dBlob(1.1*s, 0.95*s, 1.1*s, 0x5c9a4f, x + 0.5*s, y + 4.1*s, z - 0.3*s, { far: true, chunky: true, ry: h*9, jitter: 0.14 });
  }

  function pine(x, z, s = 1) {
    const y = tY(z, x), ry = hash2(x, z) * Math.PI * 2;
    roundCol(x, z, (0.5 * s - 0.05) * 0.9, y, y + 12);
    dCyl(0.28*s, 0.5*s, 3.6*s, 0x6d4e32, x, y, z, { far: true });
    [[2.9, 2.6, 2.8, 0x2f6b46], [4.8, 2.1, 2.5, 0x3a7d52], [6.6, 1.6, 2.2, 0x468c5c], [8.2, 1.0, 1.9, 0x4f9663]]
      .forEach(([yy, r, h, c], i) => dCyl(0, r*s, h*s, c, x, y + yy*s, z, { far: true, seg: 8, rot: [0, ry + i*0.4, 0] }));
  }

  function car(cx, cz, body, roof, y = 0, L = 4.0, W = 1.8, at = null) {
    colliders.push(noStand({ x0: cx - W/2, x1: cx + W/2, y0: y, y1: y + 1.25, z0: cz - L/2, z1: cz + L/2 }));
    const F = at ? { far: true, at } : { far: true };
    dBox(W, 0.5, L, body, cx, y + 0.25, cz, F);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => dCyl(0.32, 0.32, 0.22, 0x26282c, cx + sx*(W/2 - 0.08), y + 0.32, cz + sz*(L/2 - 0.75), { ...F, seg: 10, rot: [0, 0, Math.PI/2] }));
    dBox(W - 0.24, 0.4, L * 0.48, 0x34424f, cx, y + 0.75, cz + 0.1, F);
    dBox(W - 0.2, 0.08, L * 0.5, roof, cx, y + 1.15, cz + 0.1, F);
    [-1, 1].forEach(sx => {
      dBox(0.3, 0.12, 0.04, 0xf4f1e0, cx + sx*(W/2 - 0.3), y + 0.55, cz - L/2 - 0.02);
      dBox(0.3, 0.12, 0.04, 0xc0392b, cx + sx*(W/2 - 0.3), y + 0.55, cz + L/2 + 0.02);
    });
  }

  const BOOK = [0xc0392b, 0x2e6da4, 0xe8a33d, 0x3fa37a, 0x8a6ad0, 0xe0708a, 0x5bb5c9, 0xf2d15c, 0x6b5b4a, 0xecebe4];
  function bookshelf(cx, cz, w = 6) {
    colliders.push(noStand({ x0: cx - w/2, x1: cx + w/2, y0: 0, y1: 1.9, z0: cz - 0.25, z1: cz + 0.25 }));
    const WD = 0x8a6a45;
    [-1, 1].forEach(sx => dBox(0.05, 1.9, 0.5, WD, cx + sx*(w/2 - 0.025), 0, cz));
    dBox(w - 0.1, 0.05, 0.5, WD, cx, 1.85, cz);
    dBox(w - 0.14, 1.76, 0.04, 0x7a5a3a, cx, 0.09, cz);
    const LV = [0.05, 0.5, 0.95, 1.4];
    LV.forEach(y => dBox(w - 0.1, 0.04, 0.5, WD, cx, y, cz));
    LV.forEach((y, li) => [-1, 1].forEach(sz => {
      let x = cx - w/2 + 0.07, k = 0;
      while (x < cx + w/2 - 0.35) {
        const h9 = hash2(x * 3.1 + li, cz + sz), bw = 0.22 + h9 * 0.3, bh = 0.26 + ((h9 * 7) % 1) * 0.12;
        const x1 = Math.min(x + bw, cx + w/2 - 0.07);
        dBox(x1 - x - 0.01, bh, 0.19, BOOK[(k + li * 3 + (sz > 0 ? 5 : 0)) % BOOK.length], (x + x1)/2, y + 0.04, cz + sz * 0.125);
        x = x1 + 0.01; k++;
      }
    }));
  }

  const METAL = 0x8a9096;

  const RO = (rot, ox, oz) => rot ? [oz, -ox] : [ox, oz];
  const rBox = (rot, w, h, d, hex, cx, y0, cz, ox, oz, opt) => { const [px, pz] = RO(rot, ox, oz); rot ? dBox(d, h, w, hex, cx + px, y0, cz + pz, opt) : dBox(w, h, d, hex, cx + px, y0, cz + pz, opt); };
  const rCol = (rot, cx, cz, hw, hd, y0, y1) => rot ? { x0: cx-hd, x1: cx+hd, y0, y1, z0: cz-hw, z1: cz+hw } : { x0: cx-hw, x1: cx+hw, y0, y1, z0: cz-hd, z1: cz+hd };

  const tinyOf = (c, rot, cx, cz, parts) => { c.tiny = parts.map(([ox, oz, hw, hd, a, b]) => { const [px, pz] = RO(rot, ox, oz); return rCol(rot, cx + px, cz + pz, hw, hd, a, b); }); return c; };
  function studentDesk(cx, y, cz, top = 0xc9a06a, w = 1.1, rot = 0) {
    const lx0 = w/2 - 0.05;
    colliders.push(tinyOf(noStand(rCol(rot, cx, cz, w/2, 0.25, y, y+0.72)), rot, cx, cz, [[0, 0, w/2, 0.25, y+0.68, y+0.72], [0, -0.03, (w-0.14)/2, 0.18, y+0.52, y+0.62],
      ...[[-lx0, -0.2], [lx0, -0.2], [-lx0, 0.2], [lx0, 0.2]].map(([ox, oz]) => [ox, oz, 0.02, 0.02, y, y+0.68])]));
    rBox(rot, w, 0.04, 0.5, top, cx, y+0.68, cz, 0, 0);
    const lx = w/2 - 0.05;
    [[-lx, -0.2], [lx, -0.2], [-lx, 0.2], [lx, 0.2]].forEach(([ox, oz]) => rBox(rot, 0.04, 0.68, 0.04, METAL, cx, y, cz, ox, oz));
    rBox(rot, w - 0.14, 0.1, 0.36, 0x9aa0a6, cx, y+0.52, cz, 0, -0.03);
  }
  const seatsOf = {};
  const npcSpot = {};
  const PEOPLE = []; let personGeo = null;
  let NPCN = 0; const tourSpots = [];
  function chair(cx, y, cz, back = 1, col = 0x6f8fb0, rot = 0) {
    colliders.push(tinyOf(noStand(rCol(rot, cx, cz, 0.25, 0.2, y, y+0.85)), rot, cx, cz, [[0, 0, 0.21, 0.2, y+0.42, y+0.46], [0, back*0.17, 0.21, 0.0175, y+0.57, y+0.83],
      [-0.18, back*0.17, 0.015, 0.015, y+0.46, y+0.57], [0.18, back*0.17, 0.015, 0.015, y+0.46, y+0.57], ...[[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].map(([ox, oz]) => [ox, oz, 0.015, 0.015, y, y+0.42])]));
    rBox(rot, 0.42, 0.04, 0.4, col, cx, y+0.42, cz, 0, 0);
    rBox(rot, 0.42, 0.26, 0.035, col, cx, y+0.57, cz, 0, back*0.17);
    [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].forEach(([ox, oz]) => rBox(rot, 0.03, 0.42, 0.03, METAL, cx, y, cz, ox, oz));
    [-0.18, 0.18].forEach(ox => rBox(rot, 0.03, 0.11, 0.03, METAL, cx, y+0.46, cz, ox, back*0.17));
  }
  function teacherDesk(cx, y, cz, rot = 0) {
    hideSpots.push({ kind: 'desk', label: '교탁 밑', x: cx, y, z: cz, face: rot ? 270 : 180, w: 1.2 });

    colliders.push(tinyOf(noStand(rCol(rot, cx, cz, 0.6, 0.3, y, y+0.85)), rot, cx, cz, [[0, 0, 0.62, 0.32, y+0.8, y+0.85], [-0.36, 0, 0.21, 0.28, y, y+0.8], [0.55, 0, 0.03, 0.28, y, y+0.8],
      [-0.3, 0.1, 0.28, 0.02, y+0.85, y+1.26], [0.3, 0.1, 0.28, 0.02, y+0.85, y+1.26]]));
    rBox(rot, 1.24, 0.05, 0.64, 0xd9d6ce, cx, y+0.8, cz, 0, 0);
    rBox(rot, 0.42, 0.8, 0.56, 0x6b6f76, cx, y, cz, -0.36, 0);
    rBox(rot, 0.06, 0.8, 0.56, 0x6b6f76, cx, y, cz, 0.55, 0);
    [0.18, 0.43, 0.66].forEach(hy => rBox(rot, 0.16, 0.03, 0.03, 0xc9ccd0, cx, y+hy, cz, -0.36, -0.295));
    [-0.3, 0.3].forEach(ox => { rBox(rot, 0.08, 0.07, 0.08, 0x3a3d44, cx, y+0.85, cz, ox, 0.1); rBox(rot, 0.56, 0.34, 0.04, 0x2f3238, cx, y+0.92, cz, ox, 0.1);
      rBox(rot, 0.5, 0.28, 0.03, 0x3d5870, cx, y+0.95, cz, ox, 0.065); });
  }

  function bigDesk(cx, y, cz, dz) {
    hideSpots.push({ kind: 'desk', label: '큰 책상 밑', x: cx, y, z: cz, face: 270, w: 1.2 });
    colliders.push(noStand({ x0: cx - 0.9, x1: cx + 0.9, y0: y, y1: y + 0.76, z0: cz - 0.4, z1: cz + 0.4 }));
    dBox(1.84, 0.04, 0.84, 0xc9a06a, cx, y + 0.72, cz);
    dBox(0.45, 0.72, 0.76, 0xa8834f, cx + 0.64, y, cz);
    [0.2, 0.45, 0.66].forEach(hy => dBox(0.16, 0.03, 0.03, 0xe0d4bc, cx + 0.64, y + hy, cz - dz * 0.395));
    dBox(0.05, 0.72, 0.76, 0xa8834f, cx - 0.855, y, cz);
    dBox(1.2, 0.5, 0.03, 0xa8834f, cx - 0.21, y + 0.22, cz + dz * 0.365);
    dBox(0.08, 0.07, 0.08, 0x3a3d44, cx - 0.35, y + 0.76, cz + dz * 0.2); dBox(0.56, 0.34, 0.04, 0x2f3238, cx - 0.35, y + 0.83, cz + dz * 0.22);
    dBox(0.5, 0.28, 0.03, 0x3d5870, cx - 0.35, y + 0.86, cz + dz * 0.185);
    dBox(0.42, 0.03, 0.15, 0xe6e6e0, cx - 0.35, y + 0.76, cz - dz * 0.08);
    dBox(0.3, 0.06, 0.22, 0x6fa0d0, cx + 0.45, y + 0.76, cz + dz * 0.05); dBox(0.26, 0.05, 0.2, 0xe8b84a, cx + 0.45, y + 0.82, cz + dz * 0.06);
  }
  function officeDesk(cx, y, cz, w = 1.3, dir = 1, lite = false) {
    hideSpots.push({ kind: 'desk', label: '책상 밑', x: cx - 0.1, y, z: cz, face: dir > 0 ? 0 : 180, w: Math.min(w, 1.2) });
    colliders.push(noStand({ x0: cx-w/2, x1: cx+w/2, y0: y, y1: y+0.74, z0: cz-0.35, z1: cz+0.35 }));
    dBox(w+0.04, 0.04, 0.74, 0xd9cdb6, cx, y+0.7, cz);
    if (!lite) dBox(0.05, 0.7, 0.66, 0xb8ab94, cx-w/2+0.03, y, cz);
    if (!lite) dBox(0.4, 0.7, 0.62, 0xb8ab94, cx+w/2-0.25, y, cz);
    if (!lite) dBox(0.08, 0.14, 0.08, 0x3a3d44, cx, y+0.74, cz-0.2*dir);
    dBox(0.56, 0.34, 0.04, 0x2f3238, cx, y+(lite ? 0.74 : 0.88), cz-0.2*dir);
    if (!lite) dBox(0.44, 0.03, 0.15, 0xe6e6e0, cx, y+0.74, cz+0.08*dir);
  }

  const HALL_DADO = { top: 1.1, lo: 0xbfd89a, hi: 0xefe9dc };
  const STAIR_DADO = { top: 1.3, lo: 0xf2d27a, hi: 0xd4ece2 };
  const WALL = 0xd8c39a, PAVE = 0xcfc8ba, INNER = 0xefe9dc, FLOOR = 0xe7e2d6, WOOD = 0xc9a063, CEIL = 0xf2eee4;
  const KHAKI = 0x9c9b7b, BLUE = 0x3f6fb0, YEL = 0xf2c230, DKWOOD = 0x4b3b31, BRICK = 0xa65d3f, STONE = 0xb9b7b0, FOUND = 0x857563;

  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfdfbf2 });

  const seeded = s => { s = Math.abs(Math.floor(s)) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const pick = (a, R) => a[((Math.floor(R() * a.length) % a.length) + a.length) % a.length];
  function tiles(g, N, n, cols, grout, gw, R, sheen = 0) {
    const s = N / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = pick(cols, R); g.fillRect(i*s, j*s, s, s);
      if (sheen) { const gr = g.createLinearGradient(i*s, j*s, (i+1)*s, (j+1)*s);
        gr.addColorStop(0, `rgba(255,255,255,${sheen})`); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(90,70,40,${sheen * 0.6})`);
        g.fillStyle = gr; g.fillRect(i*s, j*s, s, s); }
    }
    g.fillStyle = grout;
    for (let i = 0; i <= n; i++) { g.fillRect(i*s - gw/2, 0, gw, N); g.fillRect(0, i*s - gw/2, N, gw); }
  }
  function specks(g, N, k, cols, r0, r1, R, a = 1) {
    g.globalAlpha = a;
    for (let i = 0; i < k; i++) { g.fillStyle = pick(cols, R); g.beginPath(); g.arc(R()*N, R()*N, r0 + R()*(r1-r0), 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  function blotch(g, N, k, cols, r0, r1, a, R) {
    g.globalAlpha = a;
    for (let i = 0; i < k; i++) {
      g.fillStyle = pick(cols, R); const r = r0 + R()*(r1-r0), x = R()*N, y = R()*N;
      for (const [ox, oy] of [[0,0],[N,0],[-N,0],[0,N],[0,-N]]) { g.beginPath(); g.arc(x+ox, y+oy, r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  function bond(g, N, bw, bh, cols, joint, jw, R, odd = 0.5, accent = null) {
    for (let r = 0; r * bh < N; r++) {
      const off = (r % 2) * bw * odd;
      for (let x = -bw + off; x < N; x += bw) {
        g.fillStyle = accent && R() < accent[0] ? pick(accent[1], R) : pick(cols, R);
        g.fillRect(x, r*bh, bw, bh);
        if (x < 0) g.fillRect(x + N, r*bh, bw, bh);
      }
    }
    g.fillStyle = joint;
    for (let r = 0; r * bh <= N; r++) {
      g.fillRect(0, r*bh - jw/2, N, jw);
      const off = (r % 2) * bw * odd;
      for (let x = off; x <= N + bw; x += bw) g.fillRect(x - jw/2, r*bh, jw, bh);
    }
  }
  function planks(g, N, rows, cols, gap, R, minL, maxL) {
    const rh = N / rows;
    for (let r = 0; r < rows; r++) {
      let x = -R() * maxL;
      while (x < N) {
        const L = minL + R() * (maxL - minL), c = pick(cols, R);
        g.fillStyle = c; g.fillRect(x, r*rh, L, rh); if (x < 0) g.fillRect(x + N, r*rh, Math.min(L, -x), rh);
        g.globalAlpha = 0.13; g.fillStyle = '#5a3a1c';
        for (let k = 0; k < 3; k++) { const yy = r*rh + 2 + R() * (rh - 4); g.fillRect(x + 4, yy, L - 8, 1); }
        g.globalAlpha = 1; g.fillStyle = gap; g.fillRect(x, r*rh, 1.5, rh);
        x += L;
      }
      g.fillStyle = gap; g.fillRect(0, r*rh, N, 1.5);
    }
  }
  const PATDEF = {

    tileC:  [0.9, 256, false, (g, N, R) => tiles(g, N, 2, ['#efe6d1', '#ebe1c9', '#f2ead8'], '#d8d2c6', 3, R, 0.08)],
    tileW:  [0.9, 256, false, (g, N, R) => { tiles(g, N, 2, ['#eeebe4', '#eae6dc', '#f1eee8'], '#c9c2b2', 3, R, 0.05); specks(g, N, 160, ['#cfc9bd', '#bdb6a8'], 0.5, 1.1, R); }],
    tileG:  [0.8, 256, false, (g, N, R) => { tiles(g, N, 2, ['#dad7d0', '#d5d2ca', '#dedbd4'], '#b3aea3', 3, R, 0.04); specks(g, N, 900, ['#9c978d', '#f4f2ee', '#7d7870', '#c9b9a0'], 0.5, 1.3, R); }],
    ttile:  [0.8, 256, false, (g, N, R) => tiles(g, N, 4, ['#dfe6ea', '#dbe3e8', '#e4eaee'], '#b7c1c7', 2, R, 0.03)],
    wood:   [1.2, 256, false, (g, N, R) => planks(g, N, 12, ['#c9a676', '#cfad7e', '#c3a070', '#d3b386', '#c8a77a'], '#a98c62', R, 70, 190)],
    ribG:   [0.24, 64, false, (g, N) => { for (let x = 0; x < N; x++) { const v = 0.5 + 0.5 * Math.cos(x / N * Math.PI * 4), c = (a, k) => Math.round(a + v * k);
      g.fillStyle = `rgb(${c(84, 44)},${c(142, 50)},${c(58, 34)})`; g.fillRect(x, 0, 1, N); } }],
    gymw:   [2.4, 256, false, (g, N, R) => planks(g, N, 16, ['#e2b97f', '#dcb074', '#e7c28b', '#d8aa6e'], '#a07448', R, 110, 250)],
    ecor:   [1.6, 256, false, (g, N, R) => { g.fillStyle = '#d9c7a0'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#cfbb93', '#e2d2ae'], 8, 30, 0.25, R); specks(g, N, 500, ['#b9a47c', '#efe3c6'], 0.5, 1.1, R, 0.7); }],
    check:  [0.4, 128, false, (g, N) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2b2b2b' : '#d9d7cf'; g.fillRect(i*32, j*32, 32, 32); } }],
    rmat:   [0.6, 128, false, (g, N) => { g.fillStyle = '#8c3232'; g.fillRect(0, 0, N, N); g.strokeStyle = '#4f8c66'; g.lineWidth = 7;
              for (let k = -N; k <= 2*N; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + N, N); g.moveTo(k, N); g.lineTo(k + N, 0); g.stroke(); } }],
    gmat:   [0.8, 128, false, (g, N, R) => { g.fillStyle = '#55585d'; g.fillRect(0, 0, N, N); g.fillStyle = '#4a4d52'; for (let k = 0; k < N; k += 8) g.fillRect(0, k, N, 3); specks(g, N, 120, ['#6a6d72'], 0.5, 1, R); }],
    pave:   [1.6, 256, false, (g, N, R) => bond(g, N, 32, 16, ['#dcc89c', '#d8c292', '#e1cea6', '#d6c08e'], '#b3a17c', 1.5, R, 0.5, [0.18, ['#b8ad97', '#c98f72', '#8f8b82', '#d2ae62', '#a9b0b8']])],
    brick:  [1.2, 240, false, (g, N, R) => bond(g, N, 48, 24, ['#a9624c', '#b36c55', '#9c5a45', '#b9765e'], '#8a5446', 2, R)],
    ilock:  [1.2, 256, false, (g, N, R) => {
              g.fillStyle = '#978f80'; g.fillRect(0, 0, N, N);
              const bw = N / 5, bh = N / 10, C = ['#e2dccf', '#d8d1c2', '#e6e0d4', '#d3cbbb', '#dcd5c7'];
              const wav = x => Math.sin(x / bw * Math.PI * 4) * 1.4;
              const zig = [0, 2.6, 0, -2.6, 0];
              for (let r = 0; r < 10; r++) for (let k = 0; k < 5; k++) {
                const a = k * bw + (r % 2) * bw / 2, t = r * bh, col = pick(C, R), P = [];
                for (let i = 0; i <= 6; i++) { const x = a + bw * i / 6; P.push([x, t + wav(x)]); }
                for (let i = 1; i <= 3; i++) P.push([a + bw + zig[i], t + bh * i / 4]);
                for (let i = 6; i >= 0; i--) { const x = a + bw * i / 6; P.push([x, t + bh + wav(x)]); }
                for (let i = 3; i >= 1; i--) P.push([a + zig[i], t + bh * i / 4]);
                for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
                  g.fillStyle = col; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy)); g.closePath(); g.fill();
                  g.strokeStyle = '#8a8272'; g.lineWidth = 1.6; g.stroke(); }
              }
              blotch(g, N, 26, ['#b9b09e', '#cfc7b6', '#a9a28f'], 6, 22, 0.18, R); specks(g, N, 260, ['#8f887a', '#efe9dc'], 0.4, 1.0, R, 0.7); }],
    grass:  [3.2, 256, false, (g, N, R) => { g.fillStyle = '#6fa35a'; g.fillRect(0, 0, N, N); blotch(g, N, 70, ['#5e944d', '#80b567', '#699c51', '#78ab5f'], 10, 38, 0.22, R);
              g.lineWidth = 1.2; for (let i = 0; i < 1800; i++) { g.strokeStyle = pick(['rgba(70,120,55,0.45)', 'rgba(140,190,110,0.4)', 'rgba(95,140,70,0.4)'], R); const x = R()*N, y = R()*N; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5)*2, y - 2 - R()*3); g.stroke(); } }],
    dirt:   [4.0, 256, false, (g, N, R) => { g.fillStyle = '#d8c79e'; g.fillRect(0, 0, N, N); blotch(g, N, 55, ['#cdb98f', '#e2d3ad', '#d2bf94'], 12, 50, 0.2, R); specks(g, N, 420, ['#b8a57f', '#efe4c8', '#a8977a'], 0.6, 1.6, R); }],
    asph:   [3.0, 256, false, (g, N, R) => { g.fillStyle = '#8f9094'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#85868a', '#9a9b9f'], 10, 40, 0.3, R); specks(g, N, 900, ['#6f7074', '#b0b1b4'], 0.4, 1, R, 0.8); }],
    gravel: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#b9b3a6'; g.fillRect(0, 0, N, N); specks(g, N, 2200, ['#a39c8e', '#d2ccc0', '#8c867a', '#c7c0b2'], 1, 2.6, R); }],
    chip:   [2.0, 256, false, (g, N, R) => { g.fillStyle = '#a8875f'; g.fillRect(0, 0, N, N); for (let i = 0; i < 1600; i++) { g.fillStyle = pick(['#8e6e48', '#c2a276', '#9c7b52', '#b5946a'], R); g.save(); g.translate(R()*N, R()*N); g.rotate(R()*3.14); g.fillRect(-3, -1, 6, 2.2); g.restore(); } }],
    ctile:  [1.2, 256, true, (g, N, R) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, N, N); specks(g, N, 1500, ['#d3cdc1', '#dcd6ca'], 0.5, 0.95, R); g.fillStyle = '#d6d1c6'; for (let i = 0; i <= 2; i++) { g.fillRect(i*N/2 - 1.5, 0, 3, N); g.fillRect(0, i*N/2 - 1.5, N, 3); } }],
    coffer: [0.6, 128, true, (g, N) => { g.fillStyle = '#cfc8ba'; g.fillRect(0, 0, N, N); g.fillStyle = '#e0dace'; g.fillRect(4, 4, N-8, N-8); g.fillStyle = '#ebe6dc'; g.fillRect(12, 12, N-24, N-24); g.fillStyle = '#f7f5f0'; g.fillRect(20, 20, N-40, N-40); }],
    cflat:  [2.4, 128, true, (g, N) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, N, N); g.fillStyle = '#e3ded3'; g.fillRect(0, 0, N, 1); g.fillRect(0, 0, 1, N); g.fillRect(0, N/2, N, 1); }],
    cwood:  [1.2, 128, true, (g, N, R) => planks(g, N, 8, ['#4e3d32', '#56443a', '#4a392f'], '#2f241e', R, 60, 128)],
    louver: [1.2, 128, true, (g, N, R) => { for (let i = 0; i < 10; i++) { g.fillStyle = pick(['#6b5847', '#735f4c', '#65523f'], R); g.fillRect(i*12.8, 0, 12.8, N); g.fillStyle = '#433428'; g.fillRect(i*12.8 + 11, 0, 1.8, N); } }],
    woodP:  [1.2, 128, false, (g, N, R) => { g.fillStyle = pick(['#4d3c32', '#52413a', '#493a30'], R); g.fillRect(0, 0, N, N); g.globalAlpha = 0.16; g.fillStyle = '#2a1f19'; for (let k = 0; k < 26; k++) g.fillRect(0, R()*N, N, 1); g.fillStyle = '#6a5446'; for (let k = 0; k < 12; k++) g.fillRect(0, R()*N, N, 1); g.globalAlpha = 1;
              g.fillStyle = '#2a211b'; g.fillRect(0, 0, N, 1.5); g.fillRect(0, 0, 1.5, N); g.fillStyle = '#8a7a6c'; [[5, 5], [N - 6, 5], [5, N - 6], [N - 6, N - 6]].forEach(([x, y]) => g.fillRect(x, y, 2, 2)); }],
    mosaic: [1.2, 256, false, (g, N, R) => {
              const C = ['#9fbfd8', '#eed48c', '#e6a9b2', '#b8d3a0', '#a9b4bf', '#e9dcc0', '#f0c9a0'], n = 7, P = [];
              for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const c = pick(C, R), v = 0.92 + R() * 0.12; P.push([(i + 0.5 + (R() - 0.5) * 0.75) * N / n, (j + 0.5 + (R() - 0.5) * 0.75) * N / n, [1, 3, 5].map(o => Math.min(255, parseInt(c.slice(o, o + 2), 16) * v))]); }
              const img = g.createImageData(N, N), d = img.data;
              for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                let a = 1e9, b = 1e9, k = 0;
                for (let q = 0; q < P.length; q++) { let dx = Math.abs(x - P[q][0]), dy = Math.abs(y - P[q][1]); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const dd = dx * dx + dy * dy; if (dd < a) { b = a; a = dd; k = q; } else if (dd < b) b = dd; }
                const o = (y * N + x) * 4, c = Math.sqrt(b) - Math.sqrt(a) < 3.4 ? [242, 239, 232] : P[k][2];
                d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
              }
              g.putImageData(img, 0, 0); }],
    rockW:  [1.2, 128, false, (g, N, R) => {
              const P = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 222 + R() * 26; P.push([(i + 0.5 + (R() - 0.5) * 0.7) * N / 4, (j + 0.5 + (R() - 0.5) * 0.7) * N / 4, [v, v - 2, v - 7]]); }
              const img = g.createImageData(N, N), d = img.data;
              for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                let a = 1e9, b = 1e9, k = 0;
                for (let q = 0; q < P.length; q++) { let dx = Math.abs(x - P[q][0]), dy = Math.abs(y - P[q][1]); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const dd = dx * dx + dy * dy; if (dd < a) { b = a; a = dd; k = q; } else if (dd < b) b = dd; }
                const o = (y * N + x) * 4, c = Math.sqrt(b) - Math.sqrt(a) < 2.2 ? [138, 134, 126] : P[k][2];
                d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
              }
              g.putImageData(img, 0, 0); }],
    brickW: [1.2, 240, false, (g, N, R) => bond(g, N, 48, 16, ['#a5573d', '#b0624a', '#9a5038', '#b86c50'], '#d6ccbd', 2, R)],
    siding: [2.4, 256, false, (g, N, R) => { for (let r = 0; r < 2; r++) { g.fillStyle = pick(['#9a9d8f', '#979a8c', '#9ea193'], R); g.fillRect(0, r*128, N, 128);
        for (let k = 0; k < 22; k++) { g.globalAlpha = 0.10 + R() * 0.12; g.fillStyle = R() < 0.5 ? '#7c7f6c' : '#b3b6a2'; g.fillRect(0, r*128 + 3 + R()*122, N, 1); } g.globalAlpha = 1;
        g.fillStyle = '#7a7d6b'; g.fillRect(0, r*128 + 126, N, 2); } g.fillRect(N - 2, 0, 2, N); }],
    panelB: [2.4, 256, false, (g, N, R) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) { g.fillStyle = pick(['#dcc7a1', '#d8c29a', '#dfcba7'], R); g.fillRect(i*128, j*64, 128, 64); } g.fillStyle = '#bea987'; for (let i = 0; i <= 2; i++) g.fillRect(i*128 - 1, 0, 2, N); for (let j = 0; j <= 4; j++) g.fillRect(0, j*64 - 1, N, 2); }],
    photoB: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#2f6e4f'; g.fillRect(0, 0, N, N);
              for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i*64 + 5 + R()*6, y = j*64 + 5 + R()*6, w = 46 + R()*8, h = 48 + R()*6;
                g.fillStyle = pick(['#f4f1e8', '#fbf7e9', '#e8f0f6'], R); g.fillRect(x, y, w, h);
                if (R() < 0.7) { g.fillStyle = pick(['#9cc3e0', '#e3b39c', '#b9d89e', '#e8d18a', '#c7b3dd', '#8fb28a'], R); g.fillRect(x + 4, y + 4, w - 8, h * 0.55); }
                g.fillStyle = '#9a9a9a'; for (let k = 0; k < 3; k++) g.fillRect(x + 5, y + h*0.68 + k*5, (w - 10) * (0.5 + R()*0.5), 2); } }],
    notice: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#2f6e4f'; g.fillRect(0, 0, N, N);
              for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = i*85 + 8 + R()*8, y = j*85 + 8 + R()*8, w = 62 + R()*8, h = 70;
                g.fillStyle = pick(['#fbf8ee', '#fff6d8', '#f6e3e3', '#e3eef8'], R); g.fillRect(x, y, w, h);
                g.fillStyle = pick(['#d24b4b', '#3b6fb5', '#2f8f5b', '#e0932f'], R); g.fillRect(x + 5, y + 5, w - 10, 9);
                g.fillStyle = '#8d8d8d'; for (let k = 0; k < 7; k++) g.fillRect(x + 5, y + 20 + k*7, (w - 10) * (0.45 + R()*0.55), 2); } }],
    stoneW: [1.6, 256, false, (g, N, R) => { g.fillStyle = '#b9b5ac'; g.fillRect(0, 0, N, N);
              const n = 6, s = N / n, J = [];
              for (let i = 0; i <= n; i++) { J[i] = []; for (let j = 0; j <= n; j++) J[i][j] = [i*s + (i % n ? (R() - 0.5) * s * 0.6 : 0), j*s + (j % n ? (R() - 0.5) * s * 0.6 : 0)]; }
              for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = [J[i][j], J[i+1][j], J[i+1][j+1], J[i][j+1]], cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
                g.fillStyle = pick(['#6e6a62', '#5f5b54', '#77726a', '#66625b', '#7d786f'], R); g.beginPath();
                q.forEach(([x, y], k) => { const X = cx + (x - cx) * 0.86, Y = cy + (y - cy) * 0.86; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill(); } }],
    brickG: [1.2, 240, false, (g, N, R) => bond(g, N, 48, 16, ['#a86a52', '#9d5f48', '#b07459', '#946049'], '#d6ccbd', 2, R)],
    teal:   [0.4, 128, false, (g, N, R) => { g.fillStyle = '#3f7f5e'; g.fillRect(0, 0, N, N); g.fillStyle = '#5f9a78';
              for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12); specks(g, N, 120, ['#2f5f47', '#7fb094'], 0.5, 1.1, R); }],
    tactX:  [0.3, 64, false, (g, N) => { g.fillStyle = '#e8c23e'; g.fillRect(0, 0, N, N); g.fillStyle = '#c9a42c'; for (let k = 0; k < 4; k++) g.fillRect(0, 6 + k*16, N, 5); }],
    tactZ:  [0.3, 64, false, (g, N) => { g.fillStyle = '#e8c23e'; g.fillRect(0, 0, N, N); g.fillStyle = '#c9a42c'; for (let k = 0; k < 4; k++) g.fillRect(6 + k*16, 0, 5, N); }],
    lockD:  [1.0, 64, false, (g, N) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N); g.fillStyle = 'rgba(40,28,20,0.85)'; g.fillRect(0, 0, N, 3); g.fillRect(0, 0, 3, N);
              g.fillStyle = 'rgba(40,28,20,0.35)'; g.fillRect(3, N - 5, N - 3, 2); g.fillRect(N - 5, 3, 2, N - 3); g.fillStyle = '#2f2f33'; g.fillRect(N - 14, N/2 - 7, 4, 14); g.fillStyle = '#f4f1e8'; g.fillRect(N/2 - 10, 8, 20, 7); }],
    mural:  [2.0, 256, false, (g, N, R) => {
              g.fillStyle = '#eaf3dc'; g.fillRect(0, 0, N, N);
              g.fillStyle = '#b9dc8e'; g.beginPath(); g.moveTo(0, N); for (let x = 0; x <= N; x += 8) g.lineTo(x, N * 0.72 + Math.sin(x / N * Math.PI * 2) * 10); g.lineTo(N, N); g.fill();
              g.fillStyle = '#9fcf73'; g.beginPath(); g.moveTo(0, N); for (let x = 0; x <= N; x += 8) g.lineTo(x, N * 0.84 + Math.sin(x / N * Math.PI * 4 + 1) * 6); g.lineTo(N, N); g.fill();
              for (let k = 0; k < 3; k++) { const x = 30 + k * 85 + R() * 20, y = N * 0.62; g.fillStyle = '#8a6a45'; g.fillRect(x - 3, y, 6, 30); g.fillStyle = pick(['#6fbf73', '#8cc26a', '#5fae65'], R); g.beginPath(); g.arc(x, y - 6, 18, 0, 7); g.fill(); }
              for (let k = 0; k < 9; k++) { const x = R() * N, y = N * 0.8 + R() * N * 0.15; g.fillStyle = '#6aa04a'; g.fillRect(x - 1, y, 2, 10); g.fillStyle = pick(['#f26d7d', '#f2c230', '#f08a5d', '#b37fd6', '#ffffff'], R); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
              g.fillStyle = '#c68a4a'; g.beginPath(); g.arc(N * 0.72, N * 0.8, 11, 0, 7); g.fill(); g.beginPath(); g.arc(N * 0.72 - 9, N * 0.8 - 10, 5, 0, 7); g.arc(N * 0.72 + 9, N * 0.8 - 10, 5, 0, 7); g.fill();
              g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(N * 0.9, N * 0.58, 12, 0, 7); g.fill(); }],
    kidsArt: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#c9a877'; g.fillRect(0, 0, N, N);
              for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = i*85 + 6 + R()*8, y = j*85 + 6 + R()*8, w = 70, h = 72;
                g.fillStyle = pick(['#ffffff', '#fdf6e3', '#f3f8ff'], R); g.fillRect(x, y, w, h); g.lineWidth = 3;
                for (let k = 0; k < 4; k++) { g.strokeStyle = pick(['#e24b4b', '#3b6fb5', '#2f8f5b', '#f2a03a', '#8a5ad0'], R); g.beginPath(); const t = R();
                  if (t < 0.35) g.arc(x + 15 + R()*40, y + 15 + R()*40, 6 + R()*10, 0, 7);
                  else if (t < 0.7) { g.moveTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); }
                  else g.rect(x + 10 + R()*35, y + 30 + R()*25, 18, 14);
                  g.stroke(); }
                if (R() < 0.5) { g.fillStyle = '#f2c230'; g.beginPath(); g.arc(x + w - 14, y + 14, 8, 0, 7); g.fill(); } } }],
    film:   [1.2, 128, false, (g, N) => { const gr = g.createLinearGradient(0, 0, N, N); gr.addColorStop(0, '#3a665e'); gr.addColorStop(0.5, '#2c524b'); gr.addColorStop(1, '#264842'); g.fillStyle = gr; g.fillRect(0, 0, N, N); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, N * 0.15, N, N * 0.08); }],
    books:  [1.0, 256, false, (g, N, R) => { g.fillStyle = '#4a3526'; g.fillRect(0, 0, N, N);
      const C9 = ['#c8453a', '#3f6fb0', '#e8b83a', '#4f9a5a', '#8a5cc0', '#e8854a', '#2f4f7a', '#d9d2c0', '#6a3f2e', '#5fb0c8', '#f0e6c8', '#b83a5a', '#7a8a3a', '#2b2b2b'];
      let x = 0; while (x < N) { const w = 5 + Math.floor(R() * 10), h = N * (0.6 + R() * 0.34), c = pick(C9, R);
        g.fillStyle = c; g.fillRect(x, N - h, w - 1, h);
        g.fillStyle = 'rgba(255,255,255,0.35)'; if (R() < 0.6) g.fillRect(x + 1, N - h + h * 0.12, w - 3, 4);
        if (R() < 0.5) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x + 1, N - 20, w - 3, 9); }
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + w - 2, N - h, 1, h);
        x += w; if (R() < 0.04) x += 6 + Math.floor(R() * 16); } }],
    blind:  [0.5, 64, false,(g, N) => { for (let y = 0; y < N; y += 8) { g.fillStyle = '#a87a4b'; g.fillRect(0, y, N, 6); g.fillStyle = '#7f5a34'; g.fillRect(0, y + 6, N, 2); } }],
    hop:    [3.0, 256, false, (g, N) => { g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, N, N);
              g.fillStyle = '#f2b8a0'; g.beginPath(); g.arc(N * 0.2, N * 0.3, 26, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(N * 0.2, N * 0.3, 18, 0, 7); g.fill();
              g.strokeStyle = '#ffffff'; g.lineWidth = 5; const c = [[1, 5], [1, 4], [0, 3], [2, 3], [1, 2], [0, 1], [2, 1], [1, 0]];
              c.forEach(([i, j]) => g.strokeRect(N * 0.32 + i * 36, 16 + j * 38, 36, 38));
              g.fillStyle = '#f2a03a'; g.fillRect(N * 0.32 + 36 + 3, 16 + 5 * 38 + 3, 30, 32); g.fillStyle = '#9ad0e8'; g.fillRect(N * 0.32 + 3, 16 + 3 * 38 + 3, 30, 32); }],
    curtain: [0.5, 128, false, (g, N) => { for (let x = 0; x < N; x++) { const v = 0.5 + 0.5 * Math.cos(x / N * Math.PI * 2), c = (a, k) => Math.round(a + v * k);
      g.fillStyle = `rgb(${c(150, 32)},${c(146, 30)},${c(142, 28)})`; g.fillRect(x, 0, 1, N); } }],
    woodW:  [1.2, 128, false, (g, N, R) => { for (let i = 0; i < 8; i++) { g.fillStyle = pick(['#4d3c32', '#54423a', '#47372e'], R); g.fillRect(i*16, 0, 16, N); g.globalAlpha = 0.18; g.fillStyle = '#2a1f19'; for (let k = 0; k < 4; k++) g.fillRect(i*16 + 2 + R()*12, 0, 1, N); g.globalAlpha = 1; } g.fillStyle = '#2f241e'; for (let i = 0; i <= 8; i++) g.fillRect(i*16 - 0.5, 0, 1, N); }],
  };
  const PAT = new Map();
  const PQ = [];
  function patPush(kind, pts, uv, n, tint, ao = null) {
    let P = PAT.get(kind); if (!P) { P = { pos: [], uv: [], col: [], ao: [] }; PAT.set(kind, P); }
    if (OBJ >= 0) { const OB = P.obj || (P.obj = []); for (let t = P.pos.length / 9; OB.length < t;) OB.push(-1); OB.push(OBJ, OBJ); for (const q of pts) objBox(q[0], q[1], q[2]); }
    if (ao) { aoPad(P.ao, P.pos.length / 3 * 4); P.aoUsed = true; }
    if (n[1] > 0.5) { const xs = pts.map(q => q[0]), zs = pts.map(q => q[2]), ys = pts.map(q => q[1]);
      PQ.push({ kind, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y: Math.max(...ys), rect: new Set(xs).size === 2 && new Set(zs).size === 2 && new Set(ys).size === 1 }); }
    const [a, b, c] = pts;
    const cx = (b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]), cy = (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[0])*(c[2]-a[2]), cz = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
    const ord = (cx*n[0] + cy*n[1] + cz*n[2]) < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    _c.set(tint); if (!PATDEF[kind][2]) _c.multiplyScalar(n[1] > 0.5 ? 0.97 : n[1] < -0.5 ? 0.62 : 0.9);
    for (const i of ord) { P.pos.push(pts[i][0], pts[i][1], pts[i][2]); P.uv.push(uv[i][0], uv[i][1]); P.col.push(_c.r, _c.g, _c.b); if (ao) P.ao.push(...ao[i]); }
  }

  const aoEdge = (x, z, x0, x1, z0, z1) => [aoQ(x - x0), aoQ(x1 - x), aoQ(-(z - z0) - 1), aoQ(z1 - z)];
  function patQuad(kind, x0, x1, z0, z1, y, down = false, tint = 0xffffff, edge = false) {
    const s = PATDEF[kind][0];
    patPush(kind, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [[x0/s, -z0/s], [x1/s, -z0/s], [x1/s, -z1/s], [x0/s, -z1/s]], [0, down ? -1 : 1, 0], tint,
      edge ? [aoEdge(x0, z0, x0, x1, z0, z1), aoEdge(x1, z0, x0, x1, z0, z1), aoEdge(x1, z1, x0, x1, z0, z1), aoEdge(x0, z1, x0, x1, z0, z1)] : null);
  }

  const vnoise = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };

  function patGrid(kind, x0, x1, z0, z1, y, cell, tintFn, skip = null) {
    const nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z1 - z0) / cell));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const ax0 = x0 + (x1 - x0) * i / nx, ax1 = x0 + (x1 - x0) * (i + 1) / nx, az0 = z0 + (z1 - z0) * j / nz, az1 = z0 + (z1 - z0) * (j + 1) / nz;
      if (skip && skip(ax0, ax1, az0, az1)) continue;
      patQuad(kind, ax0, ax1, az0, az1, y);
      const P = PAT.get(kind), n = P.pos.length;
      for (let k = n - 18; k < n; k += 3) { const f = tintFn(P.pos[k], P.pos[k + 2]); P.col[k] *= f[0]; P.col[k + 1] *= f[1]; P.col[k + 2] *= f[2]; }
    }
  }

  function patWall(kind, ax, a0, a1, y0, y1, line, face, tint = 0xffffff) {
    const s = PATDEF[kind][0];
    const pts = ax === 'x' ? [[a0, y0, line], [a1, y0, line], [a1, y1, line], [a0, y1, line]] : [[line, y0, a0], [line, y0, a1], [line, y1, a1], [line, y1, a0]];
    const lo = Math.min(y0, y1), fl = aoFloor(lo);

    const cA = fl !== null && !PATDEF[kind][2] ? pts.map(p => [AO_NO, AO_NO, aoP(p[1] - fl), AO_NO]) : null;
    patPush(kind, pts, [[a0/s, y0/s], [a1/s, y0/s], [a1/s, y1/s], [a0/s, y1/s]], ax === 'x' ? [0, 0, face] : [face, 0, 0], tint, cA);
    if (!PATDEF[kind][2] && fl !== null && Math.max(y0, y1) <= fl + FH + 0.01) { const P = PAT.get(kind), n = P.pos.length;
      for (let k = n - 18; k < n; k += 3) { const f = aoF(P.pos[k + 1], fl); P.col[k] *= f; P.col[k + 1] *= f; P.col[k + 2] *= f; } }
  }

  const floorQ = (kind, x0, x1, z0, z1, y = 0, tint) => patQuad(kind, x0, x1, z0, z1, y + 0.012, false, tint ?? 0xffffff, true);

  const lampPos = [];
  let flagMesh = null;
  function lamp(w, h, d, cx, y, cz) { for (let i = 0; i < bpos.count; i++) lampPos.push(bpos.getX(i)*w + cx, bpos.getY(i)*h + y + h/2, bpos.getZ(i)*d + cz); }

  const ceil = (x0, x1, z0, z1, top, kind = 'ctile') => {
    patQuad(kind, x0 + 0.16, x1 - 0.16, z0 + 0.16, z1 - 0.16, top - 0.16, true, 0xffffff, true);
    colliders.push({ x0: x0 + 0.16, x1: x1 - 0.16, y0: top - 0.16, y1: top - 0.01, z0: z0 + 0.16, z1: z1 - 0.16 });
  };

  const foundation = (x0, x1, z0, z1, top = 0) => addBox(x1 - x0, top - YARD, z1 - z0, FOUND, (x0 + x1) / 2, YARD, (z0 + z1) / 2);
  const doorC = r => r.span[0] + 1.9;

  function potPlant(x, y, z, s = 1, tall = false, pot = 0xc46a4a) {
    dBox(0.2*s, 0.18*s, 0.2*s, pot, x, y, z);
    dBox(0.24*s, 0.04*s, 0.24*s, pot, x, y + 0.18*s, z);
    const h = hash2(x, z), G = [0x4f8f47, 0x5fa052, 0x6aae5a][Math.floor(h * 3) % 3];
    if (tall) {
      dCyl(0.015*s, 0.02*s, 0.42*s, 0x6d4e32, x, y + 0.22*s, z);
      const n = 7, top = y + 0.62*s;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + h * 3, tilt = 0.35 + ((i * 37) % 5) * 0.12, len = (0.36 + ((i * 53) % 4) * 0.05) * s;
        const m = new THREE.Matrix4().makeTranslation(x, top, z).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeRotationX(-tilt))
          .multiply(new THREE.Matrix4().makeTranslation(0, 0, len * 0.5)).multiply(new THREE.Matrix4().makeScale(0.07*s, 0.018*s, len * 0.5));
        dGeo(BLOB0, m, i % 2 ? 0x5fa052 : G, { jitter: 0.15 });
      }
      dBlob(0.06*s, 0.08*s, 0.06*s, 0x74b862, x, top + 0.04*s, z, { chunky: true });
    } else {
      dBlob(0.12*s, 0.1*s, 0.12*s, G, x, y + 0.28*s, z, { chunky: true, ry: h*7, jitter: 0.22 });
      dBlob(0.08*s, 0.07*s, 0.08*s, 0x7cbc68, x + 0.05*s, y + 0.34*s, z - 0.03*s, { chunky: true, ry: h*5 + 1, jitter: 0.22 });
    }
    if (s >= 1.2) colliders.push(noStand({ x0: x - 0.13*s, x1: x + 0.13*s, y0: y, y1: y + 0.22*s, z0: z - 0.13*s, z1: z + 0.13*s }));
  }

  function extinguisher(x, y, z) {
    dCyl(0.09, 0.09, 0.48, 0xc4302b, x, y, z, { seg: 10 });
    dCyl(0.045, 0.065, 0.09, 0x2a2a2a, x, y + 0.48, z, { seg: 8 });
    colliders.push(noStand({ x0: x - 0.12, x1: x + 0.12, y0: y, y1: y + 0.6, z0: z - 0.12, z1: z + 0.12 }));
  }

  function bigPot(x, y, z) {
    dCyl(0.26, 0.2, 0.42, 0xe9e6de, x, y, z, { seg: 12 });
    dCyl(0.03, 0.04, 0.9, 0x6d4e32, x, y + 0.42, z, { seg: 6 });
    [[0, 1.45, 0, 0.42], [0.18, 1.15, 0.1, 0.3], [-0.16, 1.25, -0.1, 0.3], [0.05, 1.75, -0.05, 0.3]].forEach(([ox, oy, oz, r]) =>
      dBlob(r, r * 0.55, r, 0x3f7a3f, x + ox, y + oy, z + oz, { chunky: true, ry: ox * 9, jitter: 0.18 }));
    colliders.push(noStand({ x0: x - 0.26, x1: x + 0.26, y0: y, y1: y + 0.45, z0: z - 0.26, z1: z + 0.26 }));
  }

  function displayCase(ax, a0, a1, wall, f, plants = true) {
    const D = 0.55, H = 0.95, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: 0, y1: H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: 0, y1: H, z0: a0, z1: a1 }));
    at(L, 0.2, D, 0x8a6a45, c, 0, D/2);
    at(L, 0.05, D, 0xa07c52, c, H - 0.05, D/2);
    [a0 + 0.03, a1 - 0.03].forEach(e => at(0.06, H - 0.25, D, 0xa07c52, e, 0.2, D/2));
    { const gw = L - 0.12, gh = H - 0.25, off = D - 0.03, gx = ax === 'x' ? c : wall + f*off, gz = ax === 'x' ? wall + f*off : c;
      for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*(ax === 'x' ? gw : 0.02) + gx, bpos.getY(i)*gh + 0.2 + gh/2, bpos.getZ(i)*(ax === 'x' ? 0.02 : gw) + gz); }
    for (let a = a0 + 0.32; a < a1 - 0.25; a += 0.46) {
      const k = hash2(a, wall), tx = ax === 'x' ? a : wall + f*0.3, tz = ax === 'x' ? wall + f*0.3 : a;
      if (k < 0.5) { dCyl(0.05, 0.05, 0.05, 0xb8912e, tx, 0.2, tz, { seg: 8 }); dCyl(0.012, 0.012, 0.12, 0xc9a13a, tx, 0.25, tz, { seg: 6 }); dCyl(0.09, 0.04, 0.12, 0xe0b848, tx, 0.37, tz, { seg: 10 }); }
      else at(0.28, 0.22, 0.03, k < 0.75 ? 0xf3ead2 : 0xdfe8f2, a, 0.2, 0.22);
    }
    if (plants) for (let a = a0 + 0.2; a < a1 - 0.12; a += 0.34) {
      const px = ax === 'x' ? a : wall + f*0.27, pz = ax === 'x' ? wall + f*0.27 : a;
      potPlant(px, H, pz, 0.8 + hash2(a, 1)*0.3, hash2(a, 2) > 0.8, hash2(a, 3) > 0.7 ? 0xd9d6ce : 0xc46a4a);
    }
  }

  function lockerBank(ax, a0, a1, wall, f, H, rows, top = null, body = 0x8a5530, door = 0xa66a3a, flat = false, yb = 0) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    hideAt('locker', '사물함', ax, a0, a1, wall, f, D, H, yb);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    { const c9 = noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 });
      c9.tiny = [{ x0: c9.x0, x1: c9.x1, y0: yb, y1: yb + H + (top ? 0.03 : 0), z0: c9.z0, z1: c9.z1 }]; colliders.push(c9); }
    at(L, H, D, body, c, 0, D/2);
    const n = Math.max(1, Math.round(L / 0.32)), cw = L / n, rh = (H - 0.1) / rows;
    if (flat) {
      const fz = wall + f * (D + 0.005), y0 = yb + 0.08, y1 = yb + 0.08 + rh * rows;
      const pts = ax === 'x' ? [[a0, y0, fz], [a1, y0, fz], [a1, y1, fz], [a0, y1, fz]] : [[fz, y0, a0], [fz, y0, a1], [fz, y1, a1], [fz, y1, a0]];
      patPush('lockD', pts, [[0, 0], [n, 0], [n, rows], [0, rows]], ax === 'x' ? [0, 0, f] : [f, 0, 0], door);
      if (top) at(L + 0.04, 0.03, D + 0.04, top, c, H, D/2);
      return;
    }
    for (let i = 0; i < n; i++) for (let r = 0; r < rows; r++) {
      const ca = a0 + cw * (i + 0.5), y = 0.08 + rh * r;
      at(cw - 0.035, rh - 0.035, 0.03, door, ca, y + 0.0175, D + 0.015);
      at(0.03, 0.07, 0.03, 0x2f2f33, ca + cw * 0.28, y + rh * 0.45, D + 0.045);
    }
    if (top) at(L + 0.04, 0.03, D + 0.04, top, c, H, D/2);
  }

  function instrumentShelf(ax, a0, a1, wall, f, H = 1.8) {
    const D = 0.4, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: 0, y1: H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: 0, y1: H, z0: a0, z1: a1 }));
    [a0 + 0.02, a1 - 0.02].forEach(e => at(0.04, H, D, 0xa9855a, e, 0, D/2));
    at(L - 0.08, H, 0.03, 0x8a6a45, c, 0, 0.015);
    [0, 0.6, 1.2, H - 0.04].forEach(y => at(L - 0.08, 0.04, D - 0.03, 0xa9855a, c, y, D/2 + 0.015));
    const n = Math.max(1, Math.floor((L - 0.1) / 0.45));
    for (let k = 0; k < n; k++) for (let r = 0; r < 3; r++) {
      const a = a0 + 0.28 + k * 0.45, y = r * 0.6 + 0.04, px = ax === 'x' ? a : wall + f*0.22, pz = ax === 'x' ? wall + f*0.22 : a, t = (k + r * 2) % 3;
      if (t === 0) dCyl(0.14, 0.14, 0.22, [0xd94848, 0x3f6fb0, 0xf2c230][r], px, y, pz, { seg: 10 });
      else if (t === 1) for (let b = 0; b < 5; b++) at(0.05, 0.03, 0.26 - b * 0.03, [0xe24b4b, 0xf2a03a, 0xf2d23a, 0x6cc070, 0x5b8fc9][b], a - 0.13 + b * 0.065, y, 0.22);
      else dCyl(0.12, 0.12, 0.05, 0xe8d6a8, px, y, pz, { seg: 12 });
    }
  }

  function angleShelf(a0, a1, wall, f, H = 1.85) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2, WZ = wall + f * D / 2, WH = 0xe9ecec;
    colliders.push(noStand({ x0: a0, x1: a1, y0: 0, y1: H, z0: Math.min(wall, wall + f * D), z1: Math.max(wall, wall + f * D) }));
    const nb = Math.max(1, Math.round(L / 0.9)), bw = L / nb;
    for (let k = 0; k <= nb; k++) { const x9 = Math.min(a1 - 0.02, Math.max(a0 + 0.02, a0 + k * bw)); [0.03, D - 0.03].forEach(o => dBox(0.035, H, 0.035, WH, x9, 0, wall + f * o)); }
    [0.08, 0.5, 0.92, 1.34, H - 0.04].forEach(y => dBox(L - 0.02, 0.03, D - 0.04, WH, c, y, WZ));
    for (let k = 0; k < nb; k++) { const bc = a0 + (k + 0.5) * bw;
      [bc - bw / 4, bc + bw / 4].forEach((x9, j) => {
        dBox(bw / 2 - 0.06, 0.16, D - 0.1, [0x3f7fd6, 0xf2c230, 0xe24b8a][(k + j) % 3], x9, 0.11, WZ);
        const RX9 = [f * Math.PI / 2, 0, 0];
        dCyl(0.17, 0.17, 0.3, 0xa87a4a, x9, 0.53 + 0.17, wall + f * 0.05, { seg: 8, rot: RX9 });
        dCyl(0.165, 0.165, 0.03, 0xefe4c8, x9, 0.53 + 0.17, wall + f * 0.35, { seg: 8, rot: RX9 });
        if ((k + j) % 2 === 0) { dCyl(0.13, 0.08, 0.16, 0x9a3a2e, x9 - 0.08, 1.09, WZ, { seg: 8, rot: [0, 0, Math.PI / 2] }); dCyl(0.08, 0.13, 0.16, 0x9a3a2e, x9 + 0.08, 1.09, WZ, { seg: 8, rot: [0, 0, Math.PI / 2] }); }
        else dCyl(0.15, 0.15, 0.06, 0xe8d6a8, x9, 0.95, WZ, { seg: 8 });
        dBox(bw / 2 - 0.08, 0.3 + (k + j) % 2 * 0.06, D - 0.12, 0x1c1d20, x9, H, WZ, { jitter: 0.12 });
      }); }
  }

  function steelShelf(cx, cz, w, d, H = 1.9) {
    const WH = 0xe4e7e8;
    colliders.push(noStand({ x0: cx - w / 2, x1: cx + w / 2, y0: 0, y1: H, z0: cz - d / 2, z1: cz + d / 2 }));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => dBox(0.035, H, 0.035, WH, cx + i * (w / 2 - 0.02), 0, cz + j * (d / 2 - 0.02)));
    [0.1, 0.62, 1.14, H - 0.04].forEach((y, k) => { dBox(w - 0.05, 0.03, d - 0.05, WH, cx, y, cz);
      if (k < 3) for (let x9 = cx - w / 2 + 0.3, j = 0; x9 < cx + w / 2 - 0.25; x9 += 0.5, j++) dBox(0.42, 0.26 + (j % 2) * 0.08, d - 0.12, [0xc9a877, 0xd8b98a, 0xf2f2ee][(j + k) % 3], x9, y + 0.03, cz); });
  }

  function steelRail(x0, z0, x1, z1, yA, yB = yA, h = 0.95) {
    const S = 0xcdd2d6, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.9));
    const P = t => [x0 + (x1 - x0)*t, yA + (yB - yA)*t, z0 + (z1 - z0)*t];
    const a = P(0), b = P(1);
    dRod(a[0], a[1] + h, a[2], b[0], b[1] + h, b[2], 0.03, S);
    dRod(a[0], a[1] + 0.12, a[2], b[0], b[1] + 0.12, b[2], 0.015, S);
    for (let i = 0; i <= n; i++) { const p = P(i / n); dRod(p[0], p[1], p[2], p[0], p[1] + h, p[2], 0.028, S); }
    for (let i = 0; i < n * 4; i++) { const p = P((i + 0.5) / (n * 4)); dRod(p[0], p[1] + 0.12, p[2], p[0], p[1] + h - 0.1, p[2], 0.012, S); }
    const m = Math.max(1, Math.round(L / 0.3));
    for (let i = 0; i < m; i++) { const p = P(i / m), q = P((i + 1) / m);
      colliders.push({ x0: Math.min(p[0], q[0]) - 0.05, x1: Math.max(p[0], q[0]) + 0.05, y0: Math.min(p[1], q[1]), y1: Math.max(p[1], q[1]) + 1.6, z0: Math.min(p[2], q[2]) - 0.05, z1: Math.max(p[2], q[2]) + 0.05, nc: true }); }
  }

  function greenBoard(ax, a0, a1, wall, f, y0 = 1.15, y1 = 2.35, kind = 'photoB') {
    ax === 'x' ? dBox(a1 - a0, y1 - y0, 0.04, 0x2f6e4f, (a0 + a1)/2, y0, wall + f*0.02) : dBox(0.04, y1 - y0, a1 - a0, 0x2f6e4f, wall + f*0.02, y0, (a0 + a1)/2);
    patWall(kind, ax, a0 + 0.05, a1 - 0.05, y0 + 0.05, y1 - 0.05, wall + f*0.047, f);
  }

  const CLS_WALL = 0xfaf8f2, CLS_WALL_E = 0xfbfbf8, LIME = 0x8dc63f;
  const artPaper = bg => (g, N, R) => { g.fillStyle = bg; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = i*85 + 6 + R()*8, y = j*85 + 6 + R()*8, w = 70, h = 72;
      g.fillStyle = pick(['#ffffff', '#fdf6e3', '#f3f8ff'], R); g.fillRect(x, y, w, h); g.lineWidth = 3;
      for (let k = 0; k < 4; k++) { g.strokeStyle = pick(['#e24b4b', '#3b6fb5', '#2f8f5b', '#f2a03a', '#8a5ad0'], R); g.beginPath(); const t = R();
        if (t < 0.35) g.arc(x + 15 + R()*40, y + 15 + R()*40, 6 + R()*10, 0, 7);
        else if (t < 0.7) { g.moveTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); }
        else g.rect(x + 10 + R()*35, y + 30 + R()*25, 18, 14);
        g.stroke(); } } };
  Object.assign(PATDEF, {

    lockW:  [1.0, 64, false, (g, N) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N); g.fillStyle = '#c9c6be'; g.fillRect(0, 0, N, 2); g.fillRect(0, 0, 2, N);
              g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(2, N - 3, N - 2, 2); g.fillRect(N - 3, 2, 2, N - 2);
              g.fillStyle = '#8c9096'; g.fillRect(N - 14, N/2 - 8, 5, 16); g.fillStyle = '#d8d4ca'; g.fillRect(N/2 - 11, 7, 22, 9); g.fillStyle = '#ffffff'; g.fillRect(N/2 - 10, 8, 20, 7); }],
    kidsArtG: [1.2, 256, false, artPaper('#aeb1b6')],
    kidsArtC: [1.2, 256, false, artPaper('#efe6c8')],
    film2:  [0.6, 128, false, (g, N) => { g.fillStyle = '#e4eaec'; g.fillRect(0, 0, N, N); g.fillStyle = '#fbfcfc'; for (let k = 0; k < N; k += N/8) { g.fillRect(k, 0, 3, N); g.fillRect(0, k, N, 3); } }],
  });

  function whiteLockers(ax, a0, a1, wall, f, H, rows, top, body, door, yb = 0, cw = 0.32) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    hideAt('locker', '사물함', ax, a0, a1, wall, f, D, H, yb);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    { const c9 = noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 });
      c9.tiny = [{ x0: c9.x0, x1: c9.x1, y0: yb, y1: yb + H + (top ? 0.03 : 0), z0: c9.z0, z1: c9.z1 }]; colliders.push(c9); }
    at(L, H, D, body, c, 0, D/2);
    const n = Math.max(1, Math.round(L / cw)), rh = (H - 0.1) / rows;
    const fz = wall + f * (D + 0.005), y0 = yb + 0.08, y1 = yb + 0.08 + rh * rows;
    const pts = ax === 'x' ? [[a0, y0, fz], [a1, y0, fz], [a1, y1, fz], [a0, y1, fz]] : [[fz, y0, a0], [fz, y0, a1], [fz, y1, a1], [fz, y1, a0]];
    patPush('lockW', pts, [[0, 0], [n, 0], [n, rows], [0, rows]], ax === 'x' ? [0, 0, f] : [f, 0, 0], door);
    if (top) at(L, 0.03, D + 0.02, top, c, H, D/2 + 0.01);
  }

  function tallCab(ax, a0, a1, wall, f, H, yb = 0, body = 0xf2f0ea, door = 0xf7f5f0) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    hideAt('cabinet', '청소함·장', ax, a0, a1, wall, f, D, H, yb);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    { const c9 = noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 });
      c9.tiny = [{ x0: c9.x0, x1: c9.x1, y0: yb, y1: yb + H, z0: c9.z0, z1: c9.z1 }]; colliders.push(c9); }
    at(L, H, D, body, c, 0, D/2);
    [-1, 1].forEach(s => { at(L/2 - 0.03, H - 0.13, 0.03, door, c + s * L/4, 0.08, D + 0.015); at(0.03, 0.2, 0.03, 0x9aa0a6, c + s * 0.06, H * 0.45, D + 0.045); });
  }

  function openShelf(ax, a0, a1, wall, f, H, yb = 0) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 }));
    [a0 + 0.015, a1 - 0.015].forEach(e => at(0.03, H, D, 0xf2efe8, e, 0, D/2));
    [0, H/2 - 0.015, H - 0.03].forEach(y => at(L - 0.06, 0.03, D, 0xf2efe8, c, y, D/2));
    [0.03, H/2 + 0.015].forEach((y, k) => { let a = a0 + 0.06; for (let i = 0; a < a1 - 0.2; i++) { const w9 = 0.12 + hash2(a, y) * 0.14;
      at(w9, 0.2 + hash2(y, a) * 0.1, 0.24, BOOK[(i * 3 + k * 5) % BOOK.length], a + w9 / 2, y, 0.2); a += w9 + 0.03; } });
  }

  function frameBoard(ax, a0, a1, wall, f, y0, y1, frame, kind) {
    ax === 'x' ? dBox(a1 - a0, y1 - y0, 0.04, frame, (a0 + a1)/2, y0, wall + f*0.02) : dBox(0.04, y1 - y0, a1 - a0, frame, wall + f*0.02, y0, (a0 + a1)/2);
    patWall(kind, ax, a0 + 0.05, a1 - 0.05, y0 + 0.05, y1 - 0.05, wall + f*0.047, f);
  }

  function acUnit(x, yTop, z) {
    dBox(0.9, 0.05, 0.9, 0xf2f3f4, x, yTop - 0.05, z);
    dBox(0.5, 0.03, 0.5, 0x8a9096, x, yTop - 0.08, z);
    [-1, 1].forEach(s => { dBox(0.55, 0.03, 0.06, 0x5a5e64, x, yTop - 0.08, z + s * 0.34); dBox(0.06, 0.03, 0.55, 0x5a5e64, x + s * 0.34, yTop - 0.08, z); });
  }

  function wallFan(x, zw, n, y, cover) {
    dBox(0.1, 0.14, 0.1, 0xf2f3f4, x, y - 0.07, zw + n * 0.05);
    dCyl(0.03, 0.03, 0.12, 0xe6e7e8, x, y, zw + n * 0.1, { rot: [n * Math.PI / 2, 0, 0], seg: 6 });
    dBlob(0.08, 0.08, 0.07, cover ?? 0xf2f3f4, x, y, zw + n * 0.24, { chunky: true });
    dCyl(0.22, 0.22, 0.07, cover ?? 0xf4f5f6, x, y, zw + n * 0.3, { rot: [n * (Math.PI / 2 + 0.25), 0, 0], seg: 12 });
  }

  function corWinsOf(r) {
    if (r.name === '유치원') return [4.325, 6.675].map(o => ({ c: r.span[0] + o, w: 1.75, sill: 1.1, dh: 2.8, win: true, frame: 0xeeeeea }));
    const W9 = r.span[1] - r.span[0], hw = (W9 - 6.4) / 2, cx9 = (r.span[0] + r.span[1]) / 2;
    if (hw < 0.6) return [];
    const fr = (r.name === '유치원' || r.name === '사랑반') ? 0xeeeeea : 0x7a5a3e;
    return [-1, 1].map(s => ({ c: cx9 + s * (0.5 + hw / 2), w: hw, sill: 1.1, dh: 2.8, win: true, frame: fr }));
  }
  function corWins() { return FR.rooms.filter(r => ['classroom', 'computer', 'daycare'].includes(r.type) && r.span[0] >= B.westLobby.x[0] - 0.01).flatMap(corWinsOf); }

  const CLS_BAND = { 1: '#7a2f5a', 2: '#c8702c', 3: '#1f6272', 4: '#3f7f36' };
  function classSignCanvas(label) {
    const gm = /^(\d)학년$/.exec(label), grade = gm && gm[1], c = document.createElement('canvas');
    const g0 = c.getContext('2d'); g0.font = '900 60px sans-serif';
    c.width = grade ? 300 : Math.ceil(g0.measureText(label).width) + 150; c.height = 128;
    const g = c.getContext('2d'), Wc = c.width;
    const plate = () => { g.beginPath(); g.roundRect(4, 28, Wc - 8, 96, 16); g.moveTo(Wc/2 + 30, 30); g.arc(Wc/2, 34, 30, 0, Math.PI, true); };
    g.fillStyle = '#f3efe2'; plate(); g.fill();
    g.save(); plate(); g.clip();
    g.fillStyle = grade ? (CLS_BAND[grade] || '#2f5f9a') : '#2f7f86';
    const bw = grade ? 104 : 40; g.beginPath(); g.moveTo(0, 0); g.lineTo(bw + 26, 0); g.lineTo(bw - 18, 128); g.lineTo(0, 128); g.fill();
    g.restore();
    g.strokeStyle = '#d8d0b8'; g.lineWidth = 3; plate(); g.stroke();
    const lx = grade ? Wc/2 : 82;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(lx, 76, 25, 0, 7); g.fill();
    g.strokeStyle = '#3f8f4a'; g.lineWidth = 6; g.beginPath(); g.arc(lx, 76, 20, 0.3, 5.6); g.stroke();
    g.fillStyle = '#6cb34a'; g.beginPath(); g.ellipse(lx + 3, 72, 9, 5, -0.6, 0, 7); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (grade) { g.font = '900 66px sans-serif'; g.fillStyle = '#ffffff'; g.fillText(grade, 48, 80); g.fillStyle = '#2a2f3a'; g.fillText('1', Wc - 62, 80); }
    else { g.font = '900 60px sans-serif'; g.fillStyle = '#1f2a44'; g.textAlign = 'left'; g.fillText(label, 118, 80); }
    return c;
  }

  function classSign(label, x, y, zWall, dir) {
    const key = '\u0002CLS|' + label;
    if (!signCanvas.has(key)) signCanvas.set(key, classSignCanvas(label));
    const s9 = sign(key, x, y, zWall, Math.PI / 2, 0.36);
    s9.m.position.z = zWall + dir * (s9.w / 2 + 0.17); s9.m.updateMatrix();
  }

  function tvCorner(xw, zw, dz, y0) {
    const Wp = [xw, zw - dz * 1.75], Sp = [xw + 1.7, zw], L = Math.hypot(Sp[0] - Wp[0], Sp[1] - Wp[1]);
    const u = [(Sp[0] - Wp[0]) / L, (Sp[1] - Wp[1]) / L], n = [dz * u[1], -dz * u[0]], th = Math.atan2(-u[1], u[0]), H = 2.6;
    const shp = new THREE.Shape([new THREE.Vector2(xw, -zw), new THREE.Vector2(Wp[0], -Wp[1]), new THREE.Vector2(Sp[0], -Sp[1])]);
    const pg = new THREE.ExtrudeGeometry(shp, { depth: H, bevelEnabled: false }); pg.rotateX(-Math.PI / 2);
    dGeo(pg, new THREE.Matrix4().makeTranslation(0, y0, 0), 0xf2f0ea); pg.dispose();
    const rb = (t0, t1, ya, yb, off, thk, hex) => { const t = (t0 + t1) / 2, o = off + thk / 2;
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(Wp[0] + u[0] * t + n[0] * o, y0 + (ya + yb) / 2, Wp[1] + u[1] * t + n[1] * o), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, th, 0)), new THREE.Vector3(t1 - t0, yb - ya, thk)), hex); };
    const G = LIME;
    rb(0.03, 0.5, 0.02, 2.05, 0.004, 0.02, G); rb(L - 0.5, L - 0.03, 0.02, 2.05, 0.004, 0.02, G);
    rb(0.56, L - 0.56, 0.06, 0.92, 0.004, 0.02, 0xf7f6f2);
    rb(0.56, L - 0.56, 0.97, 1.17, 0.004, 0.02, 0x7d7a74);
    rb(0.62, L - 0.62, 1.2, 2.0, 0.004, 0.05, 0x1e1f22); rb(0.66, L - 0.66, 1.24, 1.96, 0.054, 0.02, 0x2a3a4a);
    rb(0.03, L - 0.03, 2.06, 2.09, 0.004, 0.02, G); rb(0.03, L - 0.03, 2.55, 2.58, 0.004, 0.02, G);
    [[0, 0.6, 0, 1.13], [0.6, 1.15, 0, 0.57], [0, 0.3, 1.13, 1.44]].forEach(([a, b, p, q]) => {
      const z0 = zw - dz * p, z1 = zw - dz * q;
      colliders.push(noStand({ x0: xw + a, x1: xw + b, y0, y1: y0 + H, z0: Math.min(z0, z1), z1: Math.max(z0, z1) })); });
  }

  function westClass(name, xw, xe, zc, zw, y0, opt = {}) {
    const dz = Math.sign(zw - zc), zm = (zc + zw) / 2, depth = Math.abs(zw - zc), W = xe - xw, top = opt.top ?? 0xcdb28a;
    const st = opt.style || '', ceilY = y0 + (opt.ceilH ?? 2.9);

    const bw = Math.min(4.0, depth - 3.2), zb = zc + dz * (1.35 + bw / 2);
    dBox(0.04, 1.32, bw + 0.12, 0xaeb4ba, xw + 0.02, y0 + 0.9, zb);
    dBox(0.03, 1.2, bw, 0xf3f5f4, xw + 0.055, y0 + 0.96, zb);
    dBox(0.09, 0.03, bw, 0xaeb4ba, xw + 0.085, y0 + 0.9, zb);
    whiteLockers('z', zb - bw / 2, zb + bw / 2, xw, 1, 0.85, 1, 0xe6e4dc, 0xf2efe8, 0xf7f5f0, y0, 0.5);
    const fz = zb + dz * (st === 'g3' ? 0.7 : 0);
    dBox(0.03, 0.5, 0.72, 0x5a4632, xw + 0.015, y0 + 2.3, fz);
    sign(FLAG_KEY, xw + 0.042, y0 + 2.55, fz, Math.PI / 2, 0.4);
    hotspots.push({ kind: 'board', x: xw + 1.4, z: zb, y: y0, r: 2.0, label: '칠판에 낙서하기', bx: xw + 0.08, by: y0 + 1.56, bz: zb, ry: Math.PI / 2, bw, bh: 1.2 });
    if (st === 'g4') {
      dBox(0.03, 0.13, bw - 0.02, LIME, xw + 0.465, y0 + 0.66, zb); dBox(0.03, 0.07, bw - 0.02, LIME, xw + 0.465, y0 + 0.005, zb);
      dBox(0.03, 0.03, Math.abs(zw - dz * 1.8 - zc) - 0.04, LIME, xw + 0.015, ceilY - 0.07, (zc + zw - dz * 1.8) / 2);
      dBox(0.03, ceilY - 0.07 - y0 - 0.9, 0.03, LIME, xw + 0.015, y0 + 0.9, zb + dz * (bw / 2 + 0.1));
    }
    if (st === 'g3') tallCab('z', Math.min(zc + dz * 0.02, zc + dz * 1.28), Math.max(zc + dz * 0.02, zc + dz * 1.28), xw, 1, 2.4, y0);

    if (st === 'g4') tvCorner(xw, zw, dz, y0);
    else objScope('tv', () => { const tz = zw - dz * 1.3, tx = xw + 0.9;
      dBox(0.07, 0.85, 1.5, 0x1e1f22, tx, y0 + 1.7, tz); dBox(0.03, 0.77, 1.4, 0x2a3a4a, tx + 0.05, y0 + 1.74, tz);
      dRod(tx, y0 + 2.55, tz, tx, ceilY, tz, 0.025, 0x9aa0a6);
      colliders.push({ x0: tx - 0.06, x1: tx + 0.07, y0: y0 + 1.65, y1: ceilY, z0: tz - 0.77, z1: tz + 0.77, nc: true }); });

    const tdz = zw - dz * (st === 'g4' ? 1.45 : 1.3);
    const tcz = st === 'g4' ? zw - dz * 1.6 : tdz;
    if (opt.big) bigDesk(xw + 1.9, y0, tdz, dz); else teacherDesk(xw + 1.3, y0, tdz, 1);
    chair(xw + 0.72, y0, tcz, -1, 0xd9643a, 1);
    if (!opt.computer) { const px = opt.big ? xe - 0.85 : xw + (st === 'g4' ? 2.45 : 1.88);
      objScope('purifier', () => { addBox(0.5, 1.5, 0.4, 0xf2f3f4, px, y0, zw - dz * 0.75, NS); dBox(0.3, 0.03, 0.25, 0xa9aeb3, px, y0 + 1.5, zw - dz * 0.75); }); }
    if (st === 'g3') {
      const sz = zw - dz * 2.25;
      objScope('table', () => { dBox(1.2, 0.72, 0.6, 0xf4f4f0, xw + 1.5, y0, sz); colliders.push(noStand({ x0: xw + 0.9, x1: xw + 2.1, y0, y1: y0 + 0.72, z0: sz - 0.3, z1: sz + 0.3 })); });
      objScope('chair', () => { dCyl(0.16, 0.16, 0.45, 0xc9a06a, xw + 1.1, y0, zw - dz * 2.85, { seg: 10 }); colliders.push(noStand({ x0: xw + 0.94, x1: xw + 1.26, y0, y1: y0 + 0.45, z0: zw - dz * 2.85 - 0.16, z1: zw - dz * 2.85 + 0.16 })); });
    }

    whiteLockers('x', xw + (st === 'g4' ? 1.75 : 0.3), xe - 0.6, zw, -dz, opt.sill ? opt.sill - 0.15 : 0.8, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);

    const za = Math.min(zc + dz * 0.3, zw - dz * 0.6), zb2 = Math.max(zc + dz * 0.3, zw - dz * 0.6);
    let ck = zm;
    if (st === 'g4') {
      tallCab('z', za, za + 0.9, xe, -1, 2.3, y0); tallCab('z', zb2 - 0.9, zb2, xe, -1, 2.3, y0);
      const s1 = za + 3.6, s2 = za + 4.6;
      whiteLockers('z', za + 0.9, s1, xe, -1, 1.0, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0); openShelf('z', s1, s2, xe, -1, 1.0, y0);
      whiteLockers('z', s2, zb2 - 0.9, xe, -1, 1.0, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
      frameBoard('z', za + 0.9, zb2 - 0.9, xe, -1, y0 + 1.05, y0 + 2.3, 0xd6d8d6, 'kidsArtG');
      dBox(0.03, 2.36, 0.06, LIME, xe - 0.015, y0, za - 0.03); dBox(0.03, 2.36, 0.06, LIME, xe - 0.015, y0, zb2 + 0.03);
      dBox(0.03, 0.06, zb2 - za, LIME, xe - 0.015, y0 + 2.3, (za + zb2) / 2);
      dBox(0.04, 0.07, zb2 - za - 0.02, LIME, xe - 0.47, y0 + 0.005, (za + zb2) / 2);
    } else if (st === 'g3') {
      tallCab('z', za, za + 0.9, xe, -1, 2.1, y0);
      whiteLockers('z', za + 0.9, zb2, xe, -1, 1.3, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
      frameBoard('z', za + 1.1, zb2 - 0.2, xe, -1, y0 + 1.5, y0 + 2.4, 0xbfa27a, 'kidsArtC');
    } else {
      const segs = opt.backGap ? [[za, opt.backGap[0]], [opt.backGap[1], zb2]] : [[za, zb2]];
      segs.forEach(([u, v]) => { if (v - u < 0.6) return; whiteLockers('z', u, v, xe, -1, 1.3, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
        if (v - u > 1.4) greenBoard('z', u + 0.2, v - 0.2, xe, -1, y0 + 1.5, y0 + 2.4, 'kidsArt'); });
      if (opt.backGap) ck = (segs[1][0] + segs[1][1]) / 2;
    }
    dCyl(0.17, 0.17, 0.04, 0xf5f3ec, xe - 0.02, y0 + 2.62, ck, { rot: [0, 0, Math.PI / 2], seg: 16 });
    dCyl(0.02, 0.02, 0.05, 0x2a2a2a, xe - 0.045, y0 + 2.62, ck, { rot: [0, 0, Math.PI / 2], seg: 6 });
    const seats = [];
    if (opt.computer) {

      for (let r = 0; r < 3 && xw + 2.4 + r * 2.0 < xe - 1.8; r++) for (const s of [-1, 1]) {
        const x = xw + 2.4 + r * 2.0, z = zm + s * 1.6;
        objScope('desk', () => { colliders.push(noStand({ x0: x - 0.35, x1: x + 0.35, y0, y1: y0 + 0.76, z0: z - 1.2, z1: z + 1.2 }));
        dBox(0.66, 0.72, 2.36, 0x9a744e, x, y0, z); dBox(0.7, 0.04, 2.4, 0x3c3d42, x, y0 + 0.72, z);
        [-0.6, 0, 0.6].forEach(o => dBox(0.03, 0.6, 0.03, 0x6e5238, x + 0.345, y0 + 0.06, z + o)); });
        [-0.8, 0, 0.8].forEach(o => {
          objScope('monitor', () => { dBox(0.12, 0.1, 0.12, 0x3a3d44, x - 0.18, y0 + 0.76, z + o); dBox(0.04, 0.34, 0.52, 0x2f3238, x - 0.18, y0 + 0.86, z + o);
          dBox(0.03, 0.28, 0.46, 0x3d5870, x - 0.145, y0 + 0.89, z + o); dBox(0.15, 0.03, 0.42, 0xe6e6e0, x + 0.12, y0 + 0.76, z + o); });
          chair(x + 0.55, y0, z + o, 1, 0x4a4f58, 1); seats.push({ x: x + 0.55, z: z + o, sx: x + 1.05, sz: z + o });
        });
      }
    } else {

      const n = opt.nDesk ?? SCHOOL.people[name]?.desks ?? (SCHOOL.people[name]?.s.length ?? 4) + 2;
      const cols = Math.max(2, Math.min(4, Math.floor((depth - 2.2) / 1.4) + 1));
      const rows = Math.min(Math.max(1, Math.min(3, Math.floor((W - 4.1) / 1.7) + 1)), Math.ceil(n / cols));
      const order = [...Array(cols).keys()].sort((a, b) => Math.abs(a - (cols-1)/2) - Math.abs(b - (cols-1)/2) || a - b);

      const narrow = (xe - 0.45) - (xw + 3.15 + (rows - 1) * 1.9) < 0.9, RP = narrow ? 1.7 : 1.9, pitch = narrow ? 1.6 : 0.7;
      for (let r = 0; r < rows; r++) for (const c of order) {
        if (seats.length >= n) break;
        const x = xw + (opt.rowX ?? 2.4) + r * RP, z = zm + (c - (cols-1)/2) * pitch;
        studentDesk(x, y0, z, top, 0.7, 1);
        chair(x + 0.55, y0, z, 1, opt.chair ?? 0xb98a5a, 1);
        seats.push({ x: x + 0.55, z, sx: x + 1.05, sz: z });
      }
    }
    seatsOf[name] = { seats, y: y0, teacher: { x: xw + 1.3, z: zm - dz * 0.6 }, face: 3, tFace: 1,
      tSeat: { x: xw + 0.72, z: tcz, face: 1, desk: y0 + 0.85, reach: 0.28 } };
  }

  Object.assign(PATDEF, {
    kinAt: [1, 512, false, (g, N, R) => {
      g.fillStyle = '#efedea'; g.fillRect(0, 0, 256, 256);
      const star = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
      for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) star(32 + i * 37 + (j % 2) * 16 + R() * 5, 32 + j * 37 + R() * 5, 6 + R() * 5, pick(['#efb9c4', '#cbcbd3', '#f2cda6', '#c4d9ee'], R));
      g.strokeStyle = '#d6d1ca'; g.lineWidth = 4; g.strokeRect(19, 19, 218, 218);
      g.fillStyle = '#ead4ab'; g.fillRect(256, 0, 256, 256);
      for (let i = 0; i < 9; i++) { const x = 256 + 12 + i * 26; g.fillStyle = pick(['#eed9b2', '#e6cea2', '#ecd6ad'], R); g.fillRect(x, 0, 24, 256); g.fillStyle = '#b89a6c'; g.fillRect(x + 24, 0, 2, 256); }
      g.fillStyle = '#f4f4f2'; g.fillRect(0, 256, 256, 256);
      [28, 132].forEach(x => { g.fillStyle = '#dde5e8'; g.fillRect(x, 272, 96, 224);
        for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) { const cx = x + 26 + i * 44, cy = 312 + j * 68, rab = (i + j) % 2;
          g.fillStyle = '#c7c3bd'; g.beginPath(); g.arc(cx, cy, 15, 0, 7); g.fill();
          if (rab) { g.fillRect(cx - 9, cy - 34, 6, 22); g.fillRect(cx + 3, cy - 34, 6, 22); } else { g.beginPath(); g.arc(cx - 12, cy - 12, 6, 0, 7); g.arc(cx + 12, cy - 12, 6, 0, 7); g.fill(); }
          g.fillStyle = '#8a857e'; g.fillRect(cx - 6, cy - 3, 3, 3); g.fillRect(cx + 3, cy - 3, 3, 3); } });
      g.fillStyle = '#f7f7f4'; g.fillRect(256, 256, 256, 256);
      g.fillStyle = '#d2d2ce'; for (let j = 0; j < 22; j++) for (let i = 0; i < 22; i++) g.fillRect(256 + 18 + i * 10, 274 + j * 10, 2, 2);
      for (let k = 0; k < 6; k++) { const x = 256 + 28 + (k % 3) * 70, y = 286 + Math.floor(k / 3) * 108; g.fillStyle = '#ffffff'; g.fillRect(x, y, 58, 80); g.lineWidth = 3;
        for (let q = 0; q < 4; q++) { g.strokeStyle = pick(['#e24b4b', '#3b6fb5', '#2f8f5b', '#f2a03a', '#8a5ad0'], R); g.beginPath(); g.arc(x + 14 + R() * 30, y + 16 + R() * 48, 5 + R() * 9, 0, 7); g.stroke(); } }
    }],
  });

  const kinQ = (k, pts, n, gain = 1) => { const ox = (k % 2) * 0.5, oy = k < 2 ? 0.5 : 0, p = 16 / 512, s = 224 / 512;
    patPush('kinAt', pts, [[ox + p, oy + p], [ox + p + s, oy + p], [ox + p + s, oy + p + s], [ox + p, oy + p + s]], n, 0xffffff);
    if (gain !== 1) { const C = PAT.get('kinAt').col; for (let i = C.length - 18; i < C.length; i++) C[i] *= gain; } };

  const KYAW = [Math.PI, Math.PI / 2, 0, -Math.PI / 2], KDIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const kidChair = objWrap((x, z, f, sit) => {
    const [fx, fz] = KDIR[f], SW = 0.32, SY = 0.3, C = 0xd8b67e, L = 0xc49a5c;
    dBox(SW, 0.03, SW, C, x, SY, z);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => dBox(0.03, SY, 0.03, L, x + i * (SW / 2 - 0.03), 0, z + j * (SW / 2 - 0.03)));
    const bx = x - fx * (SW / 2 - 0.015), bz = z - fz * (SW / 2 - 0.015);
    fx ? dBox(0.03, 0.24, SW - 0.04, C, bx, SY + 0.06, bz) : dBox(SW - 0.04, 0.24, 0.03, C, bx, SY + 0.06, bz);
    [-1, 1].forEach(s => fx ? dBox(0.03, 0.03, 0.03, L, bx, SY + 0.03, bz + s * (SW / 2 - 0.05)) : dBox(0.03, 0.03, 0.03, L, bx + s * (SW / 2 - 0.05), SY + 0.03, bz));
    colliders.push(noStand({ x0: x - SW / 2, x1: x + SW / 2, y0: 0, y1: SY + 0.3, z0: z - SW / 2, z1: z + SW / 2 }));
    if (sit) hotspots.push({ kind: 'sit', x: x - fx * 0.55, z: z - fz * 0.55, y: 0, r: 0.7, label: '작은 의자에 앉기', yaw: KYAW[f], seat: { x, y: SY + 0.03 - 0.46, z, yaw: KYAW[f] } });
  }, 'chair');
  const kidTable = objWrap((x, z, r) => {
    dCyl(r, r, 0.04, 0xe8d6ae, x, 0.46, z, { seg: 18 });
    [0, 2.094, 4.189].forEach(a => dCyl(0.025, 0.025, 0.46, 0xc49a5c, x + Math.cos(a) * r * 0.6, 0, z + Math.sin(a) * r * 0.6, { seg: 6 }));
    colliders.push(noStand({ x0: x - r * 0.85, x1: x + r * 0.85, y0: 0, y1: 0.5, z0: z - r * 0.85, z1: z + r * 0.85 }));
  }, 'table');
  const kidTableR = objWrap((x, z, w, d) => {
    dBox(w, 0.04, d, 0xead9b4, x, 0.46, z);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => dBox(0.04, 0.46, 0.04, 0xc49a5c, x + i * (w / 2 - 0.05), 0, z + j * (d / 2 - 0.05)));
    colliders.push(noStand({ x0: x - w / 2, x1: x + w / 2, y0: 0, y1: 0.5, z0: z - d / 2, z1: z + d / 2 }));
  }, 'table');

  function kDrum(x, y, z, r, h) {
    dCyl(r, r, h - 0.08, 0x2b33b8, x, y + 0.04, z, { seg: 14 });
    [y, y + h - 0.04].forEach(y9 => dCyl(r + 0.012, r + 0.012, 0.04, 0x1c1f45, x, y9, z, { seg: 14 }));
    dCyl(r - 0.01, r - 0.01, 0.015, 0xefe4c8, x, y + h, z, { seg: 14 });
    const R9 = r + 0.01, P9 = (a, yy) => [x + Math.cos(a) * R9, yy, z + Math.sin(a) * R9];
    for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = a0 + Math.PI / 8;
      dRod(...P9(a0, y + 0.05), ...P9(a1, y + h - 0.05), 0.009, 0xf4f4f0); dRod(...P9(a1, y + h - 0.05), ...P9(a0 + Math.PI / 4, y + 0.05), 0.009, 0xf4f4f0); }
  }
  const BAGC = [0xd94a3a, 0xf0a030, 0x3f7fc0, 0x5bb06a, 0xe07aa0, 0xf2d15c];

  function kinderRoom(name, xw, xe, zc, zw, tdz, doorX, cw, winW) {
    const PW = 0xe6cfa3, PWD = 0xc49a5c, WH = 0xf6f5f0, OL = 0xc9c27c;

    const TX = xw + 1.5, TZ = zw - 2.7;
    addBox(TX - xw, FH, zw - TZ, CLS_WALL, (xw + TX) / 2, 0, (TZ + zw) / 2);
    dBox(0.75, 2.05, 0.04, 0xf4f2ec, TX - 0.5, 0, TZ - 0.02); dBox(0.06, 0.06, 0.05, 0xd9b23a, TX - 0.2, 0.98, TZ - 0.065);
    kinQ(2, [[TX + 0.012, 1.05, zw - 0.3], [TX + 0.012, 1.05, zw - 1.6], [TX + 0.012, 2.2, zw - 1.6], [TX + 0.012, 2.2, zw - 0.3]], [1, 0, 0]);
    dBox(0.03, 0.5, 0.72, 0x5a4632, TX + 0.015, 2.28, zw - 1.75); sign(FLAG_KEY, TX + 0.042, 2.53, zw - 1.75, Math.PI / 2, 0.4);
    { const cy = 1.95, cz = zw - 2.25, R9 = [0, 0, -Math.PI / 2];
      dCyl(0.1, 0.1, 0.035, 0x2f55c8, TX + 0.006, cy, cz, { rot: R9, seg: 12 });
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; dCyl(0.05, 0.05, 0.03, 0x3a63d6, TX + 0.004, cy + Math.cos(a) * 0.14, cz + Math.sin(a) * 0.14, { rot: R9, seg: 8 }); }
      dCyl(0.075, 0.075, 0.04, 0xf4f4f0, TX + 0.008, cy, cz, { rot: R9, seg: 12 }); }
    kinQ(3, [[TX + 0.012, 0.72, zw - 1.85], [TX + 0.012, 0.72, zw - 2.6], [TX + 0.012, 1.62, zw - 2.6], [TX + 0.012, 1.62, zw - 1.85]], [1, 0, 0]);
    objScope('table', () => { const hz = zw - 2.2; dCyl(0.48, 0.48, 0.04, 0xe8d6ae, TX + 0.02, 0.46, hz, { seg: 16 });
      [-0.3, 0.3].forEach(o => dCyl(0.025, 0.025, 0.46, PWD, TX + 0.36, 0, hz + o, { seg: 6 }));
      colliders.push(noStand({ x0: TX, x1: TX + 0.48, y0: 0, y1: 0.5, z0: hz - 0.45, z1: hz + 0.45 })); });
    kidChair(TX + 0.78, zw - 2.2, 3, true);
    objScope('cab', () => { const cz = zw - 0.8;
      dBox(0.45, 0.85, 1.0, WH, TX + 0.225, 0, cz);
      [-0.25, 0.25].forEach(o => dBox(0.03, 0.75, 0.47, 0xfbfbf8, TX + 0.465, 0.05, cz + o));
      dBox(0.38, 0.55, 0.36, 0xf4f4f2, TX + 0.24, 0.85, cz - 0.1); dBox(0.03, 0.14, 0.14, 0x9aa0a6, TX + 0.445, 1.02, cz - 0.1);
      colliders.push(noStand({ x0: TX, x1: TX + 0.48, y0: 0, y1: 1.4, z0: cz - 0.5, z1: cz + 0.5 })); });
    objScope('bin', () => { const bz = zw - 1.55;
      [0, 0.33, 0.66].forEach((y9, k) => { dBox(0.4, 0.33, 0.38, [0xb9bcc0, 0xc4c7cb, 0xb9bcc0][k], TX + 0.22, y9, bz); dBox(0.03, 0.06, 0.16, [0x7ab36a, 0xe8b84a, 0x6fa0d0][k], TX + 0.435, y9 + 0.2, bz); });
      colliders.push(noStand({ x0: TX + 0.02, x1: TX + 0.45, y0: 0, y1: 0.99, z0: bz - 0.19, z1: bz + 0.19 })); });

    const dz1 = tdz + 1.0, tvz = dz1 + 1.05, ez = TZ - 0.5;
    objScope('desk', () => {
      dBox(0.6, 0.04, 0.9, PW, xw + 0.31, 0.7, dz1);
      dBox(0.55, 0.7, 0.38, PWD, xw + 0.29, 0, dz1 + 0.24); dBox(0.55, 0.7, 0.04, PWD, xw + 0.29, 0, dz1 - 0.41);
      dBox(0.12, 0.1, 0.12, 0x3a3d44, xw + 0.15, 0.74, dz1 - 0.05); dBox(0.04, 0.36, 0.55, 0x2a2c30, xw + 0.15, 0.84, dz1 - 0.05); dBox(0.03, 0.3, 0.49, 0x6f9cc6, xw + 0.185, 0.87, dz1 - 0.05);
      dBox(0.15, 0.03, 0.42, 0xe6e6e0, xw + 0.42, 0.74, dz1 - 0.1); dBox(0.2, 0.06, 0.16, 0xf2f2ee, xw + 0.3, 0.74, dz1 + 0.33);
      colliders.push(noStand({ x0: xw, x1: xw + 0.62, y0: 0, y1: 0.74, z0: dz1 - 0.45, z1: dz1 + 0.45 })); });
    chair(xw + 0.95, 0, dz1, 1, 0xc9a06a, 1);
    hotspots.push({ kind: 'sit', x: xw + 1.45, z: dz1, y: 0, r: 0.7, label: '의자에 앉기', yaw: -Math.PI / 2, seat: { x: xw + 0.95, y: 0, z: dz1, yaw: -Math.PI / 2 } });
    objScope('tv', () => {
      dBox(0.45, 0.5, 1.1, WH, xw + 0.235, 0, tvz);
      [-0.36, 0, 0.36].forEach(o => dBox(0.03, 0.22, 0.32, 0x9aaecb, xw + 0.475, 0.06, tvz + o));
      dBox(0.15, 0.05, 0.3, 0x2a2a2e, xw + 0.2, 0.5, tvz); dBox(0.06, 0.62, 1.05, 0x1e1f22, xw + 0.2, 0.55, tvz);
      dBox(0.03, 0.27, 0.97, 0xd9a050, xw + 0.245, 0.86, tvz); dBox(0.03, 0.27, 0.97, 0x5e8fc4, xw + 0.245, 0.59, tvz);
      colliders.push(noStand({ x0: xw, x1: xw + 0.49, y0: 0, y1: 1.17, z0: tvz - 0.55, z1: tvz + 0.55 })); });
    objScope('board', () => {
      [-0.4, 0.4].forEach(o => dBox(0.05, 1.66, 0.05, PW, xw + 0.3, 0, ez + o));
      dBox(0.34, 0.24, 0.75, PW, xw + 0.24, 0.12, ez);
      dBox(0.04, 0.72, 0.84, PW, xw + 0.33, 0.9, ez);
      dBox(0.03, 0.62, 0.58, 0xf6f7f6, xw + 0.365, 0.95, ez - 0.1); dBox(0.03, 0.62, 0.16, 0x3f6fb0, xw + 0.365, 0.95, ez + 0.29);
      colliders.push(noStand({ x0: xw, x1: xw + 0.42, y0: 0, y1: 1.66, z0: ez - 0.43, z1: ez + 0.43 })); });
    hotspots.push({ kind: 'board', x: xw + 1.4, z: ez - 0.1, y: 0, r: 1.6, label: '화이트보드에 낙서하기', bx: xw + 0.385, by: 1.26, bz: ez - 0.1, ry: Math.PI / 2, bw: 0.52, bh: 0.56 });
    objScope('cab', () => { const u0 = tdz + 0.55, u1 = ez + 0.45, n = 6, pw = (u1 - u0) / n;
      dBox(0.36, 0.93, u1 - u0, WH, xw + 0.18, 1.9, (u0 + u1) / 2);
      for (let k = 0; k < n; k++) dBox(0.03, 0.89, pw - 0.012, [WH, WH, OL, OL, WH, WH][k], xw + 0.375, 1.92, u0 + pw * (k + 0.5));
      colliders.push({ x0: xw, x1: xw + 0.39, y0: 1.9, y1: 2.83, z0: u0, z1: u1, nc: true }); });
    sign('선생님방', xw + 0.02, 2.32, tdz, Math.PI / 2, 0.1, { bg: '#fff3d6', fg: '#4a6a3a' });
    extinguisher(xw + 0.4, 0, zc + 0.16); dBox(0.24, 0.16, 0.03, 0xd8342c, xw + 0.4, 1.12, zc + 0.015);
    exitSign(doorX, zc, 2.73, [0, 1]);

    { const drx = doorX + 1.05, drz = zc + 0.36;
      objScope('drum', () => { kDrum(drx, 0, drz, 0.3, 0.62); kDrum(drx, 0.64, drz, 0.31, 0.74);
        colliders.push(noStand({ x0: drx - 0.33, x1: drx + 0.33, y0: 0, y1: 1.4, z0: drz - 0.33, z1: drz + 0.33 })); }); }
    objScope('shelf', () => { const a = cw[0].c - cw[0].w / 2 + 0.05, b = a + 1.4, c = (a + b) / 2;
      dBox(1.4, 0.72, 0.38, PW, c, 0, zc + 0.2);
      [-0.35, 0.35].forEach(o => { dBox(0.66, 0.6, 0.03, 0xedd9b2, c + o, 0.06, zc + 0.405); dCyl(0.025, 0.025, 0.03, 0xe8b84a, c + o + (o < 0 ? 0.26 : -0.26), 0.55, zc + 0.42, { rot: [Math.PI / 2, 0, 0], seg: 8 }); });
      [[-0.55, 0xf2d15c], [-0.4, 0xf2d15c], [-0.25, 0xf2d15c], [-0.08, 0xf0a0b8]].forEach(([o, col]) => dBox(0.12, 0.3, 0.25, col, c + o, 0.72, zc + 0.2));
      for (let i = 0; i < 6; i++) dBox(0.04, 0.22 + (i % 3) * 0.03, 0.2, BOOK[i], c + 0.1 + i * 0.05, 0.72, zc + 0.2);
      colliders.push(noStand({ x0: a, x1: b, y0: 0, y1: 1.02, z0: zc, z1: zc + 0.42 })); });
    objScope('toy', () => { const tx = cw[0].c + 0.1, tz = zc + 0.95;
      dBox(0.76, 0.66, 0.4, 0xe9d3a8, tx, 0, tz);
      dCyl(0.13, 0.13, 0.025, 0xf6f6f2, tx - 0.17, 0.32, tz + 0.2, { rot: [Math.PI / 2, 0, 0], seg: 14 }); dCyl(0.085, 0.085, 0.03, 0x7f98a8, tx - 0.17, 0.32, tz + 0.2, { rot: [Math.PI / 2, 0, 0], seg: 12 });
      dBox(0.3, 0.42, 0.03, 0xf2e2c2, tx + 0.18, 0.12, tz + 0.215);
      dCyl(0.08, 0.08, 0.02, 0x2a2a2a, tx - 0.2, 0.66, tz, { seg: 10 });
      dBox(0.28, 0.12, 0.22, 0xd23a2e, tx + 0.16, 0.66, tz - 0.02); dBox(0.2, 0.08, 0.04, 0xd23a2e, tx + 0.16, 0.78, tz - 0.11); dBox(0.16, 0.03, 0.1, 0x3a3d44, tx + 0.16, 0.78, tz + 0.03);
      colliders.push(noStand({ x0: tx - 0.38, x1: tx + 0.38, y0: 0, y1: 0.86, z0: tz - 0.2, z1: tz + 0.2 })); });
    objScope('shelf', () => { const a = cw[1].c - cw[1].w / 2 + 0.05, b = cw[1].c + cw[1].w / 2 - 0.05, c = (a + b) / 2, L = b - a, z9 = zc + 0.195;
      dBox(L - 0.06, 0.6, 0.03, PWD, c, 0.02, zc + 0.025);
      [a + 0.015, b - 0.015].forEach(x9 => dBox(0.03, 0.65, 0.34, PW, x9, 0, zc + 0.18));
      [0, 0.31, 0.62].forEach(y9 => dBox(L - 0.06, 0.03, 0.31, PW, c, y9, z9));
      [-0.5, 0, 0.5].forEach((o, k) => { dBox(0.4, 0.22, 0.26, 0xf4f4f0, c + o, 0.34, z9 + 0.01); dBox(0.4, 0.22, 0.26, [0xf2c4cc, 0xbfe3f5, 0xc9ecb5][k], c + o, 0.03, z9 + 0.01); });
      colliders.push(noStand({ x0: a, x1: b, y0: 0, y1: 0.65, z0: zc, z1: zc + 0.35 })); });
    wallFan((cw[0].c + cw[0].w / 2 + cw[1].c - cw[1].w / 2) / 2, zc, 1, 2.4);

    objScope('locker', () => { const z0 = zc + 0.5, z1 = zw - 1.25, L = z1 - z0, zm = (z0 + z1) / 2, n = Math.max(1, Math.round(L / 0.46)), p = L / n;
      dBox(0.36, 1.05, L, 0x8a6240, xe - 0.18, 0, zm);
      for (let k = 0; k <= n; k++) dBox(0.04, 1.05, 0.04, 0xdcb680, xe - 0.38, 0, z0 + k * p);
      dBox(0.04, 0.03, L, 0xdcb680, xe - 0.385, 0.51, zm);
      dBox(0.42, 0.03, L + 0.06, 0xdcb680, xe - 0.21, 1.05, zm);
      for (let k = 0; k < n; k++) [[0.08, 0], [0.6, 1]].forEach(([y9, j]) => { const h = hash2(k * 1.7, j + 3.1); if (h < 0.45) return;
        dBox(0.04, 0.26, p - 0.12, BAGC[Math.floor(h * 97) % BAGC.length], xe - 0.38, y9, z0 + (k + 0.5) * p); });
      colliders.push(noStand({ x0: xe - 0.42, x1: xe, y0: 0, y1: 1.08, z0: z0 - 0.03, z1: z1 + 0.03 })); });
    frameBoard('z', zc + 0.8, zw - 1.55, xe, -1, 1.4, 2.4, 0xd9c39a, 'kidsArt');

    { const a = TX, b = xe, n9 = Math.max(1, Math.round((b - a) / 1.05));
      for (let i = 0; i < n9; i++) { const u0 = a + (b - a) * i / n9, u1 = a + (b - a) * (i + 1) / n9; kinQ(1, [[u1, 0, zw - 0.012], [u0, 0, zw - 0.012], [u0, 0.95, zw - 0.012], [u1, 0.95, zw - 0.012]], [0, 0, -1], 1.8); }
      objScope('shelf', () => { dBox(b - a - 0.1, 0.03, 0.14, PW, (a + b) / 2, 0.95, zw - 0.07);
        for (let i = 0; i < 9; i++) { const x9 = a + 0.5 + i * (b - a - 1.0) / 8, h = hash2(x9, 7.7); dBox(0.09 + h * 0.05, 0.07 + h * 0.06, 0.09, BOOK[(i * 3) % BOOK.length], x9, 0.98, zw - 0.075); }
        colliders.push(noStand({ x0: a + 0.05, x1: b - 0.05, y0: 0.95, y1: 0.98, z0: zw - 0.14, z1: zw })); }); }
    winW.forEach(g => { if (g.c < TX || g.c > xe) return; const g0 = g.c - g.w / 2, gx = g0 + 0.42, gz = zw + 0.025, GY = 0xf0c050;
      dBox(g.w - 0.12, 0.36, 0.05, 0xf4f3ee, g.c, 2.2, zw - 0.03);
      dBox(0.3, 0.2, 0.03, GY, gx, 1.28, gz); dBox(0.08, 0.36, 0.03, GY, gx + 0.11, 1.48, gz); dBox(0.17, 0.1, 0.03, GY, gx + 0.13, 1.84, gz);
      [-0.1, 0.08].forEach(o => dBox(0.05, 0.2, 0.03, GY, gx + o, 1.08, gz));
      [[-0.06, 0.12], [0.05, 0.14]].forEach(([ox, oy]) => dBox(0.05, 0.05, 0.03, 0xb7742e, gx + ox, 1.28 + oy, gz - 0.012)); });

    { const rx = xe - 2.1, rz = zc + 2.05;
      kidTable(rx, rz, 0.55);
      objScope('shelf', () => { dBox(0.86, 0.26, 0.06, PW, rx, 0.5, rz); [-1, 1].forEach(s => dBox(0.26, 0.1, 0.18, 0xf4f4f0, rx + s * 0.2, 0.5, rz + s * 0.17)); });
      kidChair(rx - 0.78, rz, 1, true); kidChair(rx + 0.78, rz, 3, false); kidChair(rx, rz + 0.78, 0, true);
      const tx = xe - 3.6, tz = zw - 1.2;
      kidTableR(tx, tz, 2.2, 0.6);
      [-0.55, 0.55].forEach(o => { kidChair(tx + o, tz - 0.62, 2, o < 0); kidChair(tx + o, tz + 0.62, 0, false); }); }

    { const mx = xw + 3.75, mz = zc + 2.95, hw = 1.6, hd = 1.3, Y = 0.034;
      objScope('mat', () => kinQ(0, [[mx - hw, Y, mz + hd], [mx + hw, Y, mz + hd], [mx + hw, Y, mz - hd], [mx - hw, Y, mz - hd]], [0, 1, 0]));
      npcSpot[name] = [[0, -0.72, 2], [0, 0.72, 0], [-0.72, 0.05, 1], [0.72, 0.05, 3]].map(([dx, dz, f]) => ({ x: mx + dx, z: mz + dz, y: Y, face: f, pose: 'sitFloor' })); }
  }

  function kinderOffice(x0, x1, zN, zS, zP, pdx) {
    wallRun('x', x0, x1, zP, 0xf6eeea, { gaps: [{ c: pdx, w: 0.9, dh: 2.1, door: true, late: true, swing: { n: 1, leaves: [0.9], look: 'plain', color: 0xf6f4ee, win: false, panel: 0xfbfaf6, knob: 0xc9ccd0 } }] });
    floorQ('wood', x0, x1, zN, zS);
    for (let k = 0; k < 4; k++) { const a = x0 + 0.1 + k * 0.9;
      tallCab('x', a, a + 0.9, zN, 1, 2.1, 0, 0xb3ac72, 0xc2bb80);
      if (k === 1 || k === 2) dBox(0.82, 0.72, 0.03, 0x4c5248, a + 0.45, 1.28, zN + 0.495); }
    frameBoard('x', x1 - 2.6, x1 - 0.6, zP - 0.15, -1, 1.1, 1.9, 0xd8c8a8, 'kidsArt');
    lamp(1.2, 0.05, 0.22, (x0 + x1) / 2, FH - 0.21, (zN + zP) / 2);
    const zo = zP + 0.15;
    tallCab('x', x1 - 2.0, x1 - 1.0, zo, 1, 2.0); tallCab('x', x1 - 1.0, x1, zo, 1, 2.0);
    objScope('bin', () => { const bx = x1 - 0.5, bz = zo + 0.75;
      [0, 0.33, 0.66].forEach((y9, k) => dBox(0.38, 0.33, 0.36, [0x9aa0a6, 0xa9aeb3, 0x9aa0a6][k], bx, y9, bz)); dBox(0.34, 0.24, 0.3, 0xc49a6c, bx, 0.99, bz);
      colliders.push(noStand({ x0: bx - 0.19, x1: bx + 0.19, y0: 0, y1: 1.23, z0: bz - 0.18, z1: bz + 0.18 })); });
    objScope('cab', () => { const lx = x1 - 2.4; dBox(0.6, 1.85, 0.6, 0x4a4e54, lx, 0, zo + 0.3); [1.25, 0.85].forEach(y9 => dBox(0.24, 0.32, 0.03, 0xf4f4f0, lx + 0.05, y9, zo + 0.615));
      colliders.push(noStand({ x0: lx - 0.3, x1: lx + 0.3, y0: 0, y1: 1.85, z0: zo, z1: zo + 0.6 })); });
    const oChair = objWrap((x, z, back, sit) => {
      dBox(0.46, 0.08, 0.46, 0x4a4e56, x, 0.42, z); dBox(0.07, 0.04, 0.1, 0x9aa0a6, x - 0.21, 0.5, z); dBox(0.06, 0.55, 0.44, back, x - 0.235, 0.54, z);
      [-1, 1].forEach(s => { dBox(0.04, 0.16, 0.04, 0xe6e6e6, x, 0.5, z + s * 0.25); dBox(0.3, 0.04, 0.05, 0xe6e6e6, x, 0.66, z + s * 0.25); });
      dCyl(0.03, 0.03, 0.32, 0x9aa0a6, x, 0.1, z, { seg: 8 });
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; dRod(x, 0.1, z, x + Math.cos(a) * 0.3, 0.05, z + Math.sin(a) * 0.3, 0.018, 0x2a2a2e); }
      colliders.push(noStand({ x0: x - 0.28, x1: x + 0.28, y0: 0, y1: 1.09, z0: z - 0.28, z1: z + 0.28 }));
      if (sit) hotspots.push({ kind: 'sit', x: x - 0.75, z, y: 0, r: 0.75, label: '의자에 앉기', yaw: Math.PI / 2, seat: { x, y: 0.5 - 0.46, z, yaw: Math.PI / 2 } });
    }, 'chair');
    { const dz0 = zo + 2.75, dz1 = zS - 1.6, dc = (dz0 + dz1) / 2, L = dz1 - dz0, dx = x1 - 0.35;
      objScope('desk', () => { dBox(0.7, 0.04, L, 0xe8dcc2, dx, 0.7, dc);
        [[-1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => dBox(0.04, 0.7, 0.04, 0x2a2a2e, dx + i * 0.31, 0, dc + j * (L / 2 - 0.04)));
        dBox(0.6, 0.68, 0.5, 0xd9b45e, x1 - 0.32, 0, dz0 + 0.3);
        [dc - 0.75, dc + 0.65].forEach(z9 => { dBox(0.12, 0.1, 0.12, 0x3a3d44, x1 - 0.15, 0.74, z9); dBox(0.04, 0.36, 0.55, 0x2a2c30, x1 - 0.15, 0.84, z9); dBox(0.03, 0.3, 0.49, 0x5a7c9c, x1 - 0.185, 0.87, z9); dBox(0.15, 0.03, 0.42, 0xe6e6e0, x1 - 0.45, 0.74, z9); });
        dBox(0.35, 0.12, 0.25, 0xe07a3c, x1 - 0.25, 0.74, dz1 - 0.3); dBox(0.3, 0.1, 0.24, 0xf2d15c, x1 - 0.25, 0.86, dz1 - 0.3);
        colliders.push(noStand({ x0: x1 - 0.7, x1, y0: 0, y1: 0.74, z0: dz0, z1: dz1 })); });
      oChair(x1 - 1.0, dc - 0.75, 0xe06a3a, true); oChair(x1 - 1.0, dc + 0.65, 0x7a7e86, false); }
    { const cx = (x0 + x1) / 2 - 0.4, cz = zo + 3.6;
      objScope('desk', () => { dBox(1.3, 0.04, 1.3, 0xe8dcc2, cx, 0.7, cz);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => dBox(0.04, 0.7, 0.04, 0x2a2a2e, cx + i * 0.6, 0, cz + j * 0.6));
        dCyl(0.04, 0.035, 0.14, 0x6f6a60, cx + 0.2, 0.74, cz - 0.15, { seg: 8 }); dBox(0.3, 0.03, 0.22, 0xf4f4f0, cx - 0.2, 0.74, cz + 0.1); dBox(0.16, 0.03, 0.08, 0x2a2a2e, cx + 0.05, 0.74, cz + 0.35);
        colliders.push(noStand({ x0: cx - 0.65, x1: cx + 0.65, y0: 0, y1: 0.74, z0: cz - 0.65, z1: cz + 0.65 })); });
      const gChair = objWrap((x, z) => { dBox(0.46, 0.08, 0.44, 0x4f6e5a, x, 0.4, z); dBox(0.46, 0.4, 0.07, 0x4f6e5a, x, 0.48, z + 0.205);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => dBox(0.035, 0.4, 0.035, 0x2a2a2e, x + i * 0.19, 0, z + j * 0.18));
        colliders.push(noStand({ x0: x - 0.23, x1: x + 0.23, y0: 0, y1: 0.88, z0: z - 0.22, z1: z + 0.24 })); }, 'chair');
      gChair(cx - 0.35, cz + 0.95); gChair(cx + 0.35, cz + 0.95); }
    objScope('bed', () => { const bx = x0 + 0.475, bz0 = zS - 2.05, bz = (bz0 + zS) / 2;
      dBox(0.95, 0.35, 2.05, 0xe2dcd2, bx, 0, bz); dBox(0.9, 0.15, 2.0, 0xf7f5f1, bx, 0.35, bz);
      dBox(0.92, 0.04, 1.2, 0xf2c4cc, bx, 0.5, zS - 0.62); dBox(0.6, 0.12, 0.34, 0xf6d6dc, bx, 0.5, bz0 + 0.3);
      dBox(0.95, 0.8, 0.05, 0xd8d0c4, bx, 0, bz0 - 0.025);
      colliders.push({ x0, x1: x0 + 0.95, y0: 0, y1: 0.5, z0: bz0, z1: zS }, noStand({ x0, x1: x0 + 0.95, y0: 0, y1: 0.8, z0: bz0 - 0.05, z1: bz0 })); });
    hotspots.push({ kind: 'sit', x: x0 + 1.4, z: zS - 1.0, y: 0, r: 0.8, label: '침대에 앉기', yaw: Math.PI / 2, seat: { x: x0 + 0.62, y: 0.5 - 0.46, z: zS - 1.0, yaw: Math.PI / 2 } });
    objScope('screen', () => { const pz = zS - 2.45, pa = x0 + 1.1, pb = pa + 1.2;
      dBox(1.2, 1.3, 0.05, 0xb8bdc2, (pa + pb) / 2, 0.08, pz); dBox(1.24, 0.04, 0.07, 0x8a9096, (pa + pb) / 2, 1.38, pz);
      [pa + 0.12, pb - 0.12].forEach(x9 => dBox(0.05, 0.08, 0.4, 0x8a9096, x9, 0, pz));
      colliders.push(noStand({ x0: pa, x1: pb, y0: 0, y1: 1.42, z0: pz - 0.2, z1: pz + 0.2 })); });
    objScope('cab', () => { const cx = x1 - 0.95, cz = zS - 0.25;
      dBox(1.3, 0.72, 0.5, 0xf2f2ee, cx, 0, cz);
      [-0.33, 0.33].forEach(o => dBox(0.6, 0.62, 0.03, 0xfafaf7, cx + o, 0.05, cz - 0.265));
      dBox(0.48, 0.28, 0.36, 0xa32a2a, cx - 0.35, 0.72, cz + 0.02); dBox(0.28, 0.18, 0.03, 0x2a2a2e, cx - 0.4, 0.77, cz - 0.175);
      dBox(0.5, 0.34, 0.44, 0xe9e9e6, cx + 0.32, 0.72, cz); dBox(0.5, 0.04, 0.44, 0x5c6066, cx + 0.32, 1.06, cz);
      colliders.push(noStand({ x0: cx - 0.65, x1: cx + 0.65, y0: 0, y1: 1.1, z0: cz - 0.28, z1: zS })); });
    objScope('ac', () => { dBox(0.22, 0.3, 0.95, 0xf6f6f4, x0 + 0.11, 2.62, zS - 4.2); dBox(0.03, 0.05, 0.85, 0xa9aeb3, x0 + 0.235, 2.65, zS - 4.2); });
    [zo + 1.6, zo + 4.0, zS - 1.5].forEach(z9 => lamp(1.2, 0.05, 0.22, (x0 + x1) / 2, FH - 0.21, z9));
  }

  function labRoom(xw, xe, zc, zw, door, prepZ, prepX = null) {
    const dz = Math.sign(zw - zc);

    objScope('cab', () => { const z0 = zc, z1 = zc + dz * 0.9, c = (z0 + z1) / 2;
      dBox(0.5, 0.88, 0.9, 0x8dc63f, xw + 0.25, 0, c); dBox(0.52, 0.03, 0.9, 0xf2f2ee, xw + 0.26, 0.88, c);
      [-0.22, 0.22].forEach(o => { dBox(0.03, 0.78, 0.4, 0x9fd05a, xw + 0.515, 0.05, c + o); dBox(0.03, 0.14, 0.03, 0x9aa0a6, xw + 0.545, 0.55, c + o * 0.2); });
      colliders.push(noStand({ x0: xw, x1: xw + 0.52, y0: 0, y1: 0.91, z0: Math.min(z0, z1), z1: Math.max(z0, z1) })); });

    objScope('cab', () => { const a0 = Math.min(zc + dz * 0.95, zw - dz * 0.5), a1 = Math.max(zc + dz * 0.95, zw - dz * 0.5), L = a1 - a0, c = (a0 + a1) / 2, H = 2.3, n = Math.max(1, Math.round(L / 0.6)), cw = L / n;
      dBox(0.45, H, L, 0xf2f2ee, xw + 0.225, 0, c);
      dBox(0.47, 0.06, L - 0.02, LIME, xw + 0.255, 0.95, c);

      [[0.05, 0.91, 0xf7f7f3], [1.04, 2.24, 0xbfd2da]].forEach(([y0, y1, t]) => patPush('lockW', [[xw + 0.455, y0, a0], [xw + 0.455, y0, a1], [xw + 0.455, y1, a1], [xw + 0.455, y1, a0]], [[0, 0], [n, 0], [n, 1], [0, 1]], [1, 0, 0], t));
      colliders.push(noStand({ x0: xw, x1: xw + 0.47, y0: 0, y1: H, z0: a0, z1: a1 })); });

    { const a0 = door + 0.75, a1 = prepX != null ? prepX - 0.65 : xe - 1.2, L = a1 - a0, c = (a0 + a1) / 2, n = Math.max(1, Math.round(L / 0.6)), cw = L / n, fz = zc + dz * 0.45;
      objScope('case', () => {
      dBox(L, 0.9, 0.45, 0xf2f2ee, c, 0, zc + dz * 0.225);
      { const qz = zc + dz * 0.455; patPush('lockW', [[a0, 0.2, qz], [a1, 0.2, qz], [a1, 0.82, qz], [a0, 0.82, qz]], [[0, 0], [n, 0], [n, 1], [0, 1]], [0, 0, dz], 0xc4d6dd); }
      dBox(L, 0.03, 0.47, 0xf6f6f2, c, 0.9, zc + dz * 0.235);
      colliders.push(noStand({ x0: a0, x1: a1, y0: 0, y1: 0.93, z0: Math.min(zc, fz), z1: Math.max(zc, fz) })); });
      const sx0 = xe - 1.1, sc = (sx0 + xe) / 2, szc = zc + dz * 0.3;
      objScope('sink', () => {
      dBox(1.1, 0.85, 0.6, 0xe9e9e4, sc, 0, szc); dBox(1.1, 0.04, 0.62, 0xc9ced2, sc, 0.85, szc + dz * 0.01); dBox(0.5, 0.03, 0.34, 0x7d848a, sc, 0.89, szc);
      dRod(sc, 0.89, zc + dz * 0.06, sc, 1.18, zc + dz * 0.06, 0.014, 0xc9ced2); dRod(sc, 1.18, zc + dz * 0.06, sc, 1.12, zc + dz * 0.26, 0.012, 0xc9ced2);
      colliders.push(noStand({ x0: sx0, x1: xe, y0: 0, y1: 0.89, z0: Math.min(zc, zc + dz * 0.61), z1: Math.max(zc, zc + dz * 0.61) }));

      dBox(0.05, 0.03, 0.14, 0xc9ced2, sc + 0.037, 1.1, zc + dz * 0.1); });
      dBox(0.1, 0.18, 0.07, 0xf4f4f0, sx0 + 0.2, 1.02, zc + dz * 0.035); dBox(0.03, 0.05, 0.03, 0x7ab36a, sx0 + 0.2, 1.2, zc + dz * 0.035);
      hotspots.push({ kind: 'wash', x: sc, z: zc + dz * 1.05, y: 0, r: 1.0, label: '손 씻기', at: [sc, 1.12, zc + dz * 0.26, 0.9] }); }

    whiteLockers('x', xw + 0.5, xe - 0.6, zw, -dz, 0.75, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, 0);

    const bw = Math.min(3.6, Math.abs(zw - zc) - 4.9), zb = zw - dz * (1.9 + bw / 2);
    dBox(0.1, 0.34, 0.28, 0xf2f2ee, xe - 0.05, 1.15, prepZ + dz * 0.76);
    greenBoard('z', Math.min(prepZ + dz * 1.0, zb - dz * (bw / 2 + 0.3)), Math.max(prepZ + dz * 1.0, zb - dz * (bw / 2 + 0.3)), xe, -1, 1.0, 2.1, 'notice');
    dBox(0.04, 1.32, bw + 0.12, 0xaeb4ba, xe - 0.02, 0.9, zb); dBox(0.03, 1.2, bw, 0xf3f5f4, xe - 0.055, 0.96, zb); dBox(0.09, 0.03, bw, 0xaeb4ba, xe - 0.085, 0.9, zb);
    const fz = zb + dz * 1.0; dBox(0.03, 0.5, 0.72, 0x5a4632, xe - 0.015, 2.3, fz); sign(FLAG_KEY, xe - 0.042, 2.55, fz, -Math.PI / 2, 0.4);
    const tz = zw - dz * 0.8; dBox(0.07, 0.75, 1.3, 0x1e1f22, xe - 0.035, 1.75, tz); dBox(0.03, 0.67, 1.2, 0x2a3a4a, xe - 0.085, 1.79, tz);
    hotspots.push({ kind: 'board', x: xe - 0.6, z: zb, y: 0, r: 2.0, label: '칠판에 낙서하기', bx: xe - 0.08, by: 1.56, bz: zb, ry: -Math.PI / 2, bw, bh: 1.2 });
    npcSpot['과학실'] = [{ x: xe - 0.52, y: 0, z: zb + dz * 0.55, face: 3 }];

    { const x9 = xe - 1.15, z9 = zw - dz * 1.2, L9 = 1.2, c0 = Math.min(z9 - L9 / 2, z9 + L9 / 2), c1 = Math.max(z9 - L9 / 2, z9 + L9 / 2);
      objScope('desk', () => {
      dBox(0.72, 0.04, L9 + 0.04, 0xd9d6ce, x9, 0.72, z9);
      dBox(0.62, 0.72, 0.42, 0x6b6f76, x9, 0, c1 - 0.23);
      [0.18, 0.43, 0.62].forEach(hy => dBox(0.03, 0.03, 0.16, 0xc9ccd0, x9 + 0.325, hy, c1 - 0.23));
      dBox(0.62, 0.72, 0.04, 0x6b6f76, x9, 0, c0 + 0.02);
      dBox(0.04, 0.5, L9 - 0.5, 0x6b6f76, x9 - 0.3, 0.22, c0 + 0.04 + (L9 - 0.5) / 2);
      dBox(0.08, 0.07, 0.08, 0x3a3d44, x9 - 0.15, 0.76, z9 - 0.1); dBox(0.04, 0.34, 0.56, 0x2f3238, x9 - 0.17, 0.83, z9 - 0.1);
      dBox(0.03, 0.28, 0.5, 0x3d5870, x9 - 0.135, 0.86, z9 - 0.1);
      dBox(0.15, 0.03, 0.42, 0xe6e6e0, x9 + 0.12, 0.76, z9 - 0.1);
      dBox(0.2, 0.42, 0.4, 0x2f3238, x9 - 0.05, 0, c0 + 0.26);
      colliders.push(noStand({ x0: x9 - 0.36, x1: x9 + 0.36, y0: 0, y1: 0.76, z0: c0 - 0.02, z1: c1 + 0.02 })); });
      hideSpots.push({ kind: 'desk', label: '선생님 책상 밑', x: x9, y: 0, z: z9, face: 90, w: 1.2 });
      chair(x9 + 0.62, 0, z9, 1, 0xd9643a, 1); }
    { const zq = zw - dz * 0.26;
      objScope('monitor', () => { dBox(0.08, 0.07, 0.08, 0x3a3d44, xe - 2.0, 0.78, zq + dz * 0.05); dBox(0.56, 0.34, 0.04, 0x2f3238, xe - 2.0, 0.85, zq + dz * 0.07);
      dBox(0.5, 0.28, 0.03, 0x3d5870, xe - 2.0, 0.88, zq + dz * 0.035);
      dBox(0.42, 0.03, 0.14, 0xe6e6e0, xe - 2.0, 0.78, zq - dz * 0.12); });
      objScope('printer', () => { dBox(0.46, 0.26, 0.36, 0xeceae4, xe - 1.05, 0.78, zq); dBox(0.34, 0.03, 0.2, 0x5a5e63, xe - 1.05, 1.04, zq + dz * 0.04); dBox(0.3, 0.03, 0.12, 0xf8f8f4, xe - 1.05, 0.9, zq - dz * 0.19); }); }

    objScope('labtable', () => { const x = xe - 1.35, z = zb;
      dBox(0.76, 0.78, 2.36, 0xf2f2ee, x, 0, z); dBox(0.03, 0.6, 2.2, LIME, x - 0.395, 0.12, z);
      dBox(0.82, 0.03, 2.42, 0x2f2f2f, x, 0.78, z); dBox(0.8, 0.03, 2.4, 0xf4f4f0, x, 0.81, z);
      [-0.6, 0.6].forEach(o => { dBox(0.34, 0.03, 0.3, 0x8a9096, x, 0.84, z + o);
        dRod(x + 0.28, 0.84, z + o, x + 0.28, 1.16, z + o, 0.013, 0xc9ced2); dRod(x + 0.28, 1.16, z + o, x + 0.1, 1.1, z + o, 0.012, 0xc9ced2); });
      colliders.push(noStand({ x0: x - 0.41, x1: x + 0.41, y0: 0, y1: 0.84, z0: z - 1.21, z1: z + 1.21 })); });

    const lab = objWrap((cx, cz) => {
      colliders.push(noStand({ x0: cx - 0.4, x1: cx + 0.4, y0: 0, y1: 0.81, z0: cz - 0.9, z1: cz + 0.9 }));
      dBox(0.7, 0.72, 1.7, 0xf4f4f0, cx, 0.03, cz);
      [-1, 1].forEach(s => dBox(0.68, 0.68, 0.03, LIME, cx, 0.05, cz + s * 0.865));
      dBox(0.82, 0.03, 1.82, 0x2f2f2f, cx, 0.75, cz); dBox(0.8, 0.03, 1.8, 0xeeeeea, cx, 0.78, cz);
    }, 'labtable');
    const xA = xe - 2.8, xB = xw + 0.92, OL = 0x7d9a3a;
    const labChair = objWrap((cx, cz, back) => {
      colliders.push(noStand({ x0: cx - 0.2, x1: cx + 0.2, y0: 0, y1: 0.85, z0: cz - 0.25, z1: cz + 0.25 }));
      dBox(0.4, 0.04, 0.42, OL, cx, 0.42, cz); dBox(0.035, 0.34, 0.42, OL, cx + back * 0.17, 0.46, cz); dBox(0.06, 0.42, 0.26, METAL, cx, 0, cz); }, 'chair');
    const xM = xe - xw > 8.5 ? (xA + xB) / 2 + 0.3 : null;
    [-1.6, 1.6].forEach(o9 => { const cz = (zc + zw) / 2 + o9;
      lab(xA, cz); lab(xB, cz); if (xM) lab(xM, cz);
      [-0.45, 0.45].forEach(o => {
        labChair(xA - 0.65, cz + o, -1);
        hotspots.push({ kind: 'sit', x: xA - 1.15, z: cz + o, y: 0, r: 0.75, label: '의자에 앉기', yaw: Math.PI / 2 });
        labChair(xB + 0.65, cz + o, 1);
      });
    });
  }

  function canopyBox(cx, cz, cy, sy, a, b, ry) {
    const c = Math.cos(ry), sn = Math.sin(ry), ha = Math.hypot(a * c, b * sn), hb = Math.hypot(a * sn, b * c), g = tY(cz, cx);
    const hq = g + 1.4, f = cy <= hq ? 1 : cy - hq >= sy * 0.95 ? 0 : Math.sqrt(1 - ((cy - hq) / sy) ** 2);
    if (f < 0.3) return;
    const off = (x, z) => Math.abs(tY(z, x) - g) > 0.15;
    let x0 = cx - 0.8 * f * ha, x1 = cx + 0.8 * f * ha, z0 = cz - 0.8 * f * hb, z1 = cz + 0.8 * f * hb;
    while (z1 > cz && [x0, cx, x1].some(x => off(x, z1 + 0.3))) z1 -= 0.1;
    while (z0 < cz && [x0, cx, x1].some(x => off(x, z0 - 0.3))) z0 += 0.1;
    while (x1 > cx && [z0, cz, z1].some(z => off(x1 + 0.3, z))) x1 -= 0.1;
    while (x0 < cx && [z0, cz, z1].some(z => off(x0 - 0.3, z))) x0 += 0.1;
    if (x1 - x0 < 0.3 || z1 - z0 < 0.3) return;
    const y0 = Math.max(g + 0.05, cy - sy * 0.9);
    colliders.push(noStand({ x0, x1, y0, y1: y0 + 1.6, z0, z1 }));
  }

  function ellipseCols(cx, cz, a, b, ry, y0, y1, k = 0.9, ns = true) {
    const c = Math.cos(ry), s = Math.sin(ry), hx = k * Math.hypot(a * c, b * s), hz = k * Math.hypot(a * s, b * c), alongX = hz <= hx;
    const A2 = 1 / (a * a), B2 = 1 / (b * b), H = alongX ? hz : hx, n = Math.max(2, Math.ceil(2 * H / 0.3));

    const chord = t => { const [p, q, r] = alongX ? [c * c * A2 + s * s * B2, 2 * t * c * s * (B2 - A2), t * t * (s * s * A2 + c * c * B2) - k * k]
                                                    : [s * s * A2 + c * c * B2, 2 * t * c * s * (B2 - A2), t * t * (c * c * A2 + s * s * B2) - k * k];
      const D = q * q - 4 * p * r; if (D <= 0) return null; const e = Math.sqrt(D); return [(-q - e) / (2 * p), (-q + e) / (2 * p)]; };
    for (let i = 0; i < n; i++) { const t0 = -H + 2 * H * i / n, t1 = -H + 2 * H * (i + 1) / n, ch = chord((t0 + t1) / 2); if (!ch || ch[1] - ch[0] < 0.1) continue;
      const box = alongX ? { x0: cx + ch[0], x1: cx + ch[1], y0, y1, z0: cz + t0, z1: cz + t1 } : { x0: cx + t0, x1: cx + t1, y0, y1, z0: cz + ch[0], z1: cz + ch[1] };
      colliders.push(ns ? noStand(box) : box); }
  }

  function roundCol(x, z, r, y0, y1) {
    colliders.push({ x0: x - r, x1: x + r, y0, y1, z0: z - 0.62 * r, z1: z + 0.62 * r }, { x0: x - 0.62 * r, x1: x + 0.62 * r, y0, y1, z0: z - r, z1: z + r });
  }

  function prunedPine(x, z, s = 1, lite = false, at = null) {
    const y = tY(z, x), R = seeded(Math.floor(Math.abs(x * 131 + z * 71)) + 7), F = { far: true, chunky: lite, jitter: lite ? 0.12 : 0, ...(at ? { at } : {}) };
    colliders.push({ x0: x - 0.2*s, x1: x + 0.2*s, y0: y, y1: y + 12, z0: z - 0.2*s, z1: z + 0.2*s });
    let px = x, py = y, pz = z, a = R() * 6.28;
    for (let k = 0; k < 3; k++) {
      const L = (0.75 + R()*0.35) * s, t = 0.28 + R()*0.2, dx = Math.cos(a), dz = Math.sin(a);
      dCyl(0.1*s*(1 - k*0.22), 0.13*s*(1 - k*0.22), L, 0x5e4a3a, px, py, pz, { far: true, seg: lite ? 5 : 7, rot: [t*dz, 0, -t*dx], ...(at ? { at } : {}) });
      px += Math.sin(t) * dx * L; py += Math.cos(t) * L; pz += Math.sin(t) * dz * L;
      a += 1.2 + R() * 1.6;
    }
    const pads = 4 + Math.floor(R() * 3), PG = [0x4a8250, 0x55905a, 0x4c8752];
    for (let k = 0; k < pads; k++) {
      const h = (1.0 + k * (2.1 / pads)) * s, r = (0.82 - k * 0.09 + R() * 0.2) * s, ang = R() * 6.28, d = (k === pads - 1 ? 0.1 : 0.45 + R() * 0.55) * s;
      dBlob(r, r * 0.34, r * 0.85, PG[k % 3], x + Math.cos(ang) * d, y + h, z + Math.sin(ang) * d, lite ? { ...F, ry: ang } : F);
      canopyBox(x + Math.cos(ang) * d, z + Math.sin(ang) * d, y + h, r * 0.34, r * (lite ? 0.95 : 1), r * (lite ? 0.81 : 0.85), lite ? ang : 0);
      dBlob(r * 0.7, r * 0.26, r * 0.6, 0x6aa362, x + Math.cos(ang) * d, y + h + r * 0.18, z + Math.sin(ang) * d, { far: true, chunky: lite, ry: ang, jitter: 0.12, ...(at ? { at } : {}) });
    }
  }

  function shrub(x, z, r = 0.6, hex = 0x4d8b4d, lite = false) {
    const y = tY(z, x);
    if (r >= 0.5) hideSpots.push({ kind: 'bush', label: '덤불 속', x, y, z, face: null, w: r * 2 });
    colliders.push(noStand({ x0: x - r*0.85, x1: x + r*0.85, y0: y, y1: y + r*1.4, z0: z - r*0.85, z1: z + r*0.85 }));
    dBlob(r, r*0.78, r, hex, x, y + r*0.68, z, { far: true, chunky: lite, ry: x, jitter: lite ? 0.16 : 0.1 });
  }

  function mound(x, z, w = 1.7, h = 0.9, d = 1.4, hex = 0x4f8a45, lite = false, ry = null) {
    const y = tY(z, x), hh = hash2(x, z);

    const r9 = ry == null ? hh * 6 : ry;
    if (h >= 0.7) hideSpots.push({ kind: 'bush', label: '덤불 속', x, y, z, face: null, w });
    ellipseCols(x, z, w / 2, d / 2, r9, y, y + h, lite ? 0.86 : 0.9);
    dBlob(w / 2, h * 0.62, d / 2, hex, x, y + h * 0.38, z, { far: true, chunky: lite, ry: r9, jitter: lite ? 0.14 : 0.1 });
    dBlob(w * 0.36, h * 0.3, d * 0.34, 0x8cb85a, x + (hh - 0.5) * 0.2, y + h * 0.72, z, { far: true, chunky: true, ry: hh * 9, jitter: 0.12 });
  }

  function spreadPine(x, z, s = 1) {
    const y = tY(z, x), R = seeded(Math.floor(Math.abs(x * 97 + z * 53)) + 11), F = { far: true };
    colliders.push({ x0: x - 0.2 * s, x1: x + 0.2 * s, y0: y, y1: y + 12, z0: z - 0.2 * s, z1: z + 0.2 * s });
    const a0 = R() * 6.28;
    [0, 1].forEach(k => { const a = a0 + k * 2.4, t = 0.5 + R() * 0.25; dCyl(0.08 * s, 0.13 * s, 1.5 * s, 0x6a4a36, x, y, z, { far: true, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] }); });
    for (let k = 0; k < 4; k++) {
      const a = a0 + k * 1.7 + R() * 0.6, d = (0.7 + R() * 0.9) * s, h = (1.05 + k * 0.42 + R() * 0.2) * s, r = (1.0 - k * 0.12 + R() * 0.2) * s;
      dBlob(r * 1.25, r * 0.3, r, [0x557f47, 0x5c8a4e, 0x507a42][k % 3], x + Math.cos(a) * d, y + h, z + Math.sin(a) * d, F);
      canopyBox(x + Math.cos(a) * d, z + Math.sin(a) * d, y + h, r * 0.3, r * 1.25, r, 0);
      dBlob(r * 0.9, r * 0.22, r * 0.7, 0x76a45e, x + Math.cos(a) * d, y + h + r * 0.16, z + Math.sin(a) * d, { far: true, chunky: true, ry: a, jitter: 0.12 });
    }
  }

  function ballJuniper(x, z, s = 1, lite = false) {
    const y = tY(z, x), hh = hash2(x, z);

    roundCol(x, z, (lite ? 0.85 : 0.9) * 0.62 * s, y, y + 12);
    dCyl(0.07 * s, 0.11 * s, 2.6 * s, 0x5e4a3a, x, y, z, { far: true, seg: 6 });
    [[0.62, 0.55, 0, 0], [0.5, 1.35, 0.28, 0.1], [0.4, 2.05, -0.2, -0.12], [0.3, 2.65, 0.05, 0.08]].forEach(([r, h, ox, oz], k) =>
      dBlob(r * s, r * 0.82 * s, r * s, [0x2f6a3a, 0x357242, 0x2b6236, 0x3a7a46][k], x + ox * s * (hh > 0.5 ? 1 : -1), y + h * s, z + oz * s, { far: true, chunky: lite, ry: hh * 5 + k, jitter: lite ? 0.14 : 0.1 }));
  }

  function compassRose(x, y, z, r) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.translate(128, 128);

    g.fillStyle = '#eee5d0'; g.beginPath(); g.arc(0, 0, 127, 0, 7); g.fill();
    g.fillStyle = '#3a3d44'; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.fill();
    g.strokeStyle = '#e9e1cf'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 88, 0, 7); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8 - Math.PI / 2; g.fillStyle = '#e9e1cf'; g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); g.lineTo(Math.cos(a - 0.2) * 84, Math.sin(a - 0.2) * 84); g.lineTo(Math.cos(a + 0.2) * 84, Math.sin(a + 0.2) * 84); g.closePath(); g.fill(); }
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? 84 : 127, w = k % 2 ? 16 : 24;
      [[1, k % 2 ? '#e8dfcf' : '#8a8f96'], [-1, k % 2 ? '#9a3b2e' : '#1f2024']].forEach(([sd, col]) => {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        g.lineTo(Math.cos(a + sd * Math.PI / 4) * w, Math.sin(a + sd * Math.PI / 4) * w); g.closePath(); g.fill(); });
    }
    g.fillStyle = '#e9e1cf'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshLambertMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m);
  }

  function railAlong(ax, a0, a1, wall, f, skip = [], y = 0.82) {
    const sk = skip.slice().sort((p, q) => p[0] - q[0]);
    let a = a0;
    const emit = (u, v) => { if (v - u < 0.3) return; ax === 'x' ? dBox(v - u, 0.07, 0.06, 0x8a5a3b, (u + v)/2, y, wall + f*0.03) : dBox(0.06, 0.07, v - u, 0x8a5a3b, wall + f*0.03, y, (u + v)/2); };
    for (const [u, v] of sk) { if (u > a) emit(a, Math.min(u, a1)); a = Math.max(a, v); }
    if (a < a1) emit(a, a1);
  }

  const fencePos = [], fenceUV = [], fenceCol = [];

  const railPos = [], railUV = [];
  function roofRail(x0, z0, x1, z1, yb, H = 1.0) {
    const L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.3) return;
    const P = [[x0, yb, z0], [x1, yb, z1], [x1, yb + H, z1], [x0, yb + H, z0]], U = [[0, 0], [L / 1.6, 0], [L / 1.6, 1], [0, 1]];
    for (const i of [0, 1, 2, 0, 2, 3]) { railPos.push(...P[i]); railUV.push(...U[i]); }
  }
  function meshFence(x0, z0, x1, z1, yb, H = 1.8, col = 0x3d6b4a, post9 = 0x3d5a45, collide = true, railSeg = 0, near = false) {
    const L = Math.hypot(x1 - x0, z1 - z0), P = [[x0, yb, z0], [x1, yb, z1], [x1, yb + H, z1], [x0, yb + H, z0]], U = [[0, 0], [L / 0.6, 0], [L / 0.6, H / 0.6], [0, H / 0.6]];
    if (L < 0.3) return;
    _c.set(col);
    for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); }
    const n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + (x1 - x0)*t, pz = z0 + (z1 - z0)*t; dRod(px, yb, pz, px, yb + H + 0.05, pz, 0.045, post9, { far: !near }); }
    const nr = railSeg ? Math.max(1, Math.ceil(L / railSeg)) : 1;
    for (let k = 0; k < nr; k++) dRod(x0 + (x1 - x0) * k / nr, yb + H, z0 + (z1 - z0) * k / nr, x0 + (x1 - x0) * (k + 1) / nr, yb + H, z0 + (z1 - z0) * (k + 1) / nr, 0.03, post9, { far: !near });
    if (collide) colliders.push({ x0: Math.min(x0, x1) - 0.12, x1: Math.max(x0, x1) + 0.12, y0: yb, y1: yb + Math.max(3, H + 0.3), z0: Math.min(z0, z1) - 0.12, z1: Math.max(z0, z1) + 0.12, nc: true });
  }

  function slope(kind, ax, a0, a1, s0, s1, y0, y1, steps, tint = 0xffffff) {
    const S = PATDEF[kind][0];
    const pts = ax === 'z' ? [[a0, y0, s0], [a1, y0, s0], [a1, y1, s1], [a0, y1, s1]] : [[s0, y0, a0], [s0, y0, a1], [s1, y1, a1], [s1, y1, a0]];
    patPush(kind, pts, pts.map(p => [p[0] / S, -p[2] / S]), [0, 1, 0], tint);
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps, t1 = (k + 1) / steps, top = y0 + (y1 - y0) * (t0 + t1) / 2, lo = Math.min(y0, y1) - 0.02;
      const b0 = s0 + (s1 - s0) * t0, b1 = s0 + (s1 - s0) * t1;
      if (top - lo < 0.02) continue;
      colliders.push(ax === 'z' ? { x0: a0, x1: a1, y0: lo, y1: top, z0: Math.min(b0, b1), z1: Math.max(b0, b1) } : { x0: Math.min(b0, b1), x1: Math.max(b0, b1), y0: lo, y1: top, z0: a0, z1: a1 });
    }
  }

  function slopeCap(kind, line, f, zTop, zBot, yTop, yBot, tint = 0xffffff) {
    const S = PATDEF[kind][0], pts = [[line, yBot, zBot], [line, yTop, zTop], [line, yBot, zTop], [line, yBot, zTop]];
    patPush(kind, pts, pts.map(p => [p[2] / S, p[1] / S]), [f, 0, 0], tint);
  }

  patGrid('grass', -190, 170, -150, 130, FIELD - 0.012, 16, (x, z) => { const n = vnoise(x / 23, z / 23) - 0.5, m = vnoise(x / 9 + 40, z / 9) - 0.5;
    return [1 + n * 0.16 + m * 0.05, 1 + n * 0.1 + m * 0.06, 1 + n * 0.02]; },
    (a0, a1, b0, b1) => a0 >= TR3.westX && a1 <= SCHOOL.field.x[1] && b0 >= SCHOOL.field.z[0] && b1 <= SCHOOL.field.z[1]);

  const SITE = 0xc2bcb0;
  addBox(150, YARD - FIELD, TERR_Z + 90, SITE, -13, FIELD, (TERR_Z - 90) / 2);
  addBox(TR3.westX + 88, YARD - FIELD, TR3.westZ - TERR_Z, SITE, (TR3.westX - 88) / 2, FIELD, (TERR_Z + TR3.westZ) / 2);
  { const F = SCHOOL.field;

    const FX = (F.x[0] + F.x[1]) / 2, FZc = (F.z[0] + F.z[1]) / 2, FW = (F.x[1] - F.x[0]) / 2, FD = (F.z[1] - F.z[0]) / 2;
    const dirtT = (x, z) => { const e = Math.max(Math.abs(x - FX) / FW, Math.abs(z - FZc) / FD), n = vnoise(x / 11, z / 11) - 0.5, w = 1 + 0.05 - 0.1 * Math.min(1, e * e) + n * 0.09;
      return [w, w * (1 - n * 0.012), w * (1 - n * 0.03)]; };
    patGrid('dirt', TR3.westX, F.x[1], F.z[0], F.z[1], FIELD, 4, dirtT);
    patGrid('dirt', F.x[0], TR3.westX, TR3.westZ, F.z[1], FIELD, 4, dirtT);

  }

  const [fx0, fx1] = FR.x, [fz0, fz1] = FR.z, zCor = fz0 + FR.corridorDepth;
  const hall = FR.rooms.find(r => r.type === 'hall'), hc = (hall.span[0] + hall.span[1]) / 2;
  const wg = B.wings[0], WL = B.westLobby, CL = B.centerLobby, LC = B.linkCorridor, EN = B.entrance, RC = EN.recess;
  const LOB_X0 = WL.x[0], LOB_X = WL.x[1], LOB_Z = WL.northZ, VZ = WL.vestibuleZ, SIDE_Z = (VZ[0] + VZ[1]) / 2, KBZ = WL.kinderBlockZ;
  const HX0 = hall.span[0], HX1 = hall.span[1], EZI = EN.innerDoorZ;
  const twoDoor = r => ['classroom', 'computer', 'daycare', 'science'].includes(r.type);
  const backDoor = r => ({ c: r.span[1] - 1.9, w: 1.2 });

  addBox(fx1 - fx0 + 0.3, -YARD, fz1 + 0.15 - fz0, 0xbab7ae, (fx0 + fx1) / 2, YARD, (fz0 + fz1 + 0.15) / 2);
  foundation(EN.x[0], EN.x[1], fz1 + 0.15, EN.z[1] - 0.4);
  foundation(EN.x[0], RC.x[0], EN.z[1] - 0.4, EN.z[1]); foundation(RC.x[1], EN.x[1], EN.z[1] - 0.4, EN.z[1]);
  foundation(wg.x[1] + 0.15, B.kitchen.x[0] - 0.15, fz0 - 0.15, fz0);
  foundation(CL.x[1] + 0.15, fx1 + 0.15, fz0 - 0.15, fz0);

  const KHK = 0x9b9e90, PGRY = 0xd1d2ce, FBLUE = 0x78a2e2, FYEL = 0xeec83c;
  PATDEF.panelG = [2.4, 256, false, (g, N, R) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { g.fillStyle = pick(['#d2d3cf', '#cdcecb', '#d6d7d3'], R); g.fillRect(i*64, j*32, 64, 32); }
    g.fillStyle = '#b0b1ad'; for (let i = 0; i <= 4; i++) g.fillRect(i*64 - 1, 0, 2, N); for (let j = 0; j <= 8; j++) g.fillRect(0, j*32 - 1, N, 2); }];
  const SEC_WALL = { y: KHK, g: PGRY, b: WALL }, SEC_SKIN = { y: 'siding', g: 'panelG', b: 'panelB' }, SEC_BOX = { y: FYEL, g: FYEL, b: FBLUE };
  const facadeGaps = [], FBOX = [];
  { const FD9 = 0.6, MUL = 0.4;
    const half = x => x <= fx0 ? 1.8 : x >= fx1 ? 0.6 : (x === EN.x[0] || x === EN.x[1] || x === 10.4 || x === 14.6) ? 0.2 : x === -6.65 ? 0.3 : x === 33.05 ? 0.075 : 0.25;
    const R9 = FR.rooms.filter(r => r.type !== 'hall');
    const colOf = x => (x < -6.65 || x > 33.05) ? FYEL : FBLUE;
    const winsIn = (ra, rb, n, wmax) => { const w = Math.min(wmax, (rb - ra - (n - 1) * MUL) / n), s = (ra + rb - n * w - (n - 1) * MUL) / 2;
      return Array.from({ length: n }, (_, k) => ({ c: s + w / 2 + k * (w + MUL), w, sill: 1.0, dh: 2.6, win: true, noLedge: true })); };
    const fillOf = (a, b, gs) => { const f = []; let cur = a; gs.forEach(g => { if (g.c - g.w / 2 - cur > 0.01) f.push([cur, g.c - g.w / 2]); cur = g.c + g.w / 2; }); if (b - cur > 0.01) f.push([cur, b]); return f; };
    for (let i = 0; i < R9.length; i++) {
      const r = R9[i], [s0, s1] = r.span, n = Math.max(1, Math.round((s1 - s0) / 4.3));
      if (r.kinderOffice) {
        const a = s0 + half(s0), b = s1 - half(s1), WF = 0xf2f2ee;
        const gs = [{ c: a + 0.65, w: 0.7 }, { c: a + 1.65, w: 0.7 }, { c: b - 1.1, w: 1.6 }].map(g => ({ ...g, sill: 1.0, dh: 2.6, win: true, noLedge: true, frame: WF }));
        facadeGaps.push(...gs); FBOX.push({ a, b, col: FYEL, fill: fillOf(a, b, gs).filter((f, k) => k !== 2) });
      } else if (r.kinder) {
        const a = s0 + half(s0), b = s1 - half(s1), gs = winsIn(a + 1.65, b - 0.3, 2, 3.6);
        facadeGaps.push(...gs); FBOX.push({ a, b, col: colOf((s0 + s1) / 2), fill: fillOf(a, b, gs) });
      } else if (r.type === 'toilet') {
        const seg = (s1 - s0 - 0.8) / n;
        for (let k = 0; k < n; k++) { const g = { c: s0 + 0.4 + seg * (k + 0.5), w: Math.min(2.6, seg - 0.9), sill: 1.0, dh: 2.6, win: true, noLedge: true };
          facadeGaps.push(g); FBOX.push({ a: g.c - g.w / 2 - 0.3, b: g.c + g.w / 2 + 0.3, col: colOf(g.c), fill: [[g.c - g.w / 2 - 0.3, g.c - g.w / 2], [g.c + g.w / 2, g.c + g.w / 2 + 0.3]] }); }
      } else if (r.name === '행정실' && R9[i + 1] && R9[i + 1].name === '교장실') {
        const r2 = R9[i + 1], a = s0 + half(s0), b = r2.span[1] - half(r2.span[1]);
        const gs = [...winsIn(a + 0.3, s1 - MUL / 2, 1, 3.6), ...winsIn(s1 + MUL / 2, b - 0.3, 1, 3.6)];
        facadeGaps.push(...gs); FBOX.push({ a, b, col: FBLUE, fill: fillOf(a, b, gs) }); i++;
      } else {
        const a = s0 + half(s0), b = s1 - half(s1), gs = winsIn(a + 0.3, b - 0.3, n, 3.8);
        facadeGaps.push(...gs); FBOX.push({ a, b, col: colOf((s0 + s1) / 2), fill: fillOf(a, b, gs) });
      }
    }

    FBOX.forEach(({ a, b, col, fill }) => { const zc = fz1 + 0.15 + FD9 / 2;
      dBox(b - a, 0.35, FD9, col, (a + b) / 2, 2.6, zc); dBox(b - a, 0.13, FD9, col, (a + b) / 2, 0.85, zc);
      fill.forEach(([u, v]) => dBox(v - u, 1.62, FD9, col, (u + v) / 2, 0.98, zc));
      colliders.push({ x0: a, x1: b, y0: YARD, y1: 2.95, z0: fz1 + 0.15, z1: fz1 + 0.15 + FD9, nc: true }); });

    const PD9 = FD9 + 0.04, PL = 0xd9dad6, TOP = FH + 0.84;
    [[-33.5, 0.5, PL, TOP], [-23.3, 0.5, PL, TOP], [-15, 0.5, PL, TOP], [-6.65, 0.6, FBLUE, TOP], [2.2, 0.5, FBLUE, 2.95], [24.15, 0.5, FBLUE, TOP], [41.45, 0.5, FYEL, TOP]].forEach(([x, w, c, t]) => {
      dBox(w, t - YARD, PD9, c, x, YARD, fz1 + 0.15 + PD9 / 2);
      colliders.push({ x0: x - w / 2, x1: x + w / 2, y0: YARD, y1: t, z0: fz1 + 0.15, z1: fz1 + 0.15 + PD9, nc: true }); });
    dBox(0.15, FH - 0.035 - YARD, 0.1, FBLUE, 33.05, YARD, fz1 + 0.2);

    facadeGaps.forEach(g => { const c9 = noStand({ x0: g.c - g.w / 2, x1: g.c + g.w / 2, y0: 1.0, y1: 2.6, z0: fz1 - 0.15, z1: fz1 - 0.08 }, 0.1); c9.tiny = []; colliders.push(c9); });

    facadeGaps.forEach(g => { if (g.c > -33.5 && (g.c < -6.65 || g.c > 33.05) && g.w > 1.3) [1.35, 1.62].forEach(y9 => dCyl(0.085, 0.085, 0.08, 0xf2f2ee, g.c - g.w / 2 + 0.32, y9, fz1 + 0.1, { rot: [Math.PI / 2, 0, 0], seg: 10 })); });

    dCyl(0.1, 0.1, 0.06, 0x9a9da0, -36.6, 0.55, fz1 + 0.15, { rot: [Math.PI / 2, 0, 0], seg: 10 }); dBox(0.05, 0.12, 0.1, 0xc0c3c6, -38.7, 0.3, fz1 + 0.2);
  }

  const G3 = facadeGaps.filter(g => g.c > 41.45).sort((p, q) => p.c - q.c), G3X = G3.length > 1 ? (G3[0].c + G3[0].w / 2 + G3[1].c - G3[1].w / 2) / 2 : 46.2;
  const FSEC = [[fx0 - 0.15, -33.5, 'y'], [-33.5, -15, 'g'], [-15, -6.65, 'y'], [-6.65, EN.x[0], 'b'], [EN.x[1], 33.05, 'b'], [33.05, 41.45, 'y'], [41.45, G3X, 'g'], [G3X, fx1 + 0.15, 'y']];
  const secOf = x => (FSEC.find(([a, b]) => x > a && x < b) || FSEC[3])[2];
  const gapsIn = (a, b) => facadeGaps.filter(g => g.c > a && g.c < b);
  { const P9 = plinths.length;
    FSEC.forEach(([a, b, k]) => wallX(a, b, fz1, SEC_WALL[k], { gaps: gapsIn(a, b), face: 1, ext: true, skin: SEC_SKIN[k], innerHex: CLS_WALL }));
    plinths.splice(P9); }

  sign(SCHOOL.name.split('').join(' '), -1.0, 3.37, fz1 + 0.44, 0, 1.02, { bg: 'none', fg: '#23407e' });

  dCyl(0.05, 0.05, FH + 0.25 - YARD, 0xb4b8bb, fx0 + 0.3, YARD, fz1 + 0.24, { seg: 8 });
  [-33.5, -15, -6.65, 24.15, 41.45].forEach(x => { const px = x + (x === -6.65 ? 0.42 : 0.36); dCyl(0.05, 0.05, FH + 0.25 - 2.95, 0xeceae4, px, 2.95, fz1 + 0.24, { seg: 8 }); });

  const STX0 = wg.rooms.find(r => r.type === 'stair').span[0];
  const libR = wg.rooms.find(r => r.type === 'library');
  wallX(LOB_X - 0.15, STX0 + 0.15, fz0, INNER, { face: -1, dado: HALL_DADO, gaps: [{ c: (libR.span[0] + 0.4 + libR.span[1] - 0.35) / 2, w: libR.span[1] - libR.span[0] - 0.75, sill: 1.05, dh: 2.45, win: true, frame: 0xc9cdd2 }] });
  const LANEW = { c: (wg.x[1] + B.kitchen.x[0]) / 2 - 0.15, w: 1.8, sill: 1.0, dh: 3.05, win: true };
  wallX(wg.x[1] - 0.15, B.kitchen.x[0], fz0, WALL, { face: -1, dado: HALL_DADO, gaps: [LANEW] });

  wallX(B.kitchen.x[0], CL.x[0] + 0.15, fz0, 0xbcc8ca, { face: -1, dado: HALL_DADO, gaps: [{ c: B.kitchen.dutyRoom.doorC, w: 1.2, color: 0xa9afb5 }, { c: B.kitchen.staffDoorC, w: 1.0, color: 0xf2f2ee },
    { c: B.kitchen.exitC, w: 1.0, glass: true, color: 0x3c8a6a }, { c: B.kitchen.doorC, w: 1.8, color: 0xf2f2ee }] });

  const BOARD = [CL.x[1] + 0.35, CL.x[1] + 5.35];

  const NW0 = 26.8, NWW = 3.0, NPW = 0.45, NBAY = [0, 1, 2, 3, 4, 5, 6].map(k => NW0 + k * (NWW + NPW));
  const NWIN = [{ c: (BOARD[0] + BOARD[1]) / 2, w: BOARD[1] - BOARD[0] - 0.3, sill: 2.55, dh: 3.05, win: true }, { c: 24.0, w: 1.5, sill: 1.0, dh: 3.05, win: true },
    ...NBAY.map(a => ({ c: a + NWW / 2, w: NWW, sill: 1.0, dh: 3.05, win: true }))];
  wallX(CL.x[1] - 0.15, fx1 + 0.15, fz0, 0xe8e3d7, { gaps: NWIN, face: -1, ext: true, dado: { top: 1.0, lo: HALL_DADO.lo, hi: 0xf3ead2 } });

  const cut16 = (a, b, f) => { const P = []; for (let u = a; u < b - 1e-6;) { const v = Math.min(b, (Math.floor(u / 16 + 1e-6) + 1) * 16); P.push([u, v]); u = v; }
    for (let i = P.length - 1; i > 0; i--) if (P[i][1] - P[i][0] < 0.1) { P[i - 1][1] = P[i][1]; P.splice(i, 1); } if (P.length > 1 && P[0][1] - P[0][0] < 0.1) { P[1][0] = P[0][0]; P.shift(); } P.forEach(([u, v]) => f(u, v)); };
  const NWINC = NWIN.filter(g => g.sill < 2).map(g => g.c);

  [[CL.x[0] + 0.15, 1], [CL.x[1] - 0.15, -1]].forEach(([x9, f9]) => dBox(0.04, FH - 0.1, 0.34, DKWOOD, x9 + f9 * 0.02, 0, fz0));

  wallZ(fz0, fz1, fx1, WALL, { gaps: [{ c: fz0 + 0.15 + 0.225, w: 0.45, sill: 0, dh: 2.3, win: true, frame: 0xb8bcc0, noLedge: true }, { c: (fz0 + zCor) / 2, w: 1.3, dh: 2.3, glass: true, door: true, slideOver: true },
    { c: zCor - 0.15 - 0.225, w: 0.45, sill: 0, dh: 2.3, win: true, frame: 0xb8bcc0, noLedge: true }], face: 1, skin: 'panelB', innerHex: CLS_WALL });

  const DOORCOL = { '유치원': 0xf2c230, '사랑반': 0xf0a8b8 };
  const DOORCOL_F = { '유치원': 0xf1dcd8 };
  const KSHX = FR.rooms.find(r => r.kinder).span[1] - 0.82;

  const TDOOR = [[18.3, 0xf3dc6a, '남직원', '#3f6fb6'], [19.7, 0xd4bcef, '여직원', '#c9507e'], [22.0, 0xaed6f5, '남학생', '#3f6fb6'], [23.5, 0xc9e69e, '여학생', '#c9507e']];
  const cGaps = FR.rooms.filter(r => r.span[0] >= LOB_X0 - 0.01 && r.type !== 'toilet').map(r => r.type === 'hall' ? { c: hc, w: 3.32, dh: 2.5 } : { c: r.span[0] + 1.9, w: 1.2, color: DOORCOL_F[r.name] ?? DOORCOL[r.name] });
  FR.rooms.filter(r => twoDoor(r) && r.span[0] >= LOB_X0 - 0.01).forEach(r => cGaps.push({ ...backDoor(r), color: DOORCOL[r.name] }));
  TDOOR.forEach(([c, col]) => cGaps.push({ c, w: 0.9, color: col, tf: true }));

  const offWinsOf = r => { if (r.type !== 'office' || r.kinderOffice) return [];
    const a = r.span[0] + 1.9 + 0.6 + 0.35, L = r.span[1] - 0.45 - a; if (L < 1.2) return [];
    const n = L >= 2.8 ? 2 : 1, w = (L - (n - 1) * 0.6) / n;
    return Array.from({ length: n }, (_, k) => ({ c: a + w / 2 + k * (w + 0.6), w, sill: 1.1, dh: 2.8, win: true, frame: k === 0 ? 0x8a98a4 : 0x7a5a3e })); };
  const offWins = FR.rooms.flatMap(offWinsOf);
  wallX(LOB_X0 - 0.15, fx1 - 0.15, zCor, CLS_WALL, { gaps: [...cGaps, ...corWins(), ...offWins], face: 1 });
  doors.forEach(d => { if (d.ax === 'x' && Math.abs(d.cz - zCor) < 0.01 && TDOOR.some(([c]) => Math.abs(d.cx - c) < 0.01)) d.film = true; });
  {

    const k0 = FR.rooms.find(r => r.name === '유치원').span[0], k1 = FR.rooms.find(r => r.name === '사랑반').span[1];
    const SWZ = zCor - 0.154, DY = 1.1, CY = FH - 0.16, X0 = LOB_X0 + 0.15, X1 = fx1 - 0.15, ops = [...cGaps, ...corWins(), ...offWins, { c: hc, w: HX1 - HX0 - 0.3, sill: 0, dh: CY }];
    const skinQ = (kind, a, b, y0, y1) => { const D9 = kind === 'corDadoS';
      patPush(D9 ? 'ctile' : 'cflat', [[a, y0, SWZ], [b, y0, SWZ], [b, y1, SWZ], [a, y1, SWZ]], D9 ? [[a / 0.2, 0.12], [b / 0.2, 0.12], [b / 0.2, 0.38], [a / 0.2, 0.38]] : [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, -1],
        D9 ? 0xb9d3a2 : kind === 'strip' ? 0xeceeec : 0xe6e0cd); };
    const RS = [0.78, 0.92];
    const ys = [...new Set([0, DY, CY, ...RS, ...ops.flatMap(g => [g.sill ?? 0, g.dh ?? 2.6])])].filter(y => y >= 0 && y <= CY).sort((p, q) => p - q), bands = [];
    for (let i = 0; i + 1 < ys.length; i++) { const y0 = ys[i], y1 = ys[i + 1], ym = (y0 + y1) / 2; if (y1 - y0 < 0.004) continue;
      const kind = ym > RS[0] && ym < RS[1] ? 'strip' : ym < DY ? 'corDadoS' : 'corWallS', sk = ops.filter(g => (g.sill ?? 0) <= ym && Math.min(g.dh ?? 2.6, CY) >= ym).map(g => [g.c - g.w / 2, g.c + g.w / 2]);
      if (ym < DY) sk.push([k0 + 0.15, k1]);
      sk.sort((p, q) => p[0] - q[0]); const key = kind + JSON.stringify(sk), last = bands[bands.length - 1];
      if (last && last.key === key && Math.abs(last.y1 - y0) < 1e-6) last.y1 = y1; else bands.push({ key, kind, sk, y0, y1 }); }
    for (const { kind, sk, y0, y1 } of bands) { let a = X0;
      for (const [u, v] of [...sk, [X1, X1]]) { if (Math.min(u, X1) - a > 0.01) skinQ(kind, a, Math.min(u, X1), y0, y1); a = Math.max(a, v); } }
    const sk = cGaps.filter(g => g.c > k0 && g.c < k1).map(g => [g.c - g.w/2, g.c + g.w/2]).sort((a, b) => a[0] - b[0]);
    let a = k0 + 0.15; for (const [u, v] of [...sk, [k1, k1]]) { if (u - a > 0.2) patWall('mural', 'x', a, u, 0.02, 1.08, zCor - 0.162, -1); a = v; }

    const WF = zCor - 0.15, CLO = 24.8;
    const dsk = [...cGaps.map(g => [g.c - g.w / 2 - (g.tf ? 0.06 : 0), g.c + g.w / 2 + (g.tf ? 0.06 : 0)]), [HX0 + 0.15, HX1 - 0.15], [CLO - 0.47, CLO + 0.47], [KSHX - 0.33, KSHX + 0.33]].sort((p, q) => p[0] - q[0]);
    const runs = []; let u0 = X0; for (const [u, v] of [...dsk, [X1, X1]]) { if (u - u0 > 0.3) runs.push([u0, Math.min(u, X1)]); u0 = Math.max(u0, v); }
    runs.forEach(([u, v]) => { const c = (u + v) / 2, L = v - u;
      dBox(L, 0.05, 0.04, 0x7a5a42, c, 1.05, WF - 0.02);
      if (L < 0.5) return;
      dRod(u + 0.08, 0.86, WF - 0.028, v - 0.08, 0.86, WF - 0.028, 0.024, 0x9a6440); });
    [...corWins(), ...offWins].forEach(g => dBox(g.w, 0.03, 0.1, 0x7a5a42, g.c, 1.1, zCor - 0.15));

    TDOOR.forEach(([c, , nm, fg]) => { [-1, 1].forEach(s => dBox(0.05, 2.6, 0.04, 0xe2e6ea, c + s * 0.475, 0, WF - 0.02)); dBox(1.0, 0.05, 0.04, 0xe2e6ea, c, 2.6, WF - 0.02);
      sign(nm, c, 2.82, WF - 0.02, Math.PI, 0.13, { bg: '#ffffff', fg }); });
    [19.05, 22.9].forEach(x => { const s9 = sign('화장실', x, 2.78, zCor, Math.PI / 2, 0.24, { bg: '#ffffff', fg: '#2f6fd0' }); s9.m.position.z = zCor - (s9.w / 2 + 0.17); s9.m.updateMatrix(); });

    FR.rooms.filter(r => twoDoor(r) && r.span[0] >= LOB_X0 - 0.01 && !DOORCOL[r.name]).forEach(r => [{ c: r.span[0] + 1.9, w: 1.2 }, backDoor(r)].forEach(g => {
      const q = (a, b, y0, y1, z, tint) => patPush('cflat', [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]], [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, -1], tint);
      q(g.c - g.w / 2 - 0.05, g.c + g.w / 2 + 0.05, 2.63, 3.07, zCor - 0.16, 0x6a4c36);
      q(g.c - g.w / 2 + 0.02, g.c + g.w / 2 - 0.02, 2.69, 3.01, zCor - 0.164, 0xb4c3ca); }));
    frameBoard('x', 20.3, 21.4, WF, -1, 1.2, 2.2, 0x8fb4e0, 'kidsArt');
    frameBoard('x', 15.3, 16.9, WF, -1, 1.15, 2.3, 0x4f86c6, 'photoB');

    dBox(0.9, 2.1, 0.04, 0xf0f0ec, CLO, 0, WF - 0.02); dBox(0.13, 0.03, 0.05, 0x9a9ea3, CLO + 0.3, 1.0, WF - 0.065);
    patPush('cflat', [[CLO - 0.43, 0.02, WF - 0.044], [CLO + 0.43, 0.02, WF - 0.044], [CLO + 0.43, 2.08, WF - 0.044], [CLO - 0.43, 2.08, WF - 0.044]], [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, -1], 0xf4f4f0);
    { const cd = FR.rooms.find(r => r.type === 'computer').span[0] + 1.9; dBox(0.07, 0.2, 0.03, 0x1e1e22, cd + 0.72, 1.14, WF - 0.015); }
  }
  lockerBank('x', LOB_X + 0.2, STX0 - 0.3, fz0 + 0.15, 1, 0.85, 2, null, 0xd2bc98, 0xeadabb, true);

  wallX(fx0 + 0.15, LOB_X0 + 0.15, KBZ, INNER);

  const KDECO = [[[0.42, 1.16, 0.36, 0.34, 0x8cc06a], [0.42, 0.83, 0.06, 0.33, 0x8a5a36], [0.22, 0.42, 0.12, 0.26, 0xf0a0a8], [0.62, 1.86, 0.26, 0.1, 0xd4e0ea]],
    [[0.32, 1.78, 0.17, 0.22, 0xe8a0c8], [0.32, 1.6, 0.07, 0.07, 0x8a5a36], [0.4, 0.66, 0.36, 0.36, 0xc87a28], [0.4, 0.66, 0.26, 0.26, 0xf0b848], [0.7, 1.42, 0.1, 0.13, 0xe86a6a], [0.58, 1.55, 0.1, 0.13, 0x6aa8e8], [0.62, 1.95, 0.26, 0.1, 0xd4e0ea]]];
  wallZ(KBZ, zCor, LOB_X0, INNER, { gaps: [{ c: (KBZ + zCor) / 2, w: 1.8, door: true, swing: { n: -1, leaves: [0.9, 0.9], look: 'frost', deco: KDECO } }] });
  sign('우리초등학교병설유치원', LOB_X0 + 0.22, 2.75, (KBZ + zCor) / 2, Math.PI / 2, 0.22, { bg: '#f4f4f0', fg: '#4a2d6e' });
  sign('원무실', LOB_X0 + 0.2, 2.42, (KBZ + zCor) / 2 - 1.05, Math.PI / 2, 0.12, { bg: '#f2f2ee', fg: '#333333' });
  objScope('umbrella', () => { dBox(0.4, 0.5, 0.3, 0x222222, LOB_X0 + 0.37, 0, -34.9); colliders.push(noStand({ x0: LOB_X0 + 0.17, x1: LOB_X0 + 0.57, y0: 0, y1: 0.5, z0: -35.05, z1: -34.75 })); });
  {

    const cx0 = LOB_X0 + 0.15, cx1 = fx1 - 0.15, zN = fz0 + 0.15, zS = zCor - 0.15, zW0 = zN + 0.4, zW1 = zS - 0.4, T = (zW1 - zW0) / 3, S = 2 * T, za = zW0 + T, zb = zW0 + 2 * T;
    addPanel(cx1 - cx0, zW0 - zN, 0x243029, (cx0 + cx1)/2, 0.012, (zN + zW0)/2);
    addPanel(cx1 - cx0, zS - zW1, 0x243029, (cx0 + cx1)/2, 0.012, (zW1 + zS)/2);
    const fq = (x0, x1, z0, z1, tint = 0xffffff, tact = false) => patPush(tact ? 'tactX' : 'tileW', [[x0, 0.012, z0], [x1, 0.012, z0], [x1, 0.012, z1], [x0, 0.012, z1]],
      tact ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[x0 / S, -(z0 - zW0) / S], [x1 / S, -(z0 - zW0) / S], [x1 / S, -(z1 - zW0) / S], [x0 / S, -(z1 - zW0) / S]], [0, 1, 0], tint);
    const row = (z0, z1, spec) => { let x = cx0;
      for (const k of [...spec.keys()].sort((p, q) => p - q)) { const a = k * T, b = (k + 1) * T; if (a < cx0 || b > cx1) continue;
        if (a - x > 0.005) fq(x, a, z0, z1); const t9 = spec.get(k); t9 === 'tact' ? fq(a, b, z0, z1, 0xd8cca8, true) : fq(a, b, z0, z1, t9); x = b; }
      if (cx1 - x > 0.005) fq(x, cx1, z0, z1); };
    const side = new Map([[Math.round(33.8 / T), 0x6a6d72]]), mid = new Map(side);
    for (let k = Math.ceil(cx0 / T); (k + 1) * T <= cx1; k++) if (((k % 5) + 5) % 5 === 0 && !mid.has(k)) mid.set(k, 0xc49c84);
    TDOOR.forEach(([c]) => mid.set(Math.floor(c / T), 'tact'));
    const sideS = new Map(side);
    FR.rooms.filter(r => r.name === '행정실' || r.name === '교장실' || r.name === '교무실').forEach(r => sideS.set(Math.floor((r.span[0] + 1.9) / T), 'tact'));
    const sideN = new Map(side); [B.kitchen.exitC, B.kitchen.doorC].forEach(c => sideN.set(Math.floor(c / T), 'tact'));
    row(zW0, za, sideN); row(za, zb, mid); row(zb, zW1, sideS);
    floorQ('tileW', LOB_X0 + 0.15, LOB_X - 0.15, LOB_Z + 0.15, zN);
    floorQ('tileW', fx0 + 0.15, LOB_X0 + 0.15, VZ[0] + 0.15, KBZ - 0.15);
    for (let x9 = LOB_X0 + 2.0; x9 <= fx1 - 1; x9 += 3.6) x9 > CL.x[1] + 1
      ? lamp(0.56, 0.05, 0.56, x9, FH - 0.21, Math.round(((fz0 + zCor) / 2 - 0.3) / 0.6) * 0.6 + 0.3) : lamp(0.62, 0.05, 0.3, x9, FH - 0.21, (fz0 + zCor) / 2);
  }
  {
    const [bx0, bx1] = EN.x, [bz0, bz1] = EN.z, [rx0, rx1] = RC.x, rzg = RC.z[0];
    const DKW = (w, h, d, cx, y, cz) => addBox(w, h, d, DKWOOD, cx, y, cz);

    Object.assign(PATDEF, {
      hallAt: [1, 512, false, (g, N, R) => {
        for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = (i + j) % 2 ? '#8e5a4e' : '#e8dfcf'; g.fillRect(i*16, j*16, 16, 16); }
        g.fillStyle = '#2f6e4f'; g.fillRect(256, 0, 256, 256);
        g.fillStyle = '#e3edc0'; g.fillRect(272, 58, 224, 182); [[296, 30], [344, 22], [392, 26], [440, 20], [478, 32]].forEach(([x, r]) => { g.beginPath(); g.arc(x, 60, r, Math.PI, 0); g.fill(); });
        g.fillStyle = '#6f9a4f'; g.fillRect(330, 50, 108, 14);
        for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { g.fillStyle = pick(['#5a5e62', '#63676a', '#54585c', '#6d6a5e', '#4f5a60'], R); g.fillRect(286 + i*41, 78 + j*40, 34, 31); g.fillStyle = 'rgba(230,236,240,0.35)'; g.fillRect(289 + i*41, 81 + j*40, 28, 9); }
        g.fillStyle = '#d7a268'; g.fillRect(0, 256, 256, 256);
        for (let k = 0; k < 26; k++) { g.fillStyle = pick(['rgba(150,96,48,0.25)', 'rgba(222,170,110,0.3)'], R); g.fillRect(16 + R()*224, 256, 1 + R()*2, 256); }
        g.fillStyle = '#5a3a22'; g.fillRect(0, 256, 256, 19); g.fillRect(0, 493, 256, 19); g.fillRect(0, 256, 19, 256); g.fillRect(237, 256, 19, 256);
        g.fillStyle = '#e8eaec'; g.fillRect(100, 290, 56, 20); g.strokeStyle = '#9aa0a6'; g.lineWidth = 2; g.strokeRect(100, 290, 56, 20);
        g.fillStyle = '#9aa0a6'; g.beginPath(); g.arc(206, 392, 13, 0, 7); g.fill(); g.fillStyle = '#dfe3e6'; g.beginPath(); g.arc(204, 389, 9, 0, 7); g.fill();
        g.fillStyle = '#b27a4c'; g.fillRect(256, 256, 256, 256);
        for (let k = 0; k < 30; k++) { g.fillStyle = pick(['rgba(120,66,32,0.25)', 'rgba(214,150,96,0.25)'], R); g.fillRect(272 + R()*224, 256, 1 + R()*3, 256); }
        g.fillStyle = '#4a2a18'; g.fillRect(256, 256, 256, 19); g.fillRect(256, 493, 256, 19); g.fillRect(256, 256, 19, 256); g.fillRect(493, 256, 19, 256);
        g.fillStyle = '#6b7075'; g.fillRect(290, 296, 22, 62); g.fillStyle = '#e2e6ea'; g.fillRect(290, 298, 17, 58); g.fillStyle = '#a4aab0'; g.fillRect(301, 302, 4, 50);
        [0.2, 0.56, 0.9].forEach(t => { const y = 496 - t * 224 - 5; g.fillStyle = '#80878d'; g.fillRect(360, y, 62, 10); g.fillStyle = '#c9ced2'; g.fillRect(363, y + 2, 56, 6); }); }],
    });

    const atQ = (k, pts, n, uv = [0, 1, 0, 1]) => { const ox = (k % 2) * 0.5, oy = k < 2 ? 0.5 : 0, p = 16 / 512, s = 224 / 512, U = t => ox + p + t * s, V = t => oy + p + t * s;
      patPush('hallAt', pts, [[U(uv[0]), V(uv[2])], [U(uv[1]), V(uv[2])], [U(uv[1]), V(uv[3])], [U(uv[0]), V(uv[3])]], n, 0xffffff); };

    const WZ0 = rzg + 0.15, WZ1 = bz1 - 0.65, WS = 0.15, WH = 2.8, wc = (WZ0 + WZ1)/2, ww = WZ1 - WZ0;
    const sideWall = (xo, xi, f) => {
      const xm = (xo + xi)/2, th = Math.abs(xo - xi);
      DKW(th, FH, WZ0 - bz0, xm, 0, (bz0 + WZ0)/2);
      DKW(th, FH, bz1 - WZ1, xm, 0, (WZ1 + bz1)/2);
      DKW(th, WS, ww, xm, 0, wc); DKW(th, FH - WH, ww, xm, WH, wc);
      glassPane('z', ww, WH - WS, wc, WS, xm);
      const fb = (z0, z1, y0, y1) => dBox(0.2, y1 - y0, z1 - z0, 0x9aa0a6, xm, y0, (z0 + z1)/2);
      fb(WZ0, WZ0 + 0.06, WS, WH); fb(WZ1 - 0.06, WZ1, WS, WH); fb(WZ0 + 0.06, WZ1 - 0.06, WH - 0.06, WH); fb(WZ0 + 0.06, WZ1 - 0.06, WS, WS + 0.06);
      fb(WZ0 + 0.06, WZ1 - 0.06, 1.75, 1.81);
      dBox(0.04, 1.75 - WS - 0.06, ww - 0.12, 0xdce5ea, xm, WS + 0.06, wc);
      dBox(0.03, WH - WS, 0.06, BLUE, xo + f*0.015, WS, WZ0 - 0.03);
      [[xo, f], [xi, -f]].forEach(([xx, ff]) => {
        patWall('woodP', 'z', xx === xo ? bz0 + 0.2 : bz1 - 2.6, WZ0, 0, FH, xx + ff*0.012, ff); patWall('woodP', 'z', WZ1, bz1, 0, FH, xx + ff*0.012, ff);
        patWall('woodP', 'z', WZ0, WZ1, 0, WS, xx + ff*0.012, ff); patWall('woodP', 'z', WZ0, WZ1, WH, FH, xx + ff*0.012, ff);
      });
      dBox(0.06, 0.1, bz1 - bz0 - 0.5, BLUE, xo + f*0.03, FH + 0.2, (bz0 + 0.5 + bz1)/2);
    };
    sideWall(bx0, rx0, -1); sideWall(bx1, rx1, 1);
    [[bx0, rx0], [rx1, bx1]].forEach(([a, b]) => patWall('woodP', 'x', a, b, 0, FH, bz1 + 0.012, 1));
    addBox(rx1 - rx0, FH - 2.9, 0.3, DKWOOD, (rx0 + rx1)/2, 2.9, bz1 - 0.15);
    patWall('woodP', 'x', rx0, rx1, 2.9, FH, bz1 + 0.012, 1);
    patQuad('cwood', rx0, rx1, rzg + 0.15, bz1 - 0.3, 2.9, true);
    colliders.push({ x0: rx0, x1: rx1, y0: 2.9, y1: FH, z0: rzg + 0.15, z1: bz1 - 0.3 });
    lamp(0.22, 0.04, 0.22, (rx0 + rx1)/2 - 0.9, 2.86, (rzg + bz1)/2); lamp(0.22, 0.04, 0.22, (rx0 + rx1)/2 + 0.9, 2.86, (rzg + bz1)/2);
    addBox(bx1 - bx0, 0.3, bz1 - bz0, 0x2f2a26, (bx0 + bx1)/2, FH, (bz0 + bz1)/2);
    dBox(bx1 - bx0 - 0.16, 0.03, bz1 - 0.08 - RC.z[0], 0xdcdedb, (bx0 + bx1)/2, FH + 0.3, (RC.z[0] + bz1 - 0.08)/2, { far: true });
    dBox(bx1 - bx0 - 0.16, 0.03, RC.z[0] - bz0 - 0.08, 0x2f8a68, (bx0 + bx1)/2, FH + 0.3, (bz0 + 0.08 + RC.z[0])/2, { far: true });
    dBox(bx1 - bx0 + 0.12, 0.1, 0.06, BLUE, (bx0 + bx1)/2, FH + 0.2, bz1 + 0.03);

    floorQ('gmat', rx0, rx1, rzg + 0.15, bz1 - 0.4);
    addBox(rx1 - rx0, -0.15 - YARD, 0.4, DKWOOD, (rx0 + rx1)/2, YARD, bz1 - 0.2);
    patQuad('gmat', rx0, rx1, bz1 - 0.4, bz1, -0.15 + 0.012);
    dBox(rx1 - rx0 - 0.06, 0.14, 0.03, DKWOOD, (rx0 + rx1)/2, -0.15, bz1 - 0.385);

    [[rx0, 1], [rx1, -1]].forEach(([wall, f]) => objScope('locker', () => {
      const a0 = rzg + 0.2, a1 = rzg + 2.2, D = 0.45, H = 1.75, n = 6, cw = (a1 - a0) / n, rh = (H - 0.1) / 2, fx = wall + f * (D + 0.005);
      colliders.push(noStand({ x0: Math.min(wall, wall + f * D), x1: Math.max(wall, wall + f * D), y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, H, a1 - a0, 0x8a5236, wall + f * D / 2, 0, (a0 + a1) / 2);
      for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) { const z0 = a0 + cw * i, z1 = z0 + cw, y0 = 0.08 + rh * r, y1 = y0 + rh;
        atQ(3, [[fx, y0, z0], [fx, y0, z1], [fx, y1, z1], [fx, y1, z0]], [f, 0, 0], f > 0 ? [1, 0, 0, 1] : [0, 1, 0, 1]); }
    }));

    wallX(rx0, rx1, rzg, DKWOOD, { h: FH, inner: true, face: 1, gaps: [{ c: hc, w: 1.7, glass: true, door: true, dh: 2.5, slideOver: true }, { c: (rx0 + hc - 1.0)/2, w: hc - 1.0 - rx0, sill: 0, dh: 2.5, win: true, frame: 0xc9ced3 }, { c: (hc + 1.0 + rx1)/2, w: rx1 - hc - 1.0, sill: 0, dh: 2.5, win: true, frame: 0xc9ced3 }] });
    dBox(rx1 - rx0 - 0.04, 0.25, 0.05, 0xc9ced3, hc, 2.5, rzg + 0.175);
    sign('우리학교 방문을 환영합니다', hc, 2.625, rzg + 0.215, 0, 0.16, { bg: '#f3e6ef', fg: '#4a5a9a' });
    sign('CCTV 작동중', hc + 1.25, 2.625, rzg + 0.215, 0, 0.07, { bg: '#ffffff', fg: '#c0392b' });

    [[rx0, hc - 1.0, 1], [hc + 1.0, rx1, -1]].forEach(([a9, b9, sd]) => {
      const c9 = (a9 + b9) / 2, w9 = b9 - a9 - 0.14, pl = new THREE.PlaneGeometry(w9, 2.36);
      dGeo(pl, new THREE.Matrix4().makeTranslation(c9, 1.25, rzg + 0.004), 0xdbe4e1); dGeo(pl, new THREE.Matrix4().makeTranslation(c9, 1.25, rzg - 0.004).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), 0xd3dcd9); pl.dispose();
      [[0.52, 0.035, c9 + sd * 0.3, 1.55, sd > 0 ? 1.7 : -0.46, 1.9, 16], [0.13, 0.025, c9 - sd * 0.08, 0.5, 0, 6.3, 12], [0.07, 0.02, c9 - sd * 0.08, 0.5, 0, 6.3, 10], [0.1, 0.022, c9 + sd * 0.12, 0.95, 0, 6.3, 10]].forEach(([r9, t9, x9, y9, th0, thl, sg]) => {
        const rg = new THREE.RingGeometry(r9 - t9, r9, sg, 1, th0, thl); dGeo(rg, new THREE.Matrix4().makeTranslation(x9, y9, rzg + 0.01), 0xf6f8f7, { flat: true }); rg.dispose(); });
    });

    wallX(HX0 + 0.15, HX1 - 0.15, EZI, INNER, { gaps: [{ c: hc, w: 1.8, glass: true, door: true, slideOver: true }, { c: (HX0 + 0.15 + hc - 1.05)/2, w: hc - 1.05 - HX0 - 0.15, sill: 0, dh: 2.6, win: true, frame: 0xc9ced3 }, { c: (hc + 1.05 + HX1 - 0.15)/2, w: HX1 - 0.15 - hc - 1.05, sill: 0, dh: 2.6, win: true, frame: 0xc9ced3 }] });
    dBox(rx1 - rx0 - 0.04, 0.2, 0.03, 0xc9ced3, hc, 2.6, EZI + 0.165);
    sign('외부인출입금지', hc + 1.5, 1.08, EZI + 0.112, 0, 0.1, { bg: '#ffffff', fg: '#c0392b' });
    sign('자동문', hc + 1.5, 0.9, EZI + 0.112, 0, 0.07, { bg: '#f2c230', fg: '#2f5fa0' });
    floorQ('gmat', rx0, rx1, EZI + 0.15, rzg - 0.15, 0, 0x8a8580);
    { const mx0 = rx0 + 0.12, mx1 = rx1 - 0.12, mz0 = EZI + 0.27, mz1 = rzg - 0.27, T9 = 1.12;
      for (let x9 = mx0; x9 < mx1 - 0.01; x9 += T9) { const x1 = Math.min(mx1, x9 + T9);
        atQ(0, [[x9, 0.024, mz1], [x1, 0.024, mz1], [x1, 0.024, mz0], [x9, 0.024, mz0]], [0, 1, 0], [0, (x1 - x9) / T9, 0, (mz1 - mz0) / T9]); } }

    patQuad('pave', bx0, bx1, bz1, SCHOOL.frontYard.walkN, YARD + 0.02);
    patQuad('rmat', hc - 1.2, hc + 1.2, bz1 + 0.02, bz1 + 1.1, YARD + 0.032);
    objScope('umbrella', () => addBox(0.4, 0.55, 0.3, YEL, bx0 + 0.3, YARD, bz1 + 0.35, NS));
    zones.push({ x0: rx0, x1: rx1, z0: rzg, z1: bz1, y: 0, label: '현관 앞' });
    zones.push({ x0: rx0, x1: rx1, z0: fz1, z1: rzg, y: 0, label: '현관 전실', extra: true });
    hotspots.push({ kind: 'shoes', x: hc, z: rzg + 1.3, y: 0, r: 1.2, label: '실내화로 갈아신기' });
  }
  {
    const hx0 = HX0 + 0.15, hx1 = HX1 - 0.15, hz0 = zCor + 0.15, hz1 = EZI - 0.15, hzm = (hz0 + hz1) / 2;
    const atQ = (k, pts, n, uv = [0, 1, 0, 1]) => { const ox = (k % 2) * 0.5, oy = k < 2 ? 0.5 : 0, p = 16 / 512, s = 224 / 512, U = t => ox + p + t * s, V = t => oy + p + t * s;
      patPush('hallAt', pts, [[U(uv[0]), V(uv[2])], [U(uv[1]), V(uv[2])], [U(uv[1]), V(uv[3])], [U(uv[0]), V(uv[3])]], n, 0xffffff); };

    const rbx = (w, h, d, hex, cx, y0, cz, ry) => dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(cx, y0 + h / 2, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(w, h, d)), hex);

    const SHZ = hz1 - 2.5;
    floorQ('tileC', hx0, hx1, hz0, SHZ); addPanel(hx1 - hx0, hz1 - SHZ, 0xa59f90, hc, 0.012, (SHZ + hz1) / 2);
    dBox(hx1 - hx0 - 0.02, 0.03, 0.03, 0xb9b7b0, hc, -0.012, SHZ);
    compassRose(hc, 0.018, hz0 + 3.0, 0.4);

    objScope('cab', () => {
    addBox(0.45, 0.85, 2.0, 0x5a4636, hx0 + 0.225, 0, hz0 + 1.1, NS);
    for (let k = 0; k < 4; k++) { const z9 = hz0 + 0.35 + k * 0.5;
      dBox(0.03, 0.7, 0.47, 0x654f3e, hx0 + 0.465, 0.08, z9);
      dBox(0.03, 0.04, 0.04, 0xc8ccd0, hx0 + 0.495, 0.66, z9 + (k % 2 ? -0.18 : 0.18)); }
    dBox(0.22, 0.2, 0.25, 0xc8342c, hx0 + 0.2, 0.85, hz0 + 0.45); dBox(0.12, 0.1, 0.22, 0x9fd06a, hx0 + 0.2, 0.85, hz0 + 0.9); });
    const palm = (x, y, z, s, pot) => {
      dBox(0.2*s, 0.18*s, 0.2*s, pot, x, y, z); dBox(0.24*s, 0.04*s, 0.24*s, pot, x, y + 0.18*s, z);
      dCyl(0.015*s, 0.02*s, 0.4*s, 0x6d4e32, x, y + 0.22*s, z, { seg: 4 });
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + hash2(x, z) * 3, len = (0.34 + (i % 2) * 0.08) * s;
        dGeo(BLOB0, new THREE.Matrix4().makeTranslation(x, y + 0.6*s, z).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeRotationX(-0.5 - (i % 2) * 0.25))
          .multiply(new THREE.Matrix4().makeTranslation(0, 0, len * 0.5)).multiply(new THREE.Matrix4().makeScale(0.08*s, 0.02*s, len * 0.5)), i % 2 ? 0x5fa052 : 0x4f8f47, { jitter: 0.15 }); } };
    const sprig = (x, y, z, s, pot) => { dBox(0.16*s, 0.14*s, 0.16*s, pot, x, y, z); dBlob(0.11*s, 0.1*s, 0.11*s, [0x4f8f47, 0x5fa052, 0x6aae5a][Math.floor(hash2(x, z) * 3)], x, y + 0.22*s, z, { chunky: true, ry: x * 7, jitter: 0.22 }); };
    const woodFrameBoard = (wx, f, z0, z1, y0, y1) => {
      const zc = (z0 + z1) / 2, L = z1 - z0, T = 0.06;
      dBox(0.03, y1 - y0 - 2*T, L - 2*T, 0xd8cdb8, wx + f*0.015, y0 + T, zc);
      dBox(0.045, T, L, DKWOOD, wx + f*0.0225, y0, zc); dBox(0.045, T, L, DKWOOD, wx + f*0.0225, y1 - T, zc);
      [z0 + T/2, z1 - T/2].forEach(z9 => dBox(0.045, y1 - y0 - 2*T, T, DKWOOD, wx + f*0.0225, y0 + T, z9));
    };
    woodFrameBoard(hx0, 1, hz0 + 0.3, hz0 + 1.9, 1.1, 2.4);
    [[1.85, hz0 + 0.75], [1.62, hz0 + 1.35]].forEach(([y9, z9]) => { dBox(0.03, 0.12, 0.3, 0xf2c230, hx0 + 0.045, y9, z9); dBox(0.03, 0.03, 0.3, 0x2a2a2a, hx0 + 0.045, y9 + 0.12, z9); });

    const wCase = (a0, a1) => objScope('case', () => {
      const D = 0.55, H = 0.95, L = a1 - a0, c = (a0 + a1) / 2, xm = hx0 + D / 2;
      colliders.push(noStand({ x0: hx0, x1: hx0 + D, y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, 0.2, L, 0x3f3228, xm, 0, c); dBox(D, 0.05, L, 0x5a4636, xm, H - 0.05, c);
      [a0 + 0.03, a1 - 0.03].forEach(e => dBox(D, H - 0.25, 0.06, 0x5a4636, xm, 0.2, e));
      dBox(D - 0.08, 0.03, L - 0.14, 0xcfdde2, xm - 0.02, 0.56, c);
      for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*0.02 + hx0 + D - 0.03, bpos.getY(i)*(H - 0.25) + 0.2 + (H - 0.25)/2, bpos.getZ(i)*(L - 0.12) + c);
      [0.2, 0.59].forEach((y9, r9) => { for (let a = a0 + 0.24; a < a1 - 0.18; a += 0.36) dBox(0.2, 0.03, 0.26, (Math.floor((a - a0) / 0.36) + r9) % 2 ? 0xe8e2d6 : 0xd9d2c2, hx0 + 0.27 + ((r9 + Math.floor(a * 3)) % 2) * 0.06, y9, a); });
      dBox(0.24, 0.06, L - 0.1, 0xf0f0ec, hx0 + 0.27, H, c);
      for (let a = a0 + 0.2; a < a1 - 0.12; a += 0.3) sprig(hx0 + 0.27, H + 0.06, a, 0.9 + hash2(a, 1)*0.3, hash2(a, 3) > 0.6 ? 0xd9d6ce : 0xc46a4a);
    });
    { const a = hz0 + 2.2, b = hz1 - 0.9, L3 = (b - a - 0.1) / 3; for (let k = 0; k < 3; k++) wCase(a + k * (L3 + 0.05), a + k * (L3 + 0.05) + L3); }

    { const a = hz0 + 2.3, b = hz1 - 0.4, c = (a + b) / 2, L = b - a, PW = (L - 0.4) / 3;
      dBox(0.04, 1.4, L, 0x2f6e4f, hx0 + 0.02, 1.0, c);
      for (let k = 0; k < 3; k++) { const pc = a + 0.1 + PW / 2 + k * (PW + 0.1), q0 = pc - PW / 2 - 0.05, q1 = pc + PW / 2 + 0.05, X9 = hx0 + 0.045;
        atQ(1, [[X9, 1.03, q0], [X9, 1.03, q1], [X9, 2.12, q1], [X9, 2.12, q0]], [1, 0, 0], [1, 0, 0, 1]); }
      sign('서로 돕고 함께 자라는 우리', hx0 + 0.08, 2.24, c, Math.PI / 2, 0.12, { bg: '#e8efd6', fg: '#3a5a3a' }); }

    { const zc = hz1 - 0.37, xm = hx0 + 0.175;
      objScope('shelf', () => {
      colliders.push(noStand({ x0: hx0, x1: hx0 + 0.35, y0: 0, y1: 0.9, z0: zc - 0.3, z1: zc + 0.3 }));
      [zc - 0.285, zc + 0.285].forEach(z9 => dBox(0.35, 0.9, 0.03, 0xd2a86a, xm, 0, z9));
      dBox(0.03, 0.88, 0.54, 0xc29a5e, hx0 + 0.015, 0.01, zc);
      [0.02, 0.32, 0.62, 0.87].forEach(y9 => dBox(0.32, 0.03, 0.54, 0xd2a86a, xm + 0.015, y9, zc));
      [0.05, 0.35].forEach((y9, r9) => { for (let k = 0; k < 3; k++) dBox(0.04, 0.22, 0.14, [0x5b8fc9, 0xf2d15c, 0xe0708a, 0x3fa37a][(k + r9) % 4], hx0 + 0.12 + k * 0.05, y9, zc - 0.17 + k * 0.17); });
      potPlant(xm, 0.9, zc, 1.0, false, 0xf2f2ee);
      dBlob(0.16, 0.22, 0.12, 0x5fa052, xm + 0.1, 0.78, zc + 0.08, { chunky: true, jitter: 0.2 }); });
      const bx = hx0 + 0.78, bz = hz1 - 0.62, ry = 2.0, fx = Math.sin(ry), fz = Math.cos(ry);
      rbx(0.65, 0.95, 0.05, 0xf4f1e6, bx, 0.12, bz, ry);
      [-0.27, 0.27].forEach(o => rbx(0.04, 0.12, 0.04, 0x6b6f75, bx + Math.cos(ry) * o, 0, bz - Math.sin(ry) * o, ry));
      [[0x9fd06a, 0.62, 0.12], [0xf2c230, 0.24, 0.3], [0x9cc3e0, 0.24, 0.3]].forEach(([col, w9, h9], k) => rbx(w9, h9, 0.02, col, bx + fx * 0.035 + Math.cos(ry) * (k ? (k === 1 ? -0.15 : 0.15) : 0), k ? 0.25 : 0.62, bz + fz * 0.035 - Math.sin(ry) * (k ? (k === 1 ? -0.15 : 0.15) : 0), ry));
      sign('우리 학교에 오신 것을', bx + fx * 0.05, 0.86, bz + fz * 0.05, ry, 0.055, { bg: '#f4f1e6', fg: '#3a6a3a' });
      sign('환영합니다', bx + fx * 0.05, 0.79, bz + fz * 0.05, ry, 0.06, { bg: '#f4f1e6', fg: '#d0503a' });
      colliders.push(noStand({ x0: bx - 0.25, x1: bx + 0.25, y0: 0, y1: 1.07, z0: bz - 0.25, z1: bz + 0.25 }));
      hotspots.push({ kind: 'map', x: hx0 + 1.4, z: hz1 - 0.9, y: 0, r: 1.0, label: '학교 안내도 보기', at: [bx, 0.8, bz] }); }

    objScope('locker', () => { const a0 = hz1 - 2.8, a1 = hz1 - 0.15, D = 0.45, H = 1.05, L = a1 - a0, c = (a0 + a1) / 2, n = Math.round(L / 0.32), cw = L / n, rh = (H - 0.1) / 3;
      colliders.push(noStand({ x0: hx1 - D, x1: hx1, y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, H, L, 0xc08a50, hx1 - D / 2, 0, c);
      { const fx = hx1 - D - 0.005;
        for (let i = 0; i < n; i++) for (let r = 0; r < 3; r++) { const z0 = a0 + cw * i, z1 = z0 + cw, y0 = 0.08 + rh * r, y1 = y0 + rh;
          atQ(2, [[fx, y0, z0], [fx, y0, z1], [fx, y1, z1], [fx, y1, z0]], [-1, 0, 0]); } }
      dBox(D + 0.02, 0.03, L + 0.04, 0x2b2b2b, hx1 - (D + 0.02) / 2, H, c);
      [0xf2f2ee, 0xf2f2ee, 0xc8342c, 0xf2f2ee, 0x2f3a55].forEach((col, k) => k === 4 ? sprig(hx1 - 0.22, H + 0.03, a0 + 0.3 + k * 0.52, 1.4, col) : palm(hx1 - 0.22, H + 0.03, a0 + 0.3 + k * 0.52, 1.25, col)); });
    objScope('case', () => { const a0 = hz0 + 2.05, a1 = hz1 - 2.95, D = 0.55, H = 0.95, L = a1 - a0, c = (a0 + a1) / 2, xm = hx1 - D / 2;
      colliders.push(noStand({ x0: hx1 - D, x1: hx1, y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, 0.2, L, 0x8a6a45, xm, 0, c); dBox(D, 0.05, L, 0xa07c52, xm, H - 0.05, c);
      [a0 + 0.03, a1 - 0.03].forEach(e => dBox(D, H - 0.25, 0.06, 0xa07c52, xm, 0.2, e));
      for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*0.02 + hx1 - D + 0.03, bpos.getY(i)*(H - 0.25) + 0.2 + (H - 0.25)/2, bpos.getZ(i)*(L - 0.12) + c);
      for (let a = a0 + 0.3; a < a1 - 0.2; a += 0.4) { const k = hash2(a, 5), col = k < 0.5 ? 0xe0b848 : 0xc9ccd0;
        if (k < 0.75) { dCyl(0.05, 0.05, 0.06, 0x8a6a45, hx1 - 0.3, 0.2, a, { seg: 5 }); dCyl(0.08, 0.035, 0.16 + k * 0.1, col, hx1 - 0.3, 0.26, a, { seg: 6 }); }
        else dBox(0.03, 0.22, 0.28, 0xf3ead2, hx1 - 0.22, 0.2, a); }
      for (let a = a0 + 0.2; a < a1 - 0.12; a += 0.34) sprig(hx1 - 0.27, H, a, 0.9 + hash2(a, 1) * 0.3, hash2(a, 3) > 0.6 ? 0xd9d6ce : 0xc46a4a); });
    greenBoard('z', hz0 + 2.0, hz1 - 3.0, hx1, -1, 1.05, 2.35, 'notice');
    [[0.62, 0.9, 1.3, -0.55, true], [0.48, 0.7, 1.45, 0.25, false], [0.4, 0.55, 1.6, 0.85, false]].forEach(([w9, h9, y9, oz, band]) => {
      const z9 = (hz0 + 2.0 + hz1 - 3.0) / 2 + oz; dBox(0.03, h9, w9, 0xf7f5ee, hx1 - 0.065, y9, z9);
      dBox(0.03, 0.08, w9 - 0.08, [0x3b6fb5, 0x2f8f5b, 0xd24b4b][Math.round(y9 * 10) % 3], hx1 - 0.095, y9 + h9 - 0.14, z9);
      if (band) dBox(0.03, h9 - 0.21, 0.1, 0xb58ad0, hx1 - 0.095, y9 + 0.05, z9 + w9 / 2 - 0.09); });

    { const fz = hz0 + 1.17, FL = 1.6;
      objScope('fountain', () => {
      addBox(0.6, 0.8, FL, 0xf2f2ee, hx1 - 0.3, 0, fz, NS);
      dBox(0.03, 0.55, FL - 0.15, 0xa8d08c, hx1 - 0.615, 0.12, fz);
      dBox(0.03, 0.08, 0.3, 0x9aa0a6, hx1 - 0.615, 0.025, fz + FL / 2 - 0.25);
      dBox(0.4, 0.04, FL - 0.15, 0xb9bec4, hx1 - 0.32, 0.8, fz);
      dBox(0.08, 0.38, FL - 0.1, 0xa8d08c, hx1 - 0.05, 0.84, fz);
      for (let k = 0; k < 4; k++) dCyl(0.015, 0.015, 0.1, 0xc8ccd0, hx1 - 0.09, 1.05, fz - 0.525 + k * 0.35, { rot: [0, 0, Math.PI / 2], seg: 6 });
      for (let k = 0; k < 4; k++) dCyl(0.016, 0.022, 0.05, 0xd4d8dc, hx1 - 0.3, 0.84, fz - 0.525 + k * 0.35, { seg: 8 });
      dBox(0.03, 0.08, 0.2, 0x3a6fc0, hx1 - 0.105, 1.08, fz - FL / 2 + 0.2);
      dCyl(0.035, 0.03, 0.09, 0x9fd06a, hx1 - 0.2, 0.84, fz + FL / 2 - 0.2, { seg: 8 }); });
      woodFrameBoard(hx1, -1, hz0 + 0.45, hz0 + 1.9, 1.35, 2.4);
      hotspots.push({ kind: 'water', x: hx1 - 1.0, z: fz, y: 0, r: 1.0, label: '물 마시기', ats: [0, 1, 2, 3].map(k => [hx1 - 0.3, 0.9, fz - 0.525 + k * 0.35]) }); }

    objScope('ext', () => { dBox(0.3, 0.05, 0.3, 0xc8342c, hx1 - 0.55, 0.005, hz0 + 0.18); extinguisher(hx1 - 0.55, 0.055, hz0 + 0.18); });

    [[hx0, 1], [hx1, -1]].forEach(([wx, f]) => {
      patWall('panelB', 'z', hz0 + 0.06, hz1 - 0.06, 2.5, FH - 0.2, wx + f * 0.012, f, 0xf6efe2);
      dBox(0.04, 0.06, hz1 - hz0 - 0.12, DKWOOD, wx + f * 0.02, 2.44, hzm); dBox(0.04, 0.06, hz1 - hz0 - 0.12, DKWOOD, wx + f * 0.02, FH - 0.23, hzm); });

    { const AW = 2.8, AH = 2.25, TOP = 2.95, R9 = 0.4, a0 = hc - AW / 2, a1 = hc + AW / 2;
      [[hx0, a0], [a1, hx1]].forEach(([u, v]) => { dBox(v - u, TOP - 0.005, 0.36, DKWOOD, (u + v) / 2, 0.005, zCor);
        colliders.push({ x0: Math.max(u, hc - 1.66), x1: Math.min(v, hc + 1.66), y0: 0, y1: TOP, z0: zCor - 0.18, z1: zCor + 0.18 }); });
      dBox(AW, TOP - AH, 0.36, DKWOOD, hc, AH, zCor);
      colliders.push({ x0: a0, x1: a1, y0: AH, y1: TOP, z0: zCor - 0.18, z1: zCor + 0.18 });
      [[a0, 1], [a1, -1]].forEach(([x9, sx]) => {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(sx * R9, 0); sh.absarc(sx * R9, -R9, R9, Math.PI / 2, sx > 0 ? Math.PI : 0, sx < 0); sh.lineTo(0, 0);
        const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.36, bevelEnabled: false, curveSegments: 6 }); fg.translate(0, 0, -0.18);
        dGeo(fg, new THREE.Matrix4().makeTranslation(x9, AH, zCor), DKWOOD); fg.dispose(); });
      sign('웃음꽃 피는', hc - 0.78, 2.6, zCor + 0.19, 0, 0.22, { bg: 'none', fg: '#f3e6c8' });
      sign('즐거운학교', hc + 0.78, 2.6, zCor + 0.19, 0, 0.22, { bg: 'none', fg: '#f3e6c8' });
      dCyl(0.16, 0.16, 0.02, 0xf0e8e0, hc, 2.6, zCor + 0.18, { rot: [Math.PI / 2, 0, 0], seg: 16 });
      dCyl(0.07, 0.07, 0.015, 0xe07a9a, hc - 0.04, 2.63, zCor + 0.2, { rot: [Math.PI / 2, 0, 0], seg: 10 });
      dCyl(0.06, 0.06, 0.015, 0x8cc26a, hc + 0.05, 2.56, zCor + 0.2, { rot: [Math.PI / 2, 0, 0], seg: 10 });
      dBlob(0.07, 0.05, 0.07, 0xe8e8e8, hc, 2.86, zCor + 0.22, { chunky: true }); }
    for (let k = 0; k < 3; k++) lamp(1.3, 0.05, 0.08, hc, FH - 0.21, hz0 + 1.2 + k * 2.3);
  }

  const OFLOOR = 0xc4c8e0, OPANEL = 0xeadcc0, LAV = 0xb9b6de, OCH = 0x3f4550;
  const lavChair = objWrap((x, z, f, side = false) => {
    colliders.push(noStand({ x0: x - 0.23, x1: x + 0.23, y0: 0, y1: 0.85, z0: z - 0.23, z1: z + 0.23 }));
    dBox(0.44, 0.05, 0.44, LAV, x, 0.42, z); dBox(0.06, 0.42, 0.06, 0x9a9ea3, x, 0, z);
    side ? dBox(0.04, 0.38, 0.42, LAV, x + f * 0.2, 0.52, z) : dBox(0.42, 0.38, 0.04, LAV, x, 0.52, z + f * 0.2); }, 'chair');
  const seatOf = (x9, z9, dir) => ({ x: x9 - 0.2, z: z9 + 0.62 * dir, face: dir > 0 ? 0 : 2, desk: 0.74, reach: 0.27, chair: true });
  const anthurium = objWrap((x, z) => { dCyl(0.15, 0.12, 0.34, 0x2a2c30, x, 0, z, { seg: 6 }); dBlob(0.32, 0.28, 0.32, 0x2f7a3a, x, 0.62, z, { chunky: true, jitter: 0.2 });
    dBlob(0.1, 0.07, 0.08, 0xd8283a, x + 0.1, 0.82, z + 0.05, { chunky: true });
    colliders.push(noStand({ x0: x - 0.2, x1: x + 0.2, y0: 0, y1: 0.9, z0: z - 0.2, z1: z + 0.2 })); }, 'plant');
  function officeRoom(kind, r) {
    const [s0, s1] = r.span, x0 = s0 + 0.15, x1 = s1 - 0.15, z0 = zCor + 0.15, z1 = fz1 - 0.15, cx = (s0 + s1) / 2, sp = [];
    floorQ('ecor', x0, x1, z0, z1, 0, OFLOOR);
    [[x0, 1], [x1, -1]].forEach(([wx, f]) => patWall('panelB', 'z', z0 + 0.06, z1 - 0.06, 0.9, 2.75, wx + f * 0.012, f, OPANEL));
    const fakeDoor = (wx, f, zc, col) => { dBox(0.04, 2.1, 0.9, col, wx + f * 0.02, 0, zc); dBox(0.05, 0.03, 0.14, 0x9a9ea3, wx + f * 0.065, 1.0, zc + 0.3); };
    if (kind === 'T') {
      fakeDoor(x0, 1, zCor + 0.95, 0xb07a44);

      const CZ0 = zCor + 1.55, CZ1 = CZ0 + 3.6; objScope('cab', () => { addBox(0.45, 2.0, CZ1 - CZ0, 0xc08a3e, x0 + 0.225, 0, (CZ0 + CZ1) / 2, NS);
      dBox(0.03, 0.8, CZ1 - CZ0 - 0.1, 0x9fb7be, x0 + 0.465, 1.08, (CZ0 + CZ1) / 2); });

      const FZ9 = CZ1 + 1.05; dBox(0.03, 0.5, 0.72, 0x5a4632, x0 + 0.015, 2.1, FZ9); sign(FLAG_KEY, x0 + 0.042, 2.35, FZ9, Math.PI / 2, 0.4);
      dBox(0.03, 0.56, 1.7, 0xf4f2ec, x0 + 0.015, 1.27, FZ9);

      const IZ = zCor + 2.3;
      [s0 + 3.7, s0 + 6.5].forEach((ic, n) => {
        [-0.5, 0.5].forEach(o => { officeDesk(ic + o, 0, IZ - 0.38, 0.96, -1, n > 0 || o > 0); officeDesk(ic + o, 0, IZ + 0.38, 0.96, 1, n > 0 || o > 0); });
        objScope('screen', () => { dBox(1.96, 1.2, 0.04, 0xd6d8da, ic, 0, IZ); colliders.push(noStand({ x0: ic - 0.98, x1: ic + 0.98, y0: 0, y1: 1.2, z0: IZ - 0.03, z1: IZ + 0.03 })); });
        [-0.5, 0.5].forEach(o => [[-1, IZ - 0.38], [1, IZ + 0.38]].forEach(([d9, z9]) => sp.push(seatOf(ic + o, z9, d9))));
      });

      { const x9 = x1 - 0.85, z9 = z1 - 1.75; officeDesk(x9, 0, z9, 1.5, 1); sp.unshift(seatOf(x9, z9, 1)); }

      { const tx0 = x0 + 1.05, tx1 = tx0 + 3.6, tz = z1 - 1.65, TC = 0xe8e2a6;
        objScope('table', () => { colliders.push(noStand({ x0: tx0, x1: tx1, y0: 0, y1: 0.72, z0: tz - 0.45, z1: tz + 0.45 }));
        [tx0 + 0.9, tx1 - 0.9].forEach(c9 => dBox(1.8, 0.04, 0.9, TC, c9, 0.7, tz));
        [tx0 + 0.9, tx1 - 0.9].forEach(lx => dBox(0.1, 0.7, 0.5, 0xc8ccd0, lx, 0, tz)); });
        [0.45, 1.35, 2.25, 3.15].forEach(o => { lavChair(tx0 + o, tz - 0.72, -1); lavChair(tx0 + o, tz + 0.72, 1); });
      }

      { const lz = z1 - 0.23, a9 = x1 - 2.4, b9 = x1 - 0.05;
        objScope('cab', () => { addBox(b9 - a9, 0.75, 0.45, 0xe6e6e2, (a9 + b9) / 2, 0, lz, NS);
        dBox(0.5, 0.3, 0.4, 0x5c6066, a9 + 0.45, 0.75, lz); });
        objScope('box', () => addBox(0.4, 0.62, 0.32, 0xeceeee, a9 - 0.3, 0, lz + 0.05, NS));
        anthurium(b9 - 0.45, lz - 0.02); }
      [[cx - 1.6, (zCor + z1) / 2], [cx + 1.6, (zCor + z1) / 2]].forEach(([lx, lz]) => lamp(0.6, 0.05, 1.2, lx, FH - 0.21, lz));
    } else if (kind === 'P') {
      fakeDoor(x1, -1, zCor + 0.95, 0xb07a44);
      { const x9 = cx - 0.45, z9 = z1 - 1.3; objScope('desk', () => { officeDesk(x9, 0, z9, 1.6, 1); dBox(1.66, 0.052, 0.8, 0x7a5232, x9, 0.694, z9); });
        sp.push({ ...seatOf(x9, z9, 1), hiBack: true }); }
      sign(FLAG_KEY, cx - 0.45, 2.35, z1 - 0.02, Math.PI, 0.4); dBox(0.72, 0.5, 0.03, 0x5a4632, cx - 0.45, 2.1, z1 - 0.015);
      const sofa = objWrap((sx, sz, len, f) => { addBox(0.75, 0.42, len, 0x6b4a3c, sx, 0, sz, NS); dBox(0.18, 0.4, len - 0.28, 0x5e4034, sx - f * 0.285, 0.42, sz); [-1, 1].forEach(k => dBox(0.75, 0.2, 0.14, 0x5e4034, sx, 0.42, sz + k * (len / 2 - 0.07))); }, 'sofa');
      sofa(x0 + 0.4, zCor + 2.75, 1.8, 1);
      sofa(x0 + 0.4, z1 - 2.95, 1.0, 1);
      objScope('table', () => addBox(0.8, 0.4, 1.0, 0x8a6446, x0 + 1.55, 0, zCor + 2.75, NS));
      objScope('shelf', () => { addBox(1.0, 2.0, 0.4, 0x8a6446, x0 + 0.55, 0, zCor + 0.35, NS);
      [0.7, 1.15].forEach((y9, k) => dBox(0.86, 0.3, 0.03, [0x4f7fb0, 0xc8553a][k], x0 + 0.55, y9, zCor + 0.565)); });
      anthurium(x0 + 0.35, z1 - 0.35);
      lamp(0.6, 0.05, 0.6, cx, FH - 0.21, (zCor + z1) / 2);
    } else {
      { const a9 = s0 + 2.75, b9 = x1 - 0.05, kz = zCor + 1.25;
        objScope('desk', () => { addBox(b9 - a9, 1.0, 0.55, 0xd9cdb6, (a9 + b9) / 2, 0, kz, NS); dBox(b9 - a9 + 0.06, 0.04, 0.65, 0x9a7a58, (a9 + b9) / 2 + 0.0, 1.0, kz - 0.03); }); }
      { const x9 = cx + 0.3, z9 = z1 - 1.35; officeDesk(x9, 0, z9, 1.5, 1); sp.push(seatOf(x9, z9, 1)); }
      [cx - 1.15, cx + 1.1].forEach(x9 => { const z9 = zCor + 3.35; objScope('desk', () => { officeDesk(x9, 0, z9, 1.3, 1); dBox(1.34, 0.45, 0.04, 0xc8ccd0, x9, 0.74, z9 - 0.37); }); sp.push(seatOf(x9, z9, 1)); });
      objScope('printer', () => { addBox(0.62, 1.1, 0.62, 0xe8e8e4, x1 - 0.36, 0, zCor + 4.9, NS); dBox(0.62, 0.05, 0.62, 0x5c6066, x1 - 0.36, 1.1, zCor + 4.9); });
      [zCor + 4.2, zCor + 5.15].forEach(z9 => objScope('cab', () => { addBox(0.45, 1.3, 0.9, 0x9aa0a6, x0 + 0.23, 0, z9, NS); [0.3, 0.7, 1.1].forEach(y9 => dBox(0.03, 0.03, 0.3, 0x6a6e74, x0 + 0.465, y9, z9)); }));
      anthurium(x1 - 0.35, z1 - 0.35);
      lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (zCor + z1) / 2);
    }
    npcSpot[r.name] = sp;
  }
  FR.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2, cw = s1-s0;
    const rz0 = r.kinderOffice ? KBZ : zCor;

    if (i > 0) {
      const ze = (s0 === HX0 || s0 === HX1) ? fz1 : fz1 - 0.15;
      if (s0 === HX1) { wallRun('z', zCor + 0.15, ze, s0, INNER, { gaps: [{ c: EZI - 1.6, w: 2.8, sill: 1.12, dh: 2.45, win: true, frame: 0xc9ced3 }] });
        dBox(0.03, 2.45 - 1.12 - 0.14, 2.8 - 0.12, 0xb9d3ec, s0, 1.19, EZI - 1.6); }
      else if (r.kinder) wallRun('z', zCor + 0.15, ze, s0, CLS_WALL, { inner: true, face: 1, innerHex: 0xf3e9e5,
        gaps: [{ c: zCor + 1.1, w: 0.9, dh: 2.1, door: true, late: true, swing: { n: -1, leaves: [0.9], look: 'plain', color: 0xf6f4ee, win: false, knob: 0xe8c23a } }] });
      else {
        const isC = q => ['classroom', 'computer', 'daycare'].includes(q.type), cL = isC(FR.rooms[i - 1]), cR = isC(r), zc9 = (zCor + 0.15 + ze)/2, d9 = ze - zCor - 0.15;
        if (cL === cR) addBox(0.3, FH, d9, cL ? CLS_WALL : INNER, s0, 0, zc9);
        else { addBox(0.15, FH, d9, cL ? CLS_WALL : INNER, s0 - 0.075, 0, zc9); addBox(0.15, FH, d9, cR ? CLS_WALL : INNER, s0 + 0.075, 0, zc9); }
        [1, -1].forEach(s => baseboards.push({ ax: 'z', a0: zCor + 0.15, a1: ze, o: s0 + s * 0.15, s, y: 0 }));
      }
    }
    zones.push({ x0: s0, x1: s1, z0: rz0, z1: fz1, y: 0, label: r.name });
    if (r.type === 'hall') return;
    const x0 = s0 + (i > 0 ? 0.15 : 0.15), x1 = s1 - 0.15, z0 = rz0 + 0.15, z1 = fz1 - 0.15;
    const CLS9 = r.type === 'classroom' || r.type === 'computer' || r.type === 'daycare', CH = CLS9 ? FH - 0.4 : FH;
    if (CLS9) {
      if (r.type === 'computer') floorQ('tileW', x0, x1, z0, z1, 0, 0xa4a8ac); else floorQ('wood', x0, x1, z0, z1);
      if (r.kinder) kinderRoom(r.name, x0, x1, zCor + 0.15, z1, zCor + 1.1, s0 + 1.9, corWinsOf(r), facadeGaps.filter(g => g.c > s0 && g.c < s1));
      else westClass(r.name, x0, x1, zCor + 0.15, z1, 0, { sill: 1.0, ceilH: CH - 0.16, style: r.name === '3학년' ? 'g3' : '', computer: r.type === 'computer' });
      [1, 2].forEach(k => [-1, 1].forEach(sd => lamp(1.2, 0.05, 0.22, cx + sd * cw * 0.22, CH - 0.21, zCor + k * 2.5)));
      acUnit(r.name === '3학년' ? cx + 2.2 : cx, CH - 0.16, (zCor + fz1) / 2);
      corWinsOf(r).forEach(g => { dBox(g.w - 0.12, 0.06, 0.17, g.frame, g.c, 2.3, zCor);
        const a9 = g.c - g.w/2 + 0.06, b9 = g.c + g.w/2 - 0.06, z9 = zCor - 0.09, S9 = 0.44;
        patWall('film2', 'x', a9, b9, 1.16, 1.7, zCor + 0.09, 1);

        patPush('ctile', [[a9, 1.16, z9], [b9, 1.16, z9], [b9, 1.7, z9], [a9, 1.7, z9]], [[a9 / S9, 1.16 / S9], [b9 / S9, 1.16 / S9], [b9 / S9, 1.7 / S9], [a9 / S9, 1.7 / S9]], [0, 0, -1], 0xffffff); });
      if (r.name === '3학년') { const fw = facadeGaps.filter(g => g.c > s0 && g.c < s1);
        for (let k = 1; k < fw.length; k++) wallFan((fw[k - 1].c + fw[k].c) / 2, z1, -1, 2.35, 0xd6d8da); }
      doors.forEach(d => { if (d.ax === 'x' && !d.glass && Math.abs(d.cz - zCor) < 0.01 && d.cx > s0 && d.cx < s1) { d.slot = true; if (d.color == null) d.color = 0xbc9a78; } });
    } else if (r.type === 'toilet') {
      floorQ('ttile', x0, x1, z0, z1);

      const TA = (TDOOR[0][0] + TDOOR[1][0]) / 2, TB = (TDOOR[1][0] + TDOOR[2][0]) / 2, TC = (TDOOR[2][0] + TDOOR[3][0]) / 2, TZ = zCor + 3.1;
      addBox(0.3, FH, z1 - z0, INNER, TA, 0, (z0 + z1) / 2); addBox(0.3, FH, z1 - z0, INNER, TB, 0, (z0 + z1) / 2);
      addBox(0.3, FH, TZ + 0.3 - z0, INNER, TC, 0, (z0 + TZ + 0.3) / 2);
      addBox(TC - TB - 0.3, FH, 0.3, INNER, (TB + TC) / 2, 0, TZ + 0.15);
      const sinkAt = (a, b, zc) => { dBox(b - a, 1.2, 0.4, 0xdfe8ee, (a + b) / 2, 0, zc); colliders.push(noStand({ x0: a, x1: b, y0: 0, y1: 1.2, z0: zc - 0.2, z1: zc + 0.2 })); };
      sinkAt(x0 + 0.6, TA - 0.75, z1 - 0.2); sinkAt(TA + 0.35, TB - 0.35, z1 - 0.2); sinkAt(TB + 0.35, TC - 0.35, TZ - 0.2); sinkAt(TB + 0.6, x1 - 0.6, z1 - 0.2);
      [x0 + 1.2, x0 + 2.5].forEach(x => dBox(0.24, 1.9, 1.5, 0xdfe8ee, x, 0, zCor + 1.55, { collide: true }));
      [[(x0 + TA) / 2, (z0 + z1) / 2], [(TA + TB) / 2, (z0 + z1) / 2], [(TB + TC) / 2, (z0 + TZ) / 2], [(TB + x1) / 2, (TZ + z1) / 2]].forEach(([lx, lz]) => lamp(0.6, 0.05, 0.22, lx, FH - 0.21, lz));
    } else if (['교무실', '교장실', '행정실'].includes(r.name)) {
      officeRoom(r.name === '교무실' ? 'T' : r.name === '교장실' ? 'P' : 'A', r);
      offWinsOfFilm(r);
    } else if (r.kinderOffice) kinderOffice(x0, x1, z0, z1, zCor - 0.8, s0 + 2.8);
    else {
      floorQ('tileW', x0, x1, z0, z1, 0, 0xf2e6cf);
      const OD = [[cx - 1, rz0 + 3.3], [cx + 1, rz0 + 2.0]];
      OD.forEach(([x9, z9]) => officeDesk(x9, 0, z9));

      const sp9 = OD.map(([x9, z9]) => ({ x: x9 - 0.2, z: z9 + 0.62, face: 0, desk: 0.74, reach: 0.27, chair: true }));
      if (r.name === '행정실') { const x9 = cx + 0.6, z9 = fz1 - 1.35; officeDesk(x9, 0, z9); sp9.unshift({ x: x9 - 0.2, z: z9 + 0.62, face: 0, desk: 0.74, reach: 0.27, chair: true }); }
      if (r.name === '교무실') { const x9 = s1 - 1.3, z9 = rz0 + 1.25; officeDesk(x9, 0, z9, 1.5, -1); sp9.unshift({ x: x9 - 0.2, z: z9 - 0.62, face: 2, desk: 0.74, reach: 0.27, chair: true }); }
      npcSpot[r.name] = sp9;
      objScope('cab', () => addBox(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.7, 0, fz1 - 0.6));
      lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (rz0 + fz1)/2);
      offWinsOfFilm(r);
    }
    function offWinsOfFilm(r) {
      offWinsOf(r).forEach(g => { dBox(g.w - 0.12, 0.06, 0.17, g.frame, g.c, 2.3, zCor);
        const a9 = g.c - g.w/2 + 0.07, b9 = g.c + g.w/2 - 0.07, z9 = zCor - 0.095, S9 = g.frame === 0x8a98a4 ? 1.2 : 0.44;
        patWall('film2', 'x', a9, b9, 1.17, 1.7, zCor + 0.095, 1);

        patPush('ctile', [[a9, 1.17, z9], [b9, 1.17, z9], [b9, 1.7, z9], [a9, 1.7, z9]], [[a9 / S9, 1.17 / S9], [b9 / S9, 1.17 / S9], [b9 / S9, 1.7 / S9], [a9 / S9, 1.7 / S9]], [0, 0, -1], S9 > 1 ? 0xe9ecee : 0xffffff); });
    }
    if (r.type === 'toilet') {   }
    else if (!r.kinderOffice) classSign(r.name, r.span[0] + 1.9, 2.78, zCor, -1);
    ceil(s0, s1, r.kinderOffice ? fz0 - 0.16 : zCor, fz1, CH, r.type === 'toilet' ? 'cflat' : 'ctile');
  });

  FR.rooms.forEach(r => { if (r.type === 'hall' || r.type === 'toilet' || r.kinderOffice) return;
    const ow = offWinsOf(r), cw9 = corWinsOf(r), x = ow.length === 2 ? (ow[0].c + ow[1].c) / 2 : cw9.length ? (cw9[0].c + cw9[0].w / 2 + cw9[1].c - cw9[1].w / 2) / 2 : null;
    if (x === null) return;
    dBox(0.5, 0.62, 0.03, 0x3d4a44, x, 1.5, zCor - 0.165);
    patWall('kidsArt', 'x', x - 0.2, x + 0.2, 1.56, 2.06, zCor - 0.186, -1); });
  {
    const kr = FR.rooms.find(r => r.kinder), bx = kr.span[1] - 1.9, zf = zCor - 0.15, RF = 0xd8443a;
    dRod(bx - 0.75, 2.66, zf - 0.035, bx + 0.3, 3.1, zf - 0.035, 0.035, RF); dRod(bx + 0.3, 3.1, zf - 0.035, bx + 1.4, 2.66, zf - 0.035, 0.035, RF);
    objScope('shelf', () => { const sx = KSHX, w = 0.62, H = 1.3, d = 0.3, zc9 = zf - d / 2;
      [sx - w / 2 + 0.015, sx + w / 2 - 0.015].forEach(x9 => dBox(0.03, H, d, 0xe6cfa3, x9, 0, zc9));
      [0, 0.32, 0.64, 0.96, 1.27].forEach(y9 => dBox(w - 0.06, 0.03, d - 0.02, 0xe6cfa3, sx, y9, zc9 - 0.01));
      [0.03, 0.35, 0.67, 0.99].forEach((y9, k) => [-0.13, 0.13].forEach((o, j) => dBox(0.2, 0.08, 0.2, BOOK[(k * 2 + j + 1) % BOOK.length], sx + o, y9, zc9 - 0.02)));
      colliders.push(noStand({ x0: sx - w / 2, x1: sx + w / 2, y0: 0, y1: H, z0: zf - d, z1: zf })); }); }

  [0.25, 0.5, 0.75].forEach(t => { const c = libR.span[0] + (libR.span[1] - libR.span[0]) * t; patWall('film', 'x', c - 1.04, c + 1.04, 1.11, 2.29, fz0 + 0.09, 1); });
  {

    const LZ = fz0 + 0.15, LD = 0.3, LH = 0.85;
    const corLocker = (a0, a1, swing, body = 0x5a4232, door = 0x7a5c46, rows = 3, band = true) => {
      const L = a1 - a0, c = (a0 + a1) / 2;
      if (L >= 0.9) hideSpots.push({ kind: 'locker', label: '복도 사물함', x: c, y: 0, z: LZ + LD / 2, face: 180, w: L });
      dBox(L, band ? LH : LH + 0.11, LD, body, c, 0, LZ + LD / 2);
      if (band) dBox(L, 0.11, LD, HALL_DADO.lo, c, LH, LZ + LD / 2);
      dBox(L, 0.05, LD + 0.04, 0x9c9b98, c, LH + 0.11, LZ + (LD + 0.04) / 2);
      colliders.push(noStand({ x0: a0, x1: a1, y0: 0, y1: LH + 0.16, z0: LZ, z1: LZ + LD + 0.04 }));
      if (swing) [-1, 1].forEach(s => { dBox(L / 2 - 0.04, LH - 0.12, 0.03, 0x6e4632, c + s * L / 4, 0.06, LZ + LD + 0.015);
        dBox(0.03, 0.12, 0.03, 0xb8bcc0, c + s * 0.07, LH * 0.55, LZ + LD + 0.045); });
      else { const n = Math.max(1, Math.round(L / 0.42)), fz = LZ + LD + 0.005, y0 = 0.06, y1 = (band ? LH : LH + 0.11) - 0.04;
        patPush('lockD', [[a0 + 0.02, y0, fz], [a1 - 0.02, y0, fz], [a1 - 0.02, y1, fz], [a0 + 0.02, y1, fz]], [[0, 0], [n, 0], [n, rows], [0, rows]], [0, 0, 1], door); }
    };
    corLocker(BOARD[0] + 0.05, BOARD[1] - 0.05, false);
    corLocker(LANEW.c - LANEW.w / 2, LANEW.c + LANEW.w / 2, false, 0xcdb792, 0xeadabb, 2, false);

    { const K = B.kitchen, FZ = fz0 + 0.15;

      { const a0 = K.x[0] + 0.12, a1 = K.dutyRoom.doorC - 0.75, Lb = a1 - a0, cw = (Lb - 0.4) / 3;
        dBox(Lb, 1.3, 0.04, 0x6d6fb8, (a0 + a1) / 2, 1.05, FZ + 0.02);
        const q = (u0, u1, y0, y1, z, t) => patPush('cflat', [[u0, y0, z], [u1, y0, z], [u1, y1, z], [u0, y1, z]], [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, 1], t);
        q(a0 + 0.05, a1 - 0.05, 1.1, 2.3, FZ + 0.044, 0xc2dcf4);
        q(a0 + Lb * 0.2, a1 - Lb * 0.2, 2.1, 2.24, FZ + 0.048, 0x8f80cc);
        for (let k = 0; k < 3; k++) { const u = a0 + 0.1 + k * (cw + 0.1);
          q(u, u + cw, 1.25, 1.98, FZ + 0.048, 0xffffff); q(u + 0.03, u + cw - 0.03, 1.62, 1.92, FZ + 0.052, [0x9cc3e0, 0xe3b39c, 0xb9d89e][k]); } }
      frameBoard('x', K.dutyRoom.doorC + 0.75, K.staffDoorC - 0.65, FZ, 1, 1.05, 2.35, 0xcfc6ae, 'photoB');
      frameBoard('x', K.exitC + 0.85, K.doorC - 1.15, FZ, 1, 1.1, 2.3, 0xe8e2cc, 'photoB');
      frameBoard('x', K.doorC + 1.15, K.staffC - 0.8, FZ, 1, 1.05, 2.35, 0x8fb4e0, 'kidsArt');

      dBox(1.0, 2.1, 0.04, 0xc9ced3, K.staffC, 0, FZ + 0.02); dBox(0.3, 0.4, 0.03, 0x9fb0bb, K.staffC, 1.35, FZ + 0.055); }
    NBAY.forEach((a, k) => corLocker(a, a + NWW, k === 1 || k === 3 || k === 4 || k === 5));

    const PD = LD + 0.04, CT = FH - 0.16;
    const pil = (x0, x1) => { const c = (x0 + x1) / 2; dBox(x1 - x0, 1.0, PD, HALL_DADO.lo, c, 0, LZ + PD / 2, { collide: true }); addBox(x1 - x0, CT - 1.0, PD, 0xf3ead2, c, 1.0, LZ + PD / 2); };
    pil(NW0 - NPW - 0.05, NW0); NBAY.slice(1).forEach(a => pil(a - NPW, a));
    [NW0 - 0.25, NBAY[4] - NPW / 2].forEach(x => { extinguisher(x, 0, LZ + PD + 0.13);
      sign('소화기', x, 1.2, LZ + PD + 0.012, 0, 0.12, { bg: '#d83a2e', fg: '#ffffff' }); });

    [[BOARD[1] + 0.2, LZ], [NBAY[6] - NPW / 2, LZ + PD]].forEach(([x, zf]) => { dBox(0.22, 0.3, 0.03, 0xd9d9d4, x, 1.5, zf + 0.015); dCyl(0.075, 0.075, 0.04, 0xc4302b, x, 1.65, zf + 0.03, { rot: [Math.PI / 2, 0, 0], seg: 8 }); });

    dBox(0.9, 2.1, 0.04, 0xf0f0ec, 25.85, 0, LZ + 0.02); dBox(0.13, 0.03, 0.05, 0x9a9ea3, 25.55, 1.0, LZ + 0.065);
    dBox(0.5, 0.64, 0.03, 0xb8bcc0, 25.08, 1.25, LZ + 0.015); dBox(0.42, 0.56, 0.03, 0xf4f4f0, 25.08, 1.29, LZ + 0.02);

    dBox(BOARD[1] - BOARD[0], 1.38, 0.04, 0x2f6e4f, (BOARD[0] + BOARD[1]) / 2, 1.02, LZ + 0.02);
    { const a0 = BOARD[0] + 0.05, a1 = BOARD[1] - 0.05, y0 = 1.07, y1 = 2.35, z = LZ + 0.047, S9 = 2.4;
      patPush('notice', [[a0, y0, z], [a1, y0, z], [a1, y1, z], [a0, y1, z]], [[a0 / S9, y0 / S9], [a1 / S9, y0 / S9], [a1 / S9, y1 / S9], [a0 / S9, y1 / S9]], [0, 0, 1], 0xffffff); }

    { const bx = (BOARD[0] + BOARD[1]) / 2 + 0.3, s9 = sign('우리 학생자치회 소식', bx, 2.12, LZ + 0.058, 0, 0.34, { bg: '#cdb8e6', fg: '#4b2c7f' });
      const tri = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-0.055, 0, 0, 0, -0.09, 0, 0.055, 0, 0], 3));
      [0xd8403a, 0xf2c230, 0x3f78c8, 0x4fa05a, 0x8a5cc0, 0xf08a3a].forEach((hx, k) => dGeo(tri, new THREE.Matrix4().makeTranslation(bx - s9.w / 2 + 0.2 + k * 0.17, 2.392, LZ + 0.066), hx));
      tri.dispose(); }
    hotspots.push({ kind: 'notice', x: (BOARD[0] + BOARD[1]) / 2, z: fz0 + 1.1, y: 0, r: 1.6, label: '학생자치회 소식 읽기', at: [(BOARD[0] + BOARD[1]) / 2, 1.75, LZ] });
    [LOB_X0 + 1.2, 8.5].forEach(x => extinguisher(x, 0, fz0 + 0.3));

    exitSign(fx1 - 0.15, (fz0 + zCor) / 2, 2.55, [-1, 0]);
    [-8, 27.5, 38.7].forEach(x => { const zc = (fz0 + zCor) / 2; dBox(0.03, 0.18, 0.41, 0xf2f2ee, x, 2.81, zc); dRod(x, 2.99, zc, x, FH - 0.16, zc, 0.008, 0xb8bcc0);
      sign(EXIT_KEY, x + 0.017, 2.9, zc, Math.PI / 2, 0.14); sign(EXIT_KEY, x - 0.017, 2.9, zc, -Math.PI / 2, 0.14); });
  }

  { const RZ0 = fz0 + 0.02, RZ1 = fz1 + 0.4, R3 = 0x2f8a68;
    addBox(EN.x[0] - (fx0 - 0.4), 0.3, RZ1 - RZ0, R3, (fx0 - 0.4 + EN.x[0])/2, FH, (RZ0 + RZ1)/2);
    addBox(fx1 + 0.4 - EN.x[1], 0.3, RZ1 - RZ0, R3, (EN.x[1] + fx1 + 0.4)/2, FH, (RZ0 + RZ1)/2);
    addBox(EN.x[1] - EN.x[0], 0.3, fz1 - RZ0, R3, (EN.x[0] + EN.x[1])/2, FH, (RZ0 + fz1)/2);

    FSEC.map(([a9, b9, k9]) => [a9 < fx0 ? fx0 - 0.4 : a9, b9 > fx1 ? fx1 + 0.4 : b9, k9]).forEach(([a9, b9, k9]) => {
      const wc9 = SEC_WALL[k9], cc9 = SEC_BOX[k9], m9 = (a9 + b9) / 2, L9 = b9 - a9;
      addBox(L9, 0.45, 0.3, wc9, m9, FH + 0.3, fz1 + 0.25, { collide: false });
      dBox(L9, 0.07, 0.36, cc9, m9, FH + 0.75, fz1 + 0.25, { far: true });
      dBox(L9, 0.3, 0.03, wc9, m9, FH, fz1 + 0.415, { far: true });
      dBox(L9, 0.03, 0.24, wc9, m9, FH - 0.03, fz1 + 0.28);
    });

    { const ox = 21.1, oz = -30.1, OW = 5.8, OD = 6.2, OH = 2.6, rh = 0.8, sy = rh / 1.5;
      addBox(OW, OH, OD, 0x9aa6b0, ox, FH + 0.3, oz);
      dGeo(new THREE.CylinderGeometry(1, 1, 1, 3, 1).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2), new THREE.Matrix4().compose(new THREE.Vector3(ox, FH + 0.3 + OH + 0.5 * sy, oz), new THREE.Quaternion(), new THREE.Vector3(OW + 0.6, sy, (OD + 0.6) / 2 / 0.866)), 0xd5d8d8, { far: true });
      [-1.3, 1.3].forEach(dx => dBox(1.2, 0.8, 0.03, 0x3a4048, ox + dx, FH + 1.6, oz - OD / 2 - 0.015));
      addBox(4, 0.8, 1.5, 0xe8e6de, 26, FH + 0.3, -32.25); }

    roofRail(fx0 - 0.3, fz1 + 0.25, EN.x[0], fz1 + 0.25, FH + 0.82); roofRail(EN.x[1], fz1 + 0.25, fx1 + 0.3, fz1 + 0.25, FH + 0.82);
    roofRail(fx1 + 0.93, fz0 - 0.78, fx1 + 0.93, fz1 + 0.1, FH + 0.3);

    const WPZ = wg.z[1] + 0.15;
    addBox(0.3, 0.45, fz1 + 0.1 - WPZ, KHK, fx0 - 0.25, FH + 0.3, (WPZ + fz1 + 0.1)/2, { collide: false });
    dBox(0.36, 0.07, fz1 + 0.07 - WPZ, FYEL, fx0 - 0.25, FH + 0.75, (WPZ + fz1 + 0.07)/2, { far: true });
    dBox(0.03, 0.3, fz1 + 0.4 - RZ0, KHK, fx0 - 0.415, FH, (RZ0 + fz1 + 0.4)/2, { far: true });
    dBox(0.22, 0.1, 0.12, 0xf0f0f0, fx0 - 0.3, FH - 0.35, fz1 - 0.35); dBox(0.06, 0.12, 0.06, 0xf0f0f0, fx0 - 0.2, FH - 0.25, fz1 - 0.35);
    roofRail(CL.x[1] + 0.4, fz0 - 0.78, fx1 + 0.93, fz0 - 0.78, FH + 0.3);

    const PX0 = CL.x[1] + 0.4, PX1 = fx1 + 1.0, EZ9 = fz0 - 0.85;
    cut16(PX0, PX1, (u, v) => dBox(v - u, 0.35, RZ0 + 0.01 - EZ9, 0xe9e5dc, (u + v) / 2, FH - 0.056, (EZ9 + RZ0 + 0.01) / 2, { far: true }));
    cut16(RZ0 + 0.01, RZ1 - 0.02, (u, v) => dBox(PX1 - (fx1 + 0.15), 0.35, v - u, 0xe9e5dc, (fx1 + 0.15 + PX1) / 2, FH - 0.056, (u + v) / 2, { far: true }));
    patQuad('cflat', PX0, PX1, EZ9, fz0 - 0.15, FH - 0.064, true, 0xd9d4c6); patQuad('cflat', fx1 + 0.15, PX1, fz0 - 0.15, RZ1 - 0.02, FH - 0.064, true, 0xd9d4c6);

    { const kx = fx1 + 0.6, kz = fz0 - 0.5;
      dBox(0.06, 0.55, 0.06, 0x3a3a3a, kx, FH + 0.294, kz, { far: true });
      dBox(0.16, 0.16, 0.16, 0x2a2a2a, kx, FH + 0.85, kz, { far: true }); dCyl(0.16, 0.05, 0.3, 0x222222, kx, FH + 0.93, kz - 0.08, { far: true, seg: 6, rot: [-Math.PI / 2, 0, 0] });
      dBox(0.06, 0.1, 0.06, 0xe6e6e2, kx - 0.2, FH - 0.156, kz + 0.1); dBox(0.12, 0.1, 0.22, 0xf0f0ee, kx - 0.2, FH - 0.256, kz + 0.06);
      dBox(0.22, 0.15, 0.1, 0xeeeeea, fx1 - 0.85, 2.95, fz0 - 0.2); } }
  ceil(LOB_X0, fx1, fz0 - 0.16, zCor, FH, 'ctile');
  ceil(HX0, HX1, zCor, RC.z[0] + 0.16, FH, 'cflat');
  ceil(fx0, LOB_X0, KBZ, fz0 + 0.16, FH, 'ctile');

  const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
  foundation(wx0 - 0.15, wx1 + 0.15, wz0 - 0.15, wz1);

  wallZ(wz0, wz1, wx0, BRICK, { face: -1, ext: true, skin: 'brickW', frame: 0xa9adb0, gaps: [{ c: SIDE_Z, w: 2.0, glass: true, door: true },
    { c: -42.2, w: 2.2, sill: 1.0, dh: 2.6, win: true }] });
  wallRun('z', wz1 - 0.15, fz1 - 0.15, wx0, KHAKI, { face: -1, ext: true, skin: 'siding' });

  const WBR = BRICK, WFR = 0xa9adb0;
  wallX(wx0 - 0.15, STX0, wz0, WBR, { wins: 5, face: -1, ext: true, skin: 'brickW', frame: WFR });
  wallX(STX0, wx1 + 0.15, wz0, WBR, { face: -1, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: (STX0 + wx1)/2, w: 3.2, sill: 2.0, dh: 3.4, win: true, frame: WFR }] });
  wallZ(wz0, wz1, wx1, WBR, { face: 1, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: -37.9, w: 1.8, glass: true, door: true }] });

  wallX(wx0 - 0.15, STX0, wz0, WBR, { y0: FH+0.3, h: FH-0.3, wins: 5, face: -1, sill: 0.8, ext: true, skin: 'brickW', frame: WFR });
  wallX(STX0, wx1 + 0.15, wz0, WBR, { y0: FH+0.3, h: FH-0.3, face: -1, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: (STX0 + wx1)/2, w: 3.2, sill: 0, dh: 2.6, win: true, frame: WFR }] });
  wallZ(wz0, wz1, wx0, BRICK, { y0: FH+0.3, h: FH-0.3, face: -1, ext: true, skin: 'brickW', frame: 0xa9adb0, gaps: [{ c: (wz1 - B.upper.corridorDepth + wz1) / 2, w: 1.4, sill: 0.8, dh: 2.3, win: true }] });
  wallZ(wz0, wz1, wx1, WBR, { y0: FH+0.3, h: FH-0.3, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: -35.2, w: 1.2, sill: 0.9, dh: 2.3, win: true, frame: WFR }] });

  wallX(wx0 - 0.15, wx1 + 0.15, wz1, WALL, { y0: FH+0.3, h: FH-0.3, face: 1, skin: 'panelB',
    gaps: Array.from({ length: 12 }, (_, k) => ({ c: -39.7 + 2.1375 / 2 + k * 2.2875, w: 2.1375, sill: 0.25, dh: 2.7, win: true, frame: 0xb08a58 })) });
  lamp(27.24, 0.82, 0.03, -26.05, FH + 0.31, wz1 - 0.05);
  dBox(27.24, 0.05, 0.17, 0xb08a58, -26.05, FH + 1.13, wz1);
  for (let x9 = -39.4; x9 < -12.5; x9 += 0.6) dRod(x9, FH + 0.25, wz1 - 0.2, x9, FH + 1.13, wz1 - 0.2, 0.012, 0xc8ccd0);
  dRod(-39.6, FH + 1.0, wz1 - 0.2, -12.5, FH + 1.0, wz1 - 0.2, 0.02, 0xc8ccd0);

  addBox(1.0, 2.2, 0.16, 0xc9a26a, -11.75, FH + 0.3, wz1 - 0.23);
  dBox(0.7, 1.0, 0.03, 0xcfe0e6, -11.75, FH + 1.35, wz1 - 0.325);
  [-11.95, -11.75, -11.55].forEach(x9 => dBox(0.03, 0.8, 0.03, 0xb08850, x9, FH + 0.45, wz1 - 0.325));
  dBlob(0.035, 0.035, 0.035, 0xc0c4c8, -12.12, FH + 1.3, wz1 - 0.345);
  floorQ('tileG', STX0 + 0.15, wx1 - 0.15, wz0 + 0.15, fz0 + 0.15, 0, 0xbdbdb9);
  {
    const nurse = wg.rooms.find(r => r.type === 'nurse'), narae = wg.rooms.find(r => r.name === '나래반'), docR = wg.rooms.find(r => r.name === '문서고');

    const nurseDoor = narae.span[0] - 0.95, naraeDoor = narae.span[0] + 1.05, PL0 = nurseDoor + 0.5, PL1 = naraeDoor - 0.8;
    wallX(wx0 + 0.15, PL1, LOB_Z, INNER, { gaps: [{ c: nurseDoor, w: 1.0, color: 0xbfe0c8 }] });

    const LW1 = [naraeDoor + 2.5, docR.span[0] - 0.25], LW2 = [docR.span[0] + 0.25, LOB_X - 0.3];
    wallX(PL1, LOB_X + 0.15, LOB_Z, INNER, { face: -1, dado: HALL_DADO, gaps: [{ c: naraeDoor, w: 1.6, color: 0xe3e7ea },
      ...[LW1, LW2].map(([a, b]) => ({ c: (a + b) / 2, w: b - a, sill: 1.5, dh: 2.7, win: true, frame: 0xb88a58 }))] });
    [LW1, LW2].forEach(([a, b]) => lamp(b - a - 0.12, 0.54, 0.01, (a + b) / 2, 1.56, LOB_Z + 0.09));
    dBox(LOB_X - 0.2 - (naraeDoor + 0.85), 0.4, 0.04, 0x5b4636, (naraeDoor + 0.85 + LOB_X - 0.2) / 2, 1.1, LOB_Z + 0.17);
    dBox(LOB_X - 0.2 - (naraeDoor + 0.85), 0.05, 0.06, 0xeee6cf, (naraeDoor + 0.85 + LOB_X - 0.2) / 2, 1.05, LOB_Z + 0.18);
    sign('문서고', (LW2[0] + LW2[1]) / 2, 2.88, LOB_Z + 0.2, 0, 0.14);

    addBox(PL1 - PL0, FH, 0.3, 0xece4d2, (PL0 + PL1) / 2, 0, LOB_Z + 0.3);
    dBox(0.26, 1.0, 0.03, 0xe6b1b5, PL0 + 0.17, 1.6, LOB_Z + 0.465); dBox(0.26, 1.0, 0.03, 0xe6b1b5, PL1 - 0.17, 0.35, LOB_Z + 0.465);
    dBox(0.5, 0.1, 0.06, INNER, (PL0 + PL1) / 2, 1.0, LOB_Z);
    dBox(PL0 - 0.02 - (nurseDoor - 0.6), 0.4, 0.06, 0xe7b8b8, (nurseDoor - 0.6 + PL0 - 0.02) / 2, 2.65, LOB_Z + 0.18);
    dBox(naraeDoor + 0.95 - (PL1 + 0.02), 0.4, 0.06, 0xe7b8b8, (PL1 + 0.02 + naraeDoor + 0.95) / 2, 2.65, LOB_Z + 0.18);
    sign('밝은숲 보금자리', (nurseDoor - 0.6 + PL0 - 0.02) / 2, 2.85, LOB_Z + 0.22, 0, 0.16, { bg: 'none', fg: '#fff3d6' });
    sign('Uri Village', (PL1 + 0.02 + naraeDoor + 0.95) / 2, 2.85, LOB_Z + 0.22, 0, 0.2, { bg: 'none', fg: '#fff3d6' });

    wallZ(LOB_Z, fz0, LOB_X, INNER, { gaps: [{ c: -37.05, w: 0.9, glass: true }, { c: -36.075, w: 0.75, sill: 0, dh: 2.6, win: true, frame: 0xb9bec4 }] });
    addPanel(0.3, 0.75, 0xb3aea4, LOB_X, 0.012, -36.075);
    sign('고정문', LOB_X - 0.105, 1.25, -36.075, Math.PI / 2, 0.075, { bg: '#ffffff', fg: '#d0302a' });
    {
      const FX = LOB_X - 0.15, D9 = 0xa8805f, zN = LOB_Z + 0.15, zS = fz0 - 0.15;
      dBox(0.06, 0.45, zS - zN, D9, FX - 0.03, 2.62, (zN + zS) / 2);
      dBox(0.06, 2.62, -37.56 - zN, D9, FX - 0.03, 0, (zN - 37.56) / 2); dBox(0.06, 2.62, zS + 35.64, D9, FX - 0.03, 0, (zS - 35.64) / 2);
      [-37.53, -35.67].forEach(z9 => dBox(0.05, 2.6, 0.06, 0xb9bec4, FX - 0.025, 0, z9));
      dBox(0.05, 2.6, 0.15, 0xb9bec4, FX - 0.025, 0, -36.525);
      dBox(0.03, 0.8, 0.5, 0xe8e0f0, FX - 0.075, 1.2, -37.95); dBox(0.03, 0.8, 0.5, 0xf0e6d6, FX - 0.075, 1.2, -35.25);
      patWall('kidsArt', 'z', -38.15, -37.75, 1.25, 1.95, FX - 0.091, -1); patWall('kidsArt', 'z', -35.45, -35.05, 1.25, 1.95, FX - 0.091, -1);
      sign('꿈터 도서관', FX - 0.08, 2.845, -36.6, Math.PI / 2, 0.3, { bg: 'none', fg: '#f3ead8' }); }

    const pz = (wz0 + 0.15 + LOB_Z - 0.15) / 2, pd = (LOB_Z - 0.15) - (wz0 + 0.15);
    addBox(0.3, FH, pd, INNER, narae.span[0], 0, pz);
    wallZ(wz0, LOB_Z, docR.span[0], INNER, { gaps: [{ c: pz, w: 1.0 }] });
    addBox(0.3, FH, pd, INNER, LOB_X, 0, pz);

    wallZ(wz0, wz1, STX0, INNER, { face: -1, dado: STAIR_DADO });
    { const x9 = STX0 + 0.15, z9 = fz0 - 1.4;
      dBox(0.04, 2.1, 0.92, 0xdcd3bd, x9 + 0.035, 0, z9);
      [-1, 1].forEach(s => dBox(0.05, 2.16, 0.05, 0xc9c0aa, x9 + 0.04, 0, z9 + s * 0.485));
      dBox(0.05, 0.05, 0.92, 0xc9c0aa, x9 + 0.04, 2.11, z9);
      dBox(0.05, 0.05, 0.14, 0x9a9ea3, x9 + 0.08, 1.0, z9 + 0.33);
      dBox(0.03, 0.42, 0.3, 0xf2efe6, x9 + 0.07, 1.35, z9 - 0.1); }

    function libraryRoom(r, s0, s1) {
      const X0 = s0 + 0.15, X1 = s1 - 0.15, N0 = wz0 + 0.15, S1 = fz0 - 0.15;
      const SW9 = 0xa7774c, SB9 = 0x7d5a3c;

      const bookRow = (ax, a0, a1, line, f, y0, y1, u9) => {
        const P9 = ax === 'x' ? [[a0, y0, line], [a1, y0, line], [a1, y1, line], [a0, y1, line]] : [[line, y0, a0], [line, y0, a1], [line, y1, a1], [line, y1, a0]];
        patPush('books', P9, [[u9, 0], [u9 + a1 - a0, 0], [u9 + a1 - a0, 1], [u9, 1]], ax === 'x' ? [0, 0, f] : [f, 0, 0], 0xffffff); };

      const shelf = objWrap((ax, a0, a1, c, D, H, lv, fs, base = 0.08, baseHex = SB9) => {
        const L = a1 - a0, m = (a0 + a1) / 2, one = fs.length === 1;
        const B = (w, h, d, hex, pa, y, pc) => ax === 'x' ? dBox(w, h, d, hex, pa, y, pc) : dBox(d, h, w, hex, pc, y, pa);
        B(0.04, H, D, SW9, a0 + 0.02, 0, c); B(0.04, H, D, SW9, a1 - 0.02, 0, c);
        B(L - 0.08, 0.04, D, SW9, m, H - 0.04, c);
        B(L - 0.08, base, D - 0.04, baseHex, m, 0, c);
        one ? B(L - 0.08, H - 0.04 - base, 0.03, SB9, m, base, c - fs[0] * (D / 2 - 0.015)) : B(L - 0.1, H - 0.05 - base, 0.03, SB9, m, base + 0.005, c);
        const dd = one ? D - 0.03 : D, cc = one ? c + fs[0] * 0.015 : c, st = (H - 0.04 - base) / lv;
        for (let k = 1; k < lv; k++) B(L - 0.08, 0.03, dd, SW9, m, base + k * st - 0.015, cc);
        const nd = Math.max(0, Math.round(L / 1.0) - 1);
        for (let k = 1; k <= nd; k++) B(0.03, H - 0.04 - base, one ? D - 0.07 : D - 0.06, SW9, a0 + L * k / (nd + 1), base, one ? c + fs[0] * 0.005 : c);
        for (const f of fs) for (let k = 0; k < lv; k++) bookRow(ax, a0 + 0.04, a1 - 0.04, c + f * (D / 2 - 0.04), f, base + k * st + (k ? 0.015 : 0), base + (k + 1) * st - (k < lv - 1 ? 0.015 : 0), hash2(a0 * 7 + k, c * 3 + f) * 5);
        colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: 0, y1: H, z0: c - D / 2, z1: c + D / 2 } : { x0: c - D / 2, x1: c + D / 2, y0: 0, y1: H, z0: a0, z1: a1 }, H >= 1.6 ? 1.6 : 1.6));
      }, 'shelf');

      shelf('z', N0 + 0.36, -38.1, X0 + 0.175, 0.35, 2.1, 6, [1]);
      shelf('x', X0, -24.25, N0 + 0.175, 0.35, 2.1, 6, [1]);
      shelf('x', -21.9, -19.36, N0 + 0.175, 0.35, 2.1, 6, [1]);
      shelf('z', N0, S1 - 0.25, X1 - 0.175, 0.35, 2.1, 6, [-1]);
      shelf('x', -24.1, -22.04, N0 + 0.175, 0.35, 0.9, 2, [1]);

      shelf('x', -21.6, -17.4, -39.7, 0.5, 1.3, 4, [-1, 1], 0.12, 0x3f78c8);
      shelf('x', -21.0, -17.4, -38.3, 0.5, 1.3, 4, [-1, 1], 0.12, 0x3f78c8);

      { const x9 = -22.92, z9 = -36.5, L9 = 1.5;
        objScope('desk', () => {
        dBox(0.6, 0.04, L9 + 0.04, 0xe2cfa6, x9, 0.72, z9);
        dBox(0.08, 1.02, L9 + 0.04, 0xd7c09a, x9 - 0.34, 0, z9);
        dBox(0.03, 0.8, L9 - 0.1, 0xc4a57a, x9 - 0.395, 0.12, z9);
        [-1, 1].forEach(sd => dBox(0.52, 0.72, 0.04, 0xd7c09a, x9 + 0.04, 0, z9 + sd * (L9 / 2 - 0.02)));
        dBox(0.34, 0.72, 0.4, 0xc9b28c, x9 - 0.1, 0, z9 - L9 / 2 + 0.26);
        dBox(0.08, 0.12, 0.08, 0x3a3d44, x9 - 0.12, 0.76, z9 + 0.1); dBox(0.04, 0.34, 0.54, 0x2f3238, x9 - 0.12, 0.88, z9 + 0.1);
        dBox(0.15, 0.03, 0.42, 0xe6e6e0, x9 + 0.12, 0.76, z9 + 0.1);
        dBox(0.16, 0.1, 0.22, 0x5b8fc9, x9 - 0.05, 0.76, z9 - 0.5); dBox(0.15, 0.07, 0.2, 0xe0708a, x9 - 0.05, 0.86, z9 - 0.49);
        colliders.push(noStand({ x0: x9 - 0.38, x1: x9 + 0.3, y0: 0, y1: 1.02, z0: z9 - L9 / 2 - 0.02, z1: z9 + L9 / 2 + 0.02 })); });
        hideSpots.push({ kind: 'desk', label: '안내 데스크 밑', x: x9 + 0.05, y: 0, z: z9, face: 90, w: 1.2 });
        npcSpot[r.name] = [{ x: x9 + 0.57, z: z9, face: 3, desk: 0.76, reach: 0.27, chair: true }];

        dCyl(0.2, 0.2, FH - 0.17, 0xf1eee6, x9 - 0.08, 0, -37.67, { seg: 12 });
        colliders.push({ x0: x9 - 0.26, x1: x9 + 0.1, y0: 0, y1: FH - 0.17, z0: -37.85, z1: -37.49 });
        dBox(0.04, 0.26, 0.74, 0x8cc63f, x9 - 0.3, 2.12, -37.67);
        sign('Information', x9 - 0.325, 2.25, -37.67, Math.PI / 2, 0.15, { bg: '#8cc63f', fg: '#1f3d12' }); }

      objScope('printer', () => { dBox(0.6, 0.95, 0.55, 0x3a3d42, -22.0, 0, -38.45); dBox(0.62, 0.06, 0.57, 0xd9dcdf, -22.0, 0.95, -38.45); dBox(0.45, 0.04, 0.3, 0xeeeeea, -22.0, 1.01, -38.45);
      colliders.push(noStand({ x0: -22.31, x1: -21.69, y0: 0, y1: 1.05, z0: -38.74, z1: -38.16 })); });
      const cart = objWrap((x9, z9, ax) => { const w = 0.9, d = 0.45, B = (a, h, b, hex, y) => ax === 'x' ? dBox(a, h, b, hex, x9, y, z9) : dBox(b, h, a, hex, x9, y, z9);
        B(w - 0.06, 0.03, d, SW9, 0.12); B(w - 0.06, 0.03, d, SW9, 0.5); B(w - 0.06, 0.03, d, SW9, 0.88);
        [-1, 1].forEach(sd => ax === 'x' ? dBox(0.03, 0.8, d, SW9, x9 + sd * (w / 2 - 0.015), 0.11, z9) : dBox(d, 0.8, 0.03, SW9, x9, 0.11, z9 + sd * (w / 2 - 0.015)));
        [0.15, 0.53].forEach(y => [-1, 1].forEach(f => ax === 'x' ? bookRow('x', x9 - w / 2 + 0.03, x9 + w / 2 - 0.03, z9 + f * 0.1, f, y, y + 0.3, x9 + y) : bookRow('z', z9 - w / 2 + 0.03, z9 + w / 2 - 0.03, x9 + f * 0.1, f, y, y + 0.3, z9 + y)));
        [-1, 1].forEach(sd => [-1, 1].forEach(sz => dCyl(0.045, 0.045, 0.1, 0x2b2b2b, ax === 'x' ? x9 + sd * 0.38 : x9 + sz * 0.17, 0.01, ax === 'x' ? z9 + sz * 0.17 : z9 + sd * 0.38, { seg: 6 })));
        colliders.push(noStand(ax === 'x' ? { x0: x9 - w / 2, x1: x9 + w / 2, y0: 0, y1: 0.91, z0: z9 - d / 2, z1: z9 + d / 2 } : { x0: x9 - d / 2, x1: x9 + d / 2, y0: 0, y1: 0.91, z0: z9 - w / 2, z1: z9 + w / 2 })); }, 'cart');
      cart(-24.0, -38.35, 'x'); cart(-16.85, -34.8, 'z');

      const purple = objWrap((x9, z9, fx, fz) => { dBox(0.4, 0.04, 0.4, 0xa98bd6, x9, 0.42, z9);
        fx ? dBox(0.035, 0.36, 0.4, 0xa98bd6, x9 - fx * 0.19, 0.46, z9) : dBox(0.4, 0.36, 0.035, 0xa98bd6, x9, 0.46, z9 - fz * 0.19);
        fx ? [-1, 1].forEach(s => dBox(0.3, 0.42, 0.03, 0xc9ccd0, x9, 0, z9 + s * 0.17)) : [-1, 1].forEach(s => dBox(0.03, 0.42, 0.3, 0xc9ccd0, x9 + s * 0.17, 0, z9));
        colliders.push(noStand({ x0: x9 - 0.2, x1: x9 + 0.2, y0: 0, y1: 0.82, z0: z9 - 0.2, z1: z9 + 0.2 })); }, 'chair');
      [[-23.6, -42.75], [-23.6, -40.35]].forEach(([x9, z9]) => {
        objScope('table', () => { dCyl(0.55, 0.55, 0.04, 0xd3ad73, x9, 0.68, z9, { seg: 14 }); dCyl(0.06, 0.06, 0.65, 0x8a6a45, x9, 0.03, z9, { seg: 6 }); dBox(0.6, 0.03, 0.6, 0x8a6a45, x9, 0, z9);
        colliders.push(noStand({ x0: x9 - 0.39, x1: x9 + 0.39, y0: 0, y1: 0.72, z0: z9 - 0.55, z1: z9 + 0.55 }), noStand({ x0: x9 - 0.55, x1: x9 + 0.55, y0: 0, y1: 0.72, z0: z9 - 0.39, z1: z9 + 0.39 })); });
        purple(x9 - 0.78, z9, 1, 0); purple(x9 + 0.78, z9, -1, 0); purple(x9, z9 - 0.78, 0, 1); purple(x9, z9 + 0.78, 0, -1); });

      { const x9 = -19.2, z9 = -35.95;
        objScope('table', () => { dBox(3.6, 0.04, 1.2, 0xd3ad73, x9, 0.68, z9);
        [-1, 1].forEach(sx => [-1, 1].forEach(sz => dBox(0.06, 0.68, 0.06, 0x8a6a45, x9 + sx * 1.7, 0, z9 + sz * 0.52)));
        colliders.push(noStand({ x0: x9 - 1.8, x1: x9 + 1.8, y0: 0, y1: 0.72, z0: z9 - 0.6, z1: z9 + 0.6 })); });
        [-1.35, -0.45, 0.45, 1.35].forEach(o => [-1, 1].forEach(sz => objScope('chair', () => { const cz = z9 + sz * 0.85, cxx = x9 + o;
          dBox(0.4, 0.04, 0.4, 0xc99a62, cxx, 0.42, cz); dBox(0.4, 0.34, 0.035, 0xc99a62, cxx, 0.46, cz + sz * 0.19);
          [-1, 1].forEach(s => dBox(0.03, 0.42, 0.34, 0x8a6a45, cxx + s * 0.18, 0, cz));
          colliders.push(noStand({ x0: cxx - 0.2, x1: cxx + 0.2, y0: 0, y1: 0.82, z0: cz - 0.2, z1: cz + 0.2 })); })));
        hotspots.push({ kind: 'read', x: x9, z: z9 - 1.45, y: 0, r: 1.6, label: '책 읽기' }); }

      { const x9 = -18.1, z9 = -42.85, R9 = 1.4, H9 = 0.18;
        dCyl(R9, R9, H9, 0xe6dccb, x9, 0, z9, { seg: 16 });
        [[0.92, 0.39], [0.75, 0.66], [0.39, 0.92]].forEach(([a, b]) => colliders.push({ x0: x9 - R9 * a, x1: x9 + R9 * a, y0: 0, y1: H9, z0: z9 - R9 * b, z1: z9 + R9 * b }));
        [[-0.55, 0.15, 0x6f86a8], [0.55, -0.35, 0x9b8a6e]].forEach(([ox, oz, c9]) => objScope('beanbag', () => { dBlob(0.36, 0.24, 0.36, c9, x9 + ox, H9 + 0.2, z9 + oz, { chunky: true });
          colliders.push({ x0: x9 + ox - 0.28, x1: x9 + ox + 0.28, y0: H9, y1: H9 + 0.3, z0: z9 + oz - 0.28, z1: z9 + oz + 0.28 }); }));
        objScope('table', () => { dCyl(0.42, 0.42, 0.03, 0xd3ad73, x9 + 0.1, H9 + 0.3, z9 + 0.55, { seg: 12 }); dCyl(0.05, 0.05, 0.3, 0x8a6a45, x9 + 0.1, H9, z9 + 0.55, { seg: 6 });
        colliders.push(noStand({ x0: x9 - 0.28, x1: x9 + 0.48, y0: H9, y1: H9 + 0.33, z0: z9 + 0.17, z1: z9 + 0.93 })); });
        objScope('cushion', () => dCyl(0.22, 0.22, 0.06, 0xe8a0b8, x9 - 0.6, H9, z9 - 0.75, { seg: 10 }));
        const az = z9 + R9 + 0.1, AW = 1.45, AY = 2.0;
        [-1, 1].forEach(sd => { dBox(0.2, AY, 0.2, 0xf4f1ea, x9 + sd * AW, 0, az); colliders.push(noStand({ x0: x9 + sd * AW - 0.1, x1: x9 + sd * AW + 0.1, y0: 0, y1: AY, z0: az - 0.1, z1: az + 0.1 })); });
        { const g9 = new THREE.TorusGeometry(AW, 0.1, 4, 12, Math.PI); dGeo(g9, new THREE.Matrix4().compose(_dv.set(x9, AY, az), _dq.set(0, 0, 0, 1), _ds.set(1, 0.36, 1)), 0xf4f1ea); g9.dispose(); }
        dBox(2 * AW + 0.2, 0.12, 0.24, 0xf4f1ea, x9, AY + 0.52, az); }

      [-24.35, -23.45].forEach((x9, i9) => objScope('shelf', () => {
        const ST9 = [[0, 0.42], [0.3, 0.3], [0.6, 0.18]];
        ST9.forEach(([y, d]) => dBox(0.85, 0.3, d, 0xb98a5a, x9, y, S1 - d / 2));
        dBox(0.85, 0.3, 0.04, 0x9a7048, x9, 0.9, S1 - 0.02);
        ST9.forEach(([y], k) => { const zb = S1 - (k < 2 ? ST9[k + 1][1] : 0.04) - 0.015;
          [-0.27, 0, 0.27].forEach((o, j) => dBox(0.22, 0.26, 0.03, [0xf2c14b, 0x6fb0e0, 0xe86a6a, 0x8cc26a, 0xc9a0e0, 0xf29a52][(k * 3 + j + i9 * 2) % 6], x9 + o, y + 0.3, zb)); });
        colliders.push(noStand({ x0: x9 - 0.43, x1: x9 + 0.43, y0: 0, y1: 1.2, z0: S1 - 0.42, z1: S1 })); }));
      objScope('plant', () => { const x9 = -25.1, z9 = -34.75;
        dBox(0.4, 0.08, 0.4, 0xf2f0ea, x9, 0, z9);
        dCyl(0.05, 0.07, 2.35, 0xeeeae0, x9, 0.08, z9, { seg: 6 });
        [0.7, 1.2, 1.75].forEach(y => dBox(0.1, 0.04, 0.03, 0x3a3a3a, x9, y, z9 + 0.06));
        [[0, 2.45, 0, 0.55], [0.25, 2.05, 0.15, 0.4], [-0.2, 2.15, -0.1, 0.38]].forEach(([ox, oy, oz, rr]) => dBlob(rr, rr * 0.6, rr, 0x9cc46a, x9 + ox, oy, z9 + oz, { chunky: true, ry: ox * 5 }));
        colliders.push(noStand({ x0: x9 - 0.2, x1: x9 + 0.2, y0: 0, y1: 2.4, z0: z9 - 0.2, z1: z9 + 0.2 })); });

      objScope('ext', () => { dBox(0.3, 0.05, 0.3, 0xc8342c, X0 + 0.25, 0.005, -37.8); extinguisher(X0 + 0.25, 0.055, -37.8); });
      acUnit(-20.9, FH - 0.16, -41.4); acUnit(-20.9, FH - 0.16, -37.2);
      dCyl(0.17, 0.17, 0.04, 0xf5f3ec, -20.63, 2.55, N0, { rot: [Math.PI / 2, 0, 0], seg: 16 });
      dCyl(0.02, 0.02, 0.05, 0x2a2a2a, -20.63, 2.55, N0 + 0.045, { rot: [Math.PI / 2, 0, 0], seg: 6 });
      [0.25, 0.75].forEach(t => lamp(1.2, 0.05, 0.22, s0 + (s1 - s0) * t, FH - 0.21, (wz0 + fz0) / 2));
    }
    wg.rooms.forEach(r => {
      const [s0, s1] = r.span, cx = (s0 + s1) / 2;
      const deep = r.type === 'library' || r.type === 'stair';
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: deep ? fz0 : LOB_Z, y: 0, label: r.name });
      if (r.type !== 'stair') floorQ(r.type === 'library' ? 'tileW' : r.type === 'nurse' ? 'ttile' : r.type === 'storage' ? 'tileW' : 'wood', s0 + 0.15, s1 - 0.15, wz0 + 0.15, (deep ? fz0 : LOB_Z) - 0.15, 0, r.type === 'library' ? 0xfbf6ea : undefined);
      if (r.type === 'library') libraryRoom(r, s0, s1);
      if (r.type === 'nurse') { objScope('bed', () => addBox(1.05, 0.5, 2, 0xf2f5f7, cx - 1, 0, wz0 + 1.6)); objScope('bed', () => addBox(1.05, 0.5, 2, 0xf2f5f7, cx + 1, 0, wz0 + 1.6));
        objScope('screen', () => dBox(0.04, 1.6, 2.2, 0xcfe3ee, cx, 0.4, wz0 + 1.7, { collide: true })); officeDesk(cx - 0.6, 0, LOB_Z - 1.2); npcSpot[r.name] = [{ x: cx - 0.8, z: LOB_Z - 0.58, face: 0, desk: 0.74, reach: 0.27, chair: true }]; lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (wz0 + LOB_Z)/2); }
      if (r.name === '나래반') { westClass(r.name, s0 + 0.15, s1 - 0.15, LOB_Z - 0.15, wz0 + 0.15, 0, { sill: 1.0, backGap: [pz - 0.9, pz + 0.9], big: true, nDesk: 2, rowX: 3.3 }); lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (wz0 + LOB_Z)/2); }
      if (r.name === '문서고') [wz0 + 0.5, wz0 + 2.2].forEach(z9 => objScope('cab', () => addBox(1.6, 1.9, 0.5, 0x9aa0a6, cx, 0, z9)));
    });
    hangSign('보건실', nurseDoor, 2.78, LOB_Z, 1);
    hangSign('나래반', naraeDoor + 1.5, 2.78, LOB_Z, 1);
    hangSign('도서관', LOB_X + 0.35, 2.78, fz0, 1);
    {
      const a = libR.span[0] + 0.46, b = libR.span[1] - 0.41, c3 = [0.25, 0.5, 0.75].map(t => libR.span[0] + (libR.span[1] - libR.span[0]) * t);
      let x9 = a; for (const c of c3) { if (c - 1.04 > x9 + 0.01) patWall('film', 'x', x9, c - 1.04, 1.11, 2.29, fz0 + 0.09, 1); x9 = c + 1.04; }
      if (b > x9 + 0.01) patWall('film', 'x', x9, b, 1.11, 2.29, fz0 + 0.09, 1);
      patWall('film', 'x', a, b, 2.29, 2.39, fz0 + 0.09, 1);
      dBox(b - a + 0.1, 0.05, 0.19, 0xc9cdd2, (a + b) / 2, 2.1, fz0); }

    const [dx9, dz9] = WL.sofa;
    colliders.push({ x0: dx9-1.15, x1: dx9+1.15, y0: 0, y1: 0.45, z0: dz9-1.15, z1: dz9+1.15 }, { x0: dx9-0.75, x1: dx9+0.75, y0: 0.45, y1: 0.85, z0: dz9-0.75, z1: dz9+0.75 }, { x0: dx9-0.3, x1: dx9+0.3, y0: 0.85, y1: FH, z0: dz9-0.3, z1: dz9+0.3 });

    const half = (r, h, y, th0, hex, seg) => { const g = new THREE.CylinderGeometry(r, r, h, seg, 1, false, th0, Math.PI); g.translate(dx9, y + h / 2, dz9); dGeo(g, new THREE.Matrix4(), hex, { far: true }); g.dispose(); };
    const OR = 0xe79a45, LY = 0xe9d949;
    half(1.15, 0.45, 0, 0, OR, 12); half(1.15, 0.45, 0, Math.PI, LY, 12);
    half(0.78, 0.4, 0.45, 0, LY, 10); half(0.78, 0.4, 0.45, Math.PI, OR, 10);
    half(0.3, 1.1, 0.85, 0, LY, 8); half(0.3, 1.1, 0.85, Math.PI, OR, 8);
    dCyl(0.27, 0.27, FH - 0.51 - 1.95, 0xf1eee4, dx9, 1.95, dz9, { seg: 12, far: true });
    { const cap9 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.33, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0xcfe6cf }));
      cap9.position.set(dx9, FH - 0.16 - 0.175, dz9); cap9.matrixAutoUpdate = false; cap9.updateMatrix(); scene.add(cap9); }

    const bz9 = LOB_Z + 0.15 + 0.3;
    [[-31.0, [0xe8893a, 0x8cc26a, 0xf2c14b]], [-28.0, [0xe8893a, 0x8cc26a, 0xe8893a]]].forEach(([bx9, cs9]) => objScope('bench', () => {
      cs9.forEach((c9, k) => dBox(0.58, 0.14, 0.55, c9, bx9 + (k - 1) * 0.6, 0.28, bz9));
      dBox(1.76, 0.04, 0.5, 0x2b2b2b, bx9, 0.24, bz9);
      [[-0.84, -0.22], [0.84, -0.22], [-0.84, 0.22], [0.84, 0.22]].forEach(([ox, oz]) => dBox(0.04, 0.24, 0.04, 0x2b2b2b, bx9 + ox, 0, bz9 + oz));
      colliders.push({ x0: bx9 - 0.9, x1: bx9 + 0.9, y0: 0, y1: 0.42, z0: bz9 - 0.28, z1: bz9 + 0.28 }); }));

    objScope('bin', () => { const rx9 = LOB_X - 0.21 - 0.225;
      addBox(0.45, 0.95, 0.55, 0xc9cfd6, rx9, 0, -35.2, NS);
      dBox(0.03, 0.7, 0.45, 0xf4f6f8, rx9 - 0.24, 0.12, -35.2);
      dBox(0.47, 0.04, 0.57, 0x5a5e62, rx9, 0.95, -35.2);
      dBox(0.03, 0.06, 0.3, 0x3a3d42, rx9 - 0.27, 0.66, -35.2);
      sign('도서반납함', rx9 - 0.265, 0.5, -35.2, -Math.PI / 2, 0.08, { bg: '#f4f6f8', fg: '#2f6fd0' }); });

    objScope('shelf', () => { const sx0 = wx0 + 0.2, sx1 = wx0 + 1.0, sz0 = LOB_Z + 0.15, sz1 = LOB_Z + 0.5, SW = 0xcaa87a;
      [sx0 + 0.015, (sx0 + sx1) / 2, sx1 - 0.015].forEach(x9 => dBox(0.03, 1.2, sz1 - sz0, SW, x9, 0, (sz0 + sz1) / 2));
      for (let k = 0; k <= 5; k++) dBox(sx1 - sx0 - 0.03, 0.03, sz1 - sz0 - 0.02, SW, (sx0 + sx1) / 2, 0.02 + k * 0.232, (sz0 + sz1) / 2);
      [[0, 1, 0x3b3b3b], [1, 2, 0xe8e8e8], [0, 3, 0x5a78b0], [1, 0, 0xd06a5a]].forEach(([c9, r9, h9]) => dBox(0.26, 0.08, 0.22, h9, sx0 + 0.2 + c9 * 0.4, 0.05 + r9 * 0.232, (sz0 + sz1) / 2 + 0.03));
      colliders.push(noStand({ x0: sx0, x1: sx1, y0: 0, y1: 1.2, z0: sz0, z1: sz1 })); });
    patQuad('check', wx0 + 0.15, wx0 + 1.6, VZ[0] + 0.3, VZ[1] - 0.3, 0.02, false, 0xb08a60);
    addPanel(0.25, VZ[1] - VZ[0] - 0.3, 0x2f3236, LOB_X0 - 0.125, 0.02, SIDE_Z);

    { const ux9 = STX0 + 0.45, uz9 = fz0 - 0.75;
      objScope('umbrella', () => { dBox(0.55, 0.42, 0.3, 0x9a948a, ux9, 0, uz9);
      [[-0.18, 0xf2c230], [-0.06, 0xe68aa8], [0.06, 0x3f6fb0], [0.18, 0xf2c230]].forEach(([o9, c9]) => dRod(ux9 + o9, 0.3, uz9, ux9 + o9 + 0.03, 0.95, uz9 + 0.02, 0.02, c9));
      colliders.push(noStand({ x0: ux9 - 0.28, x1: ux9 + 0.28, y0: 0, y1: 0.42, z0: uz9 - 0.15, z1: uz9 + 0.15 })); });
      extinguisher(STX0 + 0.3, 0, fz0 - 0.35); }
    zones.push({ x0: LOB_X0, x1: LOB_X, z0: LOB_Z, z1: fz0, y: 0, label: '서측 로비' });
    zones.push({ x0: wx0, x1: LOB_X0, z0: VZ[0], z1: VZ[1], y: 0, label: '측문' });
    [-31.5, -28.0].forEach(x9 => lamp(0.62, 0.05, 0.3, x9, FH - 0.21, (LOB_Z + fz0)/2));

    addBox(1.4, -YARD, 2.4, STONE, wx0 - 0.85, YARD, SIDE_Z);
    slope('pave', 'z', wx0 - 1.55, wx0 - 0.15, SIDE_Z + 1.2, SIDE_Z + 5.7, 0, YARD, 6);
    addBox(0.15, 0.9 - YARD, 4.5, 0xefe3b8, wx0 - 1.625, YARD, SIDE_Z + 3.45, NS);
  }
  {
    const N = 12, RISE = (FH + 0.3) / 2 / N, TR = 0.2875, LW = (wx1 - STX0 - 0.3) / 2;
    const AX = STX0 + 0.15 + LW / 2, BX = wx1 - 0.15 - LW / 2, Z0 = -38.9, ZL = Z0 - N * TR;
    const SG = 0xa6a6a2;
    for (let i = 0; i < N; i++) addBox(LW, RISE * (i + 1), TR, SG, AX, 0, Z0 - TR * (i + 0.5));
    addBox(wx1 - STX0 - 0.3, RISE * N, ZL - (wz0 + 0.15), SG, (STX0 + wx1) / 2, 0, (ZL + wz0 + 0.15) / 2);
    for (let j = 0; j < N; j++) addBox(LW, 0.3, TR, SG, BX, RISE * (N + j + 1) - 0.3, ZL + TR * (j + 0.5));
    addBox(wx1 - STX0, 0.3, wz1 + 0.02 - Z0, 0xd9dce1, (STX0 + wx1) / 2, FH, (Z0 + wz1 + 0.02) / 2);

    const MX = STX0 + 0.15 + LW, WC = (STX0 + wx1) / 2, WH = 1.6;
    steelRail(MX - 0.07, Z0 - 0.2, MX - 0.07, ZL + 0.15, RISE, RISE * N);
    steelRail(MX + 0.04, ZL + 0.15, MX + 0.04, Z0 - 0.2, RISE * (N + 1), FH + 0.3);
    dRod(STX0 + 0.21, 0.9, Z0, STX0 + 0.21, 0.9 + RISE * N, ZL, 0.03, 0x8a5a3b);
    dRod(wx1 - 0.21, 0.9 + RISE * N, ZL, wx1 - 0.21, 0.9 + FH + 0.3, Z0, 0.03, 0x8a5a3b);
    steelRail(STX0 + 0.3, wz0 + 0.35, wx1 - 0.3, wz0 + 0.35, RISE * N);

    steelRail(STX0 + 0.3, Z0 + 0.08, MX - 0.1, Z0 + 0.08, FH + 0.3);
    colliders.push(noStand({ x0: STX0 + 0.15, x1: MX, y0: FH + 0.3, y1: FH + 1.9, z0: Z0, z1: Z0 + 0.16, nc: true }));
    floorQ('tileG', STX0 + 0.15, wx1 - 0.15, Z0, wz1 + 0.02, FH + 0.3, 0xa9aaa7);
    patQuad('cflat', STX0 + 0.15, wx1 - 0.15, Z0 + 0.01, fz0, FH - 0.012, true);

    addBox(wx1 - STX0 - 0.3, FH - 2.95, 0.3, 0xf2eee4, WC, 2.95, fz0, { collide: false });
    dBox(0.4, 0.15, 0.03, 0x9aa0a6, WC, 3.05, fz0 + 0.165);

    addBox(WC - WH - STX0, 0.3, 0.3, WALL, (STX0 + WC - WH) / 2, FH, wz0);
    addBox(wx1 + 0.15 - (WC + WH), 0.3, 0.3, WALL, (WC + WH + wx1 + 0.15) / 2, FH, wz0);
    addBox(0.3, 0.3, Z0 - (wz0 + 0.15), WALL, wx1, FH, (Z0 + wz0 + 0.15) / 2);
    { const FC = 0x7a5a3e;
      glassPane('x', 2 * WH, 0.3, WC, FH, wz0);
      [-1, 1].forEach(sd => dBox(0.06, 0.3, 0.2, FC, WC + sd * (WH - 0.03), FH, wz0));
      [-0.8, 0, 0.8].forEach(o => dBox(0.05, 0.3, 0.2, FC, WC + o, FH, wz0));
      dBox(2 * WH - 0.12, 0.05, 0.17, FC, WC, 2.88, wz0);
      lamp(2 * WH - 0.14, 0.81, 0.03, WC, 2.07, wz0 + 0.05);
      dBox(2 * WH - 0.12, 0.05, 0.17, FC, WC, 4.98, wz0); }

    for (let j = 0; j < N; j++) { const za = ZL + TR * j, zb = j === N - 1 ? Z0 + 0.15 : ZL + TR * (j + 1);
      addBox(0.2, RISE * (N + j + 1) - 0.3, zb - za, 0xd3eadf, MX + 0.1, 0, (za + zb) / 2); }

    wallX(MX + 0.2, wx1 - 0.15, Z0, INNER, { face: -1, dado: { top: 1.3, lo: 0xf3e2a0, hi: 0xd3eadf }, gaps: [{ c: wx1 - 0.85, w: 0.9, color: 0xe6dcc4 }] });
    dBox(0.1, 0.1, 0.06, INNER, wx1 - 0.22, 1.0, Z0);
    zones.unshift({ x0: MX + 0.2, x1: wx1 - 0.15, z0: ZL, z1: Z0 - 0.15, y: 0, label: '계단 밑 창고' });

    objScope('trolley', () => { const cx = MX + 0.75, cz = Z0 + 0.75;
      dBox(0.6, 0.06, 0.9, 0x3f8a5a, cx, 0.22, cz); [-1, 1].forEach(s => dBox(0.04, 0.04, 0.9, 0xf2f2ee, cx + s * 0.28, 0.28, cz));
      dRod(cx - 0.28, 0.28, cz + 0.43, cx - 0.28, 1.0, cz + 0.43, 0.018, 0xf2f2ee); dRod(cx + 0.28, 0.28, cz + 0.43, cx + 0.28, 1.0, cz + 0.43, 0.018, 0xf2f2ee);
      dRod(cx - 0.28, 1.0, cz + 0.43, cx + 0.28, 1.0, cz + 0.43, 0.018, 0xf2f2ee);
      [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.38], [0.24, 0.38]].forEach(([ox, oz]) => dCyl(0.07, 0.07, 0.05, 0x2b2b2b, cx + ox, 0.08, cz + oz, { rot: [0, 0, Math.PI / 2], seg: 10 }));
      [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.38], [0.24, 0.38]].forEach(([ox, oz]) => dBox(0.04, 0.1, 0.04, 0x9aa0a6, cx + ox, 0.12, cz + oz));
      colliders.push(noStand({ x0: cx - 0.32, x1: cx + 0.32, y0: 0, y1: 1.05, z0: cz - 0.47, z1: cz + 0.47 })); });

    patQuad('tactX', AX - LW / 2 + 0.15, AX + LW / 2 - 0.15, Z0 + 0.25, Z0 + 0.65, 0.022);
    [AX, BX].forEach(x9 => patQuad('tactX', x9 - LW / 2 + 0.15, x9 + LW / 2 - 0.15, ZL - 0.5, ZL - 0.1, RISE * N + 0.01));
    patQuad('tactX', BX - LW / 2 + 0.15, BX + LW / 2 - 0.15, Z0 + 0.15, Z0 + 0.55, FH + 0.3 + 0.022);

    const BAND = [0x9a7cc0, 0x7ab36a, 0xe89a52, 0x6f9fd6];
    for (let i = 0; i < N; i++) {
      dBox(LW, 0.03, 0.05, 0x6b6b67, AX, RISE * (i + 1), Z0 - TR * i - 0.025);
      dBox(LW, 0.03, 0.05, 0x6b6b67, BX, RISE * (N + i + 1), ZL + TR * i + 0.025);
      if (i % 3 === 1) { dBox(LW - 0.5, 0.06, 0.03, BAND[(i / 3) | 0], AX, RISE * i + 0.05, Z0 - TR * i + 0.015);
        dBox(LW - 0.5, 0.06, 0.03, BAND[((i / 3) | 0) ^ 1], BX, RISE * (N + i) + 0.05, ZL + TR * i - 0.015); }
    }

    const SY = 0xf3e2a0, SM = 0xd3eadf, PQ = new Map();
    const paint = (ax, line, f, a0, a1, b0, b1, t0, t1, hex, off = 0.01) => {
      if (a1 - a0 < 0.01 || (t0 - b0) + (t1 - b1) < 0.004 || t0 < b0 - 1e-6 || t1 < b1 - 1e-6) return;
      const L = line + f * off, P = ax === 'z' ? [[L, b0, a0], [L, b1, a1], [L, t1, a1], [L, t0, a0]] : [[a0, b0, L], [a1, b1, L], [a1, t1, L], [a0, t0, L]];
      const u = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], v = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
      const nn = ax === 'z' ? u[1] * v[2] - u[2] * v[1] : u[0] * v[1] - u[1] * v[0];
      let arr = PQ.get(hex); if (!arr) PQ.set(hex, arr = []);
      for (const i of (nn * f < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3])) arr.push(...P[i]);
    };
    const tone = (ax, line, f, a0, a1, B, D, T) => {
      const ts = [0, 1], cr = (P, Q) => { const d0 = P[0] - Q[0], d1 = P[1] - Q[1]; if (d0 * d1 < 0) ts.push(d0 / (d0 - d1)); };
      cr(B, D); cr(B, T); cr(D, T); ts.sort((p, q) => p - q);
      const at = (P, t) => P[0] + (P[1] - P[0]) * t;
      for (let k = 0; k < ts.length - 1; k++) {
        const u = ts[k], v = ts[k + 1]; if (v - u < 1e-4) continue;
        const b = [at(B, u), at(B, v)], t = [at(T, u), at(T, v)], d = [Math.max(b[0], Math.min(at(D, u), t[0])), Math.max(b[1], Math.min(at(D, v), t[1]))];
        paint(ax, line, f, at([a0, a1], u), at([a0, a1], v), b[0], b[1], d[0], d[1], SY);
        paint(ax, line, f, at([a0, a1], u), at([a0, a1], v), d[0], d[1], t[0], t[1], SM);
      }
    };
    const K = (v) => [v, v], TOP = K(FH * 2), up = 1.3, zS = wz1 - 0.15, z2 = wz1 - B.upper.corridorDepth - 0.15;
    const byW = z => (Z0 - z) / TR * RISE, byE = z => RISE * N + (z - ZL) / TR * RISE;

    const WX = STX0 + 0.15;
    tone('z', WX, 1, wz0 + 0.15, ZL, K(RISE * N - 0.01), K(RISE * N + up), TOP);
    tone('z', WX, 1, ZL, Z0, [byW(ZL), 0], [byW(ZL) + up, up], TOP);
    tone('z', WX, 1, Z0, zS, K(0), K(up), K(FH));
    tone('z', WX, 1, Z0, z2, K(FH + 0.3), K(FH + 0.3 + up), TOP);

    const EX = wx1 - 0.15;
    tone('z', EX, -1, wz0 + 0.15, ZL, K(RISE * N - 0.01), K(RISE * N + up), TOP);
    tone('z', EX, -1, ZL, Z0, [byE(ZL), byE(Z0)], [byE(ZL) + up, byE(Z0) + up], TOP);
    tone('z', EX, -1, Z0, -38.8, K(0), K(up), K(FH)); tone('z', EX, -1, -38.8, -37.0, K(2.6), K(2.6), K(FH)); tone('z', EX, -1, -37.0, zS, K(0), K(up), K(FH));
    tone('z', EX, -1, Z0, -35.8, K(FH + 0.3), K(FH + 0.3 + up), TOP); tone('z', EX, -1, -35.8, -34.6, K(FH + 0.3), K(FH + 0.3 + up), K(FH + 1.2));
    tone('z', EX, -1, -35.8, -34.6, K(FH + 2.6), K(FH + 2.6), TOP); tone('z', EX, -1, -34.6, zS, K(FH + 0.3), K(FH + 0.3 + up), TOP);

    const NZ = wz0 + 0.15;
    tone('x', NZ, 1, STX0 + 0.15, WC - WH, K(RISE * N - 0.01), K(RISE * N + up), TOP); tone('x', NZ, 1, WC + WH, wx1 - 0.15, K(RISE * N - 0.01), K(RISE * N + up), TOP);
    tone('x', NZ, 1, WC - WH, WC + WH, K(RISE * N - 0.01), K(2.0), K(2.0)); tone('x', NZ, 1, WC - WH, WC + WH, K(6.3), K(6.3), TOP);

    for (let j = 0; j < N; j++) { const za = ZL + TR * j, zb = Math.min(Z0, ZL + TR * (j + 1)), tj = RISE * (N + j + 1) - 0.3;
      tone('z', MX, -1, za, zb, [byW(za), byW(zb)], [byW(za) + up, byW(zb) + up], K(tj)); }
    tone('z', MX, -1, Z0, Z0 + 0.15, K(0), K(up), K(FH)); tone('x', Z0 + 0.15, 1, MX, MX + 0.2, K(0), K(up), K(FH));

    const KB = 0x3a3d42, sk = (ax, line, f, a0, a1, b0, b1, h = 0.1) => paint(ax, line, f, a0, a1, b0, b1, b0 + h, b1 + h, KB, 0.015);
    const F1 = 0.014, FL = RISE * N + 0.002, F2 = FH + 0.3 + 0.014;
    sk('z', WX, 1, wz0 + 0.15, ZL, FL, FL); sk('z', WX, 1, ZL, Z0, byW(ZL), 0, RISE + 0.1);
    sk('z', WX, 1, Z0, fz0 - 1.9, F1, F1); sk('z', WX, 1, fz0 - 0.9, zS, F1, F1); sk('z', WX, 1, Z0, z2, F2, F2);
    sk('z', EX, -1, ZL, Z0, byE(ZL), byE(Z0), RISE + 0.1);
    sk('z', EX, -1, Z0, -38.8, F1, F1); sk('z', EX, -1, -37.0, zS, F1, F1); sk('z', EX, -1, Z0, zS, F2, F2);
    sk('x', NZ, 1, STX0 + 0.15, wx1 - 0.15, FL, FL);
    for (let j = 0; j < N; j++) { const za = ZL + TR * j, zb = Math.min(Z0, ZL + TR * (j + 1)), tj = RISE * (N + j + 1) - 0.3;
      if (tj > byW(za) + RISE + 0.1) sk('z', MX, -1, za, zb, byW(za), byW(zb), RISE + 0.1); }
    sk('z', MX, -1, Z0, Z0 + 0.15, F1, F1); sk('x', Z0 + 0.15, 1, MX, MX + 0.2, F1, F1);
    for (const [hex, arr] of PQ) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); dGeo(g, new THREE.Matrix4(), hex, { at: [WC, (wz0 + fz0) / 2] }); g.dispose(); }

    zones.push({ x0: STX0, x1: wx1, z0: wz0, z1: Z0, y: RISE * N, label: '계단참' });
    zones.push({ x0: STX0, x1: wx1, z0: Z0 - 1.0, z1: wz1 - B.upper.corridorDepth, y: FH + 0.3, label: '2층 계단' });
  }
  addBox(STX0 - wx0, 0.3, wz1 - wz0 + 0.02, 0xd9dce1, (wx0 + STX0)/2, FH, (wz0 + wz1)/2 + 0.01);
  ceil(wx0, STX0, wz0, KBZ + 0.16, FH, 'ctile');
  ceil(LOB_X0, STX0, KBZ - 0.16, fz0 + 0.16, FH, 'ctile');
  {
    const zc2 = wz1 - B.upper.corridorDepth;
    B.upper.rooms.forEach((r, i) => {
      const [s0, s1] = r.span, cx = (s0+s1)/2;
      if (i > 0) addBox(0.3, FH-0.3, zc2-wz0-0.3, INNER, s0, FH+0.3, (wz0+zc2)/2);
      floorQ('wood', s0 + 0.15, s1 - 0.15, wz0 + 0.15, zc2 - 0.15, FH + 0.3);
      const nD = (s1 - s0) > 7 ? 3 : 1;
      if (r.type === 'classroom') westClass(r.name, s0 + 0.15, s1 - 0.15, zc2 - 0.15, wz0 + 0.15, FH + 0.3, { sill: 0.8 });
      else for (let d = 0; d < nD; d++) { studentDesk(cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3); chair(cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3.65, 1); }
      hangSign(r.name, doorC(r), FH + 0.3 + 2.72, zc2, 1);
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: zc2, y: FH+0.3, label: r.name });
      [1, 2].forEach(k => lamp(1.2, 0.05, 0.22, cx, FH*2 - 0.21, wz0 + k * 2.6));
      ceil(s0, s1, wz0, zc2, FH * 2, 'ctile');
    });
    zones.push({ x0: wx0, x1: wx1, z0: zc2, z1: wz1, y: FH+0.3, label: '2층 복도' });

    const upWins = B.upper.rooms.filter(twoDoor).map(r => { const a = doorC(r) + 0.95, b = backDoor(r).c - 0.95; return { c: (a + b) / 2, w: b - a, sill: 1.2, dh: 2.4, win: true, frame: 0x6b4a32 }; });
    wallX(wx0 + 0.15, STX0 + 0.15, zc2, INNER, { y0: FH+0.3, h: FH-0.3, face: -1, dado: { top: 1.15, lo: 0xf3e2a0, hi: 0xd3eadf }, gaps: [...B.upper.rooms.map(r => ({ c: doorC(r), w: 1.2 })), ...B.upper.rooms.filter(twoDoor).map(backDoor), ...upWins] });
    { const sd = B.upper.rooms.find(r => r.name === '소담실');
      hangSign('상담실', doorC(sd), FH + 0.3 + 2.38, zc2, 1);
      dBox(1.3, 0.95, 0.04, 0x8a6a45, -17.6, FH + 1.3, zc2 + 0.17); patWall('kidsArt', 'x', -18.2, -17.0, FH + 1.35, FH + 2.2, zc2 + 0.192, 1);
      dBox(0.25, 0.45, 0.04, 0xc0c4c8, -16.3, FH + 1.2, zc2 + 0.17);
      dCyl(0.07, 0.07, 0.04, 0xd8342c, -16.3, FH + 1.5, zc2 + 0.19, { rot: [Math.PI / 2, 0, 0], seg: 10 });
      dCyl(0.03, 0.03, 0.03, 0xe84a3a, -16.3, FH + 1.3, zc2 + 0.19, { rot: [Math.PI / 2, 0, 0], seg: 8 }); }
    {
      const Y = FH + 0.3, x9 = STX0 - 0.15 - 0.34, z9 = -39.6;
      objScope('fridge', () => {
      dBox(0.68, 1.8, 0.7, 0xe9ebec, x9, Y, z9);
      dBox(0.03, 0.03, 0.66, 0xb9bdc0, x9 - 0.355, Y + 1.18, z9);
      [[Y + 1.28, 0.3], [Y + 0.72, 0.38]].forEach(([y9, h9]) => dBox(0.04, h9, 0.03, 0x9aa0a6, x9 - 0.36, y9, z9 + 0.27));
      dBox(0.03, 0.1, 0.16, 0x7ab36a, x9 - 0.355, Y + 1.45, z9 - 0.15);
      colliders.push(noStand({ x0: x9 - 0.34, x1: x9 + 0.34, y0: Y, y1: Y + 1.8, z0: z9 - 0.35, z1: z9 + 0.35 })); }); }
    wallZ(wz0, zc2, STX0, INNER, { y0: FH+0.3, h: FH-0.3, face: -1, dado: STAIR_DADO });
    floorQ('tileG', wx0 + 0.15, STX0 + 0.15, zc2 + 0.15, wz1 - 0.15, FH + 0.3, 0xa9aaa7);
    ceil(wx0, wx1, zc2, wz1, FH * 2, 'cflat');
    for (let x9 = wx0 + 2; x9 < wx1 - 1; x9 += 3.6) lamp(0.62, 0.05, 0.3, x9, FH * 2 - 0.21, (zc2 + wz1)/2);
  }
  addBox(wx1-wx0+0.8, 0.3, wz1-wz0+0.8, 0xd9dce1, (wx0+wx1)/2, FH*2, (wz0+wz1)/2);
  addBox(wx1-wx0+0.8, 0.45, 0.3, 0xc98a4e, (wx0+wx1)/2, FH*2+0.3, wz0-0.25, { collide: false });
  {
    const XW = wx0 - 0.15, NAVY = { bg: 'none', fg: '#26306e' };
    [...SCHOOL.name].forEach((ch, k, A) => sign(ch, XW - 0.03, FH * 2 - 0.55, -41.4 + (k - (A.length - 1) / 2) * 0.78, -Math.PI / 2, 0.72, NAVY));
    const CZ0 = SIDE_Z - 1.7, CZ1 = wz1 - 0.35, CY = FH + 0.3, CD = 1.05, ST9 = 0xc8ccd0;
    addBox(CD, 0.45, CZ1 - CZ0, 0xb6b8b4, XW - CD / 2, CY - 0.45, (CZ0 + CZ1) / 2, { collide: false });
    colliders.push({ x0: XW - CD, x1: XW, y0: CY - 0.45, y1: CY, z0: CZ0, z1: CZ1, nc: true });
    const XR = XW - CD + 0.06;
    for (let z9 = CZ0 + 0.06, n9 = Math.round((CZ1 - CZ0 - 0.12) / 1.2), k = 0; k <= n9; k++, z9 = CZ0 + 0.06 + (CZ1 - CZ0 - 0.12) * k / n9) dRod(XR, CY, z9, XR, CY + 1.0, z9, 0.025, ST9);
    [0.12, 0.55, 1.0].forEach(h9 => { dRod(XR, CY + h9, CZ0 + 0.06, XR, CY + h9, CZ1 - 0.06, h9 === 1.0 ? 0.025 : 0.015, ST9); [CZ0 + 0.06, CZ1 - 0.06].forEach(z9 => dRod(XR, CY + h9, z9, XW - 0.02, CY + h9, z9, 0.015, ST9)); });
    for (let z9 = CZ0 + 0.2; z9 < CZ1 - 0.1; z9 += 0.15) dRod(XR, CY + 0.12, z9, XR, CY + 1.0, z9, 0.007, ST9);
    [-0.2, 0.2].forEach(o => dRod(XW - 0.2, CY + 0.4, CZ0 - 0.7 + o, XW - 0.2, FH * 2 + 1.1, CZ0 - 0.7 + o, 0.02, ST9));
    for (let y9 = CY + 0.7; y9 < FH * 2 + 1.0; y9 += 0.3) dRod(XW - 0.2, y9, CZ0 - 0.9, XW - 0.2, y9, CZ0 - 0.5, 0.012, ST9);
    roofRail(wx0 - 0.3, wz0 - 0.05, wx0 - 0.3, wz1 + 0.3, FH * 2 + 0.3); }
  {
    const ORG = 0xc98a4e, I9 = 0.06, xa = wx0 - 0.15 + I9, xb = wx1 + 0.25, za = wz0 - 0.15, zb = wz1 - 0.15 - I9, SW = [(STX0 + wx1)/2 - 1.62, (STX0 + wx1)/2 + 1.62];
    [[2.6, 0.2], [FH + 0.3 + 0.6, 0.14]].forEach(([y9, h9]) => {
      [[xa, SW[0]], [SW[1], xb]].forEach(([a, b]) => dBox(b - a, h9, 0.1, ORG, (a + b)/2, y9, wz0 - 0.2));
      dBox(0.1, h9, zb - za, ORG, wx1 + 0.2, y9, (za + zb)/2);
    });
    dBox(wx1 - wx0 + 0.85, 0.3, 0.05, ORG, (wx0 + wx1)/2 + 0.025, FH*2, wz0 - 0.425);
    dBox(0.05, 0.3, wz1 - wz0 + 0.8, ORG, wx1 + 0.425, FH*2, (wz0 + wz1)/2);
    for (const w of winLog) if (w.ax === 'x' && Math.abs(w.line - wz0) < 0.01 && w.f === -1 && w.y0 === 0 && w.g1 < STX0)
      dBox(w.g1 - w.g0 + 0.3, 0.12, 0.16, ORG, (w.g0 + w.g1)/2, w.yb - 0.17, wz0 - 0.23);
  }

  const K = B.kitchen, [kx0, kx1] = K.x, [kz0, kz1] = K.z, KH = K.wallHeight;
  foundation(kx0 - 0.15, kx1, kz0 - 0.15, kz1);
  if (LC.z[0] - kz0 > 0.3) foundation(kx1, kx1 + 0.15, kz0 - 0.15, LC.z[0] - 0.15);

  const KYEL = 0xe9c35c, KWIN = 0xe9ecec;
  wallX(kx0 - 0.15, kx1 + 0.15, kz0, KYEL, { h: KH, face: -1, ext: true, gaps: [{ c: K.backDoorC, w: 1.2 }] });
  wallZ(kz0, kz1, kx0, KYEL, { h: KH, face: -1, ext: true, gaps: [{ c: -39.55, w: 1.0, dh: 2.3, glass: true, door: true, color: 0x8a9096 },
    { c: -36.9, w: 1.0, sill: 1.1, dh: 2.0, win: true, frame: KWIN }, ...[-41.35, -43.85].map(c => ({ c, w: 2.2, sill: 0.95, dh: 3.3, win: true, frame: KWIN }))] });

  wallRun('z', kz0 + 0.15, LC.z[0], kx1, WALL, { h: KH, face: 1, skin: 'panelB' });

  const LBZ = CL.z[0] - 0.1, LZS = LBZ - 0.5, LZN = K.cornerDoorZ + 0.9, LBU = (LZS - LZN - 1.2) / 9.5;
  const LW = [3.5, 3, 3].map(k => k * LBU), LBAY = LW.map((w, i) => [LZS - LW.slice(0, i).reduce((a, b) => a + b, 0) - 0.6 * i - w / 2, w]);
  const LPIL = [LZS - LW[0] - 0.3, LZS - LW[0] - LW[1] - 0.9];
  wallRun('z', Math.max(LC.z[0], kz0 + 0.15), LBZ, kx1, 0xbcc8ca, { h: FH, inner: true, face: -1, gaps: [{ c: K.cornerDoorZ, w: 1.0, dh: 2.2, glass: true, color: 0x2a2e33 }, ...LBAY.map(([c, w]) => ({ c, w, sill: 0.55, dh: 2.7, win: true, frame: 0xe8ecec }))] });
  LBAY.forEach(([c, w]) => {
    dBox(0.16, 0.05, w, 0xf0ede4, kx1 + 0.23, 0.5, c);

    patWall('film2', 'z', c - w/2 + 0.06, c + w/2 - 0.06, 0.61, 1.1, kx1 + 0.09, 1, 0xc9cfd2);
    [[1.1, 2.4, 0x3c4843], [2.4, 2.64, 0x56625d]].forEach(([y0, y1, t9]) => patPush('cflat', [[kx1 + 0.09, y0, c - w/2 + 0.06], [kx1 + 0.09, y0, c + w/2 - 0.06], [kx1 + 0.09, y1, c + w/2 - 0.06], [kx1 + 0.09, y1, c - w/2 + 0.06]],
      [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [1, 0, 0], t9));
  });
  LPIL.forEach(c => addBox(0.25, FH, 0.6, 0xece6d6, kx1 + 0.275, 0, c));
  wallRun('z', LBZ, kz1 - 0.15, kx1, 0x9a8a78, { h: FH, inner: true, innerHex: 0xbcc8ca, face: 1 });
  patWall('brickW', 'z', LBZ, kz1 - 0.15, 0, FH, kx1 + 0.162, 1);
  wallRun('z', Math.max(LC.z[0], kz0 + 0.15), kz1 - 0.15, kx1, WALL, { y0: FH, h: KH - FH, face: 1, innerHex: 0xbcc8ca });
  addBox(0.35, FH, 0.65, 0x8e4f3c, kx1 + 0.325, 0, K.cornerDoorZ - 0.825);
  patWall('brickW', 'z', K.cornerDoorZ - 1.14, K.cornerDoorZ - 0.51, 0, FH, kx1 + 0.512, 1, 0x8c7c78);
  patWall('brickW', 'x', kx1 + 0.16, kx1 + 0.49, 0, FH, K.cornerDoorZ - 0.488, 1, 0x8c7c78);
  { const dz = K.cornerDoorZ, cr = 0xe6dfcc;
    dBox(0.18, 0.12, 1.15, cr, kx1 + 0.24, 2.28, dz + 0.075); dBox(0.06, 0.08, 1.08, cr, kx1 + 0.18, 2.2, dz + 0.04);
    dBox(0.06, 2.2, 0.08, cr, kx1 + 0.18, 0, dz + 0.54); }
  patQuad('gmat', kx1 + 0.15, kx1 + 1.1, K.cornerDoorZ - 0.5, K.cornerDoorZ + 0.5, 0.02, false, 0x9fd49a);
  exitSign(kx1 + 0.15, K.cornerDoorZ, 2.6, [1, 0]);

  const HX = K.hallX0, AZ = K.curtainZ, PX = K.passX, SZ = K.serveZ, SC = (SZ[0] + SZ[1]) / 2, Dm = K.dutyRoom, HALLC = 0xbcc8ca;

  const NU = K.nutri, CHAMP = 0xcdbf9f;
  wallZ(kz0, kz1, HX, HALLC, { h: KH, inner: true, face: 1, innerHex: 0xe9ecea, gaps: [{ c: NU.doorZ, w: 0.9, color: 0xf2f2ee }, { c: SC + 0.1 - 1.3, w: 2.25, sill: 1.0, dh: 2.1 }, { c: SC + 0.1 + 1.3, w: 2.25, sill: 1.0, dh: 2.1 }, { c: K.kitchenDoorZ, w: 1.4, glass: true, color: 0xc8ccd0 }] });

  const SGD = HX + 0.75, SGP = HX + 2.0;
  wallX(HX + 0.15, kx1 - 0.15, AZ, HALLC, { h: KH, inner: true, face: 1, gaps: [{ c: SGD, w: 0.9, glass: true, door: true, color: CHAMP }, { c: SGP, w: 1.3, sill: 0.1, dh: 2.6, win: true, frame: CHAMP }, { c: PX + 0.65, w: 1.0, dh: 2.9 }] });
  [1, -1].forEach(f9 => patPush('cflat', [[SGP - 0.59, 0.16, AZ + f9 * 0.086], [SGP + 0.59, 0.16, AZ + f9 * 0.086], [SGP + 0.59, 2.54, AZ + f9 * 0.086], [SGP - 0.59, 2.54, AZ + f9 * 0.086]].map(v => f9 > 0 ? v : [v[0], v[1], v[2]]),
    [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, f9], 0xdde3e2));
  wallX(PX - 0.15, kx1 - 0.15, K.cornerDoorZ - 0.9, INNER, { h: KH });
  wallZ(K.cornerDoorZ - 0.9 + 0.15, AZ - 0.15, PX, INNER, { h: KH });

  floorQ('tileG', HX + 0.15, kx1 - 0.15, AZ + 0.15, kz1 - 0.15, 0, 0xd2d1ca);
  floorQ('ttile', kx0 + 0.15, NU.x[0] - 0.075, kz0 + 0.15, Dm.z[0] - 0.15, 0, 0xf2dcd0);
  floorQ('ttile', NU.x[0] - 0.075, HX - 0.15, NU.z[1] + 0.075, Dm.z[0] - 0.15, 0, 0xf2dcd0);
  floorQ('ttile', Dm.x[1] + 0.15, HX - 0.15, Dm.z[0] - 0.15, kz1 - 0.15, 0, 0xf2dcd0);
  floorQ('tileW', PX + 0.15, kx1 - 0.15, kz0 + 0.15, AZ - 0.15, 0, 0xd9d6cc);
  floorQ('wood', HX + 0.15, PX - 0.15, kz0 + 0.15, AZ - 0.15, 0, 0xf0e6d6);
  floorQ('tileW', Dm.x[0] + 0.15, Dm.x[1] - 0.15, Dm.z[0] + 0.15, kz1 - 0.15, 0, 0xf2e6cf);

  const XF = HX + 0.15, SL = SZ[1] - SZ[0];
  objScope('counter', () => {
  addBox(0.9, 0.85, SL, 0xc9ced3, XF + 0.45, 0, SC, NS);
  dBox(0.95, 0.04, SL + 0.1, 0xdfe3e6, XF + 0.475, 0.85, SC);
  [[0xf4f1e8, 'rice'], [0xc86a3a, 'soup'], [0xc8452c], [0x6fa04f], [0xe8c35a]].forEach(([col, k], i) => {
    const zc = SZ[0] + 0.62 + i * (SL - 1.24) / 4;
    if (k === 'soup') { dCyl(0.3, 0.27, 0.34, 0xb9bec2, XF + 0.42, 0.89, zc, { seg: 12 }); dCyl(0.26, 0.26, 0.02, col, XF + 0.42, 1.2, zc, { seg: 12 }); }
    else { dBox(0.5, 0.07, 0.8, 0xb9bec2, XF + 0.42, 0.89, zc); dBox(0.44, 0.04, 0.72, col, XF + 0.42, 0.96, zc, { jitter: 0.1 }); }
  });
  { const bx = XF + 0.18, bz = SZ[1] - 0.07; dBox(0.08, 0.15, 0.08, 0x9fd67a, bx, 0.89, bz); dBox(0.07, 0.04, 0.03, 0xf2f2ee, bx + 0.02, 1.04, bz); }
  dBox(0.3, 0.04, SL, 0xdfe3e6, XF + 1.05, 0.8, SC); });

  sign('자율', XF + 0.02, 1.32, SC + 0.1, Math.PI / 2, 0.17, { bg: '#b8e07a', fg: '#23401c' });
  sign('세척실', XF + 0.03, 2.5, K.kitchenDoorZ, Math.PI / 2, 0.15, { bg: '#2a4a7a', fg: '#ffffff' }); sign('관계자 외 출입금지', XF + 0.03, 1.75, K.kitchenDoorZ - 0.95, Math.PI / 2, 0.1, { bg: '#f4f4f0', fg: '#b03030' });
  { const bx = XF + 0.18, bz = SZ[1] - 0.07;
    hotspots.push({ kind: 'wash', pump: true, x: XF + 1.3, z: bz, y: 0, r: 0.9, label: '손 소독하기', at: [bx, 1.08, bz] }); }
  hotspots.push({ kind: 'meal', x: XF + 1.6, z: SC, y: 0, r: 1.8, label: '급식 받기', at: [XF + 1.05, 0.85, SC] });
  {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 224; const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 224); bg.addColorStop(0, '#fff6d9'); bg.addColorStop(1, '#ffe7b8'); g.fillStyle = bg; g.fillRect(0, 0, 1024, 224);
    [['#f7b7c6', 60, 40], ['#bfe3f5', 300, 150], ['#c9ecb5', 700, 60], ['#ffd28a', 930, 170]].forEach(([c, x, y]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, 70, 0, 7); g.fill(); });
    const kid = (x, hair, shirt, arm) => {
      g.fillStyle = shirt; g.beginPath(); g.ellipse(x, 205, 62, 50, 0, 0, 7); g.fill();
      g.fillStyle = '#f7d0ae'; g.beginPath(); g.arc(x, 112, 56, 0, 7); g.fill();
      g.fillStyle = hair; g.beginPath(); g.arc(x, 100, 58, Math.PI * 1.02, Math.PI * 1.98); g.fill(); g.fillRect(x - 58, 88, 20, 30); g.fillRect(x + 38, 88, 20, 30);
      g.fillStyle = '#2a2222'; [x - 20, x + 20].forEach(ex => { g.beginPath(); g.arc(ex, 116, 6, 0, 7); g.fill(); });
      g.fillStyle = '#f4a3a0'; [x - 34, x + 34].forEach(ex => { g.beginPath(); g.arc(ex, 132, 9, 0, 7); g.fill(); });
      g.strokeStyle = '#b0504a'; g.lineWidth = 5; g.beginPath(); g.arc(x, 132, 14, 0.15, Math.PI - 0.15); g.stroke();
      if (arm) { g.strokeStyle = '#f7d0ae'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 50, 190); g.lineTo(x + 95, 60 + arm); g.stroke(); }
    };
    kid(170, '#3a2e28', '#e0503c', 0); kid(430, '#4a3426', '#3f86d6', 12); kid(640, '#2a2220', '#f2c230', 0); kid(880, '#3a2e28', '#6fbf73', 20);
    [[290, '#ffffff'], [540, '#ffffff'], [770, '#ffffff']].forEach(([x, c]) => { g.fillStyle = '#d9574a'; g.beginPath(); g.ellipse(x, 196, 52, 26, 0, 0, Math.PI); g.fill();
      g.fillStyle = c; g.beginPath(); g.ellipse(x, 196, 50, 22, 0, Math.PI, 0); g.fill(); });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mu = new THREE.Mesh(new THREE.PlaneGeometry(SL + 0.4, 1.2), new THREE.MeshLambertMaterial({ map: tex }));
    mu.rotation.y = Math.PI / 2; mu.position.set(XF + 0.034, 2.9, SC); mu.matrixAutoUpdate = false; mu.updateMatrix(); scene.add(mu);
    dBox(0.03, 1.3, SL + 0.5, 0xf2f2ee, XF + 0.015, 2.25, SC);
  }

  [[SZ[1] + 0.55, 0xd8dde0], [SZ[1] + 1.35, 0x5b8fc9]].forEach(([z9, top9], i) => objScope('trolley', () => {
    const cx9 = XF + 0.35;
    colliders.push(noStand({ x0: cx9 - 0.3, x1: cx9 + 0.3, y0: 0, y1: 0.85, z0: z9 - 0.35, z1: z9 + 0.35 }));
    dBox(0.6, 0.04, 0.7, 0xdfe3e6, cx9, 0.8, z9); dBox(0.56, 0.03, 0.66, 0xc9ced3, cx9, 0.2, z9);
    [[-0.26, -0.31], [0.26, -0.31], [-0.26, 0.31], [0.26, 0.31]].forEach(([ox, oz]) => dBox(0.03, 0.8, 0.03, METAL, cx9 + ox, 0, z9 + oz));
    if (i === 0) dBox(0.42, 0.3, 0.54, top9, cx9, 0.84, z9);
    else [-0.14, 0.14].forEach(oz => dBox(0.32, 0.14, 0.2, top9, cx9, 0.84, z9 + oz));
  }));
  sign('식판 · 수저', XF + 0.04, 1.95, SZ[1] + 0.95, Math.PI / 2, 0.18);

  greenBoard('z', K.kitchenDoorZ + 0.95, kz1 - 1.75, XF, 1, 1.1, 2.2, 'notice');

  [[XF, K.exitC - 0.5], [K.exitC + 0.5, K.doorC - 0.9], [K.doorC + 0.9, kx1 - 0.15]].forEach(([a9, b9]) => { if (b9 - a9 > 0.3) patWall('wood', 'x', a9 + 0.06, b9 - 0.06, 0.02, 1.0, kz1 - 0.15 - 0.012, -1, 0xfff4e4); });
  patWall('wood', 'z', AZ + 0.21, kz1 - 0.21, 0.02, 1.0, kx1 - 0.15 - 0.012, -1, 0xfff4e4);

  { const rz = kz1 - 0.15, RX = [K.staffC - 1.9, K.staffC - 0.95];
    RX.forEach((x9, i) => objScope('trolley', () => {
      colliders.push(noStand({ x0: x9 - 0.45, x1: x9 + 0.45, y0: 0, y1: 0.85, z0: rz - 0.66, z1: rz - 0.04 }));
      dBox(0.86, 0.66, 0.56, 0xc9ced3, x9, 0.12, rz - 0.35); dBox(0.9, 0.04, 0.6, 0xdfe3e6, x9, 0.78, rz - 0.35);
      dBox(0.8, 0.1, 0.5, 0x2a2c30, x9, 0.02, rz - 0.35);
      dBox(0.86, 0.3, 0.03, 0xd3d8dc, x9, 0.82, rz - 0.07);
      dBox(0.44, i ? 0.18 : 0.26, 0.5, 0xd8dde0, x9 - 0.18, 0.82, rz - 0.36);
    }));
    const tx9 = RX[1] - 0.18, tz9 = rz - 0.36;
    sign('식판 반납', (RX[0] + RX[1]) / 2, 1.62, rz - 0.02, Math.PI, 0.2);
    dCyl(0.2, 0.2, 0.04, 0xf5f3ec, (RX[0] + RX[1]) / 2, 2.9, rz - 0.02, { rot: [Math.PI / 2, 0, 0], seg: 16 }); dCyl(0.02, 0.02, 0.05, 0x2a2a2a, (RX[0] + RX[1]) / 2, 2.9, rz - 0.05, { rot: [Math.PI / 2, 0, 0], seg: 6 });
    hotspots.push({ kind: 'trayback', x: (RX[0] + RX[1]) / 2, z: rz - 1.25, y: 0, r: 1.4, label: '식판 반납하기', at: [tx9, 1.02, tz9] });

    const sx = K.staffC; dBox(1.0, 2.1, 0.04, 0xc9ced3, sx, 0, rz - 0.02); dBox(0.3, 0.4, 0.03, 0x9fb0bb, sx, 1.35, rz - 0.055); dBox(0.13, 0.03, 0.05, 0x8a9096, sx - 0.35, 1.0, rz - 0.065);
    sign('관계자 외 출입금지', sx, 2.3, rz - 0.02, Math.PI, 0.12, { bg: '#f4f4f0', fg: '#b03030' });
  }

  { const fx9 = XF + 0.36, fz = [kz1 - 0.15 - 0.36, kz1 - 0.15 - 1.08];
    objScope('fridge', () => {
    fz.forEach(z9 => { addBox(0.66, 1.85, 0.68, 0xe9eaec, fx9, 0, z9, NS);
      dBox(0.04, 1.3, 0.56, 0x1e2226, fx9 + 0.34, 0.3, z9); dBox(0.04, 0.24, 0.6, 0xf6f6f2, fx9 + 0.34, 1.6, z9); dBox(0.05, 0.5, 0.04, 0x8a9096, fx9 + 0.37, 0.7, z9 - 0.22);
    });
    sign('우유', fx9 + 0.37, 1.72, (fz[0] + fz[1]) / 2, Math.PI / 2, 0.14, { bg: '#f6f6f2', fg: '#2a62b0' }); });
    hotspots.push({ kind: 'milk', x: fx9 + 1.05, z: (fz[0] + fz[1]) / 2, y: 0, r: 0.9, label: '우유 꺼내기' }); }

  greenBoard('x', K.exitC + 0.75, K.doorC - 1.15, kz1 - 0.15, -1, 1.2, 2.2, 'notice');
  sign('이번 주 식단', (K.exitC + K.doorC) / 2, 2.42, kz1 - 0.19, Math.PI, 0.18);
  [[K.doorC - 0.95 - 0.3, 0.25, 0.7, 0x2a2c30], [K.doorC - 0.95 - 0.85, 0.2, 0.36, 0x3f7fd6]].forEach(([x9, r9, h9, c9]) => objScope('bin', () => {
    dCyl(r9, r9 * 0.88, h9, c9, x9, 0, kz1 - 0.45, { seg: 12 });
    allBoxes.push({ x0: x9 - r9 * 0.7, x1: x9 + r9 * 0.7, y0: 0.01, y1: h9 - 0.01, z0: kz1 - 0.45 - r9 * 0.7, z1: kz1 - 0.45 + r9 * 0.7, detail: true });
    colliders.push(noStand({ x0: x9 - r9, x1: x9 + r9, y0: 0, y1: h9, z0: kz1 - 0.45 - r9, z1: kz1 - 0.45 + r9 })); }));

  { const fw = kx1 - 0.15, fz = kz1 - 0.15 - 1.2;

    objScope('fountain', () => {
    addBox(0.42, 0.78, 0.45, 0xe8eef2, fw - 0.21, 0, fz, NS);
    dBox(0.42, 0.05, 0.45, 0xc9ced3, fw - 0.21, 0.78, fz);
    dBox(0.06, 0.34, 0.45, 0xa8d08c, fw - 0.03, 0.83, fz);
    [-0.1, 0.1].forEach(o => { dCyl(0.016, 0.022, 0.05, 0xd4d8dc, fw - 0.24, 0.83, fz + o, { seg: 8 }); dCyl(0.02, 0.02, 0.03, 0x3a6fc0, fw - 0.06, 0.95, fz + o, { rot: [0, 0, Math.PI / 2], seg: 8 }); }); });
    hotspots.push({ kind: 'water', x: fw - 1.1, z: fz, y: 0, r: 1.0, label: '물 마시기', ats: [-0.1, 0.1].map(o => [fw - 0.24, 0.89, fz + o]) }); }

  const table9 = objWrap((tx, tz) => {
    const TL = 3.4, WF = 0xecebe6;
    colliders.push(noStand({ x0: tx - 0.4, x1: tx + 0.4, y0: 0, y1: 0.72, z0: tz - TL / 2, z1: tz + TL / 2 }));
    [-1, 1].forEach(sd => colliders.push(noStand({ x0: tx + sd * 0.62 - 0.17, x1: tx + sd * 0.62 + 0.17, y0: 0, y1: 0.42, z0: tz - TL / 2, z1: tz + TL / 2 })));
    dBox(0.8, 0.05, TL, 0xa8683a, tx, 0.67, tz);
    [-TL / 2 + 0.1, TL / 2 - 0.1].forEach(oz => { [-0.3, 0.3].forEach(ox => dBox(0.05, 0.67, 0.05, WF, tx + ox, 0, tz + oz)); dBox(0.55, 0.04, 0.036, WF, tx, 0.2, tz + oz); });
    dBox(0.05, 0.04, TL - 0.3, WF, tx, 0.2, tz);
    [-1, 1].forEach(sd => [-1.36, -0.68, 0, 0.68, 1.36].forEach(oz => {
      dCyl(0.16, 0.16, 0.05, 0x9b2c3a, tx + sd * 0.62, 0.4, tz + oz, { seg: 8 });
      dRod(tx + sd * 0.3, 0.2, tz + oz, tx + sd * 0.62, 0.4, tz + oz, 0.022, WF);

      hotspots.push({ kind: 'sit', x: tx + sd * 1.08, z: tz + oz, y: 0, r: 0.55, label: '식탁에 앉기', yaw: -sd * Math.PI / 2, cafe: true,
        seat: { x: tx + sd * 0.62, y: 0.45 - 0.46, z: tz + oz, yaw: -sd * Math.PI / 2, table: [tx + sd * 0.2, 0.72, tz + oz] } });
    }));
  }, 'table');
  [XF + 2.75, XF + 5.15, XF + 7.55].forEach(tx => [-45.9, -41.5, -37.1].forEach(tz => table9(tx, tz)));

  { const cz = AZ + 0.15 + 0.05, c0 = HX + 2.8, o0 = PX + 0.15, o1 = PX + 1.15;
    [[c0, o0 - 0.3], [o1 + 0.3, kx1 - 0.15]].forEach(([a9, b9]) => { patWall('curtain', 'x', a9, b9, 0.05, 3.95, cz, 1); hideSpots.push({ kind: 'curtain', label: '커튼 뒤', x: (a9 + b9) / 2, y: 0, z: cz, face: 180, w: b9 - a9 }); });
    [o0 - 0.15, o1 + 0.15].forEach(x9 => dBox(0.3, 3.9, 0.2, 0x8c8783, x9, 0.05, cz + 0.05));
    dBox(kx1 - 0.15 - c0 + 0.1, 0.4, 0.14, 0x7d7874, (c0 + kx1 - 0.15) / 2, 3.95, cz + 0.02);
    objScope('ac', () => addBox(0.5, 1.8, 0.4, 0xf2f3f4, kx1 - 0.55, 0, AZ + 0.55, NS));
    dRod(c0, KH - 0.4, AZ + 1.3, kx1 - 0.5, KH - 0.4, AZ + 1.3, 0.025, 0xf2f3f4);
    for (let x9 = c0 + 0.6; x9 < kx1 - 0.6; x9 += 1.3) { dRod(x9, KH - 0.4, AZ + 1.3, x9, KH - 0.55, AZ + 1.22, 0.012, 0x3a3d44); dCyl(0.045, 0.06, 0.12, 0x2a2c30, x9, KH - 0.66, AZ + 1.2, { seg: 8, rot: [0.5, 0, 0] }); }
  }

  angleShelf(PX + 1.3, kx1 - 0.2, K.cornerDoorZ - 0.75, 1);
  angleShelf(PX + 1.3, kx1 - 0.2, AZ - 0.15, -1);
  [[PX + 0.45, K.cornerDoorZ - 0.45], [PX + 0.95, K.cornerDoorZ - 0.5]].forEach(([x9, z9], k) => objScope('stand', () => {
    dRod(x9, 0, z9, x9, 1.05, z9, 0.012, 0x222428); [0, 2.1, 4.2].forEach(a => dRod(x9, 0.25, z9, x9 + Math.cos(a + k) * 0.22, 0.01, z9 + Math.sin(a + k) * 0.22, 0.01, 0x222428));
    dBox(0.46, 0.3, 0.03, 0x2a2c30, x9, 1.02, z9 + 0.06);
    colliders.push(noStand({ x0: x9 - 0.24, x1: x9 + 0.24, y0: 0, y1: 1.3, z0: z9 - 0.22, z1: z9 + 0.24 })); }));
  zones.push({ x0: PX, x1: kx1, z0: K.cornerDoorZ - 0.9, z1: AZ, y: 0, label: '악기실' });
  hotspots.push({ kind: 'drum', x: PX + 2.4, z: (K.cornerDoorZ - 0.9 + AZ) / 2, y: 0, r: 1.2, label: '악기 두드리기', at: [PX + 2.4, 0.9, AZ - 0.4] });
  objScope('banner', () => { const bx = kx1 + 0.45, bz = K.cornerDoorZ + 2.0;
    dBox(0.34, 0.05, 0.62, 0x9aa0a6, bx, 0, bz); dBox(0.03, 1.75, 0.58, 0xf6f6f2, bx, 0.05, bz);
    [[1.45, 0x3f4fa8], [1.1, 0x6fa8dc], [0.75, 0xf2c230]].forEach(([y9, c9]) => dBox(0.05, 0.22, 0.52, c9, bx, y9, bz));
    colliders.push(noStand({ x0: bx - 0.17, x1: bx + 0.17, y0: 0, y1: 1.8, z0: bz - 0.31, z1: bz + 0.31 })); });

  steelShelf(HX + 1.05, kz0 + 0.375, 1.8, 0.45);
  steelShelf(HX + 2.85, kz0 + 0.375, 1.5, 0.45);
  objScope('box', () => { addBox(1.2, 0.85, 0.75, 0x1f2023, HX + 4.35, 0, kz0 + 0.525, NS); dBox(1.24, 0.06, 0.79, 0x2a2b2f, HX + 4.35, 0.85, kz0 + 0.525, { jitter: 0.25 }); });
  objScope('box', () => { [[HX + 2.1, AZ - 0.5, 0.6, 0.45, 0.5], [HX + 2.1, AZ - 0.5, 0.45, 0.3, 0.38]].forEach(([x9, z9, w9, h9, d9], k) => dBox(w9, h9, d9, k ? 0xd8b98a : 0xc9a877, x9 + k * 0.05, k ? 0.45 : 0, z9));
  colliders.push(noStand({ x0: HX + 1.8, x1: HX + 2.4, y0: 0, y1: 0.75, z0: AZ - 0.75, z1: AZ - 0.25 })); });
  objScope('ext', () => { dCyl(0.08, 0.08, 0.5, 0xd8322a, HX + 5.15, 0, kz0 + 0.3, { seg: 8 }); colliders.push(noStand({ x0: HX + 5.05, x1: HX + 5.25, y0: 0, y1: 0.55, z0: kz0 + 0.2, z1: kz0 + 0.4 })); });
  dBox(0.42, 0.6, 0.03, 0xf6f6f2, HX + 5.3, 1.3, kz0 + 0.165); dBox(0.36, 0.12, 0.03, 0xd8554a, HX + 5.3, 1.75, kz0 + 0.195);
  { const dx = PX - 0.95;
    objScope('desk', () => { officeDesk(dx, 0, kz0 + 0.5, 1.2, 1); dBox(1.24, 0.5, 0.04, 0xc8ccd0, dx, 0.74, kz0 + 0.17);
    dBox(0.34, 0.16, 0.2, 0x2f5aa8, dx - 0.42, 0.745, kz0 + 0.62); });
    chair(dx - 0.2, 0, kz0 + 1.25, 1, 0xe07a3a); chair(dx - 0.95, 0, AZ - 0.55, 1, 0x9ccc4a);
    dBox(0.03, 0.9, 1.2, 0xfafaf8, PX - 0.165, 1.05, (kz0 + AZ) / 2); dBox(0.04, 0.04, 1.2, 0x9aa0a6, PX - 0.19, 1.01, (kz0 + AZ) / 2); }

  [[kx0 + 0.9, kz0 + 1.1], [kx0 + 2.05, kz0 + 1.1]].forEach(([x9, z9]) => objScope('cook', () => { dCyl(0.55, 0.5, 0.85, 0xb9bec2, x9, 0, z9, { seg: 14 }); dCyl(0.5, 0.5, 0.05, 0x8a9096, x9, 0.85, z9, { seg: 14 });
    colliders.push(noStand({ x0: x9 - 0.55, x1: x9 + 0.55, y0: 0, y1: 0.9, z0: z9 - 0.55, z1: z9 + 0.55 })); }));
  objScope('cook', () => { addBox(0.8, 0.85, 1.6, 0xc4c9cd, NU.x[0] - 0.495, 0, NU.z[0] + 2.1, NS); dBox(0.7, 0.03, 1.5, 0x2a2c30, NU.x[0] - 0.495, 0.85, NU.z[0] + 2.1); });
  {
    const [nx0, nx1] = NU.x, [nz0, nz1] = NU.z;
    addBox(0.15, KH, nz1 - 0.075 - (nz0 + 0.15), INNER, nx0, 0, (nz0 + 0.15 + nz1 - 0.075) / 2);
    addBox(nx1 - 0.15 - (nx0 - 0.075), KH, 0.15, INNER, (nx0 - 0.075 + nx1 - 0.15) / 2, 0, nz1);
    floorQ('wood', nx0 + 0.075, nx1 - 0.15, nz0 + 0.15, nz1 - 0.075, 0, 0xc8a878);
    const PZ9 = nz0 + 1.75;
    addBox(nx1 - 0.15 - (nx0 + 0.075), 0.15, PZ9 - (nz0 + 0.15), 0xc9a26e, (nx0 + 0.075 + nx1 - 0.15) / 2, 0, (nz0 + 0.15 + PZ9) / 2);
    objScope('mat', () => [[-1, -1, 0xf6e7a6], [1, -1, 0xcfe8f5], [-1, 1, 0xf7cfd6], [1, 1, 0xd6efc2]].forEach(([i, j, c9]) => dBox(0.8, 0.03, 0.62, c9, (nx0 + nx1) / 2 - 0.05 + i * 0.4, 0.154, (nz0 + 0.15 + PZ9) / 2 + 0.1 + j * 0.31)));
    objScope('cab', () => { addBox(0.8, 0.8, 0.42, 0xb98a4e, nx1 - 0.6, 0.15, nz0 + 0.37, NS);
    dBox(0.46, 0.28, 0.34, 0xf2f2ee, nx1 - 0.6, 0.95, nz0 + 0.37); dBox(0.3, 0.2, 0.03, 0x2a2c30, nx1 - 0.66, 0.99, nz0 + 0.555); });
    objScope('fridge', () => addBox(0.55, 1.25, 0.55, 0xf4f4f2, nx0 + 0.4, 0, PZ9 + 0.33, NS));
    officeDesk(nx0 + 0.72, 0, nz1 - 0.45, 1.2, -1);
    dBox(0.03, 0.8, 1.0, 0xfafaf8, nx0 + 0.09, 1.15, nz1 - 0.95);
    chair(nx0 + 0.72, 0, nz1 - 1.1, -1, 0x9ccc4a);
    lamp(0.56, 0.05, 0.56, (nx0 + nx1) / 2, KH - 0.21, (nz0 + nz1) / 2);
    dBox(0.03, 0.14, 0.07, 0x1e1e22, HX + 0.165, 1.1, NU.doorZ + 0.62);
    sign('영양사실', HX + 0.17, 2.45, NU.doorZ, Math.PI / 2, 0.16, { bg: '#f2f2ee', fg: '#2a4a7a' });
    zones.push({ x0: nx0, x1: nx1, z0: nz0, z1: nz1, y: 0, label: '영양사실' });
  }
  objScope('cook', () => { addBox(0.8, 1.8, 1.1, 0xd3d7da, kx0 + 0.55, 0, kz0 + 3.3, NS);
  [0.45, 1.05, 1.62].forEach(y9 => dBox(0.03, 0.03, 0.9, 0x8a9096, kx0 + 0.965, y9, kz0 + 3.3)); });
  [[kx0 + 4.0, kz0 + 4.6], [kx0 + 4.0, kz0 + 7.4]].forEach(([x9, z9]) => objScope('table', () => addBox(2.4, 0.85, 0.8, 0xc4c9cd, x9, 0, z9, NS)));
  objScope('sink', () => { addBox(0.75, 0.85, 3.0, 0xc9ced3, kx0 + 0.525, 0, kz0 + 6.0, NS);
  [-1, 0, 1].forEach(k => dBox(0.5, 0.03, 0.8, 0x8fa3b0, kx0 + 0.52, 0.85, kz0 + 6.0 + k * 0.95)); });
  objScope('cook', () => { addBox(1.3, 1.5, 0.8, 0xc9ced3, kx0 + 0.8, 0, kz0 + 2.3, NS); dBox(1.28, 0.7, 0.9, 0xb9bec2, kx0 + 0.8, 1.5, kz0 + 2.3); });
  [kx0 + 1.1, kx0 + 2.5].forEach(x9 => objScope('fridge', () => { addBox(1.3, 2.0, 0.8, 0xdfe3e6, x9, 0, Dm.z[0] - 0.55, NS); dBox(0.03, 0.5, 0.05, 0x8a9096, x9 + 0.2, 1.0, Dm.z[0] - 0.14); }));
  [SC - 1.2, SC + 1.2].forEach(z9 => objScope('trolley', () => { addBox(0.7, 0.9, 1.0, 0xc4c9cd, HX - 0.6, 0, z9, NS); }));
  objScope('locker', () => addBox(0.45, 1.8, 0.45, 0x7a8a9a, Dm.x[1] + 0.4, 0, kz1 - 0.6, NS)); objScope('locker', () => addBox(0.45, 1.8, 0.45, 0x7a8a9a, Dm.x[1] + 0.4, 0, kz1 - 1.1, NS));
  addBox(kx1-kx0+0.4+K.roofWest, 0.3, kz1-kz0+0.8, 0x5e4d44, (kx0-K.roofWest+kx1+0.4)/2, KH, (kz0+kz1)/2);
  {

    const KB = 0xa0604a, CAP = 0xcfcac0, SLT = 0x4a4e5e, PH = 3.75, x0o = kx0 - 0.15, z0o = kz0 - 0.15, RW = K.roofWest;
    const pierN = (a0, a1) => { addBox(a1 - a0, PH - YARD, 0.2, KB, (a0 + a1)/2, YARD, z0o - 0.1); patWall('brickW', 'x', a0 + 0.02, a1 - 0.02, YARD + 0.02, PH - 0.02, z0o - 0.212, -1);
      dBox(a1 - a0 + 0.1, 0.12, 0.3, CAP, (a0 + a1)/2, PH, z0o - 0.15); };
    pierN(x0o - 0.2, x0o + 1.0);
    addBox(0.2, PH - YARD, 1.2, KB, x0o - 0.1, YARD, z0o + 0.6);
    patWall('brickW', 'z', z0o - 0.18, z0o + 1.18, YARD + 0.02, PH - 0.02, x0o - 0.212, -1);
    dBox(0.3, 0.12, 1.25, CAP, x0o - 0.15, PH, z0o + 0.625);
    const PS = (kx1 + 0.15 - 0.6 - (x0o + 0.4)) / 4;
    for (let k = 1; k <= 4; k++) { const c9 = x0o + 0.4 + PS * k; pierN(c9 - 0.6, c9 + 0.6); }

    addBox(0.61, 0.35, 1.96, 0xc3a150, x0o - 0.305, YARD, kz1 - 0.15 - 0.98);
    addBox(0.6, 4.2 - YARD - 0.35, 1.95, KB, x0o - 0.3, YARD + 0.35, kz1 - 0.15 - 0.975);
    patWall('brickW', 'z', kz1 - 2.1 + 0.02, kz1 - 0.17, YARD + 0.37, 4.18, x0o - 0.612, -1);
    patWall('brickW', 'x', x0o - 0.58, x0o - 0.02, YARD + 0.37, 4.18, kz1 - 2.112, -1);
    dBox(0.7, 0.1, 2.0, CAP, x0o - 0.35, 4.2, kz1 - 0.15 - 1.0);

    dBox(kx1 + 0.4 - (kx0 - RW), 0.03, 0.25, 0x3d4150, (kx1 + 0.4 + kx0 - RW)/2, KH - 0.03, kz0 - 0.275);
    dBox(RW - 0.15, 0.03, kz1 - kz0 + 0.55, 0x3d4150, kx0 - (RW + 0.15)/2, KH - 0.03, (kz0 - 0.15 + kz1 + 0.4)/2);
    dBox(kx1 + 0.4 - (kx0 - RW - 0.06), 0.45, 0.06, SLT, (kx1 + 0.4 + kx0 - RW - 0.06)/2, KH - 0.1, kz0 - 0.43);
    dBox(0.06, 0.45, kz1 - kz0 + 0.8, SLT, kx0 - RW - 0.03, KH - 0.1, (kz0 + kz1)/2);
    dBox(0.3, 0.1, 1.4, 0xd2aa55, x0o - 0.15, 2.35, -39.55);
    exitSign(kx0 + 0.15, -39.55, 2.74, [1, 0]);
  }
  hangSign('급식실', K.exitC, 2.78, fz0, 1); sign('조리실', K.staffDoorC, 2.35, fz0 + 0.22, 0, 0.26);

  addBox(kx1 - kx0 + 0.3, KH - FH, 0.15, 0xbcc8ca, (kx0 + kx1)/2, FH, fz0 - 0.075);
  addBox(kx1 - kx0 + 0.3, KH - FH - 0.3, 0.15, WALL, (kx0 + kx1)/2, FH + 0.3, fz0 + 0.075);
  {
    const D = K.dutyRoom;
    addBox(0.3, KH, D.z[1] - D.z[0] - 0.3, INNER, D.x[1], 0, (D.z[0] + D.z[1]) / 2);
    addBox(D.x[1] + 0.15 - (D.x[0] + 0.15), KH, 0.3, INNER, (D.x[0] + D.x[1]) / 2 + 0.15, 0, D.z[0]);
    officeDesk(D.x[0] + 0.85, 0, D.z[0] + 1.5);
    sign('당직실', D.doorC + 1.2, 2.35, fz0 + 0.22, 0, 0.32);
    zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], y: 0, label: '당직실' });
  }
  zones.push({ x0: HX, x1: kx1, z0: AZ, z1: kz1, y: 0, label: '급식실' });
  zones.push({ x0: kx0, x1: HX, z0: kz0, z1: Dm.z[0], y: 0, label: '조리실' });
  zones.push({ x0: HX, x1: PX, z0: kz0, z1: AZ, y: 0, label: '급식 창고' });
  ceil(HX, kx1, AZ, kz1, KH, 'ctile');
  ceil(kx0, HX, kz0, kz1, KH, 'cflat');
  ceil(HX, kx1, kz0, AZ, KH, 'cflat');
  for (let x9 = HX + 1.8; x9 < kx1 - 0.8; x9 += 3.0) for (let z9 = AZ + 2.0; z9 < kz1 - 0.8; z9 += 2.9) lamp(1.2, 0.05, 0.22, x9, KH - 0.21, z9);

  [[HX + 3.3, AZ + 3.45], [HX + 9.3, AZ + 3.45], [HX + 6.3, AZ + 9.25]].forEach(([x9, z9]) => { dBox(0.9, 0.05, 0.9, 0xf2f3f4, x9, KH - 0.16 - 0.05, z9); dBox(0.5, 0.03, 0.5, 0xb8bec4, x9, KH - 0.16 - 0.08, z9); });
  for (let x9 = kx0 + 1.8; x9 < HX - 0.8; x9 += 3.2) for (let z9 = kz0 + 2.2; z9 < Dm.z[0] - 0.8; z9 += 3.6) lamp(1.2, 0.05, 0.22, x9, KH - 0.21, z9);

  {
    const [lx0, lx1] = CL.x, [lz0, lz1] = CL.z, [cx0, cx1] = LC.x, [cz0] = LC.z, E = B.eastWing, NOTCH_Z = E.z[1];

    foundation(cx0, cx1, cz0 - 0.15, lz0);
    foundation(cx1, cx1 + 0.15, NOTCH_Z + 0.15, lz0);
    foundation(lx0, lx1 + 0.15, lz0, lz1);
    foundation(cx1 + 0.15, lx1 + 0.15, lz0 - 0.15, lz0);

    const LDW = 1.05, LD1 = lz1 - 0.9, LDC = LD1 - LDW / 2, LD0 = LD1 - LDW;
    const rbx = (w, h, d, hex, cx, y0, cz, ry) => dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(cx, y0 + h / 2, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(w, h, d)), hex);
    wallZ(lz0, lz1, lx1, WALL, { face: 1, gaps: [{ c: (lz0 + 0.15 + LD0) / 2, w: LD0 - lz0 - 0.15, sill: 0.15, dh: 2.9, win: true, frame: 0xc9ced3 },
      { c: LDC, w: LDW, glass: true, door: true, slideOver: true, dh: 2.5 },
      { c: (LD1 + lz1 - 0.15) / 2, w: lz1 - 0.15 - LD1, sill: 0.15, dh: 2.9, win: true, frame: 0xc9ced3 }] });
    wallX(cx1 - 0.15, lx1 + 0.15, lz0, WALL, { face: -1, gaps: [{ c: (cx1 + lx1) / 2, w: lx1 - cx1 - 0.3, sill: 0.15, dh: 2.9, win: true, frame: 0xc9ced3, noLedge: true }] });

    [-1, 1].forEach(sd => dBox((lx1 - cx1 - 0.3) / 2 - 0.09, 0.85, 0.04, 0xe6ddcf, (cx1 + lx1) / 2 + sd * ((lx1 - cx1 - 0.3) / 4 + 0.015), 2.03, lz0 + 0.125));
    [[lz0 + 0.15, LD0], [LD1, lz1 - 0.15]].forEach(([a, b]) => dBox(0.04, 0.85, b - a - 0.12, 0xe6ddcf, lx1 - 0.125, 2.03, (a + b) / 2));
    dBox(0.12, 0.1, 0.4, 0x222222, lx1 - 0.21, 2.52, LDC);
    { const X0 = lx0 + 0.15, X1 = lx1 - 0.15, Z0 = lz0 + 0.15, Z1 = lz1 + 0.15, q = 1 / (Math.SQRT2 * PATDEF.tileG[0]), uv = (x, z) => [(x + z) * q, (x - z) * q];
      patPush('tileG', [[X0, 0.012, Z0], [X1, 0.012, Z0], [X1, 0.012, Z1], [X0, 0.012, Z1]], [uv(X0, Z0), uv(X1, Z0), uv(X1, Z1), uv(X0, Z1)], [0, 1, 0], 0xffffff); }
    patQuad('tactX', lx1 - 0.55, lx1 - 0.2, LDC - LDW / 2 + 0.05, LD1 - 0.05, 0.02);
    patQuad('tactX', hc - 0.3, hc + 0.3, lz1 - 0.02, lz1 + 0.28, 0.02);

    [[hc - 2.3, 1, 0.6], [hc + 2.36, -1, 0.72]].forEach(([px, inr, PW]) => {
      const PD = 0.6, pz = lz1, yT = FH - 0.2;
      addBox(PW, FH - 0.02, PD, 0xd2c8b5, px, 0.005, pz);
      dBox(PW + 0.02, 1.15, PD + 0.02, DKWOOD, px, 0.012, pz);
      [-0.12, 0.12].forEach(o => dBox(0.03, 1.0, 0.03, 0x2f241e, px + o, 0.08, pz + PD / 2 + 0.025));
      const lv0 = Math.max(px - PW / 2, lx0 + 0.15), lv1 = Math.min(px + PW / 2, lx1 - 0.15);
      patWall('tileW', 'x', px - PW / 2, px + PW / 2, 1.16, yT, pz + PD / 2 + 0.012, 1, 0xe2d7c2);
      patWall('tileW', 'x', lv0, lv1, 1.16, yT, pz - PD / 2 - 0.012, -1, 0xe2d7c2);
      patWall('tileW', 'z', pz - PD / 2, pz + PD / 2, 1.16, yT, px + inr * (PW / 2 + 0.012), inr, 0xe2d7c2);
      patWall('tileW', 'z', pz + 0.15, pz + PD / 2, 1.16, yT, px - inr * (PW / 2 + 0.012), -inr, 0xe2d7c2);
      [[px + inr * PW / 2, pz + PD / 2], [px + inr * PW / 2, pz - PD / 2], [px - inr * PW / 2, pz + PD / 2]].forEach(([cx9, cz9]) => dBox(0.05, yT - 1.16, 0.05, DKWOOD, cx9, 1.16, cz9));
      dBox(0.04, 0.18, 0.14, 0xc8342c, px + inr * (PW / 2 + 0.03), 1.4, pz + 0.05);
      dBox(0.03, 0.06, 0.06, 0xf4f4f0, px + inr * (PW / 2 + 0.065), 1.46, pz + 0.05);
    });

    const DW = 1.9, DD = 0.6, dkx = cx1 + 0.05 + DW / 2, dkz = lz0 + 0.5 + DD / 2, FZ = dkz + DD / 2 + 0.015;
    objScope('desk', () => {
    addBox(DW, 1.0, DD, 0xe8e6de, dkx, 0, dkz, NS);
    colliders[colliders.length - 1].z1 -= 0.12;
    dBox(DW - 0.02, 0.1, 0.03, 0xf2f2f0, dkx, 0.005, FZ);
    [-1, 1].forEach(sd => dBox(DW / 2 - 0.03, 0.66, 0.03, 0xbdb7aa, dkx + sd * DW / 4, 0.11, FZ));
    dBox(DW - 0.02, 0.2, 0.03, 0xdcdcd8, dkx, 0.78, FZ);
    dBox(0.03, 0.66, DD - 0.06, 0xbdb7aa, dkx - DW / 2 - 0.015, 0.11, dkz);
    dBox(DW + 0.04, 0.03, DD + 0.08, 0xd8c29a, dkx, 1.0, dkz + 0.03);
    glassPane('x', DW - 0.1, 0.35, dkx, 1.03, dkz - 0.05);
    dBox(DW - 0.1, 0.03, 0.04, 0xc9ced3, dkx, 1.38, dkz - 0.05);

    dBox(0.34, 0.09, 0.03, 0xeef2ee, dkx - DW / 2 + 0.3, 1.03, dkz + 0.2);
    sign('학교안전지킴이', dkx - DW / 2 + 0.3, 1.075, dkz + 0.228, 0, 0.055, { bg: '#f4f6f2', fg: '#2f5f45' }); });
    chair(dkx - 0.25, 0, dkz - DD / 2 - 0.18, -1, 0xc89a5e);
    objScope('fan', () => { const fx = dkx + 0.6, fz = dkz - DD / 2 - 0.17;
      dCyl(0.16, 0.18, 0.04, 0xe8e8e4, fx, 0, fz, { seg: 8 }); dCyl(0.015, 0.015, 1.18, 0xdcdcdc, fx, 0.04, fz, { seg: 4 });
      dCyl(0.2, 0.2, 0.05, 0xeef2f5, fx, 1.3, fz - 0.02, { rot: [Math.PI / 2, 0, 0], seg: 12 });
      post(fx, fz, 0, 1.5, 0.12); });
    hotspots.push({ kind: 'visit', x: dkx, z: dkz + 1.0, y: 0, r: 1.1, label: '방문록에 이름 쓰기', at: [dkx, 0.78, dkz] });

    { const ckx = cx1 - 0.35, ckz = lz0 + 0.45, cr = 0.6, cs = Math.sin(cr), cc = Math.cos(cr), CK = 0x2a1c18;
      objScope('clock', () => {
      const cp = (lx, lz) => [ckx + lx * cc + lz * cs, ckz - lx * cs + lz * cc];
      const cb = (w, h, d, hex, lx, y0, lz) => { const [x9, z9] = cp(lx, lz); rbx(w, h, d, hex, x9, y0, z9, cr); };
      const cy = (r, h, hex, lx, y0, lz, face, seg = 12) => { const g = new THREE.CylinderGeometry(r, r, h, seg, 1); g.translate(0, h / 2, 0); if (face) g.rotateX(Math.PI / 2);
        g.rotateY(cr); const [x9, z9] = cp(lx, lz); g.translate(x9, y0, z9); dGeo(g, new THREE.Matrix4(), hex, { at: [ckx, ckz] }); g.dispose(); };
      cb(0.56, 0.3, 0.4, CK, 0, 0, 0); cb(0.5, 0.2, 0.36, CK, 0, 0.3, 0);
      cb(0.42, 1.0, 0.3, CK, 0, 0.5, 0); cb(0.32, 0.82, 0.02, 0x4a3a34, 0, 0.59, 0.15);
      [-0.07, 0, 0.07].forEach(o => cy(0.02, 0.5, 0xd8b35a, o, 0.9, 0.1, false, 4));
      cy(0.08, 0.02, 0xd8b35a, 0, 0.72, 0.13, true); cy(0.012, 0.3, 0xd8b35a, 0, 0.8, 0.12, false, 5);
      cb(0.5, 0.55, 0.34, CK, 0, 1.5, 0);
      cy(0.14, 0.02, 0xf4efe0, 0, 1.77, 0.17, true, 16); cb(0.02, 0.1, 0.01, 0x222222, 0, 1.77, 0.19);
      cb(0.56, 0.06, 0.38, CK, 0, 2.05, 0);
      [-1, 1].forEach(sd => { const [x9, z9] = cp(sd * 0.14, 0.05); dBlob(0.09, 0.12, 0.06, CK, x9, 2.19, z9, { chunky: true, ry: cr + sd }); });
      { const [x9, z9] = cp(0, 0.05); dBlob(0.035, 0.08, 0.035, 0xd8b35a, x9, 2.23, z9, { chunky: true }); }
      colliders.push(noStand({ x0: ckx - 0.33, x1: ckx + 0.33, y0: 0, y1: 2.1, z0: ckz - 0.33, z1: ckz + 0.33 })); });
      hotspots.push({ kind: 'clock', x: ckx - 0.15, z: ckz + 0.8, y: 0, r: 0.9, label: '괘종시계 보기', at: [ckx, 1.77, ckz] }); }

    [lz1 - 0.75, lz1 - 1.4, lz1 - 2.05].forEach((z9, k) => objScope('plant', () => { const x9 = lx0 + 0.55;
      dBox(0.46, 0.05, 0.46, 0xe6e6e6, x9, 0.005, z9); dCyl(0.24, 0.19, 0.4, 0xe9e6de, x9, 0.055, z9, { seg: 8 });
      dCyl(0.025, 0.035, 1.55, 0x6d4e32, x9, 0.45, z9, { seg: 6 });
      for (let j = 0; j < 5; j++) { const r9 = 0.46 - j * 0.07; [0, 1].forEach(q => dBlob(r9, 0.07 - j * 0.006, r9 * 0.42, j % 2 ? 0x3a6238 : 0x2e5230, x9 + (q ? 0.03 : -0.03), 0.88 + j * 0.24, z9, { chunky: true, ry: j * 0.9 + k + q * Math.PI / 2, jitter: 0.3 })); }
      colliders.push(noStand({ x0: x9 - 0.28, x1: x9 + 0.28, y0: 0, y1: 0.45, z0: z9 - 0.28, z1: z9 + 0.28 })); }));
    hotspots.push({ kind: 'pot', x: lx0 + 1.3, z: lz1 - 1.4, y: 0, r: 1.0, label: '화분에 분무기로 물 주기', ats: [lz1 - 0.75, lz1 - 1.4, lz1 - 2.05].map(z9 => [lx0 + 0.55, 1.25, z9]) });
    objScope('aed', () => { dBox(0.25, 1.2, 0.35, 0xf4f4f0, lx0 + 0.285, 0.005, lz0 + 0.2); dBox(0.03, 0.12, 0.12, 0xd23a3a, lx0 + 0.425, 0.95, lz0 + 0.2);
    colliders.push(noStand({ x0: lx0 + 0.15, x1: lx0 + 0.42, y0: 0, y1: 1.2, z0: lz0 + 0.02, z1: lz0 + 0.38 })); });
    dBox(0.2, FH - 0.02, 0.12, 0xb8bcc0, lx0 + 0.25, 0.005, lz0 - 0.1);
    potPlant(lx0 + 0.4, 0, lz0 - 0.4, 1.2);
    zones.push({ x0: lx0, x1: lx1, z0: lz0, z1: lz1, y: 0, label: '가운데 로비' });
    ceil(lx0, lx1, lz0, lz1 + 0.16, FH, 'coffer');
    [-1, 1].forEach(sx => lamp(0.55, 0.04, 0.55, hc + sx * 1.3, FH - 0.2, (lz0 + lz1) / 2));

    wallRun('z', NOTCH_Z + 0.15, lz0 - 0.15, cx1, WALL, { face: 1, gaps: [{ c: (NOTCH_Z + lz0) / 2, w: lz0 - NOTCH_Z - 0.3, sill: 0.15, dh: 2.7, win: true, noLedge: true }] });
    dRod(cx1 - 0.2, 0.9, NOTCH_Z + 0.2, cx1 - 0.2, 0.9, lz0 - 0.2, 0.025, 0xc9a24a);
    dRod(cx1 - 0.2, 0, (NOTCH_Z + lz0) / 2, cx1 - 0.2, 0.9, (NOTCH_Z + lz0) / 2, 0.018, 0xc9a24a);
    colliders.push(noStand({ x0: cx1 - 0.24, x1: cx1 - 0.15, y0: 0, y1: 0.95, z0: NOTCH_Z + 0.15, z1: lz0 - 0.15 }));
    dCyl(0.14, 0.14, 2.75, 0xf2f2f0, cx1 - 0.22, 0, lz0 + 0.08, { seg: 8 });
    colliders.push({ x0: cx1 - 0.36, x1: cx1 - 0.08, y0: 0, y1: 2.75, z0: lz0 - 0.06, z1: lz0 + 0.22 });
    floorQ('tileG', cx0 + 0.15, cx1 - 0.15, cz0 + 0.15, lz0 + 0.15, 0, 0xc3c5cd);

    { const z9 = LBAY[0][0], L = 2.28, st = L / 6, BK = [0xef8f45, 0xf2c25a, 0x8cc26a], SE = [0x8cc26a, 0xef8f45, 0xf2c25a];
      objScope('sofa', () => {
      colliders.push({ x0: cx0 + 0.15, x1: cx0 + 0.85, y0: 0, y1: 0.45, z0: z9 - L/2, z1: z9 + L/2 });
      for (let k = 0; k < 6; k++) { const zz = z9 + L/2 - st * (k + 0.5);
        dBox(0.6, 0.32, st, SE[k % 3], cx0 + 0.45, 0.1, zz); dBox(0.18, 0.43, st, BK[k % 3], cx0 + 0.25, 0.42, zz); }
      [z9 - L/2 + 0.08, z9 + L/2 - 0.08].forEach(zz => dBox(0.05, 0.1, 0.05, 0xb58a5a, cx0 + 0.68, 0, zz)); });
      objScope('plant', () => { const pz = z9 - L/2 - 0.3; dBox(0.28, 0.26, 0.28, 0xf2f2ee, cx0 + 0.45, 0, pz); dBlob(0.22, 0.2, 0.22, 0x4f8f47, cx0 + 0.45, 0.42, pz, { chunky: true, jitter: 0.22 });
        colliders.push(noStand({ x0: cx0 + 0.3, x1: cx0 + 0.6, y0: 0, y1: 0.3, z0: pz - 0.15, z1: pz + 0.15 })); });
      hotspots.push({ kind: 'sit', x: cx0 + 1.05, z: z9, y: 0, r: 0.9, label: '소파에 앉기', yaw: Math.PI / 2, seat: { x: cx0 + 0.52, y: 0.42 - 0.46, z: z9, yaw: Math.PI / 2 } }); }

    [[cx1 - 0.45, NOTCH_Z + 0.4], [cx1 - 0.45, lz0 - 0.45]].forEach(([x9, z9]) => objScope('plant', () => { potPlant(x9, 0, z9, 1.4, true, 0xf2f2ee);
      colliders.push(noStand({ x0: x9 - 0.4, x1: cx1 - 0.24, y0: 0, y1: 1.1, z0: z9 - 0.4, z1: z9 + 0.4 })); }));
    objScope('bucket', () => { dCyl(0.45, 0.38, 0.35, 0x6e2a26, cx1 - 0.6, 0, NOTCH_Z - 0.55, { seg: 10 });
    colliders.push(noStand({ x0: cx1 - 1.05, x1: cx1 - 0.15, y0: 0, y1: 0.4, z0: NOTCH_Z - 1.0, z1: NOTCH_Z - 0.1 })); });
    objScope('bucket', () => { dCyl(0.14, 0.12, 0.3, 0x2f5fd0, cx1 - 0.3, 0, NOTCH_Z - 1.25, { seg: 6 });
    colliders.push(noStand({ x0: cx1 - 0.45, x1: cx1 - 0.15, y0: 0, y1: 0.3, z0: NOTCH_Z - 1.4, z1: NOTCH_Z - 1.1 })); });

    hotspots.push({ kind: 'aed', x: cx0 + 0.9, z: lz0 + 0.2, y: 0, r: 0.8, label: 'AED 보관함 보기', at: [lx0 + 0.285, 1.0, lz0 + 0.2] });

    dBox(0.04, 0.68, 0.52, 0x5a3e2a, cx0 + 0.42, 1.25, LPIL[0]); dBox(0.03, 0.6, 0.44, 0x86b86a, cx0 + 0.445, 1.29, LPIL[0]);

    const xBanner = objWrap((x, z, ry, title, th) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), nx = Math.sin(ry), nz = Math.cos(ry), ux = Math.cos(ry), uz = -Math.sin(ry);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(x, 1.03, z), q, new THREE.Vector3(0.6, 1.75, 0.02)), 0xf2f4f8);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(x + nx * 0.015, 1.72, z + nz * 0.015), q, new THREE.Vector3(0.56, 0.16, 0.012)), 0x2f5fa8);
      sign(title, x + nx * 0.025, 1.5, z + nz * 0.025, ry, th, { bg: '#ffffff', fg: '#2f4f9a' });
      dRod(x - nx * 0.04, 0.02, z - nz * 0.04, x - nx * 0.04, 1.88, z - nz * 0.04, 0.012, 0x9aa0a6);

      const hx = 0.1 * Math.abs(ux) + 0.05 * Math.abs(nx), hz = 0.1 * Math.abs(uz) + 0.05 * Math.abs(nz);
      [-0.2, 0, 0.2].forEach(o => { const px = x + ux * o - nx * 0.02, pz = z + uz * o - nz * 0.02;
        colliders.push(noStand({ x0: px - hx, x1: px + hx, y0: 0, y1: 1.9, z0: pz - hz, z1: pz + hz })); });
    }, 'banner');
    xBanner(cx0 + 0.75, LPIL[1] - 0.8, 0.52, '사이버 폭력 예방', 0.09);
    xBanner(cx0 + 1.0, cz0 + 0.55, 0.3, '폭력없는 행복한 학교', 0.07);
    zones.push({ x0: cx0, x1: cx1, z0: cz0, z1: lz0, y: 0, label: '세로복도' });

    ceil(cx0, cx1, cz0, lz0 + 0.16, 2.91, 'coffer');
    addBox(cx1 - cx0 - 0.3, FH - 2.75, 0.15, INNER, (cx0 + cx1)/2, 2.75, lz0 + 0.075);
    for (let k = 0; k < 4; k++) lamp(0.55, 0.04, 0.55, (cx0 + cx1)/2, 2.71, cz0 + 1.3 + (lz0 - 1.5 - cz0 - 1.3) * k / 3);

    addBox(cx1 - cx0 - 0.15, 0.3, lz0 - cz0 + 0.4, 0xe6e7e3, (cx0 + 0.15 + cx1)/2, FH, (cz0 - 0.4 + lz0)/2);
    addBox(lx1 - lx0 - 0.15 + 0.4, 0.3, lz1 + 0.02 - lz0, 0xe6e7e3, (lx0 + 0.15 + lx1 + 0.4)/2, FH, (lz0 + lz1 + 0.02)/2);

    const MZ0 = NOTCH_Z + 0.15, MZ1 = fz0 - 0.15, MX1 = E.x[1] + 0.15, DX0 = lx1 + 0.15;
    const KZ0 = MZ0 + 0.8, KZ1 = KZ0 + 0.15, RN = KZ1 + 1.5, RS = MZ1 - 1.75, PZ9 = -37.45;
    const YB1 = 19.4, YZ = -37.35;
    const GRY = 0xcfc8bc, RED = 0xbf7873, CRB = 0xc9c6bd, SOIL = 0x7a6a52;

    const PR3 = new THREE.CylinderGeometry(1, 1, 1, 3, 1, true).translate(0, 0.5, 0).toNonIndexed(), PR4 = new THREE.CylinderGeometry(1, 1, 1, 4, 1, true).translate(0, 0.5, 0).toNonIndexed();
    const FLAT = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).toNonIndexed(), DISC = new THREE.CircleGeometry(1, 8).rotateX(-Math.PI / 2).toNonIndexed(), TET = new THREE.TetrahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0);
    const rodL = (x0, y0, z0, x1, y1, z1, r, hex, o = {}, G = PR3) => {
      visRods.push({ x0: Math.min(x0, x1) - r, x1: Math.max(x0, x1) + r, y0: Math.min(y0, y1) - r, y1: Math.max(y0, y1) + r, z0: Math.min(z0, z1) - r, z1: Math.max(z0, z1) + r, r, a: [x0, y0, z0], b: [x1, y1, z1] });
      _rd.set(x1 - x0, y1 - y0, z1 - z0); const L9 = _rd.length(); _rd.divideScalar(L9);
      dGeo(G, _dm.compose(_dv.set(x0, y0, z0), _dq.setFromUnitVectors(_up, _rd), _ds.set(r, L9, r)), hex, o); };
    const ribbon = (x0, z0, x1, z1, w, y, hex) => { const L9 = Math.hypot(x1 - x0, z1 - z0);
      dGeo(FLAT, _dm.compose(_dv.set((x0 + x1) / 2, y, (z0 + z1) / 2), _dq.setFromEuler(_de.set(0, Math.atan2(-(z1 - z0), x1 - x0), 0)), _ds.set(L9, 1, w)), hex); };
    const disc = (r, hex, x, y, z) => dGeo(DISC, _dm.compose(_dv.set(x, y, z), _dq.identity(), _ds.set(r, 1, r)), hex);
    const tet = (s, hex, x, y, z, ry = 0) => dGeo(TET, _dm.compose(_dv.set(x, y, z), _dq.setFromEuler(_de.set(0.6, ry, 0.3)), _ds.set(s, s * 0.8, s)), hex);
    const BLADE = new THREE.CylinderGeometry(0.004, 0.05, 1, 3, 1, true).translate(0, 0.5, 0).toNonIndexed();
    const tuft = (x, y, z, h, hex, sd = 0) => { for (let k = 0; k < 6; k++) { const a = sd + k * 1.047, ln = 0.28 + 0.14 * ((k * 7 + Math.round(sd * 10)) % 3) / 2;
      _rd.set(Math.sin(ln) * Math.cos(a), Math.cos(ln), Math.sin(ln) * Math.sin(a));
      dGeo(BLADE, _dm.compose(_dv.set(x + Math.cos(a) * 0.05, y, z + Math.sin(a) * 0.05), _dq.setFromUnitVectors(_up, _rd), _ds.set(1, h * (0.8 + 0.1 * (k % 3)), 1)), hex, { jitter: 0.2 }); } };
    addBox(lx1 + 0.15 - (cx1 + 0.15), COURT - YARD, lz0 - 0.15 - MZ0, 0xb4806a, (cx1 + 0.15 + lx1 + 0.15)/2, YARD, (MZ0 + lz0 - 0.15)/2);
    addBox(MX1 - DX0, COURT - YARD, MZ1 - MZ0, 0xb4806a, (DX0 + MX1)/2, YARD, (MZ0 + MZ1)/2);
    patQuad('ilock', DX0, MX1, MZ0, RN, COURT + 0.012, false, RED); patQuad('ilock', DX0, MX1, RN, RS, COURT + 0.012, false, GRY); patQuad('ilock', DX0, MX1, RS, MZ1, COURT + 0.012, false, RED);

    [[-39.35, RN, RED], [RN, RS, GRY], [RS, MZ1, RED]].forEach(([a, b, t]) => slope('ilock', 'x', a, b, MX1, MX1 + 1.5, COURT, YARD, 2, t));

    addBox(YB1 - DX0, -COURT, MZ1 - (YZ + 0.15), 0xb9b7b0, (DX0 + YB1)/2, COURT, (YZ + 0.15 + MZ1)/2);
    patQuad('teal', DX0, YB1 - 0.12, YZ + 0.27, MZ1 - 0.05, 0.012);
    addPanel(0.3, 2.0, 0xe8c040, DX0 + 0.3, 0.02, lz1 - 1.3);
    addPanel(0.9, 1.6, 0x8a7a5a, YB1 + 0.6, COURT + 0.02, lz1 - 1.3);
    addPanel(1.0, 0.8, 0x9aa0a4, YB1 + 0.6, COURT + 0.02, YZ + 0.6); for (let k = 0; k < 6; k++) addPanel(0.03, 0.74, 0x6b7076, YB1 + 0.18 + k * 0.17, COURT + 0.026, YZ + 0.6);
    {
      const sx = DX0 + 0.2, sz = YZ + 0.62;
      objScope('shelf', () => { dBox(0.35, 0.4, 0.75, 0x9a7a52, sx, 0, sz); colliders.push(noStand({ x0: sx - 0.18, x1: sx + 0.18, y0: 0, y1: 0.45, z0: sz - 0.38, z1: sz + 0.38 }));
      dBox(0.12, 0.12, 0.68, 0xf2f2f0, sx, 0.4, sz);
      for (let k = 0; k < 4; k++) tet(0.07, k % 2 ? 0xd8342c : 0x4f8a3e, sx, 0.56, sz - 0.26 + k * 0.173, k); });
    }

    { const CX1 = 21.1, CZ0 = YZ - 0.15, CY0 = 3.25, CY1 = 3.1, S9 = PATDEF.cflat[0];
      [[0, 1], [-0.012, -1]].forEach(([dy, n]) => { const P = [[DX0, CY0 + dy, CZ0], [CX1, CY1 + dy, CZ0], [CX1, CY1 + dy, MZ1], [DX0, CY0 + dy, MZ1]];
        patPush('cflat', P, P.map(p => [p[0] / S9, -p[2] / S9]), [0, n, 0], 0x9fd3c6); });
      rodL(CX1, CY1 - 0.02, CZ0, CX1, CY1 - 0.02, MZ1, 0.08, 0x8fc4b8, {}, PR4);
      rodL(DX0, CY0 - 0.02, CZ0, CX1, CY1 - 0.02, CZ0, 0.025, 0xc8cdd2);
      rodL(CX1 - 0.1, COURT, CZ0 + 0.05, CX1 - 0.1, CY1 - 0.02, CZ0 + 0.05, 0.05, 0xa9aeb2, {}, PR4); post(CX1 - 0.1, CZ0 + 0.05, COURT, CY1, 0.07); }

    addBox(0.15, 0.15, YZ - KZ1, CRB, YB1 + 0.075, COURT, (KZ1 + YZ)/2);
    addBox(YB1 + 0.15 - DX0, 0.15, 0.15, CRB, (DX0 + YB1 + 0.15)/2, COURT, YZ + 0.075);
    patQuad('dirt', cx1 + 0.15, DX0, MZ0, lz0 - 0.15, COURT + 0.06, false, SOIL); patQuad('dirt', DX0, YB1, MZ0, YZ, COURT + 0.06, false, SOIL);

    const CAP5 = new THREE.CylinderGeometry(0, 1, 1, 5, 1, true).translate(0, 0.5, 0).toNonIndexed();
    [[14.8, -39.9, 1], [16.5, -39.2, 1], [18.45, -39.45, 1.3], [18.35, -37.95, 1]].forEach(([x9, z9, s9], i) => { const h9 = hash2(x9, z9);
      dBlob(0.62 * s9, 0.44, 0.55 * s9, i % 2 ? 0x4a7a36 : 0x55853e, x9, COURT + 0.4, z9, { chunky: true, ry: h9 * 6, jitter: 0.16 });
      dGeo(CAP5, _dm.compose(_dv.set(x9 + 0.04, COURT + 0.68, z9 - 0.03), _dq.setFromEuler(_de.set(0, h9 * 4, 0)), _ds.set(0.7 * s9, 0.2, 0.64 * s9)), i % 2 ? 0xf2c01e : 0xe8b31a, { jitter: 0.14 }); });
    colliders.push(noStand({ x0: cx1 + 0.15, x1: DX0, y0: COURT, y1: COURT + 0.9, z0: MZ0, z1: lz0 - 0.15 }), noStand({ x0: DX0, x1: YB1, y0: COURT, y1: COURT + 0.9, z0: MZ0, z1: YZ }));

    addBox(MX1 - YB1, 0.15, 0.15, CRB, (YB1 + MX1)/2, COURT, (KZ0 + KZ1)/2);
    addBox(0.15, 0.15, KZ0 - MZ0 - 0.05, CRB, MX1 - 0.075, COURT, (MZ0 + 0.05 + KZ0)/2);
    patQuad('dirt', YB1, MX1 - 0.15, MZ0, KZ0, COURT + 0.06, false, SOIL);

    for (let x9 = YB1 + 1.1; x9 < MX1 - 0.6; x9 += 2.3) { const h9 = hash2(x9, 41), zz = MZ0 + 0.42 + (h9 - 0.5) * 0.12, tall = x9 > 40.5;
      if (tall) { tuft(x9 - 0.4, COURT + 0.05, zz, 1.05, 0x8e9a60, h9 * 6); tuft(x9 + 0.5, COURT + 0.05, zz + 0.05, 0.9, 0x9aa66e, h9 * 4); }
      else dBlob(1.25, 0.4 + h9 * 0.18, 0.42, [0x4f7f3a, 0x5d8f45, 0x466f34][Math.floor(h9 * 3)], x9, COURT + 0.32 + h9 * 0.08, zz, { chunky: true, ry: (h9 - 0.5) * 0.2, jitter: 0.2 });
      if (x9 < 33) for (let k = 0; k < 2; k++) { const hk = hash2(x9 + k, 43);
        tet(0.08, [0xe0485e, 0xf07a3a, 0xf29ab5, 0xd8342c][(k + Math.floor(h9 * 4)) % 4], x9 + (k - 0.5) * 0.8 + (hk - 0.5) * 0.2, COURT + 0.74 + hk * 0.15, zz + (hk - 0.5) * 0.3, hk * 6); }
    }
    { const fz9 = KZ0 - 0.04, fy = COURT + 0.06, xs = [];
      for (let x9 = YB1 + 0.3; x9 < MX1 - 1.5; x9 += 5.0) xs.push(x9); xs.push(MX1 - 0.25);
      xs.forEach(x9 => rodL(x9, fy, fz9, x9, fy + 0.95, fz9, 0.014, 0x8a9096));
      for (let i = 0; i < xs.length - 1; i++) [[0.45, 0x8a9096], [0.8, 0x4a8ab0]].forEach(([h, c]) => rodL(xs[i], fy + h, fz9, xs[i + 1], fy + h, fz9, 0.007, c)); }
    colliders.push(noStand({ x0: YB1, x1: MX1, y0: COURT, y1: COURT + 1.0, z0: MZ0, z1: KZ0 }));
    {
      const X0 = MX1, X1 = 47.6, Z0 = -41.6, Z1 = -39.8;
      addBox(X1 - X0, 0.15, 0.15, CRB, (X0 + X1) / 2, YARD, Z1 + 0.075); addBox(0.15, 0.15, Z1 - Z0, CRB, X1 + 0.075, YARD, (Z0 + Z1) / 2);
      patQuad('dirt', X0, X1, Z0, Z1, YARD + 0.06, false, SOIL);
      dBlob(0.75, 0.5, 0.62, 0x2e5a2c, 46.0, YARD + 0.45, -40.5, { chunky: true, ry: 0.4, jitter: 0.12 }); dBlob(0.6, 0.45, 0.55, 0x33612f, 47.0, YARD + 0.4, -41.0, { chunky: true, ry: 1.3, jitter: 0.12 });
      [[45.5, -41.2], [46.9, -40.2], [45.6, -40.1]].forEach(([x9, z9], i) => tuft(x9, YARD + 0.05, z9, 1.1 - i * 0.1, i % 2 ? 0x9aa66e : 0x8e9a60, i * 2.1));
      [[X0 + 0.1, Z1 - 0.05], [X1 - 0.05, Z1 - 0.05], [X1 - 0.05, Z0 + 0.1]].forEach(([x9, z9], i, A) => { rodL(x9, YARD + 0.06, z9, x9, YARD + 1.0, z9, 0.014, 0x8a9096);
        if (i) [[0.45, 0x8a9096], [0.8, 0x4a8ab0]].forEach(([h, c]) => rodL(A[i - 1][0], YARD + 0.06 + h, A[i - 1][1], x9, YARD + 0.06 + h, z9, 0.007, c)); });
      colliders.push(noStand({ x0: X0, x1: X1, y0: YARD, y1: YARD + 1.0, z0: Z0, z1: Z1 })); }

    const FLAME = new THREE.LatheGeometry([[0.34, 0.03], [0.46, 0.22], [0.44, 0.46], [0.38, 0.72], [0.25, 0.98], [0.11, 1.2], [0.01, 1.32]].map(([r, y]) => new THREE.Vector2(r, y)), 5);
    { const P9 = FLAME.attributes.position; for (let i = 0; i < P9.count; i++) { const x = P9.getX(i), y = P9.getY(i), z = P9.getZ(i), a = Math.atan2(z, x), f = 1 + 0.09 * Math.sin(a * 3 + y * 11) + 0.05 * Math.sin(a * 5 - y * 7);
      P9.setXYZ(i, x * f, y, z * f); } }
    const BOWL = new THREE.LatheGeometry([[0.2, 0], [0.14, 0.24], [0.34, 0.35], [0.43, 0.55], [0.43, 0.67], [0.36, 0.62], [0.001, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 5);
    [[26.4, 0], [31.6, 0], [36.8, 0], [42.0, 1], [47.0, 0]].forEach(([x9, grass]) => objScope('plant', () => {
      const y9 = x9 > MX1 + 1.5 ? YARD : COURT, z9 = PZ9;
      dGeo(BOWL, _dm.compose(_dv.set(x9, y9, z9), _dq.identity(), _ds.set(1, 1, 1)), 0x3a2d28);
      if (grass) dBlob(0.37, 0.12, 0.37, 0x8e9a55, x9, y9 + 0.62, z9, { chunky: true, jitter: 0.25 });
      else dGeo(FLAME, _dm.compose(_dv.set(x9, y9 + 0.55, z9), _dq.setFromEuler(_de.set(0, x9, 0)), _ds.set(1, 1.0, 1)), 0x44703a, { far: true, jitter: 0.22 });
      colliders.push(noStand({ x0: x9 - 0.43, x1: x9 + 0.43, y0: y9, y1: y9 + 0.67, z0: z9 - 0.43, z1: z9 + 0.43 }));
    }));
    hotspots.push({ kind: 'pot', x: 36.8, z: PZ9 + 0.75, y: COURT, r: 1.0, label: '향나무 화분에 물 주기', at: [36.8, (36.8 > MX1 + 1.5 ? YARD : COURT) + 1.05, PZ9] });

    { const SX0 = 23.2, SX1 = 27.9, SD = 1.5, sc = (SX0 + SX1) / 2, sz = MZ1 - SD / 2;
      addBox(SX1 - SX0, 1.0, SD, 0xe4e2dc, sc, COURT, sz, NS);
      dBox(SX1 - SX0 + 0.1, 0.1, SD + 0.1, 0xc4c2bb, sc, COURT + 1.0, MZ1 - (SD + 0.1) / 2);
      [24.3, 26.8].forEach(lx => patWall('louver', 'x', lx - 0.5, lx + 0.5, COURT + 0.2, COURT + 0.82, MZ1 - SD - 0.012, -1, 0x9a8878));
      rodL(SX1 + 0.07, COURT, sz - 0.35, SX1 + 0.07, COURT + 0.55, sz - 0.35, 0.05, 0x2a5aa8, {}, PR4); dBox(0.12, 0.08, 0.12, 0xc0302a, SX1 + 0.07, COURT + 0.5, sz - 0.35);
      rodL(SX1 - 0.02, COURT + 0.42, sz - 0.35, SX1 + 0.16, COURT + 0.42, sz - 0.35, 0.03, 0x9aa0a6);
      rodL(SX0 + 0.3, COURT + 1.12, sz + 0.2, SX0 + 1.8, COURT + 1.14, sz - 0.1, 0.018, 0x8a6a45); dBox(0.3, 0.05, 0.14, 0xc9a86a, SX0 + 0.25, COURT + 1.12, sz + 0.2);
      rodL(SX0 + 2.4, COURT + 1.12, sz + 0.3, SX0 + 3.6, COURT + 1.12, sz + 0.1, 0.015, 0x2a5aa8); dBox(0.4, 0.05, 0.12, 0x3a6ac8, SX0 + 3.7, COURT + 1.1, sz + 0.1);
      hotspots.push({ kind: 'wash', x: SX1 + 0.6, z: sz - 0.35, y: COURT, r: 1.0, label: '수돗가에서 손 씻기', at: [SX1 + 0.15, COURT + 0.4, sz - 0.35, COURT + 0.02] });

      const hp = []; for (let k = 0; k <= 8; k++) { const x9 = SX1 + 0.1 + k * 1.5; hp.push([x9, sz - 0.35 - (k ? 0.5 : 0) - Math.sin(k * 2.1) * 0.5 - (k > 4 ? (k - 4) * 0.15 : 0)]); }
      for (let k = 0; k < hp.length - 1; k++) ribbon(hp[k][0], hp[k][1], hp[k + 1][0], hp[k + 1][1], 0.035, COURT + 0.04, 0x1f1f1f); }

    [[24.6, -36.4], [38.0, -35.3]].forEach(([x9, z9]) => disc(0.35, 0x4b4843, x9, COURT + 0.026, z9));
    [[37.2, -36.3], [40.2, -38.6]].forEach(([x9, z9]) => { addPanel(0.5, 0.35, 0x55585d, x9, COURT + 0.02, z9); for (let k = 0; k < 4; k++) addPanel(0.44, 0.03, 0x33363a, x9, COURT + 0.026, z9 - 0.12 + k * 0.08); });

    objScope('plant', () => { const nx = 21.4, nz = MZ1 - 0.8;
      dCyl(0.22, 0.17, 0.42, 0xf2f2ee, nx, COURT, nz, { seg: 6 }); rodL(nx, COURT + 0.4, nz, nx, COURT + 2.1, nz, 0.045, 0x6d4e32);
      [[0.52, 0.78], [0.42, 1.08], [0.32, 1.38], [0.2, 1.66]].forEach(([r, y], k) => dBlob(r, 0.13, r, k % 2 ? 0x3f6a3a : 0x355f33, nx, COURT + y, nz, { chunky: true, ry: k * 0.7, jitter: 0.25 }));
      colliders.push(noStand({ x0: nx - 0.48, x1: nx + 0.48, y0: COURT, y1: COURT + 0.5, z0: nz - 0.48, z1: nz + 0.48 })); });
    [[20.7, -36.2], [21.9, -38.9]].forEach(([x9, z9], i) => objScope('plant', () => {
      disc(0.25, 0xe8e8e4, x9, COURT + 0.03, z9); dCyl(0.19, 0.14, 0.36, 0xf2f2ee, x9, COURT + 0.03, z9, { seg: 6 });
      rodL(x9, COURT + 0.35, z9, x9 + 0.05, COURT + 1.25 - i * 0.15, z9 - 0.04, 0.02, 0x7a6a50);
      [[0.2, 1.05, 0.1], [-0.12, 1.28, -0.08]].forEach(([ox, oy, oz], k) => dGeo(OCT, _dm.compose(_dv.set(x9 + ox, COURT + oy - i * 0.12, z9 + oz), _dq.setFromEuler(_de.set(0.15, ox * 5 + k, 0.1)), _ds.set(0.34, 0.06, 0.26)), k ? 0x6f9e44 : 0x7aa84a));
      colliders.push(noStand({ x0: x9 - 0.3, x1: x9 + 0.3, y0: COURT, y1: COURT + 0.4, z0: z9 - 0.3, z1: z9 + 0.3 }));
    }));

    NWINC.forEach(c => {
      let a = c - 1.7, b = c + 1.7;
      if (a < 23.1 && b > 23.1) b = 23.1; if (a < 28.0 && b > 28.0) a = 28.0;
      if (b - a < 1.0) return;
      const y0 = b > MX1 ? YARD + 0.005 : COURT + 0.006, m = (a + b) / 2;
      dBox(b - a, 0.95 - y0, 0.46, 0xf1ebda, m, y0, MZ1 - 0.236);
      colliders.push(noStand({ x0: a, x1: b, y0, y1: 1.01, z0: MZ1 - 0.49, z1: MZ1 }));
    });
    cut16(DX0 + 0.06, fx1 + 0.09, (u, v) => dBox(v - u, 0.45 - (YARD + 0.015), 0.03, 0xe8e3d7, (u + v) / 2, YARD + 0.015, MZ1 - 0.03));
    [0, 2, 4, 6].filter(k => k < NWINC.length - 1).forEach(k => { const x9 = (NWINC[k] + NWINC[k + 1]) / 2, y9 = x9 > MX1 ? YARD : COURT;
      rodL(x9, y9, MZ1 - 0.07, x9, FH + 0.1, MZ1 - 0.07, 0.05, 0x6f706c, {}, PR4); dBox(0.22, 0.25, 0.18, 0x77776f, x9, FH - 0.45, MZ1 - 0.1); });
    zones.push({ x0: lx1, x1: MX1, z0: MZ0, z1: MZ1, y: COURT, label: '가운데 마당' });
  }

  const E = B.eastWing, [ex0, ex1] = E.x, [ez0, ez1] = E.z, zCE = ez0 + E.corridorDepth;
  const endX = E.rooms.find(r => r.external).span[0];

  const corX = E.corridorEndX ?? endX, SR = E.rooms.filter(r => r.row !== 'corridor'), PRP = E.rooms.find(r => r.row === 'corridor'), eDoorC = r => r.door ?? doorC(r);
  foundation(ex0, ex1 + 0.15, ez0 - 0.15, ez1);
  foundation(ex0, ex1 + 0.15, ez1, ez1 + 0.15);

  const ESG = SR.filter(r => !r.external).flatMap(r => {
    const n = r.type === 'science' ? 3 : Math.max(1, Math.round((r.span[1] - r.span[0]) / 4.3)), seg = (r.span[1] - r.span[0] - 0.8) / n;
    return [...Array(n).keys()].map(k => ({ c: r.span[0] + 0.4 + seg * (k + 0.5), w: Math.min(3.2, seg - 0.5), sill: 0.95, dh: 2.85, win: true, frame: 0xa8875a, noLedge: true })); });
  wallX(ex0 - 0.15, ex1 + 0.15, ez1, 0xe8e3d7, { face: 1, ext: true, innerHex: CLS_WALL_E, gaps: ESG });
  { const zo = ez1 + 0.15, bx0 = LC.x[1] + 0.21, bx1 = ex1 + 0.09, bm = (bx0 + bx1) / 2, BY = 0.83;
    cut16(bx0, bx1, (u, v) => dBox(v - u, BY - COURT, 0.05, 0x8a4a3a, (u + v) / 2, COURT, zo + 0.025));
    patWall('brickW', 'x', bx0, bx1, COURT, BY, zo + 0.062, 1, 0xa88076);
    cut16(bx0, bx1, (u, v) => dBox(v - u, 0.12, 0.2, 0xcfcac0, (u + v) / 2, BY, zo + 0.1));
    const gs = ESG.map(g => [g.c - g.w / 2, g.c + g.w / 2]).sort((p, q) => p[0] - q[0]), piers = [];
    for (let i = 0; i < gs.length - 1; i++) piers.push([gs[i][1], gs[i + 1][0]]);
    piers.push([gs[gs.length - 1][1] + 0.3, gs[gs.length - 1][1] + 1.0]);
    piers.forEach(([a, b], i) => { const pw = Math.min(0.55, b - a - 0.06), pc = (a + b) / 2;
      dBox(pw, FH - 0.06 - COURT, 0.25, 0xe8e1cf, pc, COURT + 0.005, zo + 0.006 + 0.125);
      if (i % 2 === 1) { const hx = pc + pw / 2 + 0.12, hz = zo + 0.08;
        visRods.push({ x0: hx - 0.045, x1: hx + 0.045, y0: COURT, y1: FH + 0.05, z0: hz - 0.045, z1: hz + 0.045, r: 0.045, a: [hx, COURT, hz], b: [hx, FH + 0.05, hz] });
        dGeo(new THREE.CylinderGeometry(1, 1, 1, 4, 1, true).translate(0, 0.5, 0), _dm.compose(_dv.set(hx, COURT, hz), _dq.identity(), _ds.set(0.045, FH + 0.05 - COURT, 0.045)), 0x8d9094); }
      if (i === 0) [1.35, 1.7].forEach(y9 => dCyl(0.13, 0.13, 0.14, 0xf2f2ee, pc, y9, zo + 0.26, { seg: 5, rot: [Math.PI / 2, 0, 0] }));
    });
  }

  const ECR = 0xe8e3d7;

  const EFR = 0xa58660, NW = [{ c: (LC.x[0] + LC.x[1]) / 2 + 0.15, w: LC.x[1] - LC.x[0] - 0.8, sill: 1.15, dh: 2.55, win: true, frame: EFR }, ...[15.7, 19.45, 23.2, 26.9, 30.65, 34.4, 38.3, 43.2].map(c => ({ c, w: 2.2, sill: 1.0, dh: 2.5, win: true, frame: EFR }))];
  wallX(LC.x[0] + 0.15, ex1 + 0.15, ez0, ECR, { face: -1, ext: true, gaps: NW });
  NW.forEach(g => { if (g.c < endX) dBox(g.w + 0.1, 0.04, 0.16, 0xf3f0e8, g.c, g.sill - 0.04, ez0 + 0.23); });

  wallZ(ez0, ez1, ex1, ECR, { face: 1, ext: true, gaps: [{ c: ez0 + 1.2, w: 1.3, sill: 1.0, dh: 2.2, win: true }, { c: ez0 + 2.9, w: 1.0, door: true, color: 0xe9e8e2 }, { c: ez1 - 1.4, w: 1.2, sill: 1.2, dh: 2.4, win: true }] });
  wallRun('z', zCE + 0.15, ez1 - 0.15, ex0, INNER, { inner: true, face: -1, innerHex: CLS_WALL_E });
  addBox(0.5, FH, 0.3, INNER, ex0 + 0.25, 0, ez0 + 0.3);
  dBox(0.03, 0.12, 0.08, 0xf4f4f2, ex0 - 0.165, 1.2, zCE - 0.02);

  const DOORC = 0xe6ddcc, eGaps = SR.filter(r => !r.innerOnly && !r.external).map(r => ({ c: eDoorC(r), w: 1.2, dh: 2.2, color: DOORC }));
  SR.filter(r => twoDoor(r) && r.type !== 'science').forEach(r => eGaps.push({ ...backDoor(r), dh: 2.2, color: DOORC }));

  const eWins = [], SCI = SR.find(r => r.type === 'science'), prepX = PRP ? SCI.span[1] - 0.15 - 1.9 : null;
  SR.forEach(r => {
    if (r.type === 'classroom') { const a = doorC(r) + 0.75, b = backDoor(r).c - 0.75, p = r.name === '4학년' ? 0.5 : 0.8, w9 = (b - a - p) / 2;
      eWins.push({ c: a + w9 / 2, w: w9, sill: 1.5, dh: 2.5, win: true, frame: 0xd8cfbd }, { c: b - w9 / 2, w: w9, sill: 1.5, dh: 2.5, win: true, frame: 0xd8cfbd }); }
    else if (r.type === 'science') { const a = PRP ? corX + 1.1 : eDoorC(r) + 0.75, b = PRP ? prepX - 1.2 : r.span[1] - 1.35;
      eWins.push({ c: (a + b) / 2, w: Math.min(2.3, b - a - 0.4), sill: 1.5, dh: 2.5, win: true, frame: 0xd8cfbd }); }
  });
  const eSplit = SCI.span[0], eAll = [...eGaps, ...eWins];

  wallX(ex0 - 0.15, eSplit, zCE, INNER, { gaps: eAll.filter(g => g.c < eSplit), face: -1, dado: { top: 1.05, lo: 0xbfd89a, hi: CLS_WALL_E } });
  wallX(eSplit, endX - 0.15, zCE, INNER, { gaps: [...eAll.filter(g => g.c > eSplit), ...(PRP ? [{ c: prepX, w: 1.0, dh: 2.2, color: DOORC }] : [])], face: -1, inner: true, innerHex: CLS_WALL_E });
  wallZ(ez0, ez1, endX, INNER, {});

  doors.forEach(d => { if (d.ax === 'x' && !d.glass && Math.abs(d.cz - zCE) < 0.01 && d.cx > ex0 && d.cx < corX) d.lum = 1.45; });
  if (corX < endX - 0.3) wallZ(ez0, zCE, corX, INNER, {});

  const CH = 2.75, uq = (ax, a0, a1, y0, y1, line, f, tint) => patPush('cflat', ax === 'x' ? [[a0, y0, line], [a1, y0, line], [a1, y1, line], [a0, y1, line]] : [[line, y0, a0], [line, y0, a1], [line, y1, a1], [line, y1, a0]],
    [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], ax === 'x' ? [0, 0, f] : [f, 0, 0], tint);
  const unlitWall = (ax, a0, a1, line, f, gs, tint) => {
    let cur = a0;
    for (const g of gs.filter(g => g.c + g.w/2 > a0 && g.c - g.w/2 < a1).sort((p, q) => p.c - q.c)) {
      const g0 = Math.max(a0, g.c - g.w/2), g1 = Math.min(a1, g.c + g.w/2), sl = g.sill ?? 0, dh = Math.min(g.dh ?? 2.6, CH);
      if (g0 - cur > 0.01) uq(ax, cur, g0, 0, CH, line, f, tint);
      if (sl > 0.01) uq(ax, g0, g1, 0, sl, line, f, tint);
      if (CH - dh > 0.01) uq(ax, g0, g1, dh, CH, line, f, tint);
      cur = g1; }
    if (a1 - cur > 0.01) uq(ax, cur, a1, 0, CH, line, f, tint);
  };

  const PZ = zCE - 0.3, piers = new Map();
  { const W0 = ex0 - 0.15, W1 = corX - 0.15, gs = eAll.filter(g => g.c < corX).map(g => [g.c - g.w/2, g.c + g.w/2]);
    eGaps.forEach(g => { const a = g.c - g.w/2, b = g.c + g.w/2;
      const pv = Math.max(W0, ...gs.filter(q => q[1] <= a + 1e-6).map(q => q[1])), nx = Math.min(W1, ...gs.filter(q => q[0] >= b - 1e-6).map(q => q[0]));
      [[pv, a, -1], [b, nx, 1]].forEach(([u, v, s]) => { const L = v - u; if (L < 0.1499) return;
        const [p0, p1] = L <= 2.4 ? [u, v] : s < 0 ? [a - 0.4, a] : [b, b + 0.4]; piers.set(p0.toFixed(3), [p0, p1]); }); }); }
  const onPier = x => [...piers.values()].some(([p0, p1]) => x > p0 - 1e-6 && x < p1 + 1e-6), faceZ = x => onPier(x) ? PZ : zCE - 0.15;

  piers.forEach(([p0, p1]) => { colliders.push({ x0: p0, x1: p1, y0: 0, y1: CH, z0: PZ, z1: zCE - 0.15 });
    uq('x', p0, p1, 0, CH, PZ, -1, 0xedeae6); [[p0, -1], [p1, 1]].forEach(([l9, f9]) => uq('z', PZ, zCE - 0.15, 0, CH, l9, f9, 0xdedad3)); });
  unlitWall('x', ex0 - 0.15, corX - 0.15, zCE - 0.162, -1, [...eAll, ...[...piers.values()].map(([p0, p1]) => ({ c: (p0 + p1)/2, w: p1 - p0, sill: 0, dh: CH }))], 0xedeae6);
  unlitWall('z', zCE - 0.15, ez1 + 0.15, ex0 - 0.162, -1, [], 0xf0ede9);
  {
    const x0 = ex0 - 0.15, x1 = corX - 0.15, z0 = ez0 + 0.15, z1 = zCE - 0.15, B9 = 0.3, BC = 0x34332f;
    addPanel(x1 - x0, B9, BC, (x0 + x1)/2, 0.012, z0 + B9/2); addPanel(x1 - x0, B9, BC, (x0 + x1)/2, 0.012, z1 - B9/2);
    addPanel(B9, z1 - z0 - 2*B9, BC, x0 + B9/2, 0.012, (z0 + z1)/2); addPanel(B9, z1 - z0 - 2*B9, BC, x1 - B9/2, 0.012, (z0 + z1)/2);
    floorQ('tileW', x0 + B9, x1 - B9, z0 + B9, z1 - B9, 0, 0xeadfc6);

    [16.2, corX - 0.8].forEach(x9 => { extinguisher(x9, 0, z0 + 0.14); dBox(0.14, 0.18, 0.03, 0xd0202a, x9, 0.66, z0 + 0.015); });
    dBox(0.5, 0.7, 0.12, 0x9aa0a6, 17.6, 1.75, z0 + 0.06); dBox(0.03, 0.08, 0.03, 0x5a5e63, 17.8, 2.1, z0 + 0.135);
    for (let x9 = ex0 + 1.8; x9 < corX - 1; x9 += 3.8) lamp(0.62, 0.05, 0.3, x9, CH - 0.05, (ez0 + zCE)/2);
    ceil(LC.x[1] - 0.32, corX, ez0, zCE, CH + 0.16, 'cflat');
    zones.push({ x0: ex0, x1: corX, z0: ez0, z1: zCE, y: 0, label: '동관 복도' });

    [23.0, 23.35, 23.7, 26.3, 26.65, 27.0].forEach((x9, k) => { const pz = z0 + 0.1 + (k % 2) * 0.03;
      dBox(0.28, 0.22, 0.03, 0xf7f7f2, x9, 1.0, pz); dBox(0.08, 0.06, 0.03, [0xe24b4b, 0x3b6fb5, 0x2f8f5b, 0xf2a03a][k % 4], x9 - 0.05, 1.1, pz + 0.02); });
    dBox(0.3, 0.08, 0.14, 0xf2d23a, 24.0, 1.0, z0 + 0.09);

    const zc = (ez0 + zCE)/2, fx = corX - 0.15, z0e = ez0 + 0.15, WZ = (onPier(fx - 0.01) ? PZ : zCE - 0.15) - z0e,
      pq = (za, zb, y0, y1, t, d = 0.015) => uq('z', z0e + za, z0e + zb, y0, y1, fx - d, -1, t);

    pq(0, WZ, 0, CH, 0xaca08b, 0.012);
    pq(0.05, WZ - 0.05, 2.3, 2.65, 0xc8ba9f);
    [[0.07, WZ / 2 - 0.02], [WZ / 2 + 0.02, WZ - 0.07]].forEach(([a, b]) => pq(a, b, 1.06, 2.25, 0xdfd5c1));
    for (let k = 0; k < 5; k++) { const a = 0.05 + k * (WZ - 0.1) / 5; pq(a + 0.02, a + (WZ - 0.1) / 5 - 0.02, 0.12, 0.96, 0xd5cab4); }
    pq(0, WZ, 0, 0.1, 0x6e685f);
    [[0.47, 1.95], [WZ / 2 + 0.42, 1.95]].forEach(([a, y]) => pq(a, a + 0.08, y, y + 0.05, 0xffffff, 0.018));
    dBox(0.04, 0.05, WZ - 0.12, 0xc9bda8, fx - 0.02, 0.98, z0e + WZ / 2);
  }

  eGaps.forEach(g => { const fz = zCE - 0.165, hw = g.w/2;
    dBox(g.w, 0.45, 0.03, 0xa89c88, g.c, 2.2, fz); dBox(g.w - 0.02, 0.35, 0.03, 0x9fb4bc, g.c, 2.25, fz - 0.015);
    [-1, 1].forEach(s => { if (!onPier(g.c + s * (hw + 0.05))) dBox(0.05, 2.2, 0.03, 0xa89c88, g.c + s * (hw + 0.025), 0, fz); }); });
  SR.filter(r => r.type === 'classroom').forEach(r => { const x9 = doorC(r) - 1.25, fz = faceZ(x9);
    dBox(0.36, 0.48, 0.03, 0xc8c8cc, x9, 1.25, fz - 0.015); dBox(0.32, 0.44, 0.03, 0xf0c8d8, x9, 1.27, fz - 0.03); dBox(0.26, 0.36, 0.03, 0xf6f4f0, x9, 1.31, fz - 0.045); });
  { const c = eDoorC(SCI), kx = c + 0.72, nx9 = c - 0.95, kz = faceZ(kx) - 0.015, nz = faceZ(nx9) - 0.015;
    dBox(0.07, 0.22, 0.03, 0x15171a, kx, 1.05, kz); dBox(0.04, 0.08, 0.03, 0x3b6fe0, kx, 1.12, kz - 0.015);
    dBox(0.3, 0.42, 0.03, 0xf0c8d8, nx9, 1.2, nz); dBox(0.24, 0.34, 0.03, 0xfbf6f8, nx9, 1.24, nz - 0.015);
    hotspots.push({ kind: 'keypad', x: kx, z: zCE - 0.8, y: 0, r: 0.8, label: '번호키 누르기', at: [kx, 1.15, kz] }); }
  SR.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && !r.external) addBox(0.3, FH, ez1 - zCE - 0.3, CLS_WALL_E, s0, 0, (zCE + ez1)/2);
    const z0 = (r.external ? ez0 : zCE) + 0.15, x0 = s0 + 0.15, x1 = s1 - 0.15;
    floorQ(r.external || r.type === 'storage' ? 'tileW' : r.type === 'science' ? 'tileG' : 'wood', x0, x1, z0, ez1 - 0.15, 0, r.external ? 0xb9b6ae : 0xffffff);
    zones.push({ x0: s0, x1: s1, z0: r.external ? ez0 : zCE, z1: ez1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'science') {
      if (r.type === 'science') { labRoom(s0 + 0.15, s1 - 0.15, zCE + 0.15, ez1 - 0.15, eDoorC(r), PRP ? zCE - 0.25 : zCE + 1.45, prepX); [3.45, 5.75].forEach(k => acUnit(cx, FH - 0.16, zCE + k));
        eWins.filter(g => g.c > s0 && g.c < s1).forEach(g => [1, -1].forEach(f => patWall('film2', 'x', g.c - g.w/2 + 0.06, g.c + g.w/2 - 0.06, g.sill + 0.06, g.dh - 0.06, zCE + f * 0.09, f))); }
      else { const g4 = r.name === '4학년';
        westClass(r.name, s0 + 0.15, s1 - 0.15, zCE + 0.15, ez1 - 0.15, 0, { sill: 0.9, ceilH: FH - 0.16, style: g4 ? 'g4' : '' });
        acUnit(cx, FH - 0.16, zCE + 3.45);

        const dg = eGaps.filter(g => g.c > s0 && g.c < s1).map(g => [g.c - g.w/2 - 0.02, g.c + g.w/2 + 0.02]).sort((p, q) => p[0] - q[0]);
        let a9 = s0 + 0.15; for (const [u, v] of [...dg, [s1 - 0.15, s1 - 0.15]]) { if (u - a9 > 0.2) { dBox(u - a9, 0.07, 0.03, 0xe6dfc8, (a9 + u)/2, 1.05, zCE + 0.165); dBox(u - a9, 0.03, 0.04, LIME, (a9 + u)/2, 1.12, zCE + 0.17); } a9 = v; }
        if (g4) {
          const wv = eWins.filter(g => g.c > s0 && g.c < s1).sort((p, q) => p.c - q.c), vx = (wv[0].c + wv[0].w/2 + wv[1].c - wv[1].w/2) / 2;
          dBox(0.44, 0.42, 0.22, 0xf2f3f4, vx, 2.1, zCE + 0.26); dBox(0.3, 0.26, 0.03, 0xd2d6da, vx, 2.18, zCE + 0.385);
          const n9 = Math.max(1, Math.round((s1 - s0) / 4.3)), sg9 = (s1 - s0 - 0.8) / n9;
          for (let k = 1; k < n9; k++) wallFan(s0 + 0.4 + sg9 * k, ez1 - 0.15, -1, 2.35);
          [0xbcd7ef, 0xc4e3bf, 0xf7e6a0, 0xf2c4d6].forEach((c9, k) => addPanel(0.55, 1.4, c9, s1 - 0.15 - 2.67 + 0.275 + k * 0.55, 0.02, ez1 - 0.15 - 1.17));
        }
      }
      [1, 2, 3].forEach(k => [-1, 1].forEach(sd => lamp(1.2, 0.05, 0.22, cx + sd * (s1 - s0) * 0.22, FH - 0.21, zCE + k * 2.3)));
      doors.forEach(d => { if (d.ax === 'x' && !d.glass && Math.abs(d.cz - zCE) < 0.01 && d.cx > s0 && d.cx < s1) d.slot = true; });
    } else if (r.innerOnly) [ez1 - 0.6, zCE + 0.6].forEach(z9 => objScope('cab', () => addBox(s1 - s0 - 0.6, 1.9, 0.5, 0x9aa0a6, cx, 0, z9)));
    else if (r.external) { [ez0 + 0.6, ez0 + 2.0].forEach(z9 => objScope('shelf', () => addBox(s1 - s0 - 0.8, 1.6, 0.6, 0x8a9096, cx - 0.2, 0, z9)));
      objScope('mat', () => addBox(1.6, 0.4, 1.2, 0x3f6fb0, cx - 0.3, 0, ez1 - 1.4)); }
    if (!r.innerOnly && !r.external) classSign(r.name, eDoorC(r), 2.5, zCE - 0.03, -1);
    ceil(s0, s1, r.external ? ez0 : zCE, ez1, FH, r.external ? 'cflat' : 'ctile');
  });
  if (PRP) { const [p0, p1] = PRP.span, pc = (p0 + p1) / 2;
    floorQ('tileW', p0 + 0.15, p1 - 0.15, ez0 + 0.15, zCE - 0.15);
    zones.push({ x0: p0, x1: p1, z0: ez0, z1: zCE, y: 0, label: PRP.name });
    ceil(p0, p1, ez0, zCE, FH, 'ctile');
    objScope('shelf', () => addBox(0.5, 1.9, 1.6, 0x9aa0a6, p0 + 0.4, 0, (ez0 + zCE) / 2));
    objScope('shelf', () => addBox(1.4, 1.9, 0.45, 0x9aa0a6, 36.35, 0, ez0 + 0.375));
    objScope('cab', () => addBox(1.2, 0.85, 0.5, 0xd8dcdf, p1 - 0.9, 0, ez0 + 0.4, NS));
    [p0 + 2.2, p1 - 2.2].forEach(x9 => lamp(1.2, 0.05, 0.22, x9, FH - 0.21, (ez0 + zCE) / 2)); }
  addBox(endX - ex0 + 0.4, 0.3, ez1 - ez0 + 0.8, 0x3a8f66, (ex0 + endX + 0.4)/2, FH, (ez0 + ez1)/2);
  addBox(ex1 + 0.4 - (endX + 0.4), 0.3, ez1 - ez0 + 0.8, 0xe6e7e3, (endX + 0.4 + ex1 + 0.4)/2, FH, (ez0 + ez1)/2);

  { const EX9 = ex1 + 0.75, EZ9 = ez1 + 0.75;
    cut16(LC.x[1] + 0.15, EX9, (u, v) => dBox(v - u, 0.35, EZ9 - (ez1 + 0.15), 0xe9e5dc, (u + v) / 2, FH - 0.056, (ez1 + 0.15 + EZ9) / 2, { far: true }));
    cut16(ez0 - 0.38, ez1 + 0.15, (u, v) => dBox(EX9 - (ex1 + 0.15), 0.35, v - u, 0xe9e5dc, (ex1 + 0.15 + EX9) / 2, FH - 0.056, (u + v) / 2, { far: true }));
    patQuad('cflat', LC.x[1] + 0.15, EX9, ez1 + 0.15, EZ9, FH - 0.064, true, 0xd9d4c6); patQuad('cflat', ex1 + 0.15, EX9, ez0 - 0.38, ez1 + 0.15, FH - 0.064, true, 0xd9d4c6);
    roofRail(LC.x[1] + 0.15, EZ9 - 0.07, EX9 - 0.07, EZ9 - 0.07, FH + 0.3); roofRail(LC.x[0] + 0.15, ez0 - 0.3, EX9 - 0.07, ez0 - 0.3, FH + 0.3);
    roofRail(EX9 - 0.07, ez0 - 0.3, EX9 - 0.07, EZ9 - 0.07, FH + 0.3); }
  {
    dBox(endX + 0.4 - ex0, 0.4, 0.05, 0xeceae4, (ex0 + endX + 0.4)/2, FH - 0.05, ez0 - 0.425, { far: true });
    const cx9 = ex1 + 0.15, cz0 = ez0 + 0.1, cz1 = ez0 + 5.7;
    dBox(1.6, 0.05, cz1 - cz0, 0xa9adb0, cx9 + 0.8, 2.65, (cz0 + cz1)/2);
    [cz0 + 0.15, cz1 - 0.15].forEach(z9 => { dRod(cx9 + 1.55, YARD, z9, cx9 + 1.55, 2.65, z9, 0.04, 0x8a9096); post(cx9 + 1.55, z9, YARD, 2.65, 0.06); });

    objScope('box', () => { for (let k = 0; k < 3; k++) dBox(1.0, 0.12, 0.85, 0x8a6a45, cx9 + 0.65, YARD + k * 0.13, cz0 + 4.85);
    dBox(0.05, 1.0, 0.8, 0xf2c230, cx9 + 0.3, YARD + 0.39, cz0 + 4.85);
    dBox(0.55, 0.3, 0.9, 0x5f6b72, cx9 + 0.8, YARD + 0.3, cz0 + 3.85); dCyl(0.18, 0.18, 0.08, 0x26282c, cx9 + 0.76, YARD + 0.12, cz0 + 4.25, { seg: 10, rot: [0, 0, Math.PI / 2] });
    colliders.push(noStand({ x0: cx9, x1: cx9 + 1.35, y0: YARD, y1: YARD + 1.4, z0: cz0 + 3.35, z1: cz0 + 5.35 })); });
    objScope('cone', () => { [cz0 + 0.45, cz0 + 0.95].forEach(z9 => { dCyl(0.03, 0.17, 0.7, 0xe8532a, cx9 + 0.35, YARD + 0.03, z9, { seg: 10 }); dCyl(0.11, 0.13, 0.1, 0xf4f4f0, cx9 + 0.35, YARD + 0.35, z9, { seg: 10 });
      dBox(0.36, 0.03, 0.36, 0x333333, cx9 + 0.35, YARD, z9); });
    colliders.push(noStand({ x0: cx9, x1: cx9 + 0.6, y0: YARD, y1: YARD + 0.75, z0: cz0 + 0.2, z1: cz0 + 1.2 })); });
    dBox(1.0, 1.2, 0.9, 0x3f7d4c, 43.5, FH + 0.3, ez0 + 3.5, { far: true }); dBox(1.06, 0.06, 0.96, 0x4f9160, 43.5, FH + 1.5, ez0 + 3.5, { far: true });
    [37.8, 39.0, 40.2].forEach(x9 => { dBox(0.9, 0.75, 0.35, 0xe8e8e6, x9, FH + 0.3, ez0 + 0.75, { far: true }); dCyl(0.25, 0.25, 0.02, 0x9a9ea2, x9, FH + 0.68, ez0 + 0.56, { seg: 12, rot: [Math.PI / 2, 0, 0] }); });
  }

  const G = SCHOOL.gym, gx = G.center[0], gz = G.center[1], GA = G.annex, GDZ = G.doorZ;
  const gx0 = gx-G.width/2, gx1 = gx+G.width/2, gz0 = gz-G.depth/2, gz1 = gz+G.depth/2;
  const GH = G.wallHeight, GB = 0xa4674f;
  const GWU = 0x9ea4aa, GWN = 0xc8646e, GBZ = -24.85, GUP = 1.3;
  const GCZ0 = GDZ - 3.15, GCZ1 = GDZ + 3.15, GTZ = GCZ1 + 2.2;
  const GBW = [gx0 + 6.5, gx0 + 8.5, gx - 1, gx + 1, gx1 - 8.5, gx1 - 6.5];
  const NZ = gz0 + 5.1, SX0 = gx0 + 5, SX1 = gx1 - 5;
  const WAIN = 1.8, GWS = 1.85, GWT = 3.2, GRN = 0x6aa84f, BEI = 0xe3d6bf, NAVY = 0x1f2a5c, BLUW = 0x7fa8d8, BOOTH = 0x9ccc7c;
  const HALLD = { innerHex: BEI }, RAMPD = { top: 1.0, lo: BEI, hi: BLUW };
  const EXZ = gz1 - 1.9;
  const GWW = [NZ + 2.3, NZ + 5.6, gz1 - 6.9, gz1 - 3.6], GWB = gz0 + 2.5;
  const WIN = c => ({ c, w: 1.2, sill: GWS, dh: GWT, win: true, frame: 0xf2f0ea, noLedge: true });
  const AOH = { aoFl: GYF, aoTop: GYF + GH };
  const fBox = (w, h, d, hex, x, y, z, ns) => { dBox(w, h, d, hex, x, y, z); const c = { x0: x - w/2, x1: x + w/2, y0: y, y1: y + h, z0: z - d/2, z1: z + d/2 }; colliders.push(ns ? noStand(c) : c); };
  foundation(gx0 - 0.15, gx1 + 0.15, gz0 - 0.15, gz1 + 0.15, GYF);
  foundation(gx1 + 0.15, GA.x[1] + 0.15, GA.z[0] - 0.15, GA.z[1] + 0.15, GYF);

  const BR = { ...AOH, y0: GYF, h: 3.2, ext: true };
  wallX(gx0 - 0.15, gx1 + 0.15, gz1, GB, { ...BR, _a0: gx0 + 0.15, _a1: gx1 - 0.15, skin: 'brickG', face: 1, ...HALLD,
    gaps: GBW.map(WIN) });
  wallRun('x', gx0 - 0.15, SX0, gz0, GB, { ...BR, _a0: gx0 + 0.15, _a1: SX0 - 0.15, aoTop: GYF + 3.2, skin: 'brickG', face: -1, innerHex: BOOTH, gaps: [WIN((gx0 + SX0) / 2)] });
  wallRun('x', SX0, SX1, gz0, GB, { ...BR, _a0: SX0 + 0.15, _a1: SX1 - 0.15, skin: 'brickG', face: -1, innerHex: BEI });
  wallRun('x', SX1, gx1 + 0.15, gz0, GB, { ...BR, _a0: SX1 + 0.15, _a1: gx1 - 0.15, aoTop: GYF + 3.2, skin: 'brickG', face: -1, dado: RAMPD, gaps: [WIN(gx1 - 2.4)] });
  wallRun('z', gz0 + 0.15, NZ, gx0, GB, { ...BR, _a0: gz0 + 0.15, _a1: NZ - 0.15, aoTop: GYF + 3.2, skin: 'brickG', face: -1, innerHex: BOOTH, gaps: [WIN(GWB)] });
  wallRun('z', NZ, gz1 - 0.15, gx0, GB, { ...BR, _a0: NZ + 0.15, _a1: gz1 - 0.15, skin: 'brickG', face: -1, ...HALLD,
    gaps: [...GWW.map(WIN), { c: EXZ, w: 1.0, dh: 2.2, door: true, late: true, swing: { n: -1, leaves: [1.0], look: 'plain', color: 0xf4f4f0 } }] });
  wallRun('z', gz0 + 0.15, GA.z[0], gx1, GB, { ...BR, _a0: gz0 + 0.15, _a1: NZ - 0.15, aoTop: GYF + 3.2, skin: 'brickG', face: 1, dado: RAMPD });
  wallRun('z', GA.z[0], NZ, gx1, 0xeeeeea, { ...BR, _a0: gz0 + 0.15, _a1: NZ - 0.15, aoTop: GYF + 3.2, face: 1, dado: RAMPD });
  wallRun('z', NZ, GA.z[1], gx1, 0xeeeeea, { ...BR, _a0: NZ + 0.15, _a1: gz1 - 0.15, face: 1, ...HALLD, gaps: [
    { c: GDZ, w: 1.7, dh: 2.3, door: true, swing: { n: -1, leaves: [1.1, 0.6], look: 'quilt' } }] });

  wallRun('z', GA.z[1], gz1 - 0.15, gx1, GB, { ...BR, _a0: NZ + 0.15, _a1: gz1 - 0.15, skin: 'brickG', face: 1, ...HALLD });

  const UP = { ...AOH, y0: GYF + 3.2, h: GH - 3.2 };
  wallX(gx0 - 0.15, gx1 + 0.15, gz0, GWN, { ...UP, _a0: gx0 + 0.15, _a1: gx1 - 0.15, wins: 8, sill: 2.2, wh: 1.4, frame: 0x9aa0a6 });
  wallX(gx0 - 0.15, gx1 + 0.15, gz1, GWU, { ...UP, _a0: gx0 + 0.15, _a1: gx1 - 0.15, ext: true, innerHex: BEI, face: 1, gaps: GBW.map(c => ({ c, w: 1.6, sill: 2.3, dh: 3.0, win: true, frame: 0xf2f2f0, noLedge: true })) });
  wallZ(gz0, gz1, gx0, GWU, { ...UP, ext: true, innerHex: BEI, face: -1 });
  wallZ(gz0, gz1, gx1, GWU, { ...UP, ext: true, innerHex: BEI, face: 1 });
  floorQ('gymw', gx0 + 0.15, gx1 - 0.15, gz0 + 0.15, gz1 - 0.15, GYF);

  const wain = (ax, a0, a1, line, s, cuts = []) => { let a = a0; [...cuts, [a1, a1]].sort((p, q) => p[0] - q[0]).forEach(([u, v]) => {
      if (u - a >= 0.15) { patWall('ribG', ax, a, u, GYF, GYF + WAIN, line + s * 0.012, s); baseboards.push({ ax, a0: a, a1: u, o: line, s, y: GYF + WAIN, h: 0.07, t: 0.05, col: 0x9a7a55 }); }
      a = Math.max(a, v); }); };
  wain('x', gx0 + 0.15, gx1 - 0.15, gz1 - 0.15, -1);
  wain('z', NZ + 0.15, gz1 - 0.15, gx0 + 0.15, 1, [[EXZ - 0.5, EXZ + 0.5]]);
  wain('z', NZ + 0.15, gz1 - 0.15, gx1 - 0.15, -1, [[GDZ - 0.85, GDZ + 0.85]]);
  wain('x', gx0 + 0.15, SX0 + 0.15, NZ + 0.15, 1, [[(gx0 + SX0) / 2 - 0.6, (gx0 + SX0) / 2 + 0.6]]);
  wain('x', SX1 - 0.15, gx1 - 0.15, NZ + 0.15, 1, [[SX1 + 1.4, SX1 + 2.6], [gx1 - 1.65, gx1 - 0.15]]);
  {
    const cur = (ax, c, face) => [-1, 1].forEach(sd => ax === 'x'
      ? dBox(0.4, 1.55, 0.05, 0x1f2d5a, c + sd * 0.75, GYF + WAIN, face + (face > gz ? -0.085 : 0.085))
      : dBox(0.05, 1.55, 0.4, 0x1f2d5a, face + (face < gx ? 0.085 : -0.085), GYF + WAIN, c + sd * 0.75));
    GBW.forEach(c => cur('x', c, gz1 - 0.15)); GWW.forEach(c => cur('z', c, gx0 + 0.15));
  }
  {
    const BT = GYF + GH - 0.17, BH = 0.55, BC = 0x2b3a67, z0b = NZ + 0.15, z1b = gz1 - 0.15, zc = (z0b + z1b) / 2, L = z1b - z0b;
    for (let k = 1; k <= 4; k++) { const x9 = gx0 + G.width * k / 5, o9 = { far: true, at: [gx, (GBZ + gz1 + 0.5) / 2] };
      dBox(0.34, 0.06, L, BC, x9, BT - 0.06, zc, { ...o9, flat: true }); dBox(0.34, 0.06, L, BC, x9, BT - BH, zc, { ...o9, flat: true }); dBox(0.1, BH - 0.12, L, 0x34467c, x9, BT - BH + 0.06, zc, o9); }
  }
  {
    const RIB = 0x8e949b, RIBN = 0xb4545e, TRIM = 0xe9dfc4, Y3 = GYF + 3.2, TOP = GYF + GH - 0.05, TOPU = GYF + GH + GUP - 0.05;

    const ribs = (ax, a0, a1, line, f, wz = null, band = false, col = RIB) => { for (let a = a0 + 0.5; a < a1 - 0.4; a += 0.8) {
      const top = (ax === 'x' ? line > GBZ : a > GBZ + 0.1) ? TOPU : TOP, hit = wz && wz.some(c => Math.abs(a - c) < 0.87);
      const segs = band ? [[Y3 + 0.15, Y3 + 2.05], [Y3 + 3.75, top]] : hit ? [[Y3 + 0.15, Y3 + 2.25], [Y3 + 3.05, top]] : [[Y3 + 0.15, top]];
      segs.forEach(([y0, y1]) => { if (ax === 'x') dBox(0.1, y1 - y0, 0.04, col, a, y0, line + f*0.17); else dBox(0.04, y1 - y0, 0.1, col, line + f*0.17, y0, a); }); } };
    ribs('x', gx0, gx1, gz0, -1, null, true, RIBN); ribs('x', gx0, gx1, gz1, 1, GBW); ribs('z', gz0, gz1, gx0, -1); ribs('z', gz0, GA.z[0] - 0.3, gx1, 1); ribs('z', GA.z[1] + 0.3, gz1, gx1, 1);
    for (let a = gx0 + 0.5; a < gx1 - 0.4; a += 0.8) dBox(0.1, GUP - 0.45, 0.04, RIB, a, GYF + GH + 0.4, GBZ - 0.02);
    dBox(G.width + 0.4, 0.15, 0.1, TRIM, gx, Y3 - 0.1, gz0 - 0.2); dBox(G.width + 0.4, 0.15, 0.1, TRIM, gx, Y3 - 0.1, gz1 + 0.2);
    dBox(0.1, 0.15, G.depth + 0.2, TRIM, gx0 - 0.2, Y3 - 0.1, gz);
    GBW.forEach(c => dBox(1.4, 0.06, 0.12, TRIM, c, GYF + GWS - 0.06, gz1 + 0.21));
    GWW.concat(GWB).forEach(c => dBox(0.12, 0.06, 1.4, TRIM, gx0 - 0.21, GYF + GWS - 0.06, c));
    [(gx0 + SX0) / 2, gx1 - 2.4].forEach(c => dBox(1.4, 0.06, 0.12, TRIM, c, GYF + GWS - 0.06, gz0 - 0.21));
    [gx0 + 8, gx1 - 7].forEach(x9 => dCyl(0.05, 0.05, GH - 0.1, 0xc5c9cc, x9, GYF, gz0 - 0.3, { seg: 6 }));
    {
      const lx = gx1 + 0.62, lz = (GA.z[1] + gz1) / 2 + 0.2, L0 = GYF + 2.6, L1 = GYF + GH + GUP + 0.9, S9 = 0x9aa0a6;
      [-0.22, 0.22].forEach(o => { dRod(lx, L0, lz + o, lx, L1, lz + o, 0.03, S9, { far: true }); dRod(gx1 + 0.16, L0 + 0.3, lz + o, lx, L0 + 0.3, lz + o, 0.025, S9); dRod(gx1 + 0.16, L1 - 0.6, lz + o, lx, L1 - 0.6, lz + o, 0.025, S9); });
      for (let y = L0 + 0.3; y < L1 - 0.1; y += 0.3) dRod(lx, y, lz - 0.22, lx, y, lz + 0.22, 0.015, S9);
      const hoop = new THREE.TorusGeometry(0.38, 0.022, 4, 10, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2);
      for (let y = L0 + 2.0; y < L1; y += 0.8) dGeo(hoop, new THREE.Matrix4().makeTranslation(lx, y, lz), S9, { far: true });
      [-0.3, -0.1, 0.1, 0.3].forEach(o => { const r = Math.sqrt(Math.max(0, 0.38 * 0.38 - o * o)); dRod(lx + r, L0 + 2.0, lz + o, lx + r, L1 - 0.2, lz + o, 0.012, S9); });
    }

    const LN = 0xf5f1e6, GL = 0x2f6b45, CX0 = gx0 + 1.85, CX1 = gx1 - 1.85, CZ0c = NZ + 1.0, CZ1c = gz1 - 1.0, cw9 = CX1 - CX0, cc9 = gx, ch9 = CZ1c - CZ0c, cz9 = (CZ0c + CZ1c) / 2;
    addPanel(cw9, 0.08, LN, cc9, GYF + 0.022, cz9 - ch9/2); addPanel(cw9, 0.08, LN, cc9, GYF + 0.022, cz9 + ch9/2);
    addPanel(0.08, ch9 - 0.08, LN, CX0 + 0.04, GYF + 0.022, cz9); addPanel(0.08, ch9 - 0.08, LN, CX1 - 0.04, GYF + 0.022, cz9);
    addPanel(0.08, ch9 - 0.08, LN, cc9, GYF + 0.022, cz9);
    { const VW = 18, VD = 9; addPanel(VW, 0.06, GL, cc9, GYF + 0.018, cz9 - VD/2); addPanel(VW, 0.06, GL, cc9, GYF + 0.018, cz9 + VD/2);
      [cc9 - VW/2 + 0.03, cc9 - 3, cc9 + 3, cc9 + VW/2 - 0.03].forEach(x9 => addPanel(0.06, VD - 0.06, GL, x9, GYF + 0.018, cz9)); }
    const ring9 = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.83, 40), new THREE.MeshLambertMaterial({ color: LN }));
    ring9.rotation.x = -Math.PI/2; ring9.position.set(cc9, GYF + 0.023, cz9); ring9.matrixAutoUpdate = false; ring9.updateMatrix(); scene.add(ring9);

    [[gx0 + 0.15, 1]].forEach(([W, dir]) => objScope('goal', () => {
      const X = a => W + dir * a, PB = 0x2f4fa8, WH = 0xf2f2f0, BY = GYF + 2.9, BL = X(2.9);
      dBox(0.6, 0.55, 1.3, WH, X(0.3), GYF, cz9); colliders.push(noStand({ x0: Math.min(W, X(0.6)), x1: Math.max(W, X(0.6)), y0: GYF, y1: GYF + 0.55, z0: cz9 - 0.65, z1: cz9 + 0.65 }));
      dBox(1.3, 0.1, 1.1, 0x3a3d44, X(1.25), GYF, cz9);
      [-0.45, 0.45].forEach(o => dCyl(0.05, 0.05, 0.04, 0x222222, X(1.8), GYF + 0.012, cz9 + o, { seg: 8, rot: [Math.PI / 2, 0, 0] }));
      dBox(0.35, 2.3, 0.35, PB, X(1.3), GYF + 0.1, cz9); colliders.push(noStand({ x0: X(1.3) - 0.175, x1: X(1.3) + 0.175, y0: GYF, y1: GYF + 2.4, z0: cz9 - 0.175, z1: cz9 + 0.175 }));
      dRod(X(1.3), GYF + 2.35, cz9, X(2.8), GYF + 3.7, cz9, 0.05, WH); dRod(X(1.3), GYF + 1.9, cz9, X(2.8), GYF + 3.0, cz9, 0.05, WH);
      glassPane('z', 1.8, 1.05, cz9, BY, BL);
      dBox(0.2, 0.05, 1.9, WH, BL, BY + 1.05, cz9); dBox(0.2, 0.05, 1.9, WH, BL, BY - 0.05, cz9);
      [-1, 1].forEach(sd => dBox(0.2, 1.05, 0.05, WH, BL, BY, cz9 + sd * 0.925));
      const FX = BL + dir * 0.095; dBox(0.03, 0.05, 0.59, 0xd94848, FX, BY + 0.12, cz9); dBox(0.03, 0.05, 0.59, 0xd94848, FX, BY + 0.52, cz9);
      [-1, 1].forEach(sd => dBox(0.03, 0.35, 0.05, 0xd94848, FX, BY + 0.17, cz9 + sd * 0.27));
      const rx = BL + dir * 0.38;
      dGeo(new THREE.TorusGeometry(0.23, 0.02, 5, 14).rotateX(Math.PI/2), new THREE.Matrix4().makeTranslation(rx, GYF + 3.05, cz9), 0xe8752a);
      dRod(BL + dir * 0.11, GYF + 3.05, cz9, rx - dir*0.23, GYF + 3.05, cz9, 0.025, 0xe8752a);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; dRod(rx + Math.cos(a)*0.23, GYF + 3.05, cz9 + Math.sin(a)*0.23, rx + Math.cos(a)*0.14, GYF + 2.65, cz9 + Math.sin(a)*0.14, 0.008, 0xf2f2f2); }
    }));

    objScope('mat', () => addBox(2.0, 0.15, 1.0, 0xe6dc2c, gx - 7.2, GYF, NZ + 0.8));
    objScope('trolley', () => { const bx = gx0 + 10.6, bz = gz1 - 0.75;
      dBox(0.9, 0.05, 0.55, 0xb8bcc0, bx, GYF + 0.18, bz); dBox(0.9, 0.05, 0.55, 0xb8bcc0, bx, GYF + 0.78, bz);
      [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]].forEach(([ox, oz]) => dBox(0.03, 0.95, 0.03, 0x9aa0a6, bx + ox, GYF + 0.03, bz + oz));
      dBox(0.7, 0.3, 0.4, 0xe98fb5, bx, GYF + 0.83, bz);
      [[-0.25, 0xff7043], [0, 0x4fc3f7], [0.25, 0xffd54f]].forEach(([ox, c]) => dBlob(0.1, 0.1, 0.1, c, bx + ox, GYF + 0.33, bz, { chunky: true }));
      colliders.push(noStand({ x0: bx - 0.45, x1: bx + 0.45, y0: GYF, y1: GYF + 1.13, z0: bz - 0.28, z1: bz + 0.28 })); });
    [gx0 + 2.4, gx0 + 4.5, gx0 + 6.6, gx0 + 8.6].forEach((x9, i) => objScope('mat', () => { const mz = gz1 - 2.3 - (i % 2) * 0.4; addPanel(0.6, 1.2, 0x2f7a3a, x9, GYF + 0.026, mz);
      dRod(x9 + 0.75, GYF, mz, x9 + 0.75, GYF + 0.55, mz, 0.012, 0xdddddd); dBox(0.03, 0.12, 0.16, 0xd83a3a, x9 + 0.75, GYF + 0.42, mz + 0.08);
      dCyl(0.2, 0.2, 0.014, 0x2f7a3a, x9 + 0.75, GYF + 0.012, mz, { seg: 12 }); colliders.push(noStand({ x0: x9 + 0.67, x1: x9 + 0.83, y0: GYF, y1: GYF + 0.6, z0: mz - 0.08, z1: mz + 0.16 })); }));
  }
  {
    const ST = GYF + 0.9, SCX = (SX0 + SX1) / 2, PY = GYF + 5.2;
    addBox(SX1 - SX0 - 0.3, 0.9, NZ - gz0 - 0.15, 0xb5793f, SCX, GYF, (gz0 + 0.15 + NZ)/2);
    patQuad('gymw', SX0 + 0.15, SX1 - 0.15, gz0 + 0.15, NZ, ST + 0.012, false, 0xd9c09a);
    { const x9 = SX1 - 1.3; addBox(1.4, 0.3, 0.3, 0xa96f3b, x9, GYF, NZ + 0.45); addBox(1.4, 0.6, 0.3, 0xa96f3b, x9, GYF, NZ + 0.15); }

    addBox(SX0 + 0.15 - (gx0 + 0.15), GH - 3.2, 0.3, BEI, (gx0 + 0.15 + SX0 + 0.15) / 2, GYF + 3.2, NZ);
    addBox(gx1 - 0.15 - (SX1 - 0.15), GH - 3.2, 0.3, BEI, (SX1 - 0.15 + gx1 - 0.15) / 2, GYF + 3.2, NZ);
    addBox(SX1 - SX0 - 1.0, GH - (PY - GYF), 0.3, BEI, SCX, PY, NZ);
    [SX0 + 0.325, SX1 - 0.325].forEach(x9 => { addBox(0.35, 0.9, 0.3, NAVY, x9, GYF, NZ + 0.15);
      addBox(0.35, PY + 1.0 - ST, 0.45, NAVY, x9, ST, NZ + 0.075); addBox(0.35, GH - (PY + 1.0 - GYF), 0.45, BEI, x9, PY + 1.0, NZ + 0.075); });
    addBox(SX1 - SX0 - 1.0, 1.0, 0.15, NAVY, SCX, PY, NZ + 0.225);
    sign('우리초등학교', SCX, PY + 0.5, NZ + 0.31, 0, 0.72, { bg: 'none', fg: '#ffffff' });
    [SX0 - 0.75, SX1 + 0.75].forEach(x9 => dBox(0.45, 0.7, 0.35, 0x222226, x9, GYF + 2.3, NZ + 0.325));

    dBox(SX1 - SX0 - 0.3, PY + 0.19 - (GYF + 3.2), 0.03, BEI, SCX, GYF + 3.2, gz0 + 0.165);
    dBox(9.0, 3.6, 0.04, 0xf6f6f4, SCX, ST + 0.6, gz0 + 0.2); dBox(9.3, 0.18, 0.2, 0x2a2a2e, SCX, ST + 4.2, gz0 + 0.32);
    [SX0 + 0.5, SX1 - 0.5].forEach(x9 => { dBox(0.9, PY - ST, 0.06, 0x243266, x9 + (x9 < SCX ? 0.45 : -0.45), ST, NZ - 0.9);
      colliders.push({ x0: x9 + (x9 < SCX ? 0 : -0.9), x1: x9 + (x9 < SCX ? 0.9 : 0), y0: ST, y1: PY, z0: NZ - 0.93, z1: NZ - 0.87 }); });
    hideSpots.push({ kind: 'stage', label: '무대 옆막 뒤', x: SX0 + 0.95, y: ST, z: NZ - 1.4, face: 180, w: 0.9 });
    { const px = SX0 + 1.9, pz = gz0 + 0.45;
      objScope('piano', () => { addBox(1.5, 1.2, 0.6, 0x1b1b1e, px, ST, pz, NS); dBox(1.4, 0.06, 0.26, 0x1b1b1e, px, ST + 0.7, pz + 0.43); dBox(1.3, 0.03, 0.16, 0xf4f4f2, px, ST + 0.76, pz + 0.4); });
      objScope('chair', () => addBox(0.9, 0.45, 0.35, 0x1b1b1e, px, ST, pz + 1.05, NS)); }
    objScope('table', () => addBox(1.2, 0.75, 0.6, 0x8a1f2a, SX0 + 3.6, ST, gz0 + 0.6, NS));
    { const dx = SX0 + 5.2, dz = gz0 + 0.8;
      objScope('drum', () => {
      dCyl(0.34, 0.34, 0.4, 0xb8452c, dx, ST + 0.35, dz, { seg: 14 }); dCyl(0.33, 0.33, 0.02, 0xf2e6cc, dx, ST + 0.75, dz, { seg: 14 });
      [[-0.25, -0.25], [0.25, -0.25], [0, 0.3]].forEach(([ox, oz]) => dRod(dx + ox, ST, dz + oz, dx + ox * 0.4, ST + 0.36, dz + oz * 0.4, 0.02, 0x5a3a24));
      colliders.push(noStand({ x0: dx - 0.36, x1: dx + 0.36, y0: ST, y1: ST + 0.78, z0: dz - 0.36, z1: dz + 0.36 })); });
      hotspots.push({ kind: 'drum', x: dx, z: dz + 1.0, y: ST, r: 1.2, label: '무대 북 두드리기', at: [dx, ST + 0.75, dz] }); }
    { const mx = SCX + 2.5, mz = NZ - 0.8;
      dCyl(0.14, 0.16, 0.03, 0x26282c, mx, ST + 0.012, mz, { seg: 10 }); dRod(mx, ST + 0.042, mz, mx, ST + 1.18, mz, 0.012, 0x3a3d44);
      dRod(mx, ST + 1.18, mz, mx, ST + 1.27, mz - 0.07, 0.01, 0x3a3d44);
      colliders.push(noStand({ x0: mx - 0.14, x1: mx + 0.14, y0: ST, y1: ST + 1.3, z0: mz - 0.14, z1: mz + 0.14 }));
      hotspots.push({ kind: 'mic', x: mx, z: mz - 0.3, y: ST, r: 1.3, label: '무대 마이크 잡기', at: [mx, ST + 1.2, mz], mic: [mx, ST + 1.27, mz - 0.07, Math.PI] }); }
    ceil(SX0, SX1, gz0, NZ, PY + 0.35, 'ctile');

    const BDZ = gz0 + 0.85;
    wallZ(gz0, NZ, SX0, BEI, { y0: GYF, h: 3.2, inner: true, face: 1, innerHex: BOOTH, gaps: [{ c: BDZ, w: 0.9, sill: 0.9, dh: 0.9 + 2.1, door: true, late: true, swing: { n: -1, leaves: [0.9], look: 'plain', color: 0xd8d2c4 } }] });
    wallX(gx0 + 0.15, SX0 + 0.15, NZ, BEI, { y0: GYF, h: 3.2, inner: true, face: 1, innerHex: BOOTH, gaps: [{ c: (gx0 + SX0)/2, w: 1.2 }] });
    fBox(1.2, 0.9, 1.4, 0xb9b3a6, SX0 - 0.75, GYF, gz0 + 0.85);
    [0.675, 0.45, 0.225].forEach((h9, k) => fBox(1.2, h9, 0.3, 0xb9b3a6, SX0 - 0.75, GYF, gz0 + 1.7 + 0.3 * k));
    { const cx9 = gx0 + 1.6;
      objScope('desk', () => { fBox(2.2, 0.75, 0.7, 0xe6e2da, cx9, GYF, gz0 + 0.5, true);
      [-0.5, 0.5].forEach(o => { dBox(0.55, 0.36, 0.04, 0x1c1c20, cx9 + o, GYF + 0.9, gz0 + 0.4); dBox(0.08, 0.15, 0.08, 0x3a3a3e, cx9 + o, GYF + 0.75, gz0 + 0.42); }); });
      objScope('cab', () => { fBox(0.6, 1.3, 0.6, 0x2a2a2e, gx0 + 0.55, GYF, gz0 + 1.9, true); [0.3, 0.6, 0.9].forEach(y9 => dBox(0.5, 0.04, 0.03, 0x6a6e74, gx0 + 0.55, GYF + y9, gz0 + 2.215)); });
      [[-78.2, -26.2], [-77.6, -26.7], [-78.8, -26.9]].forEach(([x9, z9]) => objScope('stand', () => { dRod(x9, GYF, z9, x9, GYF + 1.1, z9, 0.012, 0x2a2a2e); dBox(0.45, 0.3, 0.03, 0x2a2a2e, x9, GYF + 1.1, z9);
        colliders.push({ x0: x9 - 0.1, x1: x9 + 0.1, y0: GYF, y1: GYF + 1.5, z0: z9 - 0.1, z1: z9 + 0.1, nc: true }); }));
      objScope('cab', () => fBox(0.8, 0.9, 0.5, 0xd8d8d4, gx0 + 0.6, GYF, NZ - 0.55, true)); }

    const RX = gx1 - 1.65, RZ = gz0 + 1.65, DX = RX - 0.15, DZ = RZ + 0.15, PEG = 0x8fc46a;
    wallRun('z', gz0 + 0.15, DZ, SX1, BEI, { y0: GYF, h: 3.2, inner: true, face: -1, dado: RAMPD, gaps: [{ c: gz0 + 0.75, w: 1.2, sill: 0.9, dh: 0.9 + 2.1, noDoor: true }] });
    wallRun('z', DZ, NZ - 0.15, SX1, BEI, { y0: GYF, h: 3.2, inner: true, face: -1, innerHex: PEG });
    wallZ(DZ, NZ, DX, PEG, { y0: GYF, h: 3.2, face: -1, dado: RAMPD });
    wallX(SX1 + 0.15, DX + 0.15, DZ, PEG, { y0: GYF, h: 3.2, face: 1, dado: RAMPD });
    wallRun('x', SX1 - 0.15, DX, NZ, BEI, { y0: GYF, h: 3.2, inner: true, face: 1, innerHex: PEG, gaps: [{ c: SX1 + 2.0, w: 1.2 }] });
    wallRun('x', DX, gx1 - 0.15, NZ, BEI, { y0: GYF, h: 3.2, face: 1, dado: RAMPD, gaps: [{ c: (RX + gx1 - 0.15) / 2, w: 1.5, noDoor: true }] });
    slope('gymw', 'z', RX, gx1 - 0.15, NZ - 0.15, RZ, GYF + 0.012, GYF + 0.45, 6, 0xd4c3a2);
    fBox(1.5, 0.45, 1.5, 0xd4c3a2, (RX + gx1 - 0.15) / 2, GYF, (gz0 + 0.15 + RZ) / 2);
    slope('gymw', 'x', gz0 + 0.15, RZ, RX, SX1 + 0.15, GYF + 0.45, ST, 6, 0xd4c3a2);
    [[RX, 1], [gx1 - 0.15, -1]].forEach(([x9, s]) => dBox(0.04, 0.2, 1.8, 0x9a7a55, x9 + s * 0.02, GYF, NZ - 1.05));
    [[RX + 0.06, NZ - 0.2, RZ], [gx1 - 0.21, NZ - 0.2, RZ]].forEach(([x9, a, b]) => dRod(x9, GYF + 0.85, a, x9, GYF + 1.3, b, 0.02, 0xc9cdd1));
    [[gz0 + 0.21], [RZ - 0.06]].forEach(([z9]) => dRod(RX, GYF + 1.3, z9, SX1 + 0.15, ST + 0.85, z9, 0.02, 0xc9cdd1));
    { const ex = (SX1 + 0.15 + DX - 0.15) / 2;
      objScope('mat', () => { fBox(1.3, 0.9, 0.6, 0x3f6fc4, ex - 0.6, GYF, DZ + 0.5, true); [0.3, 0.6].forEach(y9 => dBox(1.32, 0.03, 0.62, 0x2f5aa8, ex - 0.6, GYF + y9, DZ + 0.5)); });
      objScope('basket', () => { dCyl(0.3, 0.26, 0.6, 0x9aa0a6, DX - 0.5, GYF, DZ + 0.55, { seg: 10 });
      [[0, 0xff7043], [0.14, 0x4fc3f7], [-0.12, 0xffd54f]].forEach(([o, c]) => dBlob(0.12, 0.12, 0.12, c, DX - 0.5 + o, GYF + 0.66, DZ + 0.55 + o * 0.5, { chunky: true }));
      colliders.push(noStand({ x0: DX - 0.8, x1: DX - 0.2, y0: GYF, y1: GYF + 0.8, z0: DZ + 0.25, z1: DZ + 0.85 })); });
      objScope('cone', () => { [0, 0.35, 0.7].forEach(o => dCyl(0.03, 0.14, 0.4, 0xff7a1a, SX1 + 0.45 + o, GYF, NZ - 0.55, { seg: 8 })); colliders.push(noStand({ x0: SX1 + 0.31, x1: SX1 + 1.29, y0: GYF, y1: GYF + 0.4, z0: NZ - 0.69, z1: NZ - 0.41 })); });
      { const jz = (DZ + NZ) / 2; dBox(0.08, 0.06, 0.9, 0x8a6a4a, SX1 + 0.19, GYF + 1.5, jz); [0, 0.25, 0.5].forEach(o => dRod(SX1 + 0.24, GYF + 1.45, jz - 0.25 + o, SX1 + 0.24, GYF + 0.9, jz - 0.25 + o, 0.012, [0xe84a5f, 0x3bb273, 0x3b8fe8][Math.round(o * 4)])); }
      sign('체육용품실', SX1 + 2.0, GYF + 2.8, NZ + 0.25, 0, 0.26); }
    sign('방송실', (gx0 + SX0)/2, GYF + 2.8, NZ + 0.25, 0, 0.3);
    sign('무대 통로', (RX + gx1 - 0.15) / 2, GYF + 2.8, NZ + 0.25, 0, 0.26);
    zones.push({ x0: gx0, x1: SX0, z0: gz0, z1: NZ, y: GYF, label: '체육관 방송실' });
    zones.push({ x0: SX1, x1: DX, z0: DZ, z1: NZ, y: GYF, label: '체육관 준비실' });
    zones.push({ x0: DX, x1: gx1, z0: gz0, z1: NZ, y: GYF, label: '무대 통로' }, { x0: SX1, x1: DX, z0: gz0, z1: DZ, y: GYF + 0.7, label: '무대 통로' });
    zones.push({ x0: SX0, x1: SX1, z0: gz0, z1: NZ, y: ST, label: '체육관 무대' });
    npcSpot['체육관'] = [{ x: SCX, y: GYF, z: NZ + 2.6, face: 2 }];
    ceil(gx0, SX0, gz0, NZ, GYF + 3.2 + 0.15, 'ctile'); ceil(SX1, gx1, gz0, NZ, GYF + 3.2 + 0.15, 'ctile');
  }
  {

    const [ax0, ax1] = GA.x, [az0, az1] = GA.z, AH = 4.4, CZ0 = GCZ0, CZ1 = GCZ1, TZ = GTZ, WHW = 0xeeeeea;
    const DN = GDZ - 1.95, DS = GDZ + 0.55, SG = GDZ + 2.25, SDX = ax0 + 3.3;
    const AWZ = [az0 + 1.5, az0 + 3.0, TZ + 1.2, TZ + 3.6, az1 - 1.1];
    wallX(gx1 + 0.15, ax1 + 0.15, az0, GB, { y0: GYF, h: AH, ext: true, skin: 'brickG', face: -1, wins: 1, sill: 1.6, wh: 0.8, innerHex: WHW });
    wallX(gx1 + 0.15, ax1 + 0.15, az1, GB, { y0: GYF, h: AH, ext: true, skin: 'brickG', face: 1, wins: 1, sill: 1.6, wh: 0.8, innerHex: WHW });
    const GSW = { glass: true, door: true, swing: { n: -1, leaves: [0.93, 0.93], look: 'glass' } };
    wallZ(az0, az1, ax1, GB, { y0: GYF, h: AH, ext: true, skin: 'brickG', face: 1, innerHex: WHW, gaps: [
      { c: DN, w: 2.0, ...GSW }, { c: DS, w: 2.0, ...GSW },
      { c: SG, w: 1.4, sill: 0, dh: 2.6, win: true, frame: 0xc9cdd1, noLedge: true },
      ...AWZ.map(c => ({ c, w: 0.7, sill: 2.0, dh: 2.55, win: true, frame: 0xf2f0ea, noLedge: true }))] });
    [[DN, 2.0], [DS, 2.0]].forEach(([c, w]) => {
      [-1, 1].forEach(sd => dBox(0.12, 2.6, 0.07, 0xc9cdd1, ax1 - 0.04, GYF, c + sd * (w/2 - 0.035)));
      dBox(0.12, 0.08, w - 0.14, 0xc9cdd1, ax1 - 0.04, GYF + 2.52, c); });
    AWZ.forEach(c => { const X = ax1 + 0.225;
      dBox(0.15, 0.08, 0.9, YEL, X, GYF + 2.55, c); dBox(0.15, 0.06, 0.9, YEL, X, GYF + 1.94, c);
      [-1, 1].forEach(sd => dBox(0.15, 0.53, 0.08, YEL, X, GYF + 2.0, c + sd * 0.41)); });
    const bb0 = baseboards.length;
    wallX(gx1 + 0.15, ax1 - 0.15, CZ0, WHW, { y0: GYF, h: 3.2, gaps: [{ c: ax0 + 2.6, w: 1.0, film: true, color: 0xf6f4f2 }] });
    wallX(gx1 + 0.15, ax1 - 0.15, CZ1, WHW, { y0: GYF, h: 3.2, gaps: [{ c: SDX, w: 0.9, dh: 2.2, glass: true, door: true, late: true, swing: { n: 1, leaves: [0.9], look: 'glass' } }] });
    for (let i = bb0; i < baseboards.length; i++) { const p = baseboards[i]; if ((Math.abs(p.o - (CZ0 + 0.15)) < 0.01 && p.s > 0) || (Math.abs(p.o - (CZ1 - 0.15)) < 0.01 && p.s < 0)) p.col = 0x2a2a2a; }
    floorQ('tileG', gx1 + 0.15, ax1 - 0.15, CZ0 + 0.15, CZ1 - 0.15, GYF);
    floorQ('ttile', gx1 + 0.15, ax1 - 0.15, az0 + 0.15, CZ0 - 0.15, GYF);
    floorQ('ttile', gx1 + 0.15, ax1 - 0.15, CZ1 + 0.15, az1 - 0.15, GYF);
    patQuad('gmat', ax1 - 1.35, ax1 - 0.2, DN - 1.0, DS + 1.0, GYF + 0.024, false, 0x55585c);
    patQuad('tactZ', ax0 + 2.3, ax0 + 2.9, CZ0 + 0.2, CZ0 + 0.8, GYF + 0.024);
    addBox(1.2, 1.1, 0.4, 0xdfe8ee, ax1 - 0.9, GYF, (az0 + 0.5 + CZ0)/2, NS);
    sign('여자 화장실', ax0 + 2.6, GYF + 2.45, CZ0 + 0.22, 0, 0.24);
    sign('남자 화장실', SDX, GYF + 2.45, CZ1 - 0.22, Math.PI, 0.24);
    dBox(0.55, 0.85, 0.16, 0xe4e4e0, ax1 - 1.2, GYF + 0.8, CZ1 - 0.23); dBox(0.45, 0.12, 0.03, 0xd8342c, ax1 - 1.2, GYF + 1.5, CZ1 - 0.325);
    {
      const tz0 = CZ1 + 0.15, tz1 = az1 - 0.15;
      [ax1 - 1.9, ax1 - 1.1].forEach(x9 => { dBox(0.38, 0.55, 0.3, 0xf4f4f2, x9, GYF + 0.4, tz1 - 0.15); colliders.push(noStand({ x0: x9 - 0.19, x1: x9 + 0.19, y0: GYF, y1: GYF + 0.95, z0: tz1 - 0.3, z1: tz1 })); });
      dBox(0.05, 1.9, 1.3, 0xd8d4cc, gx1 + 1.6, GYF + 0.1, tz1 - 0.65); colliders.push({ x0: gx1 + 1.575, x1: gx1 + 1.625, y0: GYF, y1: GYF + 2.0, z0: tz1 - 1.3, z1: tz1 });
      dBox(0.4, 0.42, 0.55, 0xf4f4f2, gx1 + 0.85, GYF, tz1 - 0.33); dBox(0.4, 0.4, 0.18, 0xf4f4f2, gx1 + 0.85, GYF + 0.42, tz1 - 0.09);
      colliders.push(noStand({ x0: gx1 + 0.65, x1: gx1 + 1.05, y0: GYF, y1: GYF + 0.82, z0: tz1 - 0.6, z1: tz1 }));
      const sx = ax1 - 0.4, sz = (tz0 + tz1) / 2;
      dBox(0.5, 0.15, 0.7, 0xf4f4f2, sx, GYF + 0.72, sz); dBox(0.25, 0.72, 0.3, 0xe8e8e4, sx + 0.08, GYF, sz); dBox(0.03, 0.6, 0.5, 0xcfe0ea, ax1 - 0.165, GYF + 1.1, sz);
      dRod(ax1 - 0.2, GYF + 0.87, sz, ax1 - 0.36, GYF + 0.97, sz, 0.015, 0xc9cdd1);
      colliders.push(noStand({ x0: sx - 0.25, x1: ax1 - 0.15, y0: GYF, y1: GYF + 0.87, z0: sz - 0.35, z1: sz + 0.35 }));
      hotspots.push({ kind: 'wash', x: sx - 0.75, z: sz, y: GYF, r: 1.0, label: '손 씻기', at: [ax1 - 0.36, GYF + 0.96, sz, GYF + 0.8] });
    }
    addBox(ax1 - gx1 + 0.25, 0.3, az1 - az0 + 0.4, 0xe6e7e3, (gx1 + 0.15 + ax1 + 0.4)/2, GYF + AH, (az0 + az1)/2);
    [-23, -19, -15, -11].forEach(z9 => { dBox(1.1, 0.8, 0.65, 0x8a8f92, gx1 + 2.0, GYF + AH + 0.3, z9, { far: true }); dCyl(0.28, 0.28, 0.03, 0x4a4e52, gx1 + 2.0, GYF + AH + 0.3 + 0.8, z9, { seg: 10 }); });
    ceil(gx1, ax1, az0, az1, GYF + 3.2 + 0.15, 'ctile');
    zones.push({ x0: gx1, x1: ax1, z0: CZ0, z1: CZ1, y: GYF, label: '체육관 전실' });
    zones.push({ x0: gx1, x1: ax1, z0: CZ1, z1: az1, y: GYF, label: '체육관 남자 화장실' });

    const LX1 = ax1 + 2.0, LZ0 = CZ0 - 0.4, LZ1 = CZ1 + 0.2, LW = 0.2, LOW = 0xe8c84a;
    addBox(LX1 - ax1 - 0.15, GYF - YARD, LZ1 - LZ0 - LW, STONE, (ax1 + 0.15 + LX1)/2, YARD, (LZ0 + LW + LZ1)/2);
    addBox(0.35, GYF - 0.15 - YARD, LZ1 - LZ0 - LW, STONE, LX1 + 0.175, YARD, (LZ0 + LW + LZ1)/2);
    addBox(0.35, GYF - 0.3 - YARD, LZ1 - LZ0 - LW, STONE, LX1 + 0.525, YARD, (LZ0 + LW + LZ1)/2);
    addBox(LX1 + 0.7 - ax1 - 0.15, 1.05 + GYF - YARD, LW, LOW, (ax1 + 0.15 + LX1 + 0.7)/2, YARD, LZ0 + LW/2, NS);
    dRod(ax1 + 0.3, GYF + 0.85, LZ0 + LW + 0.07, LX1, GYF + 0.85, LZ0 + LW + 0.07, 0.025, 0xc9cdd1);
    dRod(LX1, GYF + 0.85, LZ0 + LW + 0.07, LX1 + 0.7, YARD + 0.85, LZ0 + LW + 0.07, 0.025, 0xc9cdd1);
    dBox(0.03, 0.4, 0.6, 0x6a5a3a, ax1 + 0.165, GYF + 1.2, DN - 1.47);
    patQuad('gmat', ax1 + 0.35, ax1 + 1.95, SG - 1.3, SG + 1.1, GYF + 0.012, false, 0xd8a8a4);
    patQuad('gmat', ax1 + 0.35, ax1 + 1.15, DN - 0.6, DN + 0.6, GYF + 0.012);
    patQuad('tactZ', LX1 - 0.34, LX1 - 0.04, LZ0 + LW + 0.1, SG - 1.4, GYF + 0.012);
    patQuad('tactZ', LX1 + 0.78, LX1 + 1.08, LZ0 + LW + 0.1, LZ1, YARD + 0.022);
    const EZ0 = az0 - 0.14, EZ1 = az1 + 0.14;
    addBox(LX1 - ax1 + 0.05, 0.2, EZ1 - EZ0, 0xf1ead8, (ax1 + 0.15 + LX1 + 0.2)/2, GYF + 2.95, (EZ0 + EZ1)/2);
    dBox(0.08, 0.28, EZ1 - EZ0 + 0.16, YEL, LX1 + 0.24, GYF + 2.91, (EZ0 + EZ1)/2, { far: true });
    sign('체육관', LX1 + 0.3, GYF + 3.35, GDZ, Math.PI/2, 0.5);
    sign('튼튼한 몸과 건강한 마음', ax1 + 0.25, GYF + 1.35, SG, Math.PI/2, 0.15);
    dBox(0.03, 0.42, 1.3, 0x5cb85c, ax1 + 0.23, GYF + 0.02, SG);
    [TZ + 2.4, az1 - 0.3].forEach(z9 => dCyl(0.05, 0.05, AH - 0.2, 0xc5c9cc, ax1 + 0.24, GYF, z9, { seg: 6 }));
    const RZ0 = LZ1, RZ1 = RZ0 + 7.0;
    slope('pave', 'z', ax1 + 0.15, ax1 + 1.45, RZ0, RZ1, GYF, YARD, 10, 0xd8d4cc);
    addBox(0.2, 0.9 + GYF - YARD, RZ1 - RZ0, LOW, ax1 + 1.55, YARD, (RZ0 + RZ1)/2, NS);
    dRod(ax1 + 1.4, GYF + 0.85, RZ0, ax1 + 1.4, YARD + 0.85, RZ1, 0.025, 0xc9cdd1);
    dRod(ax1 + 0.34, GYF + 0.85, RZ0, ax1 + 0.34, YARD + 0.85, RZ1, 0.025, 0xc9cdd1);
    zones.push({ x0: ax1, x1: LX1 + 0.7, z0: LZ0, z1: LZ1, y: GYF, label: '체육관 현관' });
  }

  { const gd = gz1 + 0.5 - GBZ, gzc = (GBZ + gz1 + 0.5) / 2;
    addBox(G.width + 1, 0.4, GBZ - gz0 + 0.5, 0xb8886c, gx, GYF + GH, (gz0 - 0.5 + GBZ) / 2);
    addBox(G.width + 0.3, GUP, gz1 + 0.15 - GBZ, GWU, gx, GYF + GH, (GBZ + gz1 + 0.15) / 2);
    addBox(G.width + 1, 0.4, gd, 0x62686e, gx, GYF + GH + GUP, gzc);
    dBox(G.width + 0.88, 0.04, gd - 0.12, 0xc3c6c4, gx, GYF + GH + GUP + 0.4, gzc, { far: true }); }
  zones.push({ x0: gx0, x1: gx1, z0: NZ, z1: gz1, y: GYF, label: '체육관' });

  exitSign(hc, EZI - 0.15, 2.74, [0, -1]);
  exitSign(wx0 + 0.15, SIDE_Z, 2.74, [1, 0]);
  exitSign(wx1 - 0.15, -37.9, 2.74, [-1, 0]);
  exitSign(CL.x[1] - 0.15, CL.z[1] - 1.425, 2.74, [-1, 0]);
  exitSign(K.backDoorC, kz0 + 0.15, 2.74, [0, 1]);
  exitSign(gx1 - 0.15, GDZ, GYF + 2.74, [-1, 0]);
  exitSign(GA.x[1] - 0.15, GDZ, GYF + 2.74, [-1, 0]);
  ceil(gx0, gx1, gz0, gz1, GYF + GH, 'ctile');

  const FY = SCHOOL.frontYard, PR = SCHOOL.porch, EP = SCHOOL.eastPath, fzW = fz1 + 0.15;
  const WX0 = -38.5, WX1 = 53.5;
  const WS = -35.5;

  const cloudPine = objWrap((x, z, s, n = 4, sp = 1) => {
    const y = YARD, R9 = seeded(Math.floor(Math.abs(x * 131 + z * 71)) + 5), F9 = { far: true };
    colliders.push({ x0: x - 0.22 * s, x1: x + 0.22 * s, y0: y, y1: y + 12, z0: z - 0.22 * s, z1: z + 0.22 * s });
    let px = x, py = y, pz = z, a = R9() * 6.28;
    [[1.25, 0.07], [0.7, 0.32]].forEach(([L9, t], k) => { const L = L9 * s;
      dCyl(0.15 * s * (1 - k * 0.25), 0.2 * s * (1 - k * 0.25), L, 0x5a4636, px, py, pz, { far: true, seg: 7, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] });
      px += Math.sin(t) * Math.cos(a) * L; py += Math.cos(t) * L; pz += Math.sin(t) * Math.sin(a) * L; a += 2.0 + R9() * 1.0; });
    const PG = [0x719a52, 0x7aa45a, 0x6c944e], a0 = R9() * 6.28, pads = [];
    for (let k = 0; k < n; k++) pads.push([a0 + k * 6.28 / n + (R9() - 0.5) * 0.7, (1.1 + R9() * 0.3) * sp, 2.0 + R9() * 0.2, 0.82 + R9() * 0.12]);
    for (let k = 0; k < 2; k++) pads.push([a0 + 0.8 + k * 3.14 + (R9() - 0.5) * 0.5, 0.55 * sp, 2.75 + R9() * 0.15, 0.78]);
    pads.push([a0, 0.1, 3.35, 0.7]);
    pads.forEach(([ang, d, h, r], k) => { const cx = x + Math.cos(ang) * d * s, cz = z + Math.sin(ang) * d * s, cy = y + h * s, rr = r * s;
      if (k < Math.min(n, 3)) dRod(px, py, pz, cx, cy - rr * 0.3, cz, 0.065 * s, 0x5a4636, F9);
      const top9 = k === pads.length - 1;
      dBlob(rr * 1.15, rr * 0.56, rr, top9 ? 0x4c7641 : PG[k % 3], cx, cy, cz, { far: true, chunky: k >= n, ry: ang, jitter: 0.12 });
      if (!top9) dBlob(rr * 1.08, rr * 0.36, rr * 0.94, 0x4a7440, cx, cy + rr * 0.2, cz, { far: true, chunky: true, ry: ang + 1, jitter: 0.12 }); });
  }, 'tree');

  const layerPine = objWrap((x, z, s) => {
    const y = YARD, R = seeded(Math.floor(Math.abs(x * 97 + z * 53)) + 11), ax = R() < 0.5 ? 0 : Math.PI;
    const zW = fzW + 0.62, zS = FY.walkN - 0.12, PL = [0x8ca45a, 0x96ad62, 0x869c54];
    colliders.push({ x0: x - 0.2 * s, x1: x + 0.2 * s, y0: y, y1: y + 12, z0: z - 0.2 * s, z1: z + 0.2 * s });
    colliders.push(noStand({ x0: x - 2.2, x1: x + 2.2, y0: y, y1: y + 1.0, z0: fzW + 0.25, z1: FY.strip + 1.75 }));
    [0, 1].forEach(k => { const a = ax + k * Math.PI + (R() - 0.5) * 0.6, t = 0.5 + R() * 0.2; dCyl(0.08 * s, 0.13 * s, 1.5 * s, 0x6a4a36, x, y, z, { far: true, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] }); });
    const pad = (cx, h, cz, r, k) => { const zc = Math.min(Math.max(cz, zW + 0.85 * r), zS - 0.85 * r);
      dBlob(r * 1.25, r * 0.42, r * 0.85, PL[k % 3], cx, y + h, zc, { far: true, ry: (R() - 0.5) * 0.4, jitter: 0.12 });
      dBlob(r * 0.9, r * 0.2, r * 0.62, 0x7f9f55, cx, y + h + r * 0.3, zc, { far: true, chunky: true, ry: R(), jitter: 0.12 }); };
    [-1, 1].forEach((sg, k) => pad(x + sg * (0.5 + R() * 0.2) * s, 1.0 * s, z - 0.25, 0.9 * s, k));
    [-1, 1].forEach((sg, k) => { const a = ax + (sg > 0 ? 0 : Math.PI) + (R() - 0.5) * 1.4, d = (0.9 + R() * 0.5) * s;
      pad(x + Math.cos(a) * d, 1.7 * s, z + Math.sin(a) * d, 0.8 * s, k + 1); });
    { const a = R() * 6.28, d = (0.3 + R() * 0.3) * s; pad(x + Math.cos(a) * d, 2.25 * s, z + Math.sin(a) * d, 0.7 * s, 2); }
  }, 'tree');
  {
    const N0 = FY.walkN, S0 = FY.walkS, C = 0.12, TX = (N0 + S0) / 2, AY = YARD + 0.012;

    const tri9 = (kind, A, B9, C9, tint = 0xffffff) => { const S9 = PATDEF[kind][0], P9 = [A, B9, C9, C9].map(([x, z]) => [x, AY, z]); patPush(kind, P9, P9.map(q => [q[0] / S9, -q[2] / S9]), [0, 1, 0], tint); };
    const quad9 = (kind, A, B9, C9, D9, tint = 0xffffff) => { const S9 = PATDEF[kind][0], P9 = [A, B9, C9, D9].map(([x, z]) => [x, AY, z]); patPush(kind, P9, P9.map(q => [q[0] / S9, -q[2] / S9]), [0, 1, 0], tint); };
    const curb9 = (x0, z0, x1, z1) => { const L9 = Math.hypot(x1 - x0, z1 - z0); if (L9 < 0.03) return;
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, YARD + 0.04, (z0 + z1) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.atan2(z1 - z0, x1 - x0), 0)), new THREE.Vector3(L9 + 0.1, 0.08, C)), 0xa9a59c, { far: true }); };

    const NBX = -37.2, RN = 1.7, NCX = WS, NCZ = N0 - C - RN, CW = 0.25;
    const ARC = Array.from({ length: 7 }, (_, i) => { const t = Math.PI - (Math.PI / 2) * i / 6; return [NCX + RN * Math.cos(t), NCZ + RN * Math.sin(t)]; });
    const SB = [[WS, S0 + C], [WS - 0.55, S0 + C + 0.13], [WS - 0.95, S0 + C + 0.43], [WS - 1.2, S0 + C + 0.88], [WS - 1.4, S0 + C + 1.48], [WS - 2.0, S0 + C + 2.68], [WS - 2.6, TERR_Z]];

    const GN = 0xe9cadb, GS = 0xdcb898;
    [[NBX, EN.x[0]], [EN.x[1], fx1 + 0.15]].forEach(([a, b]) => { addPanel(b - a, CW, 0xc4c1b8, (a + b) / 2, AY, fzW + CW / 2); patQuad('grass', a < WS ? WS : a, b, fzW + CW, N0 - C, AY, false, GN); });
    patQuad('grass', NBX, WS, fzW + CW, NCZ, AY, false, GN);
    for (let i = 0; i < 6; i++) tri9('grass', [NCX, NCZ], ARC[i], ARC[i + 1], GN);

    { const EW = 54.15, BZ0 = fz1 - 10.3, BZ1 = N0 - C, BRK9 = 0xbf7873, GRY9 = 0xcfc8bc;
      patQuad('grass', EW, WX1 + 3, fz1 - 10, N0 - C, AY, false, 0xe9f2df);
      patQuad('ilock', fx1 + 0.15, 52.5, BZ0, BZ1, AY, false, GRY9); patQuad('ilock', 52.5, 52.8, BZ0, BZ1, AY, false, BRK9); patQuad('ilock', 52.8, EW, BZ0, BZ1, AY, false, GRY9);
      addBox(0.9, 0.15, 1.7, 0xc9c6be, fx1 + 0.15 + 0.45, YARD, (fz0 + zCor) / 2);
      addBox(0.15, 0.15, 13.4, 0xc4c1b8, EW + 0.075, YARD, -27.3);

      const PZ0 = -34.0, PZ1 = -20.6, TIER = [[EW + 0.15, 55.75, 0.3], [55.75, 57.35, 0.6], [57.35, 59.7, 0.9]], R6 = seeded(6061);
      TIER.forEach(([a, b, h], k) => {
        addBox(b - a, h, PZ1 - PZ0, 0x7d6a55, (a + b) / 2, YARD, (PZ0 + PZ1) / 2, NS);
        for (let z9 = PZ0 + 0.35; z9 < PZ1 - 0.2; z9 += 0.8 + R6() * 0.3) { const r9 = 0.2 + R6() * 0.1;
          dBlob(r9 * 1.2, r9 * 0.9, r9, [0xa9a69e, 0x9a978f, 0xbab7ae][Math.floor(R6() * 3) % 3], a + 0.05, YARD + h - r9 * 0.5, z9, { chunky: true, jitter: 0.2, ry: z9 }); }
        for (let z9 = PZ0 + 0.8; z9 < PZ1 - 0.5; z9 += 1.6 + R6() * 0.8) { const r9 = 0.3 + R6() * 0.2, x9 = (a + b) / 2 + (R6() - 0.5) * (b - a - 0.6);
          dBlob(r9, r9 * 0.8, r9, [0x5a8f45, 0x6b9c4c, 0x4f8540, 0x86b060][Math.floor(R6() * 4) % 4], x9, YARD + h + r9 * 0.5, z9, { chunky: true, jitter: 0.18, ry: z9 });
          if (k === 0 && R6() > 0.4) { dBox(0.03, 0.3, 0.03, 0xe8e4d8, a + 0.35, YARD + h, z9 + 0.5); dBox(0.03, 0.1, 0.14, 0xf8f8f4, a + 0.33, YARD + h + 0.24, z9 + 0.5); } }
      }); }

    patQuad('asph', -39.2, NBX, fzW, N0 - C, AY);
    for (let i = 0; i < 6; i++) tri9('asph', [NBX, N0 - C], ARC[i + 1], ARC[i]);
    patQuad('asph', WX0, WS, N0 - C, S0 + C, AY);
    for (let i = 0; i < SB.length - 1; i++) quad9('asph', [WX0, SB[i][1]], SB[i], SB[i + 1], [WX0, SB[i + 1][1]]);
    curb9(NBX, fzW, NBX, NCZ); for (let i = 0; i < 6; i++) curb9(...ARC[i], ...ARC[i + 1]);
    for (let i = 0; i < SB.length - 1; i++) curb9(...SB[i], ...SB[i + 1]);
    addBox(1.0, 0.15, 0.8, 0xbdb8ad, WS - 1.85, YARD, S0 + C + 1.15);

    PATDEF.paveF = [1.2, 256, false, (g, N, R) => bond(g, N, 64, 64, ['#dfbd7e', '#d8b577', '#e2c286', '#dbb97c'], '#b09360', 2, R, 0.5, [0.07, ['#a5a39e', '#8f9194', '#c07a60', '#d8d2c4']])];
    [[WS, EN.x[0]], [EN.x[1], WX1]].forEach(([a, b]) => dBox(b - a, 0.08, C, 0xa9a59c, (a + b)/2, YARD, N0 - C/2, { far: true }));
    [[WS, EP.x[0]], [EP.x[1], WX1]].forEach(([a, b]) => dBox(b - a, 0.08, C, 0xa9a59c, (a + b)/2, YARD, S0 + C/2, { far: true }));
    patQuad('paveF', WS + 0.3, WX1, N0, TX - 0.15, YARD + 0.02); patQuad('paveF', WS + 0.3, WX1, TX + 0.15, S0, YARD + 0.02);
    patQuad('tactX', WS + 0.3, WX1, TX - 0.15, TX + 0.15, YARD + 0.02); patQuad('tactX', WS, WS + 0.3, N0, S0, YARD + 0.02);

    [[WS, PR.x[0]], [PR.x[1], EP.x[0]], [EP.x[1], 60]].forEach(([a, b]) => patQuad('grass', a, b, S0 + C, TERR_Z, AY, false, GS));
    for (let i = 0; i < SB.length - 1; i++) quad9('grass', SB[i], [WS, SB[i][1]], [WS, SB[i + 1][1]], SB[i + 1], GS);

    for (let i = plinths.length - 1; i >= 0; i--) { const p9 = plinths[i]; if (p9.ax === 'z' && Math.abs(p9.o - (fx0 - 0.17)) < 0.01 && p9.a1 > fz0) { if (p9.a0 >= fz0 - 0.01) plinths.splice(i, 1); else p9.a1 = fz0; } }

    const MC = [0x6a9444, 0x5f8a3e, 0x74a04c];
    const NP = [-34.5, -16.5, -4.0, 4.6];
    const NT = [-24.3, -12.6];
    const open1 = x => x > 33 && x < 40.5 && ![34.5, 38.0].some(q => Math.abs(q - x) < 0.76);
    for (let x9 = -36.35, k = 0; x9 < fx1 - 0.5; x9 += 1.5, k++) {
      if (x9 > EN.x[0] - 1.0 && x9 < EN.x[1] + 1.0) continue;
      const nearP = NP.some(px => Math.abs(px - x9) < 1.6) || NT.some(px => Math.abs(px - x9) < 1.0), east = x9 > EN.x[1];
      if (!nearP && !open1(x9)) mound(x9, FY.strip + 0.85, 1.9 + (k % 3) * 0.22, 1.0 + (k % 2) * 0.18, 1.4, MC[k % 3], false, open1(x9 - 1.5) || open1(x9 + 1.5) ? 0 : null);
      if (x9 + 0.75 > -35.2 && !(east && x9 < 40.5)) mound(x9 + 0.75, N0 - 0.85, 1.55 + ((k + 1) % 3) * 0.2, 0.8 + ((k + 1) % 2) * 0.12, 1.25, MC[(k + 1) % 3]);
    }
    NP.forEach((x9, k) => layerPine(x9, FY.strip + 0.9, 1.05 + (k % 2) * 0.15));
    [[17.6, -20.5, 2.9], [22.2, -20.45, 2.4], [27.0, -20.55, 2.7], [36.0, -21.0, 2.6]].forEach(([x9, z9, w9], k) => objScope('bush', () => {
      dBlob(w9 / 2, 0.5, 0.7, [0x5d8a45, 0x557f3f][k % 2], x9, YARD + 0.18, z9, { far: true, ry: k * 0.3, jitter: 0.12 });
      dBlob(w9 * 0.36, 0.2, 0.5, 0x7aa65a, x9 + 0.1, YARD + 0.52, z9, { far: true, chunky: true, ry: k, jitter: 0.12 });
      ellipseCols(x9, z9, w9 / 2, 0.7, k * 0.3, YARD, YARD + 0.65, 0.9); ellipseCols(x9 + 0.1, z9, w9 * 0.36, 0.5, k, YARD, YARD + 0.65, 0.86); }));
    NT.forEach(x9 => objScope('tree', () => { const z9 = FY.strip + 0.1;
      post(x9, z9, YARD, YARD + 2.6, 0.08); dCyl(0.045, 0.06, 1.7, 0x6b5240, x9, YARD, z9, { far: true, seg: 6 });
      dBlob(0.62, 0.55, 0.6, 0x4f8a3c, x9, YARD + 2.05, z9, { far: true, jitter: 0.14 }); dBlob(0.4, 0.32, 0.38, 0x6aa04c, x9 + 0.15, YARD + 2.4, z9 - 0.05, { far: true, chunky: true }); }));

    const CP = [[-29.0, -16.0, 1.3], [-13.2, -15.9, 1.6], [-8.6, -16.2, 1.25], [-1.2, -15.8, 1.35]];
    const SKIP = [[PR.x[0] - 3.0, PR.x[1] + 3.6], [EP.x[0] - 1.0, EP.x[1] + 1.0], ...CP.map(([x9]) => [x9 - 1.3, x9 + 1.3]), [-18.6, -16.4]];
    for (let x9 = WS + 0.9, k = 0; x9 < 52; x9 += 1.6, k++) {
      if (SKIP.some(([a, b]) => x9 > a && x9 < b) || (x9 > PR.x[1] + 3.6 && x9 < EP.x[0] - 1.0)) continue;
      if (x9 < PR.x[0] - 3.0 && k % 4 === 2) { const w9 = 2.1, d9 = 0.95, z9 = S0 + C + 0.75;
        objScope('bush', () => { dBlob(w9 * 0.53, 0.46, d9 * 0.55, 0x648f43, x9, YARD + 0.34, z9, { far: true, jitter: 0.1 }); dBlob(w9 * 0.47, 0.07, d9 * 0.47, 0x7aa655, x9, YARD + 0.78, z9, { far: true, ry: 0.02, jitter: 0.08 });
        colliders.push(noStand({ x0: x9 - w9 / 2, x1: x9 + w9 / 2, y0: YARD, y1: YARD + 0.84, z0: z9 - d9 / 2, z1: z9 + d9 / 2 })); }); continue; }
      mound(x9, S0 + C + 0.75, 1.5 + (k % 3) * 0.15, 0.75 + (k % 2) * 0.12, 1.2, MC[(k + 2) % 3]);
    }
    [[27.0, -16.3], [32.6, -16.4], [36.6, -16.1]].forEach(([x9, z9], k) => mound(x9, z9, 1.6, 0.9, 1.25, MC[k % 3]));
    CP.forEach(([x9, z9, s9]) => cloudPine(x9, z9, s9));
    cloudPine(37.0, S0 + 2.2, 1.35); prunedPine(44.5, S0 + 3.0, 1.6);

    [[23.8, S0 + 2.5, 1.0], [32.4, S0 + 2.4, 1.0]].forEach(([x9, z9, s9]) => ballJuniper(x9, z9, s9));
    objScope('tree', () => { const tx9 = 30.0, tz9 = S0 + 1.35, R9 = seeded(3011);
      colliders.push({ x0: tx9 - 0.35, x1: tx9 + 0.35, y0: YARD, y1: YARD + 12, z0: tz9 - 0.35, z1: tz9 + 0.35 });
      [[-0.95, 0.95, -0.95, 0.95], [0.35, 1.75, -0.4, 1.0], [-1.72, -0.28, -0.97, 0.47]].forEach(([a9, b9, c9, d9]) => colliders.push(noStand({ x0: tx9 + a9, x1: tx9 + b9, y0: YARD, y1: YARD + 1.4, z0: tz9 + c9, z1: tz9 + d9 })));
      dCyl(0.1, 0.15, 3.6, 0x5e4a3a, tx9, YARD, tz9, { far: true, seg: 6 });
      [[0, 0.75, 0, 1.05], [1.05, 1.25, 0.3, 0.78], [-1.0, 1.5, -0.25, 0.8], [0.15, 2.25, 0.1, 0.9], [0.95, 2.7, -0.2, 0.66], [-0.8, 3.0, 0.2, 0.62], [0.05, 3.75, 0, 0.52]].forEach(([ox, oy, oz, r], k) =>
        dBlob(r, r * 0.86, r, [0x2f6a3a, 0x357242, 0x2b6236][k % 3], tx9 + ox, YARD + oy, tz9 + oz, { far: true, ry: R9() * 6, jitter: 0.1 })); });
    { const lx9 = 35.6, lz9 = S0 + 1.05;
      post(lx9, lz9, YARD, YARD + 3.0, 0.12); dCyl(0.05, 0.06, 1.95, 0x22252a, lx9, YARD, lz9, { far: true, seg: 6 });
      dBox(0.42, 0.95, 0.42, 0x22252a, lx9, YARD + 1.95, lz9, { far: true });
      dBox(0.3, 0.72, 0.46, 0xe8ecec, lx9, YARD + 2.06, lz9, { far: true }); dBox(0.46, 0.7, 0.3, 0xe8ecec, lx9, YARD + 2.07, lz9, { far: true });
      lamp(0.2, 0.5, 0.2, lx9, YARD + 2.15, lz9);
      dBox(0.52, 0.07, 0.52, 0xf2f2ee, lx9, YARD + 2.9, lz9, { far: true });
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(lx9, YARD + 3.08, lz9), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.45, 0, 0)), new THREE.Vector3(0.36, 0.03, 0.26)), 0x2b3f6b, { far: true }); }
    { const lx9 = 34.6, lz9 = S0 + 1.3;
      post(lx9, lz9, YARD, YARD + 5.2, 0.1); dCyl(0.05, 0.08, 5.0, 0x9aa0a6, lx9, YARD, lz9, { far: true, seg: 8 });
      dRod(lx9, YARD + 4.9, lz9, lx9 - 0.6, YARD + 5.05, lz9, 0.03, 0x9aa0a6, { far: true }); dBox(0.5, 0.08, 0.2, 0xd9dde0, lx9 - 0.75, YARD + 4.98, lz9, { far: true }); lamp(0.4, 0.03, 0.14, lx9 - 0.75, YARD + 4.95, lz9); }

    { const A9 = [-36, YARD + 8.2, -15.5], B9 = [-33.5, FH + 0.9, fz1 + 0.35], M9 = [(A9[0] + B9[0]) / 2, (A9[1] + B9[1]) / 2 - 0.45, (A9[2] + B9[2]) / 2];
      dRod(...A9, ...M9, 0.012, 0x2a2a2a, { far: true }); dRod(...M9, ...B9, 0.012, 0x2a2a2a, { far: true }); }

    [-39.3, -31, -21, -12, 2.5, 5.3].forEach(x9 => { dBox(1.0, 0.9, 0.7, 0xe3e5e1, x9, FH + 0.3, -25.3, { far: true }); dBox(0.7, 0.6, 0.03, 0x8c9094, x9, FH + 0.45, -24.935, { far: true }); });
    zones.push({ x0: WX0, x1: WX1, z0: fz1, z1: FY.walkS, y: YARD, label: '앞뜰 산책로' });
  }
  {

    const [px0, px1] = PR.x, pc = (px0 + px1) / 2, pw = px1 - px0, FZ = TR3.fieldZ, BZ = TERR_Z, R = YARD - FIELD;
    addBox(pw, R, FZ - BZ, 0xd7d0c2, pc, FIELD, (BZ + FZ)/2);
    patWall('mosaic', 'x', px0, px1, FIELD + 0.12, YARD - 0.1, FZ + 0.012, 1);
    dBox(pw + 0.1, 0.12, 0.3, 0xf2f0ea, pc, YARD - 0.1, FZ - 0.1);
    patQuad('gmat', px0, px1, FY.walkS + 0.12, FZ - 0.25, YARD + 0.012);

    const Y0 = 1.9, Y1 = 2.95, PZN = FY.walkS + 0.12 + 0.2, ZJ = FY.walkS + 0.05;
    const CX0 = EN.x[0], CX1 = px1, CZ0 = EN.z[1], RX0 = px0 - 0.2, RX1 = px1 + 0.2, RZ1 = FZ + 0.2;
    const pillar = (x9, z9, d9 = 0.4, py = YARD) => {
      addBox(0.4, Y0 - YARD, d9, DKWOOD, x9, YARD, z9);
      patWall('woodP', 'x', x9 - 0.2, x9 + 0.2, py, Y0, z9 + d9/2 + 0.012, 1); patWall('woodP', 'x', x9 - 0.2, x9 + 0.2, py, Y0, z9 - d9/2 - 0.012, -1);
      patWall('woodP', 'z', z9 - d9/2, z9 + d9/2, py, Y0, x9 + 0.212, 1); patWall('woodP', 'z', z9 - d9/2, z9 + d9/2, py, Y0, x9 - 0.212, -1);
    };
    [[px0 + 0.25, PZN], [px0 + 2.2, PZN], [px0 + 4.1, PZN], [px1 - 0.25, PZN]].forEach(([x9, z9]) => pillar(x9, z9));

    [px0 + 0.2, px1 - 0.2].forEach(x9 => pillar(x9, FZ - 0.1, 0.28, YARD + 0.02));
    pillar(CX1 - 0.25, CZ0 + 0.185, 0.37);

    addBox(RX1 - RX0, Y1 - Y0, RZ1 - ZJ, 0x2f2a26, (RX0 + RX1)/2, Y0, (ZJ + RZ1)/2);
    addBox(CX1 - CX0, Y1 - Y0, ZJ - CZ0, 0x2f2a26, (CX0 + CX1)/2, Y0, (CZ0 + ZJ)/2);
    patQuad('louver', RX0, RX1, ZJ, RZ1, Y0 - 0.012, true);
    dBox(RX1 - RX0 - 0.16, 0.03, RZ1 - ZJ - 0.08, 0x78a887, (RX0 + RX1)/2, Y1, (ZJ + RZ1 - 0.08)/2, { far: true });
    dBox(CX1 - CX0 - 0.16, 0.03, ZJ - CZ0 - 0.08, 0x5d8373, (CX0 + CX1)/2, Y1, (CZ0 + 0.08 + ZJ)/2, { far: true });
    const SK = [12.5 - 0.8, 12.5 + 0.8, CZ0 + 0.7, CZ0 + 1.5];
    [[CX0, CX1, CZ0, SK[2]], [CX0, CX1, SK[3], ZJ], [CX0, SK[0], SK[2], SK[3]], [SK[1], CX1, SK[2], SK[3]]].forEach(([a, b, c, d]) => patQuad('cwood', a, b, c, d, Y0 - 0.012, true));
    patQuad('cflat', SK[0], SK[1], SK[2], SK[3], Y0 - 0.012, true, 0x9fd3f0);
    [[SK[0], SK[0] + 0.05, SK[2], SK[3]], [SK[1] - 0.05, SK[1], SK[2], SK[3]], [SK[0] + 0.05, SK[1] - 0.05, SK[2], SK[2] + 0.05], [SK[0] + 0.05, SK[1] - 0.05, SK[3] - 0.05, SK[3]], [12.47, 12.53, SK[2] + 0.05, SK[3] - 0.05]]
      .forEach(([a, b, c, d]) => dBox(b - a, 0.03, d - c, DKWOOD, (a + b)/2, Y0 - 0.042, (c + d)/2));

    patWall('woodP', 'x', RX0, RX1, Y0, Y1, RZ1 + 0.012, 1);
    patWall('woodP', 'z', ZJ, RZ1, Y0, Y1, RX0 - 0.012, -1); patWall('woodP', 'z', ZJ, RZ1, Y0, Y1, RX1 + 0.012, 1);
    patWall('woodP', 'x', RX0, CX0, Y0, Y1, ZJ - 0.012, -1); patWall('woodP', 'x', CX1, RX1, Y0, Y1, ZJ - 0.012, -1);
    patWall('woodP', 'z', CZ0, ZJ, Y0, Y1, CX0 - 0.012, -1); patWall('woodP', 'z', CZ0, ZJ, Y0, Y1, CX1 + 0.012, 1);
    patWall('woodP', 'x', EN.x[1], CX1, Y0, Y1, CZ0 - 0.012, -1);
    const bl = (x0, x1, z0, z1) => dBox(x1 - x0, 0.1, z1 - z0, BLUE, (x0 + x1)/2, Y1 - 0.1, (z0 + z1)/2);
    bl(RX0 - 0.06, RX1 + 0.06, RZ1, RZ1 + 0.06); bl(RX0 - 0.06, RX0, ZJ, RZ1); bl(RX1, RX1 + 0.06, ZJ, RZ1);
    bl(RX0 - 0.06, CX0, ZJ - 0.06, ZJ); bl(CX1, RX1 + 0.06, ZJ - 0.06, ZJ);
    bl(CX0 - 0.06, CX0, CZ0, ZJ - 0.06); bl(CX1, CX1 + 0.06, CZ0, ZJ - 0.06); bl(EN.x[1], CX1 + 0.06, CZ0 - 0.06, CZ0);

    steelRail(px0 + 0.4, FZ - 0.12, px1 - 0.4, FZ - 0.12, YARD + 0.02);

    const loopPos = [], loopUV = [];
    const loopRail = (x0, z0, x1, z1, yA, yB, h = 0.95) => {
      const S = 0xcdd2d6, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.9));
      const P = t => [x0 + (x1 - x0)*t, yA + (yB - yA)*t, z0 + (z1 - z0)*t];
      const a = P(0), b = P(1);
      dRod(a[0], a[1] + h, a[2], b[0], b[1] + h, b[2], 0.03, S);
      dRod(a[0], a[1] + 0.12, a[2], b[0], b[1] + 0.12, b[2], 0.015, S);
      for (let i = 0; i <= n; i++) { const p = P(i / n); dRod(p[0], p[1], p[2], p[0], p[1] + h, p[2], 0.028, S); }
      for (let i = 0; i < n; i++) { const p = P(i / n), q = P((i + 1) / n), Q = [[p, 0.13, 0, 0], [q, 0.13, 1, 0], [q, h - 0.03, 1, 1], [p, h - 0.03, 0, 1]];
        [0, 1, 2, 0, 2, 3].forEach(k => { const [c, dy, u, v] = Q[k]; loopPos.push(c[0], c[1] + dy, c[2]); loopUV.push(u, v); }); }
      const m = Math.max(1, Math.round(L / 0.3));
      for (let i = 0; i < m; i++) { const p = P(i / m), q = P((i + 1) / m);
        colliders.push({ x0: Math.min(p[0], q[0]) - 0.05, x1: Math.max(p[0], q[0]) + 0.05, y0: Math.min(p[1], q[1]), y1: Math.max(p[1], q[1]) + 1.6, z0: Math.min(p[2], q[2]) - 0.05, z1: Math.max(p[2], q[2]) + 0.05, nc: true }); }
    };

    loopRail(px0 + 0.1, PZN + 0.2, px0 + 0.1, BZ + 0.06, YARD + 0.02, YARD + 0.02); loopRail(px1 - 0.1, PZN + 0.2, px1 - 0.1, BZ + 0.06, YARD + 0.02, YARD + 0.02);
    loopRail(px0 + 0.45, PZN, px0 + 2.0, PZN, YARD + 0.02, YARD + 0.02);

    for (let i = 0; i < 6; i++) {
      const h = R * (i + 1) / 7;
      addBox(0.3, h, FZ - BZ, 0xe9e6de, px0 - 1.8 + 0.3 * i + 0.15, FIELD, (BZ + FZ)/2);
      addBox(0.3, h, FZ - BZ, 0xe9e6de, px1 + 1.8 - 0.3 * i - 0.15, FIELD, (BZ + FZ)/2);
      [[px0 - 1.8 + 0.3 * i + 0.15, -1], [px1 + 1.8 - 0.3 * i - 0.15, 1]].forEach(([x9, f]) => {
        dBox(0.3, 0.04, FZ - BZ - 0.1, 0xb3b0a8, x9, FIELD + h, (BZ + FZ)/2 - 0.05);
        colliders.push({ x0: x9 - 0.15, x1: x9 + 0.15, y0: FIELD + h, y1: FIELD + h + 0.051, z0: BZ, z1: FZ - 0.1 });
        dBox(0.06, 0.045, FZ - BZ - 0.14, i === 0 || i === 5 ? YEL : 0x3d3f43, x9 + f * 0.1, FIELD + h + 0.006, (BZ + FZ)/2 - 0.05);
      });
    }
    [[px0 - 1.8, px0, 1], [px1 + 1.8, px1, -1]].forEach(([xa, xb, f]) => {
      const xf = xa + f * 0.34, pts = [[xf, FIELD + 0.12, FZ + 0.012], [xb, FIELD + 0.12, FZ + 0.012], [xb, YARD - 0.2, FZ + 0.012], [xb, YARD - 0.2, FZ + 0.012]];
      patPush('mosaic', pts, pts.map(p => [p[0] / 1.2, p[1] / 1.2]), [0, 0, 1], 0xffffff);
      loopRail(xa, FZ - 0.12, xb, FZ - 0.12, FIELD, YARD);
      loopRail(xa, BZ + 0.06, xb, BZ + 0.06, FIELD, YARD);
      colliders.push(noStand({ x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: FIELD, y1: YARD + 1.62, z0: BZ, z1: BZ + 0.11 }));
    });

    addBox(1.0, 0.6, 0.25, 0xe3e0d8, px1 + 2.3, FIELD, BZ + 0.125);
    patWall('rockW', 'x', px1 + 1.8, px1 + 2.8, FIELD, FIELD + 0.6, BZ + 0.25 + 0.012, 1);
    slope('grass', 'z', px1 + 1.8, px1 + 2.8, BZ, BZ + 0.25, YARD, FIELD + 0.6, 1, 0xf2f6e8); slopeCap('grass', px1 + 1.8, -1, BZ, BZ + 0.25, YARD, FIELD + 0.6);
    patQuad('pave', px1 + 1.8, px1 + 2.8, BZ + 0.25, FZ, FIELD + 0.02);
    addBox(1.18, 0.45, 0.3, 0xb3b1aa, px0 - 2.41, FIELD, FZ - 0.15);
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g9 = cv.getContext('2d');
      g9.strokeStyle = '#ffffff'; g9.lineWidth = 3.2;
      [32, 96].forEach(x9 => { g9.beginPath(); g9.moveTo(x9, 0); g9.lineTo(x9, 27); g9.moveTo(x9, 101); g9.lineTo(x9, 128); g9.stroke(); g9.beginPath(); g9.ellipse(x9, 64, 9, 37, 0, 0, Math.PI * 2); g9.stroke(); });
      const tx9 = new THREE.CanvasTexture(cv); tx9.colorSpace = THREE.SRGBColorSpace; tx9.anisotropy = 4;
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(loopPos, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(loopUV, 2));
      lg.computeVertexNormals(); lg.computeBoundingSphere();
      const lm = new THREE.Mesh(lg, new THREE.MeshLambertMaterial({ map: tx9, color: 0xcdd2d6, alphaTest: 0.5, side: THREE.DoubleSide }));
      lm.matrixAutoUpdate = false; scene.add(lm);
    }
    { const mz = FZ - 0.7;
      dCyl(0.14, 0.16, 0.03, 0x26282c, pc, YARD + 0.012, mz, { seg: 10 }); dRod(pc, YARD + 0.042, mz, pc, YARD + 1.18, mz, 0.012, 0x3a3d44);
      dRod(pc, YARD + 1.18, mz, pc, YARD + 1.27, mz - 0.07, 0.01, 0x3a3d44);
      colliders.push(noStand({ x0: pc - 0.14, x1: pc + 0.14, y0: YARD, y1: YARD + 1.3, z0: mz - 0.14, z1: mz + 0.14 }));
      hotspots.push({ kind: 'mic', x: pc, z: FZ - 1.0, y: YARD, r: 1.5, label: '구령대 마이크 잡기', at: [pc, YARD + 1.2, mz], mic: [pc, YARD + 1.27, mz - 0.07, Math.PI] }); }

    const patio = objWrap((cx, cz, face) => {
      const at = partAt(cx, YARD, cz, face, 1), T = 0x9a6e45, F = 0x3a3d44;
      [-0.15, -0.005, 0.14].forEach(lz => at(0, 0.42, lz, 0.5, 0.03, 0.13, T));
      [0.55, 0.68, 0.81].forEach(ly => at(0, ly, -0.24, 0.5, 0.08, 0.03, T));
      [-1, 1].forEach(sx => { at(sx * 0.25, 0, -0.24, 0.04, 0.9, 0.05, F); at(sx * 0.25, 0, 0.2, 0.04, 0.42, 0.04, F); at(sx * 0.25, 0.42, 0.2, 0.04, 0.23, 0.04, F); at(sx * 0.27, 0.65, -0.02, 0.05, 0.03, 0.5, T); });
      colliders.push(noStand({ x0: cx - 0.3, x1: cx + 0.3, y0: YARD, y1: YARD + 0.9, z0: cz - 0.3, z1: cz + 0.3 }));
    }, 'chair');
    [[pc - 1.55, FZ - 2.2], [pc + 1.55, FZ - 2.2]].forEach(([tx9, tz9]) => {
      objScope('table', () => { colliders.push(noStand({ x0: tx9 - 0.75, x1: tx9 + 0.75, y0: YARD, y1: YARD + 0.72, z0: tz9 - 0.4, z1: tz9 + 0.4 }));
      for (let k = 0; k < 5; k++) dBox(1.5, 0.04, 0.14, 0xa77b4f, tx9, YARD + 0.68, tz9 - 0.33 + k * 0.165);
      dBox(1.4, 0.04, 0.7, 0x3a3d44, tx9, YARD + 0.635, tz9);
      [[-0.66, -0.32], [0.66, -0.32], [-0.66, 0.32], [0.66, 0.32]].forEach(([ox, oz]) => dBox(0.05, 0.635, 0.05, 0x3a3d44, tx9 + ox, YARD, tz9 + oz)); });
      [-0.38, 0.38].forEach(ox => { patio(tx9 + ox, tz9 - 0.68, 2); patio(tx9 + ox, tz9 + 0.68, 0); });
    });
    patio(pc - 2.72, FZ - 2.2, 1); patio(pc + 2.72, FZ - 2.2, 3);
    zones.push({ x0: px0, x1: px1, z0: FY.walkS, z1: FZ, y: YARD, label: '구령대' });
  }
  {
    const BZ = TERR_Z, FZ = TR3.fieldZ;

    const bank = (a, b) => { slope('grass', 'z', a, b, BZ, FZ, YARD, FIELD, 8, 0xd6b89c);
      addBox(b - a, 0.2, 0.22, 0x8f8b82, (a + b)/2, FIELD, FZ + 0.11);
      dBox(b - a - 0.02, 0.04, 0.24, 0xb9b5ab, (a + b)/2, FIELD + 0.2, FZ + 0.11, { far: true }); };
    bank(-27, PR.x[0] - 1.8); bank(PR.x[1] + 2.8, EP.x[0]); bank(EP.x[1], 60);
    addPanel(EP.x[0] + 27, 0.38, 0x5d5a53, (EP.x[0] - 27) / 2, FIELD + 0.012, FZ + 0.41);
    patQuad('grass', PR.x[0] - 1.8, PR.x[1] + 1.8, FZ, FZ + 0.22, FIELD + 0.012, false, 0xd6b89c);
    { const R9 = seeded(4242);
      for (let k = 0; k < 9; k++) { const x9 = k < 5 ? -26 + k * 6.4 + R9() * 3.0 : PR.x[1] + 3.5 + (k - 5) * 5.0 + R9() * 2.4, z9 = BZ + 0.3 + R9() * (FZ - BZ - 0.6), ys = YARD + (FIELD - YARD) * (z9 - BZ) / (FZ - BZ);
        dBlob(0.13 + R9() * 0.07, 0.07, 0.1 + R9() * 0.05, [0xd4d2cb, 0xc4c1b8, 0xdedbd2][k % 3], x9, ys - 0.02, z9, { chunky: true, ry: R9() * 6, far: true }); } }
    slopeCap('grass', -27, -1, BZ, FZ, YARD, FIELD, 0xd6b89c);
    slopeCap('grass', PR.x[0] - 1.8, 1, BZ, FZ, YARD, FIELD, 0xd6b89c); slopeCap('grass', PR.x[1] + 2.8, -1, BZ, FZ, YARD, FIELD, 0xd6b89c);
    slopeCap('grass', EP.x[0], 1, BZ, FZ, YARD, FIELD, 0xd6b89c); slopeCap('grass', EP.x[1], -1, BZ, FZ, YARD, FIELD, 0xd6b89c);

    slope('pave', 'z', EP.x[0], EP.x[1], BZ, FZ + 2.6, YARD, FIELD, 8);
    slopeCap('pave', EP.x[0], -1, BZ, FZ + 2.6, YARD, FIELD); slopeCap('pave', EP.x[1], 1, BZ, FZ + 2.6, YARD, FIELD);
    patQuad('pave', EP.x[0], EP.x[1], FY.walkS, BZ, YARD + 0.02);
  }
  {

    const [px0, px1] = PR.x, S1 = FY.walkS + 1.9;

    const standStone = (outline, depth, hex, x, y, z, ry, jitter = 0) => {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v))), { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 1 });
      g.translate(0, 0, -depth / 2);
      dGeo(g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), hex, { far: true, jitter });
      g.dispose();
      const w = depth / 2 + 0.06, c = Math.cos(ry), s9 = Math.sin(ry);
      return (u, v) => [x + u * c + w * s9, y + v, z - u * s9 + w * c];
    };

    const SX = px0 - 2.6, SZ9 = FY.walkS + 0.12 + 0.45, MRY = 0;
    addBox(1.4, 0.45, 0.9, 0xc9c6bd, SX, YARD, SZ9, NS);
    const mf = standStone([[-0.5, 0], [0.52, 0], [0.5, 0.5], [0.45, 1.1], [0.36, 1.55], [0.2, 1.95], [0.02, 2.38], [-0.14, 2.3], [-0.3, 2.05], [-0.42, 1.6], [-0.5, 1.0], [-0.53, 0.4]], 0.4, 0x66696c, SX, YARD + 0.45, SZ9, MRY, 0.22);
    { const nx = Math.sin(MRY), nz = Math.cos(MRY);
      [[0.95, 0.4, 0.26, 0.32], [1.7, 0.3, 0.2, 0.26]].forEach(([v, sx, sy, sz]) => dBlob(sx, sy * 3, sz, 0x5c5f62, SX - nx * 0.12, YARD + 0.45 + v, SZ9 - nz * 0.12, { chunky: true, ry: MRY, jitter: 0.2, far: true })); }
    colliders.push(noStand({ x0: SX - 0.55, x1: SX + 0.55, y0: YARD, y1: YARD + 2.85, z0: SZ9 - 0.45, z1: SZ9 + 0.45 }));
    const vText = (str, u, v0, h) => [...str].forEach((ch, k) => { const [x9, y9, z9] = mf(u, v0 - k * h * 1.35); sign(ch, x9, y9, z9, MRY, h, { bg: 'none', fg: '#f2efe6' }); });
    vText('교훈', 0.2, 1.62, 0.2); vText('바르고', -0.03, 1.98, 0.23); vText('슬기롭게', -0.27, 1.74, 0.23);

    objScope('bush', () => { const hx = SX + 0.5, hz = SZ9 + 1.5, R9 = seeded(97);
      dBlob(0.95, 0.95, 0.9, 0x4f7f3f, hx, YARD + 0.95, hz, { far: true, jitter: 0.1 });
      dBlob(0.7, 0.55, 0.65, 0x5c8c49, hx + 0.15, YARD + 1.7, hz - 0.05, { far: true, jitter: 0.1, ry: 0.7 });
      dBlob(0.55, 0.6, 0.5, 0x56863f, hx - 0.55, YARD + 1.25, hz + 0.3, { far: true, jitter: 0.1, ry: 1.9 });
      for (let k = 0; k < 34; k++) { const a = R9() * 6.28, e = (R9() - 0.3) * 1.2, r9 = 0.93;
        dBlob(0.08, 0.07, 0.08, k % 3 ? 0xd98fc8 : 0xe6a8d8, hx + Math.cos(a) * Math.cos(e) * r9, YARD + 1.05 + Math.sin(e) * 0.9, hz + Math.sin(a) * Math.cos(e) * r9 * 0.95, { far: true, chunky: true }); }
      colliders.push(noStand({ x0: hx - 0.75, x1: hx + 0.75, y0: YARD, y1: YARD + 1.8, z0: hz - 0.7, z1: hz + 0.7 })); });

    [[SX - 1.05, SZ9 + 1.1, 0.42, 0xd8263a], [SX - 1.45, SZ9 + 1.8, 0.36, 0xe8578a], [SX - 0.75, SZ9 + 2.1, 0.34, 0xc81e32]].forEach(([rx, rz, r9, fc], k) => objScope('bush', () => {
      dBlob(r9, r9 * 0.85, r9, [0x3d6e36, 0x44783b, 0x3a6834][k], rx, YARD + r9 * 0.8, rz, { chunky: true, jitter: 0.16, ry: k * 1.7 });
      for (let j = 0; j < 6; j++) { const a = j * 1.05 + k, e = 0.35 + (j % 3) * 0.25;
        dBlob(0.075, 0.065, 0.075, j % 3 === 2 ? 0xf2a0b8 : fc, rx + Math.cos(a) * Math.cos(e) * r9 * 0.95, YARD + r9 * 0.8 + Math.sin(e) * r9 * 0.8, rz + Math.sin(a) * Math.cos(e) * r9 * 0.95, { chunky: true }); }
      colliders.push(noStand({ x0: rx - r9 * 0.85, x1: rx + r9 * 0.85, y0: YARD, y1: YARD + r9 * 1.6, z0: rz - r9 * 0.85, z1: rz + r9 * 0.85 })); }));

    const solarLamp = (LX, LZ, cctv) => {
      post(LX, LZ, YARD, YARD + 4.2, 0.1);
      dCyl(0.06, 0.1, 4.3, 0x9aa0a6, LX, YARD, LZ, { far: true, seg: 8 });
      dRod(LX, YARD + 4.0, LZ, LX, YARD + 4.0, LZ + 0.75, 0.035, 0x9aa0a6, { far: true });
      dBox(0.34, 0.1, 0.5, 0xdfe3e8, LX, YARD + 3.85, LZ + 0.9, { far: true });
      lamp(0.26, 0.04, 0.4, LX, YARD + 3.81, LZ + 0.9);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(LX, YARD + 4.55, LZ), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)), new THREE.Vector3(0.9, 0.05, 0.6)), 0x2b3f6b, { far: true });
      if (cctv) {
        dCyl(0.24, 0.09, 0.36, 0x2b2d31, LX, YARD + 2.78, LZ + 0.09, { far: true, seg: 4, rot: [Math.PI / 2, Math.PI / 4, 0] });
        dBox(0.2, 0.26, 0.13, 0x6b4a3a, LX, YARD + 2.22, LZ + 0.145, { far: true }); dBox(0.26, 0.05, 0.05, 0x8a8f92, LX, YARD + 2.52, LZ + 0.1, { far: true }); }
    };
    solarLamp(4.6, -14.9, false);
    solarLamp(-17.5, FY.walkS + 1.3, false);
    solarLamp(-1.6, -14.6, false);

    const GX = 20.3, GZ = S1 + 0.3, GRY = -0.2;
    addBox(1.6, 0.35, 0.8, 0xa9a7a0, GX, YARD, GZ, NS);
    const gf = standStone([[-0.7, 0], [0.7, 0], [0.72, 0.6], [0.62, 1.12], [0.4, 1.46], [0.05, 1.6], [-0.36, 1.5], [-0.6, 1.2], [-0.72, 0.6]], 0.4, 0xcac6bd, GX, YARD + 0.35, GZ, GRY);
    colliders.push(noStand({ x0: GX - 0.8, x1: GX + 0.8, y0: YARD, y1: YARD + 1.95, z0: GZ - 0.45, z1: GZ + 0.45 }));
    { const [x9, y9, z9] = gf(-0.28, 1.22); sign('교가', x9, y9, z9, GRY, 0.2, { bg: 'none', fg: '#3d3a36' }); }
    for (let k = 0; k < 6; k++) { const [x9, y9, z9] = gf(0.08, 1.05 - k * 0.13);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(x9, y9, z9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, GRY, 0)), new THREE.Vector3(0.9 - (k % 3) * 0.08, 0.03, 0.01)), 0x6f6a62, { far: true }); }
    hotspots.push({ kind: 'song', x: GX, z: GZ + 1.1, y: YARD, r: 1.3, label: '교가 흥얼거리기', at: [GX, YARD + 1.2, GZ] });
    cloudPine(px1 + 2.6, -15.0, 1.1, 4, 0.8);
    solarLamp(22.3, S1 + 0.5, true);
    { const tx9 = 25.5, tz9 = S1 + 0.2;
      [-0.3, 0.3].forEach(o => { dBox(0.4, 0.35, 0.4, 0xd8d5cc, tx9 + o, YARD, tz9, { far: true }); dBox(0.24, 3.95, 0.24, 0x9a9890, tx9 + o, YARD + 0.35, tz9, { far: true }); post(tx9 + o, tz9, YARD, YARD + 4.3, 0.2);
        for (let k = 0; k < 6; k++) { const ya = YARD + 1.5 + k * 0.29, sx = -Math.sign(o) * 0.14;
          dRod(tx9 + o + sx, ya, tz9 + (k % 2 ? 0.07 : -0.07), tx9 + o + sx, ya + 0.29, tz9 + (k % 2 ? -0.07 : 0.07), 0.018, 0x3a3d44, { far: true }); } });
      addBox(1.0, 1.0, 0.3, 0xf5f6f8, tx9, YARD + 4.3, tz9, { collide: false });
      [-1, 1].forEach(sd => { dCyl(0.4, 0.4, 0.03, 0xffffff, tx9, YARD + 4.8, tz9 + sd * 0.165, { rot: [Math.PI / 2, 0, 0], seg: 20, far: true });
        dBox(0.04, 0.3, 0.03, 0x22252a, tx9, YARD + 4.8, tz9 + sd * 0.19, { far: true }); dBox(0.22, 0.04, 0.03, 0x22252a, tx9 + 0.1, YARD + 4.78, tz9 + sd * 0.198, { far: true }); });
      hotspots.push({ kind: 'clock', x: tx9, z: tz9 + 0.8, y: YARD, r: 1.3, label: '탑시계 보기', at: [tx9, YARD + 4.8, tz9] }); }
    const [fpx, fpz] = SCHOOL.flagPole;
    addBox(0.16, 10, 0.16, 0xc8cdd2, fpx, YARD, fpz);
    {
      const cv = taegukCanvas();
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.93, 14, 4), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      fl.position.set(fpx + 0.78, YARD + 9.05, fpz); fl.matrixAutoUpdate = false; fl.updateMatrix(); fl.frustumCulled = false; scene.add(fl);
      flagMesh = fl;
    }

    hotspots.push({ kind: 'motto', x: SX + 1.0, z: SZ9 - 0.1, y: YARD, r: 1.2, label: '교훈 읽기', at: [SX, YARD + 1.6, SZ9] });
    hotspots.push({ kind: 'flag', x: fpx + 0.5, z: fpz - 0.6, y: YARD, r: 1.2, label: '태극기 올려다보기', at: [fpx + 0.78, YARD + 9.05, fpz] });
    zones.push({ x0: WX0, x1: WX1, z0: FY.walkS, z1: TERR_Z, y: YARD, label: '앞뜰 남쪽 화단' });
  }

  const FLD = SCHOOL.field, FCX = (TR3.westX + SCHOOL.eastFenceX) / 2, FCZ = (FLD.z[0] + SCHOOL.southFenceZ) / 2;

  const EGX = 26.9;
  function goal(x, z, back, hex, s, box = false) {
    const big = s >= 1, [bx, bz] = back, px = -bz, pz = bx, H = big ? 2.44 : 1.8, D = big ? 1.6 : 0.9, W = big ? 3.66 : 1.5, F = { far: true }, Y = FIELD;
    const FC9 = big ? 0xd9b060 : hex, BC9 = big ? 0xa9adb0 : hex;
    const P = (u, v) => [x + px*u + bx*v, z + pz*u + bz*v];
    if (box) {
      const DT9 = D * 0.55;
      [-W, W].forEach(u => { const [ax9, az9] = P(u, 0), [tx9, tz9] = P(u, DT9), [ex9, ez9] = P(u, D);
        dRod(ax9, Y, az9, ax9, Y + H, az9, 0.06, FC9, F); post(ax9, az9, Y, Y + H);
        dRod(ax9, Y + H - 0.03, az9, tx9, Y + H - 0.03, tz9, 0.04, BC9, F);
        dRod(tx9, Y + H - 0.03, tz9, ex9, Y + 0.035, ez9, 0.04, BC9, F);
        dRod(ax9, Y + 0.035, az9, ex9, Y + 0.035, ez9, 0.035, BC9, F);

        [[DT9, (DT9 + D) / 2, H], [(DT9 + D) / 2, D, H / 2]].forEach(([v0, v1, h9]) => { const [c0x, c0z] = P(u - 0.05, v0), [c1x, c1z] = P(u + 0.05, v1);
          const c9 = { x0: Math.min(c0x, c1x), x1: Math.max(c0x, c1x), z0: Math.min(c0z, c1z), z1: Math.max(c0z, c1z), y0: Y, y1: Y + h9, nc: true }; colliders.push(h9 < 1.6 ? noStand(c9) : c9); }); });
      { const [a1, b1] = P(-W, 0), [a2, b2] = P(W, 0); dRod(a1, Y + H, b1, a2, Y + H, b2, 0.06, FC9, F); }
      { const [a1, b1] = P(-W, DT9), [a2, b2] = P(W, DT9); dRod(a1, Y + H - 0.03, b1, a2, Y + H - 0.03, b2, 0.035, BC9, F); }
      { const [a1, b1] = P(-W, D), [a2, b2] = P(W, D); dRod(a1, Y + 0.035, b1, a2, Y + 0.035, b2, 0.035, BC9, F); }
      return;
    }
    [-W, W].forEach(u => {
      const [ax9, az9] = P(u, 0), [b1x, b1z] = P(u, D*0.3), [b2x, b2z] = P(u, D*0.62), [ex9, ez9] = P(u, D);
      dRod(ax9, Y, az9, ax9, Y + H, az9, 0.06, FC9, F); post(ax9, az9, Y, Y + H);
      dRod(ax9, Y + H, az9, b1x, Y + H - 0.08, b1z, 0.04, BC9, F);
      dRod(b1x, Y + H - 0.08, b1z, b2x, Y + H - 0.45, b2z, 0.04, BC9, F);
      dRod(b2x, Y + H - 0.45, b2z, ex9, Y, ez9, 0.04, BC9, F);
      dRod(ax9, Y, az9, ex9, Y, ez9, 0.035, BC9, F);
    });
    { const [a1, b1] = P(-W, 0), [a2, b2] = P(W, 0); dRod(a1, Y + H, b1, a2, Y + H, b2, 0.06, FC9, F); }
    { const [a1, b1] = P(-W, D), [a2, b2] = P(W, D); dRod(a1, Y, b1, a2, Y, b2, 0.035, BC9, F); }

    const vb = D * (0.5 + 0.5 * Math.max(0, 1 - 1.5 / (H - 0.1))), Q = (v0, v1) => { const [c0x, c0z] = P(-W, v0), [c1x, c1z] = P(W, v1); return { x0: Math.min(c0x, c1x), x1: Math.max(c0x, c1x), z0: Math.min(c0z, c1z), z1: Math.max(c0z, c1z) }; };
    colliders.push(noStand({ ...Q(vb, D), y0: Y, y1: Y + 1.6 }));
    if (vb > D * 0.5 + 0.05) colliders.push({ ...Q(D * 0.5, vb), y0: Y + 1.52, y1: Y + H, nc: true });
    for (let k = -W + 0.5; k < W; k += 0.5) { const [s0x, s0z] = P(k, D*0.5), [s1x, s1z] = P(k, D); dRod(s0x, Y + H - 0.1, s0z, s1x, Y, s1z, 0.012, 0xd8dcdf); }
    for (let t = 0.25; t < 1; t += 0.25) { const v = D*(0.5 + 0.5*t), yy = Y + (H - 0.1)*(1 - t), [s0x, s0z] = P(-W, v), [s1x, s1z] = P(W, v); dRod(s0x, yy, s0z, s1x, yy, s1z, 0.012, 0xd8dcdf); }
  }
  goal(-35.3, FCZ + 3.0, [-1, 0], 0xe0a83a, 1.4, true);
  goal(EGX, FCZ, [1, 0], 0xe0a83a, 1.4);
  goal(-13, FLD.z[0] + 1.2, [0, -1], 0xf0f2f4, 0.8);
  goal(-24, SCHOOL.southFenceZ - 3.2, [0, 1], 0xf0f2f4, 0.8);
  {
    const EF = SCHOOL.eastFenceX, FP = SCHOOL.forestPlay;

    [[-36, -15.5, YARD, 4], [30, FLD.z[0] + 1.2, FIELD, 3]].forEach(([lx, lz, ly, n9]) => {
      post(lx, lz, ly, ly + 12, 0.25);
      dCyl(0.14, 0.28, 14.5, 0xb8b7b0, lx, ly, lz, { far: true, seg: 8 });
      dBox(0.4, 0.6, 0.25, 0xb8bcc0, lx - 0.4, ly + 1.9, lz, { far: true }); dBox(0.3, 0.05, 0.05, 0x8a8f92, lx - 0.3, ly + 2.2, lz);
      for (let r = 0; r < 4; r++) { const ay = ly + 12.0 + r * 0.7;
        dBox(2.4, 0.08, 0.08, 0x4f545a, lx, ay, lz + 0.2, { far: true });
        for (let i = 0; i < n9; i++) { const ex = lx - 0.9 + i * 1.8 / (n9 - 1);
          dBlob(0.22, 0.2, 0.18, 0x3d4248, ex, ay + 0.26, lz + 0.36, { chunky: true, far: true }); lamp(0.26, 0.2, 0.05, ex, ay + 0.16, lz + 0.55); } }
    });
  }

  PATDEF.paveG = [1.6, 256, false, (g, N, R) => bond(g, N, 32, 16, ['#8d8f92', '#86888c', '#939599', '#7f8286'], '#6a6c70', 1.5, R)];
  PATDEF.sand = [2.4, 256, false, (g, N, R) => { g.fillStyle = '#d3bb8a'; g.fillRect(0, 0, N, N); blotch(g, N, 50, ['#c9ae7c', '#dcc697', '#cdb484'], 10, 40, 0.25, R); specks(g, N, 700, ['#b39a6c', '#eadbb8', '#a88f63'], 0.5, 1.4, R); }];
  PATDEF.redRd = [3.0, 256, false, (g, N, R) => { g.fillStyle = '#b86a5c'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#ad6053', '#c27566', '#b36b5a'], 10, 40, 0.3, R); specks(g, N, 700, ['#9a5448', '#cf8a7a'], 0.4, 1, R, 0.8); }];
  PATDEF.kidHop = [3.6, 512, false, (g, N, R) => {
    bond(g, N, 28, 14, ['#8d8f92', '#86888c', '#939599', '#7f8286'], '#6a6c70', 1.5, R);
    g.save(); g.translate(N * 0.53, N * 0.52); g.rotate(-0.18); g.scale(1.2, 1.2);
    g.fillStyle = '#2c2d31'; g.beginPath(); g.ellipse(-N * 0.33, -N * 0.02, N * 0.1, N * 0.12, 0, 0, 7); g.fill();
    g.fillStyle = '#f1c7a2'; g.beginPath(); g.ellipse(-N * 0.3, 0, N * 0.085, N * 0.1, 0, 0, 7); g.fill();
    g.fillStyle = '#f4f2ec'; g.fillRect(-N * 0.22, -N * 0.14, N * 0.3, N * 0.28);
    g.fillStyle = '#f1c7a2'; g.fillRect(-N * 0.16, -N * 0.26, N * 0.07, N * 0.13); g.fillRect(-N * 0.16, N * 0.13, N * 0.07, N * 0.13);
    g.fillStyle = '#2c2d31'; g.fillRect(N * 0.08, -N * 0.12, N * 0.2, N * 0.24);
    g.fillStyle = '#e8a36a'; g.fillRect(N * 0.28, -N * 0.12, N * 0.1, N * 0.09); g.fillRect(N * 0.28, N * 0.03, N * 0.1, N * 0.09);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; const cw = N * 0.1, x0 = -N * 0.2;
    [[0, 0], [1, 0], [2, -0.5], [2, 0.5], [3, 0], [4, -0.5], [4, 0.5], [5, 0]].forEach(([i, j], k) => {
      g.strokeRect(x0 + i * cw, (j - 0.5) * cw, cw, cw);
      g.fillStyle = '#6fb3e0'; g.font = '700 ' + Math.round(cw * 0.7) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k + 1), x0 + (i + 0.5) * cw, j * cw); });
    g.restore(); }];
  const SB = SCHOOL.boundary, [SGX, SGZ] = SCHOOL.gate;
  const SWA = SB.find(p => p[1] === SGZ && p[0] < SGX), SWB = SB[SB.indexOf(SWA) + 1];
  const fenceZ = x => SWA[1] + (x - SWA[0]) * (SWB[1] - SWA[1]) / (SWB[0] - SWA[0]);
  const grassZ = x => fenceZ(x) - 2.0, walkZ = x => fenceZ(x) - 2.8;
  function floor4(kind, P, y, tint = 0xffffff, uv = null) {
    const s = PATDEF[kind][0], Q = [], U = [];
    P.forEach((p, i) => { const q = Q[Q.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-4) { Q.push(p); if (uv) U.push(uv[i]); } });
    if (Q.length === 3) { Q.push(Q[2]); if (uv) U.push(U[2]); }
    patPush(kind, Q.map(([x, z]) => [x, y, z]), uv ? U : Q.map(([x, z]) => [x / s, -z / s]), [0, 1, 0], tint);
  }
  const band = (kind, xa, xb, top, bot, y, tint) => floor4(kind, [[xa, top(xa)], [xb, top(xb)], [xb, bot(xb)], [xa, bot(xa)]], y, tint);
  function slab(x0, z0, x1, z1, w, h, hex, y0, opt = {}) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    _dm.compose(_dv.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2), _dq.setFromEuler(_de.set(0, -Math.atan2(z1 - z0, x1 - x0), 0)), _ds.set(L, h, w));
    dGeo(box_, _dm, hex, opt);
  }

  {

    const Y = FIELD, S9 = 0xc3c8cc, ST = 0xd5d9dc, PX = SCHOOL.plaza.x[0], RUB = 0x2a2b2d;
    floor4('sand', [[-49.2, 45.8], [PX, 45.8], [PX, 55.6], [-46.3, 55.6]], Y + 0.01);

    floor4('sand', [[-46.3, 55.6], [PX, 55.6], [-31, 58.5], [-43.5, 64.3]], Y + 0.01);
    floor4('sand', [[-31, 58.5], [-31, walkZ(-31)], [-43.5, 64.3], [-43.5, 64.3]], Y + 0.01);

    floor4('paveG', [[PX, 55.6], [-31, 55.6], [-31, 58.5], [-31, 58.5]], Y + 0.02);
    patQuad('dirt', -49.5, -31, SCHOOL.field.z[1], 45.8, Y);

    for (let x9 = -49.0; x9 <= -39.6 + 1e-6; x9 += 1.88) dRod(x9, Y, 45.8, x9, Y + 0.72, 45.8, 0.03, S9);
    [0.35, 0.7].forEach(h9 => dRod(-49.0, Y + h9, 45.8, -39.6, Y + h9, 45.8, 0.025, S9));
    colliders.push(noStand({ x0: -49.05, x1: -39.55, y0: Y, y1: Y + 0.75, z0: 45.74, z1: 45.86 }));
    {
      const x9 = -49.55, z9 = 44.95;
      dCyl(0.13, 0.19, 10.5, 0xbfc2c0, x9, Y, z9, { far: true, seg: 8 }); colliders.push({ x0: x9 - 0.2, x1: x9 + 0.2, y0: Y, y1: Y + 10.5, z0: z9 - 0.2, z1: z9 + 0.2, nc: true });
      dBox(0.34, 0.72, 0.26, 0xb6babd, x9 + 0.3, Y + 2.5, z9, { far: true }); dBox(0.05, 0.6, 0.2, 0x8a8f92, x9 + 0.495, Y + 2.56, z9);
      dBox(1.6, 0.1, 0.1, 0x6d7278, x9, Y + 9.6, z9, { far: true });
    }
    dBox(PX + 49.2, 0.1, 0.12, RUB, (PX - 49.2) / 2, Y, 45.8);
    colliders.push({ x0: -49.2, x1: PX, y0: Y, y1: Y + 0.1, z0: 45.74, z1: 45.86 });
    dBox(0.12, 0.1, 55.6 - 45.86, RUB, PX, Y, (45.86 + 55.6) / 2);
    slab(PX + 0.04, 55.6, -31, 58.5 - 0.02, 0.12, 0.1, RUB, Y);
    slab(-31, walkZ(-31) + 0.06, -43.4, 64.36, 0.14, 0.045, RUB, Y);
    objScope('slide', () => {

      const mx = PX - 2.0, mz = 54.75, D = 2.0, HW = 0.55, pz0 = mz - 0.5, pz1 = mz + 0.5, HE = 0.34, CG = 0.9;
      dBox(2 * HW, 0.06, 1.0, ST, mx, Y + D - 0.06, mz);
      [[-HW, pz0], [HW, pz0], [-HW, pz1], [HW, pz1]].forEach(([ox, z9]) => dRod(mx + ox, Y, z9, mx + ox, Y + D + CG, z9, 0.045, S9));
      [-HW, HW].forEach(ox => { dRod(mx + ox, Y + D + CG, pz0, mx + ox, Y + D + CG, pz1, 0.035, S9); dRod(mx + ox, Y + D + 0.08, pz0, mx + ox, Y + D + 0.08, pz1, 0.025, S9);
        for (let z9 = pz0 + 0.125; z9 < pz1 - 0.06; z9 += 0.125) dRod(mx + ox, Y + D + 0.08, z9, mx + ox, Y + D + CG, z9, 0.015, S9); });
      [pz0, pz1].forEach(z9 => dRod(mx - HW, Y + D + CG, z9, mx + HW, Y + D + CG, z9, 0.03, S9));
      colliders.push({ x0: mx - HW, x1: mx + HW, y0: Y + 1.5, y1: Y + D, z0: pz0, z1: pz1 });
      [[-HW, pz0], [HW, pz0], [-HW, pz1], [HW, pz1]].forEach(([ox, z9]) => colliders.push({ x0: mx + ox - 0.05, x1: mx + ox + 0.05, y0: Y, y1: Y + D + CG, z0: z9 - 0.05, z1: z9 + 0.05, nc: true }));
      [-HW, HW].forEach(ox => colliders.push(noStand({ x0: mx + ox - 0.04, x1: mx + ox + 0.04, y0: Y + D, y1: Y + D + 1.6, z0: pz0, z1: pz1 })));

      const HS = 0.45, SR = 1.7, sz1 = pz1 + SR, NS9 = 9, rr = SR / (NS9 + 1), La = Math.hypot(SR, D), aa = Math.atan2(D, SR);
      [-HS, HS].forEach(ox => {
        _dm.compose(_dv.set(mx + ox * 0.94, Y + D / 2, (pz1 + sz1) / 2), _dq.setFromEuler(_de.set(aa, 0, 0)), _ds.set(0.04, 0.16, La)); dGeo(box_, _dm, S9);
        dRod(mx + ox, Y + 0.9, sz1 - 0.04, mx + ox, Y + D + CG, pz1, 0.025, S9);
        dRod(mx + ox, Y, sz1 - 0.04, mx + ox, Y + 0.9, sz1 - 0.04, 0.025, S9);
        [0.35, 0.65].forEach(t => { const zq = sz1 - SR * t; dRod(mx + ox, Y + D * t + 0.05, zq, mx + ox, Y + D * t + 0.82, zq + 0.28, 0.018, S9); });
        colliders.push(noStand({ x0: mx + ox - 0.04, x1: mx + ox + 0.04, y0: Y, y1: Y + D + 1.6, z0: pz1, z1: sz1 })); });
      for (let k = 1; k <= NS9; k++) { const zc = sz1 - k * rr, h9 = D * k / (NS9 + 1);
        dBox(2 * HS * 0.88, 0.03, 0.14, ST, mx, Y + h9 - 0.03, zc);
        colliders.push({ x0: mx - HS, x1: mx + HS, y0: h9 > 1.5 ? Y + 1.5 : Y, y1: Y + h9, z0: k === NS9 ? pz1 : zc - rr / 2, z1: zc + rr / 2 }); }

      const PH = 25 * Math.PI / 180, Lh = 2.55, Lr = 0.5, Lc = Math.hypot(Lh, D - HE), ac = Math.atan2(D - HE, Lh);
      const CB9 = new THREE.Matrix4().compose(new THREE.Vector3(mx, 0, pz0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -PH, 0)), new THREE.Vector3(1, 1, 1));
      const cW = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(CB9);
      const base9 = CB9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, Y + (D + HE) / 2, -Lh / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(-ac, 0, 0)), new THREE.Vector3(1, 1, 1)));
      const E9 = 0.16, part9 = (w, h, ox, oy, hex) => dGeo(box_, base9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(ox, oy, -E9 / 2), new THREE.Quaternion(), new THREE.Vector3(w, h, Lc + E9))), hex, { far: true });
      part9(0.62, 0.05, 0, 0, ST); part9(0.05, 0.22, -0.335, 0.09, S9); part9(0.05, 0.22, 0.335, 0.09, S9);
      dGeo(box_, CB9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, Y + HE - 0.03, -Lh - Lr / 2), new THREE.Quaternion(), new THREE.Vector3(0.72, 0.06, Lr))), ST, { far: true });
      [-0.3, 0.3].forEach(ox => { const a9 = cW(ox, Y, -Lh - Lr + 0.08); dRod(a9.x, Y, a9.z, a9.x, Y + HE - 0.06, a9.z, 0.03, S9); });
      const colR = (x0, x1, z0, z1, y0, y1) => { const P9 = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => cW(x, 0, z));
        colliders.push({ x0: Math.min(...P9.map(p => p.x)), x1: Math.max(...P9.map(p => p.x)), y0, y1, z0: Math.min(...P9.map(p => p.z)), z1: Math.max(...P9.map(p => p.z)) }); };
      for (let k = 0; k < 6; k++) { const hm = D - (D - HE) * (k + 0.5) / 6; colR(-0.36, 0.36, -Lh * (k + 1) / 6, -Lh * k / 6, hm > 1.5 ? Y + 1.5 : Y, Y + hm); }
      colR(-0.36, 0.36, -Lh - Lr, -Lh, Y, Y + HE);
      const to9 = cW(0, 0, -Lh - Lr + 0.2);
      hotspots.push({ kind: 'slide', x: mx, z: mz, y: Y + D, r: 1.0, label: '미끄럼틀 타기', from: [mx, Y + D, mz - 0.4], to: [to9.x, Y + HE, to9.z] });
    });
    objScope('swing', () => {
      const x9 = -42.7, z9 = 49.1, G9 = 0x9aa0a6;
      [-1.6, 1.6].forEach(o => { dRod(x9 + o, Y, z9 - 0.8, x9 + o, Y + 2.3, z9, 0.05, G9, { far: true }); dRod(x9 + o, Y, z9 + 0.8, x9 + o, Y + 2.3, z9, 0.05, G9, { far: true });
        colliders.push(noStand({ x0: x9 + o - 0.08, x1: x9 + o + 0.08, y0: Y, y1: Y + 1.2, z0: z9 - 0.84, z1: z9 - 0.38 }), noStand({ x0: x9 + o - 0.08, x1: x9 + o + 0.08, y0: Y, y1: Y + 1.2, z0: z9 + 0.38, z1: z9 + 0.84 })); });
      dRod(x9 - 1.7, Y + 2.3, z9, x9 + 1.7, Y + 2.3, z9, 0.06, G9, { far: true });
      [-0.6, 0.6].forEach(o => { [-0.2, 0.2].forEach(d9 => dRod(x9 + o + d9, Y + 2.28, z9, x9 + o + d9, Y + 0.5, z9, 0.012, 0x8a9096));
        dBox(0.5, 0.05, 0.22, o < 0 ? 0x4fae52 : 0xd8463c, x9 + o, Y + 0.45, z9);
        colliders.push(noStand({ x0: x9 + o - 0.25, x1: x9 + o + 0.25, y0: Y + 0.45, y1: Y + 2.2, z0: z9 - 0.11, z1: z9 + 0.11 })); });
    });
    objScope('climb', () => {

      const cx9 = -31.0, cz9 = 62.2, HL = 1.8, HW = 0.6, H9 = 2.1;
      [-HL, HL].forEach(ox => { [-HW, HW].forEach(oz => { dRod(cx9 + ox, Y, cz9 + oz, cx9 + ox, Y + H9, cz9 + oz, 0.045, S9); colliders.push({ x0: cx9 + ox - 0.07, x1: cx9 + ox + 0.07, y0: Y, y1: Y + H9, z0: cz9 + oz - 0.07, z1: cz9 + oz + 0.07, nc: true }); });
        dRod(cx9 + ox, Y + H9, cz9 - HW, cx9 + ox, Y + H9, cz9 + HW, 0.03, S9);
        [0.45, 0.8].forEach(h9 => dRod(cx9 + ox, Y + h9, cz9 - HW, cx9 + ox, Y + h9, cz9 + HW, 0.022, S9));
        colliders.push(noStand({ x0: cx9 + ox - 0.06, x1: cx9 + ox + 0.06, y0: Y, y1: Y + H9, z0: cz9 - HW - 0.06, z1: cz9 + HW + 0.06 }));
        const sx9 = Math.sign(ox);
        [-HW, HW].forEach(oz => { dRod(cx9 + ox, Y + H9, cz9 + oz, cx9 + ox + sx9 * 0.28, Y + H9, cz9 + oz, 0.025, S9); dRod(cx9 + ox + sx9 * 0.28, Y + H9, cz9 + oz, cx9 + ox + sx9 * 0.28, Y + H9 - 0.32, cz9 + oz, 0.025, S9); }); });
      [-HW, HW].forEach(oz => dRod(cx9 - HL, Y + H9, cz9 + oz, cx9 + HL, Y + H9, cz9 + oz, 0.03, S9));
    });
    objScope('climb', () => {

      const cx9 = -39.5, cz9 = 60.9, HL = 1.4, HW = 0.6, G9 = S9;
      const cage9 = (x0, x1, z0, z1, y0, y1, dz) => {
        [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => dRod(x, Y + y0, z, x, Y + y1, z, 0.03, G9));
        [x0, x1].forEach(x => { for (let z = z0 + dz; z < z1 - 0.1; z += dz) dRod(x, Y + y0, z, x, Y + y1, z, 0.018, G9); });
        [y1, (y0 + y1) / 2].forEach(h => { [x0, x1].forEach(x => dRod(x, Y + h, z0, x, Y + h, z1, 0.02, G9)); [z0, z1].forEach(z => dRod(x0, Y + h, z, x1, Y + h, z, 0.02, G9)); });
        for (let z = z0 + dz; z < z1 - 0.1; z += dz) dRod(x0, Y + y1, z, x1, Y + y1, z, 0.018, G9); };
      cage9(cx9 - HW, cx9 + HW, cz9 - HL, cz9 + HL, 0, 1.0, 0.4);
      cage9(cx9 - HW, cx9 + 0.05, cz9 - HL, cz9 + 0.2, 1.0, 1.5, 0.4);
      cage9(cx9 - 0.5, cx9 - 0.05, cz9 - 0.95, cz9 - 0.5, 1.5, 2.3, 0.45);
      colliders.push(noStand({ x0: cx9 - HW - 0.05, x1: cx9 + HW + 0.05, y0: Y, y1: Y + 1.05, z0: cz9 - HL - 0.05, z1: cz9 + HL + 0.05 }));
      colliders.push(noStand({ x0: cx9 - HW - 0.05, x1: cx9 + 0.1, y0: Y, y1: Y + 2.35, z0: cz9 - HL - 0.05, z1: cz9 + 0.25 }));
    });
    {

      const x9 = PX + 0.5, z9 = 54.4;
      [-0.54, 0.54].forEach(o => { dRod(x9, Y, z9 + o, x9, Y + 1.92, z9 + o, 0.035, S9); post(x9, z9 + o, Y, Y + 1.92, 0.06); });
      dBox(0.05, 0.84, 1.12, 0x2f6fd0, x9 - 0.025, Y + 1.05, z9);
      dBox(0.03, 0.74, 1.02, 0xf4f4f0, x9 + 0.015, Y + 1.1, z9);
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y + 1.0, y1: Y + 1.92, z0: z9 - 0.56, z1: z9 + 0.56 }));
      [[0, 1.72, 0.92, 0.1, 0x3a78c8], [-0.25, 1.36, 0.42, 0.28, 0x9cc3e0], [0.22, 1.36, 0.46, 0.28, 0xe3b39c], [-0.25, 1.18, 0.42, 0.08, 0x8d8d8d], [0.22, 1.18, 0.4, 0.08, 0x8d8d8d]].forEach(([oz, yy, w, h, c]) => dBox(0.03, h, w, c, x9 + 0.045, Y + yy, z9 + oz));
    }
    {

      const RX = -39.6, RZ = 55.1, WX = -46.7, rail9 = (x0, z0, x1, z1, skip0) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.9));
        for (let i = skip0 ? 1 : 0; i <= n; i++) { const t = i / n; dRod(x0 + (x1 - x0) * t, Y, z0 + (z1 - z0) * t, x0 + (x1 - x0) * t, Y + 0.72, z0 + (z1 - z0) * t, 0.03, S9); }
        [0.35, 0.7].forEach(h9 => dRod(x0, Y + h9, z0, x1, Y + h9, z1, 0.025, S9));
        colliders.push(noStand({ x0: Math.min(x0, x1) - 0.06, x1: Math.max(x0, x1) + 0.06, y0: Y, y1: Y + 0.75, z0: Math.min(z0, z1) - 0.06, z1: Math.max(z0, z1) + 0.06 })); };
      rail9(RX, 45.8, RX, 50.5, true); rail9(RX, 52.5, RX, RZ); rail9(RX, RZ, WX, RZ, true);
    }
    {
      const sE = x => walkZ(-31) + (x + 31) * (64.3 - walkZ(-31)) / (-12.5);
      [[-41.4, 67.3, 1.05], [-35.6, 66.6, 0.75]].forEach(([x9, z9, s9]) => { bgTree(x9, z9, s9); colliders[colliders.length - 1].nc = true; });
      [[-42.3, 65.8, 0.85, 0x3f6f3a], [-39.3, 65.7, 0.95, 0x4a7a40], [-35.3, 65.5, 0.8, 0x3f6f3a], [-31.9, 65.3, 0.75, 0x4f8045]].forEach(([x9, z9, r9, c9]) => shrub(x9, z9, r9, c9, true));
      [-42.8, -41.3, -39.6, -38.0, -36.2, -34.4, -32.8].forEach((x9, k) => { const z9 = sE(x9) + 0.62, w9 = 0.6 + 0.14 * (k % 3), h9 = 0.42 + 0.1 * ((k + 1) % 3);
        dBlob(w9, h9, 0.42, [0x9d988c, 0xa8a397, 0x8f8a7f][k % 3], x9, Y + h9 * 0.45, z9, { chunky: true, far: true, ry: k * 1.7 });
        ellipseCols(x9, z9, w9, 0.42, k * 1.7, Y, Y + h9, 0.86); });
      dBlob(0.58, 0.42, 0.56, 0x979286, -31.35, Y + 0.16, 64.1, { chunky: true, far: true, ry: 0.7 });
      colliders.push(noStand({ x0: -31.87, x1: -30.83, y0: Y, y1: Y + 0.58, z0: 63.58, z1: 64.62 }));
    }
    {

      const bx0 = -30.75, bx1 = -27.2, bz0 = SCHOOL.plaza.z[0], bz1 = 49.2, KB = 0xcfccc4;
      patQuad('sand', bx0, bx1, bz0, bz1, Y + 0.03);
      dBox(0.12, 0.045, bz1 - bz0 - 0.12, KB, bx0 - 0.06, Y, (bz0 + bz1 - 0.12) / 2);
      dBox(bx1 - bx0 + 0.12, 0.045, 0.12, KB, (bx0 + bx1) / 2, Y, bz1 - 0.06);
      [[-29.6, 46.2, 0.3], [-28.2, 47.6, 0.25], [-30.1, 48.4, 0.22]].forEach(([x9, z9, r9]) => dBlob(r9, 0.035, r9 * 0.8, 0x7fa35a, x9, Y + 0.01, z9, { jitter: 0.2 }));
    }
    zones.push({ x0: -48.5, x1: PX, z0: 45.8, z1: 69.3, y: Y, label: '놀이터' });
  }
  const FNC = 0x8dbb5a, FNP = 0x7fae4f;
  {
    const KP = SCHOOL.kinderPlayground, kpx = (KP.x[0] + KP.x[1])/2, kpz = (KP.z[0] + KP.z[1])/2, Y = FIELD, KW = KP.x[1] - KP.x[0], KD = KP.z[1] - KP.z[0];
    patQuad('dirt', KP.x[0] + 0.15, KP.x[1] - 0.15, KP.z[0] + 0.15, KP.z[1] - 0.15, Y + 0.008, false, 0xc9cf9e);
    objScope('slide', () => {
      const cx = kpx - 1.3, cz = kpz + 1.4, F9 = { far: true }, PU = 0x6d5fb0, TL = 0x3f9a7a;
      const zA = cz + 0.2, zB = cz - 1.0;
      addBox(1.2, 0.15, 1.2, 0x3a6ea5, cx, Y + 1.05, zA); addBox(1.2, 0.15, 1.2, 0x3a6ea5, cx, Y + 1.35, zB);
      [[-0.55, zA + 0.55], [0.55, zA + 0.55], [-0.55, zA - 0.55], [0.55, zA - 0.55]].forEach(([ox, z9]) => { dRod(cx + ox, Y, z9, cx + ox, Y + 2.6, z9, 0.05, PU, F9); colliders.push(noStand({ x0: cx + ox - 0.06, x1: cx + ox + 0.06, y0: Y, y1: Y + 2.6, z0: z9 - 0.06, z1: z9 + 0.06 })); });
      [[-0.55, zB - 0.55], [0.55, zB - 0.55]].forEach(([ox, z9]) => { dRod(cx + ox, Y, z9, cx + ox, Y + 3.0, z9, 0.05, PU, F9); colliders.push(noStand({ x0: cx + ox - 0.06, x1: cx + ox + 0.06, y0: Y, y1: Y + 3.0, z0: z9 - 0.06, z1: z9 + 0.06 })); });
      dCyl(0, 0.92, 0.85, TL, cx, Y + 2.6, zA, { far: true, seg: 6 }); dBlob(0.11, 0.11, 0.11, 0xf2c230, cx, Y + 3.5, zA, { chunky: true, far: true });
      dCyl(0, 0.8, 0.7, TL, cx, Y + 3.0, zB - 0.05, { far: true, seg: 6, rot: [0, 0.5, 0] });
      dBox(0.6, 0.9, 0.06, 0x3563c9, cx - 0.28, Y + 0.12, zA + 0.63);
      [0x3a9d5d, 0xe24b4b, 0xf2c230].forEach((c9, r) => { for (let k = 0; k < 3; k++) dBlob(0.05, 0.05, 0.03, c9, cx - 0.46 + k * 0.18, Y + 0.45 + r * 0.2, zA + 0.68, { chunky: true }); });
      dCyl(0.42, 0.42, 0.8, 0xf2c230, cx + 1.0, Y + 1.5 + 0.42, zB, { far: true, seg: 10, rot: [0, 0, Math.PI / 2] });
      colliders.push(noStand({ x0: cx + 0.3, x1: cx + 1.0, y0: Y + 1.5, y1: Y + 2.34, z0: zB - 0.4, z1: zB + 0.4 }));
      addBox(0.8, 0.15, 0.9, 0x3a6ea5, cx + 1.0, Y + 1.35, zB);
      [[0.75, 0.6], [0.4, 0.9]].forEach(([h9, z9]) => addBox(0.5, h9, 0.3, 0x3a6ea5, cx + 0.3, Y, zA + z9 + 0.15));
      {
        const px9 = cx - 1.9, pz9 = zA - 0.2;
        dRod(px9, Y, pz9, px9, Y + 3.3, pz9, 0.08, PU, F9); post(px9, pz9, Y, Y + 3.3, 0.12);
        for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3; dBlob(0.68, 0.07, 0.22, k % 2 ? 0x3f8f6a : 0x4fa070, px9 + Math.cos(a) * 0.56, Y + 3.3 - 0.12, pz9 + Math.sin(a) * 0.56, { far: true, ry: -a }); }
        dBlob(0.16, 0.14, 0.16, 0x3f8f6a, px9, Y + 3.35, pz9, { far: true, chunky: true });
      }

      const bed = (x0, y0, z0, x1, y1, z1, w, col, rail) => {
        const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, hz = Math.hypot(dx, dz), Ls = Math.hypot(hz, dy);
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.atan2(-dy, hz), Math.atan2(dx, dz), 0, 'YXZ')), c = new THREE.Vector3((x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2);
        const part = (sx, sy, ox, oy) => dGeo(box_, new THREE.Matrix4().compose(c.clone().add(new THREE.Vector3(ox, oy, 0).applyQuaternion(q)), q, new THREE.Vector3(sx, sy, Ls)), sx > 0.1 ? col : rail, F9);
        part(w, 0.06, 0, 0); part(0.05, 0.2, -w/2 - 0.025, 0.07); part(0.05, 0.2, w/2 + 0.025, 0.07);
        const n9 = Math.max(1, Math.ceil(hz / 0.35));
        for (let k = 0; k < n9; k++) { const t0 = k / n9, t1 = (k + 1) / n9, xa = x0 + dx * t0, xb = x0 + dx * t1, za = z0 + dz * t0, zb = z0 + dz * t1;
          colliders.push({ x0: Math.min(xa, xb) - w/2 + 0.05, x1: Math.max(xa, xb) + w/2 - 0.05, y0: Y, y1: y0 + dy * (t0 + t1) / 2, z0: Math.min(za, zb) - w/2 + 0.05, z1: Math.max(za, zb) + w/2 - 0.05 }); }
      };
      const wave = (x0, z0, x1, z1, w, col, rail) => { const P9 = [[0, 1.2], [0.38, 0.62], [0.58, 0.7], [1, 0.12]].map(([t, h]) => [x0 + (x1 - x0) * t, Y + h, z0 + (z1 - z0) * t]);
        for (let k = 0; k < 3; k++) bed(...P9[k], ...P9[k + 1], w, col, rail); };
      wave(cx + 0.6, zA - 0.25, cx + 3.3, zA + 1.2, 0.5, 0xd9869a, 0xc76f86);
      wave(cx + 0.6, zA + 0.35, cx + 3.1, zA + 1.9, 0.5, 0xd9869a, 0xc76f86);
      bed(cx + 1.4, Y + 1.5, zB - 0.1, cx + 3.8, Y + 0.12, zB - 0.5, 0.55, 0x4a7fd6, 0x3a6ab8);
      bed(cx - 0.6, Y + 1.2, zA + 0.2, cx - 1.25, Y + 0.8, zA + 0.95, 0.5, 0xeeeeea, 0xd9d9d4);
      bed(cx - 1.25, Y + 0.8, zA + 0.95, cx - 1.35, Y + 0.12, zA + 2.2, 0.5, 0xeeeeea, 0xd9d9d4);
      {
        const pts = [[0.1, 1.85, zB - 0.7], [-0.4, 1.45, zB - 1.5], [-1.2, 1.0, zB - 1.7], [-1.8, 0.55, zB - 1.1], [-1.95, 0.4, zB - 0.3]].map(([ox, h, z9]) => new THREE.Vector3(cx + ox, Y + h, z9));
        dGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.33, 8, false), new THREE.Matrix4(), 0xb8bcc0, F9);
        pts.forEach(v => colliders.push(noStand({ x0: v.x - 0.33, x1: v.x + 0.33, y0: Y, y1: Math.max(v.y + 0.33, Y + 1.6), z0: v.z - 0.33, z1: v.z + 0.33 })));
      }
      hotspots.push({ kind: 'slide', x: cx + 0.3, z: zA, y: Y + 1.2, r: 1.0, label: '미끄럼틀 타기', from: [cx + 0.6, Y + 1.2, zA - 0.25], to: [cx + 3.4, Y, zA + 1.3] });
    });
    [[kpx + 2.2, kpz - 2.3, 0xd97a5a], [kpx + 3.0, kpz - 0.9, 0x5a8fd9]].forEach(([rx9, rz9, c9]) => objScope('rocker', () => {
      colliders.push(noStand({ x0: rx9 - 0.3, x1: rx9 + 0.3, y0: Y, y1: Y + 0.5, z0: rz9 - 0.3, z1: rz9 + 0.3 }));
      dBox(0.5, 0.04, 0.5, 0x8a9096, rx9, Y, rz9);
      dCyl(0.1, 0.12, 0.3, 0x3a3d44, rx9, Y + 0.04, rz9, { seg: 8 });
      dBlob(0.34, 0.18, 0.18, c9, rx9, Y + 0.5, rz9, { chunky: true });
      dBlob(0.13, 0.15, 0.13, c9, rx9 + 0.3, Y + 0.67, rz9, { chunky: true });
      dRod(rx9 + 0.22, Y + 0.75, rz9 - 0.14, rx9 + 0.22, Y + 0.75, rz9 + 0.14, 0.02, 0xf2c230);
    }));
    {
      const sx9 = KP.x[1] - 2.0, sz9 = KP.z[0] + 2.3;
      [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([ox, oz]) => { dRod(sx9 + ox, Y, sz9 + oz, sx9 + ox, Y + 2.4, sz9 + oz, 0.05, 0xdfe3e8, { far: true }); post(sx9 + ox, sz9 + oz, Y, Y + 2.4, 0.06); });
      dCyl(0, 2.2, 0.7, 0x2f6fd0, sx9, Y + 2.4, sz9, { far: true, seg: 4, rot: [0, Math.PI/4, 0] });
    }

    const GT0 = KP.x[1] - 1.5, GT1 = KP.x[1] - 0.3;
    meshFence(KP.x[0], KP.z[0], GT0, KP.z[0], Y, 1.5, FNC, FNP);
    meshFence(GT1 - 0.01, KP.z[0], KP.x[1], KP.z[0], Y, 1.5, FNC, FNP, false);
    meshFence(KP.x[0], KP.z[1], KP.x[1], KP.z[1], Y, 1.5, FNC, FNP);
    meshFence(KP.x[0], KP.z[0], KP.x[0], KP.z[1], Y, 1.5, FNC, FNP);
    meshFence(KP.x[1], KP.z[0], KP.x[1], KP.z[1], Y, 1.5, FNC, FNP);
    meshFence(GT1, KP.z[0] - 0.05, GT1 + 0.1, KP.z[0] - 1.15, Y, 1.3, FNC, FNP, false);
    colliders.push({ x0: GT1 - 0.02, x1: GT1 + 0.22, y0: Y, y1: Y + 3, z0: KP.z[0] - 1.27, z1: KP.z[0] + 0.12, nc: true });
    dBox(0.04, 0.7, 0.9, 0x2f62b8, KP.x[1] + 0.08, Y + 0.6, KP.z[0] + 1.6);
    dBox(0.03, 0.5, 0.7, 0xf2f0ea, KP.x[1] + 0.115, Y + 0.72, KP.z[0] + 1.6);
    dCyl(0.05, 0.05, 1.7, 0x9aa0a6, KP.x[1] + 0.35, Y, KP.z[1] - 0.35, { seg: 6 }); post(KP.x[1] + 0.35, KP.z[1] - 0.35, Y, Y + 1.7, 0.06);
    dCyl(0.32, 0.32, 0.04, 0xeef2f4, KP.x[1] + 0.35, Y + 1.75, KP.z[1] - 0.35, { seg: 14, rot: [0, 0, Math.PI / 2], far: true });

    addPanel(0.45, KD + 0.5, 0x4a4c4a, KP.x[1] + 0.28, Y + 0.015, kpz + 0.25); dBox(0.12, 0.08, KD + 0.62, 0xdad6cc, KP.x[1] + 0.56, Y, kpz + 0.31);
    addPanel(KW + 0.05, 0.45, 0x4a4c4a, kpx - 0.025, Y + 0.015, KP.z[1] + 0.275); dBox(KW + 0.55, 0.08, 0.12, 0xdad6cc, kpx + 0.225, Y, KP.z[1] + 0.56);
    sign('유치원 놀이터', kpx, Y + 1.8, KP.z[0] - 0.2, 0, 0.32);
    zones.push({ x0: KP.x[0], x1: KP.x[1], z0: KP.z[0], z1: KP.z[1], y: Y, label: '유치원 놀이터' });
  }
  {

    const GS = SCHOOL.gymStairs, Z = TR3.westZ, R = YARD - FIELD, KP = SCHOOL.kinderPlayground;
    for (let i = 0; i < 6; i++) addBox(GS.x[1] - GS.x[0], R * (6 - i) / 7, 0.3, 0xb8b4ac, (GS.x[0] + GS.x[1])/2, FIELD, Z + 0.15 + 0.3 * i);
    [1.15, 0.9, 0.6].forEach((h, k) => { const z9 = Z + 0.3 + 0.6 * k;
      addBox(0.3, h, 0.6, 0x8f8a80, GS.x[1] + 0.15, FIELD, z9);
      dBox(0.34, 0.06, 0.6, 0xa29d92, GS.x[1] + 0.15, FIELD + h, z9);
      patWall('stoneW', 'z', z9 - 0.3, z9 + 0.3, FIELD, FIELD + h, GS.x[1] + 0.312, 1); });
    patQuad('pave', GS.x[0], GS.x[1] + 0.3, Z, KP.z[0] - 0.1, FIELD + 0.012); patQuad('pave', KP.x[0], GS.x[0], TR3.gymSouthZ, KP.z[0] - 0.1, FIELD + 0.012);
    addPanel(0.36, KP.z[0] - 0.1 - (Z + 1.0), 0x4a4c4a, GS.x[1] + 0.48, FIELD + 0.015, (Z + 1.0 + KP.z[0] - 0.1)/2);

    const CB0 = -19.5;
    addBox(0.3, 0.35, Z - CB0, 0x9c978c, TR3.westX - 0.15, YARD, (CB0 + Z)/2);
    meshFence(TR3.westX - 0.15, CB0, TR3.westX - 0.15, Z, YARD + 0.35, 1.8, FNC, FNP);

    dBox(0.03, 1.0, 3.2, 0xf2f2ee, TR3.westX - 0.12, YARD + 0.75, -15.5);

    const PX0 = G.annex.x[1] + 1.45, PX1 = TR3.westX - 0.3, PZ0 = GCZ0 - 0.4, AX0 = G.annex.x[1] + 0.15, WE = fx0 - 0.15;
    patQuad('pave', PX0, PX1, PZ0, Z - 0.3, YARD + 0.012);
    [[-41.4, -7.5], [-41.3, -13]].forEach(([x9, z9]) => dCyl(0.3, 0.3, 0.02, 0x4b3f35, x9, YARD + 0.013, z9, { seg: 12 }));
    [[gx1 + 0.15, WE, G.annex.z[0] - 3, G.annex.z[0] - 0.15],
     [AX0, WE, G.annex.z[0] - 0.15, fzW], [AX0, -39.2, fzW, PZ0], [PX1, -39.2, PZ0, -19.5],
     [-39.2, -38.5, -19.62, -19.5], [TR3.westX, -38.5, -19.5, TERR_Z], [TR3.westX, -36, TERR_Z, -10],
     [TR3.westX - 0.3, WE, gz0 - 0.15, G.annex.z[0] - 3], [gx1 + 0.15, AX0, gz0 - 0.15, G.annex.z[0] - 3]].forEach(([a, b, c, d]) => patQuad('asph', a, b, c, d, YARD + 0.012));
    zones.push({ x0: GS.x[0], x1: GS.x[1], z0: Z, z1: Z + 1.8, y: FIELD + 0.5, label: '체육관 계단' });
    zones.push({ x0: G.annex.x[1], x1: TR3.westX, z0: PZ0, z1: Z, y: YARD, label: '체육관 옆길' });
    zones.push({ x0: G.annex.x[1], x1: WE, z0: gz0, z1: PZ0, y: YARD, label: '체육관 앞 마당' });
    zones.push({ x0: TR3.westX, x1: -38.5, z0: PZ0, z1: Math.min(-9.5, SCHOOL.field.z[0]), y: YARD, label: '체육관 앞 마당' });
    { const KP = SCHOOL.kinderPlayground, x0 = SCHOOL.field.x[0], x1 = TR3.westX;
      zones.push({ x0: GS.x[0], x1, z0: Z, z1: KP.z[0], y: FIELD, label: '운동장' }, { x0, x1: GS.x[0], z0: TR3.gymSouthZ, z1: KP.z[0], y: FIELD, label: '운동장' }, { x0, x1, z0: KP.z[1], z1: SCHOOL.southFenceZ, y: FIELD, label: '운동장' });
      if (KP.x[1] < x1) zones.push({ x0: KP.x[1], x1, z0: KP.z[0], z1: KP.z[1], y: FIELD, label: '운동장' }); }
  }
  {

    const GSX = TR3.gymSouthX, GSZ = TR3.gymSouthZ, SHY = 0xf5d20f;

    addBox(GSX + 86, YARD - FIELD, GSZ - TR3.westZ, SITE, (GSX - 86) / 2, FIELD, (TR3.westZ + GSZ) / 2);
    patWall('stoneW', 'x', -86, GSX, FIELD, YARD, GSZ + 0.012, 1); patWall('stoneW', 'z', TR3.westZ, GSZ, FIELD, YARD, GSX + 0.012, 1);
    patQuad('pave', -83.3, GSX - 0.15, gz1 + 0.15, GSZ - 0.15, YARD + 0.012); patQuad('pave', -83.8, gx0 - 0.15, gz1, gz1 + 0.15, YARD + 0.012);
    patQuad('pave', -86, -83.3, gz1, -3.9, YARD + 0.012); patQuad('pave', -86, -83.3, -1.7, GSZ - 0.15, YARD + 0.012);
    patQuad('pave', gx1 + 0.15, GSX - 0.15, GA.z[1] + 0.15, gz1 + 0.15, YARD + 0.012);
    addPanel(G.width + 0.3, 0.3, 0x3c3e40, gx, YARD + 0.02, gz1 + 0.3);
    [[-86, -66, 0.9], [-66, -50.5, 0.55], [-50.5, GSX - 0.15, 0.3]].forEach(([a, b, h9]) => {
      addBox(b - a, h9, 0.15, 0xa9a59c, (a + b) / 2, YARD, GSZ - 0.075, NS);
      meshFence(a, GSZ - 0.075, b, GSZ - 0.075, YARD + h9, 1.5, FNC, FNP, true, 0, true); });
    addBox(0.15, 0.3, GSZ - 0.15 - TR3.westZ - 0.1, 0xa9a59c, GSX - 0.075, YARD, (TR3.westZ + 0.1 + GSZ - 0.15) / 2, NS);
    meshFence(GSX - 0.075, TR3.westZ + 0.1, GSX - 0.075, GSZ - 0.15, YARD + 0.3, 1.5, FNC, FNP, true, 0, true);

    const SH = { x0: -85.6, x1: -83.3, z0: -3.9, z1: -1.7 }, SHH = 2.3;
    wallX(SH.x0, SH.x1, SH.z0 + 0.15, SHY, { y0: YARD, h: SHH, gaps: [{ c: (SH.x0 + SH.x1) / 2, w: 0.6, sill: 1.3, dh: 1.8, win: true, frame: 0xf2f0ea, noLedge: true }] });
    wallX(SH.x0, SH.x1, SH.z1 - 0.15, SHY, { y0: YARD, h: SHH });
    wallZ(SH.z0 + 0.15, SH.z1 - 0.15, SH.x0 + 0.15, SHY, { y0: YARD, h: SHH });
    wallZ(SH.z0 + 0.15, SH.z1 - 0.15, SH.x1 - 0.15, SHY, { y0: YARD, h: SHH, gaps: [{ c: (SH.z0 + SH.z1) / 2, w: 0.9, dh: 2.0, door: true, late: true, swing: { n: 1, leaves: [0.9], look: 'plain', color: 0xf0cc10 } }] });
    addBox(SH.x1 - SH.x0 + 0.3, 0.15, SH.z1 - SH.z0 + 0.3, 0x9aa0a4, (SH.x0 + SH.x1) / 2, YARD + SHH, (SH.z0 + SH.z1) / 2);
    for (let a = SH.z0 + 0.2; a < SH.z1 - 0.1; a += 0.3) if (Math.abs(a - (SH.z0 + SH.z1) / 2) > 0.6) dBox(0.04, SHH - 0.1, 0.08, 0xe0bd0a, SH.x1 + 0.02, YARD + 0.05, a);
    for (let a = SH.x0 + 0.2; a < SH.x1 - 0.1; a += 0.3) { dBox(0.08, SHH - 0.1, 0.04, 0xe0bd0a, a, YARD + 0.05, SH.z1 + 0.02); if (Math.abs(a - (SH.x0 + SH.x1) / 2) > 0.4) dBox(0.08, SHH - 0.1, 0.04, 0xe0bd0a, a, YARD + 0.05, SH.z0 - 0.02); }
    floorQ('tileW', SH.x0 + 0.3, SH.x1 - 0.3, SH.z0 + 0.3, SH.z1 - 0.3, YARD, 0x9a9690);
    addBox(0.6, 0.25, 1.0, 0x3f6fc4, SH.x0 + 0.62, YARD, (SH.z0 + SH.z1) / 2 + 0.2);
    dCyl(0.25, 0.22, 0.55, 0x9aa0a6, SH.x0 + 0.6, YARD, SH.z0 + 0.62, { seg: 10 }); dBlob(0.11, 0.11, 0.11, 0x4fc3f7, SH.x0 + 0.6, YARD + 0.6, SH.z0 + 0.62, { chunky: true });
    colliders.push(noStand({ x0: SH.x0 + 0.3, x1: SH.x0 + 0.88, y0: YARD, y1: YARD + 0.7, z0: SH.z0 + 0.3, z1: SH.z0 + 0.9 }));
    [0, 0.3].forEach(o => dCyl(0.03, 0.14, 0.4, 0xff7a1a, SH.x0 + 0.5 + o, YARD, SH.z1 - 0.5, { seg: 8 })); colliders.push(noStand({ x0: SH.x0 + 0.36, x1: SH.x0 + 0.94, y0: YARD, y1: YARD + 0.4, z0: SH.z1 - 0.64, z1: SH.z1 - 0.36 }));
    zones.push({ x0: SH.x0 + 0.3, x1: SH.x1 - 0.3, z0: SH.z0 + 0.3, z1: SH.z1 - 0.3, y: YARD, label: '체육 창고(바깥)' });

    const WPX = -83.8, WY = YARD + 0.3, BZ0 = gz0 - 1.2, BZ1 = -4.0;
    addBox(gx0 - 0.15 - WPX, 0.3, (gz1 - 0.3) - (gz0 - 0.15), 0xc8c2b6, (WPX + gx0 - 0.15) / 2, YARD, (gz0 - 0.15 + gz1 - 0.3) / 2);
    patQuad('pave', WPX, gx0 - 0.15, gz0 - 0.15, gz1 - 0.3, WY + 0.012);
    addPanel(0.3, gz1 - gz0 - 0.6, 0x3c3e40, gx0 - 0.3, WY + 0.02, gz);
    addBox(gx0 - 0.15 - WPX, 0.15, 0.3, 0xb8b4ac, (WPX + gx0 - 0.15) / 2, YARD, gz1 - 0.15);
    addBox(gx0 - 0.15 - WPX, 0.15, 0.3, 0xb8b4ac, (WPX + gx0 - 0.15) / 2, YARD, gz0 - 0.3);

    addBox(1.1, GYF - WY, 1.6, 0xb8b4ac, gx0 - 0.15 - 0.55, WY, EXZ);
    exitSign(gx0 + 0.15, EXZ, GYF + 2.42, [1, 0]);
    addBox(WPX + 86, YARD + 2.1 - YARD, BZ1 - BZ0, 0xb9b5ac, (WPX - 86) / 2, YARD, (BZ0 + BZ1) / 2);
    patWall('stoneW', 'z', BZ0, BZ1, YARD, YARD + 2.1, WPX + 0.012, 1); patWall('stoneW', 'x', -86, WPX, YARD, YARD + 2.1, BZ0 - 0.012, -1);
    patWall('stoneW', 'x', -86, WPX, YARD, YARD + 2.1, BZ1 + 0.012, 1);
    patQuad('grass', -86, WPX, BZ0, BZ1, YARD + 2.1 + 0.012, false, 0xb8c89a);
    meshFence(WPX - 0.25, BZ0 + 0.1, WPX - 0.25, BZ1 - 0.1, YARD + 2.1, 1.5, FNC, FNP, true, 0, true);
    for (let z9 = BZ0 + 1.5; z9 < BZ1 - 1; z9 += 2.6) dBlob(0.5, 0.35, 0.7, 0x4f7d3a, WPX - 0.2, YARD + 2.1 + 0.9 + ((z9 * 7) % 0.4), z9, { chunky: true });

    const NPZ = gz0 - 2.85;
    patQuad('pave', WPX, gx1 + 0.15, NPZ, gz0 - 0.15, YARD + 0.022);
    addPanel(G.width + 0.3, 0.3, 0x3c3e40, gx, YARD + 0.026, gz0 - 0.3);
    dBox(gx1 + 0.15 - (gx0 + 0.5), 0.1, 0.15, 0xb8b4ac, (gx0 + 0.5 + gx1 + 0.15) / 2, YARD, NPZ - 0.075);
    addPanel(gx1 - 4 - (gx0 + 1), 0.3, 0x55585a, (gx0 + 1 + gx1 - 4) / 2, YARD + 0.026, NPZ - 0.35);
    for (let x9 = gx0 + 2; x9 < gx1 - 5; x9 += 2.4) { dBlob(0.42, 0.33, 0.42, 0x4f8a45, x9, YARD + 0.29, NPZ - 1.05, { chunky: true, ry: x9, jitter: 0.1 }); colliders.push(noStand({ x0: x9 - 0.36, x1: x9 + 0.36, y0: YARD, y1: YARD + 0.6, z0: NPZ - 1.41, z1: NPZ - 0.69 })); }
    meshFence(gx0 + 1, NPZ - 1.75, gx1 - 4, NPZ - 1.75, YARD, 1.2, FNC, FNP, true, 0, true);
    { const lx = gx1 + 0.8, lz = NPZ - 0.6;
      dCyl(0.06, 0.08, 4.6, 0xb8bcc0, lx, YARD, lz, { seg: 8 }); dBox(0.9, 0.05, 0.55, 0x2c3e66, lx, YARD + 4.7, lz);
      dBox(0.5, 0.12, 0.2, 0xe8e8e4, lx - 0.4, YARD + 4.3, lz); post(lx, lz, YARD, YARD + 4.6, 0.1); }
    zones.push({ x0: gx1, x1: GA.x[1], z0: GA.z[1], z1: gz1, y: YARD, label: '체육관 남쪽 길' }, { x0: SH.x1, x1: GA.x[1], z0: gz1, z1: GSZ, y: YARD, label: '체육관 남쪽 길' }, { x0: GA.x[1], x1: GSX, z0: TR3.westZ, z1: GSZ, y: YARD, label: '체육관 남쪽 길' });
    zones.push({ x0: WPX, x1: gx0, z0: gz0, z1: gz1, y: WY, label: '체육관 서쪽 길' });
    zones.push({ x0: WPX, x1: gx1, z0: NPZ, z1: gz0, y: YARD, label: '체육관 북쪽 길' });
  }
  {

    const XE = -30, XS = -27, ZT = -10, ZB = -3;
    addBox(XE - TR3.westX, YARD - FIELD, ZT - TERR_Z, SITE, (TR3.westX + XE)/2, FIELD, (TERR_Z + ZT)/2);
    patQuad('dirt', -36, XE, TERR_Z, ZT, YARD + 0.012);
    slope('dirt', 'z', TR3.westX, XE, ZT, ZB, YARD, FIELD, 10);
    slope('dirt', 'x', TERR_Z, ZT, XE, XS, YARD, FIELD, 4);
    patPush('dirt', [[XE, YARD, ZT], [XE, FIELD, ZB], [XS, FIELD, ZT], [XS, FIELD, ZT]], [[XE/4, -ZT/4], [XE/4, -ZB/4], [XS/4, -ZT/4], [XS/4, -ZT/4]], [0, 1, 0], 0xffffff);
    slopeCap('stoneW', TR3.westX + 0.012, 1, TR3.westZ, ZT, YARD + (FIELD - YARD) * (TR3.westZ - ZT) / (ZB - ZT), YARD);
    {
      const x9 = -34.7, z9 = -15.2, R7 = seeded(3517), up = (x, y, z, rx, rz, L) => [x - Math.sin(rz) * L, y + Math.cos(rz) * Math.cos(rx) * L, z + Math.sin(rx) * L];
      colliders.push({ x0: x9 - 0.25, x1: x9 + 0.25, y0: YARD, y1: YARD + 12, z0: z9 - 0.25, z1: z9 + 0.25 });
      dCyl(0.14, 0.21, 3.0, 0x8a5a3e, x9, YARD, z9, { far: true, rot: [0.1, 0, -0.25] });
      const T1 = up(x9, YARD, z9, 0.1, -0.25, 3.0);
      [[-0.1, -0.45, 2.6], [0.25, 0.3, 2.3]].forEach(([rx, rz, L], k) => { dCyl(0.08, 0.13, L, 0x8a5a3e, ...T1, { far: true, rot: [rx, 0, rz] });
        const T2 = up(...T1, rx, rz, L);
        for (let j = 0; j < 3; j++) { const a = R7() * 6.28, d = 0.4 + R7() * 0.8, h = -0.3 + j * 0.45;
          dBlob(1.25 - j * 0.2, 0.26, 0.95 - j * 0.12, [0x3f6b3c, 0x4a7644, 0x436f3f][(j + k) % 3], T2[0] + Math.cos(a) * d, T2[1] + h, T2[2] + Math.sin(a) * d, { far: true, ry: a, jitter: 0.12 }); } });
    }
    [[-39.4, ZT - 0.35], [-37.0, ZT - 0.35]].forEach(([x9, z9]) => {
      dCyl(0.09, 0.15, 0.62, 0xe8742c, x9, YARD, z9, { seg: 10, far: true }); dBlob(0.1, 0.09, 0.1, 0xe8742c, x9, YARD + 0.62, z9, { far: true });
      dCyl(0.125, 0.135, 0.08, 0xf2f2f2, x9, YARD + 0.42, z9, { seg: 10 });
      colliders.push(noStand({ x0: x9 - 0.18, x1: x9 + 0.18, y0: YARD, y1: YARD + 0.75, z0: z9 - 0.18, z1: z9 + 0.18 })); });
  }
  {

    const NZ0 = 37.0, NZ1 = SCHOOL.kinderPlayground.z[1] + 1.0;
    meshFence(-50.5, NZ0, -50.5, NZ1, FIELD + 1.8, 4.7, 0x33413a, 0x6f9a5a, false);
    dRod(-50.5, FIELD + 4.6, NZ0, -50.5, FIELD, NZ0 + 2.2, 0.045, 0x6f9a5a, { far: true });
    dRod(-50.5, FIELD + 4.6, NZ1, -50.5, FIELD, NZ1 - 2.1, 0.045, 0x6f9a5a, { far: true });
    { const n9 = Math.max(1, Math.round((NZ0 - NZ1) / 3)); for (let i = 0; i <= n9; i++) { const z9 = NZ0 + (NZ1 - NZ0) * i / n9; dRod(-50.5, FIELD, z9, -50.5, FIELD + 1.8, z9, 0.045, 0x6f9a5a, { far: true }); } }
    for (let z9 = 16.2, k = 0; z9 <= 43; z9 += 1.25, k++) dBlob(0.42 + 0.1 * (k % 3), 0.3 + 0.06 * (k % 2), 0.4, [0x9d988c, 0x8f8a7f, 0xa8a397][k % 3], -51.2 - 0.12 * (k % 2), FIELD + 0.12, z9, { chunky: true, ry: k, at: [-45, 29] });
    for (let z9 = 1.5, k = 0; z9 <= 41; z9 += 2.2, k++) dBlob(1.6, 1.4, 1.5, k % 2 ? 0x2f4a33 : 0x3a5a3c, -52.3 - (k % 3) * 0.3, FIELD + 1.3, z9, { far: true, chunky: true, jitter: 0.18, ry: k });
    [[-55.5, -1, 1.2], [-52.6, 3, 1.1], [-55.5, 7.5, 1.25], [-52.6, 12, 1.05], [-55.2, 16.5, 1.15]].forEach(([x9, z9, s9]) => bgTree(x9, z9, s9));
  }
  {

    const [sx9, sz9] = SCHOOL.shelter.center, sl = SCHOOL.shelter.length, RB = [0x6cc070, 0xf0a04b, 0x6fb3e0], Y = FIELD, PZ = SCHOOL.plaza, RUB = 0x2a2b2d;
    const sxa = sx9 - sl / 2, sxb = sx9 + sl / 2, RR = 4.46, AL = 0.568, YC = 3.3 - RR;
    const archY = dz => Y + YC + Math.sqrt(RR * RR - dz * dz);
    for (let k = 0; k <= 10; k++) {
      const px9 = sxa + 0.5 + k * 3.5;
      [-1, 1].forEach(sg => { const pz9 = sz9 + sg * 1.7, yt = archY(1.7);
        dCyl(0.1, 0.1, 2.0, 0xa8602e, px9, Y, pz9, { far: true, seg: 8 });
        dCyl(0.07, 0.07, yt - Y - 2.0, 0xc9ced3, px9, Y + 2.0, pz9, { far: true, seg: 8 });
        dRod(px9, Y + 2.35, pz9, px9, archY(2.25) - 0.02, sz9 + sg * 2.25, 0.03, 0xc9ced3, { far: true });
        post(px9, pz9, Y, Y + 2.9, 0.1); });
    }
    [-1, 1].forEach(sg => dRod(sxa + 0.2, archY(1.7) - 0.05, sz9 + sg * 1.7, sxb - 0.2, archY(1.7) - 0.05, sz9 + sg * 1.7, 0.05, 0xc9ced3, { far: true }));
    {
      const top9 = new THREE.CylinderGeometry(RR, RR, 3.0, 8, 1, true, Math.PI / 2 - AL, 2 * AL).rotateZ(Math.PI / 2), under9 = top9.clone().scale(1, 1, -1);
      for (let k = 0; k < sl / 3; k++) { const m9 = new THREE.Matrix4().makeTranslation(sxa + 1.5 + 3 * k, Y + YC, sz9);
        dGeo(top9, m9, RB[k % 3], { far: true }); dGeo(under9, m9, 0x7a7268, { far: true }); }
      [-1, 1].forEach(sg => dRod(sxa, Y + 2.6, sz9 + sg * 2.4, sxb, Y + 2.6, sz9 + sg * 2.4, 0.045, 0xe9e7e0, { far: true }));
      [sxa, sxb].forEach(ex9 => { for (let i = 0; i < 8; i++) { const a0 = -AL + 2 * AL * i / 8, a1 = -AL + 2 * AL * (i + 1) / 8;
        dRod(ex9, Y + YC + RR * Math.cos(a0), sz9 + RR * Math.sin(a0), ex9, Y + YC + RR * Math.cos(a1), sz9 + RR * Math.sin(a1), 0.045, 0xe9e7e0, { far: true }); } });
      colliders.push({ x0: sxa, x1: sxb, y0: Y + 2.6, y1: Y + 3.3, z0: sz9 - 2.4, z1: sz9 + 2.4 });
    }
    [sxb - 2.3, sxb - 5.8].forEach(bx9 => {
      objScope('bench', () => { dBox(3.2, 0.06, 0.42, 0x5a3e2c, bx9, Y + 0.4, sz9);
      [-1.4, 1.4].forEach(o => dBox(0.06, 0.4, 0.36, 0x2b2d30, bx9 + o, Y, sz9));
      colliders.push({ x0: bx9 - 1.6, x1: bx9 + 1.6, y0: Y, y1: Y + 0.46, z0: sz9 - 0.21, z1: sz9 + 0.21 }); });
      hotspots.push({ kind: 'sit', x: bx9, z: sz9 - 0.5, y: Y, r: 0.9, label: '벤치에 앉기', yaw: Math.PI, seat: { x: bx9, y: Y + 0.46 - 0.46, z: sz9 + 0.02, yaw: Math.PI } });
    });

    for (let k = 1; k <= 6; k++) { const bx9 = sxa + 0.5 + 3.5 * k + 1.75, bz9 = sz9 + 1.7 - 0.36;
      objScope('bench', () => { dBox(2.8, 0.06, 0.4, 0x6a4a34, bx9, Y + 0.39, bz9); [-1.2, 0, 1.2].forEach(o => dBox(0.06, 0.39, 0.34, 0x2b2d30, bx9 + o, Y, bz9));
      colliders.push(noStand({ x0: bx9 - 1.4, x1: bx9 + 1.4, y0: Y, y1: Y + 0.45, z0: bz9 - 0.2, z1: bz9 + 0.2 })); });
      hotspots.push({ kind: 'sit', x: bx9, z: bz9 - 0.62, y: Y, r: 0.9, label: '벤치에 앉기', yaw: Math.PI, seat: { x: bx9, y: Y + 0.45 - 0.46, z: bz9 + 0.02, yaw: Math.PI } }); }
    objScope('cone', () => { const cx9 = SCHOOL.bus[0] - 6.4, cz9 = SCHOOL.bus[1] + 0.6;
      dCyl(0.03, 0.16, 0.68, 0xe0582a, cx9, Y + 0.05, cz9, { seg: 8 }); dCyl(0.1, 0.12, 0.1, 0xf4f4f0, cx9, Y + 0.33, cz9, { seg: 8 }); dBox(0.36, 0.05, 0.36, 0x2e2e30, cx9, Y, cz9);
      colliders.push(noStand({ x0: cx9 - 0.18, x1: cx9 + 0.18, y0: Y, y1: Y + 0.75, z0: cz9 - 0.18, z1: cz9 + 0.18 })); });
    objScope('bin', () => { const tx9 = sxa + 0.5, tz9 = sz9 + 2.25;
      dCyl(0.18, 0.17, 0.66, 0xb9bec2, tx9, Y, tz9, { seg: 10 }); dCyl(0.19, 0.19, 0.06, 0x2b2d30, tx9, Y + 0.66, tz9, { seg: 10 });
      colliders.push(noStand({ x0: tx9 - 0.2, x1: tx9 + 0.2, y0: Y, y1: Y + 0.72, z0: tz9 - 0.2, z1: tz9 + 0.2 })); });

    const SE9 = -3.2, Cz = x => 58.5 + (x + 31) * (54.4 - 58.5) / (SE9 + 31);

    patQuad('dirt', -31, SCHOOL.forestPlay.x[0], SCHOOL.field.z[1], PZ.z[0], Y);
    patQuad('paveG', PZ.x[0], -31, 45.8, 55.6, Y + 0.02);
    band('paveG', -31, SE9, () => PZ.z[0], Cz, Y + 0.02);
    band('paveG', SE9, PZ.x[1], () => PZ.z[0], grassZ, Y + 0.02);
    band('paveG', -31, SE9, walkZ, grassZ, Y + 0.02);
    band('sand', -31, SE9, Cz, walkZ, Y + 0.01);
    slab(-31, Cz(-31), SE9, Cz(SE9), 0.12, 0.1, RUB, Y);
    slab(-31, walkZ(-31), SE9, walkZ(SE9), 0.12, 0.1, RUB, Y);
    slab(SE9, Cz(SE9) - 0.06, SE9, walkZ(SE9) + 0.06, 0.12, 0.1, RUB, Y);
    slab(-31, grassZ(-31) + 0.08, SWA[0], grassZ(SWA[0]) + 0.08, 0.15, 0.15, 0xd9d6cf, Y);
    const GX1 = PZ.x[1] + 4.4;
    dBox(GX1 + 31, 0.03, 0.3, 0x55585c, (GX1 - 31) / 2, Y, PZ.z[0] - 0.16);
    for (let x9 = -30.6; x9 < GX1; x9 += 0.6) dBox(0.04, 0.035, 0.26, 0x3c3f43, x9, Y + 0.005, PZ.z[0] - 0.16);
    dBox(0.6, 0.03, 0.9, 0x4a4d52, -1.2, Y + 0.02, 55.3);
    [[5.8, 44.0], [11.6, 43.9]].forEach(([x9, z9]) => objScope('post', () => {
      dCyl(0.07, 0.2, 0.62, 0xe0482c, x9, Y, z9, { seg: 10 }); dCyl(0.11, 0.15, 0.08, 0xf2f2f2, x9, Y + 0.3, z9, { seg: 10 }); dBlob(0.12, 0.12, 0.12, 0xe0482c, x9, Y + 0.66, z9);
      colliders.push(noStand({ x0: x9 - 0.2, x1: x9 + 0.2, y0: Y, y1: Y + 0.8, z0: z9 - 0.2, z1: z9 + 0.2 })); }));

    for (let k = 0; k < 8; k++) { const t = k / 7, x9 = -11.5 + 7.2 * t, z9 = 56.8 - 1.1 * t, h9 = 1.0 + 0.5 * hash2(x9, 3.1);
      objScope('post', () => { dBox(0.12, h9, 0.12, 0x8a6a4a, x9, Y, z9); colliders.push(noStand({ x0: x9 - 0.1, x1: x9 + 0.1, y0: Y, y1: Y + h9, z0: z9 - 0.1, z1: z9 + 0.1 })); }); }
    [[-17.2, 57.9], [-14.0, 57.5]].forEach(([x9, z9]) => objScope('seesaw', () => {
      const SS = 0xc9ced3;
      dBox(0.3, 0.35, 0.3, 0x8a9096, x9, Y, z9);
      [-0.12, 0.12].forEach(o => dRod(x9 - 1.6, Y + 0.28, z9 + o, x9 + 1.6, Y + 0.62, z9 + o, 0.035, SS));
      [-1.35, 1.35].forEach(o => { const yy = Y + 0.45 + o / 1.6 * 0.17;
        dRod(x9 + o, yy, z9, x9 + o, yy + 0.16, z9, 0.02, SS); dGeo(new THREE.TorusGeometry(0.12, 0.02, 5, 10), new THREE.Matrix4().makeTranslation(x9 + o, yy + 0.28, z9), SS); });
      [-1.5, 1.5].forEach(o => dCyl(0.26, 0.26, 0.13, 0x26282c, x9 + o, Y, z9, { seg: 10 }));
      colliders.push(noStand({ x0: x9 - 1.65, x1: x9 + 1.65, y0: Y, y1: Y + 0.7, z0: z9 - 0.3, z1: z9 + 0.3 }));
    }));
    [[-21.0, 58.7], [-24.4, 59.3]].forEach(([x9, z9]) => objScope('climb', () => {
      const SS = 0xc3c8cc, H9 = 2.5;
      [-0.6, 0.6].forEach(o => { dRod(x9, Y, z9 + o, x9, Y + H9, z9 + o, 0.04, SS, { far: true }); dRod(x9 + 0.8, Y, z9 + o, x9, Y + 1.6, z9 + o, 0.03, SS);
        colliders.push(noStand({ x0: x9, x1: x9 + 0.85, y0: Y, y1: Y + 1.6, z0: z9 + o - 0.06, z1: z9 + o + 0.06 })); });
      for (let y9 = 0.3; y9 < H9; y9 += 0.3) dRod(x9, Y + y9, z9 - 0.6, x9, Y + y9, z9 + 0.6, 0.02, SS);
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y, y1: Y + H9, z0: z9 - 0.66, z1: z9 + 0.66 }));
    }));

    { const tx9 = -22.8, tz9 = 52.6, CB = 0xc9c6bf;
      objScope('tree', () => { tree(tx9, tz9, 1.35);
      [[0, 3.9, 0, 3.0, 0x4d8b4d], [1.1, 4.3, -0.6, 2.0, 0x5c9a4f], [-1.2, 4.1, 0.7, 1.9, 0x3f7a3f]].forEach(([ox, oy, oz, r, c]) =>
        dBlob(r, r * 0.3, r * 0.9, c, tx9 + ox, Y + oy, tz9 + oz, { far: true, jitter: 0.12, ry: ox })); });
      patQuad('dirt', tx9 - 1.3, tx9 + 1.3, tz9 - 1.3, tz9 + 1.3, Y + 0.03, false, 0xb0916a);
      addBox(2.9, 0.15, 0.15, CB, tx9, Y, tz9 - 1.375); addBox(2.9, 0.15, 0.15, CB, tx9, Y, tz9 + 1.375);
      addBox(0.15, 0.15, 2.6, CB, tx9 - 1.375, Y, tz9); addBox(0.15, 0.15, 2.6, CB, tx9 + 1.375, Y, tz9);
      [0, 70, 140, 210].forEach(c9 => {
        const a0 = (c9 - 25) * Math.PI / 180, a1 = (c9 + 25) * Math.PI / 180, sh = new THREE.Shape();
        objScope('bench', () => {
        sh.absarc(0, 0, 2.3, a0, a1, false); sh.absarc(0, 0, 1.8, a1, a0, true);
        dGeo(new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(tx9, Y, tz9), 0x5b5f66, { far: true });
        for (let i = 0; i < 3; i++) { const b0 = a0 + (a1 - a0) * i / 3, b1 = a0 + (a1 - a0) * (i + 1) / 3, xs = [], zs = [];
          [b0, b1].forEach(b => [1.8, 2.3].forEach(r => { xs.push(tx9 + r * Math.cos(b)); zs.push(tz9 - r * Math.sin(b)); }));
          colliders.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Y, y1: Y + 0.45, z0: Math.min(...zs), z1: Math.max(...zs) }); } });
        const cm = c9 * Math.PI / 180;
        if (c9 < 200) { const yw = Math.atan2(Math.cos(cm), -Math.sin(cm));
          hotspots.push({ kind: 'sit', x: tx9 + 2.75 * Math.cos(cm), z: tz9 - 2.75 * Math.sin(cm), y: Y, r: 0.9, label: '벤치에 앉기', yaw: yw, seat: { x: tx9 + 2.02 * Math.cos(cm), y: Y + 0.45 - 0.46, z: tz9 - 2.02 * Math.sin(cm), yaw: yw } }); }
      });
      [250, 275, 300].forEach(c9 => { const cm = c9 * Math.PI / 180, x9 = tx9 + 2.55 * Math.cos(cm), z9 = tz9 - 2.55 * Math.sin(cm);
        objScope('chair', () => { dCyl(0.22, 0.22, 0.44, 0x62666c, x9, Y, z9, { seg: 9, far: true });
        colliders.push({ x0: x9 - 0.22, x1: x9 + 0.22, y0: Y, y1: Y + 0.44, z0: z9 - 0.22, z1: z9 + 0.22 }); }); });
    }

    const RY = Y + 0.03, YL = 0xf2c94c, PK = 0xe25a70, GR = 0x6fbf5a, SK = 0x7cc4e8, PU = 0xa98bd6, WH = 0xf2f2ee;
    const ringG = (x, z, r0, r1, col, t0 = 0, tl = Math.PI * 2) => dGeo(new THREE.RingGeometry(r0, r1, 40, 1, t0, tl).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x, RY, z), col);
    const rectG = (x, z, w, d, col) => dGeo(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x, RY, z), col);
    { const [ax, az] = [-6.8, 51.0];
      ringG(ax, az, 0, 0.3, YL); ringG(ax, az, 0.3, 0.78, PK); ringG(ax, az, 1.0, 1.1, GR); ringG(ax, az, 1.38, 1.48, SK); ringG(ax, az, 1.75, 1.86, YL); }
    { const [ax, az] = [2.6, 52.7];
      ringG(ax, az, 0, 1.2, YL); ringG(ax, az, 1.2, 1.26, 0xf4e8b0);
      [[1.6, SK, 0.2, 4.2], [2.0, PU, -0.4, 4.4], [2.4, WH, 0.6, 3.6], [2.75, YL, -0.9, 4.0]].forEach(([r, c, t0, tl]) => ringG(ax, az, r, r + 0.1, c, Math.PI + t0, tl)); }
    { const [ax, az] = [-14.2, 51.4];
      ringG(ax, az, 1.4, 1.5, WH, 0.3, 5.2); ringG(ax, az, 2.3, 2.4, SK, 3.3, 2.6); ringG(ax, az, 1.85, 1.95, YL, 2.0, 2.2); ringG(ax, az, 0.45, 0.55, PK);
      ringG(-10.9, 51.1, 0.5, 0.6, GR); ringG(-17.6, 50.6, 0.6, 0.7, PU, 0.6, 4.6); }
    { const [qx, qz] = [-18.6, 52.9];
      rectG(qx, qz, 0.84, 0.84, 0xe25a7a); rectG(qx, qz - 0.48, 1.08, 0.12, YL); rectG(qx, qz + 0.48, 1.08, 0.12, YL); rectG(qx - 0.48, qz, 0.12, 0.84, YL); rectG(qx + 0.48, qz, 0.12, 0.84, YL); }
    rectG(-10.8, 49.6, 4.0, 0.1, WH);
    [[-10.8, 52.6], [-10.3, 52.9], [-9.8, 52.6], [-9.3, 52.9]].forEach(([fx, fz]) => rectG(fx, fz, 0.16, 0.28, 0xf0a04b));
    floor4('kidHop', [[-31.6, 50.0], [-27.6, 50.0], [-27.6, 56.4], [-31.6, 56.4]], RY, 0xffffff, [[1, 0], [1, 1], [0, 1], [0, 0]]);

    zones.push({ x0: sxa, x1: sxb, z0: sz9 - 2.25, z1: sz9 + 2.25, y: Y, label: '무지개 쉼터' });
    zones.push({ x0: PZ.x[0], x1: SE9, z0: sz9 + 2.25, z1: 55.6, y: Y, label: '놀이마당' });
    zones.push({ x0: -31, x1: SE9, z0: 55.6, z1: 62, y: Y, label: '모래 놀이터' });
  }
  {

    const EP2 = SCHOOL.eastPath, EF = SCHOOL.eastFenceX, Y = FIELD, [PX0, PX1] = EP2.x, F9 = { far: true }, G9 = 0x9ccc5e;

    const NA = (o, z) => (o && o.far) ? o : z < -2 ? { ...(o || {}), far: true, at: [40, -8] } : z < 12 ? { ...(o || {}), at: [40, 8] } : { ...(o || {}), at: [40, z < 34 ? 20 : 36] };
    const dBoxE = (w, h, d, c, x, y, z, o) => dBox(w, h, d, c, x, y, z, NA(o, z)), dBlobE = (sx, sy, sz, c, x, y, z, o) => dBlob(sx, sy, sz, c, x, y, z, NA(o, z)), dRodE = (x0, y0, z0, x1, y1, z1, r, c, o) => dRod(x0, y0, z0, x1, y1, z1, r, c, NA(o, z0));
    const dCylE = (rt, rb, h, c, x, y, z, o) => dCyl(rt, rb, h, c, x, y, z, NA(o, z)), slabE = (x0, z0, x1, z1, w, h, c, y0, o) => slab(x0, z0, x1, z1, w, h, c, y0, NA(o, z0));
    const BZ = TERR_Z, ZR = TR3.fieldZ + 2.6, ZS = 12, PX1S = PX0 + 2.5, FZ0 = 3, FZ1 = 33;
    const ZC = 38.0, SZ0 = 41.3, SZ1 = 44.5, RI = SZ0 - ZC, XC = PX0 - RI, ROX = PX1S - XC, ROZ = SZ1 - ZC, SX0 = 17.5;
    const R8 = seeded(4711), pk = a => a[Math.floor(R8() * a.length) % a.length];
    PATDEF.paveE = [1.6, 256, false, (g, N, R) => bond(g, N, 32, 32, ['#e6e0cb', '#e1dbc4', '#ebe5d1', '#dcd6c0'], '#bdb6a2', 1.5, R, 0.5, [0.05, ['#8a8c90', '#cdb2a6', '#a3a09a', '#9ea6ae']])];

    const barrier = (x0, z0, x1, z1, y0 = Y, pad = 0.06) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (Math.abs(x1 - x0) < 0.01 || Math.abs(z1 - z0) < 0.01 ? 99 : 0.3)));
      for (let i = 0; i < n; i++) { const ax = x0 + (x1 - x0) * i / n, az = z0 + (z1 - z0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, bz = z0 + (z1 - z0) * (i + 1) / n;
        colliders.push(noStand({ x0: Math.min(ax, bx) - pad, x1: Math.max(ax, bx) + pad, y0, y1: y0 + 1.6, z0: Math.min(az, bz) - pad, z1: Math.max(az, bz) + pad })); } };
    const logLine = pts => {
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, z0, s] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) continue;
        const nx = s * (z1 - z0) / L, nz = -s * (x1 - x0) / L, o = 0.08;
        slabE(x0, z0, x1, z1, 0.14, 0.28, 0x7d6346, Y);
        const P = [[x0 + nx * o, Y, z0 + nz * o], [x1 + nx * o, Y, z1 + nz * o], [x1 + nx * o, Y + 0.29, z1 + nz * o], [x0 + nx * o, Y + 0.29, z0 + nz * o]];
        const u0 = (pts[i][3] || 0) / 1.2, u1 = u0 + L / 1.2; pts[i + 1][3] = (pts[i][3] || 0) + L;
        patPush('wood', P, [[0, u0], [0, u1], [0.24, u1], [0.24, u0]], [nx, 0, nz], 0x9c7c5c);
        barrier(x0, z0, x1, z1); } };
    const wireLine = (pts, step = 2.5) => {
      let acc = step;
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) continue;
        [0.45, 0.9].forEach(h => dRodE(x0, Y + h, z0, x1, Y + h, z1, 0.005, 0xd0d4d8));
        for (let t = 0; t < L; t += 0.25) { acc += 0.25; if (acc >= step) { acc = 0; const px = x0 + (x1 - x0) * t / L, pz = z0 + (z1 - z0) * t / L; dRodE(px, Y, pz, px, Y + 1.02, pz, 0.012, 0xc8cdd2); } }
        barrier(x0, z0, x1, z1); } };
    const plants = (x0, z0, x1, z1, n, cols, rm = 0.38) => { for (let k = 0; k < n; k++) objScope('bush', () => { const x = x0 + (x1 - x0) * R8(), z = z0 + (z1 - z0) * R8(), r = rm * (0.6 + R8() * 0.4);
      dBlobE(r, r * 1.1, r, pk([0x5f8f45, 0x6b9a4c, 0x557f3e]), x, Y + r * 0.8, z, { chunky: true, jitter: 0.15, ry: x * 3 + z });
      if (cols) for (let j = 0; j < 2; j++) dBlobE(0.07, 0.06, 0.07, pk(cols), x + (R8() - 0.5) * r, Y + r * 1.6 + R8() * 0.1, z + (R8() - 0.5) * r, { chunky: true });
      colliders.push(noStand({ x0: x - r * 0.8, x1: x + r * 0.8, y0: Y, y1: Y + 0.5, z0: z - r * 0.8, z1: z + r * 0.8 })); }); };
    const hedge = objWrap((x, z, w, h, d, hex, hl = true, nr = false) => {
      dBlobE(w / 2, h * 0.62, d / 2, hex, x, Y + h * 0.38, z, { far: !nr, chunky: true, ry: x, jitter: 0.12 });
      if (hl) dBlobE(w * 0.36, h * 0.3, d * 0.34, 0x8cb85a, x, Y + h * 0.72, z, { far: !nr, chunky: true, ry: z, jitter: 0.12 });
      ellipseCols(x, z, w / 2, d / 2, x, Y, Y + h, 0.86); }, 'bush');
    const arcPts = (rx, rz, t0, t1, n, dx = 0, dz = 0) => { const P = []; for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; P.push([XC + dx + rx * Math.cos(t), ZC + dz + rz * Math.sin(t)]); } return P; };

    patQuad('paveE', PX0, PX1, ZR, ZS, Y + 0.02);
    floor4('paveE', [[PX0, ZS], [PX1, ZS], [PX1S, ZS + 2], [PX0, ZS + 2]], Y + 0.02);
    patQuad('paveE', PX0, PX1S, ZS + 2, ZC, Y + 0.02);
    { const n = 10; for (let k = 0; k < n; k++) { const a = k / n * Math.PI / 2, b = (k + 1) / n * Math.PI / 2;
      floor4('paveE', [[XC + RI * Math.cos(a), ZC + RI * Math.sin(a)], [XC + ROX * Math.cos(a), ZC + ROZ * Math.sin(a)], [XC + ROX * Math.cos(b), ZC + ROZ * Math.sin(b)], [XC + RI * Math.cos(b), ZC + RI * Math.sin(b)]], Y + 0.02); } }
    patQuad('paveE', SX0, XC, SZ0, SZ1, Y + 0.02);

    patQuad('paveE', EF - 1.3, PX0, TR3.fieldZ + 0.2, ZR, Y + 0.02);
    dBoxE(PX1 - EF + 1.3, 0.03, 0.3, 0x5b5e62, (EF - 1.3 + PX1) / 2, Y, ZR + 0.15, { flat: true });

    [[ZR + 0.3, -2.01], [-2.01, ZS], [ZS, 33.99], [33.99, ZC]].forEach(([a, b]) => dBoxE(0.12, 0.04, b - a, 0xd4cdb9, PX0 + 0.06, Y, (a + b) / 2));
    { const P = arcPts(RI + 0.07, RI + 0.07, 0, Math.PI / 2, 10); for (let k = 0; k + 1 < P.length; k++) slabE(P[k][0], P[k][1], P[k + 1][0], P[k + 1][1], 0.14, 0.035, 0xd4cdb9, Y); }
    dBoxE(31.0 - SX0 - 0.3, 0.03, 0.3, 0x3e4145, (SX0 + 0.3 + 31.0) / 2, Y, SZ0 - 0.15, { flat: true });

    { const TXc = (PX0 + PX1) / 2 - 0.1, a = Math.atan2(YARD - FIELD, ZR - BZ), L = Math.hypot(ZR - BZ, YARD - FIELD);
      patQuad('tactZ', TXc - 0.15, TXc + 0.15, (SCHOOL.frontYard.walkN + SCHOOL.frontYard.walkS) / 2 + 0.15, BZ, YARD + 0.03);
      slope('tactZ', 'z', TXc - 0.15, TXc + 0.15, BZ, ZR, YARD + 0.012, FIELD + 0.012, 0);
      [[TXc - 0.65, 0.95], [TXc + 0.65, 0.95]].forEach(([mx, mw]) => { _dm.compose(_dv.set(mx, (YARD + FIELD) / 2 + 0.014, (BZ + ZR) / 2), _dq.setFromEuler(_de.set(a, 0, 0)), _ds.set(mw, 0.02, L - 0.3)); dGeo(box_, _dm, 0x55544c, { flat: true, far: true, at: [40, -8] }); });
      dBoxE(1.2, 0.03, 0.9, 0x6a6a64, TXc + 0.65, Y + 0.005, ZR + 0.75, { flat: true }); }
    objScope('cone', () => { const cx9 = EF - 0.55, cz9 = TR3.fieldZ + 2.2;
      dCylE(0.08, 0.26, 0.6, 0xe0602f, cx9, Y + 0.02, cz9, { seg: 10 }); dCylE(0.05, 0.05, 0.18, 0xe0602f, cx9, Y + 0.62, cz9, { seg: 8 });
      dCylE(0.2, 0.2, 0.04, 0xe0602f, cx9, Y + 0.86, cz9, { seg: 8, rot: [Math.PI / 2, 0, 0] });
      sign('주차금지', cx9, Y + 0.86, cz9 - 0.015, Math.PI, 0.1, { bg: '#e0602f', fg: '#ffffff' });
      colliders.push(noStand({ x0: cx9 - 0.26, x1: cx9 + 0.26, y0: Y, y1: Y + 1.0, z0: cz9 - 0.26, z1: cz9 + 0.26 })); });

    { const x = EF, H = 6.0, L = FZ1 - FZ0, C9 = 0.2;
      const panel = (P, U, hex) => { _c.set(hex); for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); } };
      panel([[x, Y, FZ0], [x, Y, FZ1], [x, Y + H, FZ1], [x, Y + H, FZ0]], [[0, 0], [L / C9, 0], [L / C9, H / C9], [0, H / C9]], 0xa9b3a5);
      panel([[x + 0.02, Y, FZ0], [x + 0.02, Y, FZ1], [x + 0.02, Y + H, FZ1], [x + 0.02, Y + H, FZ0]], [[0.5, 0.5], [0.5 + L / 0.14, 0.5], [0.5 + L / 0.14, 0.5 + H / 0.14], [0.5, 0.5 + H / 0.14]], 0x9aa596);
      panel([[x - 0.05, Y + 4.6, FZ0 + 0.2], [x - 0.05, Y + 3.4, 12], [x - 0.3, Y + 4.4, 18.5], [x - 0.3, Y + 5.2, FZ0 + 0.2]], [[0, 0], [8.8 / 0.35, 0], [15.3 / 0.35, 1.2 / 0.35], [0, 0.6 / 0.35]], 0x3fa58a);
      const n = Math.round(L / 3);
      for (let i = 0; i <= n; i++) { const z9 = FZ0 + L * i / n;
        dRodE(x, Y, z9, x, Y + H + 0.05, z9, 0.05, G9, F9); post(x, z9, Y, Y + H);
        if (i % 3 === 1) { dRodE(x, Y, z9 + 0.45, x, Y + H, z9 + 0.45, 0.045, G9, F9); [1.5, 3.0, 4.5].forEach(h => dRodE(x, Y + h, z9, x, Y + h, z9 + 0.45, 0.035, G9)); } }
      for (let k = 0; k < Math.ceil(L / 8); k++) { const za = FZ0 + L * k / Math.ceil(L / 8), zb = FZ0 + L * (k + 1) / Math.ceil(L / 8); dRodE(x, Y + H, za, x, Y + H, zb, 0.035, G9, F9); dRodE(x, Y + 0.15, za, x, Y + 0.15, zb, 0.025, G9); }
      colliders.push({ x0: x - 0.12, x1: x + 0.12, y0: Y, y1: Y + H + 0.3, z0: FZ0 - 0.12, z1: FZ1 + 0.12, nc: true });
      [21, 24, 27, 30].forEach(z9 => { const px = PX1S + 0.3;
        dRodE(px, Y, z9, px, Y + 4.7, z9, 0.045, G9, F9); post(px, z9, Y, Y + 3.0, 0.06);
        [3.2, 4.6].forEach(h => dRodE(x, Y + h, z9, px, Y + h, z9, 0.04, G9)); }); }

    [[ZR, -2.01], [-2.01, ZS]].forEach(([a, b]) => { dBoxE(0.35, 0.03, b - a, 0x6b6e70, PX1 + 0.175, Y, (a + b) / 2, { flat: true }); dBoxE(0.12, 0.1, b - a, 0xd4cdb9, PX1 + 0.41, Y, (a + b) / 2); });
    let rz1 = ZR;
    for (let z9 = ZR + 0.45; z9 < ZS - 0.2; z9 += 0.78 + R8() * 0.25) {
      const sx = 0.36 + R8() * 0.14, sy = 0.3 + R8() * 0.2, sz = 0.42 + R8() * 0.18; rz1 = z9 + sz + 0.35;
      dBlobE(sx, sy, sz, pk([0xd3d0c7, 0xc3c0b6, 0xdedbd2, 0xa9a69c]), PX1 + 0.85 + (R8() - 0.5) * 0.12, Y + sy * 0.45, z9, { chunky: true, jitter: 0.18, ry: z9 * 2.3 });
      if (R8() > 0.45) dBlobE(sx * 0.8, sy * 0.9, sz * 0.8, pk([0xd3d0c7, 0xdedbd2, 0xb4b1a8]), PX1 + 1.45, Y + sy * 0.7, z9 + 0.3, { chunky: true, jitter: 0.18, ry: z9 * 1.7 });
    }
    barrier(PX1 + 0.5, ZR + 0.1, PX1 + 0.5, rz1, Y, 0.0); colliders[colliders.length - 1].x1 = PX1 + 1.6;
    { const MC9 = [0x6a9444, 0x5f8a3e, 0x74a04c];
      for (let z9 = ZR + 0.9, k = 0; z9 < ZS - 0.5; z9 += 1.75, k++) hedge(PX1 + 2.45 + (k % 2) * 0.25, z9, 1.5 + (k % 3) * 0.2, 0.9 + (k % 2) * 0.2, 1.4, MC9[k % 3], k % 2 === 0, z9 >= -2);
      for (let z9 = ZR + 2.2, k = 0; z9 < ZS - 1; z9 += 3.4, k++) hedge(PX1 + 4.2, z9, 1.8, 1.05, 1.6, MC9[(k + 1) % 3], false, z9 >= -2); }
    [[PX1 + 5.6, -6.5, 1.15], [PX1 + 6.2, 1.0, 1.25], [PX1 + 5.4, 8.0, 1.05]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true));
    { const lx9 = PX1 + 3.0, lz9 = 4.8;
      post(lx9, lz9, Y, Y + 5.6, 0.1); dCylE(0.05, 0.09, 5.6, 0x9aa0a6, lx9, Y, lz9, F9);
      _dm.compose(_dv.set(lx9 + 0.05, Y + 5.75, lz9), _dq.setFromEuler(_de.set(0, 0, 0.5)), _ds.set(0.9, 0.04, 0.6)); dGeo(box_, _dm, 0x2b3f6b, F9);
      dRodE(lx9, Y + 5.2, lz9, lx9 - 0.7, Y + 5.35, lz9, 0.03, 0x9aa0a6, F9); dBoxE(0.45, 0.07, 0.18, 0xd9dde0, lx9 - 0.85, Y + 5.3, lz9, F9); lamp(0.36, 0.03, 0.12, lx9 - 0.85, Y + 5.27, lz9); }
    { const qx = PX1 + 1.2, qz = -1.0;
      dBoxE(0.06, 1.2, 0.06, 0x3a3d44, qx, Y, qz); dBoxE(0.04, 0.35, 0.5, 0x3a3d44, qx, Y + 1.2, qz); post(qx, qz, Y, Y + 1.6, 0.06); }
    { const ux = 49.75, uz = 16.4;
      post(ux, uz, Y, Y + 11, 0.2); dCylE(0.13, 0.19, 10.5, 0xb8b4aa, ux, Y, uz, { far: true, seg: 8 });
      dBoxE(1.8, 0.12, 0.12, 0x8a8f92, ux, Y + 9.6, uz, F9); dBoxE(1.4, 0.1, 0.1, 0x8a8f92, ux, Y + 8.9, uz, F9);
      [-0.33, 0.33].forEach(o => dCylE(0.22, 0.22, 0.75, 0x9aa0a6, ux, Y + 7.4, uz + o, { far: true, seg: 8 })); }

    const KZ0 = SCHOOL.sink[1] - 1.8, KZ1 = SCHOOL.sink[1] + 1.8, LX = PX1S + 0.07, WX = PX1S + 0.7, EWX = 49.0;
    logLine([[PX1 + 0.07, ZS, -1], [LX, ZS + 2, -1], [LX, KZ0, -1]]);
    logLine([[LX, KZ1, -1], [LX, ZC, -1]]);
    wireLine([[PX1 + 0.5, ZS + 0.3], [WX, ZS + 2.2], [WX, KZ0 - 0.2]]); wireLine([[WX, KZ1 + 0.2], [WX, ZC - 0.2]]);
    wireLine([[LX, ZS + 2.2], [WX, ZS + 2.2]], 0.3); wireLine([[LX, KZ0], [WX, KZ0]], 0.3); wireLine([[LX, KZ1], [WX, KZ1]], 0.3);
    plants(LX + 0.2, ZS + 2.4, WX - 0.2, KZ0 - 0.2, 14, [0xd9485a, 0xf2b632, 0xe9e2f0], 0.2);
    plants(WX + 0.5, ZS + 1.0, PX1S + 4.6, KZ0 - 0.4, 26, [0xd9485a, 0xf2b632, 0xf07aa0]);
    plants(WX + 0.5, KZ1 + 0.4, PX1S + 3.2, ZC - 0.5, 8, [0xf2b632, 0xd9485a]);
    [[WX + 0.3, 16.5], [WX + 0.3, 22.5], [WX + 0.3, 26.0]].forEach(([x9, z9]) => { dBoxE(0.03, 0.35, 0.03, 0xe8e8e4, x9, Y, z9); dBoxE(0.03, 0.1, 0.16, 0xf4f4f0, x9 + 0.012, Y + 0.3, z9); colliders.push(noStand({ x0: x9 - 0.05, x1: x9 + 0.05, y0: Y, y1: Y + 0.4, z0: z9 - 0.1, z1: z9 + 0.1 })); });
    sign('4학년', PX1S + 0.5, Y + 0.45, KZ0 - 0.35, -Math.PI / 2, 0.1, { bg: '#2a2c30', fg: '#ffffff' }); dBoxE(0.03, 0.4, 0.03, 0x2a2c30, PX1S + 0.53, Y, KZ0 - 0.35);
    [[PX1S + 4.2, 24.5, 1.1]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true));
    hedge(PX1S + 2.2, 19.8, 1.4, 0.9, 1.3, 0x5f8a3e);

    patQuad('grass', LX + 0.08, EWX - 0.15, ZS + 2, ZC, Y + 0.005, false, 0x8ea76f);
    plants(WX + 0.6, ZS + 2.6, EWX - 0.6, KZ0 - 0.6, 16, [0xf4f4ee, 0xe9e2f0], 0.5);
    plants(WX + 0.9, KZ1 + 1.8, EWX - 0.6, ZC - 0.6, 6, null, 0.5);

    { const [kx9, kz9] = SCHOOL.sink, SS = 0xc8cdd2;
      dBoxE(45.85 - LX - 0.07, 0.05, KZ1 - KZ0, 0xc4c0b5, (LX + 0.07 + 45.85) / 2, Y, kz9, { collide: true });
      [PX1S + 0.35, 45.55].forEach(x9 => [kz9 - 1.6, kz9, kz9 + 1.6].forEach(z9 => { dRodE(x9, Y + 0.05, z9, x9, Y + 2.45, z9, 0.045, SS, F9); post(x9, z9, Y, Y + 2.4, 0.06); }));
      const RW = (45.55 - PX1S - 0.35) / 2 + 0.12, xm = (PX1S + 0.35 + 45.55) / 2;
      [[1, 1], [-1, 0.985]].forEach(([sz9, r9]) => { const g = new THREE.CylinderGeometry(RW * r9, RW * r9, 3.6, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
        dGeo(g, new THREE.Matrix4().compose(new THREE.Vector3(xm, Y + 2.45, kz9), new THREE.Quaternion(), new THREE.Vector3(1, 0.42, sz9)), 0x5a4a66, F9); g.dispose(); });
      [PX1S + 0.35, 45.55].forEach(x9 => dRodE(x9, Y + 2.45, kz9 - 1.8, x9, Y + 2.45, kz9 + 1.8, 0.035, SS, F9));
      const bx = kx9 + 0.45;
      addBox(0.3, 1.0, 2.2, 0xb9bdc0, bx, Y + 0.05, kz9, NS);
      dBoxE(0.6, 0.6, 2.2, 0xaeb3b6, bx - 0.45, Y + 0.05, kz9);
      dBoxE(0.5, 0.03, 2.1, 0x6f7478, bx - 0.45, Y + 0.64, kz9);
      for (let i = 0; i < 5; i++) dRodE(bx - 0.15, Y + 0.95, kz9 - 0.8 + i * 0.4, bx - 0.3, Y + 0.93, kz9 - 0.8 + i * 0.4, 0.018, 0xd8dcdf);
      colliders.push(noStand({ x0: bx - 0.75, x1: bx + 0.15, y0: Y, y1: Y + 1.05, z0: kz9 - 1.1, z1: kz9 + 1.1 }));
      [[bx - 0.8, kz9 - 1.2, bx - 1.3, kz9 - 1.6], [bx - 1.3, kz9 - 1.6, bx - 1.9, kz9 - 1.1], [bx - 1.9, kz9 - 1.1, PX1S - 0.2, kz9 - 2.1]].forEach(([a, b, c, d]) => dRodE(a, Y + 0.07, b, c, Y + 0.07, d, 0.018, 0x1e1f22));
      hotspots.push({ kind: 'wash', x: bx - 1.1, z: kz9, y: Y, r: 1.2, label: '손 씻기', ats: [0, 1, 2, 3, 4].map(i => [bx - 0.31, Y + 0.92, kz9 - 0.8 + i * 0.4, Y + 0.66]) });
      zones.push({ x0: PX1S, x1: 45.85, z0: KZ0, z1: KZ1, y: Y, label: '개수대' }); }

    objScope('tree', () => { const jx = EF - 0.4, jz = FZ1 + 1.3;
      colliders.push({ x0: jx - 1.0, x1: jx + 1.0, y0: Y, y1: Y + 12, z0: jz - 1.0, z1: jz + 1.0 });
      [[1.25, 1.2, 0x2f4a33], [1.6, 2.55, 0x35553a], [1.45, 3.8, 0x2f4a33], [1.1, 5.0, 0x3a5c3e], [0.7, 6.0, 0x35553a]].forEach(([r, h, c], k) => dBlobE(r, 0.95, r, c, jx + (k % 2) * 0.1, Y + h, jz, { far: true, chunky: true, jitter: 0.12, ry: k }));
      dBlobE(1.2, 0.11, 1.15, 0x3f6a3a, jx + 0.1, Y, jz + 0.1, { chunky: true, jitter: 0.15 }); });

    { const LA = arcPts(ROX + 0.07, ROZ + 0.07, 0, Math.PI / 2, 12).map(([x, z]) => [x, z, -1]), WA = arcPts(ROX + 0.7, ROZ + 0.7, 0.05, Math.PI / 2 - 0.02, 12);
      logLine(LA);
      wireLine([[WX, ZC - 0.2], ...WA]);
      wireLine([WA[WA.length - 1], LA[LA.length - 1]], 0.5);
      [[0.2, 0.9], [0.55, 0.9], [0.9, 0.9], [1.25, 0.9]].forEach(([t, d]) => { const x = XC + (ROX + 0.35 + d * 0.2) * Math.cos(t), z = ZC + (ROZ + 0.35 + d * 0.2) * Math.sin(t);
        dBlobE(0.3, 0.32, 0.3, 0x5f8f45, x, Y + 0.25, z, { chunky: true, jitter: 0.15 }); [0xd9485a, 0xf2b632, 0xe06a8a].forEach((c, j) => dBlobE(0.08, 0.07, 0.08, c, x + (j - 1) * 0.15, Y + 0.55, z + (j % 2) * 0.1, { chunky: true })); });
      for (let z9 = KZ1 + 0.9, k = 0; z9 < ZC + 1.6; z9 += 1.25, k++) hedge(PX1S + 2.15 + (z9 > ZC ? (z9 - ZC) * 0.35 : 0), z9, 1.7, 1.35 + (k % 2) * 0.1, 1.7, [0x4f7a3c, 0x557f40][k % 2]);
      [[PX1S + 1.6, ZC + 3.4, 2.8, 1.8, 2.4], [PX1S - 1.4, SZ1 + 2.3, 2.6, 1.6, 2.2]].forEach(([x9, z9, w, h, d], k) => hedge(x9, z9, w, h, d, [0x4f7a3c, 0x557f40, 0x4a7338][k % 3]));
      [[PX1S + 5.0, 41.0, 1.2], [PX1S + 5.3, 36.0, 1.15]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true)); }

    { const QX0 = 31.0, QZ0 = 30.6;
      patQuad('paveE', QX0, EF - 0.15, QZ0, FZ1 + 0.2, Y + 0.02);
      patQuad('paveE', QX0, PX0, FZ1 + 0.2, ZC, Y + 0.02);
      { const n = 10, cx9 = QX0; for (let k = 0; k < n; k++) { const a = k / n * Math.PI / 2, b = (k + 1) / n * Math.PI / 2;
        const A = [XC + RI * Math.cos(a), ZC + RI * Math.sin(a)], B9 = [XC + RI * Math.cos(b), ZC + RI * Math.sin(b)];
        floor4('paveE', [[cx9, A[1]], A, B9, [cx9, B9[1]]], Y + 0.02); } }

      const IB = arcPts(RI - 1.1, RI - 1.1, 0.25, 1.3, 6), IO = arcPts(RI - 0.25, RI - 0.25, 0.25, 1.3, 6);
      wireLine(IB); wireLine(IO, 1.8); wireLine([IB[0], IO[0]], 0.4); wireLine([IB[6], IO[6]], 0.4);
      for (let k = 0; k < 9; k++) { const t = 0.32 + k * 0.11 + (R8() - 0.5) * 0.06, r = RI - 0.45 - R8() * 0.45, x = XC + r * Math.cos(t), z = ZC + r * Math.sin(t), q = 0.16 + R8() * 0.12;
        dBlobE(q, q * 0.9, q, pk([0x5a8a40, 0x4f7f3a, 0x62924a]), x, Y + q * 0.7, z, { jitter: 0.15, ry: k }); for (let j = 0; j < 3; j++) dBlobE(0.06, 0.05, 0.06, pk([0xf2a82a, 0xf5c030, 0xe8902a]), x + (R8() - 0.5) * q * 1.4, Y + q * 1.45, z + (R8() - 0.5) * q * 1.4, { chunky: true }); }

      const arcBench = (cx, cz, r, t0, t1, n) => objScope('bench', () => { for (let k = 0; k < n; k++) { const a = t0 + (t1 - t0) * k / n, b = t0 + (t1 - t0) * (k + 1) / n;
        const ax = cx + r * Math.cos(a), az = cz + r * Math.sin(a), bx = cx + r * Math.cos(b), bz = cz + r * Math.sin(b);
        slabE(ax, az, bx, bz, 0.42, 0.42, 0x8d8f8c, Y + 0.02); slabE(ax, az, bx, bz, 0.46, 0.05, 0x9a9c99, Y + 0.44);
        for (let h9 = 0; h9 < 2; h9++) { const px = ax + (bx - ax) * h9 / 2, pz = az + (bz - az) * h9 / 2, qx = ax + (bx - ax) * (h9 + 1) / 2, qz = az + (bz - az) * (h9 + 1) / 2;
          colliders.push({ x0: Math.min(px, qx) - 0.1, x1: Math.max(px, qx) + 0.1, y0: Y, y1: Y + 0.49, z0: Math.min(pz, qz) - 0.1, z1: Math.max(pz, qz) + 0.1 }); } } });
      const [tx9, tz9] = SCHOOL.bigTree;
      arcBench(tx9, tz9, 1.9, 0.5, 2.3, 5);
      arcBench(33.6, 33.6, 1.7, -0.3, 1.2, 4);
      hotspots.push({ kind: 'sit', x: tx9 + 1.9 * Math.cos(1.4), z: tz9 + 1.9 * Math.sin(1.4) + 0.45, y: Y, r: 0.9, label: '큰 나무 벤치에 앉기', yaw: Math.PI });

      { const [ax, az] = [33.6 + 1.7 * Math.cos(0.1), 33.6 + 1.7 * Math.sin(0.1)];
        objScope('statue', () => { dBoxE(0.34, 0.5, 0.34, 0xa38456, ax, Y + 0.49, az); dBoxE(0.46, 0.08, 0.46, 0x8a6b48, ax, Y + 0.99, az); dBoxE(0.26, 0.42, 0.26, 0xa38456, ax, Y + 1.07, az); dBoxE(0.4, 0.08, 0.4, 0x8a6b48, ax, Y + 1.49, az); dBoxE(0.16, 0.22, 0.16, 0xa38456, ax, Y + 1.57, az);
        colliders.push(noStand({ x0: ax - 0.25, x1: ax + 0.25, y0: Y + 0.49, y1: Y + 1.8, z0: az - 0.25, z1: az + 0.25 })); });
        const [hx, hz] = [33.6 + 1.7 * Math.cos(0.9), 33.6 + 1.7 * Math.sin(0.9)];
        objScope('statue', () => { dBoxE(0.4, 0.3, 0.3, 0xb08e60, hx, Y + 0.49, hz); dCylE(0, 0.3, 0.22, 0x8a6b48, hx, Y + 0.79, hz, { seg: 4, rot: [0, Math.PI / 4, 0] });
        colliders.push(noStand({ x0: hx - 0.22, x1: hx + 0.22, y0: Y + 0.49, y1: Y + 1.1, z0: hz - 0.2, z1: hz + 0.2 })); }); }
      { const bx9 = 35.4, bz9 = 32.2;
        objScope('bench', () => {
        for (let k = 0; k < 4; k++) dBoxE(0.09, 0.04, 1.6, 0x6d5236, bx9 - 0.15 + k * 0.11, Y + 0.44, bz9);
        for (let k = 0; k < 3; k++) dBoxE(0.04, 0.09, 1.6, 0x6d5236, bx9 + 0.3, Y + 0.6 + k * 0.13, bz9);
        [-0.7, 0.7].forEach(o => { dBoxE(0.5, 0.44, 0.06, 0x2a2c30, bx9 + 0.05, Y + 0.02, bz9 + o); dBoxE(0.06, 0.5, 0.06, 0x2a2c30, bx9 + 0.3, Y + 0.46, bz9 + o); });
        colliders.push(noStand({ x0: bx9 - 0.22, x1: bx9 + 0.36, y0: Y, y1: Y + 0.95, z0: bz9 - 0.82, z1: bz9 + 0.82 })); });
        hotspots.push({ kind: 'sit', x: bx9 - 0.55, z: bz9, y: Y, r: 0.9, label: '벤치에 앉기', yaw: Math.PI / 2, seat: { x: bx9 + 0.05, y: Y + 0.48 - 0.46, z: bz9, yaw: -Math.PI / 2 } }); }
      objScope('bench', () => { const px9 = 33.2, pz9 = 30.9;
        dBoxE(3.0, 0.08, 0.6, 0x7a6a55, px9, Y + 0.34, pz9); [-1.3, 1.3].forEach(o => dBoxE(0.12, 0.34, 0.5, 0x5e5042, px9 + o, Y, pz9));
        colliders.push({ x0: px9 - 1.5, x1: px9 + 1.5, y0: Y, y1: Y + 0.42, z0: pz9 - 0.3, z1: pz9 + 0.3 }); });
    }

    objScope('tree', () => { const [tx, tz] = SCHOOL.bigTree, BK = 0x5a4a3c;
      colliders.push({ x0: tx - 0.55, x1: tx + 0.55, y0: Y, y1: Y + 12, z0: tz - 0.55, z1: tz + 0.55 });
      dCylE(0.42, 0.62, 6.2, BK, tx, Y, tz, { far: true, seg: 9 });
      dCylE(0.6, 0.85, 0.5, BK, tx, Y, tz, { far: true, seg: 9 });
      [[0.4, 0.55], [2.5, 0.5], [4.4, 0.6], [5.6, 0.45]].forEach(([a, t]) => dCylE(0.14, 0.26, 3.6, BK, tx + Math.cos(a) * 0.2, Y + 5.2, tz + Math.sin(a) * 0.2, { far: true, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] }));
      dBlobE(6.6, 5.0, 6.6, 0x4a6e42, tx, Y + 11.4, tz, { far: true, chunky: true, jitter: 0.12 });
      [[0, 4.4, 9.8, 4.3], [1.05, 4.8, 9.0, 4.1], [2.1, 4.5, 10.8, 4.5], [3.15, 4.7, 9.4, 4.0], [4.2, 4.6, 10.4, 4.4], [5.25, 4.8, 9.2, 4.2]].forEach(([a, d, h, r], k) =>
        dBlobE(r, r * 0.88, r, [0x507647, 0x44683e, 0x5a7f4e][k % 3], tx + Math.cos(a) * d, Y + h, tz + Math.sin(a) * d, { far: true, chunky: true, jitter: 0.14, ry: a }));
      dBlobE(4.0, 3.0, 4.0, 0x5a804e, tx + 0.5, Y + 15.4, tz - 0.4, { far: true, chunky: true, jitter: 0.14 }); });

    [[34.4, 3.5, 1], [34.4, 26.6, -1]].forEach(([hx, hz, dir]) => objScope('goal', () => { const pz = hz - dir * 0.95, S9 = 0xb9bdc0;
      post(hx, pz, Y, Y + 3.4, 0.12); dCylE(0.07, 0.09, 3.3, S9, hx, Y, pz, { far: true, seg: 8 });
      dRodE(hx, Y + 3.1, pz, hx, Y + 3.3, hz - dir * 0.08, 0.05, S9, F9); dRodE(hx, Y + 2.6, pz, hx, Y + 3.0, hz - dir * 0.08, 0.04, S9, F9);
      dBoxE(1.8, 1.05, 0.04, 0xdfe7ea, hx, Y + 2.85, hz, F9);
      [0.01, 1.0].forEach(y9 => dBoxE(1.76, 0.04, 0.05, 0x9aa0a6, hx, Y + 2.85 + y9, hz, F9));
      [-0.9, 0.9].forEach(o => dBoxE(0.04, 1.04, 0.06, 0x9aa0a6, hx + o, Y + 2.855, hz, F9));
      dGeo(new THREE.TorusGeometry(0.23, 0.02, 5, 14).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(hx, Y + 3.05, hz + dir * 0.28), 0xc4622d, F9); }));

    { const BN = SCHOOL.bballSand, NX = BN.x, NZ1 = BN.z[1];

      const ST9 = 0xf4efe6, SZ9 = TR3.fieldZ + 0.62;
      patQuad('sand', NX, EF - 1.3, SZ9, ZR, Y + 0.01, false, ST9);
      patQuad('sand', NX, EF, ZR, 30.6, Y + 0.01, false, ST9);
      patQuad('sand', NX, 31.0, 30.6, NZ1, Y + 0.01, false, ST9);
      zones.push({ x0: NX, x1: EF, z0: TR3.fieldZ, z1: SCHOOL.southFenceZ, y: Y, label: '농구장' }); }

    { const EZ1 = 45 + (60 - EWX) / (60 - 21.1) * (55.5 - 45) - 0.08;
      const wf = (x0, z0, x1, z1, e0) => { const L = Math.hypot(x1 - x0, z1 - z0), H = 1.3, P = [[x0, Y, z0], [x1, Y, z1], [x1, Y + H, z1], [x0, Y + H, z0]], U = [[0, 0], [L / 0.6, 0], [L / 0.6, H / 0.6], [0, H / 0.6]];
        _c.set(0xf6f6f2); for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); }
        const n = Math.max(1, Math.round(L / 2.5)), at = z => ({ at: [40, z < 12 ? 8 : z < 34 ? 20 : 36] });
        for (let i = e0 ? 0 : 1; i <= n; i++) { const px = x0 + (x1 - x0) * i / n, pz = z0 + (z1 - z0) * i / n; dBox(0.08, H - 0.19, 0.08, 0xeeeeea, px, Y + 0.25, pz, at(pz)); }
        for (let k = 0; k < n; k++) { const za = z0 + (z1 - z0) * k / n; dRod(x0 + (x1 - x0) * k / n, Y + H, za, x0 + (x1 - x0) * (k + 1) / n, Y + H, z0 + (z1 - z0) * (k + 1) / n, 0.025, 0xeeeeea, at(za)); } };
      wf(59.85, 8.0, EWX, 14.0, true);
      { const n = Math.ceil(Math.hypot(59.85 - EWX, 6) / 0.3); for (let i = 0; i < n; i++) { const ax = 59.85 + (EWX - 59.85) * i / n, az = 8 + 6 * i / n, bx = 59.85 + (EWX - 59.85) * (i + 1) / n, bz = 8 + 6 * (i + 1) / n;
        colliders.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, y0: Y, y1: Y + 4.5, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, nc: true }); } }
      wf(EWX, 14.0, EWX, EZ1, false); colliders.push({ x0: EWX - 0.12, x1: EWX + 0.12, y0: Y, y1: Y + 4.5, z0: 14.0, z1: EZ1 + 0.12, nc: true });
      slab(59.85, 8.0, EWX, 14.0, 0.22, 0.25, 0xbdb9b0, Y, { far: true }); dBox(0.22, 0.25, EZ1 - 14.0, 0xbdb9b0, EWX, Y, (14.0 + EZ1) / 2, { far: true });
      patQuad('grass', EWX + 0.15, 59.85, 14.2, 45.0, Y + 0.004, false, 0xc9d8a8); }

    { const NC = FY.walkN - 0.12, SC = FY.walkS + 0.12;
      patQuad('grass', WX1 + 3, 62, fz1 - 10, NC, YARD + 0.012, false, 0xe9f2df);
      patQuad('grass', WX1, 62, NC, SC, YARD + 0.012, false, 0xe9f2df);
      patQuad('grass', 60, 62, SC, TERR_Z, YARD + 0.012, false, 0xe2eed6);
      pine(56.8, -27.5, 1.8);

      [[57.7, -21.0, 1.05], [58.4, -16.5, 0.95], [57.5, -6.5, 1.1], [58.4, 0.5, 1.0], [57.6, 6.0, 0.95]].forEach(([x9, z9, s9]) => objScope('tree', () => { const y9 = tY(z9, x9), h9 = hash2(x9, z9), N9 = { at: [56, -8] };
        colliders.push({ x0: x9 - 0.19 * s9, x1: x9 + 0.19 * s9, y0: y9, y1: y9 + 12, z0: z9 - 0.19 * s9, z1: z9 + 0.19 * s9 });
        dCyl(0.14 * s9, 0.22 * s9, 2.6 * s9, 0x6d4e32, x9, y9, z9, { ...N9, seg: 5 });
        dBlob(1.7 * s9, 1.4 * s9, 1.7 * s9, [0x3f7a3f, 0x4d8b4d, 0x467f44][Math.floor(h9 * 3) % 3], x9, y9 + 3.2 * s9, z9, { ...N9, chunky: true, ry: h9 * 6, jitter: 0.14 });
        dBlob(1.15 * s9, 0.95 * s9, 1.15 * s9, 0x5c9a4f, x9 - 0.4 * s9, y9 + 4.1 * s9, z9 + 0.3 * s9, { ...N9, chunky: true, ry: h9 * 9, jitter: 0.14 }); }));

      floor4('asph', [[60.5, 12], [65, 12], [65, 46.4], [60.5, 46.4]], Y + 0.01);
      floor4('asph', [[60.5, 12], [74.5, -1.67], [77.5, 1.67], [65, 12]], Y + 0.01);
      floor4('asph', [[74.5, -1.67], [90.6, -14.75], [93.4, -11.25], [77.5, 1.67]], Y + 0.01);
      slab(60.45, 12.3, 60.45, 46.3, 0.15, 0.12, 0xe8e8e2, Y, { far: true });

      objScope('cone', () => { const cx9 = 17.9, cz9 = 40.7; dCyl(0.08, 0.26, 0.6, 0xe0602f, cx9, Y + 0.02, cz9, { seg: 10, at: [40, 36] }); dCyl(0.05, 0.05, 0.18, 0xe0602f, cx9, Y + 0.62, cz9, { seg: 8, at: [40, 36] });
        dCyl(0.2, 0.2, 0.04, 0xe0602f, cx9, Y + 0.86, cz9, { seg: 8, rot: [Math.PI / 2, 0, 0], at: [40, 36] }); sign('주차금지', cx9, Y + 0.86, cz9 - 0.015, Math.PI, 0.1, { bg: '#e0602f', fg: '#ffffff' });
        colliders.push(noStand({ x0: cx9 - 0.26, x1: cx9 + 0.26, y0: Y, y1: Y + 1.0, z0: cz9 - 0.26, z1: cz9 + 0.26 })); });
      [[25.8, -24.6], [28.8, -24.6], [37.1, -24.6], [46.6, -24.6]].forEach(([x9, z9]) => { dBox(1.0, 0.8, 0.6, 0xe6e8e4, x9, FH + 0.3, z9, { far: true }); }); }
    zones.push({ x0: PX0, x1: PX1 + 3, z0: TR3.fieldZ, z1: 50, y: FIELD, label: '동쪽 통학로' });
  }
  {

    const FP = SCHOOL.forestPlay, Y = FIELD, DX0 = 27.2, NX0 = 35.8, DX1 = 39.2, DZ0 = 45.6, DZ1 = 49.5, DH = 0.8, T = Y + DH;
    const WD = 0xb09068, RL = 0xc2a27a, PS = 0x9c7b55, ST = 0x9a968c;
    const SW9 = DX0 + 1.0, SM9 = 31.9, SN9 = NX0 - 0.8;

    const NA = o => ({ ...(o || {}), at: [40, 36] });
    const dBoxE = (w, h, d, c, x, y, z, o) => dBox(w, h, d, c, x, y, z, NA(o)), dBlobE = (sx, sy, sz, c, x, y, z, o) => dBlob(sx, sy, sz, c, x, y, z, NA(o)), dRodE = (x0, y0, z0, x1, y1, z1, r, c, o) => dRod(x0, y0, z0, x1, y1, z1, r, c, NA(o));
    const dCylE = (rt, rb, h, c, x, y, z, o) => dCyl(rt, rb, h, c, x, y, z, NA(o));
    const eu9 = new THREE.Euler(0, 0, 0, 'YZX');
    const band = (x0, y0, z0, x1, y1, z1, w, t, c) => {
      const L = Math.hypot(x1 - x0, y1 - y0, z1 - z0), H9 = Math.hypot(x1 - x0, z1 - z0);
      _dm.compose(_dv.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _dq.setFromEuler(eu9.set(0, Math.atan2(-(z1 - z0), x1 - x0), Math.atan2(y1 - y0, H9))), _ds.set(L, t, w)); dGeo(box_, _dm, c, NA()); };

    addBox(NX0 - DX0, DH - 0.15, DZ1 - DZ0, ST, (DX0 + NX0) / 2, Y, (DZ0 + DZ1) / 2);
    addBox(NX0 - DX0 + 0.05, 0.15, DZ1 - DZ0 + 0.05, WD, (DX0 - 0.05 + NX0) / 2, T - 0.15, (DZ0 + DZ1 + 0.05) / 2);
    for (let x9 = DX0 + 0.14; x9 < NX0 - 0.05; x9 += 0.14) dBoxE(0.03, 0.03, DZ1 - DZ0 + 0.04, 0x8f7250, x9, T - 0.015, (DZ0 + DZ1) / 2);
    addBox(DX1 - NX0, DH - 0.45, DZ1 - DZ0, 0x6f6152, (NX0 + DX1) / 2, Y, (DZ0 + DZ1) / 2);
    patQuad('dirt', NX0 + 0.15, DX1 - 0.15, DZ0 + 0.15, DZ1 - 0.15, T - 0.45 + 0.004, false, 0x6a5a48);

    { const R7 = seeded(3171);
      for (let x9 = DX0 + 0.25; x9 < DX1 - 0.2; x9 += 0.55 + R7() * 0.25) { if ([SW9, SM9, SN9].some(s9 => Math.abs(x9 - s9) < 0.85)) continue;
        const s = 0.26 + R7() * 0.14, h9 = 0.3 + R7() * 0.25;
        dBlobE(s * 1.15, h9, s * 0.8, [0xb8b6ae, 0xa9a79f, 0xc4c1b8, 0x9d9a92][Math.floor(R7() * 4) % 4], x9, Y + h9 * 0.35, DZ0 - s * 0.35, { chunky: true, jitter: 0.18, ry: x9 });
        colliders.push(noStand({ x0: x9 - s * 1.0, x1: x9 + s * 1.0, y0: Y, y1: Y + h9 * 1.2, z0: DZ0 - s * 1.05, z1: DZ0 })); } }

    const stair = sx => { const n9 = 4, SL = 0.28 * n9, a9 = Math.atan2(DH, SL);
      for (let k = 1; k <= n9; k++) addBox(1.0, DH * k / n9, 0.28, 0x8c6d4b, sx, Y, DZ0 - 0.14 - 0.28 * (n9 - k));
      [-1, 1].forEach(s => { const x9 = sx + s * 0.535;
        _dm.compose(_dv.set(x9, Y + DH / 2 + 0.02, DZ0 - SL / 2), _dq.setFromEuler(_de.set(-a9, 0, 0)), _ds.set(0.05, 0.22, Math.hypot(SL, DH))); dGeo(box_, _dm, 0x9c7b55, NA());
        dBoxE(0.07, 0.95, 0.07, PS, x9, Y, DZ0 - SL + 0.05);
        dRodE(x9, Y + 0.95, DZ0 - SL + 0.05, x9, T + 0.95, DZ0 - 0.05, 0.03, RL);
        colliders.push(noStand({ x0: x9 - 0.03, x1: x9 + 0.03, y0: Y, y1: T + 1.0, z0: DZ0 - SL - 0.02, z1: DZ0 })); }); };
    [SW9, SM9, SN9].forEach(stair);

    const rail = (x0, z0, x1, z1, e0 = true, e1 = true, dy = 0, tiles = false) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.5)), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
      for (let i = e0 ? 0 : 1; i <= (e1 ? n : n - 1); i++) { const t = i / n; dBoxE(0.09, 1.0, 0.09, PS, x0 + (x1 - x0) * t, T, z0 + (z1 - z0) * t); }
      for (let d = 0.2; d < L - 0.1; d += 0.2) { if (Math.abs(d / L * n - Math.round(d / L * n)) * L / n < 0.1) continue; dBoxE(0.035, 0.52, 0.035, RL, x0 + ux * d, T + 0.06, z0 + uz * d); }
      for (let d = 0.08; d + 0.3 < L - 0.05; d += 0.3) { const ax = x0 + ux * d, az = z0 + uz * d, bx = ax + ux * 0.3, bz = az + uz * 0.3;
        dRodE(ax, T + 0.62, az, bx, T + 0.92, bz, 0.013, RL); dRodE(ax, T + 0.92, az, bx, T + 0.62, bz, 0.013, RL); }
      dBoxE(Math.abs(x1 - x0) + 0.1, 0.06, Math.abs(z1 - z0) + 0.1, RL, (x0 + x1) / 2, T + 0.95 + dy, (z0 + z1) / 2);
      dBoxE(Math.abs(x1 - x0) + 0.04 + (uz ? 0.035 : 0), 0.04, Math.abs(z1 - z0) + 0.04 + (ux ? 0.035 : 0), RL, (x0 + x1) / 2, T + 0.58 + dy, (z0 + z1) / 2);
      if (tiles) for (let d = 0.35; d < L - 0.3; d += 0.62) { const k = Math.round(d / 0.62);
        dBoxE(0.34, 0.3, 0.03, 0xf2f0ea, x0 + ux * d, T + 0.18, z0 - 0.035); dBoxE(0.24, 0.2, 0.03, [0xe8574a, 0xf2c230, 0x4f9fdc, 0x6fbf5a, 0xf08a3a, 0x9a6fd0][k % 6], x0 + ux * d + (k % 2 ? 0.02 : -0.02), T + 0.23, z0 - 0.065); }
      colliders.push(noStand({ x0: Math.min(x0, x1) - 0.06, x1: Math.max(x0, x1) + 0.06, y0: T - 0.12, y1: T + 1.6, z0: Math.min(z0, z1) - 0.06, z1: Math.max(z0, z1) + 0.06 })); };
    const RN = DZ0 + 0.045, RS = DZ1 - 0.045, RW = DX0 + 0.045, RE = DX1 - 0.045;
    rail(RW + 0.1, RN, SW9 - 0.5, RN, false, true); rail(SW9 + 0.5, RN, SM9 - 0.5, RN, true, true, 0, true); rail(SM9 + 0.5, RN, SN9 - 0.5, RN, true, true, 0, true); rail(SN9 + 0.5, RN, RE, RN, true, true);
    rail(RW, RS, RE, RS, true, true);
    rail(RW, RN, RW, RS - 0.1, true, false, 0.01); rail(RE, RN + 0.1, RE, RS - 0.1, false, false, 0.01);

    const TRS = [[29.4, 47.5], [33.4, 47.5]];
    [[DX0 + 0.25, NX0 - 0.15]].forEach(([a, b]) => { const bz9 = DZ1 - 0.1 - 0.2;
      dBoxE(b - a, 0.05, 0.4, RL, (a + b) / 2, T + 0.4, bz9); for (let x9 = a + 0.2; x9 < b; x9 += 1.2) dBoxE(0.08, 0.4, 0.3, PS, x9, T, bz9);
      colliders.push(noStand({ x0: a, x1: b, y0: T, y1: T + 0.45, z0: bz9 - 0.2, z1: bz9 + 0.2 }));
      [28.6, 31.4, 34.6].forEach(x9 => hotspots.push({ kind: 'sit', x: x9, z: bz9 - 0.62, y: T, r: 0.8, label: '데크 벤치에 앉기', yaw: Math.PI, seat: { x: x9, y: T + 0.45 - 0.46, z: bz9 + 0.02, yaw: Math.PI } })); });

    TRS.forEach(([x9, z9], k) => { const h9 = hash2(x9, z9);
      addBox(0.9, 0.45, 0.9, 0x9c7b55, x9, T, z9, NS); dBoxE(0.96, 0.04, 0.96, RL, x9, T + 0.45, z9);
      colliders.push({ x0: x9 - 0.21, x1: x9 + 0.21, y0: Y, y1: Y + 12, z0: z9 - 0.21, z1: z9 + 0.21 });
      dCylE(0.14, 0.2, 4.6, 0x6d5a48, x9, T + 0.49, z9, { seg: 6 });
      [[0, 5.4, 0, 1.9], [0.9, 4.6, 0.4, 1.3], [-0.8, 4.8, -0.3, 1.35], [0.2, 6.3, -0.2, 1.3]].forEach(([ox, oy, oz, r], i) => dBlobE(r, r * 0.8, r, [0x4d8b4d, 0x5c9a4f, 0x3f7a3f][(i + k) % 3], x9 + ox, T + oy, z9 + oz, { chunky: true, ry: h9 * 6 + i, jitter: 0.14 }));

    });

    { const GX0 = NX0, GX1 = DX1 - 0.15, GZ0 = DZ0 + 0.15, GZ1 = DZ1 - 0.15, NY = T - 0.1, NET = 0xc9c8c0;
      dBoxE(DX1 - NX0, 0.15, 0.15, WD, (NX0 + DX1) / 2, T - 0.15, DZ0 + 0.075); dBoxE(DX1 - NX0, 0.15, 0.15, WD, (NX0 + DX1) / 2, T - 0.15, DZ1 - 0.075);
      dBoxE(0.15, 0.15, DZ1 - DZ0 - 0.3, WD, DX1 - 0.075, T - 0.15, (DZ0 + DZ1) / 2);
      [[NX0, DX1, DZ0, DZ0 + 0.15], [NX0, DX1, DZ1 - 0.15, DZ1], [DX1 - 0.15, DX1, DZ0 + 0.15, DZ1 - 0.15]].forEach(([x0, x1, z0, z1]) => colliders.push({ x0, x1, y0: T - 0.45, y1: T, z0, z1 }));
      const sag = (x, z) => 0.07 * Math.sin(Math.PI * (x - GX0) / (GX1 - GX0)) * Math.sin(Math.PI * (z - GZ0) / (GZ1 - GZ0));
      for (let x9 = GX0 + 0.3; x9 < GX1 - 0.1; x9 += 0.3) for (let z9 = GZ0; z9 < GZ1 - 0.01; z9 += (GZ1 - GZ0) / 6) { const z1 = z9 + (GZ1 - GZ0) / 6; dRodE(x9, NY - sag(x9, z9), z9, x9, NY - sag(x9, z1), z1, 0.016, NET); }
      for (let z9 = GZ0 + 0.3; z9 < GZ1 - 0.1; z9 += 0.3) for (let x9 = GX0; x9 < GX1 - 0.01; x9 += (GX1 - GX0) / 6) { const x1 = x9 + (GX1 - GX0) / 6; dRodE(x9, NY - 0.005 - sag(x9, z9), z9, x1, NY - 0.005 - sag(x1, z9), z9, 0.016, NET); }
      colliders.push({ x0: GX0, x1: GX1, y0: T - 0.45, y1: NY - 0.02, z0: GZ0, z1: GZ1 });

      const HZ = (DZ0 + DZ1) / 2 + 0.3, HA = GX0 + 0.35, HB = GX1 - 0.3, HY = T + 1.45, LOW = T + 0.5;
      [HA, HB].forEach(x9 => { dBoxE(0.12, HY + 0.35 - (T - 0.45), 0.12, PS, x9, T - 0.45, HZ); colliders.push({ x0: x9 - 0.08, x1: x9 + 0.08, y0: T - 0.45, y1: HY + 0.35, z0: HZ - 0.08, z1: HZ + 0.08 }); });
      const hp = t => [HA + 0.06 + (HB - HA - 0.12) * t, HY - (HY - LOW) * Math.sin(Math.PI * t)];
      for (let k = 0; k < 8; k++) { const [xa, ya] = hp(k / 8), [xb, yb] = hp((k + 1) / 8), w9 = 0.12 + 0.5 * Math.sin(Math.PI * (k + 0.5) / 8); band(xa, ya, HZ, xb, yb, HZ, w9, 0.03, 0xd23a3a); }
      colliders.push(noStand({ x0: HA + 0.5, x1: HB - 0.5, y0: LOW - 0.05, y1: LOW + 0.1, z0: HZ - 0.3, z1: HZ + 0.3 }));
      hotspots.push({ kind: 'sit', x: (HA + HB) / 2, z: HZ - 0.75, y: NY - 0.02, r: 0.8, label: '해먹에 앉기', yaw: Math.PI, seat: { x: (HA + HB) / 2, y: LOW + 0.05 - 0.46, z: HZ, yaw: Math.PI } }); }
    sign('숲놀이터', SM9 + 2.0, T + 1.25, DZ0 - 0.02, Math.PI, 0.3);
    zones.push({ x0: FP.x[0], x1: FP.x[1], z0: FP.z[0], z1: FP.z[1], y: Y, label: '숲놀이터' });
  }
  {

    const [bx9, bz9] = SCHOOL.bus, F = { far: true }, Y = FIELD, BK = 0x2f3a45, YL = 0xf2c230, CR = 0xe9e4d6;
    const B0 = bx9 - 5.8, B1 = bx9 + 5.8, Z0 = bz9 - 1.25, Z1 = bz9 + 1.25, FL = Y + 1.0, WT = 0.16, DX0 = bx9 - 5.05, DX1 = bx9 - 4.15, SZ = Z0 + 0.9, WY0 = Y + 1.55, WY1 = Y + 2.55, RY = Y + 3.05;
    const bb = (x0, x1, y0, y1, z0, z1, hex, o = F) => dBox(x1 - x0, y1 - y0, z1 - z0, hex, (x0 + x1) / 2, y0, (z0 + z1) / 2, o);
    const cc = (x0, x1, y0, y1, z0, z1, ns) => colliders.push(ns ? noStand({ x0, x1, y0, y1, z0, z1 }) : { x0, x1, y0, y1, z0, z1 });

    for (const [x0, x1, z0, z1] of [[B0, DX0, Z0, Z1], [DX1, B1, Z0, Z1], [DX0, DX1, SZ, Z1]]) {
      bb(x0, x1, Y + 0.15, Y + 0.35, z0 + (z0 === Z0 ? 0.02 : 0), z1 - 0.02, 0x3a3d44); bb(x0, x1, Y + 0.35, FL - 0.03, z0, z1, YL); bb(x0, x1, FL - 0.03, FL, z0, z1, 0x6b7078); cc(x0, x1, Y, FL, z0, z1); }
    [[Y + 0.25, 0], [Y + 0.5, 0.3], [Y + 0.75, 0.6]].forEach(([top, o]) => { bb(DX0, DX1, Y, top, Z0 + o, Z0 + o + 0.3, 0x4a4f57, {}); cc(DX0, DX1, Y, top, Z0 + o, Z0 + o + 0.3); });

    const side = (z0, z1, zc, door) => {
      for (const [x0, x1] of door ? [[B0, DX0], [DX1, B1]] : [[B0, B1]]) { bb(x0, x1, FL, WY0, z0, z1, YL); cc(x0, x1, FL, RY, z0, z1); }
      if (door) cc(DX0, DX1, WY1, RY, z0, z1);
      bb(B0, B1, WY1, RY, z0, z1, YL);
      const runs = door ? [[B0 + WT, DX0], [DX1, B1 - WT]] : [[B0 + WT, B1 - WT]];
      for (const [x0, x1] of runs) { glassPane('x', x1 - x0, WY1 - WY0, (x0 + x1) / 2, WY0, zc);
        const n = Math.max(1, Math.round((x1 - x0) / 1.15)); for (let k = 1; k < n; k++) dBox(0.08, WY1 - WY0, 0.2, BK, x0 + (x1 - x0) * k / n, WY0, zc); }
      [DX0, DX1].forEach(x9 => { if (door) dBox(0.06, WY1 - (Y + 0.25), 0.2, BK, x9 + (x9 === DX0 ? -0.04 : 0.04), Y + 0.25, zc); });
    };
    side(Z0, Z0 + WT, Z0 + WT / 2, true); side(Z1 - WT, Z1, Z1 - WT / 2, false);

    [[B0, B0 + WT, Y + 1.45, Y + 2.75], [B1 - WT, B1, Y + 2.0, Y + 2.8]].forEach(([x0, x1, g0, g1]) => {
      bb(x0, x1, FL, g0, Z0 + WT, Z1 - WT, YL); bb(x0, x1, g1, RY, Z0 + WT, Z1 - WT, YL); cc(x0, x1, FL, RY, Z0 + WT, Z1 - WT);
      glassPane('z', Z1 - Z0 - 2 * WT, g1 - g0, bz9, g0, (x0 + x1) / 2); });
    bb(B0, B1, RY, Y + 3.2, Z0, Z1, YL); cc(B0, B1, RY, Y + 3.2, Z0, Z1);

    dBox(0.1, 0.3, 2.42, 0x26282c, B0 - 0.05, Y + 0.3, bz9, F); dBox(0.1, 0.3, 2.42, 0x26282c, B1 + 0.05, Y + 0.3, bz9, F);
    dBox(2.2, 0.35, 0.03, 0xf4f1e0, bx9 + 0.5, Y + 0.5, Z1 + 0.015);
    [[-3.9], [2.6], [4.1]].forEach(([ox]) => [-1, 1].forEach(sz => dCyl(0.46, 0.46, 0.3, 0x26282c, bx9 + ox, Y + 0.5, bz9 + sz * 1.12, { far: true, seg: 10, rot: [Math.PI / 2, 0, 0] })));
    [-1, 1].forEach(sz => { dBox(0.04, 0.18, 0.4, 0xf4f1e0, B0 - 0.02, Y + 0.6, bz9 + sz * 0.85);
      dBox(0.04, 0.7, 0.16, 0xc0392b, B1 + 0.02, Y + 0.75, bz9 + sz * 1.05);
      dRod(B0, Y + 2.4, bz9 + sz * 1.2, B0 - 0.45, Y + 2.2, bz9 + sz * 1.35, 0.025, 0x26282c, F); });

    const IZ0 = Z0 + WT, IZ1 = Z1 - WT;
    bb(B0 + WT, B0 + WT + 0.4, FL, FL + 0.85, IZ0 + 0.02, IZ1 - 0.02, 0x3a3d44, {}); cc(B0 + WT, B0 + WT + 0.4, FL, FL + 0.85, IZ0, IZ1, true);
    dCyl(0.2, 0.2, 0.03, 0x22252a, B0 + WT + 0.62, FL + 0.95, bz9 + 0.55, { rot: [0, 0, 1.15], seg: 12 });
    dRod(B0 + WT + 0.45, FL + 0.85, bz9 + 0.55, B0 + WT + 0.6, FL + 0.95, bz9 + 0.55, 0.02, 0x22252a);
    { const sx = bx9 - 4.85, sz = bz9 + 0.55; bb(sx - 0.22, sx + 0.22, FL, FL + 0.45, sz - 0.25, sz + 0.25, 0x2a4f86, {}); bb(sx + 0.22, sx + 0.3, FL + 0.3, FL + 1.25, sz - 0.25, sz + 0.25, 0x2a4f86, {});
      cc(sx - 0.22, sx + 0.3, FL, FL + 1.25, sz - 0.25, sz + 0.25, true); }
    dRod(DX1 + 0.06, FL, Z0 + WT + 0.3, DX1 + 0.06, RY, Z0 + WT + 0.3, 0.022, 0xcfd4d8); cc(DX1 + 0.01, DX1 + 0.11, FL, RY, Z0 + WT + 0.25, Z0 + WT + 0.35, true);
    [IZ0 + 0.5, IZ1 - 0.62].forEach(z9 => { dRod(bx9 - 3.8, Y + 2.8, z9, B1 - WT, Y + 2.8, z9, 0.018, 0xcfd4d8); dRod(bx9 - 3.8, Y + 2.8, z9, bx9 - 3.8, RY, z9, 0.018, 0xcfd4d8); });
    [bz9 - 0.45, bz9 + 0.35].forEach(z9 => lamp(8.6, 0.03, 0.14, bx9 + 0.6, RY - 0.035, z9));
    [[IZ0, 1], [IZ1, -1]].forEach(([z9, f]) => { for (const [x0, x1] of z9 === IZ0 ? [[DX1 + 0.06, B1 - WT - 0.06]] : [[B0 + WT + 0.46, B1 - WT - 0.06]]) bb(x0, x1, FL + 0.06, WY0 - 0.06, f > 0 ? z9 : z9 - 0.03, f > 0 ? z9 + 0.03 : z9, CR, {}); });
    const SEAT = 0x3d5a8a, SEAT2 = 0x33507c;
    for (let i = 0; i < 9; i++) { const x9 = bx9 - 3.55 + i * 1.0;
      for (const [z0, z1, dbl] of [[IZ1 - 0.04 - 0.8, IZ1 - 0.04, true], [IZ0 + 0.04, IZ0 + 0.48, false]]) {
        bb(x9 - 0.15, x9 + 0.15, FL, FL + 0.35, z0 + 0.06, z1 - 0.06, 0x2a2d33, {});
        bb(x9 - 0.24, x9 + 0.21, FL + 0.35, FL + 0.45, z0, z1, SEAT, {});
        bb(x9 + 0.21, x9 + 0.29, FL + 0.35, FL + 1.1, z0, z1, SEAT2, {});
        for (const zz of dbl ? [z0 + 0.2, z1 - 0.2] : [(z0 + z1) / 2]) bb(x9 + 0.18, x9 + 0.21, FL + 0.55, FL + 0.95, zz - 0.03, zz + 0.03, YL, {});
        cc(x9 - 0.24, x9 + 0.29, FL, FL + 1.1, z0, z1, true);
        const w = dbl ? z1 - 0.22 : (z0 + z1) / 2;
        hotspots.push({ kind: 'sit', x: x9, z: dbl ? z0 - 0.3 : z1 + 0.3, y: FL, r: 0.42, label: '버스 의자에 앉기', yaw: -Math.PI / 2, bus: true,
          seat: { x: x9 + 0.02, y: FL + 0.45 - 0.46, z: w, yaw: -Math.PI / 2 } }); } }
    busDoor = { x: bx9 - 4.6, z: Z0 + WT / 2, y0: Y + 0.27, w: DX1 - DX0, h: WY1 - (Y + 0.27), dir: -1 };
    exitSign(DX0 + 0.45, Z0 + WT, WY1 + 0.25, [0, 1]);
    zones.push({ x0: B0 + WT, x1: B1 - WT, z0: Z0, z1: IZ1, y: FL, label: '버스 안' });
    zones.push({ x0: Math.max(-4.5, ...zones.filter(q => q.label === '놀이마당').map(q => q.x1)), x1: SCHOOL.plaza.x[1], z0: SCHOOL.shelter.center[1] + 2.25, z1: 56, y: Y, label: '버스 타는 곳' });
  }

  function whiteFence(x0, z0, x1, z1, yb) {
    meshFence(x0, z0, x1, z1, yb, 1.3, 0xf6f6f2, 0xe9e9e4, false, 8);
    byRot(x0, z0, x1, z1, 0.22, 0.25, yb, 0xc9c6be, { far: true });
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3));
    for (let i = 0; i < n; i++) { const ax = x0 + (x1 - x0) * i / n, az = z0 + (z1 - z0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, bz = z0 + (z1 - z0) * (i + 1) / n;
      colliders.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, y0: yb, y1: yb + 3, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, nc: true }); }
  }
  function byRot(x0, z0, x1, z1, w, h, y0, hex, opt = {}) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = opt.whole ? 1 : Math.max(1, Math.ceil(L / 8)), a = Math.atan2(-(z1 - z0), x1 - x0);
    for (let i = 0; i < n; i++) {
      _dm.compose(_dv.set(x0 + (x1 - x0) * (i + 0.5) / n, y0 + h / 2, z0 + (z1 - z0) * (i + 0.5) / n), _dq.setFromEuler(_de.set(0, a, 0)), _ds.set(L / n, h, w));
      dGeo(box_, _dm, hex, opt);
    }
  }
  const dBlob0 = dBlob, dRod0 = dRod;
  function byPanel(w, d, hex, cx, y, cz, a) {
    const ch = chunkOf(cx, cz), c = Math.cos(a), s = Math.sin(a);
    _c.set(hex); _c.multiplyScalar(0.97);
    const P = [[-w/2, -d/2], [-w/2, d/2], [w/2, d/2], [w/2, -d/2]].map(([u, v]) => [cx + u * c - v * s, cz + u * s + v * c]);
    for (const i of [0, 1, 2, 0, 2, 3]) { ch.pos.push(P[i][0], y, P[i][1]); ch.col.push(_c.r, _c.g, _c.b); }
  }
  {
    const PK = SCHOOL.parking, K2 = B.kitchen, Y = YARD, LINE = 0xe8eaea, [cw, cm, ce] = PK.curb;
    const byQuad = (kind, pts, y, tint = 0xffffff) => { const S = PATDEF[kind][0], P = (pts.length === 3 ? [...pts, pts[2]] : pts).map(([x, z]) => [x, y, z]); patPush(kind, P, P.map(p => [p[0] / S, -p[2] / S]), [0, 1, 0], tint); };
    const SHU = SCHOOL.shed.units, zS = SHU[1].z[1] + 0.25;
    const kx0o = K2.x[0] - 0.15, kz0o = K2.z[0] - 0.15;
    const TH = Math.atan2(cm[1] - cw[1], cm[0] - cw[0]), dcx = Math.cos(TH), dcz = Math.sin(TH);
    const zc = x => x >= cm[0] ? cm[1] : cm[1] + (x - cm[0]) * dcz / dcx;
    const xd = z => PK.x[1] + (z - zS) / (kz0o - zS) * (kx0o - PK.x[1]);
    const [f0, f1, f2, f3] = SCHOOL.boundary.slice(2, 6), lerpZ = (a, b, x) => a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    const FZ = x => x <= f1[0] ? lerpZ(f0, f1, x) : x <= f2[0] ? lerpZ(f1, f2, x) : lerpZ(f2, f3, x);
    const GP = SCHOOL.garden.poly, DK = SCHOOL.gardenDeck, DX = DK.x, DZ = DK.z, DT = Y + 0.24;
    const PZ = [-56.55, -55.65];
    const XB = E.x[1] + 0.15, XH = 49.2;
    const GR = 0xb4c08a, MOW = 'dirt', MAT = 0x5a5856, BRK = 0xae8c80;

    patQuad('asph', G.annex.x[1] + 0.15, TR3.westX - 0.3, gz0 - 0.15, G.annex.z[0] - 3, Y + 0.012);
    patQuad('asph', gx1 + 0.15, wx0 - 0.15, wz0 - 0.15, gz0 - 0.15, Y + 0.012);
    patQuad('asph', PK.x[0], kx0o, cm[1], wz0 - 0.15, Y + 0.012);
    patQuad('asph', kx0o, PK.x[1], cm[1], zS, Y + 0.012);
    byQuad('asph', [[kx0o, zS], [PK.x[1], zS], [kx0o, kz0o]], Y + 0.012);
    byQuad('asph', [cw, cm, [cw[0], cm[1]]], Y + 0.012);
    patQuad('asph', wx1 + 0.15, kx0o, wz0 - 0.15, fz0 - 0.15, Y + 0.012, false, 0xc8c8c8);
    [[cw, cm], [cm, ce], [[PK.x[1], zS], [kx0o, kz0o]]].forEach(([a, b]) => byRot(a[0], a[1], b[0], b[1], 0.15, 0.1, Y + 0.012, 0xd4d2cc, { far: true }));
    byQuad(MOW, [f0, [cm[0], FZ(cm[0])], cm, [f0[0], zc(f0[0])]], Y + 0.012, GR);
    patQuad(MOW, cm[0], PK.x[1], FZ(0), cm[1], Y + 0.012, false, GR);
    patQuad(MOW, PK.x[1], GP[0][0], FZ(0), zS, Y + 0.012, false, GR);
    patQuad(MOW, GP[0][0], GP[1][0], FZ(0), GP[0][1], Y + 0.012, false, GR);
    byQuad(MOW, [[GP[1][0], FZ(GP[1][0])], [GP[2][0], FZ(GP[2][0])], GP[2], GP[1]], Y + 0.012, GR);

    const [EX, ZS] = SCHOOL.garden.east, gxe0 = z => GP[3][0] + (z - GP[3][1]) * (GP[3][0] - GP[2][0]) / (GP[3][1] - GP[2][1]);
    byQuad(MOW, [[GP[2][0], FZ(GP[2][0])], [EX, FZ(EX)], [EX, FZ(EX) + 0.9], GP[2]], Y + 0.012, GR);
    byQuad(MOW, [[EX, FZ(EX)], [60, FZ(60)], [60, DZ[0]], [EX, DZ[0]]], Y + 0.012, GR);
    byQuad(MOW, [[gxe0(ZS), ZS], [50, ZS], [50, GP[3][1]], GP[3]], Y + 0.012, GR);
    byQuad(MOW, [[50, ZS], [EX, ZS], [EX, DZ[0]], [50, DZ[0]]], Y + 0.012, GR);
    patQuad(MOW, GP[0][0], 50, GP[4][1], PZ[0], Y + 0.012, false, GR);
    byQuad(MOW, [[xd(PZ[0]), PZ[0]], [PK.x[1], zS], [GP[0][0], zS], [GP[0][0], PZ[0]]], Y + 0.012, GR);
    byQuad(MOW, [[xd(PZ[1]), PZ[1]], [XB, PZ[1]], [XB, kz0o], [kx0o, kz0o]], Y + 0.012, GR);
    [[f0, f1], [f1, f2], [f2, f3]].forEach(([a, b]) => byQuad('grass', [[a[0], -90], a, b, [b[0], -90]], Y + 0.012, 0xb7c99a));
    byQuad('asph', [[xd(PZ[0]), PZ[0]], [XB, PZ[0]], [XB, PZ[1]], [xd(PZ[1]), PZ[1]]], Y + 0.012, MAT);

    const FAR = { far: true };
    const stop2 = (cx, cz, az) => [-0.55, 0.55].forEach(o => dBox(0.6, 0.1, 0.14, 0x2b2b2b, cx + o, Y + 0.012, cz, az ? { far: true, at: [cx + o, az] } : FAR));
    for (let x = cm[0] - 0.5; x <= PK.x[1] - 1.2; x += 2.5) { addPanel(0.14, 5.0, LINE, x, Y + 0.022, cm[1] + 2.7); if (x + 2.5 <= PK.x[1] - 1.2) stop2(x + 1.25, cm[1] + 0.65); }
    const LC9 = Math.hypot(cm[0] - cw[0], cm[1] - cw[1]);
    for (let s9 = 3.0; s9 < LC9 - 0.5; s9 += 2.5) {
      byPanel(0.14, 5.0, LINE, cm[0] - dcx * s9 - dcz * 2.7, Y + 0.022, cm[1] - dcz * s9 + dcx * 2.7, TH);
      if (s9 + 2.5 < LC9 - 0.5) stop2(cm[0] - dcx * (s9 + 1.25) - dcz * 0.65, cm[1] - dcz * (s9 + 1.25) + dcx * 0.65); }
    for (let x = -26; x <= -3.4; x += 2.5) { addPanel(0.14, 5.0, LINE, x, Y + 0.022, -62.1); if (x + 2.5 <= -3.4) stop2(x + 1.25, -60.4, -64.5); }
    const HC = [-20.5, -17.2, -15.7, -12.4, -11.0], HZ = [-50.25, -45.35], HY = Y + 0.038, WH = 0xf4f6f6;
    for (let x = HC[0] - 2.5; x >= wx0 + 1.9; x -= 2.5) { addPanel(0.14, HZ[1] - HZ[0], LINE, x, Y + 0.022, (HZ[0] + HZ[1]) / 2); stop2(x + 1.25, HZ[1] - 0.6); }

    addPanel(HC[4] - HC[0], HZ[1] - HZ[0], 0x3f6fb5, (HC[0] + HC[4]) / 2, Y + 0.022, (HZ[0] + HZ[1]) / 2);
    HC.forEach((x9, i) => addPanel(0.12, HZ[1] - HZ[0], WH, x9 + (i === 0 ? 0.06 : i === 4 ? -0.06 : 0), HY, (HZ[0] + HZ[1]) / 2));
    [HZ[0] + 0.06, HZ[1] - 0.06].forEach(z9 => addPanel(HC[4] - HC[0], 0.12, WH, (HC[0] + HC[4]) / 2, HY, z9));
    [[HC[1], HC[2]], [HC[3], HC[4]]].forEach(([a, b]) => { for (let z9 = HZ[0] + 0.7; z9 < HZ[1] - 0.6; z9 += 0.6) byPanel(0.1, (b - a - 0.14) * 1.41, WH, (a + b) / 2, HY, z9, Math.PI / 4); });
    [(HC[0] + HC[1]) / 2, (HC[2] + HC[3]) / 2].forEach(cx9 => {
      const cz9 = (HZ[0] + HZ[1]) / 2 + 0.2;
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; byPanel(0.07, 0.25, WH, cx9 + 0.05 + Math.cos(a) * 0.4, HY, cz9 + 0.25 + Math.sin(a) * 0.4, a); }
      addPanel(0.11, 0.65, WH, cx9 - 0.15, HY, cz9 - 0.2); addPanel(0.55, 0.11, WH, cx9 + 0.1, HY, cz9 + 0.07); addPanel(0.11, 0.4, WH, cx9 + 0.4, HY, cz9 + 0.3); addPanel(0.22, 0.22, WH, cx9 - 0.15, HY, cz9 - 0.72);
      stop2(cx9, HZ[1] - 0.6);
    });
    const cone = objWrap((x9, z9) => { dCyl(0.03, 0.16, 0.68, 0xe0582a, x9, Y + 0.05, z9, { seg: 8, far: true }); dCyl(0.1, 0.12, 0.1, 0xf4f4f0, x9, Y + 0.33, z9, { seg: 8, far: true }); dBox(0.36, 0.03, 0.36, 0x2e2e30, x9, Y + 0.02, z9, FAR);
      colliders.push(noStand({ x0: x9 - 0.18, x1: x9 + 0.18, y0: Y, y1: Y + 0.75, z0: z9 - 0.18, z1: z9 + 0.18 })); }, 'cone');
    [[-16.4, -49.9], [-12.9, -49.4], [-14.0, -47.9]].forEach(([x9, z9]) => cone(x9, z9));
    sign('P', -16.55, 1.05, wz0 - 0.19, 0, 0.5);

    car(HC[0] - 1.25, (HZ[0] + HZ[1]) / 2, 0xf2f3f4, 0xe6e8ea, Y, 4.7, 1.9);
    car(HC[0] - 11.25, (HZ[0] + HZ[1]) / 2, 0x8f959b, 0xa3a9ae, Y);
    car(-4.75, -61.9, 0xeef0f2, 0xe2e5e8, Y, 4.0, 1.8, [-4.75, -64.5]);
    car(-21.25, cm[1] + 2.7, 0xeef0f2, 0xe2e5e8, Y);

    const ISL = [[PK.x[0], -69.55], [-31, -65.3], [-29.5, -61], [-31.5, -57], [PK.x[0], -56.5]];
    byQuad('grass', [ISL[0], ISL[1], ISL[2], [PK.x[0], -61]], Y + 0.024, 0xb9c98f);
    byQuad('grass', [[PK.x[0], -61], ISL[2], ISL[3], ISL[4]], Y + 0.024, 0xb9c98f);
    for (let i = 0; i < 4; i++) byRot(ISL[i][0], ISL[i][1], ISL[i + 1][0], ISL[i + 1][1], 0.15, 0.1, Y + 0.012, 0xc9c9c4, { far: true });
    tree(-40, -61.5, 3.4); pine(-45.5, -63.2, 1.05);
    objScope('bush', () => { addBox(3, 1.2, 1.0, 0x4e7a3e, -45, Y, -68, NS); dBlob(1.55, 0.3, 0.55, 0x5f8d4a, -45, Y + 1.2, -68, { far: true, chunky: true, jitter: 0.12 }); });

    const SHC = 0xf5d20f, SHR = 0xe0bd0a, SHH = SCHOOL.shed.h;
    SHU.forEach(u => {
      const [ux0, ux1] = u.x, [uz0, uz1] = u.z, cx9 = (ux0 + ux1)/2, cz9 = (uz0 + uz1)/2, dc = uz1 - 0.15 - 0.45, wc = uz1 - 3.5;
      const SA = { far: true, at: [cx9, Math.min(cz9, -64.5)] };
      addBox(ux1 - ux0, SHH, uz1 - uz0, SHC, cx9, Y, cz9, { at: SA.at });
      dBox(ux1 - ux0 + 0.5, 0.1, uz1 - uz0 + 0.5, 0x3f6fb0, cx9, Y + SHH, cz9, SA);
      for (let z9 = uz0 + 0.2; z9 < uz1 - 0.1; z9 += 0.45) {
        if (Math.abs(z9 - dc) > 0.52 && Math.abs(z9 - wc) > 0.45) dBox(0.04, SHH - 0.2, 0.07, SHR, ux0 - 0.02, Y + 0.1, z9, SA);
        dBox(0.04, SHH - 0.2, 0.07, SHR, ux1 + 0.02, Y + 0.1, z9, SA); }
      for (let x9 = ux0 + 0.2; x9 < ux1 - 0.1; x9 += 0.45) [uz0 - 0.02, uz1 + 0.02].forEach(z9 => dBox(0.07, SHH - 0.2, 0.04, SHR, x9, Y + 0.1, z9, SA));
      dBox(0.04, 2.1, 0.9, 0xe8c40c, ux0 - 0.02, Y + 0.03, dc, SA); dBox(0.03, 0.05, 0.14, 0xc9ced3, ux0 - 0.055, Y + 1.0, dc + 0.3, SA);
      dBox(0.04, 0.7, 0.8, 0xf2f2ee, ux0 - 0.02, Y + 1.25, wc, SA); dBox(0.03, 0.58, 0.68, 0x3e4a55, ux0 - 0.05, Y + 1.31, wc, SA);
      [-0.2, 0, 0.2].forEach(o => dRod(ux0 - 0.075, Y + 1.3, wc + o, ux0 - 0.075, Y + 1.9, wc + o, 0.012, 0xf4f4f0, SA));
    });

    for (let x9 = xd(PZ[1]) + 0.5, k = 0; x9 < 20; x9 += 1.0, k++) { const h9 = hash2(x9, 5), sx = 0.26 + h9 * 0.12, sy = 0.18 + hash2(x9, 6) * 0.1, z9 = PZ[1] + 0.75 + (hash2(x9, 7) - 0.5) * 0.12;
      dBlob(sx, sy, sx * 0.85, [0x8e8b84, 0x9a978f, 0x7f7d77][k % 3], x9, Y + 0.06, z9, { far: true, chunky: true, ry: h9 * 6, jitter: 0.2 });
      colliders.push({ x0: x9 - sx * 0.8, x1: x9 + sx * 0.8, y0: Y, y1: Y + 0.06 + sy * 0.8, z0: z9 - sx * 0.65, z1: z9 + sx * 0.65 }); }
    const weed = objWrap((x, z, r, hex) => { dBlob(r, r * 0.8, r, hex, x, Y + r * 0.62, z, { chunky: true, ry: x * 3, jitter: 0.18 }); colliders.push(noStand({ x0: x - r * 0.85, x1: x + r * 0.85, y0: Y, y1: Y + r * 1.4, z0: z - r * 0.85, z1: z + r * 0.85 })); }, 'bush');
    for (let x9 = xd(PZ[1]) + 0.7, k = 0; x9 < 14; x9 += 1.45, k++) { const h9 = hash2(x9, 11);
      weed(x9, -53.75 + (h9 - 0.5) * 0.3, 0.42 + h9 * 0.22, [0x5e8f45, 0x74a553, 0x4f8a45][k % 3]);
      if (k % 2) weed(x9 + 0.6, -52.35, 0.34 + h9 * 0.12, [0x6b9c4c, 0x588a42][k % 4 > 1 ? 1 : 0]); }
    [[0.4, -52.5], [6.3, -52.4], [11.6, -52.5]].forEach(([x9, z9]) => bgTree(x9, z9, 0.45));
    for (let x9 = 14.3; x9 < 44; x9 += 2.95) dBox(Math.min(2.9, 44.3 - x9), 1.6, 0.9, 0x3f6b35, x9 + Math.min(2.9, 44.3 - x9) / 2, Y, -53.3);
    for (let x9 = 15.1; x9 < 44; x9 += 1.5) { const h9 = hash2(x9, 21);
      dBlob(0.95, 0.42 + h9 * 0.12, 0.58, h9 > 0.5 ? 0x5a8c42 : 0x4f8540, x9, Y + 1.6, -53.3 + (h9 - 0.5) * 0.08, { chunky: true, ry: h9 * 0.4, jitter: 0.16 }); }
    colliders.push(noStand({ x0: 14.3, x1: 44.3, y0: Y, y1: Y + 2.1, z0: -53.8, z1: -52.8 }));
    [[4.4, -61.6, 1.0], [8.8, -63.2, 1.05], [13.6, -58.2, 1.0]].forEach(([x9, z9, s9]) => prunedPine(x9, z9, s9, true, [x9, -64.5]));

    const tallConifer = objWrap((x, z, h) => { const y = tY(z, x); colliders.push({ x0: x - 0.3, x1: x + 0.3, y0: y, y1: y + 14, z0: z - 0.3, z1: z + 0.3 });
      dCyl(0.18, 0.32, h * 0.4, 0x5a4636, x, y, z, { far: true, seg: 6 });
      [[0.18, 2.1, 0.34], [0.34, 1.75, 0.3], [0.5, 1.35, 0.26], [0.64, 0.95, 0.22], [0.78, 0.55, 0.2]].forEach(([t, r, hh], i) =>
        dCyl(0, r, h * hh, [0x2f5a34, 0x355f38, 0x3d6b3f][i % 3], x, y + h * t, z, { far: true, seg: 7, rot: [0, i * 0.7, 0] })); }, 'tree');
    tallConifer(42.4, -60.9, 16); tallConifer(45.1, -59.4, 15);
    ballJuniper(46.6, -62.4, 1.8, true); tree(49.2, -60.6, 1.9, true);
    objScope('tree', () => { bgTree(47.4, -57.7, 0.42); dRod(47.55, Y, -57.7, 47.55, Y + 1.5, -57.7, 0.025, 0xb89a6e); post(47.55, -57.7, Y, Y + 1.5, 0.05); });
    shrub(46.2, -51.8, 0.45, 0x5c8f45, true);

    { const SP = [[40.6, -56.3], [42.2, -57.7], [43.6, -59.6], [44.3, -61.8], [45.0, -64.2]], MW = 0.75;
      for (let i = 0; i + 1 < SP.length; i++) { const [ax, az] = SP[i], [bx, bz] = SP[i + 1], L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L * MW / 2, nz = (bx - ax) / L * MW / 2;
        byQuad('asph', [[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]], Y + 0.018 + (i % 2) * 0.003, MAT);
        for (let t = 0.4; t < L - 0.1; t += 0.8) { const x9 = ax + (bx - ax) * t / L, z9 = az + (bz - az) * t / L; dCyl(0.24, 0.25, 0.05, 0xb9b6ae, x9, Y + 0.012, z9, { seg: 9, at: [x9, -64.5] }); } }
      [[41.3, -58.0], [43.0, -60.9], [45.7, -62.9]].forEach(([x9, z9]) => { dCyl(0.025, 0.025, 0.45, 0x2b2d30, x9, Y, z9, { seg: 6, at: [x9, -64.5] }); dBox(0.13, 0.08, 0.13, 0x2b2d30, x9, Y + 0.45, z9, { at: [x9, -64.5] });
        lamp(0.09, 0.03, 0.09, x9, Y + 0.415, z9); colliders.push(noStand({ x0: x9 - 0.07, x1: x9 + 0.07, y0: Y, y1: Y + 0.55, z0: z9 - 0.07, z1: z9 + 0.07 })); }); }

    const GD = SCHOOL.garden, gxe = z => GP[3][0] + (z - GP[3][1]) * (GP[3][0] - GP[2][0]) / (GP[3][1] - GP[2][1]);
    byQuad('asph', [GP[0], GP[1], [GP[1][0], GP[4][1]], GP[4]], Y + 0.012, MAT);
    byQuad('asph', [GP[1], GP[2], GP[3], [GP[1][0], GP[3][1]]], Y + 0.012, MAT);
    byQuad('asph', [GP[2], [EX, FZ(EX) + 0.9], [EX, ZS], [gxe(ZS), ZS]], Y + 0.012, MAT);
    const crop = (kind, a, b, rz) => {

      const top = Y + 0.18, o9 = (cx, opt) => { const o = cx < 16 ? { ...opt, far: true } : { ...opt }; if (rz > -64) o.at = [cx, -64.5]; return o; };
      const dBlob = (sx, sy, sz, hex, cx, cy, cz, opt = {}) => dBlob0(sx, sy, sz, hex, cx, cy, cz, o9(cx, opt));
      const dRod = (x0, y0, z0, x1, y1, z1, r, hex) => dRod0(x0, y0, z0, x1, y1, z1, r, hex, o9(x0, {}));
      if (kind !== 'bean') softVols.push({ x0: a, x1: b, y0: top + 0.005, y1: top + 1.0, z0: rz - 0.6, z1: rz + 0.6, why: '텃밭 작물(' + kind + ')' });
      if (kind === 'mulch') { for (let x9 = a + 0.4; x9 < b - 0.2; x9 += 0.9) dBlob(0.12, 0.14, 0.12, 0x6aa84f, x9, top + 0.08, rz + (hash2(x9, 3) - 0.5) * 0.5, { chunky: true }); return; }
      if (kind === 'leafy') { let k9 = 0; for (let x9 = a + 0.3; x9 < b - 0.2; x9 += 0.55, k9++) { const o = k9 % 2 ? 0.26 : -0.26; dBlob(0.3, 0.44, 0.3, hash2(x9, o) > 0.5 ? 0x6aa84f : 0x7cb85a, x9, top + 0.3, rz + o, { chunky: true, ry: x9 * 3 + o, jitter: 0.3 }); } return; }
      if (kind === 'marigold') { for (let x9 = a + 0.35; x9 < b - 0.2; x9 += 0.85) { const zz = rz + (hash2(x9, 4) - 0.5) * 0.4;
          dBlob(0.3, 0.26, 0.3, 0x4f8a3e, x9, top + 0.2, zz, { chunky: true, ry: x9 });
          [[0.12, 0.08], [-0.08, -0.12]].forEach(([ox, oz], j) => dBlob(0.08, 0.07, 0.08, j ? 0xf39a1c : 0xf7c531, x9 + ox, top + 0.42, zz + oz, { chunky: true })); } return; }
      if (kind === 'potato') { for (let x9 = a + 0.4; x9 < b - 0.3; x9 += 0.95) dBlob(0.55, 0.16, 0.52, hash2(x9, 5) > 0.5 ? 0x4f8f3e : 0x5c9a48, x9, top + 0.08, rz, { chunky: true, ry: x9, jitter: 0.25 }); return; }
      for (let x9 = a + 0.3; x9 < b - 0.1; x9 += 1.2) [-0.35, 0.35].forEach(o => { dRod(x9, top, rz + o, x9, top + 1.6, rz + o * 0.3, 0.02, 0x9c7a53); dBlob(0.2, 0.34, 0.2, 0x4d8b4d, x9, top + 0.9, rz + o * 0.6, { chunky: true, ry: x9 + o }); });
      dRod(a + 0.3, top + 1.5, rz, b - 0.1, top + 1.5, rz, 0.01, 0xd8d4c8);
      let xl = a + 0.3; while (xl + 1.2 < b - 0.1) xl += 1.2;
      colliders.push(noStand({ x0: a + 0.05, x1: xl + 0.25, y0: Y, y1: Y + 1.8, z0: rz - 0.45, z1: rz + 0.45 }));
    };

    const FAL = 18.6, VIN = 0x1f2022;
    const PLAN = [['marigold', 'leafy'], ['potato', 'mulch', 'leafy'], ['bean', 'potato'], ['leafy', 'mulch', 'marigold'], ['potato', 'bean'], ['mulch', 'leafy']];
    PLAN.forEach((pl, i) => {
      const rz = GP[4][1] - 1.25 - i * 2.45, a0 = FAL + 0.6, b0 = gxe(rz - 0.6) - 0.6, sl = (b0 - a0 - 0.5 * (pl.length - 1)) / pl.length;
      pl.forEach((kind, j) => { const a = a0 + j * (sl + 0.5), b = a + sl;
        addBox(b - a, 0.18, 1.2, VIN, (a + b) / 2, Y, rz);
        dBox(b - a - 0.3, 0.03, 0.8, 0x2b2c2f, (a + b) / 2, Y + 0.18, rz, { at: [(a + b) / 2, -64.5] });
        crop(kind, a, b, rz); });
    });

    { const ZN = x => FZ(x) + 0.9, xN = z => { const ax = GP[2][0], az = GP[2][1], bz = ZN(EX); return ax + (z - az) * (EX - ax) / (bz - az); };
      GARDEN_BARE.length = 0; const EPLAN = [['potato', 'bare'], ['bare', 'mulch'], ['bean', 'bare'], ['mulch', 'bare'], ['bare', 'potato'], ['mulch', 'bare']];
      for (let i = 2, k = 0; ; i++, k++) {
        const rz = GP[4][1] - 1.25 - i * 2.45; if (rz - 0.6 < ZN(EX) + 0.3) break;
        const a0 = Math.max(gxe(rz + 0.6) + 1.2, rz - 0.6 < GP[2][1] + 0.3 ? xN(rz - 0.9) + 0.3 : -1e9), b0 = EX - 0.8; if (b0 - a0 < 3) continue;
        const pl = EPLAN[k % EPLAN.length], sl = (b0 - a0 - 0.5 * (pl.length - 1)) / pl.length;
        pl.forEach((kind, j) => { const a = a0 + j * (sl + 0.5), b = a + sl;
          addBox(b - a, 0.18, 1.2, VIN, (a + b) / 2, Y, rz);
          dBox(b - a - 0.3, 0.03, 0.8, 0x2b2c2f, (a + b) / 2, Y + 0.18, rz);
          if (kind !== 'bare') crop(kind, a, b, rz); else GARDEN_BARE.push([+a.toFixed(2), +b.toFixed(2), +rz.toFixed(2), +(Y + 0.18).toFixed(3)]); }); } }

    { const fz0 = GP[0][1] + 0.2, fz1 = GP[4][1] - 0.2;
      patQuad('dirt', GP[0][0] + 0.2, FAL, fz0, fz1, Y + 0.02, false, 0xc9bf86);
      for (let k = 0; k < 26; k++) { const x9 = GP[0][0] + 0.6 + hash2(k, 71) * (FAL - GP[0][0] - 1.2), z9 = fz0 + 0.5 + hash2(k, 73) * (fz1 - fz0 - 1.0), r9 = 0.2 + hash2(k, 79) * 0.18;
        dBlob(r9 * 1.3, r9 * 0.6, r9 * 1.2, [0xa99d62, 0xb8ad6e, 0x9c9a5a][k % 3], x9, Y + r9 * 0.3, z9, { chunky: true, ry: k, jitter: 0.2, far: x9 < 16, ...(x9 < 16 ? {} : { at: [x9, -64.5] }) });
        softVols.push({ x0: x9 - r9 * 1.3, x1: x9 + r9 * 1.3, y0: Y, y1: Y + r9, z0: z9 - r9 * 1.2, z1: z9 + r9 * 1.2, why: '휴경지 마른 풀(걸어 들어감)' }); } }

    [[GP[4][1] - 2.48, 0x5f8f4a], [GP[4][1] - 7.38, 0xa8adb0]].forEach(([hz, hc], k) => { let px = 34.9, pz = hz;
      for (let x9 = 34.0, i = 0; x9 > FAL + 1.5; x9 -= 1.3, i++) { const z9 = hz + Math.sin(i * 1.3 + k) * 0.18; dRod(px, Y + 0.03, pz, x9, Y + 0.03, z9, 0.02, hc, { at: [Math.max(x9, 16.5), -64.5] }); px = x9; pz = z9; } });

    for (let k = 0; k < 5; k++) { const x9 = 26.5 + k * 1.05, z9 = GP[4][1] - 0.35; objScope('plant', () => { addBox(0.9, 0.3, 0.35, 0xb4552f, x9, Y, z9, NS);
      [-0.2, 0.2].forEach(o => dBlob(0.14, 0.42, 0.11, 0x9cc45a, x9 + o, Y + 0.55, z9, { chunky: true, jitter: 0.3, at: [x9, -64.5] })); }); }
    const tp = [35.0, GP[4][1] - 0.4];
    dCyl(0.05, 0.05, 0.9, 0xeeeeee, tp[0], Y, tp[1], { seg: 8 }); dBox(0.05, 0.05, 0.14, 0x9aa0a6, tp[0], Y + 0.78, tp[1] + 0.09); colliders.push(noStand({ x0: tp[0] - 0.07, x1: tp[0] + 0.07, y0: Y, y1: Y + 0.95, z0: tp[1] - 0.07, z1: tp[1] + 0.07 }));
    objScope('bucket', () => { dCyl(0.35, 0.25, 0.18, 0xb0452f, tp[0] + 0.75, Y, tp[1] + 0.1, { seg: 12 }); colliders.push({ x0: tp[0] + 0.4, x1: tp[0] + 1.1, y0: Y, y1: Y + 0.18, z0: tp[1] - 0.3, z1: tp[1] + 0.4 }); });
    [[0.36, 0], [0.26, 0.03]].forEach(([r9, y9]) => { for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, b = (k + 1) / 9 * Math.PI * 2, hx = 36.4, hz = -58.6;
      dRod(hx + Math.cos(a) * r9, Y + 0.03 + y9, hz + Math.sin(a) * r9, hx + Math.cos(b) * r9, Y + 0.03 + y9, hz + Math.sin(b) * r9, 0.02, 0xbfc3c4); } });
    [[tp[0], tp[1] + 0.1, 35.6, -58.95], [36.05, -58.6, 36.4 - 0.36, -58.6]].forEach(([a, b, c, d]) => dRod(a, Y + 0.03, b, c, Y + 0.03, d, 0.02, 0xbfc3c4));
    for (let x9 = 12; x9 < 34; x9 += 4.4) { const z9 = GP[4][1] + 0.3, A9 = x9 >= 16 ? { at: [x9, -64.5] } : {}; dRod(x9, Y, z9, x9, Y + 0.5, z9, 0.02, 0x2a2a2a, A9); dBox(0.12, 0.08, 0.12, 0x333333, x9, Y + 0.5, z9, A9); dBox(0.1, 0.03, 0.1, 0x3a5a8a, x9, Y + 0.58, z9, A9);
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y, y1: Y + 0.6, z0: z9 - 0.08, z1: z9 + 0.08 })); }
    hotspots.push({ kind: 'garden', x: tp[0], z: tp[1] + 0.9, y: Y, r: 2.2, label: '텃밭에 물 주기', at: [34.2, Y + 0.2, GP[4][1] - 1.25] });

    addBox(DX[1] - DX[0], 0.24, DZ[1] - DZ[0], 0x6f5a4c, (DX[0] + DX[1]) / 2, Y, (DZ[0] + DZ[1]) / 2);
    patQuad('gymw', DX[0], DX[1], DZ[0], DZ[1], DT + 0.012, false, 0x948c8c);
    [[51.6, -54.3], [53.2, -50.4], [56.8, -52.2], [52.1, -45.6], [57.6, -46.2]].forEach(([x9, z9]) => tree(x9, z9, 1.7, true));
    const picnic = objWrap((x, z, rot) => {
      const T = DT + 0.012, W9 = 0x8a6a50, L9 = 0x6f5440;
      const o9 = {}, bx = (lx, ly, lz, w, h, d) => rot ? dBox(d, h, w, W9, x + lz, T + ly, z + lx, o9) : dBox(w, h, d, W9, x + lx, T + ly, z + lz, o9);
      const rd = (a, b, r) => { const P = p => rot ? [x + p[2], T + p[1], z + p[0]] : [x + p[0], T + p[1], z + p[2]]; const A = P(a), Bq = P(b); dRod(A[0], A[1], A[2], Bq[0], Bq[1], Bq[2], r, L9, o9); };
      bx(0, 0.7, 0, 1.8, 0.05, 0.75); [-0.62, 0.62].forEach(o => bx(0, 0.42, o, 1.8, 0.05, 0.28));
      [-0.7, 0.7].forEach(lx => { rd([lx, 0, -0.72], [lx, 0.7, -0.12], 0.035); rd([lx, 0, 0.72], [lx, 0.7, 0.12], 0.035); rd([lx, 0.4, -0.78], [lx, 0.4, 0.78], 0.03); });
      rd([-0.7, 0.35, 0], [0.7, 0.35, 0], 0.03);
      colliders.push(noStand(rot ? { x0: x - 0.8, x1: x + 0.8, y0: DT, y1: T + 0.75, z0: z - 0.95, z1: z + 0.95 } : { x0: x - 0.95, x1: x + 0.95, y0: DT, y1: T + 0.75, z0: z - 0.8, z1: z + 0.8 }));

      hotspots.push(rot ? { kind: 'sit', x: x + 1.1, z, y: DT, r: 0.75, label: '의자에 앉기', yaw: -Math.PI / 2 } : { kind: 'sit', x, z: z + 1.1, y: DT, r: 0.75, label: '의자에 앉기' });
    }, 'table');
    [[51.8, -52.5, 0], [54.2, -54.3, 1], [55, -51, 0], [57.5, -49.5, 0], [53.8, -47.6, 1], [56.6, -44.6, 0], [51.3, -44.1, 1]].forEach(([x9, z9, r9]) => picnic(x9, z9, r9));
    objScope('statue', () => { const sx9 = 58.35, sz9 = -55.7, T = DT + 0.012, WHT = 0xf1f0ea;
      dBox(0.6, 0.8, 0.6, 0xe6e4de, sx9, T, sz9); dBox(0.7, 0.08, 0.7, 0xd9d6ce, sx9, T + 0.8, sz9);
      dCyl(0.16, 0.3, 0.5, WHT, sx9, T + 0.88, sz9, { seg: 10 }); dBlob(0.2, 0.36, 0.17, WHT, sx9, T + 1.62, sz9, { ry: 0.3 }); dBlob(0.13, 0.15, 0.13, WHT, sx9, T + 2.1, sz9, { chunky: true });
      colliders.push(noStand({ x0: sx9 - 0.35, x1: sx9 + 0.35, y0: DT, y1: T + 2.3, z0: sz9 - 0.35, z1: sz9 + 0.35 })); });

    slope('gymw', 'x', -49.25, -47.85, DX[0], XH - 0.6, DT, Y + 0.02, 3, 0x948c8c);
    [[DZ[0] + 0.2, -49.45], [-47.65, -36.5]].forEach(([za, zb]) => {
      patQuad('dirt', XH, DX[0], za, zb, Y + 0.012, false, 0x9a8a70);
      for (let z9 = za + 0.35; z9 < zb - 0.2; z9 += 0.55) { const h9 = hash2(49.6, z9);
        const o9 = {};
        dBlob(0.34, 0.26, 0.3, h9 > 0.5 ? 0x4f8a3e : 0x5c9a4a, 49.6 + (h9 - 0.5) * 0.2, Y + 0.18, z9, { ...o9, chunky: true, ry: z9, jitter: 0.25 });
        if (h9 > 0.5) dRod(49.6 + (h9 - 0.5) * 0.3, Y + 0.3, z9, 49.6 + (h9 - 0.5) * 0.3, Y + 0.8, z9 + 0.05, 0.015, 0x9c8ac9, o9); }
      colliders.push(noStand({ x0: XH + 0.05, x1: DX[0] - 0.02, y0: Y, y1: Y + 0.8, z0: za, z1: zb }));
      addBox(0.15, 0.2, zb - za, 0xc9c6be, XH - 0.075, Y, (za + zb) / 2);
    });

    const BRK2 = 0xbf7873, GRY2 = 0xcfc8bc;
    patQuad('ilock', XB, XH, PZ[0], -52, Y + 0.012, false, BRK2);
    patQuad('ilock', XB, 46.3, -52, -39.35, Y + 0.012, false, BRK2); patQuad('ilock', 48.1, XH, -52, -39.35, Y + 0.012, false, BRK2);
    patQuad('ilock', 46.3, 48.1, -52, -39.35, Y + 0.012, false, GRY2);
    patQuad('ilock', 46.65, XH, -39.35, -38.3, Y + 0.012, false, BRK2); patQuad('ilock', 46.65, XH, -38.3, fz0 - 0.3, Y + 0.012, false, GRY2);
    patQuad('ilock', XH, 53.5, -36.3, fz0 - 0.3, Y + 0.012, false, GRY2);
    [[47.5, -50.5], [47.3, -38.3]].forEach(([x9, z9]) => dCyl(0.35, 0.35, 0.02, 0x6b6b6b, x9, Y + 0.012, z9, { seg: 12, far: true }));
    { const px9 = 48.5, pz9 = -35.9;
      dCyl(0.12, 0.18, 11, 0x9a9a96, px9, Y, pz9, { far: true, seg: 8 });
      [9.4, 10.2].forEach(h9 => { dBox(1.8, 0.1, 0.1, 0x8a8a86, px9, Y + h9, pz9, { far: true }); [-0.7, -0.25, 0.25, 0.7].forEach(o => dCyl(0.04, 0.05, 0.12, 0xf2f2ee, px9 + o, Y + h9 + 0.1, pz9, { far: true, seg: 6 })); });
      dRod(px9, Y + 7.5, pz9, px9 - 1.4, Y + 7.9, pz9, 0.04, 0x8a8a86, { far: true }); dBox(0.45, 0.12, 0.2, 0xdfe3e6, px9 - 1.5, Y + 7.78, pz9, { far: true });
      [-0.12, 0.12].forEach(o => dRod(px9 + o, Y + 8.9, pz9, 49.9 + o, FH + 0.35, -34.75, 0.012, 0x2a2a2a, { far: true }));
      colliders.push({ x0: px9 - 0.2, x1: px9 + 0.2, y0: Y, y1: Y + 11, z0: pz9 - 0.2, z1: pz9 + 0.2 }); }

    const EW = 54.15;
    { const RX0 = DX[0] + 0.15, RX1 = RX0 + 1.4, RZ1 = DZ[1] + 2.4;
      slope('gymw', 'z', RX0, RX1, DZ[1], RZ1, DT, Y + 0.02, 3, 0x948c8c);
      [[RX0, -1], [RX1, 1]].forEach(([x9, f9]) => slopeCap('gymw', x9, f9, DZ[1], RZ1, DT, Y + 0.02, 0x6f6868));
      patQuad('ilock', DX[0], EW, RZ1, -36.3, Y + 0.012, false, BRK2);
      patQuad(MOW, DX[0], EW, DZ[1], RZ1, Y + 0.012, false, GR); }
    patQuad(MOW, EW, 60, DZ[1], -36.3, Y + 0.012, false, GR); patQuad(MOW, EW, 60, -36.3, fz0 - 0.3, Y + 0.012, false, GR); patQuad('ilock', 53.5, EW, -36.3, fz0 - 0.3, Y + 0.012, false, GRY2);
    [[55.6, -40.2, 1.6, 0.9, 1.4], [58.0, -41.8, 1.6, 0.8, 1.2]].forEach(([x9, z9, w9, h9, d9]) => mound(x9, z9, w9, h9, d9, 0x557f47, true));
    [[55.6, -37.7], [58.6, -38.5]].forEach(([x9, z9]) => weed(x9, z9, 0.55, 0x4d8b4d));

    { const dz9 = -37.9;
      addBox(0.85, -YARD, 2.2, 0xbdb8ae, wx1 + 0.575, YARD, dz9);
      addPanel(0.85, 1.9, 0x8c3a36, wx1 + 0.575, 0.012, dz9); for (let k = 0; k < 4; k++) addPanel(0.06, 1.8, 0x4f8c66, wx1 + 0.27 + k * 0.2, 0.02, dz9);
      addBox(0.45, 1.1, 0.45, BRICK, wx1 + 0.375, YARD, dz9 - 1.325, NS);
      patWall('brickW', 'x', wx1 + 0.17, wx1 + 0.58, YARD + 0.02, YARD + 1.08, dz9 - 1.562, -1);
      dBox(0.55, 0.08, 0.55, 0xcfcac0, wx1 + 0.425, YARD + 1.1, dz9 - 1.3); }
    { const xo = kx0o - 0.04;
      objScope('box', () => { dBox(0.5, 0.4, 3.0, 0xb8bec4, xo - 0.25, Y, -42.3, FAR); dBox(0.46, 0.04, 2.9, 0x9aa0a6, xo - 0.25, Y + 0.4, -42.3, FAR);
      colliders.push(noStand({ x0: xo - 0.5, x1: xo, y0: Y, y1: Y + 0.5, z0: -43.8, z1: -40.8 })); });
      objScope('ac', () => { addBox(0.3, 0.55, 0.8, 0xeceeee, xo - 0.15, Y, -36.9, NS); dCyl(0.2, 0.2, 0.02, 0x8a9096, xo - 0.3, Y + 0.27, -36.9, { seg: 8, rot: [0, 0, Math.PI / 2], far: true }); });
      objScope('ac', () => { for (let k = 0; k < 5; k++) { const z9 = -45.45 - k * 0.9; dBox(0.35, 1.3, 0.86, 0xeef0ee, xo - 0.175, Y, z9, FAR); dCyl(0.3, 0.3, 0.02, 0x8a9096, xo - 0.35, Y + 0.85, z9, { seg: 8, rot: [0, 0, Math.PI / 2], far: true }); }
      colliders.push(noStand({ x0: xo - 0.35, x1: xo, y0: Y, y1: Y + 1.3, z0: -45.45 - 4 * 0.9 - 0.43, z1: -45.45 + 0.43 })); });
      dCyl(0.35, 0.35, 0.02, 0x6b6b6b, (wx1 + kx0o) / 2, Y + 0.012, -43.2, { seg: 12, far: true }); dBox(1.0, 0.03, 0.6, 0x6f7274, (wx1 + kx0o) / 2 - 0.3, Y + 0.012, -40.4, FAR); }

    [[-46, -38], [-24, -14], [-5, 7]].forEach(([a, b], g9) => { for (let x9 = a; x9 <= b; x9 += 4.8) { const h9 = hash2(x9, g9 + 31); bgTree(x9 + (h9 - 0.5) * 1.2, FZ(x9) - 3.2 - h9 * 2.2, 1.0 + h9 * 0.35); } });
    byRot(-32.3, -104, 4.7, -121, 11, 7.5, FIELD, 0xb7c0c8, { far: true, whole: true, at: [-14, -112] });
    byRot(-32.3, -104, 4.7, -121, 11.6, 0.3, FIELD + 7.5, 0xdfe3e6, { far: true, whole: true, at: [-14, -112] });

    zones.push({ x0: PK.x[0], x1: wx1, z0: wz0 - 12, z1: wz0, y: Y, label: '주차장' });
    zones.push({ x0: PK.x[0], x1: PK.x[1], z0: cm[1], z1: wz0 - 12, y: Y, label: '주차장(북쪽)' });
    zones.push({ x0: wx1, x1: K2.x[0], z0: wz0, z1: fz0, y: Y, label: '뒷길' });
    zones.push({ x0: PK.x[1], x1: SHU[0].x[1] + 0.25, z0: SHU[0].z[0] - 0.25, z1: zS, y: Y, label: '노란 창고' });
    zones.push({ x0: Math.max(xd(PZ[1]), PK.x[1]), x1: XB, z0: GP[4][1], z1: kz0o, y: Y, label: '텃밭 길' });
    zones.push({ x0: GD.x[0], x1: GD.x[1], z0: GD.z[0], z1: GD.z[1], y: Y, label: '텃밭' });
    zones.push({ x0: GD.x[1], x1: GD.east[0], z0: -86, z1: GD.east[1], y: Y, label: '텃밭' });
    zones.push({ x0: GP[3][0], x1: 50, z0: GD.east[1], z1: GP[4][1], y: Y, label: '큰 나무 잔디밭' });
    zones.push({ x0: DX[0], x1: DX[1], z0: DZ[0], z1: DZ[1], y: DT, label: '텃밭 쉼터' });
    zones.push({ x0: XB, x1: DX[0], z0: PZ[0], z1: -39.35, y: Y, label: '동관 뒤뜰' });
    zones.push({ x0: XB, x1: DX[0], z0: -39.35, z1: fz0 - 0.3, y: Y, label: '마당 동쪽 입구' });
  }

  {
    const R9 = seeded(4242), jit = () => (R9() - 0.5) * 2.4;

    const tri = (kind, A, Bp, Cp, tint = 0xffffff) => { const S = PATDEF[kind][0], P9 = [A, Bp, Cp, Cp].map(([x, z]) => [x, YARD + 0.012, z]); patPush(kind, P9, P9.map(q => [q[0] / S, -q[2] / S]), [0, 1, 0], tint); };
    const fan = (kind, o, chain, tint) => { for (let i = 0; i < chain.length - 1; i++) tri(kind, o, chain[i], chain[i + 1], tint); };
    fan('asph', [-51.35, -44.65], [[-51.35, -38.7], [-52.4, -39], [-55, -41], [-57, -44], [-58, -44.65]]);
    fan('asph', [-48, -50.5], [[-48, -44.65], [-58, -44.65], [-59, -45.3], [-61, -46.2], [-62.5, -47], [-62.5, -50.5]]);
    patQuad('dirt', -86, -62.5, -50.5, -47, YARD + 0.012, false, 0xd2cab0);
    [-50.6, -46.9].forEach(z9 => dBox(0.16, 1.9, 0.16, 0x8a9096, -86.2, YARD, z9, { far: true }));
    dBox(0.05, 1.5, 3.5, 0x9aa0a6, -86.2, YARD + 0.1, -48.75, { far: true });
    patQuad('grass', -86, -53.5, -86, -50.5, YARD + 0.012, false, 0xc4d6ac);
    fan('grass', [-86, gz0 - 0.15], [[-86, -47], [-66, -47], [-66, -41.6], [-55.4, -41.6], [-55, -41], [-53.5, -39.85], [-53.5, gz0 - 0.15]], 0xc4d6ac);

    fan('grass', [-66, -41.6], [[-66, -47], [-62.5, -47], [-61, -46.2], [-59, -45.3], [-58, -44.65], [-57, -44], [-55.4, -41.6]], 0xc4d6ac);
    patQuad('asph', -53.5, -48, -62.4, -50.5, YARD + 0.012, false, 0xe4e2dc);
    { const Y9 = YARD, FX9 = -53.65, FZ9 = -62.25, LG9 = 0xa8c858, NA9 = o => ({ ...(o || {}), at: [-50.5, -56.5] });
      meshFence(FX9, -50.7, FX9, FZ9, Y9, 1.5, FNC, FNP, true, 0, true); meshFence(FX9, FZ9, -48.2, FZ9, Y9, 1.5, FNC, FNP, true, 0, true);
      [[-55.7, -52.8, 1.35], [-56.5, -58.4, 1.2]].forEach(([x9, z9, s9]) => objScope('tree', () => {
        colliders.push({ x0: x9 - 0.2, x1: x9 + 0.2, y0: Y9, y1: Y9 + 12, z0: z9 - 0.2, z1: z9 + 0.2 });
        dCyl(0.14 * s9, 0.22 * s9, 5.2 * s9, 0x5f5044, x9, Y9, z9, { far: true, seg: 6 });
        [[0, 4.2, 0, 1.6, 1.5], [0.3, 5.8, -0.2, 1.3, 1.4], [-0.1, 7.1, 0.1, 0.9, 1.1]].forEach(([ox, oy, oz, r, sy], k) => dBlob(r * s9, r * sy * s9, r * s9, [0x6f9a3c, 0x7aa545, 0x86ae4c][k], x9 + ox, Y9 + oy * s9, z9 + oz, { far: true, chunky: true, ry: k + x9, jitter: 0.14 })); }));
      objScope('rack', () => { const x9 = -52.9, z9 = -51.2;
        [-0.5, 0.5].forEach(o => { dRod(x9 + o, Y9 + 0.1, z9 - 0.3, x9 + o, Y9 + 1.2, z9 - 0.3, 0.02, 0xc9ced3, NA9()); dRod(x9 + o, Y9 + 0.1, z9 + 0.3, x9 + o, Y9 + 1.2, z9 + 0.3, 0.02, 0xc9ced3, NA9()); });
        [0.12, 1.2].forEach(h => [-0.3, 0.3].forEach(o => dRod(x9 - 0.5, Y9 + h, z9 + o, x9 + 0.5, Y9 + h, z9 + o, 0.018, 0xc9ced3, NA9())));
        for (let k = -3; k <= 3; k++) dRod(x9 + k * 0.14, Y9 + 0.12, z9 - 0.3, x9 + k * 0.14, Y9 + 1.2, z9 - 0.3, 0.008, 0xc9ced3, NA9());
        colliders.push(noStand({ x0: x9 - 0.55, x1: x9 + 0.55, y0: Y9, y1: Y9 + 1.25, z0: z9 - 0.35, z1: z9 + 0.35 })); });
      objScope('cone', () => { const x9 = -51.8, z9 = -51.1;
        dCyl(0.03, 0.16, 0.68, 0xe0582a, x9, Y9 + 0.05, z9, { seg: 8, ...NA9() }); dCyl(0.1, 0.12, 0.1, 0xf4f4f0, x9, Y9 + 0.33, z9, { seg: 8, ...NA9() }); dBox(0.36, 0.05, 0.36, 0x2e2e30, x9, Y9, z9, NA9());
        colliders.push(noStand({ x0: x9 - 0.18, x1: x9 + 0.18, y0: Y9, y1: Y9 + 0.75, z0: z9 - 0.18, z1: z9 + 0.18 })); });
      { const WH = 0xf4f6f6, LY = Y9 + 0.022, HY = Y9 + 0.038, SX0 = -53.4, SX1 = -48.4, HZ0 = -51.8, HZ1 = -53.0, KZ1 = -56.3;
        [HZ0, HZ1, KZ1].forEach(z9 => addPanel(SX1 - SX0, 0.12, WH, (SX0 + SX1) / 2, LY, z9));
        for (let x9 = SX0 + 0.5; x9 < SX1 - 0.4; x9 += 0.6) byPanel(0.1, (HZ0 - HZ1 - 0.14) * 1.41, WH, x9, HY, (HZ0 + HZ1) / 2, Math.PI / 4);
        const cx9 = (SX0 + SX1) / 2 + 0.6, cz9 = (HZ1 + KZ1) / 2;
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; byPanel(0.07, 0.25, WH, cx9 + 0.05 + Math.cos(a) * 0.4, HY, cz9 + 0.25 + Math.sin(a) * 0.4, a); }
        addPanel(0.11, 0.65, WH, cx9 - 0.15, HY, cz9 - 0.2); addPanel(0.55, 0.11, WH, cx9 + 0.1, HY, cz9 + 0.07); addPanel(0.11, 0.4, WH, cx9 + 0.4, HY, cz9 + 0.3); addPanel(0.22, 0.22, WH, cx9 - 0.15, HY, cz9 - 0.72); }
      objScope('rack', () => { const X0 = -53.4, X1 = -51.1, Z0 = -61.9, Z1 = -56.5, H9 = 2.3, cx = (X0 + X1) / 2, R = (X1 - X0) / 2;
        [X0 + 0.08, X1 - 0.08].forEach(x9 => [Z0 + 0.1, Z1 - 0.1].forEach(z9 => { dRod(x9, Y9, z9, x9, Y9 + H9 - 0.4, z9, 0.05, 0xc9ced3, NA9()); post(x9, z9, Y9, Y9 + H9 - 0.4, 0.07); }));
        const arc = (z9, c9, r9) => { for (let i = 0; i < 6; i++) { const a0 = Math.PI * i / 6, a1 = Math.PI * (i + 1) / 6; dRod(cx - Math.cos(a0) * R, Y9 + H9 - 0.4 + Math.sin(a0) * 0.4, z9, cx - Math.cos(a1) * R, Y9 + H9 - 0.4 + Math.sin(a1) * 0.4, z9, r9, c9, NA9()); } };
        [Z0 + 0.1, (Z0 + Z1) / 2, Z1 - 0.1].forEach(z9 => arc(z9, LG9, 0.04));
        [X0 + 0.08, X1 - 0.08].forEach(x9 => dRod(x9, Y9 + H9 - 0.4, Z0, x9, Y9 + H9 - 0.4, Z1, 0.045, LG9, NA9()));
        { const roof = new THREE.CylinderGeometry(1, 1, Z1 - Z0 + 0.1, 8, 1, true, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).scale(R + 0.04, 0.4, 1);
          dGeo(roof, new THREE.Matrix4().makeTranslation(cx, Y9 + H9 - 0.4, (Z0 + Z1) / 2), 0x8a2a7a, NA9()); dGeo(roof.clone().scale(-0.985, 0.985, 1), new THREE.Matrix4().makeTranslation(cx, Y9 + H9 - 0.4, (Z0 + Z1) / 2), 0x6a2060, NA9()); }
        let zl9 = Z0 + 0.6; for (let z9 = Z0 + 0.6; z9 < Z1 - 0.4; z9 += 0.7) { zl9 = z9; dRod(X0 + 0.3, Y9, z9, X0 + 0.3, Y9 + 0.7, z9, 0.02, 0xb9bec2, NA9()); dRod(X0 + 0.3, Y9 + 0.7, z9, X0 + 0.9, Y9 + 0.7, z9, 0.02, 0xb9bec2, NA9()); dRod(X0 + 0.9, Y9, z9, X0 + 0.9, Y9 + 0.7, z9, 0.02, 0xb9bec2, NA9()); }
        colliders.push(noStand({ x0: X0 + 0.26, x1: X0 + 0.94, y0: Y9, y1: Y9 + 0.75, z0: Z0 + 0.56, z1: zl9 + 0.04 }));
        colliders.push({ x0: X0, x1: X1, y0: Y9 + H9 - 0.4, y1: Y9 + H9 + 0.05, z0: Z0, z1: Z1, nc: true }); });
      { const X0 = -51.0, X1 = -48.4, Z0 = -61.9, Z1 = -59.4, H9 = 2.3;
        addBox(X1 - X0, H9, Z1 - Z0, 0xe9ebe8, (X0 + X1) / 2, Y9, (Z0 + Z1) / 2);
        dBox(X1 - X0 + 0.3, 0.1, Z1 - Z0 + 0.3, 0x2f62b0, (X0 + X1) / 2, Y9 + H9, (Z0 + Z1) / 2, NA9());
        dBox(1.0, 2.0, 0.04, 0xf6f6f2, X1 - 0.75, Y9 + 0.05, Z1 + 0.02, NA9()); dBox(0.04, 0.16, 0.04, 0x8a9096, X1 - 1.15, Y9 + 1.0, Z1 + 0.06, NA9());
        for (let k = 0; k < 5; k++) dRod(X0 + 0.25 + k * 0.28, Y9 + 0.3, Z1 + 0.03, X0 + 0.25 + k * 0.28, Y9 + 1.9, Z1 + 0.03, 0.012, 0x8a9096, NA9());
        dBox(1.3, 0.04, 0.04, 0x8a9096, X0 + 0.81, Y9 + 1.9, Z1 + 0.03, NA9());
        for (let z9 = Z0 + 0.45; z9 < Z1 - 0.2; z9 += 0.45) dBox(0.03, H9 - 0.1, 0.04, 0xd2d5d2, X1 + 0.015, Y9 + 0.05, z9, NA9());
        sign('분리수거', X1 - 0.75, Y9 + 2.15, Z1 + 0.03, 0, 0.18, { bg: '#2f62b0', fg: '#ffffff' }); }
      objScope('bin', () => { const x9 = -49.0, z9 = -58.2;
        dBox(1.3, 1.05, 1.0, 0x80868c, x9, Y9 + 0.15, z9, NA9()); dBox(1.36, 0.08, 1.06, 0xc8423a, x9, Y9 + 1.2, z9, NA9());
        [-0.5, 0.5].forEach(o => [-0.35, 0.35].forEach(p9 => dCyl(0.08, 0.08, 0.06, 0x26282c, x9 + o, Y9 + 0.07, z9 + p9, { seg: 8, rot: [Math.PI / 2, 0, 0], ...NA9() })));
        colliders.push(noStand({ x0: x9 - 0.66, x1: x9 + 0.66, y0: Y9, y1: Y9 + 1.28, z0: z9 - 0.5, z1: z9 + 0.5 })); });
    }
    for (let x = -84; x <= -58; x += 6.5) for (let z = -84; z <= -38.5; z += 6.5) { const sk = R9(), jx = jit() * 2.2, jz = jit() * 2.2, sc = 0.75 + R9() * 0.7;
      const keep = z >= -46 ? x <= -77.5 : z > -62 ? false : sk > 0.55;
      if (sk > 0.15 && keep) bgTree(x + jx, z + jz, sc); }
    { const R8 = seeded(8123);
      for (let z = -60.5; z <= -53; z += 3.75) for (let x = -86.5; x <= -59.5; x += 4.5) bgTree(x + (R8() - 0.5) * 1.6, z + (R8() - 0.5) * 1.2, 1.1 + R8() * 0.4);
      for (let z = -44; z <= -24; z += 5) bgTree(-87.2 + (R8() - 0.5) * 0.4, z + (R8() - 0.5) * 1.5, 1.1 + R8() * 0.2); }
    for (let z = 20; z <= 60; z += 5.5) { const jx9 = jit() * 0.3, zz = z + jit(), sc9 = 0.8 + R9() * 0.25;
      const xw9 = zz > 40 ? (Math.max(-50.5, -50.5 + 7.9 * (zz - 43.5) / 25.8) + (-58 + (zz - 3) * 5 / 74)) / 2 : -53.6;
      bgTree(xw9 + jx9, zz, sc9 * (zz > 40 ? 0.72 : 0.85)); if (zz > 40) colliders[colliders.length - 1].nc = true; }
    for (let z = -38; z <= 30; z += 7) bgTree(55 + jit() * 0.8, z + jit(), 0.9 + R9() * 0.35);
    for (let z = -84; z <= -58; z += 6.5) bgTree(58.5 + jit() * 0.4, z + jit(), 0.85 + R9() * 0.3);

  }

  {
    const BND = SCHOOL.boundary, [gtx, gtz] = SCHOOL.gate;
    const Y = FIELD;

    const diagWall = (x0, z0, x1, z1, yb, H) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3);
      for (let i = 0; i < n; i++) { const ax = x0 + (x1 - x0) * i / n, az = z0 + (z1 - z0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, bz = z0 + (z1 - z0) * (i + 1) / n;
        colliders.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, y0: yb, y1: yb + Math.max(4.5, H + 0.3), z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, nc: true }); } };

    const ornPos = [], ornUV = [];
    const ornFence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ya = Y + 0.3, yb2 = Y + 1.55;
      const P = [[x0, ya, z0], [x1, ya, z1], [x1, yb2, z1], [x0, yb2, z0]], U = [[0, 0], [L / 2, 0], [L / 2, 1], [0, 1]];
      for (const i of [0, 1, 2, 0, 2, 3]) { ornPos.push(...P[i]); ornUV.push(...U[i]); }
      slab(x0, z0, x1, z1, 0.25, 0.3, 0xbdb9b0, Y, { far: true });
      const n = Math.max(1, Math.round(L / 2));
      for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
        dBox(0.1, 1.3, 0.1, 0xf6f6f2, px, Y + 0.3, pz, { far: true }); dBox(0.16, 0.06, 0.16, 0xe9e9e4, px, Y + 1.6, pz, { far: true }); }
      diagWall(x0, z0, x1, z1, Y, 1.6); };
    for (let i = 0; i < BND.length; i++) {
      const [x0, z0] = BND[i], [x1, z1] = BND[(i + 1) % BND.length];
      if (z0 === gtz && z1 === gtz && Math.abs((x0 + x1) / 2 - gtx) < 1) continue;
      if (z0 === gtz || z1 === gtz) { ornFence(x0, z0, x1, z1); continue; }
      const yb = (x, z) => terrainAt(x, z);
      if (z0 < -70 && z1 < -70 && Math.min(x0, x1) > -49.5) { whiteFence(x0, z0, x1, z1, YARD); continue; }
      if (Math.abs(x1 - gtx) < 0.01 && Math.abs(z1 - gtz) < 0.01) { const t = 1 - 4.5 / Math.hypot(x1 - x0, z1 - z0); meshFence(x0, z0, x0 + (x1 - x0)*t, z0 + (z1 - z0)*t, yb(x0, z0), 1.8); continue; }
      if (Math.abs(x0 - gtx) < 0.01 && Math.abs(z0 - gtz) < 0.01) { const t = 4.5 / Math.hypot(x1 - x0, z1 - z0); meshFence(x0 + (x1 - x0)*t, z0 + (z1 - z0)*t, x1, z1, yb(x1, z1), 1.3, 0xf6f6f2, 0xe9e9e4); continue; }

      if (z0 === TR3.gymSouthZ && z1 === TR3.gymSouthZ) continue;
      if (x0 === -86 && x1 === -86 && z0 === TR3.gymSouthZ) { meshFence(-86, z0, -86, -4.0, YARD, 1.8, undefined, undefined, true, 0, true); meshFence(-86, SCHOOL.gym.center[1] - SCHOOL.gym.depth / 2 - 1.2, -86, z1, YARD, 1.8, undefined, undefined, true, 0, true); continue; }
      const ya = yb(x0 + (x1 - x0) * 0.02, z0 + (z1 - z0) * 0.02), yc = yb(x0 + (x1 - x0) * 0.98, z0 + (z1 - z0) * 0.98);
      if (Math.abs(x1 - x0) > 0.3 && Math.abs(z1 - z0) > 0.3) { meshFence(x0, z0, x1, z1, ya, 1.8, undefined, undefined, false); diagWall(x0, z0, x1, z1, ya, 1.8); continue; }
      if (ya === yc) meshFence(x0, z0, x1, z1, ya, 1.8);
      else { const zc = x0 < TR3.westX ? TR3.westZ : TERR_Z, t = (zc - z0) / (z1 - z0); meshFence(x0, z0, x0 + (x1 - x0)*t, zc, ya, 1.8); meshFence(x0 + (x1 - x0)*t, zc, x1, z1, yc, 1.8); }
    }
    if (ornPos.length) {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const g9 = cv.getContext('2d');
      g9.strokeStyle = '#ffffff'; g9.lineWidth = 7; g9.lineCap = 'round';
      g9.beginPath(); g9.moveTo(0, 8); g9.lineTo(256, 8); g9.moveTo(0, 150); g9.lineTo(256, 150); g9.stroke();
      g9.lineWidth = 5; for (let x = 16; x < 256; x += 32) { g9.beginPath(); g9.moveTo(x, 150); g9.lineTo(x, 62); g9.stroke(); }
      g9.lineWidth = 6; [0, 128].forEach(ox => { g9.beginPath(); g9.arc(ox + 64, 64, 60, Math.PI, 0); g9.stroke();
        g9.lineWidth = 4; [[ox + 34, 1], [ox + 94, -1]].forEach(([cx, s]) => { g9.beginPath(); g9.arc(cx, 44, 14, 0, Math.PI * 1.6 * s, s < 0); g9.stroke(); }); g9.lineWidth = 6; });
      g9.fillStyle = '#e04848'; [[64, 30], [192, 30]].forEach(([x, y]) => { g9.beginPath(); g9.arc(x, y, 12, 0, 7); g9.fill(); });
      g9.fillStyle = '#f2c230'; [[32, 96], [96, 96], [160, 96], [224, 96]].forEach(([x, y]) => { g9.beginPath(); g9.arc(x, y, 9, 0, 7); g9.fill(); });
      const ot = new THREE.CanvasTexture(cv); ot.wrapS = THREE.RepeatWrapping; ot.colorSpace = THREE.SRGBColorSpace; ot.anisotropy = 4;
      const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(ornPos, 3)); og.setAttribute('uv', new THREE.Float32BufferAttribute(ornUV, 2));
      og.computeVertexNormals(); og.computeBoundingSphere();
      const om = new THREE.Mesh(og, new THREE.MeshLambertMaterial({ map: ot, alphaTest: 0.5, side: THREE.DoubleSide }));
      om.matrixAutoUpdate = false; scene.add(om);
    }

    const GC = 0xdad8d2, GW = SWA[0] + 0.6, GE = BND.find(p => p[1] === gtz && p[0] > gtx)[0] - 0.6;
    [GW, GE].forEach(px9 => {
      addBox(1.3, 0.15, 1.0, 0xb3b0a8, px9, Y, gtz);
      addBox(1.2, 1.2, 0.2, GC, px9, Y + 0.15, gtz - 0.35); addBox(1.2, 1.2, 0.2, GC, px9, Y + 0.15, gtz + 0.35);
      addBox(1.2, 0.65, 0.9, GC, px9, Y + 1.35, gtz);
      dBox(1.4, 0.12, 1.1, 0xbdbab3, px9, Y + 2.0, gtz, { far: true }); dBox(1.25, 0.1, 0.95, 0xc4c1ba, px9, Y + 2.12, gtz, { far: true });
      const bk = px9 < gtx ? -1 : 1;
      dBox(1.05, 0.04, 0.48, 0x55585c, px9 - bk * 0.075, Y + 0.15, gtz);
      addBox(0.15, 1.2, 0.5, 0x55585c, px9 + bk * 0.525, Y + 0.15, gtz);
    });
    colliders.push({ x0: GW + 0.6, x1: GE - 0.6, y0: Y, y1: Y + 4.5, z0: gtz - 0.1, z1: gtz + 0.1, nc: true });
    {
      const S9 = 0xcdd2d6, x00 = GE - 0.75;
      for (let k = 0; k < 10; k++) { const x9 = x00 - k * 0.3;
        [-0.25, 0.25].forEach(o => dRod(x9, Y + 0.08, gtz + o, x9, Y + 0.85, gtz + o, 0.022, S9));
        dGeo(new THREE.TorusGeometry(0.25, 0.022, 5, 10, Math.PI).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(x9, Y + 0.85, gtz), S9);
        dCyl(0.06, 0.06, 0.04, 0x26282c, x9, Y, gtz - 0.25, { seg: 8, rot: [0, 0, Math.PI / 2] });
        if (k < 9) [-0.25, 0.25].forEach(o => { dRod(x9, Y + 0.25, gtz + o, x9 - 0.3, Y + 0.75, gtz + o, 0.015, S9); dRod(x9, Y + 0.75, gtz + o, x9 - 0.3, Y + 0.25, gtz + o, 0.015, S9); }); }
      colliders.push(noStand({ x0: x00 - 2.75, x1: GE - 0.6, y0: Y, y1: Y + 1.1, z0: gtz - 0.32, z1: gtz + 0.32 }, 2.3));
    }

    const DX0 = SCHOOL.plaza.x[1], DX1 = DX0 + 4.4, PZ0 = SCHOOL.plaza.z[0];
    patQuad('asph', DX0, DX1, PZ0, gtz - 0.2, Y + 0.02, false, 0xe8e8e8);
    [DX0 + 0.2, DX1 - 0.2].forEach(lx => addPanel(0.15, gtz - 0.2 - PZ0 - 0.4, 0xeeeeea, lx, Y + 0.03, (PZ0 + gtz - 0.2) / 2));
    patQuad('pave', DX1, GE - 0.2, PZ0, gtz - 0.3, Y + 0.02);
    patQuad('pave', GE - 0.2, SCHOOL.forestPlay.x[0], PZ0, 47.1, Y + 0.02);

    { const IX = GE - 0.2, IZ = 49.3;
      addBox(0.15, 0.15, gtz - 0.6 - IZ, 0xb8b4ab, IX + 0.075, Y, (IZ + gtz - 0.6) / 2);
      [[0.5, 5.3, 0.45], [1.2, 4.2, 0.35], [0.4, 2.6, 0.4], [1.9, 5.6, 0.3], [2.6, 3.4, 0.38], [0.7, 1.2, 0.3]].forEach(([ox, oz, r]) => {
        dBlob(r * 1.3, r * 0.7, r, 0xbdb9b0, IX + ox, Y + r * 0.3, IZ + oz, { far: true, chunky: true, ry: ox * 3 });
        ellipseCols(IX + ox, IZ + oz, r * 1.3, r, ox * 3, Y, Y + r, 0.86); });
      [[1.0, 3.2], [1.6, 4.9], [0.6, 4.0], [2.3, 2.2], [1.4, 1.5]].forEach(([ox, oz]) => { dBlob(0.45, 0.55, 0.45, 0x7fa35a, IX + ox, Y + 0.4, IZ + oz, { jitter: 0.15 });
        softVols.push({ x0: IX + ox - 0.46, x1: IX + ox + 0.46, y0: Y - 0.2, y1: Y + 0.96, z0: IZ + oz - 0.46, z1: IZ + oz + 0.46, why: '억새(풀 — 걸어 들어감)' }); });
      const tallPine = (x, z, s = 1) => { const y = Y, R = seeded(Math.floor(Math.abs(x * 57 + z * 91)) + 3), lean = (R() - 0.5) * 0.14, a = R() * 6.28, H = 6.2 * s;
        colliders.push({ x0: x - 0.25, x1: x + 0.25, y0: y, y1: y + 12, z0: z - 0.25, z1: z + 0.25 });
        dCyl(0.13 * s, 0.22 * s, H, 0x8a5a3c, x, y, z, { far: true, rot: [lean * Math.sin(a), 0, lean * Math.cos(a)] });
        const tx = x + Math.cos(a) * H * lean * 0.9, tz = z - Math.sin(a) * H * lean * 0.9;
        [[H - 0.5, 2.3], [H + 0.6, 2.0], [H + 1.6, 1.4], [H - 1.4, 1.6]].forEach(([h, r], k) => { const ang = a + k * 2.1, d = k === 2 ? 0.2 : 0.9;
          dBlob(r * s, r * 0.36 * s, r * 0.85 * s, [0x3f6b3f, 0x4a7a46, 0x3a633b, 0x44743f][k], tx + Math.cos(ang) * d, y + h * s, tz + Math.sin(ang) * d, { far: true, jitter: 0.12, ry: ang }); }); };
      [[IX + 1.8, 52.0, 1.0], [IX + 3.6, 50.4, 1.1], [IX + 4.6, 53.0, 0.95], [IX + 7.0, 51.0, 1.15], [IX + 9.9, 50.2, 1.0], [IX + 12.2, 49.8, 1.1], [IX + 8.6, 52.3, 0.9]].forEach(([x9, z9, s9]) => tallPine(x9, z9, s9));
    }

    { const ax = SWA[0] - 3.1, az = fenceZ(ax) - 1.1, BW = 0x7a5c44;
      [-1.1, 1.1].forEach(o => { dBox(0.12, 2.4, 0.12, 0x6b5440, ax + o, Y, az); post(ax + o, az, Y, Y + 2.4, 0.08); });
      dBox(2.4, 1.5, 0.08, BW, ax, Y + 0.85, az);
      colliders.push(noStand({ x0: ax - 1.2, x1: ax + 1.2, y0: Y + 0.8, y1: Y + 2.4, z0: az - 0.06, z1: az + 0.06 }));
      dBox(1.05, 1.1, 0.03, 0x4f8fcf, ax - 0.55, Y + 0.95, az - 0.055); dBox(1.05, 1.1, 0.03, 0xf4f4f0, ax + 0.55, Y + 0.95, az - 0.055);
      dBox(0.7, 0.5, 0.03, 0x6fae5a, ax - 0.55, Y + 1.2, az - 0.085);
      for (let k = 0; k < 5; k++) dBox(0.8, 0.04, 0.03, 0x9a9a9a, ax + 0.55, Y + 1.15 + k * 0.16, az - 0.085);
      dBox(2.3, 0.3, 0.04, 0x2f6b46, ax, Y + 2.08, az - 0.06);
      sign(SCHOOL.name, ax - 0.3, Y + 2.23, az - 0.09, Math.PI, 0.22, { bg: '#2f6b46', fg: '#ffffff' });
      const lx = ax + 1.7, lz = az - 0.5;
      dCyl(0.09, 0.12, 5.0, 0x9aa0a6, lx, Y, lz, { far: true, seg: 8 }); post(lx, lz, Y, Y + 5, 0.12);
      dBox(0.3, 0.22, 0.5, 0x8a9096, lx, Y + 5.0, lz - 0.15, { far: true }); lamp(0.24, 0.04, 0.4, lx, Y + 4.97, lz - 0.15);
      dBox(0.16, 0.14, 0.26, 0xdfe3e8, lx + 0.12, Y + 3.6, lz - 0.2);
      dBlob(0.35, 0.3, 0.35, 0x9ccf3a, ax - 2.2, Y + 0.28, az + 0.1); dBlob(0.3, 0.26, 0.3, 0x93c636, ax - 3.0, Y + 0.24, az + 0.3);
      [[ax - 2.2, az + 0.1, 0.26], [ax - 3.0, az + 0.3, 0.22]].forEach(([x9, z9, r9]) => colliders.push(noStand({ x0: x9 - r9, x1: x9 + r9, y0: Y, y1: Y + 0.5, z0: z9 - r9, z1: z9 + r9 })));
    }

    { const bx = GE + 1.3, bz = gtz + 1.0;
      [0, 3.0].forEach(o => { dBox(0.1, 4.2, 0.1, 0x8a9096, bx + o, Y, bz, { far: true }); post(bx + o, bz, Y, Y + 4.2, 0.08); });
      [[2.4, 0xf0eee8, 0xe98fae], [3.3, 0xf0eee8, 0x8cc26a]].forEach(([y9, c9, s9]) => { dBox(2.9, 0.85, 0.03, c9, bx + 1.5, Y + y9, bz, { far: true });
        dBox(2.6, 0.18, 0.03, s9, bx + 1.5, Y + y9 + 0.5, bz - 0.03); dBox(1.8, 0.1, 0.03, 0xb9b9b9, bx + 1.5, Y + y9 + 0.2, bz - 0.03); });
      const sx = GE + 0.9, sz = gtz + 0.75;
      dCyl(0.05, 0.05, 3.2, 0x9aa0a6, sx, Y, sz, { seg: 6 }); post(sx, sz, Y, Y + 3.2, 0.06);
      dGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 20).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(sx, Y + 2.75, sz - 0.04), 0xf2c230, { far: true });
      dGeo(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 20).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(sx, Y + 2.75, sz - 0.07), 0xd83a3a, { far: true });
      sign('30', sx, Y + 2.75, sz - 0.095, Math.PI, 0.26, { bg: '#ffffff', fg: '#222222' });
      dBox(0.5, 0.3, 0.03, 0xf4f4f0, sx, Y + 2.2, sz - 0.05);
      dCyl(0.08, 0.1, 4.2, 0x9aa0a6, GE + 0.55, Y, gtz + 1.6, { far: true, seg: 8 }); post(GE + 0.55, gtz + 1.6, Y, Y + 4.2, 0.1);
      dBox(0.3, 0.15, 0.15, 0xdfe3e8, GE + 0.55, Y + 3.9, gtz + 1.42);
    }
    zones.push({ x0: Math.max(SWA[0], ...zones.filter(q => q.label === '버스 타는 곳').map(q => q.x1)), x1: GE + 0.6, z0: gtz - 4.5, z1: gtz - 0.1, y: Y, label: '정문' });
  }
  {
    const Y = FIELD;

    const [gx9, gz9] = SCHOOL.gate, SEA = SCHOOL.boundary.find(p => p[1] === gz9 && p[0] > gx9);
    floor4('redRd', [[SWA[0] - 0.9, fenceZ(SWA[0] - 0.9) + 0.2], [SEA[0], gz9 + 0.1], [SEA[0] + 7.4, 60], [SWA[0] + 0.6, 60]], Y + 0.012);
    floor4('redRd', [[SEA[0], gz9 + 0.1], [SEA[0] + 8.4, gz9 - 2.2], [SEA[0] + 7.4, 60], [SEA[0] + 7.4, 60]], Y + 0.012);
    floor4('redRd', [[SWA[0] + 0.6, 60], [SEA[0] + 7.4, 60], [SEA[0] + 6.4, 66], [SWA[0] + 4.6, 66]], Y + 0.012);
    floor4('redRd', [[SWA[0] + 4.6, 66], [SEA[0] + 6.4, 66], [SEA[0] + 6.4, 140], [SWA[0] + 6.6, 140]], Y + 0.012);
    addPanel(0.14, 74, 0xe8c547, (SWA[0] + SEA[0]) / 2 + 6, Y + 0.022, 103);
    { const mz = x => 48.3 + (55 - x) * 0.225;
      floor4('gravel', [[SEA[0] + 8.4, mz(SEA[0] + 8.4)], [62, mz(62)], [62, mz(62) + 3.2], [SEA[0] + 8.4, mz(SEA[0] + 8.4) + 3.2]], Y + 0.014); }
    { const px9 = SEA[0] + 14, pz9 = 61.3;
      addBox(6, 2.7, 5.5, 0xeef0ee, px9, Y, pz9);
      dBox(6.4, 0.15, 5.9, 0x9fb0b8, px9, Y + 2.7, pz9, { far: true });
      dBox(0.9, 2.0, 0.04, 0x8a9aa4, px9 - 1.5, Y, pz9 - 2.77, { far: true }); dBox(1.2, 0.8, 0.04, 0x5b7590, px9 + 1.2, Y + 1.1, pz9 - 2.77, { far: true }); }
    {
      const rows = (x0, x1, z0, z1, dz) => { for (let z = z0; z <= z1; z += dz) slab(x0, z, x1, z, 0.6, 0.35, 0x5f9a45, Y); };

      const FX9 = -5.5, FXW = -34;
      floor4('dirt', [[FX9, fenceZ(FX9) + 1.3], [SWA[0] - 1.2, fenceZ(SWA[0] - 1.2) + 1.3], [SWA[0] - 1.2, 67.8], [FX9, 67.8]], Y + 0.004, 0x9c8a60);
      floor4('dirt', [[FXW, fenceZ(FXW) + 1.3], [FX9, fenceZ(FX9) + 1.3], [FX9, 88], [FXW, 88]], Y + 0.004, 0x9c8a60);
      const rowT = (x0, x1, z) => slab(x0, z, x1, z, 0.75, 0.8, 0x4d8a3c, Y);
      for (let z = 61.2; z <= 67.2; z += 1.1) { const xa = Math.max(FX9 + 0.5, (58.513 + 1.8 - z) / 0.25321); if (SWA[0] - 1.6 - xa > 1) rowT(xa, SWA[0] - 1.6, z); }
      for (let z = 64.4; z <= 87.5; z += 1.1) { const xa = Math.max(FXW + 0.5, (58.513 + 1.8 - z) / 0.25321); if (FX9 - 0.4 - xa > 1) rowT(xa, FX9 - 0.4, z); }
      slab(SWA[0] - 0.5, fenceZ(SWA[0] - 0.5) + 0.75, -27, fenceZ(-27) + 0.75, 0.8, 0.04, 0xc9c4b8, Y, { far: true });
      patQuad('dirt', SEA[0] + 18, 64.5, 58, 100, Y + 0.004, false, 0x9c8a60); rows(SEA[0] + 18.4, 64.1, 58.6, 99.4, 1.2);
    }
    { const gx0 = -4.5, gx1 = 14.5, gz0 = 68.5, gz1 = 84;
      patQuad('dirt', gx0, gx1, gz0, gz1, Y + 0.004, false, 0xd6d5cc);
      for (let x = gx0 + 0.8; x < gx1 - 0.3; x += 1.3) slab(x, gz0 + 0.5, x, gz1 - 0.5, 0.7, 0.14, 0xe4e4de, Y); }
    const HOUSE = [[-64, 76, 0xd9c9b0, 0xa9503f], [-44, 81, 0xcfd6dc, 0x50606e], [-24, 86, 0xe0d3ba, 0x6f4a30], [4, 92, 0xe6d9c6, 0xa9503f], [70, 68, 0xdfd2bd, 0x6f4a30]];
    const PRISM = new THREE.CylinderGeometry(1, 1, 1, 3, 1).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2);
    HOUSE.forEach(([hx9, hz, wc, rc], i) => {
      if (i < 3) return;
      const d9 = i % 2 ? 7.4 : 6.2, h9 = i % 3 ? 5.2 : 6.6, rh = 1.6 + (i % 2) * 0.5, sy = rh / 1.5;
      addBox(9, h9, d9, wc, hx9, Y, hz);
      dGeo(PRISM, new THREE.Matrix4().compose(new THREE.Vector3(hx9, Y + h9 + 0.5 * sy, hz), new THREE.Quaternion(), new THREE.Vector3(9.8, sy, (d9 + 0.9) / 2 / 0.866)), rc, { far: true });
      addBox(1.1, 2.1, 0.2, 0x6d5340, hx9, Y, hz - d9/2 - 0.11, { collide: false });
      [-2.6, 2.6].forEach(ox => [1.0, 3.5].forEach(wy => {
        dBox(1.5, 1.2, 0.05, 0xf2f0ea, hx9 + ox, Y + wy - 0.06, hz - d9/2 - 0.025, { far: true }); dBox(1.3, 1.0, 0.05, 0x5b7590, hx9 + ox, Y + wy + 0.04, hz - d9/2 - 0.05, { far: true }); }));
    });
    {
      const x0 = -66.5, x1 = -48.8, z0 = 77.2, z1 = 88.8, H9 = 3.4, cx9 = (x0 + x1) / 2, cz9 = (z0 + z1) / 2, sy = 2.1 / 1.5;
      slab(x0, cz9, x1, cz9, z1 - z0, H9, 0xd9dad5, Y, { far: true });
      dGeo(PRISM, new THREE.Matrix4().compose(new THREE.Vector3(cx9, Y + H9 + 0.5 * sy, cz9), new THREE.Quaternion(), new THREE.Vector3(x1 - x0 + 0.8, sy, (z1 - z0 + 1.0) / 2 / 0.866)), 0x3a5570, { far: true });
      [x0 + 3, x0 + 9, x1 - 5].forEach(dx9 => slab(dx9 - 1.4, z0 - 0.03, dx9 + 1.4, z0 - 0.03, 0.06, 2.6, 0x8d949a, Y, { far: true }));
    }
    [[-34, 74, 1.0], [-36.5, 77.5, 1.1], [30, 72, 0.95], [40, 56, 0.9]].forEach(([tx9, tz9, s9]) => bgTree(tx9, tz9, s9));
    [[-49.2, 67.6, 0.95], [-44.6, 74.8, 0.9], [-40.2, 71.6, 0.95], [-48.2, 62.0, 0.8], [-37.5, 70.4, 0.75], [-46.8, 72.4, 0.8]].forEach(([tx9, tz9, s9]) => { bgTree(tx9, tz9, s9); colliders[colliders.length - 1].nc = true; });
    {

      const [ax9, az9] = [-70, 3], [bx9, bz9] = [-65, 77], L9 = Math.hypot(bx9 - ax9, bz9 - az9), phi = Math.atan2(bx9 - ax9, bz9 - az9);
      const WH = 3.2, RS = 2.9, BW = 8, RR9 = (BW * BW / 4 + RS * RS) / (2 * RS), AA = Math.asin(BW / 2 / RR9), YC9 = WH - RR9 * Math.cos(AA), NSG = 6, SL = L9 / NSG;
      const GWL = 0x8e9a98, GRF = 0xb0babf, GFR = 0x737c80, B9 = new THREE.Matrix4().compose(new THREE.Vector3(ax9, Y, az9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, phi, 0)), new THREE.Vector3(1, 1, 1));
      const W9 = (v, y, u) => new THREE.Vector3(v, y, u).applyMatrix4(B9);
      const at9 = (v, y, u, sx = 1, sy2 = 1, sz = 1) => B9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(v, y, u), new THREE.Quaternion(), new THREE.Vector3(sx, sy2, sz)));
      const _z9 = new THREE.Vector3(0, 0, 1), _t9 = new THREE.Vector3();
      let AT9 = null;
      const bar9 = (a, b, w, c, far) => { _t9.subVectors(b, a); const L = _t9.length(); _t9.divideScalar(L);
        dGeo(box_, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(_z9, _t9), new THREE.Vector3(w, w, L)), c, far ? { far: true, at: AT9 } : { at: AT9 }); };
      const arch = new THREE.CylinderGeometry(RR9, RR9, SL, 8, 1, true, Math.PI / 2 - AA, 2 * AA).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
      const rib = new THREE.TorusGeometry(RR9, 0.06, 3, 6, 2 * AA).rotateZ(Math.PI / 2 - AA);

      const FAT = [[-66, 21], [-62, 58]];
      for (let i = 0; i < NSG; i++) { const uc = (i + 0.5) * SL, u0 = i * SL, u1 = (i + 1) * SL, cw = W9(0, 0, uc); AT9 = [cw.x, cw.z];
        const F9 = { far: true, at: FAT[i < NSG / 2 ? 0 : 1] };
        [-1, 1].forEach(sg => dGeo(box_, at9(sg * (1.5 * BW - 0.03), WH / 2, uc, 0.06, WH, SL), GWL, F9));
        [-1, 0, 1].forEach(k => { dGeo(arch, at9(k * BW, YC9, uc), GRF, F9);
          bar9(W9(k * BW, WH + RS + 0.55, u0), W9(k * BW, WH + RS + 0.55, u1), 0.08, GFR, false);
          bar9(W9(k * BW, WH + RS - 0.05, u0 + 0.3), W9(k * BW, WH + RS + 0.55, u0 + 0.3), 0.06, GFR, false); });
        [-0.5, 0.5].forEach(k => bar9(W9(k * BW, WH - 0.04, u0), W9(k * BW, WH - 0.04, u1), 0.14, GFR, false));
        for (let u = u0 + 1.55, n9 = 0; u < u1 - 0.3; u += 3.1, n9++) { dGeo(rib, at9(BW, YC9, u), 0x5a6367, { at: AT9 });
          if (n9 % 2 === 0) bar9(W9(1.5 * BW + 0.02, 0, u), W9(1.5 * BW + 0.02, WH, u), 0.07, GFR, false); }
      }
      const endS = new THREE.Shape(); endS.moveTo(-1.5 * BW, 0); endS.lineTo(1.5 * BW, 0); endS.lineTo(1.5 * BW, WH);
      [1, 0, -1].forEach(k => endS.absarc(k * BW, YC9, RR9, Math.PI / 2 - AA, Math.PI / 2 + AA, false));
      endS.lineTo(-1.5 * BW, 0);
      const endG = new THREE.ShapeGeometry(endS, 6);
      { const c0 = W9(0, 0, SL / 2), c1 = W9(0, 0, L9 - SL / 2);
        dGeo(endG, at9(0, 0, L9 + 0.01), GWL, { far: true, at: [-62, 58] });
        dGeo(endG.clone().rotateY(Math.PI), at9(0, 0, -0.01), GWL, { far: true, at: [-66, 21] }); }
    }
    {

      const SB9 = SCHOOL.boundary, iS = SB9.findIndex(p => p[0] === -50.5 && p[1] === 43.5), E9 = SB9[iS - 1], S9b = SB9[iS];
      if (iS > 0 && E9[1] > S9b[1]) {
        const dx9 = S9b[0] - E9[0], dz9 = S9b[1] - E9[1], L0 = Math.hypot(dx9, dz9), tx = dx9 / L0, tz = dz9 / L0, nx = tz, nz = -tx;
        const U0 = -1.5, U1 = L0 + 1.5, cs = new THREE.Shape();
        cs.moveTo(0.35, 0); cs.lineTo(4.6, 0); cs.lineTo(3.6, 1.35); cs.lineTo(2.0, 1.25); cs.lineTo(0.35, 0);
        const bg9 = new THREE.ExtrudeGeometry(cs, { depth: U1 - U0, bevelEnabled: false, curveSegments: 1 });
        const bm9 = new THREE.Matrix4().makeBasis(new THREE.Vector3(nx, 0, nz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(tx, 0, tz)).setPosition(E9[0] + tx * U0, Y, E9[1] + tz * U0);
        dGeo(bg9, bm9, 0x7d8a58, { far: true });
        const P9 = (u, d) => [E9[0] + tx * u + nx * d, E9[1] + tz * u + nz * d], hB = d => d < 2 ? 1.25 * (d - 0.35) / 1.65 : 1.3;
        for (let u = U0 + 0.8, k = 0; u < U1 - 0.5; u += 2.2, k++) {
          const d1 = 1.0 + 0.3 * Math.sin(k * 2.3), [rx, rz] = P9(u, d1), rs = 0.32 + 0.1 * ((k * 7) % 3);
          if (k % 2 === 0) dBlob(rs * 1.3, rs * 0.8, rs, [0x9d988c, 0x8f8a7f, 0xa8a397][k % 3], rx, Y + hB(d1) + 0.05, rz, { chunky: true, far: true, ry: k });
          [[1.9, 1.05], [3.2, 1.15]].forEach(([d2, r2], j) => { const [sx, sz] = P9(u + j * 1.1, d2 + 0.25 * Math.sin(k + j)), rr = r2 * (0.85 + 0.3 * hash2(sx, sz));
            dBlob(rr, rr * 0.7, rr, [0x3f6f3a, 0x4a7a40, 0x36613a][(k + j) % 3], sx, Y + hB(d2) + rr * 0.35, sz, { chunky: true, far: true, jitter: 0.16, ry: k + j }); });
        }
      }
    }

    [[-58, 116, 26, 13, -2.3], [6, 124, 34, 16, -4.3], [62, 112, 24, 11, -3.3]].forEach(([mx, mz, mw, mh, my], i) => {
      for (let k = 0; k < 5; k++) { const t = k / 4 - 0.5, hh = mh * (1 - Math.abs(t) * 0.9) * (0.85 + hash2(mx + k, mz) * 0.3);
        dBlob(mw * 0.62, hh, mw * 0.5, [0x5f8a5a, 0x6a955f, 0x58804f][(i + k) % 3], mx + t * mw * 2.2, my, mz + (k % 2) * 3, { far: true, jitter: 0.1, ry: k, at: [mx, mz] }); }
    });
  }
  {
    const IN = 0.06;
    const bandX = (x0, x1, z, face, y, col = BLUE) => addBox(x1-x0-IN*2, 0.55, 0.2, col, (x0+x1)/2, y, z + face*0.14, { collide: false });
    const bandZ = (z0, z1, x, face, y, col = BLUE) => addBox(0.2, 0.55, z1-z0-IN*2, col, x + face*0.14, y, (z0+z1)/2, { collide: false });

  }
  zones.push({ x0: LOB_X0, x1: fx1, z0: fz0, z1: zCor, y: 0, label: '본관 복도' });
  zones.push({ x0: TR3.westX, x1: SCHOOL.bballSand.x, z0: FLD.z[0], z1: SCHOOL.southFenceZ, y: FIELD, label: '운동장' });

  { const ROOMS = new Set([...FR.rooms, ...wg.rooms, ...B.upper.rooms, ...B.eastWing.rooms].filter(r => !['hall', 'toilet', 'storage', 'stair'].includes(r.type)).map(r => r.name));
    for (const w of winLog) {
      if (!w.f) continue;
      const mid = (w.g0 + w.g1) / 2, px = w.ax === 'x' ? mid : w.line - w.f * 0.6, pz = w.ax === 'x' ? w.line - w.f * 0.6 : mid;
      const zn = zones.find(Z => px > Z.x0 && px < Z.x1 && pz > Z.z0 && pz < Z.z1 && Math.abs((Z.y ?? 0) - w.y0) < 0.5);
      if (!zn || !ROOMS.has(zn.label) || w.yt - w.yb < 0.9) continue;
      patWall('blind', w.ax, w.g0 + 0.06, w.g1 - 0.06, w.yt - 0.5, w.yt - 0.06, w.line - w.f * 0.18, -w.f);
    }
  }

  {
    const WOOD = 0xb88a58, PANEL = 0xf3e6c4, ROOF = 0xd9574a, PAPER = [0xfff6a8, 0xbfe3ff, 0xffc8d6], STY = { bg: '#fff4d6', fg: '#5a3e2c' };
    function infoBoard(key, label, x, z, face, opt = {}) {
      const ax = (face & 1) === 0, NX = face === 1 ? 1 : face === 3 ? -1 : 0, NZ = face === 2 ? 1 : face === 0 ? -1 : 0;
      const y = opt.y ?? tY(z, x), ry = ax ? 0 : Math.PI / 2;

      const put = (wa, h, dn, hex, a, y0, n) => ax ? dBox(wa, h, dn, hex, x + a, y0, z + n * NZ) : dBox(dn, h, wa, hex, x + n * NX, y0, z + a);
      const box = (a0, a1, y0, y1, n0, n1) => { const p0 = n0 * (ax ? NZ : NX), p1 = n1 * (ax ? NZ : NX), lo = Math.min(p0, p1), hi = Math.max(p0, p1);
        return ax ? { x0: x + a0, x1: x + a1, y0, y1, z0: z + lo, z1: z + hi } : { x0: x + lo, x1: x + hi, y0, y1, z0: z + a0, z1: z + a1 }; };
      if (opt.wall) {
        sign(label + ' 안내', x + NX * 0.03, y + opt.wall + 0.17, z + NZ * 0.03, ry, 0.2, STY);
      } else {
        const { w } = sign(label + ' 안내', x, y + 1.47, z, ry, 0.24, STY), W = Math.max(1.2, w + 0.1), PA = W / 2 + 0.07;
        put(W + 0.05, 0.62, 0.05, PANEL, 0, y + 0.66, 0);
        PAPER.forEach((c, i) => put(0.28, 0.2, 0.03, c, (i - 1) * (W / 3.2), y + 0.8 + (i % 2) * 0.16, 0.04));
        [-PA, PA].forEach(a => { put(0.09, 1.78, 0.09, WOOD, a, y, 0); colliders.push(box(a - 0.06, a + 0.06, y, y + 1.78, -0.06, 0.06)); });
        put(W + 0.5, 0.07, 0.36, ROOF, 0, y + 1.78, 0); put(W + 0.3, 0.05, 0.14, 0xb8433a, 0, y + 1.85, 0);
        colliders.push(box(-W / 2 - 0.03, W / 2 + 0.03, y + 0.66, y + 1.6, -0.06, 0.06));
      }
      tourSpots.push({ key, kind: 'board', label: label + ' 안내판', place: label, x, y, z, face, top: y + (opt.wall ? opt.wall : 1.95), wall: !!opt.wall });
    }

    infoBoard('forest', '숲놀이터', 30.2, 43.9, 0);
    infoBoard('garden', '텃밭', 18.0, -58.9, 2);
    infoBoard('playground', '놀이터', -36.5, 47.3, 0);
    infoBoard('cafeteria', '급식실', (B.kitchen.exitC + B.kitchen.doorC) / 2, B.front.z[0] + 0.15, 2, { wall: 2.3, y: 0 });
    infoBoard('field', '운동장', 6.0, -10.6, 2);
    infoBoard('bigtree', '큰 나무', 34.2, 25.8, 3);
    infoBoard('bus', '스쿨버스', 8.2, 47.4, 0);
  }

  {
    const zoneOf = n => zones.find(z => z.label === n);

    const TOPS = [0x4d7fd6, 0x3fa37a, 0xe8a33d, 0x8a6ad0, 0xd9574a, 0x5bb5c9, 0xf2d15c, 0xe0708a, 0x7a8a9a, 0xf08a5d, 0x6fbf73, 0xffffff];
    const BOTS = [0x2b3a55, 0x3d4f7a, 0x6b5b4a, 0x2f2f36, 0x5a6f8a, 0x8a8f99];
    const SKIN = [0xf5d3b0, 0xf1c9a0, 0xf7d6b5], HAIR = [0x3a2e28, 0x2a2220, 0x4a3426, 0x5b3f2e];
    const EYE = 0x2d2a33, MOUTH = 0x9a4a42;
    const NI = g => { const n = g.toNonIndexed(); g.dispose(); return n; };
    const HEADG = NI(new THREE.SphereGeometry(1, 10, 7).rotateY(Math.PI / 10));
    const S85 = NI(new THREE.SphereGeometry(1, 8, 5)), S64 = NI(new THREE.SphereGeometry(1, 6, 4)), S63 = NI(new THREE.SphereGeometry(1, 6, 3)), S53 = NI(new THREE.SphereGeometry(1, 5, 3)), EYEG = NI(new THREE.SphereGeometry(1, 8, 3).rotateX(Math.PI / 2));
    const TOPC = NI(new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI * 0.44));
    const BACKH = NI(new THREE.SphereGeometry(1, 8, 3, Math.PI, Math.PI, Math.PI * 0.43, Math.PI * 0.33));
    const BOBH = NI(new THREE.SphereGeometry(1, 10, 3, Math.PI * 0.75, Math.PI * 1.5, Math.PI * 0.4, Math.PI * 0.38));
    const HATG = NI(new THREE.SphereGeometry(1, 10, 3, 0, Math.PI * 2, 0, Math.PI * 0.5));
    const ARC = NI(new THREE.TorusGeometry(1, 0.16, 3, 5, Math.PI).rotateZ(Math.PI));
    const SKIRT = NI(new THREE.CylinderGeometry(0.72, 1, 1, 8, 1, true));
    const LAPG = NI(new THREE.SphereGeometry(1, 10, 3));
    const STICK = NI(new THREE.CylinderGeometry(1, 1, 1, 5, 1, true));

    const PILL = new Map();
    function pillG(r, len) {
      const key = Math.round(r * 400) + ':' + Math.round(len * 400); let g = PILL.get(key); if (g) return g;
      const N = 6, h = len / 2, R9 = [[-90, -h], [-40, -h], [0, -h], [0, h], [40, h], [90, h]].map(([a, yc]) => [a * Math.PI / 180, yc]), pos = [], nor = [];
      const P = (i, j) => { const [a, yc] = R9[i], f = j / N * Math.PI * 2, ca = Math.cos(a); return [[r * ca * Math.cos(f), yc + r * Math.sin(a), r * ca * Math.sin(f)], [ca * Math.cos(f), Math.sin(a), ca * Math.sin(f)]]; };
      const tri = (...v) => v.forEach(([p, n]) => { pos.push(...p); nor.push(...n); });
      for (let i = 0; i < 5; i++) for (let j = 0; j < N; j++) {
        const A = P(i, j), B9 = P(i, j + 1), C = P(i + 1, j + 1), D = P(i + 1, j);
        if (i > 0) tri(A, D, B9); if (i < 4) tri(B9, D, C);
      }
      g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      PILL.set(key, g); return g;
    }

    const HP = HEADG.attributes.position, _ry = new THREE.Ray(), _ha = new THREE.Vector3(), _hb = new THREE.Vector3(), _hc = new THREE.Vector3(), _ht = new THREE.Vector3();
    const headT = (dx, dy, dz) => { _ry.origin.set(0, 0, 0); _ry.direction.set(dx, dy, dz).normalize();
      for (let i = 0; i < HP.count; i += 3) if (_ry.intersectTriangle(_ha.fromBufferAttribute(HP, i), _hb.fromBufferAttribute(HP, i + 1), _hc.fromBufferAttribute(HP, i + 2), false, _ht)) return _ht.length();
      return 1; };

    const faceZ = (R, x, y, inset) => { const ux = x / R[0], uy = y / R[1], uz = Math.sqrt(Math.max(0.05, 1 - ux * ux - uy * uy)); return R[2] * uz * headT(ux, uy, uz) - inset; };

    const KIDD = { hip: 0.35, legX: 0.078, legR: 0.056, T: [0.585, 0.165, 0.225, 0.135], PA: [0.37, 0.155, 0.1, 0.128], SH: [0.172, 0.745], armR: 0.048, armL: 0.25,
      HC: 1.055, HR: [0.27, 0.258, 0.252], thigh: 0.19, shin: 0.2, floorLeg: 0.3, shoe: [0.066, 0.048, 0.1] };
    const ADD = { hip: 0.58, legX: 0.092, legR: 0.066, T: [0.83, 0.192, 0.28, 0.148], PA: [0.6, 0.18, 0.1, 0.142], SH: [0.2, 1.04], armR: 0.056, armL: 0.39,
      HC: 1.33, HR: [0.235, 0.226, 0.222], thigh: 0.29, shin: 0.4, floorLeg: 0.46, shoe: [0.07, 0.05, 0.115] };
    const _W9 = new THREE.Matrix4(), _M9 = new THREE.Matrix4(), _q9 = new THREE.Quaternion(), _e9 = new THREE.Euler(), _v9 = new THREE.Vector3(), _s9 = new THREE.Vector3(), _u9 = new THREE.Vector3(), _Y9 = new THREE.Vector3(0, 1, 0);
    const YAW = [Math.PI, Math.PI / 2, 0, -Math.PI / 2];

    const footRect = (x, z, face, s, x0, x1, z0, z1) => { const f = face & 3, c = Math.round(Math.cos(YAW[f])), n = Math.round(Math.sin(YAW[f]));
      const xs = [], zs = []; for (const lx of [x0, x1]) for (const lz of [z0, z1]) { xs.push(x + (lx * c + lz * n) * s); zs.push(z + (-lx * n + lz * c) * s); }
      return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
    const pplBox = [];
    let npcN = 0;
    function person(x, y, z, sex, s = 1, face = 2, pose = 'stand', o = {}) {
      if (pose === true) pose = 'sit';
      const sink = !!PSINK;
      let rec = null, c0 = colliders.length;
      if (!sink) { npcN++; rec = { id: PEOPLE.length, x, y, z, sex, s, face: face & 3, pose, o: { ...o }, parts: [], cols: null, sign: -1, name: null, signY: 0 }; PEOPLE.push(rec); PREC = rec.id; }
      const D = s > 1.05 ? ADD : KIDD, adult = D === ADD, girl = sex === '여';
      const HX = o._hx ?? x, HZ = o._hz ?? z;
      const h1 = hash2(HX, HZ), h2 = hash2(HZ, HX), pick = (a, h) => a[Math.floor(h * a.length) % a.length];
      let top = pick(TOPS, h1), bot = pick(BOTS, h2);
      const skin = pick(SKIN, h1 * 7 % 1), hair = pick(HAIR, h2 * 5 % 1), style = Math.floor(h2 * 13 % 1 * 3);
      if (o.role === 'cleaner') { top = 0x5e7a8e; bot = 0x3b4a5c; }
      if (o.role === 'pe') { top = 0x2f6fd0; bot = 0x24324a; }
      if (o.role === 'sci') { top = 0xf4f4ee; bot = 0x3d4f7a; }
      if (o.role === 'principal') { top = 0x2c3a58; bot = 0x2c3a58; }
      const SHOE = adult ? 0x3a3d44 : 0xf6f6f2;
      _W9.compose(_v9.set(x, y, z), _q9.setFromEuler(_e9.set(0, YAW[face & 3], 0)), _s9.set(s, s, s));
      const W = _W9.clone();
      const put = (geo, p, sc, hex, r) => { _M9.compose(_v9.set(p[0], p[1], p[2]), _q9.setFromEuler(_e9.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0)), _s9.set(sc[0], sc[1], sc[2])); _M9.premultiply(W); dGeo(geo, _M9, hex, { smooth: true }); };
      const limb = (a, b, r, hex, geo) => { _u9.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = Math.max(0.001, _u9.length()); _u9.divideScalar(L);
        _M9.compose(_v9.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _q9.setFromUnitVectors(_Y9, _u9), geo ? _s9.set(r, geo === STICK ? L : L / 2 + r * 0.4, r) : _s9.set(1, 1, 1));
        _M9.premultiply(W); dGeo(geo || pillG(r, L), _M9, hex, { smooth: true }); };

      const seat = (o.seat ?? 0.46) / s;
      let dy = 0, bz = 0;
      if (pose === 'sit') { dy = seat + D.legR * 0.9 - D.hip; bz = 0.02; }
      else if (pose === 'sitFloor') dy = D.legR + 0.005 - D.hip;
      const hipY = D.hip + dy, shY = D.SH[1] + dy, legC = girl && !adult || girl && adult && h1 < 0.5 ? skin : bot, skirt = girl && legC === skin;

      [-1, 1].forEach(sd => {
        const lx = sd * D.legX; PPART = sd < 0 ? 1 : 2;
        if (pose === 'sit') {
          const kz = bz + D.thigh, fy = adult ? 0.08 : Math.max(0.1, hipY - D.shin);
          limb([lx, hipY, bz - 0.02], [lx * 1.08, hipY, kz], D.legR, legC); limb([lx * 1.08, hipY, kz], [lx * 1.08, fy, kz + 0.04], D.legR * 0.92, legC);
          put(S63, [lx * 1.08, fy - 0.02, kz + 0.07], D.shoe, SHOE);
        } else if (pose === 'sitFloor') {
          const fz = D.floorLeg;
          limb([lx, hipY, 0], [lx * 1.5, D.legR, fz], D.legR, legC);
          put(S63, [lx * 1.5, D.legR + 0.03, fz + 0.03], [D.shoe[0], D.shoe[2], D.shoe[1]], SHOE);
        } else {
          const fz = pose === 'sweep' ? sd * -0.07 : 0;
          limb([lx, hipY, 0], [lx, 0.09, fz], D.legR, legC);
          put(S63, [lx, 0.045, fz + 0.035], D.shoe, SHOE);
        }
      });
      PPART = 0;

      if (skirt) { if (pose === 'sit' || pose === 'sitFloor') put(LAPG, [0, hipY + 0.02, bz + D.thigh * 0.3], [D.PA[1] * 1.2, D.legR * 1.3, D.thigh * 0.72], bot);
        else put(SKIRT, [0, hipY - 0.02, 0], [D.PA[1] * 1.28, adult ? 0.32 : 0.2, D.PA[3] * 1.3], bot); }
      if (!skirt) put(S64, [0, D.PA[0] + dy, bz], [D.PA[1], D.PA[2], D.PA[3]], bot);
      put(S85, [0, D.T[0] + dy, bz], [D.T[1], D.T[2], D.T[3]], top);
      if (o.role === 'cook') put(S64, [0, D.T[0] + dy - 0.05, bz + D.T[3] * 0.62], [D.T[1] * 0.86, D.T[2] * 0.98, D.T[3] * 0.55], 0xf7f7f2);
      if (o.role === 'principal') { put(S64, [0, D.T[0] + dy + D.T[2] * 0.5, bz + D.T[3] * 0.6], [D.T[1] * 0.34, D.T[2] * 0.42, D.T[3] * 0.5], 0xf7f7f2);
        put(S64, [0, D.T[0] + dy + D.T[2] * 0.22, bz + D.T[3] * 0.7], [D.T[1] * 0.11, D.T[2] * 0.62, D.T[3] * 0.42], 0xc0392b); }

      const hands = [-1, 1].map(sd => {
        const sx = sd * D.SH[0], L = D.armL;
        if (pose === 'sit' && o.desk != null) return [sd * 0.13, Math.max((o.desk - y) / s + D.armR * 0.8, shY - L * 0.9),
                                                     bz + (o.reach ?? 0.3) / s + 0.04];
        if (pose === 'sit' || pose === 'sitFloor') return [sd * (D.legX + 0.05), hipY + D.legR + 0.05, bz + (pose === 'sit' ? D.thigh * 0.6 : D.floorLeg * 0.5)];
        if (pose === 'work') return [sd * 0.12, shY - L * 0.4, L * 0.85];
        if (pose === 'sweep') return sd > 0 ? [0.07, shY - L * 0.3, L * 0.55] : [0.0, shY - L * 0.85, L * 0.7];
        if (pose === 'explain' && sd > 0) return [sx + 0.12, shY + L * 0.45, L * 0.35];
        if (pose === 'wave' && sd > 0) return [sx + 0.16, shY + L * 0.92, 0.08];
        if (pose === 'cheer') return [sx + sd * 0.14, shY + L * 0.9, 0.06];
        return [sx + sd * 0.05, shY - L, 0.01];
      });
      [-1, 1].forEach((sd, k) => {
        const S = [sd * D.SH[0], shY, bz], Hn = hands[k]; PPART = sd < 0 ? 3 : 4;
        if (adult) { const d9 = Math.hypot(Hn[0] - S[0], Hn[1] - S[1], Hn[2] - S[2]), t = Math.max(0.3, 1 - D.armR * 1.1 / d9);
          limb(S, [S[0] + (Hn[0] - S[0]) * t, S[1] + (Hn[1] - S[1]) * t, S[2] + (Hn[2] - S[2]) * t], D.armR, top); put(S53, Hn, [D.armR * 1.3, D.armR * 1.35, D.armR * 1.3], skin); }
        else { const t = 0.3, E = [S[0] + (Hn[0] - S[0]) * t, S[1] + (Hn[1] - S[1]) * t, S[2] + (Hn[2] - S[2]) * t];
          limb(S, E, D.armR * 1.3, top, S63); limb(E, Hn, D.armR, skin); }
      });
      PPART = 0;

      if (o.role === 'cook') { const Hn = hands[1]; limb([Hn[0], Hn[1] - 0.02, Hn[2]], [Hn[0] + 0.02, Hn[1] + 0.26, Hn[2] + 0.1], 0.012, 0xc9ced3, STICK);
        put(S53, [Hn[0], Hn[1] - 0.06, Hn[2] + 0.02], [0.06, 0.045, 0.06], 0xc9ced3); }
      if (o.role === 'pe') { const Hn = hands[0];
        put(S85, [Hn[0] - 0.1, Hn[1] + 0.1, Hn[2] + 0.02], [0.12, 0.12, 0.12], 0xe8752a);
        const wz = D.T[3] + 0.012, wy = D.T[0] + dy + D.T[2] * 0.25; put(S53, [0.035, wy, bz + wz], [0.03, 0.022, 0.034], 0xf2c230);
        [-1, 1].forEach(sd => limb([0.035 + sd * 0.012, wy + 0.01, bz + wz - 0.004], [sd * 0.07, shY + 0.02, bz + D.T[3] * 0.55], 0.004, 0xd9574a, STICK)); }
      if (o.role === 'ai') { const Hn = hands[0];
        put(S64, [Hn[0] + 0.05, Hn[1] + 0.08, Hn[2] + 0.07], [0.1, 0.13, 0.012], 0x2a2d33, [-0.35, 0, 0]);
        put(S64, [Hn[0] + 0.05, Hn[1] + 0.082, Hn[2] + 0.078], [0.085, 0.112, 0.006], 0x5bb5e8, [-0.35, 0, 0]); }
      if (o.role === 'sci') put(SKIRT, [0, hipY - 0.2, 0], [D.PA[1] * 1.35, 0.3, D.PA[3] * 1.4], top);
      let broom = null;
      if (pose === 'sweep') { const [Lh, R] = hands, dv = [Lh[0] - R[0], Lh[1] - R[1], Lh[2] - R[2]], t = (R[1] - 0.09) / (R[1] - Lh[1]), E = [R[0] + dv[0] * t, 0.09, R[2] + dv[2] * t];
        limb([R[0] - dv[0] * 0.35, R[1] - dv[1] * 0.35, R[2] - dv[2] * 0.35], E, 0.016, 0xb88a58, STICK); broom = E;
        put(S64, [E[0], 0.06, E[2] + 0.02], [0.17, 0.06, 0.07], 0xe0b04a); put(S53, [E[0], 0.1, E[2]], [0.11, 0.04, 0.05], 0x4a8ad0); }

      const R = D.HR, HC = D.HC + dy, H = (p, sc, hex, r) => put(p[3] || HEADG, [p[0], HC + p[1], bz + p[2]], sc, hex, r);
      put(HEADG, [0, HC, bz], R, skin);
      const k = R[0] / 0.27, ex = 0.087 * k, ey = -0.036 * k, eS = adult ? [0.025, 0.037, 0.018] : [0.027, 0.041, 0.019];
      [-1, 1].forEach(sd => put(EYEG, [sd * ex, HC + ey, bz + faceZ(R, ex, ey, 0.008)], eS, EYE));
      const my = -0.086 * k; put(ARC, [0, HC + my + 0.012 * k, bz + faceZ(R, 0, my, 0.004)], [0.034 * k, 0.026 * k, 0.018], MOUTH);
      if (!adult) { const cx9 = 0.152 * k, cy9 = -0.075 * k; [-1, 1].forEach(sd => put(S53, [sd * cx9, HC + cy9, bz + faceZ(R, cx9, cy9, 0.01)], [0.036, 0.02, 0.012], 0xf5c4b0, [0, sd * 0.55, 0])); }

      if (o.role === 'cook') {
        put(HATG, [0, HC + 0.01, bz - 0.005], [R[0] * 1.14, R[1] * 1.3, R[2] * 1.14], 0xfbfbf7, [-0.1, 0, 0]);
        put(BACKH, [0, HC - 0.01, bz], [R[0] * 1.06, R[1] * 1.04, R[2] * 1.06], hair);
      } else {
        put(TOPC, [0, HC + 0.004, bz], [R[0] * 1.08, R[1] * 1.08, R[2] * 1.08], hair);
        if (girl && (style === 0 || adult && style !== 1)) put(BOBH, [0, HC - (adult ? 0.03 : 0.01), bz - 0.004], [R[0] * 1.12, R[1] * (adult ? 1.2 : 1.1), R[2] * 1.12], hair);
        else put(BACKH, [0, HC, bz - 0.004], [R[0] * 1.06, R[1] * 1.06, R[2] * 1.06], hair);
        if (girl) {
          const band = pick(TOPS, h2 * 3 % 1);
          if (style === 1) { put(S53, [0, HC + (adult ? -0.08 : 0.04), bz - R[2] * 1.12 - 0.04], [0.065, adult ? 0.12 : 0.13, 0.065], hair, [-0.35, 0, 0]);
            put(S53, [0, HC + (adult ? -0.01 : 0.12), bz - R[2] * 1.05], [0.04, 0.035, 0.04], band); }
          else if (style === 2 && !adult) [-1, 1].forEach(sd => { put(S53, [sd * R[0] * 1.08, HC - 0.07, bz - 0.06], [0.06, 0.1, 0.06], hair, [0, 0, sd * 0.25]); });
          else if (style === 2) put(S64, [0, HC + 0.15, bz - R[2] * 0.95], [0.1, 0.09, 0.09], hair);
        } else put(S53, [0.02, HC + R[1] * 1.08, bz - 0.02], [0.028, 0.045, 0.026], hair, [0, 0, -0.5]);
      }

      const hw = 0.22 * s, topY = y + (HC + R[1] * 1.1) * s, y1 = Math.max(y + 1.6, y + 1.5 * s + 0.1);
      if (sink) { PSINK.hipY = hipY * s; PSINK.shY = shY * s; PSINK.top = topY; return topY; }
      PREC = -1;
      if (pose === 'sitFloor') {
        const b = footRect(x, z, face, s, -0.24, 0.24, -0.4, D.floorLeg + 0.08); colliders.push({ ...b, y0: y, y1 }); pplBox.push(b); }
      else {
        if (broom) { const b = footRect(x, z, face, s, broom[0] - 0.2, broom[0] + 0.2, 0.15, broom[2] + 0.2); colliders.push({ ...b, y0: y, y1 }); pplBox.push(b); }
        colliders.push({ x0: x - hw, x1: x + hw, y0: y + (pose === 'sit' ? 0.85 : 0), y1, z0: z - hw, z1: z + hw }); pplBox.push({ x0: x - hw, x1: x + hw, z0: z - hw, z1: z + hw }); }
      rec.cols = colliders.slice(c0); rec.top = topY;
      return topY;
    }

    function freeSpot(zn) {
      const y = zn.y ?? 0;
      const near = allBoxes.filter(b => b.x1 > zn.x0 && b.x0 < zn.x1 && b.z1 > zn.z0 && b.z0 < zn.z1
                                     && b.y0 < y + 1.6 && b.y1 > y + 0.05).concat(pplBox);

      const dr = doors.filter(d => Math.abs(d.y0 - y) < 1 && d.cx > zn.x0 - 2 && d.cx < zn.x1 + 2 && d.cz > zn.z0 - 2 && d.cz < zn.z1 + 2);
      for (let z = zn.z1 - 1.0; z > zn.z0 + 0.9; z -= 0.7)
        for (let x = zn.x0 + 1.0; x < zn.x1 - 0.9; x += 0.9)
          if (!near.some(b => b.x1 > x - 0.34 && b.x0 < x + 0.34 && b.z1 > z - 0.26 && b.z0 < z + 0.26) && !dr.some(d => Math.hypot(d.cx - x, d.cz - z) < 1.4))
            return [x, z];
      return null;
    }

    const GUIDE = { '교장선생님': 'principal', '교감선생님': 'vice', '사서선생님': 'library', '보건선생님': 'nurse', '돌봄선생님': 'care', '유치원선생님': 'kinder',
      '사랑반선생님': 'sarang', '1학년 선생님': 'class1', '2학년 선생님': 'class2', '3학년 선생님': 'class3', '4학년 선생님': 'class4', '5학년 선생님': 'class5', '6학년 선생님': 'class6',
      '나래반선생님': 'narae', '행정실장님': 'admin', '행정 선생님': 'admin', '교무 선생님': 'office', '급식선생님': 'lunch', '청소선생님': 'clean' };
    const guideAt = (nm, x, y, z, face, top) => { let key = GUIDE[nm]; if (key) { if (tourSpots.some(t => t.key === key)) { let k = 2; while (tourSpots.some(t => t.key === key + '-' + k)) k++; key = key + '-' + k; } tourSpots.push({ key, kind: 'guide', label: nm, x, y, z, face: face & 3, top }); PEOPLE[PEOPLE.length - 1].tour = key; } return top; };
    const tagSign = (r9, nm, y9) => { const p9 = PEOPLE[PEOPLE.length - 1]; if (p9 && p9.sign < 0) { p9.sign = signList.length - 1; p9.name = nm; p9.signY = y9; } return r9; };
    const signH = nm => / 친구$/.test(nm) ? 0.15 : 0.22;
    const nameSign = (nm, x, top, z, rot = 0) => tagSign(sign(nm, x, top + 0.28, z, rot, signH(nm)), nm, top + 0.28);
    const place = (zn, nm, sex, s) => {
      const p = freeSpot(zn); if (!p) return;
      const dx = (zn.x0 + zn.x1) / 2 - p[0], dz = (zn.z0 + zn.z1) / 2 - p[1];
      const face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 3) : (dz > 0 ? 2 : 0);
      nameSign(nm, p[0], guideAt(nm, p[0], zn.y ?? 0, p[1], face, person(p[0], zn.y ?? 0, p[1], sex, s, face)), p[1]);
    };

    const sitSpot = (L, st) => hotspots.push({ kind: 'sit', x: st.sx ?? st.x, z: st.sz ?? st.z + 0.5, y: L.y, r: 0.75, label: '의자에 앉기', yaw: L.face === 3 ? -Math.PI / 2 : Math.PI });
    Object.entries(SCHOOL.people).forEach(([cls, info]) => {
      const zn = zoneOf(cls); if (!zn) return;
      const L = seatsOf[cls];
      if (!L) { place(zn, cls + ' 선생님', info.t, 1.1); info.s.forEach(([nm, sx]) => place(zn, nm, sx, 1)); return; }
      guideAt(cls + ' 선생님', L.teacher.x, L.y, L.teacher.z, L.tFace ?? 2, person(L.teacher.x, L.y, L.teacher.z, info.t, 1.1, L.tFace ?? 2));
      tagSign(sign(cls + ' 선생님', L.teacher.x, L.y + 1.62 * 1.1 + 0.2, L.teacher.z, 0, 0.22), cls + ' 선생님', L.y + 1.62 * 1.1 + 0.2);
      info.s.forEach(([nm, sx], i) => {
        const st = L.seats[i]; if (!st) { place(zn, nm, sx, 1); return; }
        person(st.x, L.y, st.z, sx, 1, L.face ?? 0, 'sit', { desk: L.y + 0.72, reach: 0.3 });
        tagSign(sign(nm, st.x, L.y + 1.74, st.z, 0, signH(nm)), nm, L.y + 1.74);
      });
      L.seats.slice(info.s.length).forEach(st => sitSpot(L, st));
    });
    Object.entries(seatsOf).forEach(([nm, L]) => { if (!SCHOOL.people[nm]) L.seats.forEach(st => sitSpot(L, st)); });

    const OCHAIR = 0x3f4550;
    const seatAt = (nm, sx, s, sp) => {
      if (sp.chair) chair(sp.x, sp.y ?? 0, sp.z, sp.face === 0 ? 1 : sp.face === 2 ? -1 : sp.face === 1 ? -1 : 1, OCHAIR, sp.face & 1);
      if (sp.hiBack) dBox(0.44, 0.5, 0.04, 0x2a2224, sp.x, (sp.y ?? 0) + 0.83, sp.z + (sp.face === 0 ? 0.17 : -0.17));
      const so = sp.signOff || 0, [fx9, fz9] = [[0, -1], [1, 0], [0, 1], [-1, 0]][sp.face & 3];
      nameSign(nm, sp.x + fx9 * so, guideAt(nm, sp.x, sp.y ?? 0, sp.z, sp.face, person(sp.x, sp.y ?? 0, sp.z, sx, s, sp.face, sp.pose ?? 'sit', sp)), sp.z + fz9 * so, so && (sp.face & 1) ? Math.PI / 2 : 0);
    };

    const VICE = { x: SCHOOL.bus[0] - 5.7, y: FIELD, z: SCHOOL.bus[1] - 2.7, face: 0, pose: 'wave' };
    const JOB = {
      '급식선생님': { x: HX - 0.95, z: SC - 0.4, face: 1, pose: 'work', role: 'cook' },
      '청소선생님': { x: kx1 - 1.05, z: AZ + 1.9, face: 3, pose: 'sweep', role: 'cleaner' },
    };
    Object.entries(SCHOOL.staff).forEach(([room, list]) => {
      const zn = zoneOf(room); if (!zn) return;
      const spots = (npcSpot[room] || []).slice(), L = seatsOf[room];
      list.forEach(([nm, sx, sz]) => {
        const s = sz === 'small' ? 0.8 : 1.1;
        if (JOB[nm]) return seatAt(nm, sx, s, JOB[nm]);
        if (nm === '교감선생님') {
          const sp = spots.shift(); if (sp && sp.chair) chair(sp.x, sp.y ?? 0, sp.z, sp.face === 0 ? 1 : sp.face === 2 ? -1 : sp.face === 1 ? -1 : 1, OCHAIR, sp.face & 1);
          return seatAt(nm, sx, s, VICE); }
        if (L && L.tSeat && sz !== 'small' && !spots.length) {
          if (room === '나래반') return nameSign(nm, L.teacher.x, guideAt(nm, L.teacher.x, L.y, L.teacher.z, L.tFace ?? 1, person(L.teacher.x, L.y, L.teacher.z, sx, s, L.tFace ?? 1, 'explain')), L.teacher.z);
          return seatAt(nm, sx, s, { ...L.tSeat, y: L.y, signOff: 0.6 });
        }
        const sp = spots.shift();
        if (sp) seatAt(nm, sx, s, nm === '교장선생님' ? { ...sp, role: 'principal' } : sp); else place(zn, nm, sx, s);
      });
    });

    { const TG = [];
      { const sp = (npcSpot['체육관'] || [])[0]; if (sp) TG.push(['pe', '체육선생님', '여', { ...sp, pose: 'stand', role: 'pe' }]); }
      { const L = seatsOf['컴퓨터실']; if (L) TG.push(['ai', 'AI 교육 선생님', '여', { x: L.teacher.x, y: L.y, z: L.teacher.z, face: L.tFace ?? 1, pose: 'explain', role: 'ai' }]); }
      { const sp = (npcSpot['과학실'] || [])[0]; if (sp) TG.push(['science', '과학선생님', '남', { ...sp, pose: 'explain', role: 'sci' }]); }
      TG.forEach(([key, nm, sx, sp]) => { const top = person(sp.x, sp.y, sp.z, sx, 1.1, sp.face, sp.pose, sp); tagSign(sign(nm, sp.x, top + 0.28, sp.z, (sp.face & 1) ? Math.PI / 2 : 0, 0.22), nm, top + 0.28); PEOPLE[PEOPLE.length - 1].tour = key;
        tourSpots.push({ key, kind: 'guide', label: nm, x: sp.x, y: sp.y, z: sp.z, face: sp.face & 3, top }); }); }
    NPCN = npcN;

    personGeo = (id, pose = 'stand', o2 = {}) => {
      const r = PEOPLE[id]; if (!r) return null;
      const S9 = PSINK = { pos: [], col: [], nor: [], part: [] };
      try { person(0, 0, 0, r.sex, r.s, 2, pose, { role: r.o.role, seat: o2.seat, desk: o2.desk, reach: o2.reach, _hx: r.x, _hz: r.z }); } finally { PSINK = null; PPART = 0; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(S9.pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(S9.col), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(S9.nor), 3)); g.computeBoundingSphere();
      g.userData = { part: Uint8Array.from(S9.part), hipY: S9.hipY, shY: S9.shY, top: S9.top };
      return g;
    };
  }

  buildPlinths();
  buildBaseboards();

  {

    const EPS = 0.004, faults = (() => {
      const N = allBoxes.length, hit = new Map(), V = {};
      for (const k of ['x0', 'x1', 'y0', 'y1', 'z0', 'z1']) { const a = V[k] = new Float64Array(N); for (let i = 0; i < N; i++) a[i] = allBoxes[i][k]; }
      const ov = (a0,a1,b0,b1) => Math.min(a1,b1) - Math.max(a0,b0) > 0.02, sm = (p,q) => Math.abs(p-q) < EPS;
      const judge = (A, Bb) => ((sm(A.z0,Bb.z0)||sm(A.z1,Bb.z1)) && ov(A.x0,A.x1,Bb.x0,Bb.x1) && ov(A.y0,A.y1,Bb.y0,Bb.y1)) ? 'z'
        : ((sm(A.x0,Bb.x0)||sm(A.x1,Bb.x1)) && ov(A.z0,A.z1,Bb.z0,Bb.z1) && ov(A.y0,A.y1,Bb.y0,Bb.y1)) ? 'x'
        : ((sm(A.y0,Bb.y0)||sm(A.y1,Bb.y1)) && ov(A.x0,A.x1,Bb.x0,Bb.x1) && ov(A.z0,A.z1,Bb.z0,Bb.z1)) ? 'y' : null;
      for (const [c, u0, u1] of [['z0','x0','x1'], ['z1','x0','x1'], ['x0','z0','z1'], ['x1','z0','z1'], ['y0','x0','x1'], ['y1','x0','x1']]) {
        const C = V[c], U0 = V[u0], U1 = V[u1], bk = new Map();
        for (let i = 0; i < N; i++) { const k = Math.floor(C[i] / 0.01); if (!isFinite(k) || U0[i] !== U0[i] || U1[i] !== U1[i]) continue; let a = bk.get(k); if (!a) bk.set(k, a = []); a.push(i); }
        for (const [k, a] of bk) { const n9 = bk.get(k + 1), L = n9 ? a.concat(n9) : a; if (L.length < 2) continue;
          L.sort((p, q) => U0[p] - U0[q]);
          for (let s = 0; s < L.length; s++) { const e = U1[L[s]];
            for (let t = s + 1; t < L.length && U0[L[t]] <= e; t++) { const i = Math.min(L[s], L[t]), j = Math.max(L[s], L[t]), key = i * N + j;
              if (!hit.has(key)) { const ax = judge(allBoxes[i], allBoxes[j]); if (ax) hit.set(key, [i, j, ax]); } } } }
      }
      return [...hit.keys()].sort((p, q) => p - q).map(q => hit.get(q));
    })();
    if (faults.length) {
      const fmt = b9 => '[' + [b9.x0,b9.x1,b9.y0,b9.y1,b9.z0,b9.z1].map(v=>+v.toFixed(2)).join(',') + ']';
      faults.slice(0, 30).forEach(([i,j,ax]) => console.error('헌법③ ' + ax + ' A=' + fmt(allBoxes[i]) + ' B=' + fmt(allBoxes[j])));
      console.error('헌법③ 위반 총 ' + faults.length + '쌍 — 수정 전 커밋 금지.');
    } else console.log('헌법③ 감사: 동일평면 겹침 0');
  }

  const FLOORS = [[fx0, fx1, fz0, fz1, 0], [EN.x[0], EN.x[1], fz1, EN.z[1], 0], [wx0, wx1, wz0, wz1, 0], [kx0, kx1, kz0, kz1, 0],
    [CL.x[0], CL.x[1], CL.z[0], CL.z[1], 0], [LC.x[0], LC.x[1], LC.z[0], LC.z[1], 0], [ex0, ex1, ez0, ez1, 0],
    [LC.x[1], ex1 + 0.15, ez1, fz0, COURT], [gx0, gx1, gz0, gz1, GYF], [G.annex.x[0], G.annex.x[1], G.annex.z[0], G.annex.z[1], GYF]];
  const baseAt = (x, z) => { for (const [a, b, c, d, y] of FLOORS) if (x >= a && x <= b && z >= c && z <= d) return y; return terrainAt(x, z); };
  const UPPER = [wx0, wx1, wz0, wz1, FH + 0.3];

  const floorOf = b => (b.y0 >= UPPER[4] - 0.15 && b.x0 > UPPER[0] - 0.6 && b.x1 < UPPER[1] + 0.6 && b.z0 > UPPER[2] - 0.6 && b.z1 < UPPER[3] + 0.6) ? UPPER[4] : baseAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);

  (() => { const R9 = 1.0, JUMP = 1.52, HANG = 0.6;
    const fp = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.02 && Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > 0.02;
    const solid = colliders.filter(d => !d.nc), stand = solid.filter(d => d.y1 - floorOf(d) <= JUMP);

    const ok4 = b => isFinite(b.x0) && isFinite(b.x1) && isFinite(b.z0) && isFinite(b.z1) && b.x0 <= b.x1 && b.z0 <= b.z1;
    const ncell = (b, e) => (Math.floor((b.x1 + e) / 8) - Math.floor((b.x0 - e) / 8) + 1) * (Math.floor((b.z1 + e) / 8) - Math.floor((b.z0 - e) / 8) + 1);
    const CMAX = 4096;
    const cells = L => { const H = new Map(), odd = []; for (const d of L) { if (!ok4(d) || ncell(d, 0) > CMAX) { odd.push(d); continue; }
        for (let gx = Math.floor(d.x0 / 8); gx <= Math.floor(d.x1 / 8); gx++) for (let gz = Math.floor(d.z0 / 8); gz <= Math.floor(d.z1 / 8); gz++) { const k = gx * 4096 + gz; let a = H.get(k); if (!a) H.set(k, a = []); a.push(d); } }
      return { H, odd, all: L }; };
    const near = (G, c, e) => { if (!ok4(c) || ncell(c, e) > CMAX) return G.all; const out = G.odd.slice();
      for (let gx = Math.floor((c.x0 - e) / 8); gx <= Math.floor((c.x1 + e) / 8); gx++) for (let gz = Math.floor((c.z0 - e) / 8); gz <= Math.floor((c.z1 + e) / 8); gz++) { const a = G.H.get(gx * 4096 + gz); if (a) for (const d of a) out.push(d); }
      return out; };
    const SG = cells(solid), TG = cells(stand);
    for (const c of colliders) { if (!c.ns && !(c.nc && c.y1 - c.y0 <= 2.6)) continue;
      let sup = floorOf(c), ceil9 = 1e9;
      for (const d of near(SG, c, 0)) { if (!fp(c, d)) continue;
        if (d.y1 <= c.y0 + 0.02) { if (d.y1 > sup) sup = d.y1; } else if (d.y0 >= c.y1 - 0.01 && d.y0 < ceil9) ceil9 = d.y0; }
      if (c.y0 > sup + HANG) continue;
      let m = -1e9;
      for (const d of near(TG, c, R9)) { if (d.y1 <= c.y1 - 1.55 || d.y1 >= c.y1) continue;
        if (d.x1 < c.x0 - R9 || d.x0 > c.x1 + R9 || d.z1 < c.z0 - R9 || d.z0 > c.z1 + R9) continue;
        if (d.y1 > m) m = d.y1; }
      if (m === -1e9) continue;
      const y9 = Math.min(m + 1.6, ceil9 - 0.01);
      if (y9 > c.y1) c.y1 = y9; } })();
  const grid = new Map();
  colliders.forEach((b, i) => {
    for (let gx2 = Math.floor(b.x0/8); gx2 <= Math.floor(b.x1/8); gx2++)
      for (let gz2 = Math.floor(b.z0/8); gz2 <= Math.floor(b.z1/8); gz2++) {
        const k = gx2 + ':' + gz2;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(i);
      }
  });

  {
    const R = seeded(90173), XB = [-86, 60], ZB = [-85, 69], F9 = SCHOOL.field;
    const collAt = (x, z, y0, y1) => { for (const i of grid.get(Math.floor(x / 8) + ':' + Math.floor(z / 8)) || []) { const b = colliders[i]; if (x > b.x0 - 0.12 && x < b.x1 + 0.12 && z > b.z0 - 0.12 && z < b.z1 + 0.12 && b.y1 > y0 && b.y0 < y1) return true; } return false; };
    const PG = new Map(); for (const q of PQ) for (let i = Math.floor((q.x0 - 0.1) / 8); i <= Math.floor((q.x1 + 0.1) / 8); i++) for (let j = Math.floor((q.z0 - 0.1) / 8); j <= Math.floor((q.z1 + 0.1) / 8); j++) {
      if (i < -12 || i > 8 || j < -12 || j > 9) continue; const k = i * 100 + j; let L = PG.get(k); if (!L) PG.set(k, L = []); L.push(q); }
    const covered = (x, z, y, self) => (PG.get(Math.floor(x / 8) * 100 + Math.floor(z / 8)) || []).some(q => q !== self && q.y > y + 0.002 && x > q.x0 - 0.1 && x < q.x1 + 0.1 && z > q.z0 - 0.1 && z < q.z1 + 0.1);
    const okChunk = (x, z, y = FIELD) => buildingOf(x, z) < 0 && inBB(DNEAR.get('o' + Math.floor(x / CHUNK) + '_' + Math.floor(z / CHUNK)), x - 0.1, x + 0.1, y - 0.02, y + 0.2, z - 0.1, z + 0.1, 0.2);
    const G9 = PQ.filter(q => q.kind === 'grass' && q.rect).map(q => ({ q, x0: Math.max(q.x0, XB[0]), x1: Math.min(q.x1, XB[1]), z0: Math.max(q.z0, ZB[0]), z1: Math.min(q.z1, ZB[1]) })).filter(r => r.x1 - r.x0 > 0.5 && r.z1 - r.z0 > 0.5);
    const M9 = new THREE.Matrix4(), Q9 = new THREE.Quaternion(), E9 = new THREE.Euler(), V9 = new THREE.Vector3(), S9 = new THREE.Vector3();
    const BLADE = new THREE.ConeGeometry(1, 1, 3, 1, true).translate(0, 0.5, 0).toNonIndexed();
    const A9 = G9.reduce((a, r) => a + (r.x1 - r.x0) * (r.z1 - r.z0), 0), NT = 4000, GC = [0xb4e67e, 0xc2ee8e, 0xa4dc72, 0xcff4a0, 0xaee27a];
    let nT = 0, nP = 0;
    for (const r of G9) { const want = (r.x1 - r.x0) * (r.z1 - r.z0) / A9 * NT; let n = Math.floor(want) + (R() < want % 1 ? 1 : 0);
      for (; n > 0; n--) { const x = r.x0 + R() * (r.x1 - r.x0), z = r.z0 + R() * (r.z1 - r.z0), y = r.q.y;
        if (covered(x, z, y, r.q) || collAt(x, z, y - 0.05, y + 0.4) || !okChunk(x, z, y)) continue;
        const col = GC[Math.floor(R() * GC.length)], k = 2 + Math.floor(R() * 2), s9 = 0.85 + R() * 0.3;
        for (let b = 0; b < k; b++) { const a = R() * Math.PI * 2, lean = 0.25 + R() * 0.35, hb = (0.1 + R() * 0.05) * s9;
          M9.compose(V9.set(x + Math.cos(a) * 0.03, y - 0.004, z + Math.sin(a) * 0.03), Q9.setFromEuler(E9.set(Math.sin(a) * lean, R() * 3, -Math.cos(a) * lean)), S9.set(0.045 * s9, hb, 0.045 * s9)); dGeo(BLADE, M9, col, { at: [x, z] }); }
        softVols.push({ x0: x - 0.15, x1: x + 0.15, y0: y - 0.03, y1: y + 0.2, z0: z - 0.15, z1: z + 0.15, why: 'GFX-3 풀 포기' }); nT++; } }
    const OCT = new THREE.TetrahedronGeometry(1, 0), PC = [0xa8a092, 0x8f8a80, 0xc2b8a4, 0x9c8f7c];
    for (let i = 0; i < 420 && nP < 200; i++) {
      const edge = R() < 0.7, x = edge ? (R() < 0.5 ? F9.x[0] + R() * 3 : F9.x[1] - R() * 3) : F9.x[0] + R() * (F9.x[1] - F9.x[0]), z = edge && R() < 0.5 ? (R() < 0.5 ? F9.z[0] + R() * 3 : F9.z[1] - R() * 3) : F9.z[0] + R() * (F9.z[1] - F9.z[0]);
      if (terrainAt(x, z) !== FIELD || covered(x, z, FIELD + 0.001, null) || collAt(x, z, FIELD - 0.05, FIELD + 0.4) || !okChunk(x, z)) continue;
      const sc = 0.03 + R() * 0.035; M9.compose(V9.set(x, FIELD + sc * 0.2, z), Q9.setFromEuler(E9.set(0, R() * 3, 0)), S9.set(sc * (1 + R() * 0.5), sc * 0.55, sc));
      dGeo(OCT, M9, PC[Math.floor(R() * PC.length)], { at: [x, z] }); nP++; }
    OCT.dispose(); BLADE.dispose();
  }
  let glassMesh = null;
  if (glassPos.length) {
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glassPos), 3));
    gg.computeVertexNormals(); gg.computeBoundingSphere();
    const gm = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ color: 0xa9d4e4, transparent: true, opacity: 0.32, depthWrite: false }));
    gm.matrixAutoUpdate = false; gm.renderOrder = 2; scene.add(gm); glassMesh = gm;
  }
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  let matLegoLater = true;

  const AO_GLSL = `{ vec4 d = vAoD; float ao;
    if (d.z < 0.) { vec4 e = 1. - smoothstep(vec4(0.), vec4(1.0), vec4(d.x, d.y, -d.z - 1., d.w)); e = 1. - AO_FLOOR * e * e; ao = e.x * e.y * e.z * e.w; }
    else { float c = 1. - smoothstep(0., 1.0, min(d.x, d.y)), f = 1. - smoothstep(0., 0.7, d.z), t = 1. - smoothstep(0., 0.8, d.w);
      ao = (1. - 0.38 * c * c) * (1. - 0.42 * f * f) * (1. - 0.3 * t * t); }
    gMul *= ao; }`;
  const macroTex = (() => {
    const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), img = g.createImageData(N, N);
    const lat = (P, s) => { const h = (i, j) => { const v = Math.sin(((i % P) + P) % P * 127.1 + (((j % P) + P) % P) * 311.7 + s) * 43758.5453; return v - Math.floor(v); };
      return (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), e = h(ix + 1, iy + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v; }; };
    const n1 = lat(4, 1.3), n2 = lat(8, 7.1), n3 = lat(16, 3.7);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const o = (y * N + x) * 4, X = x / N, Y = y / N;
      img.data[o] = Math.round(255 * (0.65 * n1(X * 4, Y * 4) + 0.35 * n2(X * 8, Y * 8))); img.data[o + 1] = Math.round(255 * (0.6 * n2(X * 8 + 3, Y * 8 + 5) + 0.4 * n3(X * 16, Y * 16))); img.data[o + 2] = 128; img.data[o + 3] = 255; }
    g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const FCZ0 = (SCHOOL.field.z[0] + SCHOOL.southFenceZ) / 2;
  const WORN = [[-35.3 + 3.2, FCZ0 + 3.0, 4.2], [26.9 - 3.2, FCZ0, 4.2], [-13, SCHOOL.field.z[0] + 1.2 + 2.4, 2.8], [-24, SCHOOL.southFenceZ - 3.2 - 2.4, 2.8], [(-35.3 + 26.9) / 2, FCZ0 + 1.5, 3.2]]
    .map(([x, z, r]) => new THREE.Vector3(x, z, r));
  function aoPatch(m, ao, ground) {
    m.onBeforeCompile = sh => {
      if (ground) { sh.uniforms.macroMap = { value: macroTex }; sh.uniforms.worn = { value: WORN }; }
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + (ao ? 'attribute vec4 aoD;\nvarying vec4 vAoD;\n' : '') + (ground ? 'varying vec3 vWp;\n' : ''))
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (ao ? 'vAoD = aoD * 0.01;\n' : '') + (ground ? 'vWp = position;\n' : ''));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + (ao ? 'varying vec4 vAoD;\n#define AO_FLOOR ' + (ao === 'ceil' ? '0.22' : '0.3') + '\n' : '') + (ground ? 'varying vec3 vWp;\nuniform sampler2D macroMap;\nuniform vec3 worn[5];\n#define GV ' + (ground === 'grass' ? '1.7' : '1.0') + '\n' : ''))
        .replace('#include <color_fragment>', '#include <color_fragment>\nvec3 gMul = vec3(1.); float gWorn = 0.;\n' + (ao ? AO_GLSL : '') + (ground ? `{ float m1 = texture2D(macroMap, vWp.xz * 0.111).r, m2 = texture2D(macroMap, vWp.xz * 0.37 + 0.31).g - 0.5;
          gMul *= (1. + GV * (-0.08 + 0.16 * m1)) * vec3(1. + GV * 0.08 * m2, 1. + GV * 0.03 * m2, 1. - GV * 0.09 * m2);
          if (abs(vWp.y - (${FIELD.toFixed(3)})) < 0.05) for (int i = 0; i < 5; i++) gWorn = max(gWorn, 1. - smoothstep(0.35, 1., length(vWp.xz - worn[i].xy) / worn[i].z + (m2 - 0.1) * 0.9)); }` : ''))
        .replace('#include <tonemapping_fragment>', '#include <tonemapping_fragment>\ngl_FragColor.rgb *= gMul;\n' + (ground ? 'gl_FragColor.rgb = mix(gl_FragColor.rgb, min(vec3(1.), gl_FragColor.rgb * vec3(1.1, 1.08, 1.03) + 0.02), 0.6 * gWorn);\n' : ''));
    };
    m.customProgramCacheKey = () => 'gfx3' + (ao || '') + (ground || '');
    return m;
  }

  const LEGO_U = { value: typeof location !== 'undefined' && /[?&]lego=1(&|$)/.test(location.search) ? 1 : 0 };
  const LGB = ['-140.00', '-140.00', '140.00', '140.00'];
  function legoPatch(m, R = LGB, useAo = false) {
    const prev = m.onBeforeCompile, key = m.customProgramCacheKey && m.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); sh.uniforms.uLego = LEGO_U;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLgP;\nvarying vec3 vLgN;\n').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLgP = position; vLgN = normal;\n');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uLego;\nvarying vec3 vLgP;\nvarying vec3 vLgN;\nfloat lgH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n')
        .replace('#include <color_fragment>', `#include <color_fragment>
{ vec3 P = vLgP, N = vLgN; float nl = length(N);
  if (uLego > 0.5 && nl > 0.5 && P.x > ${R[0]} && P.x < ${R[2]} && P.z > ${R[1]} && P.z < ${R[3]} && P.y > -3. && P.y < 12.${useAo ? ' && min(min(vAoD.x, vAoD.y), vAoD.z) < 250.' : ''}) { N /= nl; vec3 A = abs(N); float k = 1.;
    if (A.y < 0.5) { vec2 uv = A.x > A.z ? vec2(P.z, P.y) : vec2(P.x, P.y);
      float row = floor(uv.y / 0.48), u = uv.x + (mod(row, 2.) > 0.5 ? 0.5 : 0.);
      vec2 f = vec2(fract(u), fract(uv.y / 0.48)); float ex = min(f.x, 1. - f.x), ey = min(f.y, 1. - f.y) * 0.48;
      float seam = 1. - smoothstep(0.007, 0.022, min(ex, ey));
      k = (1. - 0.42 * seam) * (1. + 0.11 * (1. - smoothstep(0., 0.05, (1. - f.y) * 0.48)) - 0.13 * (1. - smoothstep(0., 0.05, f.y * 0.48))) * (0.93 + 0.14 * lgH(vec2(floor(u), row)));
    } else if (N.y > 0.) { vec2 c = fract(P.xz / 0.5) - 0.5; float r = length(c), ds = length(c - vec2(0.035, 0.045));
      float disk = 1. - smoothstep(0.14, 0.155, r), rim = smoothstep(0.115, 0.15, r) * disk, sh9 = (1. - smoothstep(0.14, 0.175, ds)) * (1. - disk);
      vec2 g = fract(P.xz / 0.5); float e = min(min(g.x, 1. - g.x), min(g.y, 1. - g.y)) * 0.5, seam = 1. - smoothstep(0.004, 0.014, e);
      k = (1. + 0.12 * disk - 0.14 * rim - 0.24 * sh9) * (1. - 0.26 * seam); }
    diffuseColor.rgb *= k; } }
`); };
    m.customProgramCacheKey = () => (key ? key() : '') + 'lego1' + R.join(',') + (useAo ? 'a' : ''); return m;
  }
  const matAO = legoPatch(aoPatch(new THREE.MeshLambertMaterial({ vertexColors: true }), 'wall', false), LGB, true);
  if (matLegoLater) { matLegoLater = false; legoPatch(mat, [(FR.x[0] - 0.7).toFixed(2), (FR.z[1] - 0.05).toFixed(2), (FR.x[1] + 0.7).toFixed(2), (FR.z[1] + 0.85).toFixed(2)]); }

  const flatNormals = g => { const P = g.attributes.position.array, N = new Float32Array(P.length);
    for (let i = 0; i + 8 < P.length; i += 9) { const bx = P[i + 3], by = P[i + 4], bz = P[i + 5], cbx = P[i + 6] - bx, cby = P[i + 7] - by, cbz = P[i + 8] - bz, abx = P[i] - bx, aby = P[i + 1] - by, abz = P[i + 2] - bz;
      const x = Math.fround(cby * abz - cbz * aby), y = Math.fround(cbz * abx - cbx * abz), z = Math.fround(cbx * aby - cby * abx), s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
      N[i] = N[i + 3] = N[i + 6] = x * s; N[i + 1] = N[i + 4] = N[i + 7] = y * s; N[i + 2] = N[i + 5] = N[i + 8] = z * s; }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); };

  const bounds = (g, box) => { const P = g.attributes.position.array; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i + 2 < P.length; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z); x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z); }
    if (!(x0 <= x1 && y0 <= y1 && z0 <= z1)) { g.computeBoundingSphere(); if (box) g.computeBoundingBox(); return; }
    const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5; let r2 = 0;
    for (let i = 0; i + 2 < P.length; i += 3) { const dx = cx - P[i], dy = cy - P[i + 1], dz = cz - P[i + 2]; r2 = Math.max(r2, dx * dx + dy * dy + dz * dz); }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
    if (box) g.boundingBox = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)); };

  const objParts = (arr, T, m, t0 = 0) => { if (!arr) return; let cur = -1, st = 0;
    for (let t = 0; t <= T; t++) { const o9 = t < T && t < arr.length ? arr[t] : -1; if (o9 !== cur) { if (cur >= 0) OBJS[cur].parts.push({ mesh: m, start: (st + t0) * 3, count: (t - st) * 3 }); cur = o9; st = t; } } };
  for (const ch of chunks.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    if (ch.nor) g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(ch.nor), 3)); else flatNormals(g);
    bounds(g, true);
    if (ch.aoUsed) { aoPad(ch.ao, ch.pos.length / 3 * 4); g.setAttribute('aoD', new THREE.BufferAttribute(new Int16Array(ch.ao), 4)); }
    const m = new THREE.Mesh(g, ch.aoUsed ? matAO : mat);
    objParts(ch.obj, ch.pos.length / 9, m);
    m.matrixAutoUpdate = false; m.userData.st = true;
    scene.add(m);
  }
  buildSigns();

  const PAT_RECV = new Set(['grass', 'dirt', 'pave', 'paveE', 'paveF', 'paveG', 'asph', 'gravel', 'chip', 'ilock', 'sand', 'hop', 'brick', 'kidHop', 'redRd']);
  const patMat = (basic, map, aoUsed, gk) => { const m0 = basic ? new THREE.MeshBasicMaterial({ map, vertexColors: true }) : new THREE.MeshLambertMaterial({ map, vertexColors: true }); return legoPatch(aoUsed || gk ? aoPatch(m0, aoUsed ? (basic ? 'ceil' : 'floor') : null, gk) : m0); };
  const patAvg = cv => { const c8 = document.createElement('canvas'); c8.width = c8.height = 8; const g8 = c8.getContext('2d'); g8.drawImage(cv, 0, 0, 8, 8); const d = g8.getImageData(0, 0, 8, 8).data; let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } return [r / 16320, g / 16320, b / 16320]; };
  const PG9 = new Map();
  for (const [kind, P] of PAT) {
    const [, N, basic, draw] = PATDEF[kind];
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    let seed = 17; for (const ch of kind) seed = (seed * 31 + ch.charCodeAt(0)) % 100003;
    draw(cv.getContext('2d'), N, seeded(seed));
    const ground = kind === 'grass' || kind === 'dirt', key = (basic ? 'b' : 'l') + (P.aoUsed ? 'a' : '') + (ground ? kind : '') + (PAT_RECV.has(kind) ? 'r' : '');
    let G = PG9.get(key); if (!G) PG9.set(key, G = []); G.push({ kind, P, cv, basic, ground });
  }
  let PDUM = null;
  function patArr(G) { const S9 = 256, L9 = G.length, RW = S9 * 4, data = new Uint8Array(S9 * RW * L9), c2 = document.createElement('canvas'); c2.width = c2.height = S9; const x2 = c2.getContext('2d', { willReadFrequently: true }); x2.imageSmoothingEnabled = true; x2.imageSmoothingQuality = 'high';
    const avg9 = []; for (let l = 0; l < L9; l++) { x2.clearRect(0, 0, S9, S9); x2.drawImage(G[l].cv, 0, 0, S9, S9); const d = x2.getImageData(0, 0, S9, S9).data, o0 = l * S9 * RW; for (let r = 0; r < S9; r++) data.set(d.subarray((S9 - 1 - r) * RW, (S9 - r) * RW), o0 + r * RW); avg9.push(patAvg(G[l].cv)); }
    const ta = new THREE.DataArrayTexture(data, S9, S9, L9); ta.format = THREE.RGBAFormat; ta.type = THREE.UnsignedByteType; ta.colorSpace = THREE.SRGBColorSpace; ta.wrapS = ta.wrapT = THREE.RepeatWrapping; ta.minFilter = THREE.LinearMipmapLinearFilter; ta.magFilter = THREE.LinearFilter; ta.generateMipmaps = true; ta.anisotropy = 8; ta.onUpdate = t => { t.image.data = null; }; ta.needsUpdate = true;
    return { ta, avg9 }; }
  function patGeo(G) { const ao9 = !!G[0].P.aoUsed; let nV = 0; for (const q of G) nV += q.P.pos.length / 3; const pos = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), col = new Float32Array(nV * 3), lay = new Float32Array(nV), ao = ao9 ? new Int16Array(nV * 4) : null; let o = 0;
    for (let l = 0; l < G.length; l++) { const q = G[l], n = q.P.pos.length / 3; pos.set(q.P.pos, o * 3); uv.set(q.P.uv, o * 2); col.set(q.P.col, o * 3); lay.fill(l, o, o + n); if (ao) { aoPad(q.P.ao, n * 4); ao.set(q.P.ao, o * 4); } q.off = o; o += n; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aPatL9', new THREE.BufferAttribute(lay, 1));
    g.computeVertexNormals(); g.computeBoundingSphere(); if (ao) g.setAttribute('aoD', new THREE.BufferAttribute(ao, 4)); return g; }
  function patArrMat(q0, ta) { if (!PDUM) { PDUM = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); PDUM.colorSpace = THREE.SRGBColorSpace; PDUM.needsUpdate = true; }
    const mt = patMat(q0.basic, PDUM, !!q0.P.aoUsed, q0.ground && q0.kind), pv = mt.onBeforeCompile, kk = mt.customProgramCacheKey.bind(mt);
    mt.onBeforeCompile = (sh, r) => { if (pv) pv.call(mt, sh, r); sh.uniforms.uPatA9 = { value: ta };
      sh.vertexShader = 'attribute float aPatL9;\nvarying float vPatL9;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPatL9 = aPatL9;');
      sh.fragmentShader = 'uniform highp sampler2DArray uPatA9;\nvarying float vPatL9;\n' + sh.fragmentShader.replace('#include <map_fragment>', 'diffuseColor *= texture(uPatA9, vec3(vMapUv, vPatL9));'); };
    mt.customProgramCacheKey = () => kk() + 'patA9'; return mt; }
  for (const [, G] of PG9) {
    if (G.length === 1 || !THREE.DataArrayTexture) { for (const { kind, P, cv, basic, ground } of G) {
      const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(P.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3));
      g.computeVertexNormals(); g.computeBoundingSphere();
      if (P.aoUsed) { aoPad(P.ao, P.pos.length / 3 * 4); g.setAttribute('aoD', new THREE.BufferAttribute(new Int16Array(P.ao), 4)); }
      const m = new THREE.Mesh(g, patMat(basic, tex, P.aoUsed, ground && kind));
      m.matrixAutoUpdate = false; m.userData.pat = kind; scene.add(m); objParts(P.obj, P.pos.length / 9, m);
    } continue; }
    const { ta, avg9 } = patArr(G), g = patGeo(G), mt = patArrMat(G[0], ta);
    const m = new THREE.Mesh(g, mt); m.matrixAutoUpdate = false; m.userData.pat = G[0].kind; m.userData.patK9 = G.map(q => q.kind); m.userData.patAvg9 = avg9; scene.add(m);
    for (const q of G) objParts(q.P.obj, q.P.pos.length / 9, m, q.off / 3);
  }
  let lampMesh = null;
  if (lampPos.length) {
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lampPos, 3)); lg.computeVertexNormals(); lg.computeBoundingSphere();
    const lm = new THREE.Mesh(lg, lampMat); lm.matrixAutoUpdate = false; scene.add(lm); lampMesh = lm;
  }
  if (railPos.length) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g9 = cv.getContext('2d');
    g9.fillStyle = '#ffffff'; g9.fillRect(0, 0, 128, 6); g9.fillRect(0, 54, 128, 4);
    for (let x = 0; x < 128; x += 16) g9.fillRect(x, 6, 3, 48);
    g9.fillRect(0, 0, 6, 64);
    const rt = new THREE.CanvasTexture(cv); rt.wrapS = THREE.RepeatWrapping; rt.colorSpace = THREE.SRGBColorSpace; rt.anisotropy = 4;
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(railUV, 2));
    rg.computeVertexNormals(); rg.computeBoundingSphere();
    const rm = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: rt, color: 0xc9ced3, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    rm.matrixAutoUpdate = false; rm.renderOrder = 1; scene.add(rm);
  }
  if (fencePos.length) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g9 = cv.getContext('2d');
    g9.strokeStyle = 'rgba(255,255,255,0.95)'; g9.lineWidth = 3;
    g9.beginPath(); g9.moveTo(0, 0); g9.lineTo(64, 64); g9.moveTo(64, 0); g9.lineTo(0, 64); g9.stroke();
    const ft = new THREE.CanvasTexture(cv); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.colorSpace = THREE.SRGBColorSpace;
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fencePos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fenceUV, 2)); fg.setAttribute('color', new THREE.Float32BufferAttribute(fenceCol, 3));
    fg.computeVertexNormals(); fg.computeBoundingSphere();
    const fm = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ map: ft, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    fm.matrixAutoUpdate = false; fm.renderOrder = 1; scene.add(fm);
  }

  const details = [];

  const splitRooms = ch => { const T = ch.pos.length / 9; if (!ch.inside || T <= 5000) return [ch];
    let ax0 = 1e9, ax1 = -1e9, az0 = 1e9, az1 = -1e9; for (let i = 0; i < ch.pos.length; i += 3) { const x = ch.pos[i], z = ch.pos[i + 2]; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (z < az0) az0 = z; if (z > az1) az1 = z; }
    const ZC = zones.filter(q => q.x1 > ax0 && q.x0 < ax1 && q.z1 > az0 && q.z0 < az1), key = new Int16Array(T), cnt = new Map();
    for (let t = 0; t < T; t++) { const o = t * 9, x = (ch.pos[o] + ch.pos[o + 3] + ch.pos[o + 6]) / 3, y = (ch.pos[o + 1] + ch.pos[o + 4] + ch.pos[o + 7]) / 3, z = (ch.pos[o + 2] + ch.pos[o + 5] + ch.pos[o + 8]) / 3;
      let best = -1, by = -1e9; for (let k = 0; k < ZC.length; k++) { const q = ZC[k]; if (x >= q.x0 && x < q.x1 && z >= q.z0 && z < q.z1 && q.y <= y + 0.5 && q.y > by) { by = q.y; best = k; } }
      key[t] = best; cnt.set(best, (cnt.get(best) || 0) + 1); }
    for (let t = 0; t < T; t++) if (cnt.get(key[t]) < 600) key[t] = -1;
    const out = new Map(); for (let t = 0; t < T; t++) { let o = out.get(key[t]); if (!o) { o = { ...ch, pos: [], col: [], nor: ch.nor && [], own: ch.own && [], obj: ch.obj && [] }; out.set(key[t], o); }
      for (let k = t * 9; k < t * 9 + 9; k++) { o.pos.push(ch.pos[k]); o.col.push(ch.col[k]); if (o.nor) o.nor.push(ch.nor[k]); }
      if (o.own) o.own.push(t < ch.own.length ? ch.own[t] : -1);
      if (o.obj) o.obj.push(t < ch.obj.length ? ch.obj[t] : -1); }
    return [...out.values()]; };
  for (const [M, far] of [[DNEAR, false]]) for (const ch0 of M.values()) for (const ch of splitRooms(ch0)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    if (ch.nor) g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(ch.nor), 3)); else flatNormals(g);
    bounds(g, !far);
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m); objParts(ch.obj, ch.pos.length / 9, m);
    if (!far) { details.push({ mesh: m, cx: ch.cx, cz: ch.cz, inside: ch.inside, bi: ch.bi, fl: ch.fl, box: g.boundingBox }); }
    if (ch.own) { const T9 = ch.pos.length / 9; let cur = -1, st = 0;
      for (let t = 0; t <= T9; t++) { const o9 = t < T9 && t < ch.own.length ? ch.own[t] : -1; if (o9 !== cur) { if (cur >= 0) PEOPLE[cur].parts.push({ mesh: m, start: st * 3, count: (t - st) * 3 }); cur = o9; st = t; } } }
  }
  details.brect = BRECT; details.wing = 2; details.FH = FH;
  for (const g of CYLC.values()) g.dispose(); CYLC.clear();
  for (const o of OBJS) {
    if (glassMesh && o.g1 > o.g0) o.parts.push({ mesh: glassMesh, start: o.g0 / 3, count: (o.g1 - o.g0) / 3 });
    if (signMesh && o.s1 > o.s0) o.parts.push({ mesh: signMesh, start: o.s0 * 12, count: (o.s1 - o.s0) * 12 });

    if ((o.kind === 'chair' || o.kind === 'bench' || o.kind === 'sofa' || o.kind === 'bed') && PEOPLE.some(p => p.pose === 'sit' && p.x > o.box[0] - 0.05 && p.x < o.box[3] + 0.05 && p.z > o.box[2] - 0.05 && p.z < o.box[5] + 0.05 && o.box[1] <= p.y + 0.1 && o.box[4] >= p.y + 0.3)) o.seated = true; }
  { const late = doors.filter(d => d.late); if (late.length) { const keep = doors.filter(d => !d.late); doors.length = 0; doors.push(...keep, ...late); } }
  return { gardenBare: GARDEN_BARE, busDoor, colliders, grid, zones, doors, allBoxes, hotspots, hideSpots, details, visRods, soft: softVols, TERR_Z, terrainAt, setTerrainOver, overAt, baseAt, UPPER, bounds: SCHOOL.boundary, glassMesh, flag: flagMesh, tour: tourSpots, npcs: NPCN, lampMat,
    lego: on => { LEGO_U.value = on ? 1 : 0; }, get legoOn() { return LEGO_U.value > 0.5; },
    people: PEOPLE, objects: OBJS.filter(o => o.parts.length && !o.seated), personGeo, signMesh, detailMat: mat, signCanvas: t => signCanvas.get(t) || null, lampMesh };
}
