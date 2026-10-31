export function propGeos(T3) {
  const cat = L => { const P = [], N = [], Cc = []; for (const [g0, c] of L) { const g = g0.index ? g0.toNonIndexed() : g0; P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) Cc.push(c, c, c); if (g !== g0) g.dispose(); g0.dispose(); } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(Cc, 3)); return g; };
  const umb = cat([[new T3.CylinderGeometry(0.012, 0.012, 0.62, 5).translate(0, 0.31, 0), 0.25], [new T3.ConeGeometry(0.55, 0.3, 8, 1, true).translate(0, 0.72, 0), 1], [new T3.ConeGeometry(0.54, 0.29, 8, 1, true).scale(-1, 1, 1).translate(0, 0.715, 0), 0.78], [new T3.SphereGeometry(0.025, 5, 3).translate(0, 0.88, 0), 0.25]]);
  const fan = cat([[new T3.CylinderGeometry(0.012, 0.012, 0.16, 5).translate(0, 0.08, 0), 0.3], [new T3.CylinderGeometry(0.13, 0.13, 0.012, 10).rotateX(Math.PI / 2).translate(0, 0.25, 0), 1]]);
  return { umb, fan };
}

const BVS = `
  { float w = aWing; if (abs(w) > 0.5) { float a = sin(uBT * 7.0 + aBP * 6.2832) * 0.65; float c = cos(a), s = sin(a) * sign(w); vec3 q = transformed; transformed = vec3(q.x * c, q.x * s + q.y, q.z); } }`;
export function createBirds(T3) {
  const P = [], W = [];
  const tri = (a, b, c, w) => { P.push(...a, ...b, ...c); W.push(w, w, w); };
  tri([0, 0, 0.7], [-0.12, 0, -0.5], [0.12, 0, -0.5], 0); tri([0, 0, 0.7], [0.12, 0, -0.5], [-0.12, 0, -0.5], 0);
  for (const sd of [-1, 1]) { const A = [0, 0, 0.25], B = [sd * 1.5, 0, -0.1], C = [0, 0, -0.25]; tri(A, B, C, sd); tri(A, C, B, sd); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('aWing', new T3.Float32BufferAttribute(W, 1));
  const N = 9, ph = new Float32Array(N); for (let i = 0; i < N; i++) ph[i] = (i * 0.37) % 1; g.setAttribute('aBP', new T3.InstancedBufferAttribute(ph, 1));
  const U = { value: 0 }, mat = new T3.MeshBasicMaterial({ color: 0x3a3a44, fog: false, side: T3.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uBT = U; sh.vertexShader = 'attribute float aWing;\nattribute float aBP;\nuniform float uBT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + BVS); };
  mat.customProgramCacheKey = () => 'birds1';
  const m = new T3.InstancedMesh(g, mat, N), O = new T3.Object3D(); m.frustumCulled = false; m.userData.fx = 1; m.visible = false;
  for (let i = 0; i < N; i++) { const k = Math.ceil(i / 2), sd = i % 2 ? 1 : -1; O.position.set(i ? sd * k * 3.2 : 0, (i % 3) * 0.4, -k * 3.0); O.scale.setScalar(1.2 - k * 0.03); O.updateMatrix(); m.setMatrixAt(i, O.matrix); }

  const F = { on: false, t: 0, T: 0, wait: 6, sx: 0, sz: 0, ex: 0, ez: 0, y: 0, n: 0 };
  return { m,
    tick(dt, cp, ok) { U.value += dt; if (!F.on) { m.visible = false; if (!ok || (F.wait -= dt) > 0) return; const a = (F.n * 2.39996 + 0.7) % 6.2832, b = a + Math.PI + 0.5 * Math.sin(F.n * 1.7); F.sx = cp.x + Math.cos(a) * 230; F.sz = cp.z + Math.sin(a) * 230; F.ex = cp.x + Math.cos(b) * 230; F.ez = cp.z + Math.sin(b) * 230; F.y = cp.y + 70 + (F.n % 3) * 12; F.T = Math.hypot(F.ex - F.sx, F.ez - F.sz) / 9; F.t = 0; F.on = true; F.n++; }
      if (!ok) { F.on = false; F.wait = 20; m.visible = false; return; }
      F.t += dt; const u = F.t / F.T; if (u >= 1) { F.on = false; F.wait = 15 + (F.n % 4) * 8; m.visible = false; return; }
      m.position.set(F.sx + (F.ex - F.sx) * u, F.y + Math.sin(F.t * 0.4) * 3, F.sz + (F.ez - F.sz) * u); m.rotation.set(0, Math.atan2(F.ex - F.sx, F.ez - F.sz), 0); m.visible = true; },
    go() { if (!F.on) F.wait = 0; },
    info: () => ({ on: F.on, x: Math.round(m.position.x), y: Math.round(m.position.y), z: Math.round(m.position.z), n: F.n }),
    dispose() { g.dispose(); mat.dispose(); } };
}
