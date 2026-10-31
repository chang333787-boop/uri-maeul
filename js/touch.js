export function touchPrimary() {
  try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches; } catch (e) { return false; }
}
export function createTouch(ctx) {
  const { canvas, look, act, view } = ctx;
  const T = { on: false, mx: 0, my: 0, m: 0, jump: false, jumpT: 0, joyId: -1, lookId: -1, near: false, taps: 0, crouch: false };
  const JR = 62;
  if (!document.getElementById('touch-css')) {
    const css = document.createElement('style'); css.id = 'touch-css';
    css.textContent = [
      '#scene{touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}',
      'html,body{overscroll-behavior:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}',
      'body.touch{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
      '.tch{display:none}',
      'body.touch .tch{display:flex}',

      '.tbtn{position:fixed;z-index:22;align-items:center;justify-content:center;flex-direction:column;border-radius:50%;background:rgba(29,53,87,.55);color:#fff;border:3px solid rgba(255,255,255,.55);'
        + 'font-family:sans-serif;font-weight:700;touch-action:none;box-shadow:0 3px 0 rgba(0,0,0,.18);transition:transform .08s}',
      '.tbtn i{font-style:normal;line-height:1}.tbtn span{font-size:12px;margin-top:2px}',
      '.tbtn.dn{transform:scale(.92);background:rgba(29,53,87,.8)}',
      '#tJump{right:calc(18px + env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));width:78px;height:78px;font-size:28px}',
      '#tAct{right:calc(106px + env(safe-area-inset-right));bottom:calc(30px + env(safe-area-inset-bottom));width:66px;height:66px;font-size:24px}',
      '#tAct.hot{background:#ffc828;color:#1d3557;border-color:#fff;box-shadow:0 0 0 4px rgba(255,200,40,.45),0 3px 0 rgba(0,0,0,.18);animation:tPulse 1s ease-in-out infinite}',
      '@keyframes tPulse{50%{transform:scale(1.07)}}',
      '#tView{right:calc(186px + env(safe-area-inset-right));bottom:calc(34px + env(safe-area-inset-bottom));width:56px;height:56px;font-size:20px}',

      '#tCrouch{right:calc(254px + env(safe-area-inset-right));bottom:calc(30px + env(safe-area-inset-bottom));width:62px;height:62px;font-size:22px}',
      '#tCrouch.on{background:rgba(255,200,40,.85);color:#1d3557;border-color:#fff}',

      '#tJoy{position:fixed;left:0;top:0;z-index:21;width:' + JR * 2 + 'px;height:' + JR * 2 + 'px;margin:-' + JR + 'px 0 0 -' + JR + 'px;border-radius:50%;background:rgba(29,53,87,.28);border:3px solid rgba(255,255,255,.5);pointer-events:none;visibility:hidden;align-items:center;justify-content:center}',
      '#tJoy b{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 2px 0 rgba(0,0,0,.2)}',
      '#tJoy.run{border-color:#ffd23c}',

      '#tJoyHint{position:fixed;left:calc(34px + env(safe-area-inset-left));bottom:calc(34px + env(safe-area-inset-bottom));z-index:19;width:' + JR * 2 + 'px;height:' + JR * 2 + 'px;border-radius:50%;border:3px dashed rgba(255,255,255,.55);'
        + 'pointer-events:none;align-items:center;justify-content:center;color:rgba(255,255,255,.9);font:700 13px sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.5)}',

      '#tRot{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;pointer-events:none;background:rgba(29,53,87,.85);color:#fff;padding:14px 22px;border-radius:14px;font:700 18px sans-serif;text-align:center;line-height:1.5;flex-direction:column;align-items:center;white-space:nowrap}',
      '@media (orientation: landscape){body.touch #tRot{display:none}}',

      'body.touch #help,body.touch #fps{display:none}',
      'body.touch #timeChip,body.touch #gpick{top:calc(50px + env(safe-area-inset-top));bottom:auto!important;min-height:40px;box-sizing:border-box;display:flex;align-items:center;font-size:15px!important;padding:6px 14px!important}',
      'body.touch #timeChip{left:calc(10px + env(safe-area-inset-left));right:auto!important}',
      'body.touch #gpick{left:calc(104px + env(safe-area-inset-left));right:auto!important}',
      'body.touch #gpick-panel{left:10px!important;right:auto!important;top:98px!important;bottom:auto!important;max-height:calc(100vh - 110px);overflow:auto}',
      'body.touch #toast{top:calc(98px + env(safe-area-inset-top))!important}',
      'body.touch #hint{bottom:calc(112px + env(safe-area-inset-bottom))!important;font-size:16px!important;padding:10px 18px!important}',
    ].join('\n');
    document.head.appendChild(css);
  }
  const mk = (id, cls, html) => { const d = document.createElement('div'); d.id = id; d.className = 'tch ' + cls; d.innerHTML = html; document.body.appendChild(d); return d; };
  const joy = mk('tJoy', '', '<b></b>'), knob = joy.firstChild;
  const joyHint = mk('tJoyHint', '', '이동');
  const bJump = mk('tJump', 'tbtn', '<i>⤴</i><span>점프</span>');
  const bAct = mk('tAct', 'tbtn', '<i>✋</i><span>행동</span>');
  const bView = mk('tView', 'tbtn', '<i>👁</i>');
  const bCrouch = mk('tCrouch', 'tbtn', '<i>⬇</i><span>웅크리기</span>'); bCrouch.style.display = 'none';
  const rot = mk('tRot', '', '<div>📱↻ 가로로 돌려 주세요</div><span style="font-size:14px;font-weight:400">가로 화면이 더 넓게 보여요</span>');
  if (!window.SM_PROMO) { let rotT = 0; const rotShow = () => { rot.style.visibility = ''; clearTimeout(rotT); rotT = setTimeout(() => { rot.style.visibility = 'hidden'; }, 5000); }; rotShow(); let wasP = innerHeight > innerWidth; addEventListener('resize', () => { const pt = innerHeight > innerWidth; if (pt && !wasP) rotShow(); wasP = pt; }); }

  const fit = () => { document.body.classList.toggle('small', T.on && Math.min(innerWidth, innerHeight) <= 500); };
  addEventListener('resize', fit);
  let gOnce = false;
  function enable() {
    if (T.on) return; T.on = true; document.body.classList.add('touch'); fit();

    if (!gOnce) { gOnce = true; document.addEventListener('gesturestart', e => { if (T.on) e.preventDefault(); }, { passive: false });
      document.addEventListener('dblclick', e => { if (T.on) e.preventDefault(); }, { passive: false }); }
    ctx.onMode && ctx.onMode(true);
  }

  function reset() {
    joyEnd(); T.lookId = -1; pinchId = -1; T.jump = false; T.jumpT = 0;
    bJump.classList.remove('dn'); bAct.classList.remove('dn'); bView.classList.remove('dn'); bCrouch.classList.remove('dn');
  }

  function disable() {
    if (!T.on || touchPrimary()) return; reset(); T.on = false; document.body.classList.remove('touch'); fit(); joyHint.style.display = '';
    ctx.onMode && ctx.onMode(false);
  }

  let jx0 = 0, jy0 = 0, lx = 0, ly = 0, pinchId = -1, px9 = 0, py9 = 0, pd0 = 0;
  function joyAt(x, y) {
    jx0 = x; jy0 = y;
    joy.style.transform = 'translate(' + jx0 + 'px,' + jy0 + 'px)'; knob.style.transform = ''; joy.style.visibility = 'visible'; joyHint.style.display = 'none';
  }
  function joyMove(x, y) {
    let dx = x - jx0, dy = y - jy0; const d = Math.hypot(dx, dy);
    if (d > JR) { dx *= JR / d; dy *= JR / d; }
    const m = Math.min(1, d / JR);
    T.m = m < 0.15 ? 0 : m; T.mx = T.m ? dx / JR : 0; T.my = T.m ? -dy / JR : 0;
    knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    joy.classList.toggle('run', m >= 0.92);
  }
  function joyEnd() { T.joyId = -1; T.m = T.mx = T.my = 0; joy.style.visibility = 'hidden'; joy.classList.remove('run'); }
  const TAP = { x: 0, y: 0, t: 0, m: 0 };
  function onStart(e) {
    enable(); if (e.cancelable) e.preventDefault();

    if (T.joyId >= 0 || T.lookId >= 0) { let jOk = false, lOk = false;
      for (let i = 0; i < e.touches.length; i++) { const id = e.touches[i].identifier; if (id === T.joyId) jOk = true; if (id === T.lookId) lOk = true; }
      if (T.joyId >= 0 && !jOk) joyEnd(); if (!lOk) { T.lookId = -1; pinchId = -1; } }
    for (const t of e.changedTouches) {
      if (T.joyId < 0 && t.clientX < innerWidth * 0.45 && t.clientY > innerHeight * 0.3) { T.joyId = t.identifier; joyAt(t.clientX, t.clientY); joyMove(t.clientX, t.clientY); }
      else if (T.lookId < 0) { T.lookId = t.identifier; lx = t.clientX; ly = t.clientY; TAP.x = lx; TAP.y = ly; TAP.t = performance.now(); TAP.m = 0; }
      else if (pinchId < 0 && ctx.zoom && !(t.clientX < innerWidth * 0.45 && t.clientY > innerHeight * 0.3)) { pinchId = t.identifier; px9 = t.clientX; py9 = t.clientY; pd0 = Math.hypot(px9 - lx, py9 - ly); TAP.m = 99; }
    }
  }
  function onMove(e) {
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === T.joyId) joyMove(t.clientX, t.clientY);
      else if (t.identifier === T.lookId) { if (pinchId < 0) { TAP.m += Math.abs(t.clientX - lx) + Math.abs(t.clientY - ly); look(t.clientX - lx, t.clientY - ly); } lx = t.clientX; ly = t.clientY; }
      else if (t.identifier === pinchId) { px9 = t.clientX; py9 = t.clientY; }
    }
    if (pinchId >= 0) { const d = Math.hypot(px9 - lx, py9 - ly); if (pd0 > 20 && d > 20 && Math.abs(d - pd0) > 1) { ctx.zoom(pd0 / d); pd0 = d; } }
  }
  function onEnd(e) {
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) { if (t.identifier === pinchId) { pinchId = -1; continue; } if (t.identifier === T.joyId) joyEnd(); else if (t.identifier === T.lookId) { T.lookId = -1; pinchId = -1; if (e.type === 'touchend' && TAP.m < 10 && performance.now() - TAP.t < 400) dispatchEvent(new CustomEvent('sm-click', { detail: { x: t.clientX, y: t.clientY, touch: true } })); } }
  }
  const PF = { passive: false };
  canvas.addEventListener('touchstart', onStart, PF); canvas.addEventListener('touchmove', onMove, PF);
  canvas.addEventListener('touchend', onEnd, PF); canvas.addEventListener('touchcancel', onEnd, PF);
  canvas.addEventListener('contextmenu', e => { if (T.on) e.preventDefault(); });

  addEventListener('touchstart', enable, { passive: true, capture: true });
  addEventListener('blur', () => reset());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') reset(); });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') disable(); }, true);
  addEventListener('keydown', e => { if (!e.repeat) disable(); }, true);
  if (touchPrimary()) setTimeout(enable);

  function btn(el, down, up) {
    el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('dn'); down(); }, PF);
    const u = e => { e.preventDefault(); el.classList.remove('dn'); up && up(); };
    el.addEventListener('touchend', u, PF); el.addEventListener('touchcancel', u, PF);
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  btn(bJump, () => { T.jump = true; T.jumpT = 0.25; }, () => { T.jump = false; });
  btn(bAct, () => { T.taps++; act(); });
  btn(bView, () => view());
  btn(bCrouch, () => { T.crouch = !T.crouch; bCrouch.classList.toggle('on', T.crouch); });

  return Object.assign(T, {
    enable, disable, reset,

    setCrouchBtn(on) { bCrouch.style.display = on ? '' : 'none'; if (!on) { T.crouch = false; bCrouch.classList.remove('on'); } },
    setCrouchOn(on) { T.crouch = !!on; bCrouch.classList.toggle('on', T.crouch); },
    setNear(h) { const on = !!h; if (on === T.near) return; T.near = on; bAct.classList.toggle('hot', on); },
    els: { joy, bJump, bAct, bView, bCrouch },
  });
}
