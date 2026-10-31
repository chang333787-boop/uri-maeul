export function createGamePicker(ctx) {
  const { load, stop, current } = ctx;
  if (!document.getElementById('gpick-css')) {
    const css = document.createElement('style'); css.id = 'gpick-css';
    css.textContent = '.gpick-b{display:block;width:100%;min-height:50px;margin:8px 0 0;padding:8px 12px;border:0;border-radius:8px;background:#f4f6fa;color:#1d3557;text-align:left;cursor:pointer;font-family:inherit;line-height:1.35}'
      + '.gpick-b:hover,.gpick-b:focus-visible{background:#fff1bf;outline:none}.gpick-b b{display:block;font-size:15px}.gpick-b span{font-size:12px;color:#4a5a70}'
      + '.gpick-x{position:absolute;right:6px;top:4px;min-width:34px;min-height:34px;border:0;background:none;color:#fff;font-size:18px;cursor:pointer;line-height:1}';
    document.head.appendChild(css);
  }
  const chip = document.createElement('div');
  chip.className = 'chip'; chip.id = 'gpick';
  chip.style.cssText = 'right:10px;bottom:48px;cursor:pointer;user-select:none;font-size:14px;padding:8px 14px';
    document.body.appendChild(chip);
  chip.innerHTML = '<span class="ico">🎮</span><span class="lbl"> 놀이</span>';
  let panel = null, cur = null, seq = 0;
  const leave = fn => (window.SM_MP && window.SM_MP.confirmLeave ? window.SM_MP.confirmLeave(fn) : fn());

  function close() { if (!panel) return; panel.remove(); panel = null; removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onDown, true); }
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const onDown = e => { if (panel && !panel.contains(e.target) && !chip.contains(e.target)) close(); };
  async function open() {
    close(); document.exitPointerLock?.();
    const my = ++seq;
    panel = document.createElement('div'); panel.className = 'chip'; panel.id = 'gpick-panel';
    panel.style.cssText = 'right:10px;bottom:92px;width:270px;max-height:calc(100vh - 140px);overflow:auto;padding:12px 14px 14px;z-index:30;font-size:14px;border-radius:12px;background:rgba(29,53,87,.92)';
    const h = document.createElement('div'); h.textContent = '🎮 놀이 고르기'; h.style.cssText = 'font-weight:700;font-size:15px;padding-right:30px';
    const x = document.createElement('button'); x.className = 'gpick-x'; x.textContent = '✕'; x.title = '닫기'; x.addEventListener('click', e => { e.stopPropagation(); close(); });
    const list = document.createElement('div'); list.textContent = '불러오는 중…'; list.style.cssText = 'margin-top:4px;font-size:13px';
    panel.append(h, x, list); document.body.appendChild(panel);
    addEventListener('keydown', onKey, true); addEventListener('pointerdown', onDown, true);
    let games = null, folders = null;
    try { const M = await import(new URL('../games/registry.js?t=' + Date.now(), import.meta.url)); games = M.GAMES; folders = M.FOLDERS || null; } catch (e) { console.error('[놀이] 목록을 못 불러옴', e); }
    if (my !== seq || !panel) return;
    const ids = games ? Object.keys(games).filter(id => !games[id].dev && !games[id].room && !games[id].link && !(games[id].promo && !window.SM_PROMO) && (window.SM_LESSON ? games[id].lesson === window.SM_LESSON : !games[id].lesson)) : [];
    list.textContent = ids.length ? '' : (games ? '아직 놀이가 없어요' : '놀이 목록을 못 불러왔어요');
    if (window.SM_MP && !window.SM_LESSON) {
      const M = window.SM_MP, R = M.info && M.info(), LD = !!(M.lead && M.lead()), g9 = M.roomGame && M.roomGame(), c9 = current(), inIt = !!(c9 && g9 && c9.id === g9);
      const btn = (t, s9, bg, fn) => { const b = document.createElement('button'); b.className = 'gpick-b'; if (bg) b.style.background = bg; const t9 = document.createElement('b'); t9.textContent = t; const s0 = document.createElement('span'); s0.textContent = s9; b.append(t9, s0); b.addEventListener('click', e => { e.stopPropagation(); close(); fn(); }); list.appendChild(b); };
      if (R && g9 && !LD && !inIt && M.joinGame && M.roomName) btn('▶ ' + M.roomName() + ' 같이 하기', '친구들이 지금 하고 있어요', '#ffd23c', () => M.joinGame());
      else if (R) { const d9 = document.createElement('div'); d9.textContent = '👥 「' + R.n + '」 방 — ' + (inIt ? '지금 방 놀이를 같이 하고 있어요' : LD ? '🏠 대기실(👥 칩)에서 놀이를 고르고 ▶ 시작' : '방장이 🏠 대기실에서 ▶ 시작하면 다 같이 들어가요'); d9.style.cssText = 'margin:6px 0 2px;font-size:12px;opacity:.9'; list.appendChild(d9); }
      else btn('👥 친구와 하려면 — 방 들어가기', '친구·선생님 방에 번호 4자리로 들어가거나 🏠 내 방 만들기', '', () => M.open());
    }
    const sec = t => { const d = document.createElement('div'); d.textContent = t; d.style.cssText = 'margin-top:10px;font-size:12px;font-weight:800;opacity:.85'; list.appendChild(d); };
    const FL = !window.SM_LESSON && folders && folders.length ? folders : null;
    const tog = ids.filter(id => games[id].mp === 'together'), split = !FL && tog.length && tog.length < ids.length;
    const ord = FL ? FL.flatMap(f => ids.filter(id => (games[id].folder || 'look') === f.k)) : split ? ids.filter(id => games[id].mp !== 'together').concat(tog) : ids;
    if (split) sec('🙋 혼자 하기');
    let fPrev = null;
    for (const id of ord) {
      if (FL) { const f = games[id].folder || 'look'; if (f !== fPrev) { fPrev = f; const F9 = FL.find(q => q.k === f); sec((F9 ? F9.icon + ' ' + F9.title : f)); } }
      if (split && id === tog[0]) sec('👥 친구와 함께' + (window.SM_MP ? (window.SM_MP.room() ? ' — 방에 있어요' : ' — 먼저 왼쪽 위 👥 함께하기로 방에') : ''));
      const b = document.createElement('button'); b.className = 'gpick-b'; b.dataset.game = id;
      const t = document.createElement('b'); t.textContent = (games[id].mp === 'together' ? '👥 ' : '') + (games[id].title || id); b.appendChild(t);
      if (games[id].short || games[id].desc) { const s = document.createElement('span'); s.textContent = games[id].short || games[id].desc; b.appendChild(s); b.title = games[id].desc || ''; }
      b.addEventListener('click', e => { e.stopPropagation(); close(); leave(() => { if (games[id].needRoom && window.SM_MP && !window.SM_MP.room()) { window.SM_MP.open(); return; } load(id); sync(); }); });
      list.appendChild(b);
    }
  }
  chip.addEventListener('click', e => { e.stopPropagation(); if (current()) { leave(() => { stop(); sync(); }); return; } if (panel) close(); else open(); });

  function sync() { const c = current(), id = c ? c.id : null; if (id === cur) return; cur = id; chip.innerHTML = id ? '<span class="ico">⏹</span><span class="lbl"> 그만하기</span>' : '<span class="ico">🎮</span><span class="lbl"> 놀이</span>';     chip.title = id ? '지금 놀이를 그만해요' : '놀이를 골라요'; if (id) close(); }
  sync();
  return { el: chip, open, close, sync, get panel() { return panel; } };
}
