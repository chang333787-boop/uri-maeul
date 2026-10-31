export const MK_V = 1;
export const R3REG = ['바다', '산', '들', '강', '시내', '읍내', '관광'];
const FIELD = { 들: 1, 산: 1, 강: 1 };
const h01 = (hashS, s) => (hashS(s) % 1000) / 1000;

export function rainAmt(fc, reg, day, hashS, id) { if (day < 1) return 0; const h = h01(hashS, 'r3:' + id + ':' + reg + ':' + day);
  if (fc === '비') return +(0.75 + 0.35 * h + (reg === '산' ? 0.1 : 0)).toFixed(2);
  if (fc === '눈') return +(0.4 + 0.2 * h).toFixed(2);
  if (fc === '흐림') return h < 0.3 ? 0.25 : 0;
  return 0; }

export function simFill(S, fcAt, hashS, id, gustAt) { const d = S.day; let M = S.sim; if (!M || typeof M !== 'object' || M.v !== 1) M = S.sim = { v: 1, d: -1, r3: {}, salt: { d, n: 0 }, ys: 0 };
  if (M.d === d && M.r3 && M.r3.바다) return M;
  const fc = [fcAt(0), fcAt(-1), fcAt(-2)]; M.r3 = {}; for (const r of R3REG) M.r3[r] = [0, 1, 2].map(i => rainAmt(fc[i], r, d - i, hashS, id));
  M.gy = !!(gustAt && gustAt(d - 1)) && fc[1] !== '비' && fc[1] !== '눈' && fc[1] !== '흐림';
  if (!M.salt || typeof M.salt !== 'object') M.salt = { d, n: 0 }; if (M.salt.d !== d) { M.ys = M.salt.d === d - 1 ? M.salt.n | 0 : 0; M.salt = { d, n: 0 }; }
  M.d = d; return M; }
export const r3Sum = (M, reg) => { const a = M && M.r3 && M.r3[reg]; return a ? a[0] + a[1] + a[2] : 0; };

export function supOf(M, e, h, sea) { if (!h) return 1; const r = r3Sum(M, h); let s = 1;
  if (e === '🧂') s = 1 - 0.1 * r + (M && M.gy ? 0.08 : 0) + Math.min(0.1, 0.025 * ((M && M.ys) | 0));
  else if (FIELD[h]) s = 1 - 0.05 * r;
  else if (h === '바다') s = 1 - 0.04 * r;
  if (sea) s += 0.06; return Math.max(0.7, Math.min(1.2, s)); }

export const demOf = n => 1 + 0.025 * Math.max(0, Math.min(4, (n | 0) - 1));

export const mkK = (sup, dem) => Math.max(0.85, Math.min(1.15, dem / sup));

export const lumpsOf = sup => (sup >= 1.04 ? 3 : sup >= 0.94 ? 2 : sup >= 0.82 ? 1 : 0);

export function whyOf(M, e, h, sea, en) { const r = r3Sum(M, h);
  if (e === '🧂') { if (r >= 0.9) return en ? 'It rained for days, so the salt pans were closed. Little salt came in.' : '며칠 비가 와서 염전 일을 쉬었대요. 소금이 적게 들어왔어요.';
    if (M && (M.gy || M.ys)) return en ? 'Sunny, windy weather dries seawater fast — lots of salt came in.' : '맑고 바람 부는 날이라 바닷물이 잘 말랐대요. 소금이 많이 들어왔어요.'; }
  else if (r >= 0.9 && FIELD[h]) return en ? 'It rained for days, so farmers could not get into the fields. Less came in.' : '며칠 비가 와서 밭에 못 들어갔대요. 그래서 적게 들어왔어요.';
  else if (r >= 0.9 && h === '바다') return en ? 'Rainy, rough days — fewer boats went out.' : '비 오는 날이 이어져서 배가 덜 나갔대요.';
  if (sea) return en ? 'It is in season now, so plenty came in.' : '요즘이 제철이라 많이 들어왔어요.';
  return ''; }
