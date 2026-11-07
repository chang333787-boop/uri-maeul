export const WK_ACT = { stand: 0, walk: 1, pick: 2, hoe: 3, rake: 4, reach: 5, fish: 6, hold: 7, swim: 8, fork: 9, wave: 10, pilot: 11, cheer: 12, nod: 13, hop: 14, point: 15, rhy: 16, sit: 17, sitg: 18 };
const TOOL = { none: 0, hoe: 1, axe: 2, rake: 3, fork: 4, rod: 5, frame: 6, pad: 7, basket: 8, lunch: 9, lunchg: 10, carry: 11 };
const ROLE = { farmer: ['hoe', 'hoe'], picker: ['pick', 'basket'], bee: ['hold', 'frame'], ranch: ['fork', 'fork'], wood: ['hoe', 'axe'], pilot: ['pilot', 'pad'], salt: ['rake', 'rake'], shop: ['wave', 'none'], fisher: ['fish', 'rod'], reach: ['reach', 'basket'], guest: ['stand', 'none'], swim: ['swim', 'none'] };
const CROP = { strawberry: 0xe8434a, potato: 0xb98b5a, cabbage: 0x9bd46e, shiitake: 0x8a5a3a, paddy: 0x7cc35a, pear: 0xe8d06a };
const HAIR = [0x2a2522, 0x3a2a1e, 0x5b3f2e, 0x8f8a84], SKIN = [0xf2cfa8, 0xe8c09a, 0xd9ab84, 0xc8956a];

const HIP = 0.76, KNEE = 0.41, WAIST = 0.84, SHO = [0.215, 1.27], HAND = 0.45, NECK = 1.36, HC = 1.53, HR = [0.205, 0.195, 0.19], EYE = HC - 0.02;
const F = v => v.toFixed(3), G = [-SHO[0], SHO[1] - HAND, 0];
const FORK = { b: 0.36, L: 1.12, T: 1.38 };
const forkTip = (() => { const d = [0, -Math.cos(FORK.b), Math.sin(FORK.b)]; return [G[0], G[1] + d[1] * FORK.T, G[2] + d[2] * FORK.T]; })();

const VS_HEAD = `attribute vec2 aPS;
attribute vec4 aPh;
attribute vec4 aPal;
uniform float uT;
uniform vec3 uPal[40];
mat3 wkX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 wkY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 wkZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
float wkPulse(float u, float a, float b, float c, float d) { return smoothstep(a, b, u) * (1.0 - smoothstep(c, d, u)); }
float wk4(float a, float b, float c, float d, float e, float k1, float k2, float k3, float k4) { return mix(mix(mix(mix(a, b, k1), c, k2), d, k3), e, k4); }
`;

const VS_POSE = `
  vec3 wP = position; vec3 wN = objectNormal;
  { float part = aPS.x, act = aPh.y, tool = aPh.z, ph = aPh.x, t = uT * (0.9 + 0.2 * fract(ph * 7.13)) + ph, br = sin(uT * 1.7 + ph * 3.0);
    float pit = 0.0, tw = 0.0, lean = 0.0, bob = 0.0, fwd = 0.0, aL = 0.0, aR = 0.0, zL = 0.09, zR = -0.09, lL = 0.0, lR = 0.0, kL = 0.0, kR = 0.0, cr = 0.0, hN = 0.0, hT = 0.0, load = 0.0;
    if (act < 0.5 || act > 9.5 && act < 10.5) {    
      lean = 0.035 * sin(t * 0.5); hT = 0.5 * sin(t * 0.21) * smoothstep(0.2, 0.8, sin(t * 0.13)); hN = 0.05 * sin(t * 0.37); aL = 0.06 * sin(t * 0.6); aR = -aL; zL = 0.1 + 0.02 * br; zR = -zL; lL = -0.04; lR = 0.04;
      if (act > 9.5) { float s = wkPulse(fract(t / 9.0), 0.0, 0.07, 0.3, 0.37); aR = mix(aR, -2.75, s); zR = mix(zR, 0.2 + 0.32 * sin(t * 13.0), s); hT *= 1.0 - s; hN -= 0.08 * s; } }
    else if (act < 1.5) {    
      float w = t * 7.0, s = sin(w); lL = 0.4 * s; lR = -lL; kL = 0.7 * max(0.0, -cos(w)); kR = 0.7 * max(0.0, cos(w)); aL = -0.45 * s; aR = -aL; bob = 0.03 * abs(cos(w)); pit = 0.05;
      if (tool > 10.5) { aR = -0.1 + 0.06 * s; zR = -0.22; } }    
    else if (act < 2.5) {    
      float s = wkPulse(fract(t / 14.0), 0.0, 0.05, 0.13, 0.19), c = t * 1.5, kl = 0.5 + 0.5 * sin(c), kr = 0.5 + 0.5 * sin(c + 3.1416);
      cr = 1.0 - s; pit = mix(0.75, -0.12, s); aL = mix(-pit - 0.5 - 0.6 * kl, -2.8, s); aR = mix(-pit - 0.5 - 0.6 * kr, -2.8, s); zL = mix(-0.18, 0.35, s); zR = -zL; tw = 0.15 * sin(c * 0.37) * (1.0 - s); hN = mix(0.05, -0.3, s); }    
    else if (act < 3.5) {    
      float ax = step(1.5, tool), u = fract(t * mix(0.48, 0.6, ax)), k1 = smoothstep(0.0, 0.5, u), k2 = smoothstep(0.5, 0.62, u), k3 = smoothstep(0.8, 1.0, u), a0 = mix(-0.88, -1.5, ax), p0 = mix(0.25, 0.35, ax), c0 = mix(0.05, 0.1, ax);    
      aL = mix(mix(mix(a0, -2.85, k1), mix(-0.83, -1.43, ax), k2), a0, k3); aR = aL; pit = mix(mix(mix(p0, -0.08, k1), mix(0.38, 0.55, ax), k2), p0, k3); cr = mix(mix(mix(c0, 0.0, k1), mix(0.12, 0.2, ax), k2), c0, k3);
      zL = -0.42; zR = 0.42; hN = 0.1 - 0.5 * pit; lL = -0.12; lR = 0.1; }
    else if (act < 4.5) {    
      float c = sin(t * 1.3); pit = 0.3 + 0.12 * c; fwd = 0.15 * c; aL = -0.837 - 0.13 * c; aR = aL; zL = -0.38; zR = 0.38; cr = 0.15; lL = -0.15 + 0.215 * c; lR = 0.12 + 0.215 * c; hN = -0.12; }
    else if (act < 5.5) {    
      float s = wkPulse(fract(t / 9.0), 0.0, 0.1, 0.25, 0.35), c = t * 1.2; aL = mix(-2.6 - 0.3 * sin(c), -0.75, s); aR = mix(-2.6 - 0.3 * sin(c + 3.1416), -0.75, s); zL = mix(0.12 + 0.08 * sin(c * 2.0), -0.3, s); zR = mix(-0.12 - 0.08 * sin(c * 2.0 + 1.0), 0.3, s);
      hN = mix(-0.5, 0.2, s); pit = mix(-0.08, 0.45, s); cr = 0.45 * s; tw = 0.6 * s; }
    else if (act < 6.5) {    
      float s = wkPulse(fract(t / 7.0), 0.0, 0.05, 0.12, 0.3); aR = -0.72 + 0.04 * sin(t * 1.1) - 0.35 * s; zR = -0.12; aL = -0.5 - 0.25 * s; zL = -0.2; hN = 0.15 - 0.15 * s; pit = 0.05 - 0.04 * s; lL = -0.1; lR = 0.06; }
    else if (act < 7.5) {    
      aL = -0.92 + 0.05 * sin(t * 0.9); aR = aL; zL = -0.36; zR = 0.36; hN = 0.32 + 0.06 * sin(t * 0.5); tw = 0.25 * sin(t * 0.27); pit = 0.06; }
    else if (act < 8.5) {    
      float s = sin(t * 2.4); zL = 1.15 + 0.25 * s; zR = -zL; aL = -0.4 + 0.35 * cos(t * 2.4); aR = aL; bob = 0.05 * s; lL = 0.3 * sin(t * 3.1); lR = -lL; kL = 0.3 + 0.2 * sin(t * 3.1); kR = 0.3 - 0.2 * sin(t * 3.1); hN = -0.1; }
    else if (act < 9.5) {    
      float u = fract(t * 0.4), k1 = smoothstep(0.0, 0.25, u), k2 = smoothstep(0.32, 0.55, u), k3 = smoothstep(0.58, 0.7, u), k4 = smoothstep(0.75, 1.0, u);
      aL = wk4(-1.3, -1.12, -1.7, -1.95, -1.3, k1, k2, k3, k4); aR = aL; pit = wk4(0.2, 0.4, 0.1, 0.08, 0.2, k1, k2, k3, k4); cr = wk4(0.1, 0.3, 0.0, 0.0, 0.1, k1, k2, k3, k4); tw = wk4(0.3, 0.3, 0.2, -0.45, 0.3, k1, k2, k3, k4);
      zL = -0.38; zR = 0.38; hN = -0.3 * pit; lL = -0.12; lR = 0.1; load = smoothstep(0.15, 0.25, u) * (1.0 - smoothstep(0.62, 0.68, u)); }
    else if (act > 16.5) {    
      float g = step(17.5, act), e = step(8.5, tool) * (1.0 - step(10.5, tool)), s = wkPulse(fract(t / 4.0), 0.0, 0.15, 0.35, 0.5) * e;
      lL = mix(-1.35, -2.0, g); lR = lL; kL = mix(1.35, 0.94, g); kR = kL; bob = mix(-0.28, -0.66, g); pit = mix(-0.04, -0.14, g); lean = 0.02 * sin(t * 0.4);
      aL = mix(-0.5, -0.75, g); aR = mix(aL, -1.5, s); zL = -0.1; zR = 0.1; hN = mix(0.08, 0.28 - 0.18 * s, e); hT = (1.0 - e) * 0.45 * sin(t * 0.23) * smoothstep(0.1, 0.6, sin(t * 0.11)); }
    else if (act > 15.5) {    
      float cc = floor(ph), Lr = clamp(fract(ph) / 0.98, 0.0, 1.0), Dp = mod(cc, 16.0) / 15.0, Fg = floor(cc / 16.0), wt = mod(Fg, 2.0), two = mod(floor(Fg / 2.0), 2.0), ovr = mod(floor(Fg / 4.0), 2.0), rope = floor(Fg / 8.0);
      pit = 0.78 - 0.22 * Lr + 0.1 * Dp; cr = 0.22; lL = -0.14; lR = 0.12; hN = -0.2 + 0.25 * Lr; aR = mix(mix(-pit - 0.5, -pit - 1.5, Lr), -pit - 0.2, Dp); zR = -0.12; aL = -pit - 1.0; zL = -0.28;    
      if (two > 0.5) { aL = aR; zL = 0.12; }
      if (wt > 0.5) { pit = 0.12; cr = 0.0; aR = -pit - 1.5; zR = -0.3; aL = -0.3; zL = 0.1; hN = -0.05; }    
      if (rope > 0.5) { pit = 0.1; cr = 0.05; aL = -pit - 0.85; aR = aL; zL = -0.3; zR = 0.3; hN = 0.05; }    
      if (ovr > 0.5) { pit = -0.05; cr = 0.0; aL = -2.9; aR = -2.9; zL = 0.15; zR = -0.15; hN = -0.3; } }    
    else if (act > 14.5) {    
      aR = -1.5 + 0.03 * sin(t * 1.3); zR = -0.05; aL = 0.06; zL = 0.1; hN = -0.04; hT = 0.0; pit = -0.02; lL = -0.04; lR = 0.04; }
    else if (act > 12.5) {    
      float u = uT * 6.0; aL = -1.05; aR = -1.05; zL = -0.32; zR = 0.32; pit = 0.06; hN = act < 13.5 ? 0.26 * max(0.0, sin(u)) : -0.12; if (act > 13.5) { bob = 0.15 * max(0.0, sin(u * 1.4)); kL = 0.25 * max(0.0, -sin(u * 1.4)); kR = kL; } }
    else if (act > 11.5) {    
      aR = -2.5 + 0.35 * sin(t * 2.4); zR = 0.15 * sin(t * 4.8); aL = -0.25; zL = 0.12; bob = 0.02 * abs(sin(t * 2.4)); hT = 0.25 * sin(t * 0.4); lean = 0.05 * sin(t * 1.2); }
    else {    
      aL = -1.0 + 0.03 * sin(t * 3.0); aR = aL; zL = -0.38; zR = 0.38; hN = -0.38; hT = 0.4 * sin(t * 0.35); tw = 0.12 * sin(t * 0.35); lL = -0.05; lR = 0.05; }
    if (cr > 0.0) { bob -= 0.35 * (1.0 - cos(1.2 * cr)) + 0.35 * (1.0 - cos(0.6 * cr)); fwd -= 0.35 * (sin(1.2 * cr) - sin(0.6 * cr)); }    
    bool hide = false; if (part > 19.5) hide = abs((part > 27.5 && part < 28.5 ? 11.0 : part > 28.5 && part < 29.5 ? 4.0 : part > 29.5 ? part - 30.0 : part - 20.0) - tool) > 0.5 || part > 28.5 && part < 29.5 && load < 0.01; else if (part > 5.5 && part < 7.5) hide = aPh.w < 0.01;    
    if (hide) { wP = vec3(0.0); wN = vec3(0.0, 1.0, 0.0); }
    else if (part < 29.5) { mat3 R = mat3(1.0); vec3 q = wP;
      if (part > 3.5 && part < 5.5 || part > 10.5 && part < 12.5) { bool lf = part < 4.5 || part < 11.5 && part > 10.5; vec3 H = vec3(lf ? 0.095 : -0.095, ${F(HIP)}, 0.0); mat3 Rt = wkX((lf ? lL : lR) - 1.2 * cr);
        if (part < 5.5) { R = Rt; q = H + Rt * (q - H); } else { vec3 K = vec3(H.x, ${F(KNEE)}, 0.0); mat3 Rk = wkX((lf ? kL : kR) + 1.8 * cr); R = Rt * Rk; q = H + Rt * (K - H + Rk * (q - K)); } }
      else if (part < 7.5 || part > 8.5) {
        if (part < 0.5) q.y = ${F(WAIST)} + (q.y - ${F(WAIST)}) * (1.0 + 0.02 * br);    
        else if (part < 1.5 || part > 5.5 && part < 7.5 || part > 8.5 && part < 9.5) { if (part > 6.5 && part < 7.5) q.xz *= aPh.w; if (part > 8.5) q.y = ${F(EYE)} + (q.y - ${F(EYE)}) * (1.0 - 0.9 * wkPulse(fract(t / 4.3), 0.0, 0.02, 0.04, 0.06)); vec3 N = vec3(0.0, ${F(NECK)}, 0.0); R = wkY(hT) * wkX(hN); q = N + R * (q - N); }    
        else { bool rt = part > 2.5; float a = rt ? aR : aL, z = rt ? zR : zL; vec3 S = vec3(rt ? -${F(SHO[0])} : ${F(SHO[0])}, ${F(SHO[1])} + 0.008 * br, 0.0);
          if (part > 19.5) { vec3 Gp = vec3(${F(G[0])}, ${F(G[1])}, 0.0); if (part > 28.5) q = vec3(${F(forkTip[0])}, ${F(forkTip[1])}, ${F(forkTip[2])}) + (q - vec3(${F(forkTip[0])}, ${F(forkTip[1])}, ${F(forkTip[2])})) * load; R = wkX(a); q = S + R * (wkZ(z) * (Gp - S) + (q - Gp)); }    
          else { R = wkX(a) * wkZ(z); q = S + R * (q - S); } }
        vec3 Wv = vec3(0.0, ${F(WAIST)}, 0.0); mat3 T = wkY(tw) * wkX(pit) * wkZ(lean); q = Wv + T * (q - Wv); R = T * R; }
      wP = q + vec3(0.0, bob, fwd); wN = R * wN; }
    objectNormal = wN; }`;
const VS_COL = `
  { float sl = aPS.y; if (sl > 0.5) { float i0 = sl < 1.5 ? aPal.x : sl < 2.5 ? aPal.y : sl < 3.5 ? mod(aPal.z, 64.0) : sl < 4.5 ? floor(aPal.w / 16.0) : sl < 5.5 ? mod(aPal.w, 16.0) : floor(aPal.z / 64.0); vColor = uPal[int(i0 + 0.5)] * color; } }`;

function bakeWorker(T3) {
  const SPH = new T3.SphereGeometry(1, 12, 8), SPHS = new T3.SphereGeometry(1, 7, 5), SPHT = new T3.SphereGeometry(1, 5, 3), CYL = new T3.CylinderGeometry(1, 1, 1, 8, 1), CYL6 = new T3.CylinderGeometry(1, 1, 1, 6, 1), BOX = new T3.BoxGeometry(1, 1, 1);
  const CAPS = (r, l, seg = 8, cs = 1) => new T3.CapsuleGeometry(r, l, cs, seg), ARC = new T3.TorusGeometry(1, 0.16, 3, 8, Math.PI);
  const TOPC = new T3.SphereGeometry(1, 12, 4, 0, Math.PI * 2, 0, Math.PI * 0.46), BACK = new T3.SphereGeometry(1, 8, 3, Math.PI, Math.PI, Math.PI * 0.4, Math.PI * 0.3), DOME = new T3.SphereGeometry(1, 12, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const BASK = new T3.CylinderGeometry(0.2, 0.15, 0.22, 10, 1, true), TMP = [];
  const pos = [], nor = [], col = [], ps = [], idx = [], m4 = new T3.Matrix4(), nm = new T3.Matrix3(), q = new T3.Quaternion(), e = new T3.Euler(), v = new T3.Vector3(), n = new T3.Vector3(), sv = new T3.Vector3(), c = new T3.Color(), up = new T3.Vector3(0, 1, 0), dv = new T3.Vector3();
  const W1 = [1, 1, 1];

  const add = (geo, p, s, r, part, slot, cl) => { const b = pos.length / 3, P = geo.attributes.position, N = geo.attributes.normal;
    m4.compose(v.set(p[0], p[1], p[2]), r && r.isQuaternion ? q.copy(r) : q.setFromEuler(e.set(...(r || [0, 0, 0]))), sv.set(s[0], s[1], s[2])); nm.getNormalMatrix(m4);
    if (slot === 0) c.set(cl); else c.setRGB(cl[0], cl[1], cl[2]);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(n.x, n.y, n.z); col.push(c.r, c.g, c.b); ps.push(part, slot); }
    if (geo.index) for (let i = 0; i < geo.index.count; i++) idx.push(b + geo.index.getX(i)); else for (let i = 0; i < P.count; i++) idx.push(b + i); };
  const rod = (A, B, r, part, cl) => { dv.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); const L = dv.length(); add(CYL6, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], [r, L, r], new T3.Quaternion().setFromUnitVectors(up, dv.normalize()), part, 0, cl); };
  const cap = (r, l, seg, cs) => { const g = CAPS(r, l, seg, cs); TMP.push(g); return g; };

  for (const [pt, sd] of [[4, 1], [5, -1]]) { add(cap(0.09, 0.22), [sd * 0.095, 0.585, 0], W1, null, pt, 2, W1); add(cap(0.086, 0.24), [sd * 0.095, 0.25, 0], W1, null, pt + 7, 2, [0.94, 0.94, 0.94]); add(SPHS, [sd * 0.095, 0.06, 0.04], [0.088, 0.065, 0.135], null, pt + 7, 0, 0x4a3b30); }
  add(CYL, [0, 0.8, 0], [0.172, 0.14, 0.14], null, 8, 2, W1); add(SPHS, [0, 0.74, 0], [0.172, 0.08, 0.14], null, 8, 2, W1);

  add(cap(0.178, 0.26, 10, 2), [0, 1.07, 0], [1, 1, 0.8], null, 0, 1, W1); add(CYL, [0, 0.885, 0], [0.18, 0.05, 0.146], null, 0, 1, [0.84, 0.84, 0.84]);

  const fz = (x, y) => HR[2] * Math.sqrt(Math.max(0, 1 - (x / HR[0]) ** 2 - ((y - HC) / HR[1]) ** 2)), mY = HC - 0.085;
  add(SPH, [0, HC, 0], HR, null, 1, 4, W1);
  for (const sd of [-1, 1]) { add(SPHT, [sd * 0.068, EYE, fz(0.068, EYE) - 0.008], [0.022, 0.034, 0.016], null, 9, 0, 0x2d2a33); add(SPHT, [sd * 0.118, HC - 0.06, fz(0.118, HC - 0.06) - 0.009], [0.03, 0.016, 0.01], [0, sd * 0.6, 0], 1, 4, [1, 0.8, 0.78]); }
  add(ARC, [0, mY + 0.016, fz(0, mY) - 0.004], [0.026, 0.022, 0.016], [0, 0, Math.PI], 1, 0, 0x9a4a42);
  add(TOPC, [0, HC + 0.006, -0.004], [0.214, 0.206, 0.2], [-0.18, 0, 0], 1, 5, W1); add(BACK, [0, HC - 0.01, -0.006], [0.212, 0.204, 0.198], null, 1, 5, W1);

  add(DOME, [0, HC + 0.04, -0.005], [0.222, 0.2, 0.218], [-0.1, 0, 0], 6, 3, W1); add(CYL, [0, HC + 0.05, 0.01], [0.34, 0.022, 0.34], [-0.06, 0, 0], 7, 3, [0.9, 0.9, 0.9]);

  for (const [pt, sd] of [[2, 1], [3, -1]]) { const x = sd * SHO[0]; add(cap(0.064, 0.28), [x, SHO[1] - 0.19, 0], W1, null, pt, 1, W1); add(SPHS, [x, SHO[1] - HAND, 0.005], [0.064, 0.07, 0.064], null, pt, 4, W1); }

  const dir = b => [0, -Math.cos(b), Math.sin(b)], perp = b => [0, -Math.sin(b), -Math.cos(b)], at = (d, k, o = [0, 0, 0]) => [G[0] + d[0] * k + o[0], G[1] + d[1] * k + o[1], G[2] + d[2] * k + o[2]], ofs = (T, p, k) => [T[0] + p[0] * k, T[1] + p[1] * k, T[2] + p[2] * k];
  const WOOD = 0xa0784a, IRON = 0x8a9099, IRD = 0x6d737b, wo = (a0, x, y, z) => [G[0] + x, G[1] + y * Math.cos(a0) + z * Math.sin(a0), G[2] - y * Math.sin(a0) + z * Math.cos(a0)];
  { const b = 0.3, d = dir(b), T = at(d, 1.05); rod(at(d, -0.12), T, 0.024, 21, WOOD); add(BOX, ofs(T, perp(b), 0.1), [0.2, 0.025, 0.22], [-b, 0, 0], 21, 0, IRON); }
  { const b = 0.2, d = dir(b), p = perp(b), T = at(d, 0.78); rod(at(d, -0.1), T, 0.026, 22, WOOD); add(BOX, ofs(T, p, 0.07), [0.05, 0.2, 0.17], [-b, 0, 0], 22, 0, IRON); add(BOX, ofs(T, p, 0.16), [0.03, 0.22, 0.03], [-b, 0, 0], 22, 0, 0xd8dce0); }
  { const b = 0.45, d = dir(b), T = at(d, 1.55); rod(at(d, -0.1), T, 0.022, 23, WOOD); add(BOX, T, [0.6, 0.035, 0.13], [-b, 0, 0], 23, 0, 0xb88a56); }
  { const d = dir(FORK.b), T = at(d, FORK.L); rod(at(d, -0.1), T, 0.022, 24, WOOD); add(BOX, T, [0.24, 0.035, 0.035], [-FORK.b, 0, 0], 24, 0, IRD); for (const x of [-0.1, 0, 0.1]) rod([T[0] + x, T[1], T[2]], at(d, FORK.T, [x, 0, 0]), 0.012, 24, IRON);
    add(SPHS, ofs(forkTip, perp(FORK.b), -0.06), [0.17, 0.09, 0.15], [-FORK.b, 0, 0], 29, 0, 0xe2c25c); }
  { const b = 1.35, d = dir(b), T = at(d, 2.3), a0 = -0.72, L0 = [0, -Math.cos(a0), Math.sin(a0)], E = ofs(T, L0, 2.3); rod(at(d, -0.15), T, 0.016, 25, 0x3a4a5a); rod(at(d, -0.15), at(d, 0.25), 0.026, 25, 0xc8693a); rod(T, E, 0.005, 25, 0xf4f1e8); add(SPHT, E, [0.045, 0.06, 0.045], null, 25, 0, 0xe8434a); }
  { const a0 = -0.98; add(BOX, wo(a0, 0.215, 0.1, 0.05), [0.37, 0.26, 0.025], [-a0, 0, 0], 26, 0, 0xe8b840);     add(BOX, wo(a0, 0.215, 0.24, 0.05), [0.52, 0.035, 0.045], [-a0, 0, 0], 26, 0, WOOD); for (const x of [0.02, 0.41]) add(BOX, wo(a0, x, 0.1, 0.05), [0.03, 0.27, 0.035], [-a0, 0, 0], 26, 0, WOOD); }
  { const a0 = -1.0; add(BOX, wo(a0, 0.215, 0.03, 0.05), [0.22, 0.05, 0.13], [-a0, 0, 0], 27, 0, 0x3a3f4a); for (const x of [0.15, 0.28]) rod(wo(a0, x, 0.05, 0.0), wo(a0, x, 0.2, -0.04), 0.008, 27, 0x2b2d33); }
  { const B = [G[0] - 0.07, G[1] - 0.2, 0.03]; add(BASK, B, [0.62, 0.75, 0.62], null, 28, 0, 0xb07a3c); add(CYL, [B[0], B[1] + 0.085, B[2]], [0.13, 0.02, 0.13], null, 28, 0, 0x8a5a2c); rod([G[0], G[1] + 0.02, G[2]], [B[0] + 0.1, B[1] + 0.09, B[2]], 0.01, 28, 0x8a5a2c); rod([G[0], G[1] + 0.02, G[2]], [B[0] - 0.1, B[1] + 0.09, B[2]], 0.01, 28, 0x8a5a2c);
    add(SPHT, [B[0] + 0.04, B[1] + 0.1, B[2] + 0.03], [0.05, 0.045, 0.05], null, 28, 0, 0xe8434a); add(SPHT, [B[0] - 0.04, B[1] + 0.1, B[2] - 0.02], [0.05, 0.04, 0.05], null, 28, 0, 0xf2efe2); rod([B[0] - 0.02, B[1] + 0.06, B[2] + 0.04], [B[0] - 0.05, B[1] + 0.3, B[2] + 0.06], 0.014, 28, 0x5ea845); }

  add(CYL, [0, 0.15, 1.1], [0.25, 0.3, 0.25], null, 32, 0, 0x8a5a36); add(CYL, [0, 0.305, 1.1], [0.225, 0.012, 0.225], null, 32, 0, 0xe0c08a); add(CYL, [0.0, 0.36, 1.1], [0.085, 0.12, 0.085], null, 32, 0, 0xc8a070);
  add(SPHS, [0.55, 0.04, 1.25], [0.5, 0.32, 0.45], null, 34, 0, 0xe2c25c); add(SPHS, [0.4, 0.24, 1.2], [0.26, 0.16, 0.24], null, 34, 0, 0xecd27a);
  for (const [pt, P] of [[39, [0, 0.585, 0.2]], [40, [0.36, 0.03, 0.22]]]) { add(BOX, P, [0.24, 0.06, 0.16], null, pt, 0, 0xd9604a); add(BOX, [P[0], P[1] + 0.034, P[2]], [0.22, 0.012, 0.14], null, pt, 0, 0xf6f1e4); add(SPHT, [P[0] - 0.05, P[1] + 0.045, P[2]], [0.04, 0.02, 0.04], null, pt, 0, 0x7cc35a); }
  add(BASK, [0.44, 0.11, 0.32], W1, null, 38, 0, 0xb07a3c); add(CYL, [0.44, 0.215, 0.32], [0.212, 0.03, 0.212], null, 38, 0, 0x8a5a2c); add(CYL, [0.44, 0.19, 0.32], [0.19, 0.02, 0.19], null, 38, 6, [0.75, 0.75, 0.75]);
  for (const [x, z, s] of [[0.4, 0.29, 0.075], [0.49, 0.34, 0.07], [0.41, 0.38, 0.065]]) add(SPHT, [x, 0.2, z], [s, s * 0.9, s], null, 38, 6, W1);
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); g.setAttribute('aPS', new T3.Float32BufferAttribute(ps, 2)); g.setIndex(idx);
  for (const k of [SPH, SPHS, SPHT, CYL, CYL6, BOX, ARC, TOPC, BACK, DOME, BASK, ...TMP]) k.dispose(); return g; }

export function makeWorkerMesh(T3, L, RL) {
  const N = L.length, g = bakeWorker(T3), PAL = [], pi = hex => { let i = PAL.indexOf(hex); if (i < 0) { i = PAL.length; PAL.push(hex); } return i; };
  HAIR.forEach(pi); SKIN.forEach(pi);
  const PH = new Float32Array(N * 4), PA = new Float32Array(N * 4);
  L.forEach((w, i) => { const R0 = RL[w.role] || {}, R1 = ROLE[w.role] || ROLE.guest, S9 = R0.sh || [0x7fb8d0], c9 = w.ch != null ? w.ch : i;
    PH[i * 4] = w.ph || 0; PH[i * 4 + 1] = WK_ACT[R1[0]]; PH[i * 4 + 2] = TOOL[R1[1]]; PH[i * 4 + 3] = R0.hat == null ? 0 : (R0.hs || 1);
    PA[i * 4] = pi(S9[c9 % S9.length]); PA[i * 4 + 1] = pi(R0.pa ?? 0x3b4a5c); PA[i * 4 + 2] = pi(R0.hat ?? 0xe8d38a) + 64 * pi(CROP[w.k] ?? 0x9bd46e); PA[i * 4 + 3] = (4 + (c9 * 5 + 1) % SKIN.length) * 16 + (c9 * 7 + 2) % HAIR.length; });
  const PA0 = PA.slice(), PH0 = PH.slice(), aPh = PH.slice(), aPal = PA.slice(), at = new T3.InstancedBufferAttribute(aPh, 4), ap = new T3.InstancedBufferAttribute(aPal, 4); at.setUsage(T3.DynamicDrawUsage); ap.setUsage(T3.DynamicDrawUsage); g.setAttribute('aPh', at); g.setAttribute('aPal', ap); g.userData.keep = true;
  const U = { value: 0 }, UP = { value: Array.from({ length: 40 }, (_, k) => new T3.Color(PAL[k] ?? 0xffffff)) };
  const mat = new T3.MeshLambertMaterial({ vertexColors: true, emissive: 0x16110c });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = U; sh.uniforms.uPal = UP; sh.vertexShader = VS_HEAD + sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>' + VS_POSE).replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed = wP;').replace('#include <color_vertex>', '#include <color_vertex>' + VS_COL); };
  mat.customProgramCacheKey = () => 'wk1';
  const m = new T3.InstancedMesh(g, mat, N), O = new T3.Object3D(), MX = L.map(() => new T3.Matrix4()), XZ = new Float32Array(N * 2), hid = new Uint8Array(N), ORD = new Int32Array(N), SLOT = new Int32Array(N);
  m.userData.fx = 1; m.userData.wk9 = 1; m.frustumCulled = false; m.matrixAutoUpdate = false;
  let K = N, dirty = true; for (let i = 0; i < N; i++) { ORD[i] = i; SLOT[i] = i; }
  const set = (i, x, y, z, ry) => { O.position.set(x, y, z); O.rotation.set(0, ry, 0); O.updateMatrix(); MX[i].copy(O.matrix); XZ[i * 2] = x; XZ[i * 2 + 1] = z; const j = SLOT[i]; if (j >= 0) { m.setMatrixAt(j, MX[i]); m.instanceMatrix.needsUpdate = true; } };
  L.forEach((w, i) => set(i, w.x, w.g + 0.02, w.z, w.ry));
  return { m, n: N, get count() { return K; },
    tick(t) { U.value = t; },
    set,

    near(cx, cz, R) { const R2 = R * R; let k = 0, same = true;
      for (let i = 0; i < N; i++) { if (hid[i]) continue; const dx = XZ[i * 2] - cx, dz = XZ[i * 2 + 1] - cz; if (dx * dx + dz * dz > R2) continue; if (k >= K || ORD[k] !== i) same = false; ORD[k++] = i; }
      if (same && k === K && !dirty) return; dirty = false; K = k; SLOT.fill(-1);
      for (let j = 0; j < K; j++) { const i = ORD[j]; SLOT[i] = j; m.setMatrixAt(j, MX[i]); for (let q = 0; q < 4; q++) { aPh[j * 4 + q] = PH[i * 4 + q]; aPal[j * 4 + q] = PA[i * 4 + q]; } }
      m.count = K; m.instanceMatrix.needsUpdate = true; at.needsUpdate = true; ap.needsUpdate = true; },
    act(i, a, tool) { const v9 = typeof a === 'number' ? a : WK_ACT[a], t9 = tool == null ? PH[i * 4 + 2] : typeof tool === 'number' ? tool : TOOL[tool]; if (v9 == null || (PH[i * 4 + 1] === v9 && PH[i * 4 + 2] === t9)) return; PH[i * 4 + 1] = v9; PH[i * 4 + 2] = t9; const j = SLOT[i]; if (j >= 0) { aPh[j * 4 + 1] = v9; aPh[j * 4 + 2] = t9; at.needsUpdate = true; } },
    reset(i) { this.act(i, PH0[i * 4 + 1], PH0[i * 4 + 2]); },
    pose(i, v) { const v9 = v == null ? PH0[i * 4] : v; if (PH[i * 4] === v9) return; PH[i * 4] = v9; const j = SLOT[i]; if (j >= 0) { aPh[j * 4] = v9; at.needsUpdate = true; } },
    actOf: i => PH[i * 4 + 1],
    toolOf: i => PH[i * 4 + 2], palOf: i => [PA[i * 4], PA[i * 4 + 1], PA[i * 4 + 2], PA[i * 4 + 3]],
    hat(i, on) { const v = on ? PH0[i * 4 + 3] : 0; if (PH[i * 4 + 3] === v) return; PH[i * 4 + 3] = v; const j = SLOT[i]; if (j >= 0) { aPh[j * 4 + 3] = v; at.needsUpdate = true; } },
    dress(i, d) { const o = i * 4, pk = hex => { let k = PAL.indexOf(hex); if (k < 0) { if (PAL.length >= 40) return -1; k = PAL.length; PAL.push(hex); UP.value[k].setHex(hex); } return k; };
      let a = PA0[o], b = PA0[o + 1], c = PA0[o + 3]; if (d) { a = pk(d[0]); b = pk(d[1]); if (a < 0 || b < 0) return; if (d[2] != null) c = PA0[o + 3] - (PA0[o + 3] % 16) + d[2]; }
      if (PA[o] === a && PA[o + 1] === b && PA[o + 3] === c) return; PA[o] = a; PA[o + 1] = b; PA[o + 3] = c; const j = SLOT[i]; if (j >= 0) { aPal[j * 4] = a; aPal[j * 4 + 1] = b; aPal[j * 4 + 3] = c; ap.needsUpdate = true; } },
    vis(i, on) { if (!on === !!hid[i]) return; hid[i] = on ? 0 : 1; dirty = true; },
    dispose() { g.dispose(); mat.dispose(); } };
}
