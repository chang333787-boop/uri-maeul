import { createMinimap } from './minimap.js?v=13';
import { createGamePicker } from './gamepick.js?v=16';
import { createEngine } from './engine.js?v=15';
import { createWorldFx } from './worldfx.js?v=20';

export const digitOf = e => { const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code || ''); return m ? +m[1] : 0; };
export function createMapApi(host, NAV, META) {
  const { THREE, scene, world, SCHOOL, q, pl, ui } = host;
  const HOT = host.hot, Z = world.zones, P = pl.P, CTRL = pl.CTRL;
  const warn = { zonesNoMeta: [], metaNoZone: [], dupIds: [] };
  const R2D = Math.PI / 180;

  const BRECT = (() => { const B = SCHOOL.building, g = SCHOOL.gym;
    return [['main', B.front], ['main', B.entrance], ['west', B.wings[0]], ['cafe', B.kitchen], ['link', B.centerLobby], ['link', B.linkCorridor], ['east', B.eastWing],
      ['gym', { x: [g.center[0] - g.width / 2, g.center[0] + g.width / 2], z: [g.center[1] - g.depth / 2, g.center[1] + g.depth / 2] }], ['gym', g.annex]]
      .map(([id, r]) => ({ id, x0: r.x[0], x1: r.x[1], z0: r.z[0], z1: r.z[1] })); })();
  const bldgAt = (x, z) => { for (const b of BRECT) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return b.id; return null; };
  const byId = new Map();

  const primary = new Map();
  for (const z of Z) { const m = META.ZONE_META[z.label]; if (!m || !m.opts.multi) continue;
    const a = (z.x1 - z.x0) * (z.z1 - z.z0), p = primary.get(z.label); if (!p || a > p.a) primary.set(z.label, { z, a }); }
  function enrich(z, m) {
    if (!m) {
      warn.zonesNoMeta.push(z.label);
      const b = bldgAt((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2);
      m = { id: 'z-' + z.label.replace(/\s+/g, '-'), kind: b ? 'hall' : 'yard', bldg: b, tags: ['nometa'], opts: {} };
    }
    const y = z.y ?? 0, yr = m.opts.yr || [y - 1.2, y + 1.2];
    Object.assign(z, { id: m.id, kind: m.kind, bldg: m.bldg, tags: m.tags.slice(), indoor: m.opts.indoor ?? (m.bldg !== null),
      floor: y >= 3 ? 2 : 1, y0: yr[0], y1: yr[1], area: (z.x1 - z.x0) * (z.z1 - z.z0), cx: (z.x0 + z.x1) / 2, cz: (z.z0 + z.z1) / 2 });
    if (m.opts.multi && primary.has(z.label) && primary.get(z.label).z !== z) { let k = 2; while (byId.has(m.id + '-' + k)) k++; z.id = m.id + '-' + k; }
    if (byId.has(z.id)) warn.dupIds.push(z.id); else byId.set(z.id, z);
  }
  Z.forEach(z => enrich(z, META.ZONE_META[z.label]));
  for (const lab of Object.keys(META.ZONE_META)) if (!Z.some(z => z.label === lab)) warn.metaNoZone.push(lab);
  for (const ez of META.EXTRA_ZONES) { const z = { x0: ez.x0, x1: ez.x1, z0: ez.z0, z1: ez.z1, y: ez.y, label: ez.label, extra: true }; Z.push(z); enrich(z, ez.meta); }

  const inZone = (z, x, y, zz) => x >= z.x0 && x < z.x1 && zz >= z.z0 && zz < z.z1 && y >= z.y0 && y < z.y1;
  function zoneIndex(x, y, zz) { let best = -1, ba = 1e18; for (let i = 0; i < Z.length; i++) { const z = Z[i]; if (z.area < ba && inZone(z, x, y, zz)) { best = i; ba = z.area; } } return best; }
  const zoneAt = (x, y, zz) => { const i = zoneIndex(x, y, zz); return i < 0 ? null : Z[i]; };

  const zone = key => byId.get(key) || (Object.prototype.hasOwnProperty.call(META.ZONE_META, key) && byId.get(META.ZONE_META[key].id)) || Z.find(z => z.label === key) || null;
  const matchZone = (z, f = {}) => !!z && (!f.kind || z.kind === f.kind) && (!f.kinds || f.kinds.includes(z.kind)) && (!f.zones || f.zones.includes(z.id) || f.zones.includes(z.label))
    && (!f.tags || f.tags.every(t => z.tags.includes(t))) && (!f.notTags || !f.notTags.some(t => z.tags.includes(t)))
    && (f.indoor === undefined || z.indoor === f.indoor) && (!f.floor || z.floor === f.floor) && (f.bldg === undefined || z.bldg === f.bldg);
  const zonesWhere = f => Z.filter(z => matchZone(z, f));

  const poly = SCHOOL.boundary;
  const inSchool = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const U = world.UPPER;
  const floorY = (x, z, floor = 1) => (floor === 2 && x > U[0] && x < U[1] && z > U[2] && z < U[3]) ? q.groundAt(x, z, U[4] + 0.3) : q.groundAt(x, z, world.baseAt(x, z) + 0.3);

  let seenArr = new Uint32Array(8192), seenGen = 0;
  function ray(a, b, opt = {}) {
    const ign = opt.ignoreNc !== false, minH = opt.minH || 0, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    let t = 1, hit = false; if (++seenGen > 0x3fffffff) { seenArr.fill(0); seenGen = 1; } if (seenArr.length < world.colliders.length) seenArr = new Uint32Array(world.colliders.length * 2);
    for (let gx = Math.floor(Math.min(a[0], b[0]) / 8); gx <= Math.floor(Math.max(a[0], b[0]) / 8); gx++)
      for (let gz = Math.floor(Math.min(a[2], b[2]) / 8); gz <= Math.floor(Math.max(a[2], b[2]) / 8); gz++) {
        const cell = world.cell ? world.cell(gx, gz) : world.grid.get(gx + ':' + gz); if (!cell) continue;
        for (let k9 = 0; k9 < cell.length; k9++) { const i = cell[k9]; if (seenArr[i] === seenGen) continue; seenArr[i] = seenGen; const c = world.colliders[i];
          if ((ign && c.nc) || c.y1 - c.y0 < minH) continue;
          let t0 = 0, t1 = t, ok = true;
          for (let ax = 0; ax < 3 && ok; ax++) { const o = a[ax], d = ax === 0 ? dx : ax === 1 ? dy : dz, lo = ax === 0 ? c.x0 : ax === 1 ? c.y0 : c.z0, hi = ax === 0 ? c.x1 : ax === 1 ? c.y1 : c.z1;
            if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) ok = false; } else { let p = (lo - o) / d, r = (hi - o) / d; if (p > r) { const s = p; p = r; r = s; } if (p > t0) t0 = p; if (r < t1) t1 = r; if (t0 > t1) ok = false; } }
          if (ok && t0 < t) { t = t0; hit = true; } }
      }
    return hit ? t : null;
  }

  function rayHit(a, b, opt = {}) {
    const skipDyn = !!opt.skipDyn, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    let t = 1, hc = null, hax = 0; if (++seenGen > 0x3fffffff) { seenArr.fill(0); seenGen = 1; } if (seenArr.length < world.colliders.length) seenArr = new Uint32Array(world.colliders.length * 2);
    for (let gx = Math.floor(Math.min(a[0], b[0]) / 8); gx <= Math.floor(Math.max(a[0], b[0]) / 8); gx++)
      for (let gz = Math.floor(Math.min(a[2], b[2]) / 8); gz <= Math.floor(Math.max(a[2], b[2]) / 8); gz++) {
        const cell = world.cell ? world.cell(gx, gz) : world.grid.get(gx + ':' + gz); if (!cell) continue;
        for (let k9 = 0; k9 < cell.length; k9++) { const i = cell[k9]; if (seenArr[i] === seenGen) continue; seenArr[i] = seenGen; const c = world.colliders[i];
          if (c.y1 < -1e5 || (skipDyn && c.dyn) || (c.nc && c.vy1 == null) || (opt.skip && opt.skip(c))) continue;
          const top = c.vy1 != null ? c.vy1 : c.y1; let t0 = 0, t1 = t, ok = true, ax9 = -1;
          for (let ax = 0; ax < 3 && ok; ax++) { const o = a[ax], d = ax === 0 ? dx : ax === 1 ? dy : dz, lo = ax === 0 ? c.x0 : ax === 1 ? c.y0 : c.z0, hi = ax === 0 ? c.x1 : ax === 1 ? top : c.z1;
            if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) ok = false; } else { let p = (lo - o) / d, r = (hi - o) / d; if (p > r) { const s = p; p = r; r = s; } if (p > t0) { t0 = p; ax9 = ax; } if (r < t1) t1 = r; if (t0 > t1) ok = false; } }
          if (ok && ax9 >= 0 && t0 < t) { t = t0; hc = c; hax = ax9; } }
      }
    if (!hc) return null;
    const n = [0, 0, 0]; n[hax] = -Math.sign(hax === 0 ? dx : hax === 1 ? dy : dz);
    return { t, n, dyn: !!hc.dyn, ns: hc.vy1 != null, box: hc };
  }

  function overlap(b, opt = {}) {
    const skipDyn = !!opt.skipDyn;
    for (let gx = Math.floor(b.x0 / 8); gx <= Math.floor(b.x1 / 8); gx++) for (let gz = Math.floor(b.z0 / 8); gz <= Math.floor(b.z1 / 8); gz++) {
      const cell = world.cell ? world.cell(gx, gz) : world.grid.get(gx + ':' + gz); if (!cell) continue;
      for (let k9 = 0; k9 < cell.length; k9++) { const c = world.colliders[cell[k9]]; if (c.y1 < -1e5 || (skipDyn && c.dyn)) continue; const top = c.vy1 != null ? c.vy1 : c.y1;
        if (b.x1 > c.x0 && b.x0 < c.x1 && b.z1 > c.z0 && b.z0 < c.z1 && b.y1 > c.y0 && b.y0 < top) return c; }
    }
    return null;
  }
  const Q = {
    groundAt: q.groundAt, blocked: q.blockedAt, ceilAt: q.ceilAt, floorY, ray, rayHit, overlap, los: (a, b, o) => ray(a, b, o) === null, inSchool,
    baseAt: (x, z) => world.baseAt(x, z),
    gardenBeds: () => (world.gardenBare || []).map(b => b.slice()),
    indoor: (x, y, z) => q.ceilAt(x, z, y + 1.6, y + 5.5) !== null,

    moveBody(p, dx, dz) { if (!q.blockedAt(p.x + dx, p.z, p.y)) p.x += dx; if (!q.blockedAt(p.x, p.z + dz, p.y)) p.z += dz; const g = q.groundAt(p.x, p.z, p.y); if (g <= p.y + 0.55) p.y = g; return p; },
  };

  const POI = new Map();
  const addPoi = p => { POI.set(p.id, p); return p; };

  function findEntry(cx, cz, fy, rect, maxR = 14) {
    const ok = (x, z) => { if (rect && (x < rect[0] + 0.4 || x > rect[2] - 0.4 || z < rect[1] + 0.4 || z > rect[3] - 0.4)) return null;
      const g = q.groundAt(x, z, fy + 0.3); if (Math.abs(g - fy) > 0.35 || q.blockedAt(x, z, g)) return null;
      for (const [ox, oz] of [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) if (q.blockedAt(x + ox, z + oz, g)) return null; return g; };
    for (let r = 0; r <= maxR; r += 0.3) for (let k = 0; k < (r ? 24 : 1); k++) { const a = k * Math.PI / 12, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, g = ok(x, z); if (g !== null) return { x, y: g, z }; }
    return null;
  }
  const entryBad = [];
  for (const z of Z) {
    const e = findEntry(z.cx, z.cz, z.y ?? 0, [z.x0, z.z0, z.x1, z.z1]);
    if (!e) entryBad.push(z.id);
    addPoi({ id: 'zone:' + z.id, label: z.label, x: e ? e.x : z.cx, y: e ? e.y : (z.y ?? 0), z: e ? e.z : z.cz, zone: z.id, tags: z.tags, stand: e ? [e.x, e.y, e.z] : null, src: 'zone', entry: !!e });
  }
  for (const L of META.LANDMARKS) {
    const y = world.terrainAt(L.at[0], L.at[1]), e = findEntry(L.at[0], L.at[1], y, null, 10);
    addPoi({ id: 'lm:' + L.id, label: L.label, x: L.at[0], y, z: L.at[1], r: L.r, rect: L.rect || null, zone: (zoneAt(L.at[0], y, L.at[1]) || {}).id || null, tags: ['landmark'], stand: e ? [e.x, e.y, e.z] : null, src: 'landmark' });
  }
  for (const [id, s] of Object.entries(META.SPAWNS)) {
    const y = floorY(s.x, s.z, s.floor || 1);
    addPoi({ id: 'spawn:' + id, label: s.label, x: s.x, y, z: s.z, h: s.h || 0, floor: s.floor || 1, zone: (zoneAt(s.x, y, s.z) || {}).id || null, tags: ['spawn'], stand: [s.x, y, s.z], src: 'spawn' });
  }
  { const cnt = {}; HOT.forEach(h => { const zn = (zoneAt(h.x, h.y, h.z) || {}).id || 'out', k = h.kind + ':' + zn; cnt[k] = (cnt[k] || 0) + 1;
      h.id = 'hot:' + k + ':' + cnt[k]; addPoi({ id: h.id, label: h.label, x: h.x, y: h.y, z: h.z, r: h.r, zone: zn, tags: ['hot', h.kind], stand: null, src: 'hot', hot: h }); }); }
  world.doors.forEach((d, n) => {
    const nx = d.ax === 'x' ? 0 : 0.9, nz = d.ax === 'x' ? 0.9 : 0, y = d.y0 + 0.05;
    const za = zoneAt(d.cx - nx, y, d.cz - nz), zb = zoneAt(d.cx + nx, y, d.cz + nz);
    d.zones = [za && za.id, zb && zb.id];
    addPoi({ id: 'door:' + n, label: '문', x: d.cx, y: d.y0, z: d.cz, zone: (za || zb || {}).id || null, zones: d.zones, tags: ['door'], stand: null, src: 'door', door: d });
  });
  const poi = id => POI.get(id) || null;
  const pois = (f = {}) => [...POI.values()].filter(p => (!f.src || p.src === f.src) && (!f.zone || p.zone === f.zone) && (!f.tag || p.tags.includes(f.tag)));

  function resolve(t, floor = 1) {
    if (t == null) return null;
    if (typeof t === 'number') { const N = navCache.get('walk'); return N && N.done ? xyz(N.done.pos(t)) : null; }
    if (Array.isArray(t)) return t.length === 2 ? { x: t[0], y: floorY(t[0], t[1], floor), z: t[1] } : { x: t[0], y: t[1], z: t[2] };
    if (typeof t === 'object') return { x: t.x, y: t.y ?? floorY(t.x, t.z, floor), z: t.z };
    let p = POI.get(t);
    if (!p && t.startsWith('zone:')) { const z = zone(t.slice(5)); p = z && POI.get('zone:' + z.id); }
    if (!p) return null;
    const s = p.stand || [p.x, p.y, p.z]; return { x: s[0], y: s[1], z: s[2], h: p.h, floor: p.floor };
  }
  const xyz = a => ({ x: a[0], y: a[1], z: a[2] });

  const L = new Map();
  function on(type, fn) { if (!L.has(type)) L.set(type, new Set()); L.get(type).add(fn); return () => L.get(type).delete(fn); }
  function emit(type, ev) { const s = L.get(type); if (!s) return; for (const fn of [...s]) { try { fn(ev); } catch (e) { console.error('[map] 이벤트 처리 중 오류(' + type + ')', e); } } }

  const PXYZ = { x: 0, y: 0, z: 0 };
  const S0 = { view: null };
  const setHeading = h => { pl.setYaw(-h * R2D); P.yaw = Math.atan2(Math.sin(h * R2D), -Math.cos(h * R2D)); };

  let FREE_DEF = new URLSearchParams(location.search).get('free') === '1'; try { if (!window.SM_PROMO && localStorage.getItem('sm-mouse') === 'drag') FREE_DEF = true; } catch (e) {   }
  { const h = document.getElementById('help'); if (h && !/Tab/.test(h.textContent)) h.textContent = h.textContent.replace(/시점 마우스\(클릭\)/, '시점 마우스(클릭) · 마우스 보이기 Tab'); }
  function helpFree(on) {
    const h = document.getElementById('help'); if (!h) return;
    if (on) { if (h.dataset.o == null) h.dataset.o = h.textContent; h.textContent = h.dataset.o.replace(/시점 마우스\(클릭\)/, '둘러보기 = 화면을 누른 채 끌기 · ←→'); }
    else if (h.dataset.o != null) { h.textContent = h.dataset.o; delete h.dataset.o; }
  }
  CTRL.freeMouse = FREE_DEF; helpFree(FREE_DEF);
  const player = {
    pos: () => { PXYZ.x = P.x; PXYZ.y = P.y; PXYZ.z = P.z; return PXYZ; },
    get: () => { const zn = zoneAt(P.x, P.y, P.z); return { x: P.x, y: P.y, z: P.z, h: ((-pl.getYaw() / R2D) % 360 + 360) % 360, ground: P.ground, zone: zn ? zn.id : null }; },
    teleport(target, o = {}) {
      const r = resolve(target, o.floor || 1); if (!r) { console.warn('[map] teleport: 모르는 대상', target); return false; }
      pl.ACT.anim = null; pl.ACT.sit = null; if (pl.acts) pl.acts.stop(true); P.x = r.x; P.z = r.z; P.y = r.y + 0.01; P.vy = 0; P.ground = true;
      const h = o.h ?? r.h; if (h != null) setHeading(h);
      emit('teleport', { x: P.x, y: P.y, z: P.z }); return true;
    },
    face(h) { setHeading(h); },
    lookAt(target) { const r = resolve(target); if (r) setHeading(Math.atan2(r.x - P.x, -(r.z - P.z)) / R2D); },
    unstick: () => unstick(),

    get moving() { if (CTRL.frozen || pl.ACT.anim || pl.ACT.sit) return false; if (CTRL.steer || (pl.touch && pl.touch.m > 0)) return true; if (pl.keys) for (const k of MOVE_KEYS) if (pl.keys.has(k)) return true; return false; },
    relock() { if (CTRL.freeMouse || (pl.touch && pl.touch.on) || document.pointerLockElement) return false; try { const r9 = host.renderer && host.renderer.domElement.requestPointerLock(); if (r9 && r9.catch) { r9.catch(() => {}); return r9; } } catch (e) { return false; } return true; },
    logStuck(why) { if (stuckLog.length < 50) stuckLog.push([+P.x.toFixed(2), +P.y.toFixed(2), +P.z.toFixed(2), +tSec.toFixed(1), why || 'game']); },
    freeze(on2 = true) { CTRL.frozen = !!on2; },

    aim(h) { CTRL.face = h == null ? null : Math.atan2(Math.sin(h * R2D), -Math.cos(h * R2D)); },

    shoulder(m = 0) { CTRL.shoulder = Math.max(-1, Math.min(1, +m || 0)); },
    speed(k = 1) { CTRL.speed = Math.max(0.5, Math.min(6, k)); },
    get input() { if (pl.touch && pl.touch.m > 0) return true; if (pl.keys) for (const k of MOVE_KEYS) if (pl.keys.has(k)) return true; return false; },
    pose(name, o) { CTRL.pose = name || null; CTRL.poseY = (o && o.y) || 0; CTRL.poseK = o ? (o.tuck ? 1 : 0) | (o.plough ? 2 : 0) : 0; },
    jump(on = true) { CTRL.noJump = !on; },
    glide(v) { CTRL.glide = v > 0 ? +v : 0; },
    pin(o) { CTRL.pin = o || null; },
    turnMax(v) { CTRL.turnMax = v > 0 ? +v : null; },
    slip(on) { CTRL.slip = !!on; },
    leanMax(v) { CTRL.leanMax = v > 0 ? +v : null; },
    get vy() { return pl.P ? pl.P.vy : 0; },
    show(on = true) { CTRL.hideMe = !on; },
    zoom(k) { CTRL.zoom = k > 1 ? Math.min(6, +k) : null; },
    get rig() { return host.kid ? host.kid.KID : null; },
    held: code => !!(pl.keys && pl.keys.has(code)),
    stick: () => (pl.touch && pl.touch.m > 0 ? pl.touch : null),
    ride(on = true) { CTRL.ride = !!on; },
    run(on = true) { CTRL.noRun = !on; },

    view(v) { if (S0.view == null) S0.view = pl.getFirst(); pl.setFirst(v === 'first'); },
    get first() { return pl.getFirst(); },
    mouseMode(m) { if (m == null) return FREE_DEF ? 'drag' : 'lock'; if (window.SM_PROMO) return; FREE_DEF = m === 'drag'; try { localStorage.setItem('sm-mouse', FREE_DEF ? 'drag' : 'lock'); } catch (e) {   } player.freeMouse(FREE_DEF); },
    freeMouse(on = true) { CTRL.freeMouse = !!on; if (on && document.pointerLockElement) document.exitPointerLock(); helpFree(!!on); },
    pitchLow(lo) { CTRL.pitchLo = lo == null ? null : Math.max(-1.3, Math.min(-0.2, +lo)); },
    roomCam(o) { CTRL.room = o ? { d: Math.max(2.5, Math.min(6, +o.d || 3.6)), p: Math.max(0.2, Math.min(0.8, +o.p || 0.5)) } : null; },
    look(dx, dy) { pl.look(dx || 0, dy || 0); },
    get pitch() { return pl.getPitch(); }, setPitch(v) { if (Number.isFinite(v)) pl.look(0, (v - pl.getPitch()) / 0.0042); },

    steer(dx, dz, v = 4.2, cam = true) { if (dx == null) { CTRL.steer = null; return; } const L = Math.hypot(dx, dz); if (L < 1e-6) { CTRL.steer = null; return; }
      const st = CTRL.steer || (CTRL._st || (CTRL._st = {})); st.x = dx / L; st.z = dz / L; st.v = Math.max(0.5, Math.min(7.5, v)); st.cam = !!cam; CTRL.steer = st; },

    act(name, o = {}) { return pl.acts ? pl.acts.play(name, o) : null; },
    get acting() { return pl.acts ? pl.acts.cur : null; },

    hold(name) { return pl.acts && pl.acts.hold ? pl.acts.hold(name || null) : false; },
    get holding() { return pl.acts && pl.acts.hold ? pl.acts.holding : null; },
    holdUse(on = true) { if (pl.acts && pl.acts.holdUse) pl.acts.holdUse(on); },
    toolTip() { return pl.acts && pl.acts.toolTip ? pl.acts.toolTip() : null; },
  };

  let gid = 0;
  const interact = {

    add(o) { const h = { kind: o.kind || 'game', x: o.x, y: o.y ?? floorY(o.x, o.z), z: o.z, r: o.r ?? 1.2, label: o.label || '살펴보기', use: o.use, once: !!o.once, id: 'game:' + (o.owner || 'map') + ':' + (++gid) };
      for (const k of ['yaw', 'seat', 'from', 'to', 'at', 'dur']) if (o[k] != null) h[k] = o[k];
      HOT.push(h); addPoi({ id: h.id, label: h.label, x: h.x, y: h.y, z: h.z, r: h.r, zone: (zoneAt(h.x, h.y, h.z) || {}).id || null, tags: ['game'], stand: null, src: 'game', hot: h });
      return { hot: h, remove() { const i = HOT.indexOf(h); if (i >= 0) HOT.splice(i, 1); POI.delete(h.id); } }; },

    enable(filter, on2) { const f = typeof filter === 'function' ? filter : h => h.kind === filter; const hit = HOT.filter(f), prev = hit.map(h => (h.fOff != null ? h.fOff : !!h.off));
      const set = (h, v) => { if (h.fOff != null) h.fOff = v; else h.off = v; };
      hit.forEach(h => set(h, !on2)); return { remove() { hit.forEach((h, i) => set(h, prev[i])); } }; },
    list: (f = {}) => HOT.filter(h => (!f.kind || h.kind === f.kind) && (!f.zone || (zoneAt(h.x, h.y, h.z) || {}).id === f.zone)),
  };
  const TRIG = new Set();
  const trigger = {

    add(shape, cb = {}) { const t = { shape, cb, inside: false }; TRIG.add(t); return { remove() { TRIG.delete(t); } }; },
  };
  const trigIn = s => s.rect ? (P.x >= s.rect[0] && P.x <= s.rect[2] && P.z >= s.rect[1] && P.z <= s.rect[3] && P.y >= (s.y0 ?? -1e9) && P.y <= (s.y1 ?? 1e9))
    : ((P.x - s.x) ** 2 + (P.z - s.z) ** 2 < s.r * s.r && Math.abs(P.y - (s.y ?? P.y)) < 1.6);
  const CFREE = [], DBG9 = /[?&]debug=1/.test(location.search);
  const collider = {

    add(b, o = {}) {
      const c = { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, z0: b.z0, z1: b.z1, nc: !!(o.ns || b.nc), dyn: true }; if (o.ns) { c.vy1 = c.y1; c.y1 = Math.max(c.y1, c.y0 + 1.6); }
      let i; if (CFREE.length) { i = CFREE.pop(); world.colliders[i] = c; } else i = world.colliders.push(c) - 1; const cells = []; let dead = false; if (pl.tinyAdd) pl.tinyAdd(c);
      for (let gx = Math.floor(c.x0 / 8); gx <= Math.floor(c.x1 / 8); gx++) for (let gz = Math.floor(c.z0 / 8); gz <= Math.floor(c.z1 / 8); gz++) { const k = gx + ':' + gz; if (!world.grid.has(k)) world.grid.set(k, []); world.grid.get(k).push(i); cells.push(k); }
      return { box: c, remove() { if (dead) return; dead = true; c.y0 = c.y1 = -1e6; for (const k of cells) { const a = world.grid.get(k), j = a ? a.indexOf(i) : -1; if (j >= 0) a.splice(j, 1); } cells.length = 0; if (world.colliders[i] === c) { world.colliders[i] = { x0: 0, x1: 0, y0: -1e6, y1: -1e6, z0: 0, z1: 0, nc: true, dyn: true }; CFREE.push(i); } } };
    },
  };

  const arena = { shape: null, out: 0, safe: null, safeT: 0 };
  const inArena = (x, z) => { const s = arena.shape; if (!s) return true; if (s === 'school') return inSchool(x, z); if (s.fn) return !!s.fn(x, z);     if (s.rect) return x >= s.rect[0] && x <= s.rect[2] && z >= s.rect[1] && z <= s.rect[3];
    if (s.poly) { let c = false; const p = s.poly; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; } return true; };
  const arenaApi = { set(s) { arena.shape = s || null; arena.out = 0; arena.safe = null; return { remove() { if (arena.shape === s) arena.shape = null; } }; }, get: () => arena.shape };

  const el = (css, txt = '') => { const d = document.createElement('div'); d.className = 'chip'; d.style.cssText = css; d.textContent = txt; document.body.appendChild(d); return d; };
  const chips = new Map(); let banEl = null, banT = 0, goalEl = null, MM = null;

  const small = () => document.body.classList.contains('small');
  const chipText = t => small() || (document.body.classList.contains('touch') && !window.SM_PROMO) ? String(t).replace(/\s*\((?:[A-Z]|[A-Z]:[^)]*)\)\s*$/, '') : t;

  const slot = c => c.tap && document.body.classList.contains('touch') ? 44 : document.body.classList.contains('h-town') ? Math.max(small() ? 30 : 34, (c.el.offsetHeight || 0) + 6) : small() ? 30 : 34;

  const shortChip = t => { t = String(t).trim(); if ([...t].length <= 8) return t; const p = t.split(/\s+/), n = t.match(/\d+\s*\/\s*\d+/); if (n) return p[0] + ' ' + n[0].replace(/\s+/g, ''); const w = [...(p[1] || '')]; return p[0] + (w.length ? ' ' + (w.length > 6 ? w.slice(0, 5).join('') + '…' : w.join('')) : ''); };
  const rowMode = () => small() && document.body.classList.contains('touch') && innerWidth > innerHeight;
  let chipAnchor = null;

  const setTx = (el, t) => { if (el.textContent !== t) el.textContent = t; };
  const layoutChips = () => { const r = chipAnchor ? chipAnchor() : MM && MM.rect(), sm = small(), st = sm ? 30 : 34, L = [...chips.values()]; let tot = 0; for (const c of L) tot += slot(c);
    if (rowMode()) { let x = r && !r.big ? r.right + r.w + 8 : 10; const y = 52;
      for (const c of L) if (c.raw != null) setTx(c.el, shortChip(chipText(c.raw))); const WH = L.map(c => [c.el.offsetWidth || 60, c.el.offsetHeight || 26]);
      L.forEach((c, i) => { const h = slot(c); c.el.style.top = (y + (h === 44 ? Math.max(0, Math.round((44 - WH[i][1]) / 2)) : 0)) + 'px'; c.el.style.right = 'calc(' + x + 'px + env(safe-area-inset-right))'; x += WH[i][0] + 6; });
      return; }
    const side = r && (r.big || (document.body.classList.contains('touch') && r.top + r.h + 8 + tot > innerHeight - (sm ? 90 : 110)));
    const top0 = r && !side ? r.top + r.h + (sm ? 6 : 8) : side && !r.big && document.body.classList.contains('touch') ? 56 : sm ? 8 : 44, right = side ? r.right + r.w + 8 : r ? r.right : 10; let k = 0;
    for (const c of L) if (c.raw != null) setTx(c.el, chipText(c.raw)); const HH = L.map(c => slot(c) === 44 ? c.el.offsetHeight || 26 : 0);
    L.forEach((c, i) => { const h = slot(c); c.el.style.top = (top0 + k + (h === 44 ? Math.max(0, Math.round((44 - HH[i]) / 2)) : 0)) + 'px'; k += h - st; c.el.style.right = r && !side ? right + 'px' : 'calc(' + right + 'px + env(safe-area-inset-right))'; k += st; }); };
  addEventListener('resize', () => layoutChips());
  const hud = {
    toast: (text, sec = 2.2) => ui.toast(text, sec),
    banner(text, sec = 2.5) { if (!banEl) { banEl = el('left:50%;top:38%;transform:translate(-50%,-50%);font-size:30px;font-weight:700;padding:14px 28px;display:none;pointer-events:none'); banEl.id = 'hudBan'; } banEl.textContent = text; banEl.style.display = ''; banT = sec; return { remove() { banEl.style.display = 'none'; banT = 0; } }; },

    anchor(fn) { chipAnchor = typeof fn === 'function' ? fn : null; layoutChips(); },
    chip(key, text, opt) { let c = chips.get(key); if (text == null) { if (c) { c.el.remove(); chips.delete(key); layoutChips(); } return null; }
      if (!c) { c = { el: el('right:10px;font-size:14px') }; c.el.classList.add('gchip'); chips.set(key, c); layoutChips(); } const was = c.raw; c.raw = text; c.el.textContent = rowMode() ? shortChip(chipText(text)) : chipText(text); if (rowMode() && was !== text) layoutChips();
      if (opt && opt.onClick) { if (!c.tap) { c.tap = true; c.el.classList.add('gtap'); layoutChips(); } c.el.style.cursor = 'pointer'; c.el.onclick = e => { e.stopPropagation(); try { opt.onClick(); } catch (err) { console.error(err); } }; }
      return { remove: () => hud.chip(key, null) }; },

    goal(text) { if (text == null) { if (goalEl) goalEl.style.display = 'none'; return null; }
      if (!goalEl) { goalEl = el('left:50%;top:10px;transform:translateX(-50%);font-size:19px;font-weight:700;padding:7px 18px;border-radius:12px;pointer-events:none;white-space:nowrap;display:none'); goalEl.id = 'hudGoal'; }
      goalEl.textContent = chipText(text); goalEl.style.display = ''; return { remove: () => hud.goal(null) }; },

    ask(title, choices, onHandle) {
      return new Promise(res => {
        document.exitPointerLock?.(); const was = CTRL.frozen; CTRL.frozen = true;
        const box = el('left:50%;top:50%;transform:translate(-50%,-50%);font-size:18px;padding:16px 20px;max-width:560px;max-height:90vh;overflow:auto;text-align:center'); box.classList.add('hudAsk');
        const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'font-weight:700;margin-bottom:12px;white-space:pre-line;line-height:1.45'; box.appendChild(h);
        let hh = null;
        const done = i => { removeEventListener('keydown', kd, true); box.remove(); CTRL.frozen = was; if (hh) hh.remove(); res(i); };
        const kd = e => { const n = digitOf(e); if (n >= 1 && n <= choices.length) { e.stopPropagation(); done(n - 1); } };
        choices.forEach((c, i) => { const b = document.createElement('button'); b.textContent = (i + 1) + '. ' + c; b.style.cssText = 'display:block;width:100%;min-height:44px;margin:6px 0;font-size:16px;border-radius:8px;border:0;cursor:pointer';
          b.addEventListener('click', ev => { ev.stopPropagation(); done(i); }); box.appendChild(b); });
        addEventListener('keydown', kd, true);
        if (onHandle) hh = onHandle({ remove: () => { if (box.isConnected) done(-1); } }) || null;
      });
    },
  };

  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
  let MK = null; const marks = [];
  function mkPool() {
    if (MK) return MK; const cap = 64;
    const dia = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), cap);
    const beam = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 10, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }), cap);
    for (const m of [dia, beam]) { m.count = 0; m.frustumCulled = false; m.visible = false; m.setColorAt(0, _c.set(0xffffff)); scene.add(m); }
    beam.renderOrder = 2; return (MK = { dia, beam, cap });
  }
  let mkT = 0;
  function mkTick(dt) {
    if (!marks.length) return; mkT += dt; const K = mkPool();
    for (let i = 0; i < marks.length; i++) { const m = marks[i];
      _m4.compose(_v.set(m.x, m.y + 1.1 + Math.sin(mkT * 2.4 + i) * 0.12, m.z), _q.setFromEuler(_e.set(0, mkT * 1.8 + i, 0)), _s.set(1, 1.35, 1)); K.dia.setMatrixAt(i, _m4);
      _m4.compose(_v.set(m.x, m.y + 0.06, m.z), _q.identity(), _s.set(1, m.beam ? 7 : 0.001, 1)); K.beam.setMatrixAt(i, _m4);
    }
    K.dia.instanceMatrix.needsUpdate = K.beam.instanceMatrix.needsUpdate = true;
  }
  function mkSync() { const K = mkPool(); K.dia.count = K.beam.count = marks.length; K.dia.visible = K.beam.visible = marks.length > 0;
    marks.forEach((m, i) => { K.dia.setColorAt(i, _c.set(m.color)); K.beam.setColorAt(i, _c.set(m.color)); });
    if (K.dia.instanceColor) K.dia.instanceColor.needsUpdate = true; if (K.beam.instanceColor) K.beam.instanceColor.needsUpdate = true; mkTick(0); }
  const MATS = new Map();
  const lam = (c, glow) => { const k = 'l' + c + (glow ? 'g' : ''); if (!MATS.has(k)) MATS.set(k, new THREE.MeshLambertMaterial(glow ? { color: c, emissive: c, emissiveIntensity: 0.45 } : { color: c })); return MATS.get(k); };

  const starGeo = () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.4; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06); };
  const mk = {

    marker(x, y, z, o = {}) { if (marks.length >= mkPool().cap) { console.warn('[map] 표식 64개 초과'); return { remove() {}, set() {} }; }
      const m = { x, y, z, color: o.color ?? 0xffd23c, beam: o.beam !== false }; marks.push(m); mkSync();
      return { set(nx, ny, nz) { m.x = nx; m.y = ny; m.z = nz; }, color(c) { m.color = c; mkSync(); }, remove() { const i = marks.indexOf(m); if (i >= 0) { marks.splice(i, 1); mkSync(); } } }; },

    trail(pts, o = {}) {
      const W = (o.width || 0.35) / 2, pos = [];
      for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * W, nz = dx / l * W, ya = a[1] + 0.06, yb = b[1] + 0.06;
        pos.push(a[0] + nx, ya, a[2] + nz, b[0] + nx, yb, b[2] + nz, b[0] - nx, yb, b[2] - nz, a[0] + nx, ya, a[2] + nz, b[0] - nx, yb, b[2] - nz, a[0] - nx, ya, a[2] - nz); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: o.color ?? 0x3cc8ff, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.renderOrder = 3; scene.add(m); return { obj: m, remove() { scene.remove(m); g.dispose(); m.material.dispose(); } };
    },

    many(kind, count, o = {}) {
      const geo = kind === 'cone' ? new THREE.ConeGeometry(0.28, 0.7, 12).translate(0, 0.35, 0) : kind === 'box' ? new THREE.BoxGeometry(0.5, 0.5, 0.5).translate(0, 0.25, 0)
        : kind === 'star' ? starGeo() : new THREE.IcosahedronGeometry(0.35, 1);
      const m = new THREE.InstancedMesh(geo, lam(o.color ?? 0xffffff, o.glow), count); m.frustumCulled = false; scene.add(m);
      for (let i = 0; i < count; i++) m.setMatrixAt(i, _m4.makeScale(0, 0, 0));
      return { mesh: m, count, set(i, x, y, z, s = 1, ry = 0) { m.setMatrixAt(i, _m4.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s))); m.instanceMatrix.needsUpdate = true; },
        hide(i) { m.setMatrixAt(i, _m4.makeScale(0, 0, 0)); m.instanceMatrix.needsUpdate = true; }, setColor(i, c) { m.setColorAt(i, _c.set(c)); m.instanceColor.needsUpdate = true; },
        remove() { scene.remove(m); geo.dispose(); } };
    },
    add(obj) { scene.add(obj); return { obj, remove() { scene.remove(obj); } }; },
  };

  const navCache = new Map();
  const navKey = o => o.jump ? 'jump:' + o.jump : 'walk';
  function postNav(N) { const g = postNavGen(N); let r; while (!(r = g.next()).done); return r.value; }
  function* postNavGen(N) {
    yield* N.finishGen((x, y, z) => zoneIndex(x, y, z), inSchool);
    if (!N.jump) for (const p of POI.values()) { yield 0;
      if (p.src === 'zone') { const zi = Z.findIndex(z => 'zone:' + z.id === p.id); let best = -1, bd = 1e18;
        const i0 = N.snap(p.x, p.y, p.z, 1.0); if (i0 >= 0 && N.zone[i0] === zi) best = i0;
        else for (let i = 0; i < N.count; i++) if (N.zone[i] === zi && N.canReturn[i]) { const d = (N.X(i) - Z[zi].cx) ** 2 + (N.Z(i) - Z[zi].cz) ** 2; if (d < bd) { bd = d; best = i; } }
        if (best >= 0) { p.stand = N.pos(best); p.node = best; } }
      else if (!p.stand) { const i = N.snap(p.x, p.y, p.z, Math.max(4, (p.r || 0) + 1), -1.6, 1.6); if (i >= 0) { p.stand = N.pos(i); p.node = i; } }
    }
    return facade(N);
  }

  function facade(N) {
    const node = (t, r = 1.5) => { if (typeof t === 'number') return t; const p = typeof t === 'string' ? POI.get(t) || (t.startsWith('zone:') && POI.get('zone:' + (zone(t.slice(5)) || {}).id)) : null;
      if (p && p.node != null) return p.node; const x = resolve(t); return x ? N.snap(x.x, x.y, x.z, r) : -1; };
    const zoneF = f => { const tagOK = Z.map(z => matchZone(z, f)); return i => N.zone[i] >= 0 ? tagOK[N.zone[i]] : !(f.kind || f.kinds || f.zones || f.tags || f.indoor || f.floor || f.bldg); };
    const pools = new Map();
    const pool = (f, zf) => { const k = [f.kind, f.kinds, f.zones, f.tags, f.notTags, f.indoor, f.floor, f.bldg].map(v => v === undefined ? '~' : JSON.stringify(v)).join('|'); let P9 = pools.get(k);
      if (!P9) { const a = []; for (let i = 0; i < N.count; i++) if (zf(i)) a.push(i); P9 = Int32Array.from(a); if (pools.size > 64) pools.clear(); pools.set(k, P9); } return P9; };
    return {
      raw: N, count: N.count, traps: N.traps, S: N.S,
      snap: (x, y, z, r) => N.snap(x, y, z, r), node, pos: i => N.pos(i), zoneOf: i => (i >= 0 && N.zone[i] >= 0) ? Z[N.zone[i]] : null, inSchool: i => !!N.inSchool[i],

      path(a, b, o = {}) { const ia = node(a), ib = node(b), bad = o.forbidTags ? i => { const z = N.zone[i]; return z >= 0 && o.forbidTags.some(t => Z[z].tags.includes(t)); } : null;
        const cost = o.avoidTags ? i => { const z = N.zone[i]; return (z >= 0 && o.avoidTags.some(t => Z[z].tags.includes(t))) ? (o.avoidMul || 4) : 1; } : null;
        return N.path(ia, ib, { ...o, bad, cost }); },

      random(o = {}) { const f = { notTags: ['staff'], ...o }, zf = zoneF(f), i = N.random({ ...o, filter: zf, pool: pool(f, zf) }); return i < 0 ? null : N.pos(i); },
      distField: (a, maxLen) => N.distField(node(a), maxLen),
      block(t) { if (typeof t === 'string') { const zi = Z.indexOf(zone(t)); return N.block(i => N.zone[i] === zi); } return N.block(t); },
      export: () => N.export(),
    };
  }
  const navDirty = () => { try { return FX.solidN() > 0 || ENG.stats().locks > 0; } catch (e) { return false; } };

  function nav(o = {}, idle = false) { const k = navKey(o); let c = navCache.get(k);
    if (!c) { const cc = { dirty: navDirty(), ctl: { idle, onSlice: () => { if (!cc.dirty && navDirty()) cc.dirty = true; } } }; cc.p = NAV.buildSliced(q, o, 6, cc.ctl).then(N => NAV.sliced(postNavGen(N), 6, cc.ctl)).then(F => { if (navDirty()) cc.dirty = true; return (cc.done = F); }); navCache.set(k, (c = cc)); }
    else if (!idle && c.ctl) c.ctl.idle = false;
    return c.done ? Promise.resolve(c.done) : c.p; }
  const navIdle = () => { if (!navCache.has('walk')) nav({}, true).catch(e => console.error('[map] 길격자 미리 짓기 실패', e)); };

  function navSync(o = {}) { const k = navKey(o); let c = navCache.get(k); if (c && c.done && !o.fresh) return c.done; const N = NAV.buildSync(q, o); c = { done: postNav(N), dirty: navDirty() }; c.p = Promise.resolve(c.done); navCache.set(k, c); return c.done; }

  function mapData(floor = 1) {
    return { bounds: [NAV.RECT[0], NAV.RECT[1], NAV.RECT[2], NAV.RECT[3]], boundary: poly.map(p => p.slice()), buildings: BRECT.map(b => ({ ...b })),
      zones: Z.filter(z => z.floor === floor || (floor === 2 && z.floor === 1 && !z.indoor)).map(z => ({ id: z.id, label: z.label, kind: z.kind, floor: z.floor, indoor: z.indoor, x0: z.x0, x1: z.x1, z0: z.z0, z1: z.z1, area: z.area })),
      landmarks: pois({ src: 'landmark' }).map(p => ({ id: p.id, label: p.label, x: p.x, z: p.z })), spawns: pois({ src: 'spawn' }).map(p => ({ id: p.id, label: p.label, x: p.x, z: p.z, floor: p.floor })) };
  }
  const KCOL = { field: '#e6d6ab', path: '#dcd3c2', yard: '#c6d8ae', play: '#ecd08f', garden: '#c29a64', stair: '#e4d8bf', corridor: '#e4d8bf', hall: '#e4d8bf', stage: '#e9dcc0' };

  function drawMap(ctx, o = {}) {
    const D = mapData(o.floor || 1), s = o.scale || 4, ox = o.x0 ?? D.bounds[0], oz = o.z0 ?? D.bounds[1], X = x => (x - ox) * s, Y = z => (z - oz) * s;
    ctx.save(); ctx.fillStyle = '#d5dccb'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath(); D.boundary.forEach(([x, z], k) => k ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z))); ctx.closePath(); ctx.fillStyle = '#a9cd8c'; ctx.fill(); ctx.strokeStyle = '#5d7a4a'; ctx.lineWidth = 1.5; ctx.stroke();
    const zs = D.zones.slice().sort((a, b) => b.area - a.area);
    for (const z of zs) if (!z.indoor) { ctx.fillStyle = KCOL[z.kind] || '#c6d8ae'; ctx.fillRect(X(z.x0), Y(z.z0), (z.x1 - z.x0) * s, (z.z1 - z.z0) * s); }
    ctx.fillStyle = '#efe6d2'; ctx.strokeStyle = '#7d6c55'; ctx.lineWidth = 1;
    for (const b of D.buildings) { ctx.fillRect(X(b.x0), Y(b.z0), (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); ctx.strokeRect(X(b.x0), Y(b.z0), (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); }
    for (const z of zs) if (z.indoor) { ctx.fillStyle = ['corridor', 'hall', 'stair'].includes(z.kind) ? '#e4d8bf' : '#f4ecda'; ctx.fillRect(X(z.x0), Y(z.z0), (z.x1 - z.x0) * s, (z.z1 - z.z0) * s); ctx.strokeRect(X(z.x0), Y(z.z0), (z.x1 - z.x0) * s, (z.z1 - z.z0) * s); }
    if (o.labels !== false) { ctx.fillStyle = '#3a3226'; ctx.font = Math.max(9, Math.min(14, s * 2.6)) + 'px sans-serif'; ctx.textAlign = 'center'; const used = [];
      for (const z of zs.slice().reverse()) { const cx = X((z.x0 + z.x1) / 2), cy = Y((z.z0 + z.z1) / 2), w = ctx.measureText(z.label).width;
        if ((z.x1 - z.x0) * s < w * 0.6 || used.some(u => Math.abs(u[0] - cx) < (u[2] + w) / 2 && Math.abs(u[1] - cy) < 12)) continue; used.push([cx, cy, w]); ctx.fillText(z.label, cx, cy + 4); } }
    for (const m of o.marks || []) { ctx.fillStyle = m.color || '#e0503c'; ctx.beginPath(); ctx.arc(X(m.x), Y(m.z), m.r || 5, 0, 7); ctx.fill(); }
    if (o.player !== false) { const h = -pl.getYaw(); ctx.translate(X(P.x), Y(P.z)); ctx.rotate(h); ctx.fillStyle = '#2f6fd0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore(); return D;
  }

  function coverage(cell = 3) {
    const N = navSync().raw, W = Math.ceil((NAV.RECT[2] - NAV.RECT[0]) / cell), H = Math.ceil((NAV.RECT[3] - NAV.RECT[1]) / cell), g = new Uint8Array(W * H);
    for (let i = 0; i < N.count; i++) { const cx = Math.floor((N.X(i) - NAV.RECT[0]) / cell), cz = Math.floor((N.Z(i) - NAV.RECT[1]) / cell), k = cz * W + cx, v = !N.inSchool[i] ? 1 : N.zone[i] < 0 ? 3 : 2; if (v > g[k]) g[k] = v; }
    const rows = []; for (let r = 0; r < H; r++) { let s = ''; for (let c = 0; c < W; c++) s += ' o.#'[g[r * W + c]]; rows.push(s); }
    return rows.join('\n');
  }

  const boxesIn = (x0, z0, x1, z1, y = 0) => { const out = [];
    for (const c of world.colliders) { if (c.y0 < -1e5 || c.dyn || c.x1 <= x0 || c.x0 >= x1 || c.z1 <= z0 || c.z0 >= z1) continue; const top = c.vy1 ?? c.y1;
      if (c.y0 > y + 0.6 || top < y + 0.05 || top > y + 2.6 || (c.x1 - c.x0) * (c.z1 - c.z0) > 12 || Math.min(c.x1 - c.x0, c.z1 - c.z0) < 0.12) continue; out.push([c.x0, c.z0, c.x1, c.z1, top]); }
    return out.sort((a, b) => a[4] - b[4]); };
  MM = createMinimap({ mapData, drawMap, P, getYaw: pl.getYaw, onLayout: () => layoutChips(), boxesIn });
  const minimap = { show: o => MM.show(o), hide: () => MM.hide(), setMarks: m => MM.setMarks(m), setPeers: m => MM.setPeers(m), toggle: v => MM.toggle(v), zoom: z => MM.zoom(z),
    get zoomed() { return MM.zoomed; }, get visible() { return MM.visible; }, get big() { return MM.big; }, get marks() { return MM.marks; }, get ms() { return MM.ms; }, get el() { return MM.el; } };

  const SFX = { ding: [[988, 0, 0.16, 'sine', 0.2], [1319, 0.1, 0.32, 'sine', 0.18]], tick: [[660, 0, 0.09, 'triangle', 0.06]], go: [[523, 0, 0.12, 'triangle', 0.2], [784, 0.11, 0.28, 'triangle', 0.2]],
    done: [[523, 0, 0.14, 'triangle', 0.2], [659, 0.13, 0.14, 'triangle', 0.2], [784, 0.26, 0.14, 'triangle', 0.2], [1047, 0.39, 0.45, 'triangle', 0.22]],
    pick: [[1175, 0, 0.09, 'sine', 0.16], [1568, 0.06, 0.18, 'sine', 0.15]], buzz: [[196, 0, 0.3, 'square', 0.05, 150]],
    honk: [[440, 0, 0.11, 'square', 0.035], [554, 0, 0.11, 'square', 0.03], [440, 0.15, 0.13, 'square', 0.035], [554, 0.15, 0.13, 'square', 0.03]],
    bell: [[2093, 0, 0.16, 'sine', 0.11], [3136, 0.01, 0.12, 'sine', 0.05], [2093, 0.17, 0.16, 'sine', 0.11], [3136, 0.18, 0.12, 'sine', 0.05], [2093, 0.34, 0.3, 'sine', 0.1]],
    warm: [[440, 0, 0.02, 'sine', 0.0001]] };
  const sfx = k => { const T = ui.tone, s = SFX[k]; if (!T || !s) return; for (const a of s) T(...a); };

  const navDone = () => { const c = navCache.get('walk'); return c && c.done ? c.done : null; };
  const bigTree = (POI.get('lm:big-tree') || null);
  const ENG = createEngine({ THREE, scene, camera: host.camera, world, P, CTRL, ACT: pl.ACT, q, hot: HOT, ui, touch: pl.touch, kid: host.kid, doorLock: host.doorLock,
    findEntry, floorY, zoneAt, zoneFind: zone, emit, interactAdd: o => interact.add(o), colliderAdd: (b, o) => collider.add(b, o), navDone,
    teleport: (t, o) => player.teleport(t, o), setYaw: pl.setYaw, sfx, resolve: t => resolve(t), face: h => player.face(h), unstick: () => unstick(), bigTree: bigTree ? [bigTree.x, bigTree.z] : null,
    setScale: pl.setScale, getScale: pl.scale, pGround: pl.pGround, pBlocked: pl.pBlocked, fxOp: op => FX.op(op) });

  const FX = createWorldFx({ THREE, scene, camera: host.camera, world, P, q, ui, emit, colliderAdd: (b, o) => collider.add(b, o), navDone, navGet: () => nav(), resolve: t => resolve(t), zoneAt, zoneFind: zone,
    interactAdd: o => interact.add(o), doorHold: host.doorHold || (() => false), doorActors: host.doorActors || null, rebake: host.rebake || (() => {}), ENG, floorY, sfx, hot: HOT,
    pBlocked: pl.pBlocked, getScale: pl.scale, ACT: pl.ACT, actStop: () => { if (pl.acts) pl.acts.stop(true); } });
  FX.op = op => { const o = op; switch (o.op) {
    case 'moveNpc': case 'hideNpc': case 'showNpc': case 'homeNpc': return FX.npc.storyOp(o);
    case 'light': return FX.world.light(o.room, o.on !== false);
    case 'door': { const d = FX.world.door(o.door ?? o.near); if (d && d[o.state || 'open']) d[o.state || 'open'](); return null; }
    case 'spawn': return FX.world.spawn(o.kind, o.at, o);
    case 'paint': return FX.world.paint(o.target, o);
    default: return null; } };

  Object.assign(player, { crouch: (on, o) => ENG.player.crouch(on, o), crouched: ENG.player.crouched, setCrouch: v => ENG.player.setCrouch(v), hidden: ENG.player.hidden, hideSpot: ENG.player.hideSpot, invisible: on => ENG.player.invisible(on), noise: ENG.player.noise,
    scale: (s9, o9) => ENG.player.scale(s9, o9), scaled: ENG.player.scaled, groundAt: ENG.player.groundAt, blockedAt: ENG.player.blockedAt });

  const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = typeof seed === 'number' ? seed >>> 0 : fnv(String(seed)); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pend = new Map(); let storeT = 0;
  const store = ns => ({
    get(k, d = null) { try { const v = pend.has(ns + k) ? pend.get(ns + k) : localStorage.getItem(ns + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { pend.set(ns + k, JSON.stringify(v)); },
    flush() { flushStore(); },
  });
  const flushStore = () => { if (!pend.size) return; try { for (const [k, v] of pend) localStorage.setItem(k, v); } catch (e) {   } pend.clear(); };

  addEventListener('pagehide', flushStore); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushStore(); });

  const game = { current: null, ms: 0, msN: 0, msT: 0, seq: 0 };
  async function loadGame(id, params = {}) {
    if (!/^[a-z_][a-z0-9_-]{0,31}$/.test(id || '')) { hud.toast('게임 이름이 올바르지 않아요'); return null; }
    if (window.SM_PROMO && id === 'town') return null;
    if (game.current) stopGame('replace');
    const my = ++game.seq;
    try {
      const reg = id === 'town' && window.SM_TOWNV > 0 && new URLSearchParams(location.search).get('town') ? { GAMES: { town: { v: window.SM_TOWNV } } } : await import(new URL('../games/registry.js?t=' + Date.now(), import.meta.url));
      if (my !== game.seq) return null;
      const ent = reg.GAMES && reg.GAMES[id]; if (!ent) { hud.toast('없는 게임이에요: ' + id); return null; }
      if (window.SM_PROMO && ent.use === 'town') return null;
      const mod = await import(new URL('../games/' + (/^[a-z_][a-z0-9_-]{0,31}$/.test(ent.use || '') ? ent.use : id) + '.js?v=' + (ent.v || 1), import.meta.url));
      if (ent.params && typeof ent.params === 'object') params = { ...ent.params, ...params };
      if (my !== game.seq) return null;
      if (!mod.meta || mod.meta.api !== MAP.version) { hud.toast('게임 버전이 지도와 맞지 않아요'); return null; }
      const sc = scope(id); sc.arena.set('school');
      const cur = { id, meta: mod.meta, scope: sc, handle: null }; game.current = cur;
      cur.handle = (await mod.default(sc, params)) || {};
      if (game.current !== cur) return null;

      if (host.prewarm) { try { host.prewarm(); } catch (e) { console.error('[map] 미리 짓기 오류', e); } }
      emit('gamestart', { id }); return cur;
    } catch (e) { console.error('[map] 게임 시작 실패', e); stopGame('error'); hud.toast('게임에 문제가 생겨 멈췄어요'); return null; }
  }
  function stopGame(reason = 'stop') {
    if (reason !== 'replace') game.seq++;
    const cur = game.current; if (!cur) return; game.current = null;
    try { cur.handle && cur.handle.stop && cur.handle.stop(reason); } catch (e) { console.error('[map] 게임 stop 오류', e); }
    cur.scope.dispose(); emit('gamestop', { id: cur.id, reason });
  }
  function scope(owner) {

    let dead = false;
    const res = new Set(), track = h => { if (dead && h && h.remove) { try { h.remove(); } catch (e) { console.error(e); } return h; } if (h && h.remove) { const r0 = h.remove; h.remove = function () { res.delete(h); return r0.apply(this, arguments); }; res.add(h); } return h; };
    const S = facadeApi(track, owner);
    S.dispose = () => { dead = true; for (const h of [...res].reverse()) { try { h.remove(); } catch (e) { console.error(e); } } res.clear(); try { ENG.reset(); } catch (e) { console.error('[map] 엔진 정리 오류', e); } try { FX.reset(); } catch (e) { console.error('[map] 세상 바꾸기 정리 오류', e); }
      for (const [k9, c9] of navCache) if (c9.dirty) navCache.delete(k9);   CTRL.frozen = false; CTRL.speed = 1; CTRL.slip = false; CTRL.pose = null; CTRL.noRun = false; CTRL.noJump = false; CTRL.glide = 0; CTRL.hideMe = false; CTRL.face = null; CTRL.shoulder = 0; CTRL.room = null; CTRL.steer = null; CTRL.ride = false; CTRL.pitchLo = null; CTRL.pin = null; CTRL.turnMax = null; CTRL.leanMax = null; CTRL.zoom = null; if (CTRL.freeMouse !== FREE_DEF) { CTRL.freeMouse = FREE_DEF; helpFree(FREE_DEF); } if (S0.view != null) { pl.setFirst(S0.view); S0.view = null; } if (pl.acts) { pl.acts.stop(true); if (pl.acts.hold) pl.acts.hold(null); } if (arena.shape) arena.shape = null; S.gone = true; };
    S.quit = () => { const c = game.current; if (c && c.scope === S) stopGame('quit'); };
    Object.defineProperty(S, 'tracked', { get: () => res.size });
    return S;
  }

  const PICK = createGamePicker({ load: id => loadGame(id, {}), stop: () => stopGame('button'), current: () => game.current });

  const zs = { cur: null, pend: null, n: 0 }; let slowT = 0, tSec = 0;
  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], stuck = { from: null, t: 0, last: -9 }, stuckLog = [];

  function unstick() { const N = navSync().raw, i = N.snap(P.x, P.y, P.z, 3, -1.6, 1.6); if (i < 0) return false; return player.teleport([N.X(i), N.y[i], N.Z(i)]); }
  function tick(dt) {
    tSec += dt; mkTick(dt); MM.tick(dt); ENG.tick(dt); FX.tick(dt);
    if (banT > 0 && (banT -= dt) <= 0 && banEl) banEl.style.display = 'none';
    if ((slowT += dt) >= 0.1) { slowT = 0; tick10(); }
    if ((storeT += dt) >= 2) { storeT = 0; flushStore(); }
    const cur = game.current;
    if (cur && cur.handle && cur.handle.tick) {
      const t0 = performance.now();
      try { cur.handle.tick(dt); } catch (e) { console.error('[map] 게임 tick 오류', e); stopGame('error'); hud.toast('게임에 문제가 생겨 멈췄어요'); }
      game.ms += performance.now() - t0; game.msN++;
      if ((game.msT += dt) >= 2) { const avg = game.ms / Math.max(1, game.msN); if (avg > 1 && DBG9) console.warn('게임 예산 초과: tick 평균 ' + avg.toFixed(2) + 'ms');     game.last = avg; game.ms = game.msN = game.msT = 0; }
    }
    emitTick(dt);
  }
  const tickEv = { dt: 0 };
  const emitTick = dt => { const s = L.get('tick'); if (!s || !s.size) return; tickEv.dt = dt;
    for (const fn of s) { try { fn(tickEv); } catch (e) { console.error('[map] 이벤트 처리 중 오류(tick)', e); } } };
  function tick10() {
    PICK.sync();
    ENG.tick10();

    let cand = zoneAt(P.x, P.y, P.z); const cur = zs.cur;
    if (cand !== cur && cur && (!cand || cand.area > cur.area) && P.x > cur.x0 - 0.25 && P.x < cur.x1 + 0.25 && P.z > cur.z0 - 0.25 && P.z < cur.z1 + 0.25 && P.y >= cur.y0 && P.y < cur.y1) cand = cur;
    if (cand === cur) zs.n = 0;
    else if (cand === zs.pend) { if (++zs.n >= 2) { zs.cur = cand; zs.n = 0; zs.pend = null; emit('zone', { prev: cur, next: cand }); } }
    else { zs.pend = cand; zs.n = 1; }
    for (const t of TRIG) { const inn = trigIn(t.shape);
      if (inn && !t.inside) { t.inside = true; if (t.cb.enter) { try { t.cb.enter(t.shape); } catch (e) { console.error(e); } } if (t.cb.once) TRIG.delete(t); }
      else if (!inn && t.inside) { t.inside = false; if (t.cb.exit) { try { t.cb.exit(t.shape); } catch (e) { console.error(e); } } } }

    if (pl.keys) { let mv = !!(pl.touch && pl.touch.m > 0); for (const k of MOVE_KEYS) if (pl.keys.has(k)) { mv = true; break; }
      if (mv && !pl.ACT.anim && !pl.ACT.sit) { if (!stuck.from) { stuck.from = [P.x, P.z]; stuck.t = 0; } stuck.t += 0.1;
        if (Math.hypot(P.x - stuck.from[0], P.z - stuck.from[1]) > 0.05) { stuck.from = [P.x, P.z]; stuck.t = 0; }
        else if (stuck.t >= 1.5 && tSec - stuck.last > 2 && (pl.pBlocked || q.blockedAt)(P.x, P.z, P.y, P.bh)) { stuck.last = tSec; stuck.t = 0; if (stuckLog.length < 50) stuckLog.push([+P.x.toFixed(2), +P.y.toFixed(2), +P.z.toFixed(2), +tSec.toFixed(1)]); emit('stuck', { x: P.x, y: P.y, z: P.z }); } }
      else stuck.from = null; }
    if (arena.shape) {
      const ok = inArena(P.x, P.z) && P.y > (arena.shape.ymin ?? -4) && P.y < (arena.shape.ymax ?? 12);
      if (ok) { arena.out = 0; if (P.ground && (arena.safeT += 0.1) >= 0.5) { arena.safeT = 0; arena.safe = [P.x, P.y, P.z]; } }
      else if ((arena.out += 0.1) > 0.25) { arena.out = 0; player.teleport(arena.safe || 'spawn:default'); hud.toast((arena.shape && (arena.shape.msgAt ? arena.shape.msgAt(P.x, P.z) : arena.shape.msg)) || '학교 밖으로는 나갈 수 없어요'); }
    }
  }

  function check(o = {}) {
    const NV = navSync(), N = NV.raw, S = N.S, out = { zonesNoMeta: warn.zonesNoMeta.slice(), metaNoZone: warn.metaNoZone.slice(), dupIds: warn.dupIds.slice(), extraBad: [], spawnsBad: [], poisBad: [], hotUnreachable: [], traps: N.traps };
    const zcnt = new Int32Array(Z.length); let ins = 0, noz = 0, outN = 0;
    for (let i = 0; i < N.count; i++) { if (N.zone[i] >= 0) zcnt[N.zone[i]]++; if (N.inSchool[i]) { ins++; if (N.zone[i] < 0) noz++; } else outN++; }
    Z.forEach((z, i) => { if (z.extra && !zcnt[i]) out.extraBad.push(z.id); if (!zcnt[i]) out.poisBad.push('zone:' + z.id + '(칸 0)'); });
    for (const p of pois({ src: 'spawn' })) { const i = N.snap(p.x, p.y, p.z, 0.5); if (i < 0 || !N.inSchool[i] || q.blockedAt(p.x, p.z, p.y)) out.spawnsBad.push(p.id); }
    for (const p of pois({ src: 'landmark' })) if (!p.stand) out.poisBad.push(p.id + '(설 칸 없음)');

    out.labelBad = []; for (const [lab, m] of Object.entries(META.ZONE_META)) { const W = Z.filter(o => o.label === lab && !o.extra); if (!W.length) continue;
      const z = zone(lab); if (!z || z.id !== m.id || W.some(o => o.area > z.area)) out.labelBad.push(lab + '→' + (z ? z.id : null)); }
    for (const h of HOT) { if (h.off || h.kind === 'game') continue; const i = N.snap(h.x, h.y, h.z, h.r + S / 2, -1.6, 1.6); if (i < 0) out.hotUnreachable.push([h.id, h.label, +h.x.toFixed(2), +h.z.toFixed(2)]); }

    out.playBad = []; { const T9 = META.PLAY.track, y9 = META.PLAY.y, bad9 = (x, z) => { const i = N.snap(x, y9, z, S * 0.8, -0.3, 0.3); if (i < 0) out.playBad.push([+x.toFixed(1), +z.toFixed(1)]); };
      const n9 = Math.ceil(2 * Math.PI * Math.max(T9.a, T9.b) / 1.0); for (let k = 0; k < n9; k++) { const t9 = k / n9 * Math.PI * 2; for (const o9 of [-T9.half, 0, T9.half]) bad9(T9.c[0] + Math.cos(t9) * (T9.a + o9), T9.c[1] + Math.sin(t9) * (T9.b + o9)); }
      for (let x9 = META.PLAY.field.x[0] + 4; x9 < META.PLAY.field.x[1] - 4; x9 += 1) bad9(x9, META.PLAY.redlight.startZ); }
    out.outsidePct = +(100 * outN / N.count).toFixed(1); out.noZoneInSchoolPct = +(100 * noz / Math.max(1, ins)).toFixed(1); out.cells = N.count;
    out.ok = !out.dupIds.length && !out.labelBad.length && !out.extraBad.length && !out.spawnsBad.length && !out.poisBad.length && !out.hotUnreachable.length && !out.playBad.length && !out.traps && out.noZoneInSchoolPct <= 5;
    if (o.log !== false) {
      const bad = ['dupIds', 'labelBad', 'extraBad', 'spawnsBad', 'poisBad', 'hotUnreachable', 'playBad'].filter(k => out[k].length).map(k => k + ' ' + JSON.stringify(out[k].slice(0, 4)));
      if (out.traps) bad.push('갇힘 칸 ' + out.traps); if (out.noZoneInSchoolPct > 5) bad.push('구역 없는 칸 ' + out.noZoneInSchoolPct + '%');
      if (bad.length) console.error('🚫 지도 계약 ' + bad.length + '건: ' + bad.join(' · '));
      else console.log('✅ 지도 계약 0 (구역 ' + Z.length + ' · 지점 ' + POI.size + ' · 구역 없는 칸 ' + out.noZoneInSchoolPct + '% · 학교 밖 칸 ' + out.outsidePct + '%)');
      if (out.zonesNoMeta.length || out.metaNoZone.length) console.warn('⚠️ 지도 계약표(mapmeta.js) 손볼 것 — 표에 없는 구역: ' + JSON.stringify(out.zonesNoMeta) + ' · 월드에 없는 표 항목: ' + JSON.stringify(out.metaNoZone));
    }
    return out;
  }

  function facadeApi(track, owner) {
    const t = track || (h => h), hudKeys = new Set(), addH = new WeakMap();
    return {
      version: 1, owner: owner || null,
      zones: Z, zone, zoneAt, zonesWhere, inZone, q: Q, poi, pois, resolve, findEntry,
      on: (type, fn) => { const h = t({ remove: on(type, fn) }); return () => h.remove(); },
      once(type, fn) { let h = null; const off = on(type, ev => { h.remove(); fn(ev); }); h = t({ remove: off }); return () => h.remove(); },
      player,
      interact: { add: o => t(interact.add({ ...o, owner: owner || o.owner })), enable: (f, v) => t(interact.enable(f, v)), list: interact.list },
      trigger: { add: (s, cb) => t(trigger.add(s, cb)) },
      collider: { add: (b, o) => t(collider.add(b, o)) },
      arena: { set: s => t(arenaApi.set(s)), get: arenaApi.get },

      hud: { toast: hud.toast, banner: (x, s) => { const h = hud.banner(x, s); if (track && !hudKeys.has('!banner')) { hudKeys.add('!banner'); t({ remove: () => { if (banEl) banEl.style.display = 'none'; banT = 0; } }); } return h; },
        chip: (k, x, o) => { const h = hud.chip(k, x, o); if (track && x != null && !hudKeys.has(k)) { hudKeys.add(k); t({ remove: () => { hud.chip(k, null); hudKeys.delete(k); } }); } return h; },
        goal: x => { const h = hud.goal(x); if (track && x != null && !hudKeys.has('!goal')) { hudKeys.add('!goal'); t({ remove: () => { hud.goal(null); hudKeys.delete('!goal'); } }); } return h; },
        anchor: fn => { hud.anchor(fn); if (track && fn && !hudKeys.has('!anchor')) { hudKeys.add('!anchor'); t({ remove: () => { hud.anchor(null); hudKeys.delete('!anchor'); } }); } },
        ask: (ti, ch) => hud.ask(ti, ch, h => t(h)) },

      minimap: { show: o => { const h = minimap.show(o); if (track && !hudKeys.has('!mm')) { hudKeys.add('!mm'); t({ remove: () => { minimap.setMarks([]); minimap.hide(); hudKeys.delete('!mm'); } }); } return h; },
        hide: () => minimap.hide(), setMarks: m => { minimap.setMarks(m); if (track && !hudKeys.has('!mm')) { hudKeys.add('!mm'); t({ remove: () => { minimap.setMarks([]); minimap.hide(); hudKeys.delete('!mm'); } }); } },
        setPeers: m => minimap.setPeers(m), toggle: v => minimap.toggle(v), zoom: z => minimap.zoom(z), get zoomed() { return minimap.zoomed; }, get visible() { return minimap.visible; }, get big() { return minimap.big; }, get ms() { return minimap.ms; }, get marks() { return minimap.marks; }, get el() { return minimap.el; } },
      sfx: k => sfx(k),
      mk: { marker: (x, y, z, o) => t(mk.marker(x, y, z, o)), trail: (p, o) => t(mk.trail(p, o)), many: (k, n, o) => t(mk.many(k, n, o)), add: obj => t(mk.add(obj)) },
      add: obj => { const h = t(mk.add(obj)); addH.set(obj, h); return h; }, remove: obj => { const h = addH.get(obj); if (h) { addH.delete(obj); h.remove(); } else scene.remove(obj); if (obj && obj.children && obj.children.length && host.renderer && host.renderer.renderLists) host.renderer.renderLists.dispose(); },
      nav: o => nav(o).then(NV => track ? { ...NV, block: x => t(NV.block(x)) } : NV), navSync,
      mapData, drawMap, coverage, rng, store: store('sm2.game.' + (owner || 'map') + '.'), play: META.PLAY, spawns: META.SPAWNS,
      three: THREE,

      camera: host.camera, tone: (...a) => { if (ui.tone) ui.tone(...a); },
      tour: world.tour || [],

      see: ENG.see, hide: ENG.hide, note: (t9, b9) => ENG.note(t9, b9), investigate: ENG.investigate, dig: ENG.dig, prop: ENG.prop, carry: ENG.carry,
      story: ENG.story, door: ENG.door, chaser: ENG.chaser, fade: (s9, c9, m9) => ENG.fade(s9, c9, m9),
      top: host.top ? { enter: o => { const T9 = host.top; t({ remove: () => T9.exit() }); return T9.enter(o); }, exit: () => host.top.exit(), floor: f => host.top.floor(f), look: (x, z, d) => host.top.look(x, z, d), ground: (sx, sy) => host.top.ground(sx, sy), setTool: t => host.top.setTool(t), marks: L => host.top.marks(L), vision: m => host.top.vision(m), get on() { return host.top.on; }, get state() { return host.top.state; } } : null,
      lego: on => { if (!world.lego) return; world.lego(!!on); if (on) t({ remove: () => world.lego(false) }); },
      film: host.film ? { play: (shots, o) => { const f = host.film; t({ remove: () => f.stop('stop') }); return f.play(shots, o); }, stop: k => host.film.stop(k), get on() { return host.film.on; } } : null,
      look: o => { if (!host.look) return; host.look(o || null); if (o && track && !hudKeys.has('!look')) { hudKeys.add('!look'); t({ remove: () => { host.look(null); hudKeys.delete('!look'); } }); } },
      time: k => (k ? ENG.setTime(k) : ui.getTime && ui.getTime()),

      lights: on => ENG.lights(on), flashlight: on => ENG.flashlight(on),

      npc: FX.npc, world: FX.world,
    };
  }
  const MAP = facadeApi(null, null);
  Object.assign(MAP, { hostTeleport: (t, o) => player.teleport(t, o), findEntry, navIdle, navReady: () => !!navDone(), emit, tick, check, scope, stuckLog, unstick, game: { load: loadGame, stop: stopGame, get current() { return game.current; }, get lastMs() { return game.last || 0; } }, warn, entryBad, BRECT, inSchool, zoneIndex });

  MAP.stats = () => { let lis = 0; for (const [, s] of L) lis += s.size; const cur = game.current;
    return { listeners: lis, trig: TRIG.size, marks: marks.length, chips: chips.size, hot: HOT.length, pois: POI.size, colliders: world.colliders.length, scene: scene.children.length,
      minimap: MM.visible, mmMarks: MM.marks.length, goal: !!(goalEl && goalEl.style.display !== 'none'), arena: !!arena.shape, frozen: CTRL.frozen, speed: CTRL.speed,
      game: cur ? cur.id : null, tracked: cur ? cur.scope.tracked : 0, pick: PICK.el.textContent, eng: ENG.stats(), crouchOK: !!CTRL.crouchOK, peek: !!CTRL.peek, hold: !!CTRL.hold, fx: FX.stats() }; };
  MAP.picker = PICK;
  MAP.closeModal = () => ENG.closeModal();
  MAP.idleAct = () => ENG.idleAct();
  MAP.engine = ENG; MAP.worldfx = FX;

  MAP.press = (name, down = true) => emit('action', { name: String(name), down: !!down });
  return MAP;
}
