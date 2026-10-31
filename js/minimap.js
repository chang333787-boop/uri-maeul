export function createMinimap(ctx) {
  const { mapData, drawMap, P, getYaw, onLayout, boxesIn } = ctx;
  const SMALL = 170, R = 40, TOP = 46, RIGHT = 10, PAD = 5, CAPH = 15, BG = '#d5dccb';
  const box = document.createElement('div');
  box.className = 'chip';
  box.style.cssText = `right:${RIGHT}px;top:${TOP}px;padding:${PAD}px;border-radius:14px;background:rgba(29,53,87,.55);display:none;cursor:pointer;user-select:none;line-height:0`;
  const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;border-radius:10px';
  const cap = document.createElement('div'); cap.style.cssText = `font-size:11px;line-height:${CAPH}px;height:${CAPH}px;text-align:center;opacity:.9;white-space:nowrap`;
  box.id = 'mmap';
  const mmX = document.createElement('div'); mmX.id = 'mm-x'; mmX.textContent = '✕'; mmX.style.display = 'none';
  const dim = document.createElement('div'); dim.id = 'mm-dim'; dim.style.display = 'none';
  dim.addEventListener('click', e => { e.stopPropagation(); toggle(false); });
  box.append(cv, cap, mmX); document.body.append(dim, box);
  const bc = c => document.body.classList.contains(c);
  const g = cv.getContext('2d');
  const S = { peers: [], vis: false, big: false, zoom: null, marks: [], dirty: true, dpr: 1, w: SMALL, h: SMALL, sB: 1, bb: null, fl: 1,
    px: 1e9, pz: 1e9, yaw: 1e9, ph: -1, t: 0, since: 1, ms: 0, drawN: 0, acc: 0, accT: 0, accN: 0 };
  const cache = new Map();
  const D0 = mapData(1), NB = D0.bounds;
  { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of D0.boundary) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    S.bb = S.bbAll = [x0 - 3, z0 - 3, x1 + 3, z1 + 3]; }
  { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const b of D0.buildings) { if (b.id === 'gym') continue; x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); z0 = Math.min(z0, b.z0); z1 = Math.max(z1, b.z1); }
    S.bbBld = [x0 - 4, z0 - 4, x1 + 4, z1 + 4]; S.focus = false; }
  const fb = document.createElement('button'); fb.id = 'mm-f'; fb.type = 'button'; fb.style.cssText = 'position:absolute;left:10px;top:10px;z-index:2;display:none;min-height:36px;padding:4px 12px;border-radius:18px;border:2px solid #1d3557;background:#fff;color:#1d3557;font:800 13px sans-serif;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3)';
  fb.addEventListener('click', e => { e.stopPropagation(); S.focus = !S.focus; S.bb = S.focus ? S.bbBld : S.bbAll; size(); onLayout && onLayout(); S.since = 1; tick(0); });
  box.append(fb);

  let thumb = null;
  function size() {
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!S.big && S.focus) { S.focus = false; S.bb = S.bbAll; }
    const [x0, z0, x1, z1] = S.bb, ov = S.big && bc('touch'), sm = !S.big && bc('small');
    fb.style.display = S.big ? '' : 'none'; fb.textContent = S.focus ? '🗺 학교 전체' : '🔍 건물 크게';
    box.classList.toggle('mm-ov', ov); box.classList.toggle('mm-th', sm); dim.style.display = ov && S.vis ? '' : 'none'; mmX.style.display = ov ? '' : 'none';
    if (ov) { const hMax = Math.max(160, innerHeight - 64 - CAPH), wMax = Math.max(200, innerWidth - 96);
      S.sB = Math.min(hMax / (z1 - z0), wMax / (x1 - x0)); S.w = Math.round((x1 - x0) * S.sB); S.h = Math.round((z1 - z0) * S.sB); }
    else if (sm) S.w = S.h = Math.max(64, Math.min(88, Math.round(innerHeight * 0.24)));
    else if (S.big) { const hMax = Math.max(200, innerHeight - TOP - 96 - PAD * 2 - CAPH), wMax = Math.max(200, innerWidth * 0.55);
      S.sB = Math.min(hMax / (z1 - z0), wMax / (x1 - x0)); S.w = Math.round((x1 - x0) * S.sB); S.h = Math.round((z1 - z0) * S.sB); }
    else { S.w = S.h = SMALL;

      if (document.body.classList.contains('touch')) { let bt = innerHeight;
        for (const id of ['tJump', 'tAct', 'tView']) { const b = document.getElementById(id); if (!b) continue; const r = b.getBoundingClientRect(); if (r.height > 0) bt = Math.min(bt, r.top); }
        S.w = S.h = Math.max(96, Math.min(SMALL, Math.floor(bt - 6 - TOP - PAD * 2 - CAPH))); } }
    cv.width = Math.round(S.w * S.dpr); cv.height = Math.round(S.h * S.dpr); cv.style.width = S.w + 'px'; cv.style.height = S.h + 'px';
    cap.textContent = ov ? '바깥이나 ✕를 누르면 닫혀요' : (document.body.classList.contains('touch') ? '' : 'M · ') + (S.big ? '누르면 작게' : '누르면 크게');
    cap.style.display = sm ? 'none' : '';
    if (!ov) thumb = null; if (sm && S.vis) { const r = box.getBoundingClientRect(); thumb = { right: innerWidth - r.right, top: r.top, w: r.width, h: r.height, big: false }; }
    S.dirty = true;
  }

  const ROOMY = z => z.indoor && !/^(corridor|hall|stair)$/.test(z.kind);
  function labels(c, D, s, ox, oz, px) {
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const used = [], seen = new Set(), minPx = px * 0.62;
    for (const z of D.zones.slice().sort((a, b) => (ROOMY(b) - ROOMY(a)) || (b.area - a.area))) {
      if (seen.has(z.label)) continue;
      const zw = (z.x1 - z.x0) * s, zh = (z.z1 - z.z0) * s;
      c.font = `700 ${px}px sans-serif`; const w0 = c.measureText(z.label).width;
      const f = Math.min(px, ROOMY(z) ? zw * 0.94 / w0 * px : px, zh / 1.1);
      if (ROOMY(z) && f < minPx && zh > zw * 1.2) {
        const ch = [...z.label], fv = Math.min(px, zw * 0.9, zh * 0.92 / (ch.length * 1.08)); if (fv < minPx * 0.9) continue;
        const cx = ((z.x0 + z.x1) / 2 - ox) * s, cy = ((z.z0 + z.z1) / 2 - oz) * s, hh = ch.length * fv * 1.08;
        if (used.some(u => Math.abs(u[0] - cx) < (u[2] + fv) / 2 + 2 && Math.abs(u[1] - cy) < (u[3] + hh) / 2 + 2)) continue;
        used.push([cx, cy, fv, hh]); seen.add(z.label); c.font = `700 ${fv}px sans-serif`; c.lineWidth = fv * 0.3; c.strokeStyle = 'rgba(255,255,255,.85)'; c.fillStyle = '#2b2419';
        ch.forEach((t, i) => { const y = cy - hh / 2 + fv * 1.08 * (i + 0.5); c.strokeText(t, cx, y); c.fillText(t, cx, y); });
        continue; }
      if (f < (ROOMY(z) ? minPx : px * 0.9) || (!ROOMY(z) && zw < w0 * 0.8)) continue;
      c.font = `700 ${f}px sans-serif`; const w = c.measureText(z.label).width;
      const cx = ((z.x0 + z.x1) / 2 - ox) * s, cy = ((z.z0 + z.z1) / 2 - oz) * s;
      if (used.some(u => Math.abs(u[0] - cx) < (u[2] + w) / 2 + 2 && Math.abs(u[1] - cy) < (u[3] + f) / 2 + 2)) continue;
      used.push([cx, cy, w, f]); seen.add(z.label);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = f * 0.3; c.strokeText(z.label, cx, cy); c.fillStyle = '#2b2419'; c.fillText(z.label, cx, cy);
    }
  }
  const ZOOMED = () => S.zoom && !S.big;
  function layer(fl) {
    const key = ZOOMED() ? 'zoom:' + fl + ':' + S.zoom.key : (S.big ? (S.focus ? 'bigF:' : 'big:') + S.w + ':' : 'small:') + fl; let c = cache.get(key); if (c) return c;
    c = document.createElement('canvas'); const x = c.getContext('2d');
    if (ZOOMED()) { const Z = S.zoom, [x0, z0, x1, z1] = Z.rect, s = SMALL / (2 * Z.r) * S.dpr; c.width = Math.max(1, Math.round((x1 - x0) * s)); c.height = Math.max(1, Math.round((z1 - z0) * s));
      drawMap(x, { floor: fl, scale: s, x0, z0, labels: false, player: false });

      for (const b of (boxesIn ? boxesIn(x0, z0, x1, z1, Z.y || 0) : [])) { const h = b[4] - (Z.y || 0);
        x.fillStyle = h < 0.5 ? '#e3cf9f' : h < 1.0 ? '#c29f68' : '#8d7658'; x.strokeStyle = '#5c4b36'; x.lineWidth = Math.max(1, S.dpr);
        x.fillRect((b[0] - x0) * s, (b[1] - z0) * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s); x.strokeRect((b[0] - x0) * s, (b[1] - z0) * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s); }
      cache.set(key, c); return c; }
    if (S.big) { const [x0, z0, x1, z1] = S.bb, s = S.sB * S.dpr; c.width = Math.round((x1 - x0) * s); c.height = Math.round((z1 - z0) * s);
      drawMap(x, { floor: fl, scale: s, x0, z0, labels: false, player: false }); labels(x, mapData(fl), s, x0, z0, 10 * S.dpr); }
    else { const s = SMALL / (2 * R) * S.dpr; c.width = Math.round((NB[2] - NB[0]) * s); c.height = Math.round((NB[3] - NB[1]) * s);
      drawMap(x, { floor: fl, scale: s, x0: NB[0], z0: NB[1], labels: false, player: false }); labels(x, mapData(fl), s, NB[0], NB[1], 10 * S.dpr); }
    cache.set(key, c); return c;
  }

  const TAU = Math.PI * 2;
  function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  function draw() {
    const t0 = performance.now(), d = S.dpr, W = cv.width, H = cv.height, fl = S.fl, st = layer(fl);
    let sc, ox, oz;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    if (S.big) { sc = S.sB * d; ox = S.bb[0]; oz = S.bb[1]; g.drawImage(st, 0, 0); }
    else {
      const zm = S.zoom, L0 = zm ? zm.rect : NB;
      sc = SMALL / (2 * (zm ? zm.r : R)) * d; ox = P.x - W / 2 / sc; oz = P.z - H / 2 / sc;
      const sx = (ox - L0[0]) * sc, sy = (oz - L0[1]) * sc, ix0 = Math.max(0, sx), iy0 = Math.max(0, sy), ix1 = Math.min(st.width, sx + W), iy1 = Math.min(st.height, sy + H);
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      if (ix1 > ix0 && iy1 > iy0) g.drawImage(st, ix0, iy0, ix1 - ix0, iy1 - iy0, ix0 - sx, iy0 - sy, ix1 - ix0, iy1 - iy0);
      g.font = `700 ${10 * d}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
      g.lineWidth = 3 * d; g.strokeStyle = 'rgba(255,255,255,.9)'; g.strokeText('북', W / 2, 3 * d); g.fillStyle = '#b3261e'; g.fillText('북', W / 2, 3 * d);
    }

    const on = S.ph % 2 === 0, e = 9 * d;
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `700 ${11 * d}px sans-serif`;
    const LU = [], fh = 13 * d, hit = (x, y, w) => LU.some(u => x < u[0] + u[2] && x + w > u[0] && Math.abs(y - u[1]) < fh);
    for (const m of (S.peers.length ? S.peers.concat(S.marks) : S.marks)) {
      let X = (m.x - ox) * sc, Y = (m.z - oz) * sc, out = false;
      if (!S.big && (X < e || X > W - e || Y < e || Y > H - e)) { out = true; const dx = X - W / 2, dy = Y - H / 2, k = Math.min((W / 2 - e) / Math.max(Math.abs(dx), 1e-6), (H / 2 - e) / Math.max(Math.abs(dy), 1e-6)); X = W / 2 + dx * k; Y = H / 2 + dy * k; }
      const other = m.floor && m.floor !== fl, col = m.color || '#e0503c', r = (m.r || (m.shape === 'star' ? 5 : 5.5)) * d * (out ? 0.8 : 1);
      g.globalAlpha = m.blink && !on ? 0.3 : 1;
      if (m.shape === 'star') star(g, X, Y, r * 1.25); else { g.beginPath(); g.arc(X, Y, r, 0, TAU); }
      if (other || m.shape === 'ring') { g.lineWidth = 2.5 * d; g.strokeStyle = col; g.stroke(); }
      else { g.fillStyle = col; g.fill(); g.lineWidth = 1.5 * d; g.strokeStyle = '#fff'; g.stroke(); }
      if (out) { const a = Math.atan2(Y - H / 2, X - W / 2); g.beginPath(); g.moveTo(X + Math.cos(a) * (r + 5 * d), Y + Math.sin(a) * (r + 5 * d));
        g.lineTo(X + Math.cos(a + 2.4) * (r + 1 * d), Y + Math.sin(a + 2.4) * (r + 1 * d)); g.lineTo(X + Math.cos(a - 2.4) * (r + 1 * d), Y + Math.sin(a - 2.4) * (r + 1 * d)); g.closePath(); g.fillStyle = col; g.fill(); }
      g.globalAlpha = 1;
      const lab = m.label ? m.label + (other ? ' (' + m.floor + '층)' : '') : '';
      if (lab) { const w = g.measureText(lab).width, R0 = X + r + 4 * d, L0 = X - r - 4 * d - w, cy = v => Math.min(H - 8 * d, Math.max(8 * d, v));
        const C9 = [[R0, Y], [L0, Y], [R0, Y - fh], [R0, Y + fh], [L0, Y - fh], [L0, Y + fh]].filter(c => c[0] >= 2 * d && c[0] + w <= W - 2 * d);
        const pick = C9.find(c => !hit(c[0], cy(c[1]), w)) || C9[0] || [R0 + w > W - 2 * d ? L0 : R0, Y]; let lx = pick[0]; const ly = cy(pick[1]); LU.push([lx, ly, w]);
        g.lineWidth = 3 * d; g.strokeStyle = 'rgba(255,255,255,.92)'; g.strokeText(lab, lx, ly); g.fillStyle = '#1d3557'; g.fillText(lab, lx, ly); }
    }

    const X = (P.x - ox) * sc, Y = (P.z - oz) * sc;
    g.translate(X, Y); g.rotate(-getYaw());
    g.beginPath(); g.moveTo(0, -9 * d); g.lineTo(6.5 * d, 7 * d); g.lineTo(0, 3.5 * d); g.lineTo(-6.5 * d, 7 * d); g.closePath();
    g.fillStyle = '#2f6fd0'; g.fill(); g.lineWidth = 2 * d; g.strokeStyle = '#fff'; g.stroke();
    g.setTransform(1, 0, 0, 1, 0, 0);
    S.drawN++; return performance.now() - t0;
  }

  function tick(dt) {
    if (!S.vis) return;
    S.t += dt; S.since += dt; S.accT += dt; S.accN++;
    const fl = P.y >= 3 ? 2 : 1, yaw = getYaw(), ph = S.marks.some(m => m.blink) ? Math.floor(S.t * 3.2) : 0;
    if (fl !== S.fl) { S.fl = fl; S.dirty = true; }
    if (ph !== S.ph) { S.ph = ph; S.dirty = true; }
    if (Math.abs(P.x - S.px) > 0.12 || Math.abs(P.z - S.pz) > 0.12 || Math.abs(yaw - S.yaw) > 0.03) S.dirty = true;
    if (S.dirty && S.since >= 1 / 30) { S.since = 0; S.dirty = false; S.px = P.x; S.pz = P.z; S.yaw = yaw; S.acc += draw(); }
    if (S.accT >= 2) { S.ms = S.acc / Math.max(1, S.accN); S.acc = S.accT = S.accN = 0; }
  }
  function show(o = {}) {
    if (o.marks) setMarks(o.marks);
    if (o.zoom !== undefined) zoom(o.zoom);
    if (o.big !== undefined && !!o.big !== S.big) S.big = !!o.big;
    if (!S.vis) { S.vis = true; box.style.display = ''; S.fl = P.y >= 3 ? 2 : 1; }
    size(); onLayout && onLayout(); S.since = 1; tick(0);
    return { remove: hide };
  }

  function zoom(z) { S.zoom = z && z.rect ? { r: Math.max(2, Math.min(40, z.r || 8)), rect: z.rect.slice(0, 4), y: z.y || 0, key: [z.r || 8, ...z.rect.slice(0, 4).map(v => (+v).toFixed(2)), z.y || 0].join(',') } : null; S.dirty = true; return !!S.zoom; }
  function hide() { S.zoom = null; if (!S.vis) return; S.vis = false; box.style.display = 'none'; S.big = false; dim.style.display = 'none'; box.classList.remove('mm-ov'); onLayout && onLayout(); }
  function setPeers(list) { const a = (list || []).filter(m => m && isFinite(m.x) && isFinite(m.z)); if (a.length || S.peers.length) { S.peers = a; S.dirty = true; } }
  function setMarks(list) { S.marks = (list || []).filter(m => m && isFinite(m.x) && isFinite(m.z)); S.dirty = true; }
  function toggle(v) { if (!S.vis) return false; S.big = v === undefined ? !S.big : !!v; size(); onLayout && onLayout(); S.since = 1; tick(0); return S.big; }
  box.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat && S.vis) toggle(); });
  addEventListener('resize', () => { cache.clear(); if (S.vis) { size(); onLayout && onLayout(); } });

  const rect = () => !S.vis ? null : thumb && !S.big ? thumb : S.big && box.classList.contains('mm-ov') ? (thumb || null) : { right: RIGHT, top: TOP, w: S.w + PAD * 2, h: S.h + PAD * 2 + CAPH, big: S.big };
  return { show, hide, setMarks, setPeers, toggle, tick, rect, zoom, el: box, canvas: cv,
    get visible() { return S.vis; }, get big() { return S.big; }, get zoomed() { return !!S.zoom; }, get marks() { return S.marks.slice(); }, get ms() { return S.ms; }, get draws() { return S.drawN; } };
}
