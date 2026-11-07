export const GO_V = 1;
const CSS = '.twn-go{position:fixed;inset:0;z-index:52;background:rgba(18,22,34,.2);font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;-webkit-tap-highlight-color:transparent;touch-action:manipulation}'
  + '.twn-go .gx{position:absolute;box-sizing:border-box;width:min(340px,calc(100vw - 24px));background:#fff8ea;color:#2b2420;border:4px solid #2b2420;border-radius:16px;box-shadow:0 6px 0 #2b2420,0 18px 36px rgba(0,0,0,.28);overflow:hidden}'
  + '.twn-go .gh{display:flex;align-items:center;gap:10px;background:#3b6fb6;color:#fff;border-bottom:4px solid #2b2420;padding:9px 14px 8px}.twn-go .gh .ic{flex:none;font-size:24px;line-height:1}'
  + '.twn-go .gh .nm{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;word-break:keep-all}.twn-go .gh b{font-size:18px;font-weight:900;line-height:1.25;text-shadow:0 2px 0 rgba(0,0,0,.22)}.twn-go .gh small{font-size:13px;font-weight:700;color:rgba(255,255,255,.9);line-height:1.3}'
  + '.twn-go .gb{display:grid;gap:9px;padding:11px 14px 13px}.twn-go .gs{font-size:14px;font-weight:800;color:#56606b;word-break:keep-all}'
  + '.twn-go button{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;width:100%;box-sizing:border-box;min-height:50px;text-align:left;font:inherit;font-weight:900;font-size:17px;line-height:1.2;border:3px solid #2b2420;border-radius:12px;box-shadow:0 4px 0 #2b2420;padding:6px 14px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none}'
  + '.twn-go button small{font-size:13px;font-weight:700;opacity:.92}.twn-go button:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2420}.twn-go button:focus-visible{outline:3px solid #f2c230;outline-offset:2px}'
  + '.twn-go .g1{background:#3f8f4e;color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.25)}.twn-go .g1:hover{background:#4ba35b}.twn-go .g2{background:#f4e6c8;color:#2b2420}.twn-go .g2:hover{background:#fbefd8}'
  + '.twn-go .g2.off{background:#e3dacb;color:#857a6e;border-color:#a59a8d;box-shadow:0 2px 0 #a59a8d;cursor:default}.twn-go .g2.off:active{transform:none}'
  + '.twn-go .gw{font-size:14px;font-weight:800;color:#8a4b1f;line-height:1.4;word-break:keep-all;margin-top:-3px;padding:0 2px}.twn-go .gw.hi{color:#c0391b;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}'
  + '.twn-go .g3{min-height:44px;align-items:center;font-size:15px;background:#fffdf7;color:#2b2420;border-width:2px;box-shadow:0 3px 0 #2b2420}'
  + '.twn-go .gx.up{left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top))}.twn-go .gx.dn{left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom))}'
  + '.twn-go .gx.lf{left:calc(12px + env(safe-area-inset-left));top:50%;transform:translateY(-50%)}.twn-go .gx.rt{right:calc(12px + env(safe-area-inset-right));top:50%;transform:translateY(-50%)}'
  + '@media (max-height:500px){.twn-go .gh{padding:6px 12px 5px}.twn-go .gh b{font-size:16px}.twn-go .gb{grid-template-columns:1fr 1fr;gap:7px;padding:8px 12px 10px}.twn-go .gs,.twn-go .gw,.twn-go .g3{grid-column:1/-1}.twn-go .g2{order:1}.twn-go .g1{order:2}.twn-go .gw{order:3}.twn-go .g3{order:4}.twn-go button{min-height:48px;font-size:16px;padding:5px 10px}.twn-go .g3{min-height:44px}}';

export function createGo(A) {
  const en = () => A.en(), L = (ko, e) => (en() ? e : ko), esc = t => A.esc(t);
  let el = null, css = null, cur = null, t0 = 0, at0 = null, back = null, downBack = false, dead = false;
  const DBG = { open: 0, guide: 0, jump: 0, no: 0, close: 0, last: null, log: [] };
  const log = (k, x) => { DBG.log.push([k, x]); if (DBG.log.length > 30) DBG.log.shift(); };
  function ensureCss() { if (css || document.getElementById('twn-go-css')) return; css = document.createElement('style'); css.id = 'twn-go-css'; css.textContent = CSS; document.head.appendChild(css); }
  const btns = () => (el ? [...el.querySelectorAll('button[data-go]')] : []);
  function html(t) { const free = t.left < 0, no = t.no || '';
    const gl = t.chal ? ['🗺 ' + L('지도 펴기', 'Open the map'), L('빨간 선 없이 지도를 보고 찾아가요', 'Find it with the map, no red line')] : ['🧭 ' + L('길 안내', 'Show the way'), L('빨간 선을 따라 걸어가요', 'Walk along the red line')];
    const jl = free ? L('횟수 제한 없음', 'No daily limit') : L('오늘 ' + t.left + '번 남음', t.left + ' left today');
    return '<div class="gx" role="dialog" aria-modal="true" aria-label="' + esc(t.name) + '"><div class="gh"><span class="ic">' + esc(t.icon || '📍') + '</span><span class="nm"><b>' + esc(t.name) + '</b>' + (t.what ? '<small>' + esc(t.what) + '</small>' : '') + '</span></div>'
      + '<div class="gb">' + (t.sub ? '<div class="gs">' + esc(t.sub) + '</div>' : '')
      + '<button type="button" class="g1" data-go="g"><span>' + gl[0] + '</span><small>' + gl[1] + '</small></button>'
      + '<button type="button" class="g2' + (no ? ' off' : '') + '" data-go="j"' + (no ? ' aria-disabled="true"' : '') + '><span>🚌 ' + L('바로 가기', 'Quick travel') + '</span><small>' + esc(jl) + '</small></button>'
      + (no ? '<div class="gw" role="note">' + esc(no) + '</div>' : '')
      + '<button type="button" class="g3" data-go="x">' + L('닫기', 'Close') + '</button></div></div>'; }

  function place(pt) { const gx = el.querySelector('.gx'), W = innerWidth, H = innerHeight, w = gx.offsetWidth, h = gx.offsetHeight, m = 12; gx.classList.remove('up', 'dn', 'lf', 'rt'); gx.style.left = gx.style.top = gx.style.bottom = '';
    if (pt && (pt.touch || A.touch())) { const hit = () => { const r = gx.getBoundingClientRect(); return pt.x >= r.left - 6 && pt.x <= r.right + 6 && pt.y >= r.top - 6 && pt.y <= r.bottom + 6; };
      for (const c of pt.y > H * 0.45 ? ['up', 'dn'] : ['dn', 'up']) { gx.classList.remove('up', 'dn'); gx.classList.add(c); if (!hit()) return; }
      gx.classList.remove('up', 'dn'); gx.classList.add(pt.x < W / 2 ? 'rt' : 'lf'); return; }
    if (!pt) { gx.style.left = Math.max(m, (W - w) / 2) + 'px'; gx.style.top = Math.max(m, (H - h) / 2) + 'px'; return; }
    let x = pt.x + 16, y = pt.y + 14; if (x + w > W - m) x = pt.x - w - 16; if (x < m) x = Math.max(m, Math.min(W - w - m, pt.x - w / 2)); if (y + h > H - m) y = pt.y - h - 14; if (y < m) y = Math.max(m, H - h - m);
    x = Math.max(m, Math.min(W - w - m, x)); y = Math.max(m, Math.min(H - h - m, y));
    gx.style.left = Math.round(x) + 'px'; gx.style.top = Math.round(y) + 'px'; }
  function open(t, pt) { if (dead || !t) return false; close('re'); ensureCss(); cur = t; t0 = performance.now(); at0 = pt && Number.isFinite(pt.x) ? { x: pt.x, y: pt.y } : null; back = document.activeElement; downBack = false; DBG.open++; DBG.last = { kind: t.kind, name: t.name, no: t.no || '', left: t.left }; log('open', t.kind + ' ' + t.name);
    el = document.createElement('div'); el.className = 'twn-go ttl-keep'; el.innerHTML = html(t); document.body.appendChild(el); place(pt);
    for (const k of ['pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'wheel', 'contextmenu']) el.addEventListener(k, e => e.stopPropagation(), k === 'wheel' || k.startsWith('touch') ? { passive: true } : false);
    el.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target !== el) return; downBack = true; if (e.pointerType === 'mouse' && at0 && performance.now() - t0 < 450 && Math.hypot(e.clientX - at0.x, e.clientY - at0.y) < 28) { e.preventDefault(); downBack = false; act('g', 'dbl'); } });
    el.addEventListener('click', e => { e.stopPropagation(); if (e.target === el) { if (downBack) close('back'); downBack = false; return; } const b = e.target.closest && e.target.closest('button[data-go]'); if (b) act(b.dataset.go, 'tap'); });
    const g1 = el.querySelector('.g1'); try { g1.focus({ preventScroll: true }); } catch (e9) { g1.focus(); }
    return true; }
  function close(why) { if (!el) return false; const b9 = back; el.remove(); el = null; cur = null; back = null; if (why !== 're') { DBG.close++; log('close', why || ''); } if ((why === 'x' || why === 'esc' || why === 'back') && b9 && b9.isConnected && typeof b9.focus === 'function') { try { b9.focus({ preventScroll: true }); } catch (e9) {   } } return true; }
  function act(k, how) { if (!cur) return; const t = cur;
    if (k === 'x') { close('x'); return; }
    if (k === 'j' && t.no) { DBG.no++; log('no', t.no); const w = el && el.querySelector('.gw'); if (w) { w.classList.remove('hi'); void w.offsetWidth; w.classList.add('hi'); } if (A.sfx) A.sfx('tick'); const g1 = el && el.querySelector('.g1'); if (g1) { try { g1.focus({ preventScroll: true }); } catch (e9) { g1.focus(); } } return; }
    close('pick'); if (k === 'g') { DBG.guide++; log('guide', how || ''); t.guide(); } else if (k === 'j') { DBG.jump++; log('jump', how || ''); t.jump(); } }

  function key(e) { if (!el) return false; const k = e.code; e.stopImmediatePropagation(); if (e.type !== 'keydown') return true; if (e.repeat) { e.preventDefault(); return true; }
    if (k === 'Escape') { e.preventDefault(); close('esc'); return true; }
    if (k === 'Enter' || k === 'NumpadEnter') { e.preventDefault(); const f = document.activeElement, g = f && el.contains(f) && f.dataset && f.dataset.go; act(g || 'g', 'key'); return true; }
    if (k === 'Digit1' || k === 'Numpad1') { e.preventDefault(); act('g', 'key'); return true; } if (k === 'Digit2' || k === 'Numpad2') { e.preventDefault(); act('j', 'key'); return true; }
    if (k === 'Tab' || k === 'ArrowDown' || k === 'ArrowUp' || k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); const B = btns(), i = B.indexOf(document.activeElement), d = (k === 'ArrowUp' || k === 'ArrowLeft' || (k === 'Tab' && e.shiftKey)) ? -1 : 1, n = B[((i < 0 ? 0 : i + d) + B.length) % B.length]; if (n) n.focus(); return true; }
    if (k === 'Space') e.preventDefault(); return true; }
  function dispose() { dead = true; close('dispose'); if (css) css.remove(); css = null; }
  const box = s => { const e9 = el && el.querySelector(s); if (!e9) return null; const r = e9.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const api = { on: () => !!el, info: () => (el ? { kind: cur && cur.kind, name: cur && cur.name, what: (cur && cur.what) || '', sub: (cur && cur.sub) || '', no: (cur && cur.no) || '', left: cur ? cur.left : null, off: !!el.querySelector('.g2.off'), text: el.innerText.replace(/\s+/g, ' ').trim(), focus: (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.go) || '', card: box('.gx'), g: box('.g1'), j: box('.g2'), x: box('.g3') } : null),
    pick: k => { if (!el) return false; act(k, 'api'); return true; }, close: () => close('x'), dbg: () => ({ ...DBG, log: DBG.log.slice() }) };
  return { open, close, key, on: () => !!el, dispose, api };
}
