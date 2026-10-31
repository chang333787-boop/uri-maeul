export const POL_V = 1, BEE_N = 2;
export const POL_T = {
  bee: ['🐝 꿀벌을 넉넉히 돌봤어요 — 내일은 벌이 꽃가루를 많이 옮겨서 배·딸기 열매가 더 잘 맺힐 거예요', '🐝 You took good care of the bees — tomorrow they will carry lots of pollen, so pears and strawberries set more fruit'],
  morning: ['🐝 어제 꿀벌을 많이 돌봤어요 — 오늘은 벌이 꽃가루를 옮겨 줘서 과수원·딸기 열매가 더 잘 맺혀요 (거들면 하나 더)', '🐝 You looked after the bees yesterday — today they carry pollen, so orchards and strawberries set more fruit (+1 when you help)'],
  plus: [' 🐝 벌이 꽃가루를 옮겨 줘서 하나 더!', ' 🐝 the bees carried pollen, +1!'],
};

export function createPollen(A) { let P9 = [], last = -1;
  const S = () => A.GAME.S, en = () => A.lang() === 'en', active = () => S().pol === S().day;
  function init() { P9 = A.places(); last = -1; }

  function sec() { const me = A.map.player.pos(), sea = A.sea(); let n;
    if (A.night() >= 1 || A.wx() !== 'clear' || sea === 'winter') n = 0; else { const nb = P9.some(([x, z, r]) => Math.hypot(x - me.x, z - me.z) < r + 60); n = nb ? (active() || sea === 'spring' ? 10 : 7) : 4; }
    if (n !== last) { last = n; A.nfx(n); } }

  function bee(ok) { if (!(ok > 0)) return; const d = S().day, B = S().bee && S().bee.d === d ? S().bee : (S().bee = { d, n: 0 }); B.n++; A.GAME.mark(); if (B.n === BEE_N && A.fruit()) setTimeout(() => A.map.hud.toast(POL_T.bee[en() ? 1 : 0], 4), 2800); }

  const bonus = (k, ok) => (ok > 0 && (k === 'pear' || k === 'strawberry') && active() ? 1 : 0);

  function day() { const s = S(); if (s.bee && s.bee.d === s.day - 1 && s.bee.n >= BEE_N && A.fruit()) { s.pol = s.day; A.GAME.mark(); last = -1; return POL_T.morning[en() ? 1 : 0]; } return null; }
  return { init, sec, bee, bonus, day, plus: () => POL_T.plus[en() ? 1 : 0], get active() { return active(); }, get n() { return last; }, get places() { return P9.length; } };
}
