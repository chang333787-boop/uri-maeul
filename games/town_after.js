import { regName } from './town_region.js?v=1';
import { SKILLS, SK_ORDER, levelOf } from './town_skill.js?v=5';
import { EV, yrWord } from './town_season.js?v=6';
import { nightsW } from './town_feast.js?v=8';
export const AFTER_V = 1;
const T2 = (ko, en) => [ko, en];
const keys = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);

export const PROD = { shiitake: '🍄', beehive: '🍯', cabbage: '🥬', potato: '🥔', pasture: '🥛', saltpan: '🧂', paddy: '🍚', strawberry: '🍓', pear: '🍐', fisher: '🐟', clam: '🐚', seaweed: '🌿' };

export const NEEDW = { '🍄': T2('국물을 내려는데 표고가 있으면 좋겠어요.', 'I want shiitake to make soup stock.'), '🍯': T2('목이 아픈 식구에게 꿀차를 타 주고 싶어요.', 'I want to make honey tea for someone with a sore throat.'),
  '🥬': T2('김치를 담그려는데 배추가 모자라요.', 'I am short of cabbage for making kimchi.'), '🥔': T2('감자조림을 하려는데 감자가 없어요.', 'I want to make braised potatoes but have none.'), '🥛': T2('아이들 간식으로 우유가 필요해요.', 'I need milk for the children’s snack.'),
  '🧂': T2('장을 담글 소금이 떨어졌어요.', 'I ran out of salt for making sauces.'), '🍚': T2('떡을 하려는데 쌀이 모자라요.', 'I am short of rice for making rice cakes.'), '🍓': T2('손님상에 딸기를 내고 싶어요.', 'I want to serve strawberries to guests.'),
  '🍐': T2('감기 든 식구에게 배숙을 해 주고 싶어요.', 'I want to make steamed pear for someone with a cold.'), '🐟': T2('오랜만에 생선구이가 먹고 싶어요.', 'I would love some grilled fish.'), '🐚': T2('조개로 시원한 국을 끓이고 싶어요.', 'I want to make a clam soup.'), '🌿': T2('김밥을 싸려는데 김이 없어요.', 'I want to make gimbap but have no laver.') };

export const MASTER = { strawberry: ['🍓', T2('딸기 장인', 'Strawberry master')], shiitake: ['🍄', T2('표고 장인', 'Shiitake master')], cabbage: ['🥬', T2('배추 장인', 'Cabbage master')], potato: ['🥔', T2('감자 장인', 'Potato master')],
  clam: ['🐚', T2('조개 캐기 장인', 'Clam-digging master')], beehive: ['🍯', T2('꿀 뜨기 장인', 'Honey master')], pear: ['🍐', T2('배 농사 장인', 'Pear master')], lumber: ['🌲', T2('나무 심기 장인', 'Tree-planting master')],
  plant: ['🌱', T2('모내기 장인', 'Rice-planting master')], cut: ['🌾', T2('벼 베기 장인', 'Rice-cutting master')], tuho: ['🎯', T2('투호 명수', 'Tuho champion')], seaweed: ['🌿', T2('김 장인', 'Laver master')], oyster: ['🐚', T2('굴 장인', 'Oyster master')],
  pasture: ['🐑', T2('목장 장인', 'Ranch master')], fisher: ['🐟', T2('낚시 명수', 'Fishing champion')], saltpan: ['🧂', T2('소금 장인', 'Salt master')], cook: ['🍳', T2('부엌 장인', 'Kitchen master')], fire: ['🚒', T2('꼬마 소방 반장', 'Junior fire captain')] };
const MARK_K = { plant: 'paddy', cut: 'paddy' };
export const SKMASTER = { work: T2('일솜씨 장인', 'Helping-hands master'), cook: T2('요리 장인', 'Cooking master'), farm: T2('텃밭 장인', 'Garden master'), look: T2('관찰 장인', 'Nature-watching master'), trade: T2('살림 장인', 'Market master'), explore: T2('길잡이 장인', 'Pathfinder master') };
const FLAGC = [0xc8423a, 0x2f6fd0, 0x2f8a4e, 0xe0a92e, 0x7d5bb8, 0xd9822b];

export const isMaster = (key, best) => !!(best && (key === 'fire' ? best.lv >= 5 : best.lv >= 5 || (best.lv >= 4 && (best.g | 0) >= 2)));

export function pickChain(byReg, rnd) { const R = keys(byReg).filter(r => byReg[r].length); if (R.length < 3) return null; const has = (r, e) => byReg[r].some(q => q.e === e);
  for (let t = 0; t < 60; t++) { const sh = R.slice().sort(() => rnd() - 0.5), [ra, rb, rc] = sh, pa = byReg[ra][(rnd() * byReg[ra].length) | 0], pb = byReg[rb][(rnd() * byReg[rb].length) | 0], pc = byReg[rc][(rnd() * byReg[rc].length) | 0];
    if (pa.e === pb.e || pb.e === pc.e || pa.e === pc.e) continue; if (has(ra, pb.e) || has(rb, pc.e) || has(rc, pa.e)) continue;
    return { A: pa.w, B: pb.w, C: pc.w, a: pa.e, b: pb.e, c: pc.e, ra, rb, rc }; } return null; }

export function createAfter(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t ?? '')), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, min = () => G().min | 0, mark = () => A.GAME.mark();
  const S = () => { const g = G(); let s = g.aft; if (!s || typeof s !== 'object' || s.v !== AFTER_V) s = g.aft = { v: AFTER_V, tr: { d: -1, n: 0, ph: -1, done: 0, log: [] }, ti: { got: {}, pick: '', at: {}, gd: {} } };
    if (!s.tr || typeof s.tr !== 'object') s.tr = { d: -1, n: 0, ph: -1, done: 0, log: [] }; if (!Array.isArray(s.tr.log)) s.tr.log = []; if (!s.ti || typeof s.ti !== 'object') s.ti = { got: {}, pick: '', at: {}, gd: {} };
    for (const k of ['got', 'at', 'gd']) if (!s.ti[k] || typeof s.ti[k] !== 'object') s.ti[k] = {}; return s; };
  let dead = false, talking = false, away = false, MARKS = null, MKEY = '', ttlT = 0, chipK = null, TQ = [];     const DBG = [];
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  const ask = o => (TQ.length ? Promise.resolve(TQ.shift()) : A.dialog(o));
  const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };
  const ro = w => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'; };
  const rnd = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); return ((h >>>= 0) % 100000) / 100000; }; };
  const iN = e => ((A.item && A.item(e)) || [e, e])[en() ? 1 : 0];
  const has = e => (A.count ? A.count(e) : (G().bag || {})[e] | 0) > 0;
  const rN = r => regName(r, en()) || r;

  const T = () => S().tr;
  const W9 = () => (A.workers ? A.workers() : []).filter(w => w && w.k && w.r);
  const findW = q => { if (!q) return null; let b = null, bd = 4; for (const w of W9()) { if (w.k !== q.k) continue; const d = Math.hypot(w.x - q.x, w.z - q.z); if (d < bd) { bd = d; b = w; } } return b; };
  const ref = w => ({ k: w.k, x: +w.x.toFixed(1), z: +w.z.toFixed(1), r: w.r });
  const whoN = q => { const w = findW(q); return w ? A.who(w) : (A.job ? A.job(q.k) : q.k); };
  const spot = q => { const w = findW(q); return w ? [w.hx ?? w.x, w.hz ?? w.z] : null; };
  function byReg() { const B = {}; for (const w of W9()) { const e = PROD[w.k]; if (!e) continue; (B[w.r] || (B[w.r] = [])).push({ w, e }); } return B; }
  const jobsOf = r => { const seen = []; for (const w of W9()) if (w.r === r && A.job && !seen.includes(A.job(w.k)) && PROD[w.k]) seen.push(A.job(w.k)); return seen.slice(0, 3); };
  const endOK = () => !!(A.storyDone && A.storyDone());

  function gen(force) { const t = T(), d = day(); if (!force && t.d === d) return; if (!force && t.ph >= 1 && t.ph <= 7) return;
    const ch = pickChain(byReg(), rnd('trd:' + d + ':' + (t.n | 0)));
    if (!ch) { Object.assign(t, { d, ph: -1 }); mark(); log('gen none'); return; }
    Object.assign(t, { d, n: (t.n | 0) + 1, ph: 0, A: ref(ch.A), B: ref(ch.B), C: ref(ch.C), a: ch.a, b: ch.b, c: ch.c, wr: 0, re: 0 }); mark(); log('gen ' + ch.ra + ch.a + ' ' + ch.rb + ch.b + ' ' + ch.rc + ch.c); }
  const titleOfTr = () => { const t = T(), e = en(); return e ? 'Area exchange: ' + iN(t.b).toLowerCase() + ' for ' + rN(t.A.r) : '동네 교류: ' + rN(t.A.r) + '에 ' + iN(t.b) + jo(iN(t.b), '을', '를'); };
  function todo() { const t = T(), e = en(); if (!t.A) return ''; const ra = rN(t.A.r), rb = rN(t.B.r), rc = rN(t.C.r);
    switch (t.ph) { case 1: return '🔄 ' + (e ? 'Go to ' + whoN(t.A) + ' in ' + ra : ra + ' ' + whoN(t.A) + '에게 가요');
      case 2: return '🤔 ' + (e ? 'Where does ' + iN(t.b).toLowerCase() + ' come from?' : iN(t.b) + jo(iN(t.b), '은', '는') + ' 어느 동네에서 날까요?');
      case 3: return '🔄 ' + (e ? 'Go to ' + whoN(t.B) + ' in ' + rb : rb + ' ' + whoN(t.B) + '에게 가요');
      case 4: return '🤔 ' + (e ? 'Where does ' + iN(t.c).toLowerCase() + ' come from?' : iN(t.c) + jo(iN(t.c), '은', '는') + ' 어느 동네에서 날까요?');
      case 5: return '🔄 ' + (has(t.a) ? (e ? 'Take ' + iN(t.a).toLowerCase() + ' to ' + whoN(t.C) + ' in ' + rc : rc + ' ' + whoN(t.C) + '에게 ' + iN(t.a) + jo(iN(t.a), '을', '를') + ' 가져가요') : (e ? 'Get ' + iN(t.a).toLowerCase() + ' again from ' + whoN(t.A) : ra + ' ' + whoN(t.A) + '에게 ' + iN(t.a) + jo(iN(t.a), '을', '를') + ' 다시 받아요'));
      case 6: return '🔄 ' + (e ? 'Take ' + iN(t.c).toLowerCase() + ' to ' + whoN(t.B) + ' in ' + rb : rb + ' ' + whoN(t.B) + '에게 ' + iN(t.c) + jo(iN(t.c), '을', '를') + ' 가져가요');
      case 7: return '🎁 ' + (e ? 'Bring ' + iN(t.b).toLowerCase() + ' to ' + whoN(t.A) + ' in ' + ra : ra + ' ' + whoN(t.A) + '에게 ' + iN(t.b) + jo(iN(t.b), '을', '를') + ' 드려요'); }
    return ''; }
  const tgt = () => { const t = T(); if (!t.A) return null; const q = t.ph === 1 || t.ph === 7 || (t.ph === 5 && !has(t.a) && !t.re) ? t.A : t.ph === 3 || t.ph === 6 ? t.B : t.ph === 5 ? t.C : null; return q; };
  function routeNow() { const q = tgt(); if (!q) return false; const p = spot(q); if (!p) return false; A.route({ icon: '🔄', name: whoN(q), door: p }); return true; }
  function chipNow() { const t = T(), tx = todo(); if (!tx || !(t.ph >= 1 && t.ph <= 7)) { if (chipK !== '') { A.chip('twn-trd', null); chipK = ''; } return; } if (chipK === tx) return; chipK = tx;
    A.chip('twn-trd', tx, { onClick: () => { const t9 = T(); if (t9.ph === 2 || t9.ph === 4) choose(); else routeNow(); } }); }
  function setPh(n, line) { const t = T(); t.ph = n; mark(); log('ph ' + n); chipK = null; chipNow(); if (line) A.say(line, 3.4, 1); if (n === 3 || n === 5 || n === 6 || n === 7) routeNow(); }

  async function choose() { const t = T(), e = en(); if (talking || !(t.ph === 2 || t.ph === 4)) return; const which = t.ph === 2 ? 'b' : 'c', item = t[which], right = (which === 'b' ? t.B : t.C).r, by = byReg();
    const regs = keys(by).filter(r => r !== right && !by[r].some(q => q.e === item)), R9 = rnd('trc:' + t.n + ':' + which), others = regs.sort(() => R9() - 0.5).slice(0, 2);
    let opts = [right, ...others].sort(() => R9() - 0.5); const who = e ? 'Exchange note' : '교류 쪽지'; talking = true;
    try { for (let k = 0; k < 6; k++) { const C9 = opts.map(r => [r, rN(r) + ' — ' + (jobsOf(r).join(', ') || (e ? 'no work spots' : '일터 없음'))]);
        const r = await ask({ who, icon: '🗺', cap: '🔄 ' + titleOfTr(), text: [e ? 'Where does ' + iN(item).toLowerCase() + ' come from? Look at what people do in each area.' : iN(item) + jo(iN(item), '은', '는') + ' 어느 동네에서 날까요? 동네마다 하는 일을 보고 골라요.'], choices: C9 });
        if (dead || T() !== t || !(t.ph === 2 || t.ph === 4)) return; if (r == null) { log('choose closed'); return; }
        if (r === right) { const p = which === 'b' ? 3 : 5, w = which === 'b' ? t.B : t.C; A.sfx('ding'); A.rec('trade', { ev: 'pick', s: which, ok: 1 });
          setPh(p, '✅ ' + (e ? 'Yes — ' + iN(item).toLowerCase() + ' comes from ' + rN(right) + '. Follow the red line to ' + whoN(w) + '.' : '맞아요. ' + iN(item) + jo(iN(item), '은', '는') + ' ' + rN(right) + '에서 나요. 빨간 선을 따라 ' + whoN(w) + '에게 가요.')); return; }
        t.wr = (t.wr | 0) + 1; mark(); A.sfx('pop'); A.rec('trade', { ev: 'pick', s: which, ok: 0 });
        await ask({ who, icon: '🗺', text: [e ? rN(r) + ' has ' + (jobsOf(r).join(', ') || 'no work spots') + '. ' + iN(item) + ' does not come from there.' : rN(r) + '에는 ' + (jobsOf(r).join(', ') || '일터가 없') + (jobsOf(r).length ? jo(jobsOf(r).slice(-1)[0], '이', '가') + ' 있어요' : '어요') + '. ' + iN(item) + jo(iN(item), '은', '는') + ' 거기서 안 나요.'] });
        if (dead || T() !== t) return; if (opts.length > 2) opts = opts.filter(q => q !== r); } } finally { talking = false; } }

  async function talk() { const t = T(), e = en(), q = tgt(); if (!q || talking) return; const w = findW(q); if (!w) return; const nm = whoN(q), fc = A.face ? A.face(q.k) : '🙂', cap = '🔄 ' + titleOfTr();
    if (A.open && !A.open(w)) { const H = A.hrs ? A.hrs(w.k) : [7, 19]; A.say('🌙 ' + (e ? nm + ' is resting now. Come back at ' + H[0] + ':00.' : nm + jo(nm, '은', '는') + ' 지금 쉬는 때예요. ' + H[0] + '시에 와요.'), 3); away = true; return; }
    talking = true; let r = null, then = null;
    try {
      if (t.ph === 1) { r = await ask({ who: nm, icon: fc, cap, text: [L(NEEDW[t.b]) + ' ' + (e ? 'But no ' + iN(t.b).toLowerCase() + ' comes from here in ' + rN(t.A.r) + '.' : '그런데 우리 ' + rN(t.A.r) + '에선 ' + iN(t.b) + jo(iN(t.b), '이', '가') + ' 안 나요.'), e ? 'Take one ' + iN(t.a).toLowerCase() + ' from our area and trade for it?' : '우리 동네 ' + iN(t.a) + ' 하나를 줄게요. 바꿔 와 줄래요?'], choices: [['ok', e ? 'Sure, I will go' : '좋아요, 다녀올게요'], ['no', e ? 'Not now' : '다음에']] });
        if (r !== 'ok' || T() !== t) { away = true; return; } A.add(t.a, 1, 'mv:trade'); A.sfx('pop'); setPh(2); then = choose; return; }
      if (t.ph === 5 && !has(t.a)) { if (q !== t.A || t.re) { A.say('🔄 ' + (e ? 'First get ' + iN(t.a).toLowerCase() + ' — help at work or try the market.' : '먼저 ' + iN(t.a) + jo(iN(t.a), '을', '를') + ' 챙겨 와요. 일을 거들거나 장터에서 구할 수 있어요.'), 3.4); away = true; return; }
        await ask({ who: nm, icon: fc, cap, text: [e ? 'Oh, you need another ' + iN(t.a).toLowerCase() + '? Here, take one more.' : iN(t.a) + jo(iN(t.a), '이', '가') + ' 또 필요해요? 하나 더 줄게요.'] }); if (T() !== t) return; t.re = 1; A.add(t.a, 1, 'mv:trade'); mark(); setPh(5); return; }
      if (t.ph === 3) { await ask({ who: nm, icon: fc, cap, text: [e ? 'You came for ' + iN(t.b).toLowerCase() + '? We have plenty here in ' + rN(t.B.r) + '.' : iN(t.b) + jo(iN(t.b), '을', '를') + ' 구하러 왔어요? 우리 ' + rN(t.B.r) + '엔 많아요.', L(NEEDW[t.c]) + ' ' + (e ? 'No ' + iN(t.c).toLowerCase() + ' comes from here. Bring me some and I will trade.' : '우리 동네에선 ' + iN(t.c) + jo(iN(t.c), '이', '가') + ' 안 나요. ' + iN(t.c) + jo(iN(t.c), '을', '를') + ' 가져오면 바꿔 줄게요.')] });
        if (T() !== t) return; setPh(4); then = choose; return; }
      if (t.ph === 5) { r = await ask({ who: nm, icon: fc, cap, text: [e ? iN(t.a) + ' from ' + rN(t.A.r) + '! None of that comes from here in ' + rN(t.C.r) + '. I will trade you our ' + iN(t.c).toLowerCase() + '.' : rN(t.A.r) + ' ' + iN(t.a) + jo(iN(t.a), '이', '') + '네요! 우리 ' + rN(t.C.r) + '에선 ' + iN(t.a) + jo(iN(t.a), '이', '가') + ' 안 나요. 우리 ' + iN(t.c) + jo(iN(t.c), '과', '와') + ' 바꿔 줄게요.'], choices: [['give', t.a + ' ' + iN(t.a) + (e ? ' — give' : ' 주기')], ['no', e ? 'Not now' : '다음에']] });
        if (r !== 'give' || T() !== t || !A.take(t.a)) { away = true; return; } A.add(t.c, 1, 'mv:trade'); A.sfx('pop'); A.rec('trade', { ev: 'swap', s: 'C' }); setPh(6, '🔄 ' + (e ? 'You got ' + iN(t.c).toLowerCase() + '. Take it to ' + whoN(t.B) + ' in ' + rN(t.B.r) + '.' : iN(t.c) + jo(iN(t.c), '을', '를') + ' 받았어요. ' + rN(t.B.r) + ' ' + whoN(t.B) + '에게 가져가요.')); return; }
      if (t.ph === 6) { if (!has(t.c)) { A.say('🔄 ' + (e ? 'Bring ' + iN(t.c).toLowerCase() + ' first.' : '먼저 ' + iN(t.c) + jo(iN(t.c), '을', '를') + ' 가져와요.'), 3); away = true; return; }
        r = await ask({ who: nm, icon: fc, cap, text: [e ? iN(t.c) + '! Thank you. Here is the ' + iN(t.b).toLowerCase() + ' I promised.' : iN(t.c) + jo(iN(t.c), '이', '') + '네요! 고마워요. 약속한 ' + iN(t.b) + jo(iN(t.b), '이에요', '예요') + '.'], choices: [['give', t.c + ' ' + iN(t.c) + (e ? ' — give' : ' 주기')], ['no', e ? 'Not now' : '다음에']] });
        if (r !== 'give' || T() !== t || !A.take(t.c)) { away = true; return; } A.add(t.b, 1, 'mv:trade'); A.sfx('pop'); A.rec('trade', { ev: 'swap', s: 'B' }); setPh(7, '🔄 ' + (e ? 'You got ' + iN(t.b).toLowerCase() + '. Bring it to ' + whoN(t.A) + ' in ' + rN(t.A.r) + '.' : iN(t.b) + jo(iN(t.b), '을', '를') + ' 받았어요. ' + rN(t.A.r) + ' ' + whoN(t.A) + '에게 드려요.')); return; }
      if (t.ph === 7) { if (!has(t.b)) { A.say('🎁 ' + (e ? 'Bring ' + iN(t.b).toLowerCase() + ' first.' : '먼저 ' + iN(t.b) + jo(iN(t.b), '을', '를') + ' 가져와요.'), 3); away = true; return; }
        r = await ask({ who: nm, icon: fc, cap, text: [e ? iN(t.b) + '! You really brought it. Thank you.' : iN(t.b) + jo(iN(t.b), '이', '') + '네요! 정말 구해 왔군요. 고마워요.'], choices: [['give', t.b + ' ' + iN(t.b) + (e ? ' — give' : ' 드리기')], ['no', e ? 'Not now' : '다음에']] });
        if (r !== 'give' || T() !== t || !A.take(t.b)) { away = true; return; } then = () => finishTr(nm, fc); return; }
    } finally { talking = false; if (then && !dead) then(); } }
  async function finishTr(nm, fc) { const t = T(), e = en(), ra = rN(t.A.r), rb = rN(t.B.r), rc = rN(t.C.r);
    t.ph = 9; t.done = (t.done | 0) + 1; t.log.push({ d: day(), r: [t.A.r, t.B.r, t.C.r], e: [t.a, t.b, t.c] }); while (t.log.length > 12) t.log.shift(); mark(); chipK = null; chipNow();
    const got = A.earn ? A.earn(300, 'trade:done') : 0; for (const q of [t.A, t.B, t.C]) { const w = findW(q); if (w && A.heart) A.heart(w, 1, 'trade:done'); } if (A.skUp) A.skUp('trade', 3, 'trade:done');
    A.sfx('done'); A.rec('trade', { ev: 'done', r: [t.A.r, t.B.r, t.C.r], e: [t.a, t.b, t.c], wr: t.wr | 0 }); log('done ' + got);
    const line = e ? 'Three areas swapped what each one lacks: ' + iN(t.a).toLowerCase() + ' from ' + ra + ' went to ' + rc + ', ' + iN(t.c).toLowerCase() + ' from ' + rc + ' went to ' + rb + ', and ' + iN(t.b).toLowerCase() + ' from ' + rb + ' came to ' + ra + '.'
      : '세 동네가 서로 없는 것을 주고받았어요. ' + ra + ' ' + iN(t.a) + jo(iN(t.a), '은', '는') + ' ' + rc + ro(rc) + ', ' + rc + ' ' + iN(t.c) + jo(iN(t.c), '은', '는') + ' ' + rb + ro(rb) + ', ' + rb + ' ' + iN(t.b) + jo(iN(t.b), '은', '는') + ' ' + ra + ro(ra) + ' 갔어요.';
    A.banner('🔄 ' + (e ? 'Exchange done: ' + ra + ', ' + rb + ' and ' + rc + ' are linked' : '교류 끝: ' + ra + ', ' + rb + ', ' + rc + jo(rc, '이', '가') + ' 이어졌어요') + (got > 0 ? '  💰 +' + got : ''), 4.5);
    if (got <= 0) A.say(e ? '💰 You have earned plenty today. You can keep playing.' : '💰 오늘은 충분히 모았어요. 놀이는 계속할 수 있어요.', 3);
    if (A.diary) A.diary('🔄', line); await ask({ who: nm, icon: fc, text: [line, e ? 'When areas make different things, they need each other. That is exchange.' : '동네마다 나는 것이 달라서 서로 필요해요. 이렇게 주고받는 것을 교류라고 해요.'] }); }
  function boardHtml() { if (!endOK()) return ''; gen(); const t = T(), e = en(); if (t.ph < 0 || !t.A) return '';
    const row = (btn, sub) => '<div data-trd="1" style="display:flex;gap:10px;align-items:flex-start;border:2px solid #2b2420;border-left:8px solid #3b6fb6;border-radius:12px;background:#fffdf6;padding:8px 10px;margin:6px 0"><div style="font-size:28px">🔄</div><div style="flex:1"><b>' + esc(titleOfTr()) + '</b> <span class="sm">' + esc((e ? 'from ' : '보낸 사람 ') + whoN(t.A) + ' (' + rN(t.A.r) + ')') + '</span><div class="sm">' + esc(sub) + '</div></div>' + btn + '</div>';
    if (t.ph === 9) return row('<span class="sm">📜</span>', e ? 'Done today. A new exchange request goes up tomorrow morning.' : '오늘 교류 의뢰를 마쳤어요. 내일 아침 새 의뢰가 붙어요.');
    const sub = t.ph === 0 ? (e ? 'No ' + iN(t.b).toLowerCase() + ' comes from ' + rN(t.A.r) + '. Link three areas to trade for it.' : rN(t.A.r) + '에선 ' + iN(t.b) + jo(iN(t.b), '이', '가') + ' 안 나요. 세 동네를 이어 바꿔 와요.') : todo();
    return row('<button class="pri" data-rq="100">' + (t.ph === 0 ? (e ? 'Take it' : '맡기') : (e ? 'Continue' : '이어 하기')) + '</button>', sub); }
  function go() { const t = T(), e = en(); if (!endOK()) { A.say(e ? '🔄 Exchange requests open after the town story ends.' : '🔄 동네 교류 의뢰는 마을 이야기를 다 마친 뒤에 붙어요.', 3); return true; } gen();
    if (t.ph === 0) { setPh(1); A.say('🔄 ' + todo().replace(/^\S+ /, '') + (e ? ' — follow the red line.' : ' — 빨간 선을 따라가요.'), 3.4, 1); routeNow(); return true; }
    if (t.ph === 2 || t.ph === 4) { choose(); return true; } if (t.ph >= 1 && t.ph <= 7) { if (!routeNow()) A.say(todo(), 3); return true; }
    A.say(t.ph === 9 ? (e ? '🔄 Done today. A new request goes up tomorrow morning.' : '🔄 오늘 교류 의뢰는 마쳤어요. 내일 아침 새 의뢰가 붙어요.') : (e ? '🔄 This town needs three areas with work spots for exchange requests.' : '🔄 이 마을엔 일터가 있는 동네가 셋 넘게 있어야 교류 의뢰가 붙어요.'), 3); return true; }
  function trSec() { const t = T(); if (!endOK()) return; gen(); chipNow(); if (!(t.ph >= 1 && t.ph <= 7) || talking || t.ph === 2 || t.ph === 4) return;
    const q = tgt(); if (!q) return; if (!findW(q)) { log('worker gone'); Object.assign(t, { d: -1, ph: -1 }); mark(); gen(true); return; }
    const p = spot(q), me = A.me(), d = p ? Math.hypot(p[0] - me.x, p[1] - me.z) : 99; if (d > 8) away = false; if (away || d > 5.5 || A.busy() || A.panel()) return; talk(); }

  const TI = () => S().ti;
  function earned() { const g = G(), out = []; const M = g.lad && g.lad.mg && typeof g.lad.mg === 'object' ? g.lad.mg : {};
    for (const k of keys(MASTER)) { const L9 = M[k]; if (L9 && isMaster(k, L9.best)) out.push('lad:' + k); }
    for (const k of SK_ORDER) if (levelOf((g.skill || {})[k]).L >= 10) out.push('sk:' + k); return out; }
  const tName = key => { const [f, k] = key.split(':'); return f === 'lad' ? (MASTER[k] ? MASTER[k][0] + ' ' + L(MASTER[k][1]) : key) : SKMASTER[k] ? SKILLS[k].icon + ' ' + L(SKMASTER[k]) : key; };
  const tPair = key => { const [f, k] = key.split(':'); return f === 'lad' ? (MASTER[k] ? [MASTER[k][0] + ' ' + MASTER[k][1][0], MASTER[k][0] + ' ' + MASTER[k][1][1]] : null) : SKMASTER[k] ? [SKILLS[k].icon + ' ' + SKMASTER[k][0], SKILLS[k].icon + ' ' + SKMASTER[k][1]] : null; };
  const markW = key => { const [f, k] = key.split(':'); if (f !== 'lad') return null; const wk = MARK_K[k] || k; return W9().find(w => w.k === wk) || null; };

  function markAt(key, i) { const ti = TI(); if (ti.at[key] !== undefined) return ti.at[key] || null; const w = markW(key), h = w ? [w.hx ?? w.x, w.hz ?? w.z] : A.home ? A.home() : null; if (!h) return null;
    const taken = keys(ti.at).map(k => ti.at[k]).filter(Boolean);
    for (const rr of w ? [2.4, 3.4, 4.6, 6.5, 9, 12, 16, 21] : [2.6 + (i % 4) * 0.9, 3.6, 4.6, 6]) { let best = null;
      for (let a = 0; a < 12; a++) { const an = a * Math.PI / 6 + (w ? 0.3 : i * 0.7), x = h[0] + Math.cos(an) * rr, z = h[1] + Math.sin(an) * rr; if (taken.some(q => Math.hypot(q[0] - x, q[1] - z) < 1.2)) continue; if (A.free && !A.free(x, z)) continue; const sc = A.roadD ? A.roadD(x, z) : 0; if (!best || sc < best[2]) best = [x, z, sc]; }
      if (best) { ti.at[key] = [+best[0].toFixed(2), +best[1].toFixed(2)]; mark(); return ti.at[key]; } }
    ti.at[key] = 0; mark(); return null; }
  function buildMarks() { const ks = keys(TI().got).sort(); if (!ks.length || !A.parts) { if (MARKS) dropMarks(); MKEY = ''; return; }
    const P = []; ks.forEach((key, i) => { const at = markAt(key, i); if (at) P.push([key, at, i]); });
    const k9 = P.map(q => q[0] + '@' + q[1].join(',')).join(';'); if (k9 === MKEY) return; MKEY = k9; dropMarks(); if (!P.length) return;
    const g = A.parts(p => { for (const [key, at, i] of P) { const [x, z] = at, y = A.gy(x, z), c = FLAGC[(key.length + i) % FLAGC.length];
      p('c', x, y, z, 0.2, 0.14, 0, 0x8d8a80); p('c', x, y + 0.14, z, 0.05, 2.8, 0, 0x6b4a2f); p('b', x + 0.48, y + 2.1, z, 0.92, 0.62, 0.03, c); p('s', x + 0.48, y + 2.41, z + 0.02, 0.12, 1, 0, 0xfbf7ec); p('s', x, y + 3.0, z, 0.11, 1, 0, 0xe9b04a); } });
    g.userData.fx = 1; A.add3(g); MARKS = g; log('marks ' + P.length); }
  function dropMarks() { if (!MARKS) return; A.del3(MARKS); MARKS.traverse(o => { if (o.geometry) o.geometry.dispose(); }); MARKS = null; }
  function tiSec() { const ti = TI(), E9 = earned(), e = en(); let neu = null;
    for (const key of E9) if (ti.got[key] == null) { ti.got[key] = day(); if (!ti.pick) ti.pick = key; neu = key; A.rec('title', { k: key }); }
    if (neu) { mark(); buildMarks(); const at = ti.at[neu], w = markW(neu), nm = tName(neu); A.sfx('done');
      A.banner('🏅 ' + (e ? 'New title: ' + nm + (at ? (w ? ' — a master’s flag now stands by the ' + (A.job ? A.job(w.k).toLowerCase() : 'work spot') : ' — a master’s flag now stands by our house') : '') : '새 칭호 「' + nm + '」' + (at ? (w ? ' — ' + (A.job ? A.job(w.k) + ' 일터' : '일터') + ' 곁에 장인 깃발이 섰어요' : ' — 우리 집 앞에 장인 깃발이 섰어요') : '')), 5);
      if (A.diary) A.diary('🏅', e ? 'Became ' + nm : nm + jo(nm, '이', '가') + ' 되었어요');
      if (at) { A.chip('twn-ttl', '🏅 ' + (e ? 'See the flag' : '장인 깃발 보기'), { onClick: () => { A.chip('twn-ttl', null); A.route({ icon: '🏅', name: nm, door: at }); } }); ttlT = performance.now(); } }
    else buildMarks();
    if (ttlT && performance.now() - ttlT > 90000) { A.chip('twn-ttl', null); ttlT = 0; }

    const me = A.me(); for (const key of keys(ti.got)) { if (ti.gd[key] === day()) continue; const w = markW(key); if (!w || (A.open && !A.open(w))) continue; if (Math.hypot((w.hx ?? w.x) - me.x, (w.hz ?? w.z) - me.z) > 8) continue;
      ti.gd[key] = day(); mark(); const nm = L(tPair(key) || ['', '']).replace(/^\S+ /, ''); if (A.bubble) A.bubble(w, e ? 'Our ' + nm.toLowerCase() + ' is here!' : nm + jo(nm, '이', '가') + ' 왔네요! 반가워요.'); break; } }

  function nearTitles() { const g = G(), M = g.lad && g.lad.mg && typeof g.lad.mg === 'object' ? g.lad.mg : {}, got = TI().got, out = [];
    for (const k of keys(MASTER)) { const L9 = M[k]; if (!L9 || !L9.best || got['lad:' + k] != null) continue; out.push([L9.best.lv * 10 + (L9.best.g | 0), k, L9.best.lv]); }
    out.sort((a, b) => b[0] - a[0]); return out.slice(0, 2).map(([, k, lv]) => ({ k, lv, need: k === 'fire' ? 5 : 4, nm: MASTER[k][0] + ' ' + L(MASTER[k][1]) })); }
  function titleOpen() { const ti = TI(), e = en(), ks = keys(ti.got).sort((a, b) => ti.got[a] - ti.got[b]), N = nearTitles();
    const rows = ks.map(key => { const w = markW(key), at = ti.at[key]; return '<div class="ttl-row" style="border:2px solid #2b2420;border-left:8px solid #e9b04a;border-radius:10px;padding:6px 9px;margin:6px 0;background:#fffdf6"><b>' + esc(tName(key)) + '</b>' + (ti.pick === key ? ' <span class="sm">' + (e ? '(showing)' : '(쓰는 중)') + '</span>' : '')
      + '<div class="sm">' + esc(at ? (w ? (e ? 'Flag by the ' + (A.job ? A.job(w.k).toLowerCase() + ' spot' : 'work spot') : (A.job ? A.job(w.k) + ' 일터' : '일터') + ' 곁에 장인 깃발') : (e ? 'Flag in front of our house' : '우리 집 앞에 장인 깃발')) : (e ? 'No flag spot nearby' : '깃발 세울 빈 땅이 없어요')) + '</div>'
      + '<div class="row" style="justify-content:flex-start">' + (ti.pick !== key ? '<button class="sub" data-tp="' + esc(key) + '">' + (e ? 'Use this title' : '이 칭호 쓰기') + '</button>' : '') + (at ? '<button class="sub" data-tg="' + esc(key) + '">🧭 ' + (e ? 'Go to the flag' : '깃발 가는 길') + '</button>' : '') + '</div></div>'; }).join('');
    const near = N.map(q => '<div class="sm">' + esc(e ? q.nm + ': you reached challenge step ' + q.lv + '. Do well at step ' + q.need + ' to become one.' : q.nm + ': 도전 ' + q.lv + '칸까지 해냈어요. ' + q.need + '칸을 잘 해내면 될 수 있어요.') + '</div>').join('');
    const h = '<h3>🏅 ' + (e ? 'Master titles' : '장인 칭호') + '</h3><div class="sm">' + esc(e ? 'Do well at the top challenge step of a job, or reach skill level ten, and you become a master. A flag goes up in town and the neighbours there notice.' : '일 놀이 도전 사다리 맨 위 칸을 잘 해내거나 솜씨가 10레벨에 닿으면 장인이 돼요. 마을에 장인 깃발이 서고, 그 일터 이웃이 알아봐요.') + '</div>'
      + (rows || '<div class="sm" style="margin:6px 0;font-weight:800">' + esc(e ? 'No master title yet.' : '아직 장인 칭호가 없어요.') + '</div>') + (near ? '<div class="grp">' + (e ? 'Close to a title' : '가까운 칭호') + '</div>' + near : '')
      + '<div class="row">' + (ti.pick ? '<button class="sub" data-tp="-">' + (e ? 'Hide my title' : '칭호 안 쓰기') + '</button>' : '') + '<button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P = A.openP(h, false, 'title'); if (!P) return null; P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.tp) { ti.pick = b.dataset.tp === '-' ? '' : b.dataset.tp; mark(); titleOpen(); return; } if (b.dataset.tg) { const at = ti.at[b.dataset.tg]; A.closeP(); if (at) A.route({ icon: '🏅', name: tName(b.dataset.tg), door: at }); } }; log('title open'); return P; }

  function seasonOpen() { const SS = A.season ? A.season() : null, e = en(); if (SS && SS.info && SS.info().id) { SS.open(); return; }
    const q = SS && SS.nextEv ? SS.nextEv(35) : null, past = (G().season && Array.isArray(G().season.past) ? G().season.past : []).slice(-3).reverse();
    const head = !SS ? (e ? 'Seasonal days are getting ready.' : '계절 행사를 준비하는 중이에요.') : !q ? (e ? 'The season calendar is paused now, so no seasonal day is coming.' : '지금은 계절 달력이 멈춰 있어서 다가오는 계절 행사가 없어요.')
      : q.ic + ' ' + (q.today ? (e ? 'Today is ' + q.t + (q.yr >= 2 ? ' (' + yrWord(q.yr, 1) + ')' : '') : '오늘은 ' + q.t + (q.yr >= 2 ? '(' + yrWord(q.yr) + ')' : '')) : e ? q.t + (q.yr >= 2 ? ' (' + yrWord(q.yr, 1) + ')' : '') + ' in ' + nightsW(q.i, 1) : q.t + (q.yr >= 2 ? '(' + yrWord(q.yr) + ')' : '') + '까지 ' + nightsW(q.i));
    const y2 = q && q.yr >= 2 ? '<div class="sm" style="border:2px solid #2b2420;border-left:8px solid #7d5bb8;border-radius:10px;padding:6px 9px;margin:6px 0;background:#f4f0fb"><b>' + esc(q.last) + '</b><div>' + esc(q.goal) + '</div><div style="opacity:.85">' + esc(q.fact) + '</div></div>' : q ? '<div class="sm">' + esc(e ? 'After the seasons go round once, each seasonal day comes back as a second-year day with a new goal.' : '계절이 한 바퀴 돌면 같은 행사가 두 번째 해 판으로 돌아와요. 지난해 기록과 견줘 볼 수 있어요.') + '</div>' : '';
    const pl = past.filter(p => p && EV[p.id]).map(p => '<div class="sm">' + esc((e ? 'Done before: ' : '해낸 행사: ') + EV[p.id].ic + ' ' + L(EV[p.id].t) + (p.yr >= 2 ? (e ? ' (' + yrWord(p.yr, 1) + ')' : '(' + yrWord(p.yr) + ')') : '')) + '</div>').join('');
    const P = A.openP('<h3>🗓 ' + (e ? 'Seasonal days' : '계절 행사') + '</h3><div class="sm" style="font-weight:800;margin:4px 0">' + esc(head) + '</div>' + y2 + pl + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'season');
    if (P) P.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; log('season open'); return P; }
  function endRows() { const e = en(), F = A.feast ? A.feast() : null, SS = A.season ? A.season() : null, t = T(), out = [];
    { let s = e ? 'The feast board is getting ready.' : '잔치 게시판을 준비하는 중이에요.'; try { const I = F && F.info(); if (I && I.fd > 0) s = I.day === I.fd ? (e ? 'Today is the feast.' : '오늘이 잔치 날이에요.') : (e ? (F.title ? F.title() : 'Next feast') + ' in ' + nightsW(I.fd - I.day, 1) : (F.title ? F.title() : '다음 잔치') + '까지 ' + nightsW(I.fd - I.day)); } catch (x) {   }
      out.push({ k: 'feast', t: '🎉 ' + (e ? 'Next feast' : '다음 잔치'), s }); }
    { let s = e ? 'Seasonal days are getting ready.' : '계절 행사를 준비하는 중이에요.'; try { const q = SS && SS.nextEv ? SS.nextEv(35) : null; if (SS) s = !q ? (e ? 'The season calendar is paused.' : '계절 달력이 멈춰 있어요.') : q.today ? (e ? 'Today is ' + q.t + (q.yr >= 2 ? ' (' + yrWord(q.yr, 1) + ')' : '') : '오늘은 ' + (q.yr >= 2 ? yrWord(q.yr) + ' ' : '') + q.t) : (e ? q.t + (q.yr >= 2 ? ' (' + yrWord(q.yr, 1) + ')' : '') + ' in ' + nightsW(q.i, 1) : (q.yr >= 2 ? yrWord(q.yr) + ' ' : '') + q.t + '까지 ' + nightsW(q.i)); } catch (x) {   }
      out.push({ k: 'season', t: '🗓 ' + (e ? 'Seasonal days' : '계절 행사'), s }); }
    { gen(); const s = t.ph === 9 ? (e ? 'Done today. New one tomorrow morning.' : '오늘 것은 마쳤어요. 내일 아침 새 의뢰.') : t.ph >= 0 && t.A ? titleOfTr() + (t.ph >= 1 ? (e ? ' (in progress)' : '(하는 중)') : '') : (e ? 'Needs three areas with work spots.' : '일터가 있는 동네가 셋 넘게 있어야 해요.');
      out.push({ k: 'board', t: '🔄 ' + (e ? 'Area exchange' : '동네 교류 의뢰'), s }); }
    { const ks = keys(TI().got), N = nearTitles(); const s = ks.length ? (TI().pick ? tName(TI().pick) : tName(ks[0])) + (ks.length > 1 ? (e ? ' and more' : ' 말고도 더 있어요') : '') : N.length ? (e ? 'Closest: ' + N[0].nm : '가장 가까운 것: ' + N[0].nm) : (e ? 'Reach the top step of a job challenge.' : '일 놀이 도전 사다리 맨 위 칸을 잘 해내면 돼요.');
      out.push({ k: 'title', t: '🏅 ' + (e ? 'Master titles' : '장인 칭호'), s }); }
    return out; }

  function sec() { if (dead || !A.on()) return; try { trSec(); } catch (x) { console.warn('after trade', x); } try { tiSec(); } catch (x) { console.warn('after title', x); } }
  function rebuild() { MKEY = ''; dropMarks(); buildMarks(); }
  function dispose() { dead = true; dropMarks(); A.chip('twn-trd', null); A.chip('twn-ttl', null); }
  return { sec, rebuild, dispose, boardHtml, go, endRows, titleOpen, seasonOpen, todo,
    title: () => { const p = TI().pick; return p && TI().got[p] != null ? tPair(p) : null; },
    info: () => { const t = T(), ti = TI(); return { tr: JSON.parse(JSON.stringify(t)), todo: todo(), chip: chipK, talking, away, ti: JSON.parse(JSON.stringify(ti)), marks: MARKS ? 1 : 0, earned: earned(), near: nearTitles().map(q => q.k), end: endOK() }; },
    dbg: { q: (...a) => { TQ.push(...a); }, tq: () => TQ.slice(), gen: () => gen(true), talk: () => talk(), choose: () => choose(), tgt: () => { const q = tgt(); return q ? spot(q) : null; }, log: () => DBG.slice(),
      why: () => { const q = tgt(), p = q ? spot(q) : null, me = A.me(), w = q ? findW(q) : null; return { ph: T().ph, q: q && q.k, d: p ? +Math.hypot(p[0] - me.x, p[1] - me.z).toFixed(2) : null, me: [+me.x.toFixed(1), +me.z.toFixed(1)], away, talking, busy: !!A.busy(), panel: !!A.panel(), open: w && A.open ? !!A.open(w) : null }; },     chain: () => { const B = byReg(); return keys(B).map(r => r + ':' + B[r].map(q => q.e).join('')); },
      ws: () => W9().filter(w => PROD[w.k]).map(w => ({ k: w.k, x: +w.x.toFixed(1), z: +w.z.toFixed(1), r: w.r, hx: w.hx, hz: w.hz })), set: o => { Object.assign(T(), o); mark(); chipK = null; away = false; chipNow(); } } };
}
