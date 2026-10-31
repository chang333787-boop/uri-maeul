export const SAVE_V = 2;
const MIG = { 1: j => { if (!j.sv || typeof j.sv !== 'object') j.sv = { at: 0, n: 0 }; } };
export function migrate(j) { let v = j.v | 0; if (!(v >= 1)) v = 1; const v0 = v; while (v < SAVE_V) { if (MIG[v]) MIG[v](j); v++; } j.v = Math.max(v, j.v | 0); return v0; }
export const OLD_DAYS = 30, TAB_ID = Math.random().toString(36).slice(2, 10);
const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }, del: k => { try { localStorage.removeItem(k); } catch (e) {   } } };

export const genNew = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const genOf = j => { const g = j && typeof j === 'object' ? j.gen : null; return g && typeof g === 'object' && typeof g.id === 'string' && g.id ? { id: g.id, t: +g.t || 0, dead: Array.isArray(g.dead) ? g.dead.filter(x => typeof x === 'string' && x) : [] } : { id: 'L0', t: 0, dead: [] }; };
const genKill = (g, ...ids) => { const D = g.dead.slice(); for (const x of ids) if (x && !D.includes(x)) D.push(x); return D.slice(-20); };

export const ownedByOther = key => { let o = null; try { o = JSON.parse(LS.get(key + ':own') || 'null'); } catch (e) { o = null; } return !!(o && o.id && o.id !== TAB_ID && Date.now() - (o.at || 0) < 20000); };

export const saveOK = j => !!(j && typeof j === 'object' && !Array.isArray(j) && Number.isFinite(j.day) && j.day >= 1);
const parseOK = t => { if (!t) return null; try { const j = JSON.parse(t); return saveOK(j) ? j : null; } catch (e) { return null; } };
export function readSave(key) { const raw = LS.get(key), j = parseOK(raw), broken = raw && !j ? raw : null;
  if (j) return { j, src: 'main', broken: null };
  const jb = parseOK(LS.get(key + ':bak')); if (jb) return { j: jb, src: 'bak', broken };
  return { j: null, src: '', broken }; }

export function oldSave(key) { const r = LS.get(key + ':old'); if (!r) return null; try { const o = JSON.parse(r); if (!o || !o.raw || !(o.at > 0)) return null; if (Date.now() - o.at > OLD_DAYS * 864e5) { LS.del(key + ':old'); return null; } const j = JSON.parse(o.raw); return { at: o.at, day: j.day || 1, raw: o.raw }; } catch (e) { return null; } }

export const slotKey = (id, k) => 'sm-town-game:' + id + (k > 1 ? '#' + k : '');

function keepOld(key, raw) { const v = JSON.stringify({ at: Date.now(), raw }); if (LS.set(key + ':old', v)) return true; if (LS.get(key + ':bak') === raw) return false; LS.del(key + ':bak'); return LS.set(key + ':old', v); }

export function delSave(key, raw) { delSave.why = ''; if (!raw && ownedByOther(key)) { delSave.why = 'ro'; return false; }
  let cur = raw || ''; if (!cur) { const R = readSave(key); cur = (R.src === 'main' ? LS.get(key) : R.src === 'bak' ? LS.get(key + ':bak') : '') || ''; if (!cur && R.broken) LS.set('sm-town-game-bak:' + key.slice(13), R.broken); }
  if (cur && !keepOld(key, cur)) { delSave.why = 'full'; return false; }
  if (cur) { let g = null; try { g = genOf(JSON.parse(cur)); } catch (e) { g = null; } if (g) LS.set(key + ':gen', JSON.stringify({ dead: genKill(g, g.id) })); }
  LS.del(key); LS.del(key + ':bak'); return true; }
delSave.why = '';

export function restoreSave(key, mine) { restoreSave.why = ''; if (!mine && ownedByOther(key)) { restoreSave.why = 'ro'; return false; } const o = oldSave(key); if (!o) { restoreSave.why = 'none'; return false; } const cur = LS.get(key);
  let put = o.raw; try { const j = JSON.parse(o.raw), jc = cur ? parseOK(cur) : null, g0 = genOf(j), gc = jc ? genOf(jc) : null; j.gen = { id: genNew(), t: Date.now(), dead: genKill(g0, gc && gc.id !== g0.id ? gc.id : '') }; put = JSON.stringify(j); } catch (e) { put = o.raw; }
  if (!LS.set(key, put)) { restoreSave.why = 'full'; return false; } if (cur) { if (!LS.set(key + ':old', JSON.stringify({ at: Date.now(), raw: cur }))) { LS.set(key, cur); restoreSave.why = 'full'; return false; } } else LS.del(key + ':old'); LS.del(key + ':bak'); LS.del(key + ':gen'); return true; }
restoreSave.why = '';
export const saveSize = key => ((LS.get(key) || '').length + (LS.get(key + ':bak') || '').length + (LS.get(key + ':old') || '').length);

export function evictOld(keep) { let best = null, at = Infinity; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k || !/^sm-town-game:.*:old$/.test(k) || k === keep) continue; let a = 0; try { a = JSON.parse(localStorage.getItem(k)).at || 0; } catch (e) { a = 0; } if (a < at) { at = a; best = k; } } } catch (e) { return false; } if (!best) return false; LS.del(best); return true; }

export async function claimSave(key) { const K = key + ':own'; let o = null, ans = ''; try { o = JSON.parse(LS.get(K) || 'null'); } catch (e) { o = null; }
  if (o && o.id && o.id !== TAB_ID && Date.now() - (o.at || 0) < 20000 && typeof addEventListener === 'function') { LS.set(K, JSON.stringify({ req: TAB_ID, at: Date.now() }));
    await new Promise(res => { let done = false; const fin = a => { if (done) return; done = true; ans = a; removeEventListener('storage', on); res(); }, on = e => { if (e.key !== K) return; try { const v = JSON.parse(e.newValue || 'null'); if (v && v.rel) fin('rel'); else if (v && v.deny === TAB_ID) fin('deny'); } catch (e2) {   } }; addEventListener('storage', on); setTimeout(() => fin(''), 1500); }); }
  if (ans === 'deny') return 'ro';
  LS.set(K, JSON.stringify({ id: TAB_ID, at: Date.now() })); return 'own'; }
export const SPM = 0.7;
export const CAL_LEN = 7, CAL_SEQ = ['autumn', 'winter', 'spring', 'summer'];
export const DAY_START = 6 * 60, DAY_END = 24 * 60;

export const phaseOf = m => (m < 6 * 60 || m >= 19 * 60) ? 'night' : m >= 17 * 60 ? 'sunset' : 'day';
export const PHASE_AT = { day: 9 * 60, sunset: 17 * 60, night: 19 * 60 };

export const ITEMS = {
  '🍓': ['딸기', 'Strawberry', 'food', 100, '들'], '🥔': ['감자', 'Potato', 'food', 150, '들'], '🍚': ['쌀', 'Rice', 'food', 250, '들'], '🍐': ['배', 'Pear', 'food', 300, '들'], '🥬': ['배추', 'Cabbage', 'food', 300, '들'], '🥛': ['우유', 'Milk', 'food', 300, '들'],
  '🍄': ['버섯', 'Mushroom', 'food', 200, '산'], '🍯': ['꿀', 'Honey', 'food', 500, '산'], '🍃': ['산나물', 'Wild greens', 'food', 150, '산'],
  '🍂': ['마른 가지', 'Dry twigs', 'wild', 50, '산'], '🌰': ['솔방울', 'Pine cone', 'wild', 50, '산'], '⚪': ['조약돌', 'Pebble', 'wild', 50, '산'], '⚫': ['송이 돌', 'Scoria pebble', 'wild', 30, '산'],
  '🧂': ['소금', 'Salt', 'food', 150, '바다'], '🐚': ['조개', 'Clam', 'food', 200, '바다'], '🌿': ['김', 'Laver', 'food', 250, '바다'], '🐟': ['물고기', 'Fish', 'food', 400, '바다'],
  '🥒': ['오이', 'Cucumber', 'food', 150, '강'], '🥕': ['당근', 'Carrot', 'food', 150, '들'], '🍅': ['방울토마토', 'Cherry tomato', 'food', 200, '들'], '🌽': ['옥수수', 'Corn', 'food', 200, '들'], '🍠': ['고구마', 'Sweet potato', 'food', 250, '들'], '🍞': ['빵', 'Bread', 'treat', 300, '시내'], '🍦': ['아이스크림', 'Ice cream', 'treat', 300, '관광'], '🥤': ['음료', 'Drink', 'treat', 0], '🍰': ['젤리 케이크', 'Jelly cake', 'treat', 0],
  '🌾': ['밀가루', 'Flour', 'cook', 0], '🥚': ['달걀', 'Egg', 'cook', 0], '🧈': ['버터', 'Butter', 'cook', 0], '🍁': ['시럽', 'Syrup', 'cook', 0],
  '🥞': ['팬케이크', 'Pancake', 'dish', 0], '🥘': ['버섯 볶음', 'Fried mushrooms', 'dish', 0], '🍮': ['푸딩', 'Pudding', 'dish', 0], '🍓🥞': ['딸기 팬케이크', 'Strawberry pancake', 'dish', 0], '🌑': ['탄 요리', 'Burnt food', 'dish', 0], '🍲': ['감자 배추국', 'Potato-cabbage soup', 'dish', 0], '🍙': ['주먹밥', 'Rice ball', 'dish', 0], '🍿': ['팝콘', 'Popcorn', 'dish', 0], '🥗': ['산나물 무침', 'Seasoned wild greens', 'dish', 0], '🍛': ['카레라이스', 'Curry rice', 'dish', 0], '🥟': ['만두', 'Dumplings', 'dish', 0], '🥧': ['고구마 파이', 'Sweet potato pie', 'dish', 0],
  '🍠♨': ['군고구마', 'Roasted sweet potato', 'dish', 0], '🥔♨': ['구운 감자', 'Roasted potato', 'dish', 0], '🌽♨': ['구운 옥수수', 'Roasted corn', 'dish', 0], '🍄♨': ['버섯구이', 'Grilled mushroom', 'dish', 0], '🐟♨': ['생선구이', 'Grilled fish', 'dish', 0], '🍞♨': ['토스트', 'Toast', 'dish', 0],
  '🦑♨': ['오징어구이', 'Grilled squid', 'dish', 0], '🍢': ['어묵 꼬치', 'Fish-cake skewer', 'dish', 0], '🍌': ['바나나', 'Banana', 'dish', 0], '🍊': ['귤', 'Tangerine', 'dish', 0], '🍡': ['쑥떡', 'Mugwort rice cake', 'dish', 0],
  '🐟☀': ['말린 생선', 'Dried fish', 'dish', 0], '🍠☀': ['고구마 말랭이', 'Dried sweet potato', 'dish', 0], '🍄☀': ['말린 버섯', 'Dried mushroom', 'dish', 0], '🍃☀': ['묵나물', 'Dried wild greens', 'dish', 0], '🥛❄': ['우유 얼음', 'Milk ice', 'dish', 0], '🍓❄': ['언 딸기', 'Frozen strawberry', 'dish', 0], '🥤❄': ['살얼음 음료', 'Slushy drink', 'dish', 0],
  '✉': ['엽서', 'Postcard', 'farm', 0],
  '🌱': ['심은 모', 'Rice seedlings planted', 'farm', 0], '🌲': ['심은 나무', 'Saplings planted', 'farm', 0], '🧶': ['양털 한 뭉치', 'Bundle of wool', 'farm', 0],
  '⛰': ['정상 도장', 'Summit stamp', 'stamp', 0], '🗼': ['등대 도장', 'Lighthouse stamp', 'stamp', 0], '👣': ['징검다리 도장', 'Stepping-stone stamp', 'stamp', 0], '📖': ['책 읽기 도장', 'Reading stamp', 'stamp', 0], '⛷': ['스키 도장', 'Ski stamp', 'stamp', 0], '🏅': ['요리사 도장', 'Cook stamp', 'stamp', 0], '🧺': ['꾸러미 도장', 'Bundle stamp', 'stamp', 0], '🔭': ['별 보기 도장', 'Stargazing stamp', 'stamp', 0], '⛄': ['눈사람 도장', 'Snowman stamp', 'stamp', 0], '🏰': ['모래성 도장', 'Sandcastle stamp', 'stamp', 0], '🏊': ['생존수영 도장', 'Survival-swimming stamp', 'stamp', 0], '🌬️': ['바닷바람 도장', 'Sea-breeze stamp', 'stamp', 0], '🌈': ['무지개 도장', 'Rainbow stamp', 'stamp', 0], '🌙': ['밤 순찰 도장', 'Night-patrol stamp', 'stamp', 0], '🌌': ['북극성 도장', 'North Star stamp', 'stamp', 0], '🔔': ['아침 경매 도장', 'Morning-auction stamp', 'stamp', 0], '💫': ['반딧불이 도장', 'Firefly stamp', 'stamp', 0], '📜': ['이야기 도장', 'Story stamp', 'stamp', 0], '🏮': ['잔치 등불', 'Festival lantern', 'stamp', 0], '🔬': ['물 맑기 도장', 'Clean-stream stamp', 'stamp', 0], '🌀': ['물굽이 도장', 'River-bend stamp', 'stamp', 0], '🐸': ['논 생물 도장', 'Paddy-life stamp', 'stamp', 0], '💧': ['물꼬 도장', 'Paddy-gate stamp', 'stamp', 0],
  '👕': ['티셔츠', 'T-shirt', 'goods', 0], '🧢': ['모자', 'Cap', 'goods', 0], '🔑': ['키링', 'Key ring', 'goods', 0], '🧸': ['곰 인형', 'Teddy bear', 'goods', 0], '🧩': ['칠교 조각', 'Tangram set', 'goods', 0], '🔳': ['고누 판', 'Gonu board', 'goods', 0], '🌻': ['해바라기 화분', 'Sunflower pot', 'goods', 0], '🏺': ['장독', 'Sauce jar', 'goods', 0], '🎐': ['풍경', 'Wind chime', 'goods', 0],
  '🥇': ['고리 코스 금 도장', 'Ring course gold stamp', 'stamp', 0], '🥈': ['고리 코스 은 도장', 'Ring course silver stamp', 'stamp', 0], '🥉': ['고리 코스 동 도장', 'Ring course bronze stamp', 'stamp', 0],
};

export const DISHES = { '🍣': ['초밥 한 접시', 'Sushi plate'], '🍜': ['마라탕 한 그릇', 'Malatang bowl'], '🦐': ['해산물 한 접시', 'Seafood plate'], '🍱': ['밥 한 상', 'Set meal'], '🥪': ['샌드위치 한 접시', 'Sandwich plate'] };

export const SHOPS = [
  [/편의점/, 'conv', 0, 24, [['🥚', 250], ['🥛', 400], ['🌾', 600], ['🍁', 500], ['🥤', 1200]]],
  [/도시 상점/, 'gift', 10, 21, [['👕', 3000], ['🧢', 2500], ['🔑', 1500], ['🧸', 4000]]],
  [/산지 식품|산지 용품/, 'mtn', 8, 19, [['🍄', 400], ['🍃', 300], ['🍯', 900]]],
  [/마트|슈퍼|모두의 상점|식품/, 'grocery', 8, 22, [['🥚', 200], ['🥛', 350], ['🌾', 500], ['🧈', 500], ['🍁', 400]]],
  [/빵/, 'bakery', 7, 20, [['🍞', 1200]]],
  [/아이스크림/, 'icecream', 10, 21, [['🍦', 1000]]],
  [/초밥/, 'sushi', 11, 21, [['🍣', 4000, 1]]],
  [/마라탕/, 'mala', 11, 21, [['🍜', 4000, 1]]],
  [/해산물 식당/, 'seafood', 11, 21, [['🦐', 4500, 1]]],
  [/카페/, 'cafe', 8, 21, [['🥤', 1500], ['🍞', 1300]]],
];

export const RECIPES = [['🥞', '팬케이크', 'Pancake', { '🌾': 1, '🥚': 1, '🥛': 1 }], ['🥘', '버섯 볶음', 'Fried mushrooms', { '🍄': 2, '🧈': 1 }], ['🍮', '푸딩', 'Pudding', { '🥚': 2, '🥛': 1, '🍁': 1 }], ['🍓🥞', '딸기 팬케이크', 'Strawberry pancake', { '🌾': 1, '🥚': 1, '🥛': 1, '🍓': 3 }],
  ['🍲', '감자 배추국', 'Potato-cabbage soup', { '🥔': 2, '🥬': 1, '🧂': 1 }, 'summer'], ['🍙', '주먹밥', 'Rice ball', { '🍚': 2, '🧂': 1 }, 'autumn'], ['🍿', '팝콘', 'Popcorn', { '🌽': 2, '🧈': 1 }, 'garden'], ['🥗', '산나물 무침', 'Seasoned wild greens', { '🍃': 2, '🧂': 1 }, 'forest'],
  ['🍛', '카레라이스', 'Curry rice', { '🍚': 1, '🥔': 1, '🥕': 1 }, 'sk'], ['🥟', '만두', 'Dumplings', { '🌾': 1, '🥬': 1, '🍄': 1 }, 'sk'], ['🥧', '고구마 파이', 'Sweet potato pie', { '🍠': 2, '🌾': 1, '🧈': 1 }, 'sk']];

export const TASKS = {
  work: ['{e} {n} 같이 하기', 'Help: {n}', 1, 400], mush: ['🍄 버섯 2개 따기', '🍄 Pick 2 mushrooms', 2, 300], farm: ['🌱 학교 텃밭 돌보기 (심기·물 주기·거두기)', '🌱 Tend the school garden (plant · water · harvest)', 1, 300],
  sell: ['🛒 장터에서 물건 3개 팔기', '🛒 Sell 3 things at a market', 3, 300], away: ['✨ 멀리서 온 물건을 장터에 팔기', '✨ Sell something from far away', 1, 400], buy: ['🥚 마트에서 요리 재료 사기', '🥚 Buy a cooking ingredient', 1, 200], cook: ['🍳 아이 집 부엌에서 요리 하나 만들기', '🍳 Cook a dish in a kitchen', 1, 600], share: ['🍽 이웃에게 요리 나눠 주기', '🍽 Share a dish with a neighbour', 1, 500], eat: ['🍜 식당에서 밥 먹어 보기', '🍜 Eat at a restaurant', 1, 300],
  summit: ['⛰ 산꼭대기 도장 찍기', '⛰ Get the summit stamp', 1, 800], bus: ['🚌 버스 타고 다른 정류장 가기', '🚌 Ride a bus to another stop', 1, 300], boat: ['⛵ 배 타고 바다 나가 보기', '⛵ Take the boat out', 1, 500], stones: ['👣 징검다리 건너기', '👣 Cross the stepping stones', 1, 300], book: ['📖 도서관에서 책 읽기', '📖 Read at the library', 1, 300], stars: ['🔭 밤(19시 뒤)에 산꼭대기에서 별 보기', '🔭 Stargaze on the summit at night (after 19:00)', 1, 500],
  bundle: ['🧺 계절 꾸러미에 물건 넣기 (I → 꾸러미)', '🧺 Put something in a bundle (I → Bundles)', 1, 300], night: ['🌙 밤에만 열리는 것: {n}', '🌙 Night only: {n}', 1, 500],
  new: ['🆕 처음 해 볼 것', '🆕 Something new', 1, 400], only: ['⏰ 오늘만', '⏰ Today only', 1, 400],
};

export const TASK_TP = {
  work: ['{e} {n}, 같이 했어요', 'Helped: {n}'], mush: ['🍄 버섯 2개를 땄어요', '🍄 Picked 2 mushrooms'], farm: ['🌱 학교 텃밭을 돌봤어요', '🌱 Tended the school garden'],
  sell: ['🛒 장터에서 물건 3개를 팔았어요', '🛒 Sold 3 things at a market'], away: ['✨ 멀리서 온 물건을 장터에 팔았어요', '✨ Sold something from far away'], buy: ['🥚 마트에서 요리 재료를 샀어요', '🥚 Bought a cooking ingredient'], cook: ['🍳 아이 집 부엌에서 요리를 만들었어요', '🍳 Cooked a dish in a kitchen'], share: ['🍽 이웃에게 요리를 나눠 줬어요', '🍽 Shared a dish with a neighbour'], eat: ['🍜 식당에서 밥을 먹어 봤어요', '🍜 Ate at a restaurant'],
  summit: ['⛰ 산꼭대기 도장을 찍었어요', '⛰ Got the summit stamp'], bus: ['🚌 버스 타고 다른 정류장에 갔어요', '🚌 Rode a bus to another stop'], boat: ['⛵ 배 타고 바다에 나가 봤어요', '⛵ Took the boat out'], stones: ['👣 징검다리를 건넜어요', '👣 Crossed the stepping stones'], book: ['📖 도서관에서 책을 읽었어요', '📖 Read at the library'], stars: ['🔭 밤 산꼭대기에서 별을 봤어요', '🔭 Stargazed on the summit'],
  bundle: ['🧺 계절 꾸러미에 물건을 넣었어요', '🧺 Put something in a bundle'], night: ['🌙 밤에만 열리는 것을 해 봤어요', '🌙 Tried something that only happens at night'],
};
export const TASK_POOLS = [['work', 'mush', 'farm'], ['sell', 'away', 'buy', 'cook', 'share', 'eat', 'bundle'], ['summit', 'bus', 'boat', 'stones', 'book', 'stars', 'night']];
export const shopOf = name => { if (/동물 카페|키즈 카페|보드게임 카페|꼬리 용품|반려/.test(name || '')) return null;     for (const S of SHOPS) if (S[0].test(name || '')) return S; return null; };
export const won = n => (n | 0).toLocaleString('ko-KR') + '원';
export const itemName = (e, en) => { const I = ITEMS[e]; return I ? (en ? I[1] : I[0]) : e; };

export const RW_XP = { night: 6, job: 6, bus: 3, book: 1, stars: 1, summit: 1, boat: 2, stones: 3, metro: 3, sell: 8, buy: 6, away: 4, bundle: 6, mush: 8, farm: 6, cook: 8, quiz: 2, cell: 1, bug: 2, wild: 2, shore: 2, fish: 2, worm: 2, sweep: 6, flower: 6, photo: 1, kit: 2, fix: 1, bldg: 1, ent: 1 };
export const RW_XP_DEF = 3, RW_GEN = { night: 4, job: 6, bake: 2, photo: 1, table: 1, card: 2 }, RW_HEART = 3;
export const RW_DAY = { v: 20000, x: 48, h: 3 }, RW_RD = 3;
export const rdNow = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const rwVal = e => { const I = ITEMS[e]; return !I ? 100 : I[2] === 'stamp' ? 0 : Math.max(100, I[3] || 0); };
const RWW = new Set();

export function rwCheck(S, kind, src, n, k, day) { rwCheck.last = ''; if (!(n > 0) || rwCheck.off) return n;
  if (!src) { if (!RWW.has(kind + k)) { RWW.add(kind + k); console.warn('REW-1: 꼬리표 없는 보상 — ' + kind + ' ' + k); } src = '?:' + kind + ':' + k; }
  const fam = String(src).split(':')[0]; if (fam === 'mv' || fam === 'story') return n;
  const d0 = day != null ? day : S.day, rd = rdNow(); let R = S.rw; if (!R || typeof R !== 'object') R = S.rw = {}; if (R.d !== d0 || !R.c) { R.d = d0; R.c = {}; } if (R.rd !== rd || !R.r) { R.rd = rd; R.r = { v: 0, x: {}, h: {}, said: {} }; }
  const C = R.c, Q = R.r, lim = kind === 'xp' ? (RW_XP[fam] != null ? RW_XP[fam] : fam === '?' ? 16 : RW_XP_DEF) : kind === 'heart' ? (fam === 'card' ? RW_GEN.card : null) : RW_GEN[fam];
  if (lim != null) { const ck = kind[0] + '|' + src; if ((C[ck] || 0) >= lim) { rwCheck.last = 'day'; return 0; } C[ck] = (C[ck] || 0) + 1; }
  if (kind === 'heart') { const ck = 'h|' + k, H0 = (S.hearts || {})[k] || 0, L0 = Math.min(5, (H0 / 3) | 0), HD = S.hd && typeof S.hd === 'object' ? S.hd : (S.hd = {}), top = HD[k] === d0 ? L0 * 3 + 2 - H0 : 99;
    const a = Math.min(n, RW_HEART - (C[ck] || 0), RW_DAY.h * RW_RD - (Q.h[k] || 0), top); if (a <= 0) { rwCheck.last = top <= 0 || (C[ck] || 0) >= RW_HEART ? 'day' : 'rd'; return 0; } C[ck] = (C[ck] || 0) + a; Q.h[k] = (Q.h[k] || 0) + a; if (Math.min(5, ((H0 + a) / 3) | 0) > L0) HD[k] = d0; if (a < n) rwCheck.last = 'day'; return a; }
  if (kind === 'xp') { const a = Math.min(n, RW_DAY.x * RW_RD - (Q.x[k] || 0)); if (a <= 0) { rwCheck.last = 'rd'; return 0; } Q.x[k] = (Q.x[k] || 0) + a; if (a < n) rwCheck.last = 'rd'; return a; }
  const u = kind === 'bag' ? rwVal(k) : 1; if (!u) return n; const left = RW_DAY.v * RW_RD - Q.v, a = Math.max(0, Math.min(n, Math.floor(left / u))); if (a < n) rwCheck.last = 'rd'; Q.v += a * u; return a; }
rwCheck.off = false; rwCheck.last = '';

export function createGame(id, opt) {
  const KEY = 'sm-town-game:' + id;
  const fresh = () => ({ v: SAVE_V, day: 1, min: 7 * 60, bag: {}, money: 0, earned: 0, dex: {}, ate: {}, cooked: {}, shared: 0, picked: {}, uses: {}, tasks: null, cells: {}, album: [], fridge: {}, hearts: {}, today: null, clock: true, cal: { d0: 1, on: true, s: 'now' }, bundles: {}, unlock: {}, farm: [], diary: [], wx: { auto: true }, bought: {}, res: {}, rw: {}, hd: {}, deeds: [], nbt: {}, home: { v: 1, id: null, h: '', x: 0, z: 0, pots: [null, null], met: 0, gift: null }, yday: null, lad: {}, news: { d: 0, lines: [], rum: [], last: {} }, gen: { id: genNew(), t: Date.now(), dead: [] } });
  let S = fresh(); const RS = readSave(KEY); let raw9 = RS.broken, prevRaw = RS.src === 'main' ? LS.get(KEY) : null, migFrom = 0;
  try { const j = RS.j; if (j) { migFrom = migrate(j); j.gen = genOf(j);     const F9 = fresh(), T9 = Object.assign(fresh(), j); for (const k of Object.keys(F9)) { const f = F9[k], t = T9[k]; if (f && typeof f === 'object' ? (!t || typeof t !== 'object' || Array.isArray(t) !== Array.isArray(f)) : typeof f === 'number' && !Number.isFinite(t)) T9[k] = f; }     S = T9; if (!(j.cal && j.cal.d0 >= 1)) S.cal = { d0: S.day, on: true, s: 'now' };     for (const k of Object.keys(S.bag)) if (!(S.bag[k] > 0)) delete S.bag[k]; } } catch (e) { S = fresh(); raw9 = raw9 || LS.get(KEY); }
  if (raw9) LS.set('sm-town-game-bak:' + id, raw9);
    let genMk = false; if (!RS.j) { let dd = null; try { const m = JSON.parse(LS.get(KEY + ':gen') || 'null'); if (m && Array.isArray(m.dead)) { dd = m.dead.filter(x => typeof x === 'string' && x); genMk = true; } } catch (e) { dd = null; } if (!dd) { const o9 = oldSave(KEY); if (o9) { try { const g9 = genOf(JSON.parse(o9.raw)); dd = genKill(g9, g9.id); } catch (e) { dd = null; } } } if (dd && dd.length) S.gen.dead = dd.slice(-20); }
    const SUB0 = {}; for (const k of Object.keys(S)) { const o = S[k]; if (o && typeof o === 'object' && !Array.isArray(o) && o.v != null && k !== 'vold') SUB0[k] = o; }
  if (!(S.min >= 0 && S.min < DAY_END)) S.min = 7 * 60;
  let dirty = false, since = 0, acc = 0, ph = phaseOf(S.min), on = null; const T0 = () => ({ earned: 0, got: {}, cells: 0, tasks: 0, cooked: 0, shared: 0, dex: 0, gift: 0, farmW: 0, sold: 0, rainW: 0 });     if (!S.today || typeof S.today !== 'object') S.today = T0(); else for (const [k, v] of Object.entries(T0())) if (typeof S.today[k] !== typeof v) S.today[k] = v;
  const emit = (t) => { if (on) on(t); };
  let ro = !!(opt && opt.ro), roSay = ro, failSaid = false, bakAt = 0;
    const onHide = e => { if (ro) return; G.flush(true); if (e && e.type === 'pagehide') LS.set(KEY + ':own', JSON.stringify({ id: null, rel: TAB_ID, at: Date.now() })); }, onVis = () => { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') onHide(); };
    const onStore = e => { if (!e || ro) return;
    if (e.key === KEY) { if (e.newValue == null) { ro = true; emit('save-del'); } else if (e.newValue !== prevRaw) { ro = true; emit('save-tab'); } return; }
    if (e.key !== KEY + ':own') return; let v = null; try { v = JSON.parse(e.newValue || 'null'); } catch (e2) { return; } if (!v) return;
    if (v.req && v.req !== TAB_ID) { if (G.flush(true)) { ro = true; LS.set(KEY + ':own', JSON.stringify({ id: null, rel: TAB_ID, at: Date.now() })); emit('save-tab'); } else LS.set(KEY + ':own', JSON.stringify({ id: TAB_ID, at: Date.now(), deny: v.req })); }
    else if (v.id && v.id !== TAB_ID) { ro = true; emit('save-tab'); } };
  if (typeof addEventListener === 'function') { addEventListener('storage', onStore); addEventListener('pagehide', onHide); addEventListener('beforeunload', onHide); if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis); }
  const G = {
    S,
    on(fn) { on = fn; if (roSay) { roSay = false; setTimeout(() => emit('save-ro'), 0); } },
    mark() { dirty = true; },
    flush(force) { since = 0; if (ro || (!dirty && !force)) return !ro; const now = Date.now();
      for (const k in SUB0) { const o = S[k], o0 = SUB0[k]; if (o !== o0) { if (o && o0 && o.v !== o0.v) { const V = S.vold && typeof S.vold === 'object' ? S.vold : (S.vold = {}); V[k] = { at: now, o: o0 }; } delete SUB0[k]; } }
      const sv = S.sv && typeof S.sv === 'object' ? S.sv : (S.sv = { at: 0, n: 0 }); const at0 = sv.at, n0 = sv.n; sv.at = now; sv.n = (sv.n | 0) + 1; let str; try { str = JSON.stringify(S); } catch (e) { sv.at = at0; sv.n = n0; return false; }
      if (prevRaw && now - bakAt > 60000) { if (LS.set(KEY + ':bak', prevRaw)) bakAt = now; }
      let ok = LS.set(KEY, str); if (!ok) { LS.del(KEY + ':bak'); LS.del('sm-town-stuck'); ok = LS.set(KEY, str); for (let n = 0; !ok && n < 6 && evictOld(); n++) ok = LS.set(KEY, str); }
      if (!ok) { sv.at = at0; sv.n = n0; G.saveErr = now; if (!failSaid) { failSaid = true; emit('save-fail'); } return false; }
      prevRaw = str; dirty = false; G.savedAt = now; G.saveErr = 0; LS.set(KEY + ':own', JSON.stringify({ id: TAB_ID, at: now })); if (genMk) { genMk = false; LS.del(KEY + ':gen'); } return true; },
    get readOnly() { return ro; }, get migFrom() { return migFrom; }, get loadSrc() { return RS.src; }, had: !!RS.j, savedAt: (S.sv && S.sv.at) || 0, saveErr: 0, key: KEY, why: '',

    newGame() { G.why = ''; if (ro) { G.why = 'ro'; return false; } let str = ''; try { str = JSON.stringify(S); } catch (e) { str = ''; } if (!delSave(KEY, str)) { G.why = delSave.why || 'full'; return false; } ro = true; return true; },

    restoreOld() { G.why = ''; if (!oldSave(KEY)) { G.why = 'none'; return false; } if (ro) { G.why = 'ro'; return false; } if (!G.flush(true) || !restoreSave(KEY, true)) { G.why = 'full'; return false; } ro = true; return true; },
    oldInfo: () => oldSave(KEY),
    dispose() { { let o = null; try { o = JSON.parse(LS.get(KEY + ':own') || 'null'); } catch (e) { o = null; } if (o && o.id === TAB_ID) LS.set(KEY + ':own', JSON.stringify({ id: null, rel: TAB_ID, at: Date.now() })); }
      if (typeof removeEventListener !== 'function') return; removeEventListener('storage', onStore); removeEventListener('pagehide', onHide); removeEventListener('beforeunload', onHide); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); },

    tick(dt, paused) {
      since += dt; if (dirty && since >= 2) G.flush();
      if (!S.clock || paused) return;
      acc += dt; if (acc < SPM) return;
      while (acc >= SPM) { acc -= SPM; S.min++; }
      if (S.min % 10 === 0) { dirty = true; emit('clock'); }
      const p = phaseOf(S.min); if (p !== ph) { ph = p; emit('phase'); }
      if (S.min >= DAY_END) emit('midnight');
    },
    get phase() { return ph; },

    syncPhase(k) { if (!PHASE_AT[k] || phaseOf(S.min) === k) return false; S.min = PHASE_AT[k]; ph = k; acc = 0; dirty = true; emit('clock'); return true; },

    waitMin(m) { if (!(m > S.min && m < DAY_END)) return false; S.min = m; acc = 0; const p = phaseOf(S.min); dirty = true; emit('clock'); if (p !== ph) { ph = p; emit('phase'); } return true; },
    clockText(en) { const h = (S.min / 60) | 0, m = ((S.min % 60) / 10 | 0) * 10;     return (en ? 'Day ' + S.day + ' ' : S.day + '일째 ') + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; },
    setClock(onoff) { S.clock = !!onoff; dirty = true; emit('clock'); },

    sleep() { G.lastDay = { day: S.day, ...S.today }; S.yday = G.lastDay; S.today = T0(); S.day++; S.min = DAY_START; acc = 0; ph = phaseOf(S.min); S.picked = {}; S.uses = {}; S.tasks = null; dirty = true; try { emit('clock'); emit('phase'); emit('day'); } finally { G.flush(); } },
    seasonAt(d) { const c = S.cal; if (!c.on) return c.s || 'now'; const n = Math.floor((d - c.d0) / CAL_LEN); return n <= 0 ? 'now' : CAL_SEQ[(n - 1) % CAL_SEQ.length]; },
    season() { return G.seasonAt(S.day); }, calDay() { return ((S.day - S.cal.d0) % CAL_LEN + CAL_LEN) % CAL_LEN + 1; },
    setCal(on, s) { if (on) S.cal.on = true; else { S.cal.on = false; S.cal.s = s; } dirty = true; },
    lastDay: null, tally(k, n = 1) { if (!S.today) S.today = T0(); S.today[k] = (S.today[k] || 0) + n; dirty = true; },

      rw(kind, src, n, k) { const a = rwCheck(S, kind, src, n, k); if (rwCheck.last) { dirty = true; if (rwCheck.last === 'rd' && S.rw.r && !S.rw.r.said[kind]) { S.rw.r.said[kind] = 1; emit('cap'); } } else if (a > 0 && n > 0) dirty = true; return a; },
    rwLeft(kind, src) { const R = S.rw, fam = String(src).split(':')[0], lim = kind === 'xp' ? (RW_XP[fam] != null ? RW_XP[fam] : RW_XP_DEF) : RW_GEN[fam]; if (lim == null || rwCheck.off) return 99; const c = R && R.d === S.day && R.c ? R.c[kind[0] + '|' + src] || 0 : 0; return lim - c; },
    rwOff(v) { rwCheck.off = !!v; },
    lastN: 0, add(e, n = 1, src) { n = G.rw('bag', src, n, e); G.lastN = n; if (!(n > 0)) return false; S.bag[e] = (S.bag[e] || 0) + n; const neu = G.found(e); if (S.today) S.today.got[e] = (S.today.got[e] || 0) + n; dirty = true; return neu; },

    stamp9: null, found(k) { if (S.dex[k] != null) return false; S.dex[k] = G.stamp9 ? G.stamp9() : S.day; if (S.today) S.today.dex++; dirty = true; return true; },
    take(e, n = 1) { if ((S.bag[e] || 0) < n) return false; S.bag[e] -= n; if (S.bag[e] <= 0) delete S.bag[e]; const B8 = S.bought; if (B8 && B8[e]) { const r = Math.max(0, Math.min(B8[e] - n, S.bag[e] || 0)); if (r) B8[e] = r; else delete B8[e]; } dirty = true; return true; },
    count: e => S.bag[e] || 0,

    picked: k => S.picked[k] === S.day,
    pick(k) { S.picked[k] = S.day; dirty = true; },

    earn(n, src) { n = Math.round(n); if (n > 0) n = G.rw('money', src, n); if (!n) return 0; S.money += n; S.earned += n; if (S.today) S.today.earned += n; dirty = true; return n; },
    spend(n) { if (S.money < n) return false; S.money -= n; dirty = true; return true; },

    visit(c) { if (S.cells[c]) return false; S.cells[c] = S.day; if (S.today) S.today.cells++; dirty = true; return true; },

    heart(k, n, src) { n = G.rw('heart', src, n, k); if (!(n > 0)) return 0; const H = S.hearts || (S.hearts = {}), a = Math.min(5, ((H[k] || 0) / 3) | 0); H[k] = Math.min(15, (H[k] || 0) + n); dirty = true; const b = Math.min(5, (H[k] / 3) | 0); return b > a ? b : 0; },
    hearts: k => Math.min(5, (((S.hearts || {})[k] || 0) / 3) | 0),

    uses: k => S.uses[k] || 0,
    use(k) { S.uses[k] = (S.uses[k] || 0) + 1; dirty = true; return S.uses[k]; },
    ate(e) { const neu = !S.ate[e]; S.ate[e] = (S.ate[e] || 0) + 1; G.found('ate:' + e); dirty = true; return neu; },

    open: (h0, h1) => { const h = S.min / 60; return h0 === 0 && h1 === 24 ? true : h >= h0 && h < h1; },

    tasks(ctx, en) { if (S.tasks && S.tasks.day === S.day) return S.tasks.list; let r = (S.day * 2654435761 + 97) >>> 0; const rnd = () => (r = (r * 1103515245 + 12345) >>> 0) / 4294967296, list = [];
      TASK_POOLS.forEach((P, pi) => { const av = []; for (const id of P) { const c = ctx[id]; if (!c) continue; if (id === 'work') for (const w of c) av.push(['work', w]); else av.push([id, c]); } if (!av.length) return; const hot = av.filter(a => a[1] && a[1].why && !a[1].why.soft); let pick = av[(rnd() * av.length) | 0]; if (hot.length && rnd() < 0.8) pick = hot[(rnd() * hot.length) | 0];
        if (S.day === 1) { const want = ['work', 'sell', 'bus'][pi]; pick = av.find(a => a[0] === want) || av[0]; }
        const [id, c] = pick, T = TASKS[id], txt = (en ? T[1] : T[0]).replace('{e}', c[2] || '').replace('{n}', c[3] || ''); const P9 = TASK_TP[id], tp = P9 ? (en ? P9[1] : P9[0]).replace('{e}', c[2] || '').replace('{n}', c[3] || '') : txt; list.push({ id, why: c.why || null, ev: id === 'work' ? 'work:' + c[1] : id, t: txt, tp, cell: c[0] || '', at: c.at || null, need: T[2], n: 0, rew: T[3], done: false });     });
      for (const id of ['new', 'only']) { const c = ctx[id]; if (!c || !c.t || !c.ev || list.some(q => q.id === c.disc)) continue; const T = TASKS[id];     list.push({ id, why: c.why || null, ev: c.ev, t: c.t[en ? 1 : 0], tp: c.tp ? c.tp[en ? 1 : 0] : c.t[en ? 1 : 0], cell: c[0] || '', at: c.at || null, need: 1, n: 0, rew: T[3], done: false, disc: c.disc || '', isle: !!c.isle, nm: c.nm || '' }); }
      S.tasks = { day: S.day, list, all: false }; dirty = true; return list; },

    taskEv(ev, n = 1) { const T = S.tasks; if (!T || T.day !== S.day) return null; let out = null; for (const t of T.list) { if (t.done || t.ev !== ev) continue; t.n = Math.min(t.need, t.n + n); if (t.n >= t.need) { t.done = true; const r9 = G.rw('money', 'task:' + t.id, t.rew); S.money += r9; S.earned += r9; S.tasksDone = (S.tasksDone || 0) + 1; if (S.today) { S.today.tasks++; S.today.earned += r9; } (out = out || []).push(t); } }
      if (out && !T.all && T.list.every(t => t.done)) { T.all = true; out.all = true; }     if (out) dirty = true; return out; },

    reset() { G.why = ''; if (ro) { G.why = 'ro'; return false; } { let cur = ''; try { cur = JSON.stringify(S); } catch (e) { cur = LS.get(KEY) || ''; } if (cur && !keepOld(KEY, cur)) { G.why = 'full'; return false; } }     const b = S.bag, og = genOf(S); for (const k of Object.keys(b)) delete b[k]; const f = fresh(); f.bag = b; f.gen.dead = genKill(og, og.id);     for (const k of Object.keys(S)) delete S[k]; Object.assign(S, f); acc = 0; ph = phaseOf(S.min); dirty = true; G.flush(); emit('clock'); emit('phase'); return true; },
  };
  return G;
}
