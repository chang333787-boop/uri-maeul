export const PBOX_V = 1;
const TOP = 56, BOT = 22, WMAX = 0.74, ZCAP = 1.9, ZMIN = 0.8, PCAP = 1.5;
const GAME_P = new Set(['table', 'janggu', 'bake', 'ent3']);
const CSS = `
.twn-play{position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:${TOP}px 16px ${BOT - 6}px;background:rgba(18,22,34,.36);font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji}
.twn-play .pb{box-sizing:border-box;position:relative;background:#fff8ea;border:4px solid #2b2420;border-radius:18px;padding:0 16px 14px;width:min(460px,92vw);box-shadow:0 7px 0 #2b2420,0 18px 34px rgba(0,0,0,.28);display:flex;flex-direction:column;gap:8px;color:#2b2420;animation:twnIn .2s ease-out both;overflow:auto;overscroll-behavior:contain}
.twn-play b{font-size:20px;font-weight:900}
.twn-play small{font-size:14px;color:#6f6257}
.twn-play .pb>b:first-child{display:block;position:sticky;top:0;z-index:4;flex:none;margin:0 -16px 0;padding:10px 64px 9px 16px;background:#3f8f4e;color:#fff;font-size:20px;line-height:1.3;border-bottom:4px solid #2b2420;border-radius:14px 14px 0 0;text-shadow:0 2px 0 rgba(0,0,0,.22);word-break:keep-all}
.twn-play .pb>b:first-child .twn-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:44px;height:44px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-radius:12px;box-shadow:0 3px 0 #2b2420;font:900 20px/1 system-ui,sans-serif;text-shadow:none;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.twn-play .pb>b:first-child .twn-x::before{content:'✕'}
.twn-play .pb>b:first-child .twn-x:active{transform:translateY(calc(-50% + 2px));box-shadow:0 1px 0 #2b2420}
.twn-play .pb>b:first-child .twn-x:focus-visible{outline:3px solid #f2c230;outline-offset:2px}
.twn-play:not(#pz0) .pb>small{font-size:15.5px;line-height:1.4;color:#5a4d42;font-weight:700}
.twn-play:not(#pz0) .pb>.mglad{font-size:15px}
.twn-play:not(#pz0) .msg{font-size:16px;font-weight:800;line-height:1.4}
.twn-play:not(#pz0) .msg .mgres{display:block;font-size:25px;font-weight:900;color:#2b6a38;line-height:1.25;margin-bottom:2px}
.twn-play .row{display:flex;gap:10px;justify-content:flex-end}
.twn-play button{font:inherit;font-weight:800;border:3px solid #2b2420;border-radius:12px;padding:9px 18px;min-height:48px;background:#3f8f4e;color:#fff;cursor:pointer;box-shadow:0 4px 0 #2b2420;transition:transform .07s,box-shadow .07s;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.twn-play button:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2420}
.twn-play button.sub{background:#f4e6c8;color:#2b2420;text-shadow:none}
.twn-play.pz-board:not(#pz0) :is(.rsit>span,.rt>em,.cbx>.obx,.cbx>.mbx,.fr9>b,.scn>.wxl,.sky>b,.spn>small,.zl>em,.zr>em,.tlab>span,.sp>.gst,.kc-pot>.nm,.kc-pot>.lb,.ht>.on,.ht>button,.rw>.lt,.rw>.pt,.kc-plate>em,.sel>small,button>small){font-size:15px}
.twn-play.pz-board:not(#pz0) .kc button{min-height:36px}
.twn-play.pz-board:not(#pz0) .kc .kc-pot button{min-width:40px}
body.small .twn-play.pz-board:not(#pz0) :is(.kc button,.gc){min-height:44px}
body.small .twn-play.pz-board:not(#pz0) .kc .kc-pot button{min-width:44px}
body.h-pbox:not(#pz0) #toast{z-index:48!important;top:calc(8px + env(safe-area-inset-top))!important;bottom:auto!important}
body.h-pbox:not(#pz0) :is(#tJoyHint,#tJump,#tAct,#tView,#tCrouch,.tbtn,.twn-mini,.twn-task,.twn-memo,.twn-comp,.twn-keys,.twn-tools,.twn-tuse,#hint,.chip:not(#toast):not(#hudBan)){visibility:hidden!important}
body.small .twn-play{padding:calc(50px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom))}
body.small .twn-play .pb{width:min(460px,calc(100vw - 16px));max-height:100%}
.twn-play .pb>.row:last-child{position:sticky;bottom:-14px;z-index:2;margin:0 -16px -14px;padding:8px 16px 10px;background:#fff8ea}
@media (orientation:landscape){body.small .twn-play{padding-top:calc(48px + env(safe-area-inset-top))}}
.twn-play.pz-world:not(#pz0){inset:auto;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);display:block;padding:0;background:none;z-index:30}
.twn-play.pz-world .pb{width:min(560px,calc(100vw - 24px));animation:none}
.twn-play.pz-world:not(#pz0) .pb>small{font-size:17px}
.twn-play.pz-world:not(#pz0) .msg{font-size:18px}
.twn-play.pz-world:not(#pz0) button{font-size:17px}
body.small .twn-play.pz-world:not(#pz0) .pb{gap:4px;padding:0 12px 8px;border-width:3px;border-radius:14px;max-width:calc(100vw - 24px)}
body.small .twn-play.pz-world:not(#pz0) .pb>b:first-child{margin:0 -12px;padding:6px 12px 5px;font-size:17px;border-radius:11px 11px 0 0;border-bottom-width:3px}
body.small .twn-play.pz-world:not(#pz0) .pb>small{font-size:14px}
body.small .twn-play.pz-world:not(#pz0) .msg{font-size:15px}
body.small .twn-play.pz-world:not(#pz0) .bar{height:22px}
body.small .twn-play.pz-world:not(#pz0) button{min-height:44px;padding:4px 14px}
body.small .twn-play.pz-world:not(#pz0) .pb>.row:last-child{position:static;margin:0;padding:0;background:none}
@media (orientation:landscape){body.small .twn-play.pz-world:not(#pz0) .pb{width:calc(100vw - 420px);min-width:300px}}
@media (orientation:portrait){body.small .twn-play.pz-world:not(#pz0){top:auto;bottom:calc(12px + env(safe-area-inset-bottom))}}
body.small.h-pwl:not(#pz0) :is(#tJoyHint,#tJump,#tAct,#tView,#tCrouch,.tbtn,.twn-mini,.twn-task,.twn-memo,.chip:not(#toast):not(#hudBan)){visibility:hidden!important}
.twn-wcard{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:22;box-sizing:border-box;max-width:min(880px,calc(100vw - 32px));background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-top:7px solid #3f8f4e;border-radius:14px;box-shadow:0 4px 0 #2b2420;padding:8px 24px 9px;font:900 23px/1.3 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;text-align:center;pointer-events:none;word-break:keep-all;display:none}
.twn-wcard.on{display:block}
body.h-wplay:not(#pz0) :is(#hudGoal,.twn-comp){visibility:hidden!important}
body.h-wplay:not(.small):not(#pz0) #toast{top:calc(var(--wcB,76px) + 8px)!important;bottom:auto!important}
body.small .twn-wcard{top:calc(6px + env(safe-area-inset-top));font-size:clamp(15px,4.4vh,18px);padding:4px 14px 5px;border-top-width:5px;max-width:calc(100vw - 340px)}
@media (orientation:portrait){body.small .twn-wcard{font-size:17px;max-width:calc(100vw - 140px)}}
.twn-p:is(.pz-game,[data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) .twn-x{width:44px;height:44px}
.twn-p.pz-game:not(#pz0) h3.pz-band{position:relative;margin:-14px -18px 12px;padding:11px 64px 10px 18px;background:#3f8f4e;color:#fff;font-size:20px;border-bottom:4px solid #2b2420;border-radius:14px 14px 0 0;text-shadow:0 2px 0 rgba(0,0,0,.22)}
.twn-p:is([data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) :is(.sm,.tb-msg,.tb-todo){font-size:16px}
.twn-p:is([data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) .row button{font-size:16.5px}
.twn-p:is([data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) button{min-height:44px}
`;

export function createPbox(o = {}) {
  let css = null, mo = null, tm = 0, card = null, cardT = '';
  const B = new Set(), P = new Set(), WL = new Set();
  const body = () => document.body, small = () => body().classList.contains('small');
  const en = () => !!(o.en && o.en());
  function addCss() { if (css) return; css = document.createElement('style'); css.id = 'twn-pbox-css'; css.textContent = CSS; document.head.appendChild(css); }

  function stopBtn(el) { return el.querySelector('.row .x, .row [data-a="x"], [data-a="x"], button.x'); }
  function addX(el) { const t = el.querySelector('.pb>b:first-child'); if (!t || t.querySelector('.twn-x') || !stopBtn(el)) return; const x = document.createElement('span'); x.className = 'twn-x'; x.setAttribute('role', 'button'); x.tabIndex = 0; x.setAttribute('aria-label', en() ? 'Close' : '닫기');
    const shut = e => { e.preventDefault(); e.stopPropagation(); const s = stopBtn(el); if (!s || !el.isConnected) return; s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); if (el.isConnected) s.click(); };
    x.addEventListener('pointerdown', e => e.stopPropagation()); x.addEventListener('click', shut); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') shut(e); }); t.appendChild(x); }

  function fitB(el, shrink) { const pb = el.querySelector('.pb'); if (!pb) return; if (small() || el.classList.contains('pz-world')) { if (pb.style.zoom) { pb.style.zoom = ''; pb.style.maxHeight = ''; } return; }
    const z0 = parseFloat(pb.style.zoom) || 0, w = pb.offsetWidth, h = Math.max(pb.offsetHeight, pb.scrollHeight); if (!w || !h) return;
    const vw = innerWidth, vh = innerHeight, ah = vh - TOP - BOT, aw = Math.min(vw - 40, vw * WMAX); let z = Math.max(ZMIN, Math.min(ZCAP, aw / w, ah / h)); z = Math.floor(z * 100) / 100;
    if (shrink && z0 && z >= z0 - 0.01) return; if (Math.abs(z - z0) > 0.004) pb.style.zoom = String(z); pb.style.maxHeight = Math.floor(ah / z) + 'px'; }

  function bandP(el) { if (el.querySelector('.twn-x')) return; const h = el.querySelector('.bx h3'), s = el.querySelector('[data-a="x"]'); if (!h || !s) return; h.classList.add('pz-band'); const x = document.createElement('span'); x.className = 'twn-x'; x.setAttribute('role', 'button'); x.tabIndex = 0; x.setAttribute('aria-label', en() ? 'Close' : '닫기');
    const shut = e => { e.preventDefault(); e.stopPropagation(); const b9 = el.querySelector('[data-a="x"]'); if (b9) b9.click(); }; x.addEventListener('click', shut); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') shut(e); }); h.appendChild(x); }
  function isGameP(el) { const k = el.dataset ? el.dataset.k : ''; if (el.querySelector('canvas')) return false; return GAME_P.has(k) || !!el.querySelector('.twn-addb,.jg-w'); }
  function fitP(el, shrink) { const bx = el.querySelector('.bx'); if (!bx) return; if (small()) { if (bx.style.zoom) { bx.style.zoom = ''; bx.style.removeProperty('max-width'); bx.style.removeProperty('max-height'); } return; }
    const z0 = parseFloat(bx.style.zoom) || 0, w = bx.offsetWidth, h = bx.scrollHeight + 8; if (!w || !h) return;
    const vw = innerWidth, vh = innerHeight; let z = Math.max(1, Math.min(PCAP, (vw * WMAX) / w, (vh * 0.9) / h)); z = Math.floor(z * 100) / 100;
    if (shrink && z0 && z >= z0 - 0.01) return; if (Math.abs(z - z0) > 0.004) bx.style.zoom = String(z); bx.style.setProperty('max-width', Math.floor(vw * 0.94 / z) + 'px', 'important'); bx.style.setProperty('max-height', Math.floor(vh * 0.9 / z) + 'px', 'important'); }
  const over = el => { const r = el.getBoundingClientRect(); return r.top < 2 || r.bottom > innerHeight - 2; };
  function tags() { const b = body(); const nb = [...B].some(e => e.isConnected); b.classList.toggle('h-pbox', nb); const nw = [...WL].some(e => e.isConnected); b.classList.toggle('h-wplay', !!cardT || nw); b.classList.toggle('h-pwl', nw); }
  function tick() { for (const el of B) { if (!el.isConnected) { B.delete(el); continue; } addX(el); const pb = el.querySelector('.pb'); if (pb && !el.dataset.pzDn && (over(pb) || (!pb.classList.contains('mg-end') && pb.scrollHeight > pb.clientHeight + 4))) fitB(el, true); }
    for (const el of P) { if (!el.isConnected) { P.delete(el); continue; } const bx = el.querySelector('.bx'); if (bx && over(bx)) fitP(el, true); }
    for (const el of WL) { if (!el.isConnected) WL.delete(el); else { addX(el); wplace(el); } }
    tags(); if (!B.size && !P.size && !WL.size && tm) { clearInterval(tm); tm = 0; } }
  const arm = () => { if (!tm) tm = setInterval(tick, 500); };
  function onBoard(el) { if (el.classList.contains('pz-world')) { WL.add(el); addX(el); wplace(el); tags(); arm(); return; }
    el.classList.add('pz-board'); B.add(el); addX(el); fitB(el, false); tags(); arm();
    el.addEventListener('pointerdown', () => { el.dataset.pzDn = '1'; }, true);
    el.addEventListener('click', e => { if (e.target === el) e.stopPropagation(); });
    requestAnimationFrame(() => { if (el.isConnected) fitB(el, false); }); }
  function onPanel(el) { if (!isGameP(el)) return; el.classList.add('pz-game'); P.add(el); bandP(el); fitP(el, false); arm(); requestAnimationFrame(() => { if (el.isConnected) fitP(el, false); }); }
  function onRz() { for (const el of B) if (el.isConnected) fitB(el, false); for (const el of P) if (el.isConnected) fitP(el, false); for (const el of WL) if (el.isConnected) wplace(el); if (cardT) cardB(); }

  function wplace(el) { const pb = el.querySelector('.pb'); if (!pb) return; const r = pb.getBoundingClientRect(); body().style.setProperty('--wcB', Math.round(r.bottom) + 'px'); }
  function cardB() { if (!card) return; const r = card.getBoundingClientRect(); if (r.height) body().style.setProperty('--wcB', Math.round(r.bottom) + 'px'); }

  function wcard(t) { t = t ? String(t) : ''; if (t === cardT) return; cardT = t; if (t && !card) { addCss(); card = document.createElement('div'); card.className = 'twn-wcard'; card.setAttribute('role', 'status'); document.body.appendChild(card); }
    if (card) { if (card.textContent !== t) card.textContent = t; card.classList.toggle('on', !!t); } tags(); if (t) cardB(); }
  const clrDn = () => { for (const el of B) delete el.dataset.pzDn; };
  function watch() { addCss(); if (mo) return; mo = new MutationObserver(L => { for (const m of L) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.classList.contains('twn-play')) onBoard(n); else if (n.classList.contains('twn-p')) onPanel(n); } for (const m of L) if (m.removedNodes.length) { tags(); break; } });
    mo.observe(document.body, { childList: true }); addEventListener('resize', onRz); addEventListener('pointerup', clrDn, true); addEventListener('pointercancel', clrDn, true); for (const n of document.querySelectorAll('body>.twn-play')) onBoard(n); }
  function dispose() { if (mo) { mo.disconnect(); mo = null; } removeEventListener('resize', onRz); removeEventListener('pointerup', clrDn, true); removeEventListener('pointercancel', clrDn, true); if (tm) { clearInterval(tm); tm = 0; } if (card) { card.remove(); card = null; } cardT = ''; B.clear(); P.clear(); WL.clear(); const b = body(); if (b) { b.classList.remove('h-pbox', 'h-wplay', 'h-pwl'); b.style.removeProperty('--wcB'); } if (css) { css.remove(); css = null; } }
  return { watch, wcard, dispose, busy: () => { for (const el of B) if (el.isConnected) return true; return false; }, info: () => ({ boards: [...B].filter(e => e.isConnected).map(e => { const pb = e.querySelector('.pb'); return { z: pb ? parseFloat(pb.style.zoom) || 1 : 0 }; }), panels: [...P].filter(e => e.isConnected).map(e => { const bx = e.querySelector('.bx'); return { k: e.dataset.k, z: bx ? parseFloat(bx.style.zoom) || 1 : 0 }; }), card: cardT, world: [...WL].filter(e => e.isConnected).length }) };
}
