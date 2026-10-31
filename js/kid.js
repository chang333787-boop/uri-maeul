export function buildKid(THREE, style = 'a') {
  const MAT = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x2a2018 });
  const SPH = new THREE.SphereGeometry(1, 22, 14), SPHS = new THREE.SphereGeometry(1, 12, 8);
  const CAPH = new THREE.SphereGeometry(1, 22, 9, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const DOME = new THREE.SphereGeometry(1, 22, 7, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const CAPS = (r, l, seg = 8, cap = 2) => new THREE.CapsuleGeometry(r, l, cap, seg);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 14, 1);
  const ARC = new THREE.TorusGeometry(1, 0.16, 5, 12, Math.PI);
  const C = { top: 0x5aa6e0, top2: 0x4a90cc, bot: 0x33456b, skin: 0xf7d6b5, hair: 0x5b3f2e, shoe: 0xf6f6f2, sole: 0xd5d9de,
    bag: 0xe45c46, bag2: 0xc44a37, eye: 0x2d2a33, mouth: 0x9a4a42, blush: 0xf6b9a8, cap: 0xf2c230, cap2: 0xe0ac1c };
  const m4 = new THREE.Matrix4(), nm = new THREE.Matrix3(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), n = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();

  function bake(parts) {
    const pos = [], nor = [], cl = [], rng = [];
    for (const [geo, p, sc, hex, r] of parts) {
      rng.push([pos.length / 3, (geo.index ? geo.index.count : geo.attributes.position.count)]);
      const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, N = g.attributes.normal;
      m4.compose(v.set(p[0], p[1], p[2]), q.setFromEuler(e.set(...(r || [0, 0, 0]))), sv.set(sc[0], sc[1], sc[2])); nm.getNormalMatrix(m4); col.set(hex);
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
        n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(n.x, n.y, n.z); cl.push(col.r, col.g, col.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    const mesh = new THREE.Mesh(g, MAT); mesh.castShadow = true; mesh.userData.parts = rng; return mesh;
  }
  const rig = new THREE.Group();

  const HIP = 0.34, SHO = 0.72, HC = 0.265, HR = [0.278, 0.265, 0.26];

  const body = bake([
    [CYL, [0, HIP + 0.05, 0], [0.15, 0.13, 0.125], C.bot], [SPHS, [0, HIP - 0.01, 0], [0.15, 0.06, 0.125], C.bot],
    [CAPS(0.155, 0.12, 14, 3), [0, 0.575, 0], [1, 1, 0.82], C.top], [CYL, [0, 0.43, 0], [0.158, 0.03, 0.132], C.top2],
    [CAPS(0.12, 0.12, 12, 2), [0, 0.575, -0.185], [1.18, 1, 0.52], C.bag], [CAPS(0.1, 0.04), [0, 0.655, -0.222], [1.25, 0.9, 0.36], C.bag2, [0.25, 0, 0]],
    [CAPS(0.07, 0.03), [0, 0.51, -0.232], [1.1, 0.8, 0.3], C.bag2],
    ...[-1, 1].map(sd => [CAPS(0.017, 0.2, 6, 2), [sd * 0.085, 0.59, 0.126], [1, 1, 1], C.bag2]),
  ]);
  rig.add(body);

  const head = new THREE.Group(); head.position.y = 0.76; rig.add(head);
  const fz = (x, y) => HR[2] * Math.sqrt(Math.max(0, 1 - (x / HR[0]) ** 2 - ((y - HC) / HR[1]) ** 2));
  const eyeY = HC - 0.035, mY = HC - 0.1;
  const face = [
    [SPH, [0, HC, 0], HR, C.skin],
    [SPHS, [-0.088, eyeY, fz(0.088, eyeY) - 0.012], [0.03, 0.046, 0.022], C.eye], [SPHS, [0.088, eyeY, fz(0.088, eyeY) - 0.012], [0.03, 0.046, 0.022], C.eye],
    [ARC, [0, mY + 0.02, fz(0, mY) - 0.006], [0.036, 0.03, 0.02], C.mouth, [0, 0, Math.PI]],
    [SPHS, [-0.155, HC - 0.075, fz(0.155, HC - 0.075) - 0.012], [0.04, 0.022, 0.012], C.blush, [0, -0.62, 0]],
    [SPHS, [0.155, HC - 0.075, fz(0.155, HC - 0.075) - 0.012], [0.04, 0.022, 0.012], C.blush, [0, 0.62, 0]],
  ];
  if (style === 'b') {
    face.push(
      [SPHS, [0, HC - 0.02, -0.03], [0.268, 0.2, 0.25], C.hair],
      [DOME, [0, HC + 0.035, -0.005], [0.278, 0.245, 0.27], C.cap, [-0.12, 0, 0]],
      [CYL, [0, HC + 0.075, 0.2], [0.19, 0.018, 0.13], C.cap2, [0.18, 0, 0]],
      [SPHS, [0, HC + 0.28, -0.01], [0.03, 0.022, 0.03], C.cap2],
    );
  } else {
    const TOPC = new THREE.SphereGeometry(1, 22, 7, 0, Math.PI * 2, 0, Math.PI * 0.44), BACK = new THREE.SphereGeometry(1, 12, 5, Math.PI, Math.PI, Math.PI * 0.43, Math.PI * 0.33);
    face.push(
      [TOPC, [0, HC + 0.004, 0], [0.288, 0.278, 0.272], C.hair], [BACK, [0, HC, -0.004], [0.286, 0.276, 0.27], C.hair],
      [SPHS, [0.02, HC + 0.285, -0.02], [0.03, 0.045, 0.028], C.hair, [0, 0, -0.5]],
    );
  }
  head.add(bake(face));

  const arm = sd => { const g = new THREE.Group(); g.position.set(sd * 0.175, SHO, 0); g.rotation.z = sd * 0.12;
    g.add(bake([[CAPS(0.058, 0.05), [0, -0.04, 0], [1, 1, 1], C.top], [CAPS(0.048, 0.13), [0, -0.15, 0], [1, 1, 1], C.skin], [SPHS, [0, -0.25, 0.005], [0.058, 0.06, 0.058], C.skin]])); rig.add(g); return g; };

  const shins = [];
  const leg = sd => { const g = new THREE.Group(); g.position.set(sd * 0.078, HIP, 0);
    g.add(bake([[CAPS(0.068, 0.06), [0, -0.05, 0], [1, 1, 1], C.bot], [CAPS(0.056, 0.05), [0, -0.12, 0], [1, 1, 1], C.skin]]));
    const knee = new THREE.Group(); knee.position.y = -0.16; g.add(knee);
    knee.add(shins[shins.length] = bake([[CAPS(0.054, 0.06), [0, -0.04, 0], [1, 1, 1], C.skin], [CYL, [0, -0.1, 0], [0.058, 0.03, 0.058], 0xffffff],
      [SPHS, [0, -0.14, 0.03], [0.075, 0.055, 0.115], C.shoe], [SPHS, [0, -0.168, 0.03], [0.072, 0.018, 0.11], C.sole]]));
    rig.add(g); return { g, knee }; };
  const legL = leg(-1), legR = leg(1);

  function setShoe(hex) { col.set(hex); for (const m of shins) { const [a, n] = m.userData.parts[2], C9 = m.geometry.attributes.color;
    for (let i = a; i < a + n; i++) C9.setXYZ(i, col.r, col.g, col.b); C9.needsUpdate = true; } }
  return { rig, body, head, armL: arm(-1), armR: arm(1), legL, legR, sitY: 0.46 - HIP, tray: [0.62, 0.3], milk: [0.2, 0.55, 0.2], height: HC + 0.76 + HR[1], setShoe, shoeIn: C.shoe };

}
