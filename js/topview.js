export function createTop(env) {
  const { THREE, camera, renderer, scene, world, setCam, setView, getZones, zoneAt, player, setYaw } = env;
  const FH = (world.details && world.details.FH) || 3.4;
  const css = document.createElement('style');
  css.textContent = `
#tv-pad{position:fixed;inset:0;z-index:15;touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
#tv-pad.drag{cursor:grabbing}
#tv-lb{position:fixed;inset:0;z-index:16;pointer-events:none;overflow:hidden}
#tv-lb .lb{position:absolute;left:0;top:0;white-space:nowrap;font:800 13px/1 system-ui,-apple-system,'Malgun Gothic',sans-serif;color:#1d3557;background:rgba(255,255,255,.9);padding:4px 7px;border-radius:7px;box-shadow:0 1px 3px rgba(0,0,0,.28);visibility:hidden}
#tv-lb .lb.out{color:#fff;background:rgba(29,53,87,.78)}
#tv-lb .lb.mk{color:#3b2a00;background:#ffd23f;font-size:14px;padding:5px 9px;box-shadow:0 2px 6px rgba(0,0,0,.3)}
#tv-lb .me{position:absolute;left:0;top:0;font:900 13px/1 system-ui,-apple-system,'Malgun Gothic',sans-serif;color:#fff;background:#e8553a;padding:5px 9px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.35);visibility:hidden}
#tv-lb .me:after{content:'';position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#e8553a}
#tv-bar{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);width:max-content;z-index:25;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;background:rgba(15,25,45,.8);padding:6px;border-radius:14px;max-width:calc(100vw - 24px);box-sizing:border-box}
#tv-bar .g{display:flex;gap:2px;background:rgba(255,255,255,.08);border-radius:10px;padding:2px}
#tv-bar button{min-width:44px;min-height:40px;border:0;border-radius:9px;background:transparent;color:#fff;font:700 14px/1 system-ui,-apple-system,'Malgun Gothic',sans-serif;cursor:pointer;padding:0 10px;white-space:nowrap}
#tv-bar button.on{background:#ffd23f;color:#1d3557}
#tv-bar button:not(.on):hover{background:rgba(255,255,255,.16)}
#tv-bar button.go{background:#3fb37f;color:#fff}
#tv-cmp{position:fixed;left:14px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:25;width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer}
#tv-cmp i{position:absolute;left:50%;top:50%;width:0;height:0;transform-origin:0 0}
#tv-cmp i:before{content:'';position:absolute;left:-7px;top:-22px;border:7px solid transparent;border-top:0;border-bottom:16px solid #e8553a}
#tv-cmp i:after{content:'';position:absolute;left:-7px;top:6px;border:7px solid transparent;border-bottom:0;border-top:16px solid #8a94a6}
#tv-cmp b{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;font:900 13px/18px system-ui,sans-serif;text-align:center;color:#e8553a}
#tv-sc{position:fixed;left:84px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:25;font:700 12px/1 system-ui,-apple-system,'Malgun Gothic',sans-serif;color:#fff;background:rgba(15,25,45,.72);padding:6px 9px 7px;border-radius:8px;pointer-events:none}
#tv-sc b{display:block;height:6px;border:2px solid #fff;border-top:0;margin-top:5px;box-sizing:border-box}
#tv-pop{position:fixed;z-index:26;transform:translate(-50%,calc(-100% - 14px));background:#fff;color:#1d3557;border-radius:12px;padding:10px 12px;box-shadow:0 6px 18px rgba(0,0,0,.32);font:800 15px/1.3 system-ui,-apple-system,'Malgun Gothic',sans-serif;text-align:center;min-width:132px}
#tv-pop:after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-8px;border:8px solid transparent;border-bottom:0;border-top-color:#fff}
#tv-pop small{display:block;font-weight:600;font-size:12px;color:#5b6b80;margin-top:2px}
#tv-pop button{display:block;width:100%;margin-top:8px;min-height:42px;border:0;border-radius:9px;background:#ffd23f;color:#1d3557;font:inherit;font-size:14px;cursor:pointer}
#tv-fog{position:fixed;inset:0;z-index:17;pointer-events:none}
#tv-help{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));transform:translateX(-50%);z-index:25;font:700 13px/1.3 system-ui,-apple-system,'Malgun Gothic',sans-serif;color:#fff;background:rgba(15,25,45,.72);padding:7px 12px;border-radius:10px;pointer-events:none;max-width:calc(100vw - 200px);text-align:center;transition:opacity .6s}
body.top-on #help,body.top-on #hint,body.top-on .tch,body.top-on #mmap,body.top-on #mm-dim{display:none!important}
body.small #tv-bar{gap:4px;padding:4px}
body.small #tv-bar button{min-height:44px;padding:0 8px;font-size:13px}
body.small #tv-bar .lbl{display:none}
body.small #tv-cmp{bottom:calc(120px + env(safe-area-inset-bottom));width:50px;height:50px}
body.small #tv-sc{left:72px;bottom:calc(126px + env(safe-area-inset-bottom))}
body.small #tv-help{max-width:calc(100vw - 150px);font-size:12px}
@media (orientation:portrait){body.small #tv-help{display:none}}
`;
  document.head.appendChild(css);

  const PL = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
  const cutSet = c => { if (!c) { PL[0].constant = -1e5; PL[1].constant = 1e5; PL[2].constant = -1e5 - 1; PL[3].constant = 1e5; PL[4].constant = -1e5 - 1; return; }
    PL[0].constant = c.y; PL[1].constant = c.box[0]; PL[2].constant = -c.box[2]; PL[3].constant = c.box[1]; PL[4].constant = -c.box[3]; };
  let mats = null;
  function cutOn() {
    if (mats) return; mats = []; const seen = new Set();
    scene.traverse(o => { if (!o.isMesh || !o.material) return; const g = o.geometry; if (g && g.boundingSphere && g.boundingSphere.radius > 400) return;
      for (const m of [].concat(o.material)) { if (seen.has(m)) continue; seen.add(m); mats.push([m, m.clippingPlanes, m.clipIntersection]); m.clippingPlanes = PL; m.clipIntersection = true; m.needsUpdate = true; } });
    renderer.localClippingEnabled = true; cutSet(null);
  }
  const BR = (world.details && world.details.brect) || [];
  const SCHOOLBOX = BR.length ? [Math.min(...BR.map(b => b[0])) - 1, Math.min(...BR.map(b => b[2])) - 1, Math.max(...BR.map(b => b[1])) + 1, Math.max(...BR.map(b => b[3])) + 1] : [-90, -70, 60, 0];
  const safeBox = new Map();
  function safeCut(c9) {
    if (!c9) return null; const k = c9.y + ':' + c9.box.join(','); if (safeBox.has(k)) return safeBox.get(k);
    const B = world.allBoxes || []; let [x0, z0, x1, z1] = c9.box;
    for (let it = 0; it < 12; it++) { let ch = false;
      for (const b of B) { if (b.y1 <= c9.y + 0.01 || b.x1 <= x0 || b.x0 >= x1 || b.z1 <= z0 || b.z0 >= z1) continue; if (b.x0 >= x0 && b.x1 <= x1 && b.z0 >= z0 && b.z1 <= z1) continue;
        x0 = Math.min(x0, b.x0 - 0.05); z0 = Math.min(z0, b.z0 - 0.05); x1 = Math.max(x1, b.x1 + 0.05); z1 = Math.max(z1, b.z1 + 0.05); ch = true; }
      if (!ch) break; }
    const r = { y: c9.y, box: [x0, z0, x1, z1] }; safeBox.set(k, r); return r;
  }
  let caps = null; const capMat = new THREE.MeshBasicMaterial({ color: 0x2c313b });
  function capsSet(c9) {
    if (caps) { scene.remove(caps); caps.geometry.dispose(); caps = null; }
    const B = world.allBoxes; if (!c9 || !B) return;
    const [bx0, bz0, bx1, bz1] = c9.box, y = c9.y, L = [];
    for (const b of B) { if (b.y0 >= y || b.y1 <= y) continue; if (b.y0 > y - 0.5 && Math.min(b.x1 - b.x0, b.z1 - b.z0) > 1) continue;     const x0 = Math.max(b.x0, bx0), x1 = Math.min(b.x1, bx1), z0 = Math.max(b.z0, bz0), z1 = Math.min(b.z1, bz1); if (x1 - x0 > 0.01 && z1 - z0 > 0.01) L.push([x0, x1, z0, z1]); }
    if (!L.length) return;
    const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m = new THREE.InstancedMesh(g, capMat, L.length), M4 = new THREE.Matrix4();
    L.forEach(([x0, x1, z0, z1], k) => { M4.makeScale(x1 - x0, 1, z1 - z0).setPosition((x0 + x1) / 2, y - 0.004, (z0 + z1) / 2); m.setMatrixAt(k, M4); });
    m.frustumCulled = false; m.renderOrder = 1; scene.add(m); caps = m;
  }
  function cutOff() { capsSet(null); if (!mats) return; for (const [m, cp, ci] of mats) { m.clippingPlanes = cp; m.clipIntersection = ci; m.needsUpdate = true; } mats = null; renderer.localClippingEnabled = false; }
  const CUT_H = 2.3;
  const floorCut = f => f === 'roof' ? null : safeCut({ y: (f === 2 ? FH : 0) + CUT_H, box: SCHOOLBOX });

  let S = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const el = (tag, cls, html, p) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; if (p) p.appendChild(d); return d; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BOUND = [SCHOOLBOX[0] - 40, SCHOOLBOX[1] - 30, SCHOOLBOX[2] + 30, SCHOOLBOX[3] + 60];
  const D_MIN = 16, D_MAX = 240, P_TOP = Math.PI / 2 - 1e-4, P_TILT = 0.98, P_LOW = 0.8;
  const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _ray = new THREE.Raycaster(), _nd = new THREE.Vector2(), _eul = new THREE.Euler(0, 0, 0, 'YXZ'), _pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _hit = new THREE.Vector3();

  function enter(o = {}) {
    if (S) exit();
    const me = player();
    const f0 = o.floor ?? (me.y > FH - 0.5 ? 2 : 1);
    S = { o, floor: f0, labels: o.labels !== false, keys: new Set(), ptr: new Map(), tapT: 0, tool: o.tool || null, toolOn: false, MK: [],
      T: { tx: o.at ? o.at[0] : me.x, tz: o.at ? o.at[1] : me.z, d: o.d ?? 58, yaw: o.yaw ?? 0, p: o.top ? P_TOP : P_TILT },
      C: null, fog: scene.fog ? [scene.fog.near, scene.fog.far] : null, near0: camera.near, far0: camera.far, LB: [], lbFloor: null, popAt: null };
    S.C = { ...S.T, d: Math.max(D_MIN, Math.min(16, S.T.d)), ty: floorY(S.floor) };
    S.T.ty = floorY(S.floor);

    S.pad = el('div', null, null, document.body); S.pad.id = 'tv-pad';
    S.lb = el('div', null, null, document.body); S.lb.id = 'tv-lb';
    S.meEl = el('div', 'me', '나', S.lb);
    if (o.vision) { S.vis = el('div', null, null, document.body); S.vis.id = 'tv-fog'; }
    S.bar = el('div', null, null, document.body); S.bar.id = 'tv-bar'; if (o.bar === false) S.bar.style.display = 'none';
    const g1 = el('div', 'g', null, S.bar); if (o.floors === false) g1.style.display = 'none';
    S.fb = [['roof', '🏠<span class="lbl"> 지붕</span>'], [1, '1층'], [2, '2층']].map(([f, t]) => { const b = el('button', null, t, g1); b.type = 'button'; b.title = f === 'roof' ? '지붕 그대로(3)' : f + '층(' + f + ')'; b.onclick = e => { e.stopPropagation(); setFloor(f); }; return [f, b]; });
    const g2 = el('div', 'g', null, S.bar);
    [['↺', '지도를 왼쪽으로 돌리기(Q)', () => rot(-Math.PI / 4)], ['↻', '지도를 오른쪽으로 돌리기(E)', () => rot(Math.PI / 4)]].forEach(([t, ti, f]) => { const b = el('button', null, t, g2); b.type = 'button'; b.title = ti; b.onclick = e => { e.stopPropagation(); f(); }; });
    const g3 = el('div', 'g', null, S.bar);
    [['−', '작게(−)', () => zoom(1.35)], ['+', '크게(+)', () => zoom(1 / 1.35)]].forEach(([t, ti, f]) => { const b = el('button', null, t, g3); b.type = 'button'; b.title = ti; b.onclick = e => { e.stopPropagation(); f(); }; });
    const g4 = el('div', 'g', null, S.bar);
    S.tiltB = el('button', null, '', g4); S.tiltB.type = 'button'; S.tiltB.onclick = e => { e.stopPropagation(); S.T.p = S.T.p > 1.3 ? P_TILT : P_TOP; paintBar(); };
    S.lbB = el('button', null, '🏷<span class="lbl"> 이름</span>', g4); S.lbB.type = 'button'; S.lbB.title = '방 이름 보이기/감추기'; S.lbB.onclick = e => { e.stopPropagation(); S.labels = !S.labels; paintBar(); };
    if (o.onExit) { S.exitB = el('button', 'go', '🚶<span class="lbl"> 걸어 다니기</span>', S.bar); S.exitB.type = 'button'; S.exitB.title = '걸어 다니기(Esc)'; S.exitB.onclick = e => { e.stopPropagation(); o.onExit(); }; }
    S.cmp = el('div', null, '<i></i><b>N</b>', document.body); S.cmp.id = 'tv-cmp'; S.cmp.title = '북쪽을 위로';
    S.cmp.onclick = e => { e.stopPropagation(); S.T.yaw = Math.round(S.C.yaw / (2 * Math.PI)) * 2 * Math.PI; };
    S.sc = el('div', null, '<span></span><b></b>', document.body); S.sc.id = 'tv-sc';
    if (o.help !== false) { S.help = el('div', null, esc(o.help || (matchMedia('(pointer: coarse)').matches ? '끌어서 옮기기 · 두 손가락으로 확대·돌리기 · 톡 = 그곳 이름' : '끌기·두 손가락 쓸기 = 옮기기 · 휠·벌리기 = 확대 · 오른쪽 끌기·Q/E = 돌리기 · 클릭 = 그곳 이름')), document.body); S.help.id = 'tv-help';
      if (o.follow) { S.help.style.top = 'auto'; S.help.style.bottom = 'calc(14px + env(safe-area-inset-bottom))'; }
      else if (o.helpTop != null) S.help.style.top = 'calc(' + (+o.helpTop) + 'px + env(safe-area-inset-top))';
      S.helpT = setTimeout(() => { if (S && S.help) S.help.style.opacity = '0'; }, 7000); }
    document.body.classList.add('top-on');
    try { document.exitPointerLock && document.pointerLockElement && document.exitPointerLock(); } catch (e) {   }

    S.pad.addEventListener('pointerdown', onDown); S.pad.addEventListener('pointermove', onMove); S.pad.addEventListener('pointerup', onUp); S.pad.addEventListener('pointercancel', onUp);
    S.pad.addEventListener('wheel', onWheel, { passive: false }); S.pad.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true); addEventListener('blur', onBlur);

    if (o.cut !== false) { cutOn(); applyCut(); }
    setView && setView({ far: 420 });
    if (scene.fog) { scene.fog.near = 500; scene.fog.far = 1400; }
    setCam(ovr);
    paintBar();
    return api;
  }
  function exit() {
    if (!S) return; const s = S; S = null;
    setCam(null); cutOff(); setView && setView(null);
    if (s.fog && scene.fog) { scene.fog.near = s.fog[0]; scene.fog.far = s.fog[1]; }
    camera.near = s.near0; camera.far = s.far0; camera.updateProjectionMatrix();
    removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true); removeEventListener('blur', onBlur);
    clearTimeout(s.helpT);
    [s.pad, s.lb, s.bar, s.cmp, s.sc, s.help, s.pop, s.vis].forEach(e => e && e.remove());
    document.body.classList.remove('top-on');
    if (s.o.onLeave) try { s.o.onLeave(); } catch (e) {   }
  }
  const floorY = f => f === 2 ? FH : 0;
  function applyCut() { if (!mats) return; const c = floorCut(S.floor); cutSet(c); capsSet(c); }
  function setFloor(f) { if (!S || f === S.floor) return; if (f === 2 && !has2F()) { return; } S.floor = f; S.T.ty = floorY(f); applyCut(); closePop(); S.lbFloor = null; paintBar(); if (S.o.onFloor) S.o.onFloor(f); }
  const has2F = () => (getZones() || []).some(z => z.floor === 2);
  function rot(a) { if (S) S.T.yaw += a; }
  function zoom(k, at) {
    if (!S) return; const d0 = S.T.d, d1 = clamp(d0 * k, D_MIN, S.o.dMax || D_MAX);
    if (at) { const g = groundAt(at[0], at[1]); if (g) { const r = 1 - d1 / d0; S.T.tx += (g.x - S.T.tx) * r; S.T.tz += (g.z - S.T.tz) * r; clampT(); } }
    S.T.d = d1;
  }
  const clampT = () => { const B = S.o.bound || BOUND; S.T.tx = clamp(S.T.tx, B[0], B[2]); S.T.tz = clamp(S.T.tz, B[1], B[3]); };
  function paintBar() {
    if (!S) return;
    S.fb.forEach(([f, b]) => { b.classList.toggle('on', f === S.floor); if (f === 2) b.style.display = has2F() ? '' : 'none'; });
    S.tiltB.innerHTML = S.T.p > 1.3 ? '📐<span class="lbl"> 비스듬히</span>' : '⬇<span class="lbl"> 똑바로</span>'; S.tiltB.title = S.T.p > 1.3 ? '비스듬히 보기' : '똑바로 내려다보기(지도처럼)';
    S.lbB.classList.toggle('on', S.labels);
  }

  function groundAt(sx, sy, y) {
    const w = innerWidth, h = innerHeight; _nd.set(sx / w * 2 - 1, -(sy / h) * 2 + 1); _ray.setFromCamera(_nd, camera);
    _pl.constant = -(y ?? floorY(S.floor)); return _ray.ray.intersectPlane(_pl, _hit) ? { x: _hit.x, y: _hit.y, z: _hit.z } : null;
  }

  function onDown(e) {
    if (S.help && S.help.style.opacity !== '0') S.help.style.opacity = '0';
    S.pad.setPointerCapture && S.pad.setPointerCapture(e.pointerId);
    S.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, b: e.button, t: performance.now() });
    if (S.ptr.size === 1) { S.moved = 0; S.tapT = performance.now(); }
    if (S.ptr.size === 2) { S.moved = 99; S.pinch = pinchState(); if (S.toolOn) { S.toolOn = false; S.tool && S.tool.cancel && S.tool.cancel(); } }
    if (S.tool && S.ptr.size === 1 && e.button === 0 && !e.shiftKey) { S.toolOn = true; closePop(); S.tool.down && S.tool.down(e.clientX, e.clientY, e); }
    S.pad.classList.add('drag');
  }
  function pinchState() { const [a, b] = [...S.ptr.values()]; return { dist: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
  function mpp() { return 2 * S.C.d * Math.tan(camera.fov * Math.PI / 360) / innerHeight; }
  function onMove(e) {
    const q = S.ptr.get(e.pointerId); if (!q) { if (S.tool && S.tool.hover && e.pointerType === 'mouse') S.tool.hover(e.clientX, e.clientY); return; }
    const dx = e.clientX - q.x, dy = e.clientY - q.y; q.x = e.clientX; q.y = e.clientY;
    S.moved = Math.max(S.moved, Math.hypot(q.x - q.x0, q.y - q.y0));
    if (S.toolOn) { S.tool.move && S.tool.move(e.clientX, e.clientY, e); return; }
    if (S.ptr.size >= 2) { const n = pinchState(), p0 = S.pinch; if (!p0) { S.pinch = n; return; }
      if (n.dist > 4 && p0.dist > 4) zoom(p0.dist / n.dist, [n.mx, n.my]);
      let da = n.ang - p0.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; S.T.yaw += da;
      pan(n.mx - p0.mx, n.my - p0.my); S.pinch = n; return; }
    if (S.moved < 5) return;
    if (S.o.follow) { if (q.b === 2 || e.shiftKey) { S.T.yaw += dx * 0.006; } return; }
    if (S.tool && q.b === 2 && !e.shiftKey) { pan(dx, dy); return; }
    if (q.b === 2 || q.b === 1 || e.shiftKey) { S.T.yaw += dx * 0.006; S.T.p = clamp(S.T.p - dy * 0.004, P_LOW, P_TOP); paintBar(); return; }
    pan(dx, dy);
  }
  function pan(dx, dy) {
    const m = mpp(), sy = Math.sin(S.C.yaw), cy = Math.cos(S.C.yaw), k = 1 / Math.max(0.5, Math.sin(S.C.p));
    S.T.tx += (-dx * cy - dy * sy * k) * m; S.T.tz += (dx * sy - dy * cy * k) * m;
    clampT();
  }
  function onUp(e) {
    const q = S && S.ptr.get(e.pointerId); if (!q) return; S.ptr.delete(e.pointerId);
    if (S.ptr.size < 2) S.pinch = null;
    if (S.toolOn) { S.toolOn = false; if (!S.ptr.size) S.pad.classList.remove('drag'); S.tool.up && S.tool.up(e.clientX, e.clientY, e); return; }
    if (!S.ptr.size) { S.pad.classList.remove('drag'); if (S.moved < 6 && q.b !== 2 && !S.tool && performance.now() - S.tapT < 450) tap(e.clientX, e.clientY); }
  }
  function onWheel(e) {
    e.preventDefault();
    if (!e.ctrlKey && e.deltaMode === 0 && (Math.abs(e.deltaX) > 0.5 || Math.abs(e.deltaY) < 50)) { pan(-e.deltaX, -e.deltaY); return; }
    const k = Math.exp(clamp(e.deltaY, -200, 200) * (e.deltaMode === 1 ? 0.05 : e.ctrlKey ? 0.01 : 0.0016)); zoom(k, [e.clientX, e.clientY]); }
  const KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE']);
  function onKey(e) {
    if (!S) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const c = e.code;
    if (S.o.playerKeys && (KEYS.has(c) || c === 'Space' || c.startsWith('Shift'))) return;
    if (KEYS.has(c)) { S.keys.add(c); e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (c === 'Equal' || c === 'NumpadAdd') { zoom(1 / 1.3); } else if (c === 'Minus' || c === 'NumpadSubtract') { zoom(1.3); }
    else if (S.o.floorKeys !== false && (c === 'Digit1' || c === 'Numpad1')) setFloor(1); else if (S.o.floorKeys !== false && (c === 'Digit2' || c === 'Numpad2')) setFloor(2); else if (S.o.floorKeys !== false && (c === 'Digit3' || c === 'Numpad3')) setFloor('roof');
    else if (c === 'Escape') { if (S.pop) closePop(); else if (S.o.onExit) S.o.onExit(); }
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }
  function onKeyUp(e) { if (S && !S.o.playerKeys && KEYS.has(e.code)) { S.keys.delete(e.code); e.stopImmediatePropagation(); } }
  function onBlur() { if (S) { S.keys.clear(); S.ptr.clear(); S.pinch = null; S.pad.classList.remove('drag'); if (S.toolOn) { S.toolOn = false; S.tool && S.tool.cancel && S.tool.cancel(); } } }

  function zoneUnder(g) {
    const ys = S.floor === 2 ? [FH, 0, -0.3, -1.35] : [0, -0.3, -1.35, 0.5];
    for (const y of ys) { const z = zoneAt(g.x, y + 0.2, g.z); if (z) return { zone: z, y }; }
    return { zone: null, y: g.y };
  }
  function tap(sx, sy) {
    closePop(); const g = groundAt(sx, sy); if (!g) return;
    const { zone, y } = S.o.zoneAt ? { zone: S.o.zoneAt(g.x, g.z), y: g.y } : zoneUnder(g), pt = { x: g.x, y, z: g.z, zone, sx, sy };
    if ((S.o.follow || S.o.pop === false) && !(S.o.tapActions && S.o.tapActions.length)) { if (S.o.onTap) S.o.onTap(pt); return; }
    const acts = (S.o.tapActions || []).filter(a => !a.when || a.when(pt));
    const d = el('div', null, esc(zone ? zone.label : '바깥') + (zone && zone.floor === 2 ? '<small>2층</small>' : ''), document.body); d.id = 'tv-pop';
    acts.forEach(a => { const b = el('button', null, esc(a.t), d); b.type = 'button'; b.onclick = ev => { ev.stopPropagation(); closePop(); a.f(pt); }; });
    S.pop = d; S.popAt = [g.x, floorY(S.floor), g.z];
    if (S.o.onTap) S.o.onTap(pt);
  }
  function closePop() { if (S && S.pop) { S.pop.remove(); S.pop = null; S.popAt = null; } }

  function ovr(dt) {
    if (!S) return; dt = Math.min(dt || 0.016, 0.1);
    const kk = S.keys; if (kk.size) {
      const sp = S.C.d * 0.9 * dt / Math.max(mpp(), 1e-4);
      let dx = 0, dy = 0; if (kk.has('KeyA') || kk.has('ArrowLeft')) dx += sp; if (kk.has('KeyD') || kk.has('ArrowRight')) dx -= sp; if (kk.has('KeyW') || kk.has('ArrowUp')) dy += sp; if (kk.has('KeyS') || kk.has('ArrowDown')) dy -= sp;
      if (dx || dy) pan(dx, dy);
      if (kk.has('KeyQ')) S.T.yaw -= 1.6 * dt; if (kk.has('KeyE')) S.T.yaw += 1.6 * dt;
    }
    if (S.o.follow) { const me = player(); S.T.tx = me.x; S.T.tz = me.z; }
    if (S.o.playerKeys && setYaw) setYaw(S.C.yaw);
    const C = S.C, T = S.T, k = 1 - Math.exp(-11 * dt);
    C.tx += (T.tx - C.tx) * k; C.tz += (T.tz - C.tz) * k; C.ty += (T.ty - C.ty) * k; C.yaw += (T.yaw - C.yaw) * k; C.p += (T.p - C.p) * k;
    C.d *= Math.pow(T.d / C.d, k);
    const cp = Math.cos(C.p), sp = Math.sin(C.p), sy = Math.sin(C.yaw), cy = Math.cos(C.yaw);
    camera.position.set(C.tx + cp * sy * C.d, C.ty + sp * C.d, C.tz + cp * cy * C.d);
    _eul.set(-C.p, C.yaw, 0, 'YXZ'); camera.quaternion.setFromEuler(_eul);
    camera.near = clamp(C.d * 0.02, 0.3, 3); camera.far = C.d * 2.5 + 500; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    paintUI();
  }
  const proj = (x, y, z) => { _v.set(x, y, z).project(camera); return _v.z > 1 || _v.z < -1 ? null : [(_v.x + 1) / 2 * innerWidth, (1 - _v.y) / 2 * innerHeight]; };
  function buildLabels() {
    S.LB.forEach(l => l.el.remove()); S.LB = [];
    const f = S.floor, Z = (S.o.zones || getZones() || []).filter(z => z.label && !z.extra && !/^z-/.test(z.id || '') && (f === 'roof' ? !z.indoor : f === 2 ? z.floor === 2 : z.floor === 1) && z.area >= 6);
    const best = new Map(); for (const z of Z) { const k = S.o.zones ? z.id : z.label, c = best.get(k); if (!c || z.area > c.area) best.set(k, z); }
    S.LB = [...best.values()].sort((a, b) => b.area - a.area).slice(0, 90).map(z => ({ z, el: el('div', 'lb' + (z.indoor ? '' : ' out'), esc(z.label), S.lb), w: 0, k: '' }));
    S.LB.forEach(l => { l.w = l.el.offsetWidth || 60; l.h = l.el.offsetHeight || 22; });
    S.lbFloor = f;
  }
  function paintUI() {
    if (S.lbFloor !== S.floor) buildLabels();
    const W = innerWidth, H = innerHeight, placed = [];
    if (S.frameN = (S.frameN || 0) + 1, S.frameN % 30 === 1 || !S.ui) S.ui = [S.bar, S.cmp, S.sc, S.help].filter(e => e && e.isConnected && e.style.opacity !== '0').map(e => { const r = e.getBoundingClientRect(); return [r.left - 4, r.top - 4, r.right + 4, r.bottom + 4]; });
    placed.push(...S.ui);
    for (const m of S.MK) { const p = proj(m.x, m.y, m.z), w = m.el.offsetWidth || 80, h = m.el.offsetHeight || 24;
      if (p && p[0] > -w && p[0] < W + w && p[1] > -h && p[1] < H + h) { const x = Math.round(p[0] - w / 2), y = Math.round(p[1] - h / 2); m.el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; m.el.style.visibility = 'visible'; placed.push([x - 3, y - 3, x + w + 3, y + h + 3]); }
      else m.el.style.visibility = 'hidden'; }
    for (const l of S.LB) {
      let vis = false, px = 0, py = 0;
      if (S.labels) { const z = l.z, p = proj(z.cx, (z.y0 ?? z.y ?? 0) + 0.4, z.cz);
        if (p && p[0] > 20 && p[0] < W - 20 && p[1] > 20 && p[1] < H - 20) {
          const a = proj(z.x0, (z.y0 ?? 0) + 0.4, z.cz), b = proj(z.x1, (z.y0 ?? 0) + 0.4, z.cz), c = proj(z.cx, (z.y0 ?? 0) + 0.4, z.z0), d = proj(z.cx, (z.y0 ?? 0) + 0.4, z.z1);
          const span = Math.max(a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 0, c && d ? Math.hypot(c[0] - d[0], c[1] - d[1]) : 0);
          if (span > l.w * 0.8) { px = p[0] - l.w / 2; py = p[1] - l.h / 2; const r = [px - 3, py - 3, px + l.w + 3, py + l.h + 3];
            if (!placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) { placed.push(r); vis = true; } } } }
      const key = vis ? Math.round(px) + ',' + Math.round(py) : 'h';
      if (key !== l.k) { l.k = key; if (vis) { l.el.style.transform = 'translate(' + Math.round(px) + 'px,' + Math.round(py) + 'px)'; l.el.style.visibility = 'visible'; } else l.el.style.visibility = 'hidden'; }
    }

    const me = player(), pm = proj(me.x, me.y + 1.9, me.z);
    if (pm && S.o.me !== false && (S.floor === 'roof' || Math.abs(me.y - floorY(S.floor)) < 2.6)) { S.meEl.style.transform = 'translate(' + Math.round(pm[0] - 16) + 'px,' + Math.round(pm[1] - 32) + 'px)'; S.meEl.style.visibility = 'visible'; }
    else S.meEl.style.visibility = 'hidden';
    if (S.vis) { const me = player(), pm = proj(me.x, me.y + 0.4, me.z), pr = proj(me.x + Math.cos(S.C.yaw) * S.o.vision, me.y + 0.4, me.z - Math.sin(S.C.yaw) * S.o.vision);
      if (pm && pr) { const r = Math.hypot(pr[0] - pm[0], pr[1] - pm[1]); S.vis.style.background = 'radial-gradient(circle at ' + pm[0].toFixed(0) + 'px ' + pm[1].toFixed(0) + 'px, rgba(8,12,24,0) ' + (r * 0.8).toFixed(0) + 'px, rgba(8,12,24,.86) ' + (r * 1.08).toFixed(0) + 'px)'; } }

    if (S.pop && S.popAt) { const pp = proj(...S.popAt); if (pp) { S.pop.style.left = pp[0] + 'px'; S.pop.style.top = pp[1] + 'px'; } }

    const c0 = proj(S.C.tx, S.C.ty, S.C.tz), cn = proj(S.C.tx, S.C.ty, S.C.tz - 10);
    if (c0 && cn) { const a = Math.atan2(cn[0] - c0[0], -(cn[1] - c0[1])); const ae = a * 180 / Math.PI; const i9 = S.cmp.firstChild, b9 = S.cmp.lastChild;
      i9.style.transform = 'rotate(' + ae.toFixed(1) + 'deg)'; b9.style.transform = 'translate(' + (Math.sin(a) * 19).toFixed(1) + 'px,' + (-Math.cos(a) * 19).toFixed(1) + 'px)'; }

    const c1 = proj(S.C.tx + Math.cos(S.C.yaw), S.C.ty, S.C.tz - Math.sin(S.C.yaw));
    if (c0 && c1) { const ppm = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]); const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200].find(m => m * ppm >= 60) || 200;
      const k9 = nice + 'm'; if (S.scK !== k9 + Math.round(nice * ppm)) { S.scK = k9 + Math.round(nice * ppm); S.sc.firstChild.textContent = k9; S.sc.lastChild.style.width = Math.round(nice * ppm) + 'px'; } }
  }
  const api = { enter, exit, floor: f => setFloor(f), get on() { return !!S; }, get state() { return S ? { floor: S.floor, x: S.C.tx, z: S.C.tz, d: S.C.d, yaw: S.C.yaw, p: S.C.p } : null },
    look: (x, z, d) => { if (!S) return; S.T.tx = x; S.T.tz = z; if (d) S.T.d = clamp(d, D_MIN, S.o.dMax || D_MAX); clampT(); }, ground: (sx, sy) => S ? groundAt(sx, sy) : null,
    setTool: t => { if (!S) return; if (S.toolOn && S.tool && S.tool.cancel) S.tool.cancel(); S.toolOn = false; S.tool = t || null; closePop(); },
    marks: L => { if (!S) return; S.MK.forEach(m => m.el.remove()); S.MK = (L || []).map(m => ({ ...m, el: el('div', 'lb mk', esc(m.t), S.lb) })); },
    get camera() { return camera; }, vision: m => { if (S && S.vis) S.o.vision = m; } };
  return api;
}
