export const hashS = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const voiceOf = hk => hashS(hk) % 4;

export const NB_PLACE = { shiitake: ['표고 재배장', 'shiitake farm'], beehive: ['벌통', 'beehives'], cabbage: ['배추밭', 'cabbage field'], potato: ['감자밭', 'potato field'], pasture: ['목장', 'pasture'], lumber: ['나무 심는 숲', 'tree-planting wood'], saltpan: ['염전', 'salt pan'], paddy: ['논', 'rice paddy'], strawberry: ['딸기 하우스', 'strawberry greenhouse'], pear: ['배 과수원', 'pear orchard'], fisher: ['부두', 'pier'] };

export const VOICE = [
  { id: 'warm', ko: '다정', en: 'Warm',
    greet: ['어서 와요. 천천히 둘러보고 가요.', 'Welcome. Take your time looking around.'],
    mem: ['{m} 그 마음이 참 고마워요.', '{m} That was really kind.'],
    tip: ['{t} 천천히 와요.', '{t} Come by any time.'],
    like: ['{e}{을} 주다니, 제가 좋아하는 거예요. 고마워요.', '{e}! That’s my favourite. Thank you.'],
    ok: ['{e}, 고마워요. 마음이 따뜻해지네요.', '{e}, thank you. That warms my heart.'],
    no: ['저는 {e}{을} 잘 못 먹어요. 마음만 받을게요, 고마워요.', 'I can’t really eat {e}. The thought is enough, thank you.'],
    up: ['{l} 언제든 천천히 와요.', '{l} Come by any time.'],
    rest: ['오늘은 쉬는 날이지요. 천천히 쉬어 가요.', 'It’s a day off today. Rest a while.'] },
  { id: 'bright', ko: '씩씩', en: 'Cheerful',
    greet: ['왔어요! 오늘도 힘내요!', 'You’re here! Let’s do our best today!'],
    mem: ['{m} 덕분에 저도 힘이 나요!', '{m} That gives me energy too!'],
    tip: ['{t} 꼭 기억해 둬요!', '{t} Remember that!'],
    like: ['와, {e}! 딱 먹고 싶던 거예요!', 'Wow, {e}! Just what I wanted!'],
    ok: ['{e}, 고마워요! 힘이 나요!', '{e}, thanks! That gives me energy!'],
    no: ['앗, {e}{은} 제가 잘 못 먹어요. 마음만 받을게요!', 'Oh, I can’t really eat {e}. The thought is enough!'],
    up: ['{l} 오늘도 힘내요!', '{l} Let’s keep going!'],
    rest: ['오늘은 쉬는 날이에요! 푹 쉬고 또 힘내요!', 'Day off today! Rest well and we’ll go again!'] },
  { id: 'careful', ko: '꼼꼼', en: 'Careful',
    greet: ['왔군요. 오늘 할 일부터 살펴보는 중이에요.', 'Ah, you’re here. I’m checking today’s jobs first.'],
    mem: ['{m} 날짜까지 제 수첩에 적어 뒀어요.', '{m} I even wrote the date in my notebook.'],
    tip: ['{t} 제가 살펴보니 그래요.', '{t} I checked.'],
    like: ['{e}{을} 골랐군요. 제가 꼭 갖고 싶던 거예요. 고마워요.', 'You picked {e}. I really wanted that. Thank you.'],
    ok: ['{e}, 잘 받았어요. 고마워요.', '{e}, received with thanks.'],
    no: ['{e}{은} 제가 잘 안 먹어요. 마음만 받을게요.', 'I don’t really eat {e}. The thought is enough.'],
    up: ['{l} 세어 보니 꽤 여러 번 왔네요.', '{l} I counted — you’ve come quite a few times.'],
    rest: ['오늘은 쉬는 날이라 연장을 다 닦아 뒀어요.', 'Day off today, so I cleaned all my tools.'] },
  { id: 'easy', ko: '느긋', en: 'Easygoing',
    greet: ['아, 왔어요? 서두를 것 없어요.', 'Oh, hello. No need to hurry.'],
    mem: ['{m} 그렇게 하나씩 하면 돼요.', '{m} One thing at a time, that’s the way.'],
    tip: ['{t} 서두를 것 없어요.', '{t} No hurry.'],
    like: ['오, {e}. 제가 좋아하는 거예요. 고마워요.', 'Oh, {e}. I like that. Thank you.'],
    ok: ['{e}, 고마워요. 천천히 먹을게요.', '{e}, thanks. I’ll enjoy it slowly.'],
    no: ['음, {e}{은} 제가 잘 못 먹어요. 마음만 받을게요.', 'Hmm, I can’t really eat {e}. The thought is enough.'],
    up: ['{l} 서두를 것 없어요.', '{l} No hurry.'],
    rest: ['오늘은 쉬는 날이에요. 느긋하게 있어요.', 'Day off today. Just taking it easy.'] }];
export const NB_SITS = ['greet', 'mem', 'tip', 'like', 'ok', 'no', 'up', 'rest'];
const LV = [['', ''], ['이제 얼굴을 알겠어요.', 'I know your face now.'], ['이제 이야기도 나눠요.', 'Now we can chat.'], ['이제 단골이네요.', 'You’re a regular now.'], ['늘 챙겨 줘서 고마워요.', 'Thanks for always looking out for me.'], ['이제 단짝 이웃이에요.', 'We’re best neighbours now.']];
const AGAIN = ['오늘은 벌써 받았어요. 마음만 받을게요, 고마워요.', 'You already gave me one today. The thought is enough, thank you.'];

const NO_POOL = ['🥒', '🥕', '🍅', '🌽', '🍠', '🍞', '🍦', '🥤', '🍄', '🐟', '🧂', '🐚', '🌿', '🍃', '🥔', '🍓'];
const MAKES = { shiitake: '🍄', beehive: '🍯', cabbage: '🥬', potato: '🥔', pasture: '🥛', saltpan: '🧂', paddy: '🍚', strawberry: '🍓', pear: '🍐', fisher: '🐟' };

const ICOL = { '🍓': 0xe8434a, '🥔': 0xb98b5a, '🍚': 0xf4f1e8, '🍐': 0xe8d06a, '🥬': 0x9bd46e, '🥛': 0xf6f4ee, '🍄': 0x8a5a3a, '🍯': 0xe0a030, '🍃': 0x5fa04a, '🧂': 0xf2f2f2, '🐚': 0xe8c8b0, '🌿': 0x2f5a2a, '🐟': 0x7fa0b8, '🥒': 0x4f8a3a, '🥕': 0xef8b33, '🍅': 0xe04030, '🌽': 0xf2c230, '🍠': 0xa0465a, '🍞': 0xd9a060, '🍦': 0xf6e8d0, '🥤': 0x7fb8d0 };

export const DEED_TEV = { summit: 1, stones: 1, book: 1, stars: 1, boat: 1, sell: 1, cook: 1, mush: 1, eat: 1, beach: 1 };
export const DEED_MAX = 40;
const jo = (s, a, b) => { const c = (s || '').charCodeAt((s || '').length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

export function fillT(t, V, en) { let s = t; for (const k of Object.keys(V)) s = s.split('{' + k + '}').join(V[k]); return s.replace(/\{(을|은|이)\}/g, (m0, j, off) => en ? '' : j === '을' ? jo(s.slice(0, off), '을', '를') : j === '은' ? jo(s.slice(0, off), '은', '는') : jo(s.slice(0, off), '이', '가')); }

export function createNb(A) {
  const en = () => A.lang() === 'en', S = () => A.GAME.S, L = () => (en() ? 1 : 0);
  const st = () => { const s = S(); if (!s.nbt || typeof s.nbt !== 'object') s.nbt = {}; if (!Array.isArray(s.deeds)) s.deeds = []; if (!s.hd || typeof s.hd !== 'object') s.hd = {}; return s; };
  const nbt = hk => { const T = st().nbt; return T[hk] || (T[hk] = { day: 0, wv: 0, said: {} }); };
  const pick = (arr, seed) => arr[hashS(seed + ':' + S().day) % arr.length];
  const LOG = [];
  let SAID = 0;

  const reps = () => A.workers().filter(w => w.hk && w.rep);
  const repOf = w => { if (!w) return null; if (w.rp) return w.rp; if (w.hk) return reps().find(r => r.hk === w.hk) || null; let b = null, bd = 4; for (const q of A.workers()) { if (!q.hk || q.k !== w.k) continue; const d = Math.abs(q.x - w.x) + Math.abs(q.z - w.z); if (d < bd) { bd = d; b = q; } } return b ? b.rp || b : null; };
  const hkOf = w => { const r = repOf(w); return r ? r.hk : w && w.k ? 'nb:' + w.k + ':' + A.cell(w.x, w.z) : ''; };
  const who = (w, e9) => { const P = NB_PLACE[w.k] || ['일터', 'workplace'], c = cellOf(w.x, w.z); return e9 ? 'the ' + P[1] + ' worker at ' + c : c + ' ' + P[0] + ' 일꾼'; };
  const cellOf = (x, z) => A.inSchool(x, z) ? (en() ? 'school' : '학교') : A.cell(x, z);
  const lvOf = hk => A.GAME.hearts(hk);
  const dislike = w => { const hk = w.hk || hkOf(w), lk = A.likes(w.k) || [], P = NO_POOL.filter(e => e !== MAKES[w.k] && !lk.includes(e)); return P[hashS(hk + ':no') % P.length]; };

  function say(sit, hk, V = {}) { const v = VOICE[voiceOf(hk)], t = v[sit]; if (!t) return ''; const e9 = en(); return fillT(t[e9 ? 1 : 0], V, e9); }

  const TM = new Map();
  function body(w, act, sec) { const M = A.mesh(), r = repOf(w); if (!M || !r || r.i == null || r.party) return; const me = A.me(), i = r.i, tool = M.toolOf ? M.toolOf(i) : null;
    M.set(i, r.x, r.g + 0.02, r.z, Math.atan2(me.x - r.x, me.z - r.z)); M.act(i, act, tool === 8 ? 8 : 0); clearTimeout(TM.get(i));
    TM.set(i, setTimeout(() => { TM.delete(i); if (!A.alive()) return; const M2 = A.mesh(); if (!M2 || r.party) return; M2.set(i, r.x, r.g + 0.02, r.z, r.ry); M2.reset(i); }, sec * 1000)); }

  function react(w, e, res) { const r = repOf(w) || w, hk = r.hk || hkOf(w), e9 = en(), nm = e ? A.itemName(e, e9) : '';
    body(r, res === 'like' ? 'hop' : 'nod', res === 'like' ? 2.2 : 1.6); if (res === 'like' && A.tone) A.tone(784, 0.25, 0.22, 'sine', 0.06);
    nbt(hk).day = S().day;     A.GAME.mark();
    const t = res === 'again' ? AGAIN[L()] : say(res, hk, { e: nm }); A.bubble({ x: r.x, y: r.g, z: r.z, sc: 1 }, t); return t; }

  const upLine = (n, w) => { const hk = hkOf(w); return say('up', hk, { l: LV[Math.max(1, Math.min(5, n))][L()] }); };

  function deed(t, x, z, hk, e) { const s = st(), d = s.day, c = cellOf(x, z), r = A.region(x, z), D = s.deeds;
    for (let i = D.length - 1; i >= 0 && D[i].d === d; i--) if (D[i].t === t && D[i].c === c && (D[i].k || '') === (hk || '') && (D[i].e || '') === (e || '')) return D[i];
    const q = { i: (s.deedN = (s.deedN || 0) + 1), t, c, r: r || '', d, x: Math.round(x), z: Math.round(z) }; if (hk) q.k = hk; if (e) q.e = e; D.push(q); if (D.length > DEED_MAX) D.splice(0, D.length - DEED_MAX);
    { const lo = D[0].i; for (const v of Object.values(s.nbt || {})) if (v && v.said) for (const id of Object.keys(v.said)) if (+id < lo) delete v.said[id]; }
    A.GAME.mark(); return q; }

  const nameE = (e, e9) => !e ? '' : e.startsWith('w:') ? (A.wname ? A.wname(e.slice(2), e9) : e.slice(2)) : A.itemName(e, e9);
  function vp(D, e9) { const at = D.c === '학교' || D.c === 'school' ? '' : D.c + ' ', nm = nameE(D.e, e9), W = D.k ? A.workers().find(w => w.hk === D.k && w.rep) : null, wn = W ? who(W, e9) : (e9 ? 'a neighbour at ' + D.c : D.c + ' 이웃');
    const K = {
      gift: [wn + '에게 ' + nm + '{을} 선물했', 'gave ' + nm + ' to ' + wn], share: [wn + '에게 ' + nm + '{을} 나눠 줬', 'shared ' + nm + ' with ' + wn],
      plant: [at + '학교 텃밭에 씨앗을 심었', 'planted seeds in the school garden'], water: [at + '학교 텃밭에 물을 줬', 'watered the school garden'], harvest: [at + '학교 텃밭에서 ' + nm + '{을} 거뒀', 'harvested ' + nm + ' in the school garden'],
      wild: [at + '근처에서 ' + nm + '{을} 처음 만났', 'met a ' + nm + ' for the first time near ' + D.c], summit: [at + '산꼭대기에 올랐', 'climbed to the summit near ' + D.c], stones: [at + '징검다리를 건넜', 'crossed the stepping stones at ' + D.c],
      book: [at + '도서관에서 책을 읽었', 'read a book at the library at ' + D.c], stars: [at + '산꼭대기에서 별을 봤', 'watched the stars from the summit near ' + D.c], boat: [at + '앞바다에 배를 타고 나갔', 'took a boat out near ' + D.c],
      sell: [at + '장터에서 물건을 팔았', 'sold things at the market at ' + D.c], cook: [at + '부엌에서 요리를 만들었', 'cooked a dish at ' + D.c], mush: [at + '숲에서 버섯을 땄', 'picked mushrooms in the woods at ' + D.c],
      eat: [at + '식당에서 밥을 먹었', 'ate at a restaurant at ' + D.c], beach: [at + '바닷가에서 놀았', 'played on the beach at ' + D.c], deco: [at + '우리 집 마당에 ' + nm + '{을} 놓았', 'put ' + nm + ' in the yard of our house at ' + D.c], work: [wn + ' 일을 거들었', 'helped ' + wn] };
    const k = K[D.t] || K[String(D.t).split(':')[0]] || [at + '일을 했', 'did something at ' + D.c]; return k[e9 ? 1 : 0]; }
  const WHEN = (n, e9) => e9 ? (n <= 0 ? 'earlier today' : n === 1 ? 'yesterday' : n === 2 ? 'the day before yesterday' : 'a few days ago') : (n <= 0 ? '아까' : n === 1 ? '어제' : n === 2 ? '그저께' : '며칠 전');
  function memLine(D, how, hk, e9) { const n = S().day - D.d, w9 = WHEN(n, e9);
    if (how === 'me') { const nm = nameE(D.e, e9); const R = A.workers().find(w => w.hk === hk && w.rep), at = R ? cellOf(R.x, R.z) + ' ' + (NB_PLACE[R.k] || ['일터'])[0] : D.c;
      return e9 ? (D.t === 'work' ? 'You helped me here at ' + at + ' ' + w9 + '.' : 'You gave me ' + nm + ' here at ' + at + ' ' + w9 + '.') : w9 + ' 여기 ' + at + '에서 ' + (D.t === 'work' ? '제 일을 거들어 줬지요.' : '저한테 ' + fillT(nm + '{을}', {}, false) + ' 줬지요.'); }
    const v = vp(D, e9);
    if (e9) return (how === 'seen' ? 'I saw it ' + w9 + ' — you ' : how === 'reg' ? 'A neighbour from around here told me — you ' : 'I heard it at the market — you ') + v + '.';
    return fillT((how === 'seen' ? w9 + ' 봤어요. ' + v + '지요.' : how === 'reg' ? '우리 동네 이웃한테 들었어요. ' + v + '다면서요.' : '장터에서 들었어요. ' + v + '다면서요.'), {}, false); }

  function knows(D, R, day) { if (D.k && D.k === R.hk) return 'me'; if (D.d > day) return null; const c = cellOf(R.x, R.z); if (D.c === c) return 'seen'; if (day <= D.d) return null; const rg = A.region(R.x, R.z) || '';
    if (D.r && D.r === rg) return 'reg'; if (A.hasMarket() && rg) for (let j = D.d; j < day; j++) if (A.jang(j)) return 'mkt'; return null; }
  const TIER = { me: 0, seen: 1, reg: 1, mkt: 1 };
  function choose(R) { const s = st(), T = nbt(R.hk), day = s.day; let best = null, bt = 9; for (let i = s.deeds.length - 1; i >= 0; i--) { const D = s.deeds[i]; if (T.said[D.i]) continue; const how = knows(D, R, day); if (!how || (how === 'me' && D.d === day)) continue; const t = TIER[how]; if (t < bt) { bt = t; best = [D, how]; } } return best; }

  let PX = null, PZ = 0, WV = 0;
  function sec(me) { if (!A.on() || A.busy()) { PX = null; return; } const spd = PX == null ? 0 : Math.hypot(me.x - PX, me.z - PZ); PX = me.x; PZ = me.z; if (WV > 0) WV--;
    if (spd > A.walk() * 1.1 || A.riding()) return; const day = S().day; let near = null, nd = 4;
    for (const R of reps()) { if (R.party || !A.visible(R)) continue; const d = Math.hypot(R.x - me.x, R.z - me.z); if (d < nd && Math.abs(R.g - me.y) < 3) { nd = d; near = R; } }
    if (!near) return; const hk = near.hk, lv = lvOf(hk), T = nbt(hk);
    if (lv >= 1 && nd < 2.5 && T.wv !== day && WV <= 0) { T.wv = day; WV = 3; A.GAME.mark(); body(near, 'cheer', 2.2); if (lv < 2 && !A.bubbleBusy() && T.day !== day) { T.day = day; A.bubble({ x: near.x, y: near.g, z: near.z, sc: 1 }, say(A.calDay() === 7 ? 'rest' : 'greet', hk)); } return; }
    if (lv < 2 || T.day === day || A.bubbleBusy()) return; talk(near); }

  function talk(near) { const hk = near.hk, T = nbt(hk), day = S().day, e9 = en(); if (T.day === day) return null;
    const C = choose(near); let t;
    if (C) { const [D, how] = C; T.said[D.i] = 1; t = say('mem', hk, { m: memLine(D, how, hk, e9) }); LOG.push([hk, D.i, how, day]); if (LOG.length > 400) LOG.shift(); SAID++; }
    else { const rg = A.region(near.x, near.z) || '', lk = (A.likes(near.k) || []).filter(e => { const r9 = A.itemReg(e); return r9 && r9 !== rg; }); if (lk.length && hashS(hk + ':' + day) % 2 === 0) { const e = lk[hashS(hk + ':tip') % lk.length]; if (A.heard) A.heard(hk, 'l', e);     t = say('tip', hk, { t: fillT((e9 ? 'We don’t get ' + A.itemName(e, e9) + ' around here.' : '우리 동네엔 ' + A.itemName(e, e9) + '{이} 안 나요.'), {}, e9) }); }
      else { const wl = A.wline(near.k); t = wl ? wl[e9 ? 1 : 0] : say(A.calDay() === 7 ? 'rest' : 'greet', hk); } }
    T.day = day; A.GAME.mark(); A.bubble({ x: near.x, y: near.g, z: near.z, sc: 1 }, t); return t; }

  let BM = null; const O = new A.T3.Object3D(), CL = new A.T3.Color();
  function basketBuild() { basketDrop(); const R = reps(); if (!R.length || !A.root()) return; const g = new A.T3.CylinderGeometry(0.5, 0.4, 1, 8), m = new A.T3.MeshLambertMaterial({ color: 0xffffff });
    BM = new A.T3.InstancedMesh(g, m, R.length * 4); BM.count = 0; BM.frustumCulled = false; BM.matrixAutoUpdate = false; BM.userData.fx = 1; A.root().add(BM); basketSync(); }
  function basketSync() { if (!BM) return; let k = 0; const s = st();
    for (const r of reps()) { const T = s.nbt[r.hk]; if (!T || !T.g || lvOf(r.hk) < 3) continue; const c = Math.cos(r.ry), sn = Math.sin(r.ry), lx = -0.62, lz = 0.38, x = r.x + lx * c + lz * sn, z = r.z - lx * sn + lz * c, y = A.ground(x, z, r.g + 0.4);
      O.rotation.set(0, r.ry, 0); O.position.set(x, y + 0.13, z); O.scale.set(0.44, 0.26, 0.44); O.updateMatrix(); BM.setMatrixAt(k, O.matrix); BM.setColorAt(k++, CL.setHex(0xb07a3c));
      for (const [a, b, h] of [[-0.06, -0.04, 0.3], [0.07, -0.02, 0.31], [0, 0.07, 0.34]]) { O.position.set(x + a * c + b * sn, y + h, z - a * sn + b * c); O.scale.set(0.14, 0.11, 0.14); O.updateMatrix(); BM.setMatrixAt(k, O.matrix); BM.setColorAt(k++, CL.setHex(ICOL[T.g] ?? 0xd9b48a)); } }
    BM.count = k; BM.instanceMatrix.needsUpdate = true; if (BM.instanceColor) BM.instanceColor.needsUpdate = true; }
  function basketDrop() { if (!BM) return; if (BM.parent) BM.parent.remove(BM); BM.geometry.dispose(); BM.material.dispose(); BM.dispose(); BM = null; }

  function keepGift(w, e) { const r = repOf(w); if (!r || !e) return; nbt(r.hk).g = e; A.GAME.mark(); basketSync(); }

  function migrate() { const s = st(), H = s.hearts || (s.hearts = {}); let n = 0;
    for (const w of A.workers()) { if (!w.hk) continue; const old = 'nb:' + w.k + ':' + A.cell(w.x, w.z); if (old === w.hk || H[old] == null) continue; H[w.hk] = Math.max(H[w.hk] || 0, H[old]); delete H[old]; n++; }
    if (n) A.GAME.mark(); return n; }
  return {
    init() { migrate(); basketBuild(); }, say, talk, likes: k => A.likes(k) || [], market: () => !!A.hasMarket(), jang: d => !!A.jang(d), react, upLine, deed, sec, knows, choose, hkOf, repOf, dislike, keepGift, basketSync, who,
    again: () => AGAIN[L()], vp: D => vp(D, en()),
    get log() { return LOG; }, get said() { return SAID; }, get baskets() { return BM ? BM.count / 4 : 0; }, reps: () => reps().map(r => ({ hk: r.hk, k: r.k, i: r.i, x: r.x, z: r.z, g: r.g, ry: r.ry, cell: cellOf(r.x, r.z), reg: A.region(r.x, r.z) || '', voice: VOICE[voiceOf(r.hk)].id, ch: r.ch, lv: lvOf(r.hk), rep: !!r.rep, pal: A.mesh() && A.mesh().palOf ? A.mesh().palOf(r.i) : null, no: dislike(r) })),
    dispose() { for (const t of TM.values()) clearTimeout(t); TM.clear(); basketDrop(); } };
}
