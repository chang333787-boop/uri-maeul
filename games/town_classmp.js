import { mpTicket } from './town_cloud.js?v=10';
export function createClassMP({ THREE, scene, map, say, en, quiet }) {
  const OFF = true || new URLSearchParams(location.search).get('mp') === 'off';
  const P = { x: 0, y: 0, z: 0, h: 0 }; let N = null, M = null, t = 0, said = false, goneTk = '', lx = 0, lz = 0, eT = -1e9;
  if (!OFF) import('../js/net.js?v=21').then(m => { M = m; }).catch(() => {   });
  const lab = u => (en() ? 'No. ' + u : u + '번');
  const note = k => { if (k === 'dev') say(en() ? '👥 You came in on another device. Here you play on your own' : '👥 다른 기기에서 들어왔어요. 여기서는 혼자 놀아요', 4); };
  const onEmo = e => { const b = e.target.closest && e.target.closest('#mpEmo .emo-bar [data-e]'); if (!b || !N || !N.cf.ok) return; const now = performance.now(); if (now - eT < 1500) return; eT = now; N.emote(+b.dataset.e); };
  document.addEventListener('click', onEmo, true);
  const API = {
    tick(dt) {
      if (N) { const p = map.player.pos(), dx = p.x - lx, dz = p.z - lz; if (dx * dx + dz * dz > 1e-4) { P.h = Math.atan2(dx, dz); lx = p.x; lz = p.z; } P.x = p.x; P.y = p.y; P.z = p.z; N.tick(dt, P); }
      if ((t -= dt) > 0) return; t = 1;
      const T = OFF ? null : mpTicket(), want = !!(T && M && T.tk !== goneTk && !document.body.classList.contains('mp-in'));
      if (N && N.cf.gone) { goneTk = (mpTicket() || {}).tk || 'x'; N.leave(); N = null; return; }
      if (want && !N) N = M.createNet({ THREE, scene, room: T.r, kind: 'kid', cls: { r: T.r, tk: () => (mpTicket() || T).tk, lab, note } });
      else if (N && (!want || N.cf.room !== T.r)) { N.leave(); N = null; }
      if (N && !said && N.count > 1 && !quiet()) { said = true; say(en() ? '👥 Your classmates are here' : '👥 우리 반 친구가 보여요', 3); }
    },
    net: () => N,
    get n() { return N ? N.count : 0; },
    dispose() { document.removeEventListener('click', onEmo, true); if (N) N.leave(); N = null; if (window.SM_CLS === API) delete window.SM_CLS; },
  };
  window.SM_CLS = API;
  return API;
}
