export const MAP2_V = 1;

export const LAY = [['shop', '🏪', '가게·집', 'Shops & homes'], ['nat', '🌳', '쉼터·자연', 'Rest spots'], ['door', '🚪', '들어가는 곳', 'Go inside'], ['bus', '🚌', '버스·지하철', 'Bus & subway'], ['trace', '👣', '내 흔적', 'My trail'], ['kid', '🔖', '우리 이름', 'Our names']];
const KEY = 'twn-maplay';

export function createMap2() {
  const ON = {}; for (const [k] of LAY) ON[k] = false;
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (const [k] of LAY) ON[k] = !!(s && s[k]); } catch (e) {   }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ON)); } catch (e) {   } };
  return { on: k => !!ON[k], set(k, v) { if (!(k in ON)) return false; ON[k] = !!v; save(); return true; }, state: () => ({ ...ON }), lay: () => ON, sig: () => LAY.map(([k]) => (ON[k] ? 1 : 0)).join('') };
}

const NATS = { sea: 95, hill: 94, water: 90, mudflat: 88, sand: 85, forest: 70, rice: 62, farm: 60, orchard: 58, park: 56, grass: 50 };
const LANDK = { fire: 80, police: 79, post: 78, library: 76, aquadom: 61, cinema: 55, pitch: 45, play: 42, school: 40 };
function scoreOf(p) {
  const n = String(p.name || '');
  if (p.area) return ['kid', 10];
  if (p.prop) return ['nat', 25];
  if (p.nat) return ['land', /연못|웅덩이|도랑/.test(n) ? 40 : (NATS[p.kind] ?? 50)];
  if (p.home || p.kind === 'house') return ['shop', 15];
  if (p.kind === 'public') return ['land', /행정복지/.test(n) ? 77 : /터미널/.test(n) ? 66 : /박물관|아쿠아리움/.test(n) ? 62 : /안내소/.test(n) ? 60 : 50];
  if (p.kind === 'hospital') return /^(병원|보건소)$/.test(n) ? ['land', 70] : ['shop', 22];
  if (LANDK[p.kind] != null) return ['land', LANDK[p.kind]];
  if (/대형마트|^마트$/.test(n)) return ['land', 68];
  if (/시장$/.test(n)) return ['land', 66];
  if (/터미널|역$/.test(n)) return ['land', 65];
  return ['shop', 20];
}

export function rankPlaces(PLACES, W) {
  const R = [], seen = new Map();
  for (const p of PLACES) { if (p.school || !Number.isFinite(p.x) || !Number.isFinite(p.z)) continue; const [cat, s0] = scoreOf(p), nm = String(p.name || ''), k = seen.get(nm) || 0; seen.set(nm, k + 1); R.push({ p, cat, s: s0 - (k ? 30 : 0), tier: cat === 'land' ? 3 : 9 }); }
  R.sort((a, b) => b.s - a.s);
  const D = [W * 0.085, W * 0.05, W * 0.025], CAP = [12, 24, 48], took = [];
  for (const r of R) { if (r.cat !== 'land') continue;
    for (let t = 0; t < 3; t++) { if (took.filter(q => q.tier <= t).length >= CAP[t]) continue; if (took.some(q => q.tier <= t && Math.hypot(q.p.x - r.p.x, q.p.z - r.p.z) < D[t])) continue; r.tier = t; break; }
    took.push(r); }
  return R;
}
export const tierMax = z => (z < 1.4 ? 0 : z < 2.1 ? 1 : z < 3 ? 2 : 3);

export function createPlacer(w, h) { const R = [];
  const hit = (x, y, a, b) => { for (const r of R) if (x < r[0] + r[2] && x + a > r[0] && y < r[1] + r[3] && y + b > r[1]) return true; return false; };
  return { R, w, h, hit, put(x, y, a, b, t) { R.push([x, y, a, b, t || '']); }, fits: (x, y, a, b) => x >= 1 && y >= 1 && x + a <= w - 1 && y + b <= h - 1 }; }

export function placeLabels(g, items, PL, out) {
  g.save(); g.lineJoin = 'round';
  for (const it of items) {
    g.font = it.f; const tw = Math.ceil(g.measureText(it.t).width) + 4, th = it.th || 15, rm = it.r ?? (it.m === 'big' ? 10 : it.m === 'small' ? 7 : 0), px = it.px, pz = it.pz;
    if (px < -40 || pz < -40 || px > PL.w + 40 || pz > PL.h + 40) continue;
    const mk = rm ? [px - rm, pz - rm, rm * 2, rm * 2] : null;
    if (mk && !it.keep && PL.hit(mk[0], mk[1], mk[2], mk[3])) { out.hid++; continue; }
    const C = rm ? [[px - tw / 2, pz + rm + 1], [px + rm + 3, pz - th / 2], [px - tw / 2, pz - rm - 1 - th], [px - rm - 3 - tw, pz - th / 2]]
      : [[px - tw / 2, pz - th / 2], [px - tw / 2, pz - th * 1.6], [px - tw / 2, pz + th * 0.6], [px + tw * 0.55, pz - th / 2], [px - tw * 1.55, pz - th / 2], [px - tw / 2, pz - th * 2.7], [px - tw / 2, pz + th * 1.7], [px + tw * 0.55, pz - th * 1.6], [px - tw * 1.55, pz - th * 1.6], [px + tw * 0.55, pz + th * 0.6], [px - tw * 1.55, pz + th * 0.6]];
    let at = null; for (const q of C) if (PL.fits(q[0], q[1], tw, th) && !PL.hit(q[0], q[1], tw, th)) { at = q; break; }
    if (!at && !it.keep) { out.hid++; continue; }
    if (mk && it.nomk) PL.put(mk[0], mk[1], mk[2], mk[3], 'm');
    else if (mk) { PL.put(mk[0], mk[1], mk[2], mk[3], 'm'); g.fillStyle = '#fff'; g.beginPath(); g.arc(px, pz, rm, 0, 7); g.fill(); g.strokeStyle = '#1d3557'; g.lineWidth = it.m === 'big' ? 2 : 1.5; g.stroke(); if (it.ic) { g.fillStyle = '#1d3557'; g.font = (it.m === 'big' ? '800 12px ' : '700 9px ') + (it.ff || 'sans-serif'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.ic, px, pz + 1); } out.mk++; }
    if (!at) continue;
    PL.put(at[0], at[1], tw, th, it.k || 'l'); out.L.push([Math.round(at[0]), Math.round(at[1]), tw, th, it.k || 'l', it.t]);
    g.font = it.f; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineWidth = it.halo || 3; g.strokeStyle = it.hc || 'rgba(255,255,255,.95)'; g.strokeText(it.t, at[0] + 2, at[1] + th / 2 + 0.5); g.fillStyle = it.c || '#1d2b3a'; g.fillText(it.t, at[0] + 2, at[1] + th / 2 + 0.5);
  }
  g.restore(); return out;
}

export const ME_RED = '#e0302a';
export function drawArrow(g, x, y, a, s) { const W = Math.max(2.2, s * 0.3), D = Math.max(1.2, s * 0.11);
  g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.74, s * 0.8); g.lineTo(0, s * 0.38); g.lineTo(-s * 0.74, s * 0.8); g.closePath(); g.lineJoin = 'round';
  g.lineWidth = 2 * (W + D); g.strokeStyle = '#2b2420'; g.stroke(); g.lineWidth = 2 * W; g.strokeStyle = '#ffffff'; g.stroke(); g.fillStyle = ME_RED; g.fill(); g.restore(); }

export function meBoxes(x, y, a, s, tw, th, w, h) { const r = s + s * 0.3 + 2, B = [x - r, y - r, r * 2, r * 2], d = r + th * 0.5 + 1;
  let cx = x - Math.sin(a) * d, cy = y + Math.cos(a) * d; if (cx - tw / 2 < 1 || cx + tw / 2 > w - 1 || cy - th / 2 < 1 || cy + th / 2 > h - 1) { cx = x + Math.sin(a) * d; cy = y - Math.cos(a) * d; }
  return { B, T: [cx - tw / 2, cy - th / 2, tw, th] }; }

export function createHeading(A) { const H = { a: 0, x: 0, z: 0, t: 0, mv: -9, ok: false, by: '' };
  const turn = (tg, k) => { let d = tg - H.a; d = Math.atan2(Math.sin(d), Math.cos(d)); H.a = Math.abs(d) < 0.02 ? tg : H.a + d * k; };
  function tick(dt) { H.t += dt; const p = A.pos(); if (!p) return; if (!H.ok) { H.x = p.x; H.z = p.z; const l = A.look(); H.a = l == null ? 0 : l; H.ok = true; H.by = 'look'; return; }
    const dx = p.x - H.x, dz = p.z - H.z, d = Math.hypot(dx, dz);
    if (d > 25) { H.x = p.x; H.z = p.z; return; }
    if (d >= 0.12) { H.mv = H.t; H.x = p.x; H.z = p.z; H.by = 'move'; turn(Math.atan2(dx, -dz), 0.75); return; }
    if (H.t - H.mv > 0.6) { H.x = p.x; H.z = p.z; const l = A.look(); if (l != null) { H.by = 'look'; turn(l, 0.5); } } }
  return { tick, ang: () => H.a, info: () => ({ a: H.a, deg: Math.round(((H.a * 180 / Math.PI) % 360 + 360) % 360), by: H.by }) }; }

export const MAP2_CSS = `
.twn-p .twn-mw{display:flex;gap:10px;align-items:flex-start;justify-content:center}
.twn-p .twn-mcol{flex:none;width:200px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;overscroll-behavior:contain}
.twn-p .twn-mchips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.twn-p .twn-mchips>small{width:100%;font-weight:900;font-size:13px;color:var(--mut)}
.twn-p .twn-mchips button{min-height:34px;padding:2px 8px;font-size:13px;border-width:2px;box-shadow:0 3px 0 var(--ink);white-space:nowrap}
body.touch .twn-p .twn-mchips button{min-height:44px}
.twn-p .twn-mchips button[aria-pressed=true]{background:#ffe9a8;border-color:#b07a00;box-shadow:0 3px 0 #b07a00}
.twn-p .twn-mchips .zm{display:flex;gap:6px}
.twn-p .twn-mchips .zm button{min-width:42px;font-size:18px;font-weight:900;padding:0 8px}
.twn-p .twn-mleg{background:#fffdf6;border:2px solid var(--line);border-radius:10px;padding:5px 8px;font-size:12px;font-weight:700;line-height:1.2;color:#1d2b3a}
.twn-p .twn-mleg .lh{font-weight:900;margin-bottom:2px}
.twn-p .twn-mleg .li{display:flex;align-items:center;gap:6px;min-height:17px}
.twn-p .twn-mleg .li i{flex:none;display:inline-block;width:16px;height:12px;border:1px solid rgba(0,0,0,.25)}
.twn-p .twn-mleg .li b.gl{flex:none;width:16px;font-size:11px;color:#2b5a3a;text-align:center;letter-spacing:-1px}
.twn-p .twn-mleg .li svg{flex:none}
.twn-p .twn-mleg .li .gq{width:15px;height:15px;border-radius:50%;background:#ffd23f;border:2px solid #2b2420;box-sizing:border-box;font-style:normal;font-weight:900;font-size:11px;display:inline-flex;align-items:center;justify-content:center}
.twn-p .twn-mleg .li .rl{width:16px;height:0;border:0;border-top:3px dashed #ff5a36}
.twn-p .twn-mleg .li .bl{display:inline-block;padding:0 4px;border-radius:3px;font-size:11px;font-weight:900;margin-right:2px}
.twn-p .twn-mcs{display:block;flex:none;background:#fffdf6;border:2px solid var(--line);border-radius:10px}
.twn-p .twn-mhint{font-size:12px;color:var(--mut);font-weight:600;line-height:1.35;text-align:left}
.twn-p .row>.twn-mhint{order:-3;flex:1 1 240px;margin-right:auto;align-self:center}
.twn-p canvas.twn-big{touch-action:none}
.twn-p .twn-mw.nar{flex-direction:column;align-items:stretch}
.twn-p .twn-mw.nar .twn-mcol{width:auto;order:2;overflow:visible}
.twn-p .twn-mw.nar .twn-mchips>small{width:auto;flex:none}
.twn-p .twn-mw.nar .twn-mchips .zm{width:auto;flex:none}
.twn-p .twn-mw.nar .twn-mleg{display:flex;flex-wrap:wrap;gap:2px 12px}
.twn-p .twn-mw.nar .twn-mleg .lh{width:100%}
.twn-p .twn-mw.low .twn-mcol>.row{flex-direction:column;align-items:stretch;gap:6px;margin-top:2px}
.twn-p .twn-mw.low .twn-mcol>.row>.twn-mhint{order:9;flex:none}
`;
