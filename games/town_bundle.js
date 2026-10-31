export const BUNDLE_V = 1;

export const SEAS_W = {
  spring: ['strawberry', 'beehive', 'shiitake', 'clam', 'lumber'],
  summer: ['potato', 'cabbage', 'saltpan', 'beehive', 'fisher'],
  autumn: ['pear', 'paddy', 'cabbage', 'shiitake', 'fisher'],
  winter: ['seaweed', 'oyster', 'strawberry'],
};
export const seaKey = s => (s === 'now' || !SEAS_W[s] ? 'summer' : s);
export const inSeason = (k, s) => SEAS_W[seaKey(s)].includes(k);

export const BUNDLES = [
  { id: 'spring', icon: '🌸', t: ['봄 꾸러미', 'Spring bundle'], need: { '🍓': 3, '🍯': 2, '🍄': 2 }, money: 1500, rew: { top: 'petal' }, rt: ['🌸 꽃잎 고명(꾸미기)', '🌸 Petal topping (decorate)'] },
  { id: 'summer', icon: '☀️', t: ['여름 꾸러미', 'Summer bundle'], need: { '🥔': 3, '🥬': 2, '🧂': 2 }, money: 1500, rew: { recipe: '🍲' }, rt: ['🍲 감자 배추국 요리법', '🍲 Potato-cabbage soup recipe'] },
  { id: 'autumn', icon: '🍁', t: ['가을 꾸러미', 'Autumn bundle'], need: { '🍐': 2, '🍚': 2, '🍄': 2 }, money: 1500, rew: { recipe: '🍙' }, rt: ['🍙 주먹밥 요리법', '🍙 Rice ball recipe'] },
  { id: 'winter', icon: '❄️', t: ['겨울 꾸러미', 'Winter bundle'], need: { '🌿': 2, '🐚': 2, '🍓': 2 }, money: 1500, rew: { top: 'snow' }, rt: ['❄️ 눈꽃 설탕 고명(꾸미기)', '❄️ Snow-sugar topping (decorate)'] },
  { id: 'garden', icon: '🏫', t: ['텃밭 꾸러미', 'Garden bundle'], need: { '🥕': 2, '🍅': 2, '🌽': 2, '🍠': 2 }, money: 1500, rew: { recipe: '🍿' }, rt: ['🍿 팝콘 요리법', '🍿 Popcorn recipe'] },
  { id: 'forest', icon: '🌲', t: ['숲 꾸러미', 'Forest bundle'], need: { '🍂': 3, '🌰': 2, '⚪': 2 }, money: 1200, rew: { recipe: '🥗' }, rt: ['🥗 산나물 무침 요리법', '🥗 Wild greens recipe'] },
  { id: 'cook', icon: '🍳', t: ['요리 꾸러미', 'Cooking bundle'], need: { '🥞': 1, '🥘': 1, '🍮': 1 }, money: 2000, rew: { stamp: '🏅' }, rt: ['🏅 요리사 도장', '🏅 Cook stamp'] },
];
export const ALL_STAMP = '🧺';

export function bundleBook(S, can) { const P = S.bundles || {}, out = [];
  for (const B of BUNDLES) { const need = {}; for (const [e, n] of Object.entries(B.need)) if (can(e)) need[e] = n; if (Object.keys(need).length < 2) continue;
    const put = P[B.id] || {}, done = Object.entries(need).every(([e, n]) => (put[e] || 0) >= n); out.push({ B, need, put, done }); }
  return out; }

export function bundlePut(S, row, take) { const P = S.bundles || (S.bundles = {}), put = P[row.B.id] || (P[row.B.id] = {}); let moved = 0;
  for (const [e, n] of Object.entries(row.need)) { const k = Math.max(0, n - (put[e] || 0)); for (let i = 0; i < k; i++) { if (!take(e)) break; put[e] = (put[e] || 0) + 1; moved++; } }
  const done = Object.entries(row.need).every(([e, n]) => (put[e] || 0) >= n); return { moved, done }; }
