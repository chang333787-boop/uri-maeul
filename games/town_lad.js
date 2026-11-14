const A4 = [['', ''], ['조금 ', 'a little '], ['더 ', 'even '], ['아주 ', 'very ']];

export const LADP = {
  ripe: { v: [0, 3.4, 2.5, 1.8], t: (k, a) => (k === 'shiitake' ? ['활짝 핀 표고가 ' + a[0] + '빨리 시들어요', 'Open shiitake wilt ' + a[1] + 'fast'] : ['익은 딸기가 ' + a[0] + '빨리 물러요', 'Ripe strawberries go soft ' + a[1] + 'fast']) },
  plant: { v: [1, 2, 3, 4, 5], t: (k, a, lv) => [['', ''], ['둑 눈금이 촘촘해요. 못줄 빨간 표 사이와 견줘요', 'The bank marks are finer. Compare with the red marks on the rope'], ['양쪽 둑 눈금이 서로 달라요. 줄도 넷이에요', 'The two banks have different marks. Four rows today'], ['도중에 논물이 바뀌어요. 다시 봐요', 'The water changes halfway. Look again'], ['논물도 바뀌고, 촘촘한 눈금 쪽이 줄마다 바뀌어요', 'The water changes, and the finer bank switches from row to row']][lv - 1] },
  toss: { v: [0, 1, 2, 3, 4], t: (k, a, lv) => [['', ''], ['살랑 바람이 불어요. 깃발을 봐요', 'A light wind. Watch the flag'], ['바람이 세요. 낮게 던져도 밀려요', 'Strong wind. Even low throws drift'], ['항아리가 멀리 있어요. 바람을 등에 업어요', 'The pot is far. Use the wind at your back'], ['낮은 나뭇가지 밑에선 높게 못 던져요. 설 자리를 다시 골라요', 'Under the low branch you cannot throw high. Pick your spot again']][lv - 1] },
  cut: { v: [1, 2, 3, 4, 5], t: (k, a, lv) => [['', ''], ['비가 조금 빨리 따라와요', 'The rain follows a little faster'], ['구름이 둘이에요. 깃발로 다가오는 구름을 찾아요', 'Two clouds. Use the flag to find the one coming'], ['구름이 둘이고 비가 바로 따라와요', 'Two clouds, and the rain follows right away'], ['모퉁이 한 칸은 손으로 미리 베었어요. 그 칸을 빼고 길을 짜요', 'One corner was already cut by hand. Plan a path around it']][lv - 1] },
  comb: { v: [2, 3, 4, 5, 5], t: (k, a, lv) => [['', ''], ['벌통 문이 있어요. 문 앞은 피해요', 'The hive has a door. Keep away from it'], ['바람이 도중에 바뀌어요. 깃발을 다시 봐요', 'The wind changes halfway. Check the flag again'], ['벌이 아주 많고 바람도 바뀌어요', 'Lots of bees, and the wind changes too'], ['벌통 문이 둘이에요. 바람이 바뀌어도 두 문 앞을 다 피해요', 'The hive has two doors. Keep away from both, even when the wind changes']][lv - 1] },
  dig: { v: [0, 1, 2, 3], t: (k, a) => (k === 'clam' ? ['갯벌이 ' + a[0] + '질척해요. 삽질 수가 줄어요', 'The mud is ' + a[1] + 'sticky — fewer digs'] : ['흙이 ' + a[0] + '단단해요. 삽질 수가 줄어요', 'The soil is ' + a[1] + 'hard — fewer digs']) },
  sort: { v: [0, 0.3, 0.5, 0.65], t: (k, a) => ['크기가 ' + a[0] + '비슷한 배추가 섞여요', 'Cabbages of ' + a[1] + 'similar size are mixed in'] },
  cover: { v: [1, 2, 3, 4, 5], t: (k, a, lv) => [['', ''], ['열매 없는 나무도 있어요. 봉지를 아껴요', 'Some trees have no fruit. Save your bags'], ['벌레가 바로 와요. 첫 나무부터 잘 골라요', 'The bugs come right away. Choose the first tree well'], ['나무가 일곱 그루예요. 벌레도 바로 와요', 'Seven trees, and the bugs come right away'], ['도중에 바람이 바뀌어 벌레가 반대쪽에서도 와요', 'The wind changes halfway, and bugs come from the other side too']][lv - 1] },
  order: { v: [1, 2, 3, 4, 5], t: (k, a, lv) => [['', ''], ['깊이 그림이 서로 비슷해요', 'The depth pictures look more alike'], ['겉흙과 속흙이 달라요. 속흙을 봐요', 'Surface soil and inside soil differ. Look inside'], ['나무가 세 그루예요. 속흙도 봐요', 'Three trees today. Look at the inside soil too'], ['심는 자리마다 바람이 달라요. 받침대가 필요한지 골라요', 'Each spot gets different wind. Decide if it needs a stake']][lv - 1] },
  feed: { v: [1, 0.85, 0.72, 0.62], t: (k, a) => ['동물들이 ' + a[0] + '배고파요. 시간이 짧아요', 'The animals are ' + a[1] + 'hungry — less time'] },
  spread: { v: [0, 2, 3, 4, 4], t: (k, a, lv) => [['', ''], ['두꺼운 곳이 있어요. 덜어서 얇은 곳에 부어요', 'Some spots are thick. Scoop from them into thin spots'], ['반죽이 딱 맞아요. 흐린 날엔 처마 밑에 말려요', 'Just enough mix. On cloudy days dry it under the eaves'], ['두께 차이가 잘 안 보여요. 잘 봐요', 'The thickness is hard to tell apart. Look closely'], ['바닷가 하늘이 장마다 바뀌어요. 말릴 때마다 하늘을 다시 봐요', 'The seaside sky changes with every sheet. Check it each time you dry']][lv - 1] },
  gauge: { v: [1, 0.85, 0.72, 0.62], t: (k, a) => ['배가 ' + a[0] + '일찍 돌아가요. 시간이 짧아요', 'The boat heads back ' + a[1] + 'early — less time'] },
};
const FISHT = { 2: ['큰 고기가 와요. 미끼를 골라요', 'Big fish come — pick a bait'], 3: ['물때를 보고 자리도 골라요', 'Check the tide and pick a spot too'], 4: ['바람이 줄을 한쪽으로 밀어요', 'The wind pushes the line to one side'] };

const M5 = new Set(['tuho', 'plant', 'cut', 'beehive', 'pear', 'lumber', 'seaweed']);
const m5On = S => !!(S && S.lad && typeof S.lad === 'object' && S.lad.m5);
const MAXL = (k, S) => (k === 'fire' ? 5 : M5.has(k) && m5On(S) ? 5 : 4);
const kMax = kind => (kind === 'fire' ? 5 : LADP[kind] && LADP[kind].v.length >= 5 ? 5 : 4);

export function ladM5(S, on) { if (on) { let L0 = S.lad; if (!L0 || typeof L0 !== 'object' || Array.isArray(L0)) L0 = S.lad = {}; L0.m5 = 1; } return m5On(S); }
const lvHead = (key, lv, en) => (lv >= 5 && key !== 'fire' ? (en ? 'Master step' : '명인 칸') : en ? 'Challenge step ' + lv : '도전 ' + lv + '칸');
const FIRET = { 2: ['호스로 불을 꺼요', 'Use the hose'], 3: ['사다리차로 높은 곳을 구해요', 'Rescue up high with the ladder truck'], 4: ['두 곳에 동시에 불이 나요', 'Fire in two places at once'], 5: ['반장이 되어 대원 둘에게 일을 맡겨요', 'Lead the crew — give two firefighters their jobs'] };
export const ladVal = (kind, lv) => { const P = LADP[kind]; return P ? P.v[Math.max(1, Math.min(P.v.length, lv | 0 || 1)) - 1] : null; };

export function ladText(kind, k, lv, en) { lv = Math.max(1, Math.min(kMax(kind), lv | 0 || 1)); const head = lvHead(kind, lv, en);
  if (lv === 1) return head; let t = null; if (kind === 'tug') t = FISHT[lv]; else if (kind === 'fire') t = FIRET[lv]; else if (LADP[kind]) t = LADP[kind].t(k, A4[Math.min(3, lv - 1)], lv); return t ? head + ': ' + t[en ? 1 : 0] : head; }

export function ladHead(S, key, kind, k, lv, en, own) { const t = ladText(kind, k, lv, en), M = S && S.lad && typeof S.lad === 'object' ? S.lad.mg : null, L = M && typeof M === 'object' ? M[key] : null, b = L && L.best, N = RECN[key];
  if (!b) return !own && (lv | 0) <= 1 ? t + (en ? '. Do very well and step 2 opens' : '. 아주 잘 해내면 도전 2칸이 열려요') : t;
  if (!(b.n > 0) || !N) return t;
  return t + (en ? '. My best: ' : '. 내 최고 ') + ((b.lv | 0) === (lv | 0) ? (en ? b.n + ' ' + enN(N, b.n) : b.n + N[3]) : recSay(key, b, en)); }

const RECN = { strawberry: ['딸기 따기', 'Strawberries', '딸기', '개', 'strawberry'], shiitake: ['표고 따기', 'Shiitake', '표고', '송이', 'shiitake'], cabbage: ['배추 거두기', 'Cabbages', '맞게 담은 배추', '포기', 'cabbage'], potato: ['감자 캐기', 'Potatoes', '감자', '개', 'potato'], clam: ['조개 캐기', 'Clams', '조개', '개', 'clam'],
  beehive: ['꿀 뜨기', 'Honey cells', '꿀 칸', '칸', 'honey cell'], pear: ['배 봉지 씌우기', 'Pears bagged', '봉지 씌운 배', '개', 'pear bagged'], lumber: ['어린 나무 심기', 'Trees planted well', '잘 심은 나무', '그루', 'tree planted well'], plant: ['모내기', 'Seedlings in straight rows', '곧은 줄에 심은 모', '포기', 'seedling in a straight row'], tuho: ['투호', 'Arrows in the pot', '항아리에 넣은 화살', '개', 'arrow in the pot'], cut: ['벼 베기', 'Squares cut', '벤 칸', '칸', 'square cut'],
  seaweed: ['김 펴기', 'Even laver sheets', '고르게 편 김', '장', 'even laver sheet'], oyster: ['굴 크기 재기', 'Oysters sorted right', '바르게 나눈 굴', '개', 'oyster sorted right'], pasture: ['먹이 나눠 주기', 'Right feeds', '알맞게 준 먹이', '번', 'right feed'], fisher: ['부두 낚시', 'Fish', '물고기', '마리', 'fish'], saltpan: ['소금 모으기', 'Salt piles', '모은 소금', '무더기', 'salt pile'], cook: ['바쁜 부엌', 'Dishes just right', '알맞게 만든 요리', '그릇', 'dish just right'], fire: ['소방 출동', 'Fire calls', '꺼 낸 불꽃', '개', 'fire call'] };
const enN = (N, n) => (n === 1 && N[4] ? N[4] : N[1].toLowerCase());

const WHY = { strawberry: [n => '초록 딸기를 ' + n + '번 눌러서', n => (n === 1 ? '1 green tap' : n + ' green taps'), '초록 딸기를 한 번도 안 누르고', 'no green taps', '초록 딸기를 덜 눌렀어요', 'fewer green taps'], shiitake: [n => '작은 봉오리를 ' + n + '번 눌러서', n => (n === 1 ? '1 tiny-button tap' : n + ' tiny-button taps'), '작은 봉오리를 한 번도 안 누르고', 'no tiny-button taps', '작은 봉오리를 덜 눌렀어요', 'fewer tiny-button taps'],
  cabbage: [n => '장터 바구니로 ' + n + '포기가 가서', n => n + ' in the market basket', '장터 바구니로 한 포기도 안 보내고', 'none in the market basket', '장터 바구니로 덜 갔어요', 'fewer in the market basket', '배추'] };
const NONLY = { potato: 1, clam: 1 };
export const ladName = (key, en) => { const R = RECN[key]; return R ? R[en ? 1 : 0] : key; };
const GW = [['아쉬움', 'close'], ['잘함', 'well done'], ['아주 잘함', 'excellent']];
const g3 = s => (s >= 3 ? 2 : s >= 1 ? 1 : 0);

export function recSay(key, r, en) { if (!r) return ''; const R = RECN[key], head = r.lv >= 5 && key !== 'fire' ? (en ? 'master step' : '명인 칸') : en ? 'step ' + r.lv : '도전 ' + r.lv + '칸';
  if (r.n > 0 && R) return en ? head + ', ' + r.n + ' ' + enN(R, r.n) : head + ', ' + R[2] + ' ' + r.n + R[3]; return head + ', ' + GW[g3(r.g)][en ? 1 : 0]; }
const rkey = r => (r ? (r.lv | 0) * 1000 + Math.min(3, r.g | 0) * 100 + Math.min(99, r.n | 0) : -1);
export function ladRoot(S) { let L0 = S.lad; if (!L0 || typeof L0 !== 'object' || Array.isArray(L0)) L0 = S.lad = {}; let M = L0.mg; if (!M || typeof M !== 'object' || Array.isArray(M)) M = L0.mg = {}; return M; }
export function ladOf(S, key) { const M = ladRoot(S); let L = M[key]; if (!L || typeof L !== 'object') L = M[key] = { lv: 1, z: 0, n: 0, best: null, last: null }; if (!(L.lv >= 1)) L.lv = 1; else if (L.lv > MAXL(key, S)) L.lv = Math.min(L.lv, 4); return L; }
export const ladLv = (S, key) => ladOf(S, key).lv;

export function ladAfter(S, key, o) { const L = ladOf(S, key), lv = Math.max(1, Math.min(MAXL(key, S), o.lv | 0 || 1)), g = Math.max(0, Math.min(3, o.g | 0)), n = Math.max(0, o.n | 0), cur = { lv, g, n };
  const prev = L.best ? { lv: L.best.lv | 0, g: L.best.g | 0, n: L.best.n | 0 } : null;
  L.n = (L.n | 0) + 1; L.last = cur; let neu = false, first = false; if (g >= 1 && rkey(cur) > rkey(L.best)) { if (L.best) neu = true; else first = true; L.best = { ...cur }; }
  let next = 0, down = false;
  if (o.own) L.lv = lv; else if (lv === L.lv) { if (g >= 2) { L.z = 0; if (L.lv < MAXL(key, S) && (L.lv < 4 || g >= 3 || key === 'fire')) { L.lv++; next = L.lv; } }     else if (g === 0) { L.z = (L.z | 0) + 1; if (L.z >= 2 && L.lv > 1) { L.lv--; L.z = 0; next = L.lv; down = true; } } else L.z = 0; }
  return { neu, first, best: L.best, last: cur, prev, next, down, lv: L.lv, end: L.lv >= MAXL(key, S) }; }

export function recLines(key, kind, k, R, en, nx, y) { const b = recSay(key, R.best, en), a = [], B = R.best, C = R.last, P = R.prev, N = RECN[key];
  if (B) { let t = '';
    if (nx != null && N && C && C.n > 0) { const u = en ? '' : N[3], one = n => (en ? n + ' ' + enN(N, n) : N[2] + ' ' + n + N[3]), W = WHY[key], yy = y == null ? -1 : y | 0, sh = n => (en ? one(n) : ((W && W[6]) || N[2]) + ' ' + n + N[3]);
      if (R.neu) { if (P && P.lv === C.lv && P.n > 0) {
        if (C.n > P.n) t = en ? '🏅 New personal best! ' + one(C.n) + '. ' + (C.n - P.n) + ' more than my old best' : '🏅 새 내 최고! ' + one(C.n) + '. 지난 최고보다 ' + (C.n - P.n) + u + ' 많아요';
        else if (W && yy === 0) t = en ? '🏅 New best! ' + one(C.n) + ', ' + W[3] : '🏅 새 내 최고! ' + W[2] + ' ' + sh(C.n);
        else if (W && yy > 0) t = en ? '🏅 New best! ' + one(C.n) + ', ' + W[5] : '🏅 새 내 최고! ' + sh(C.n) + '. 수는 ' + (C.n < P.n ? '적어도 ' : '같아도 ') + W[4];
        else t = en ? '🏅 New best! ' + one(C.n) + ', done better' : '🏅 새 내 최고! ' + one(C.n) + '. 수는 ' + (C.n < P.n ? '적어도' : '같아도') + ' 더 잘했어요'; } }
      else if (!R.first && B.lv === C.lv && B.n > 0) {
        if (C.n < B.n) { if (B.g === C.g || NONLY[key]) t = en ? '🏅 This time: ' + one(C.n) + '. ' + (B.n - C.n) + ' more to reach my best' : '🏅 이번 ' + one(C.n) + '. 내 최고까지 ' + (B.n - C.n) + u + ' 남았어요'; }
        else if (C.n === B.n && (B.g === C.g || NONLY[key])) t = en ? '🏅 Same as my best: ' + one(C.n) : '🏅 내 최고와 같아요. ' + one(C.n);
        else if (C.g < B.g) { if (W && yy > 0) t = en ? '🏅 ' + W[1](yy) + ', so my best (' + B.n + ') stays' : '🏅 ' + W[0](yy) + ' 내 최고(' + B.n + u + ')는 그대로예요';
          else t = en ? '🏅 This time: ' + one(C.n) + '. My best (' + B.n + ') was done better' : '🏅 이번 ' + one(C.n) + '. 수는 ' + (C.n > B.n ? '많아도' : '같아도') + ' 내 최고(' + B.n + u + ') 때 더 잘했어요'; } } }
    a.push(t || (R.neu ? (en ? '🏅 New personal best! ' : '🏅 새 내 최고! ') + b : R.first ? (en ? '🏅 First record: ' : '🏅 첫 기록: ') + b : (en ? '🏅 My best: ' : '🏅 내 최고: ') + b + (en ? '. This time: ' : '. 이번: ') + recSay(key, C, en))); }
  if (R.next && R.down) a.push(en ? 'Next time one step easier (step ' + R.next + ')' : '다음 판은 한 칸 쉽게 해요(도전 ' + R.next + '칸)');
  else if (R.next) a.push((en ? 'Next time: ' : '다음 판은 ') + ladText(kind, k, R.next, en));
  else if (nx && B && C && C.g === 1 && C.lv === R.lv && !R.end) a.push(nx); return a; }

export function ladRows(S, en) { const M = ladRoot(S), out = []; for (const key of Object.keys(RECN)) { const L = M[key]; if (!L || !(L.n > 0)) continue; out.push({ key, name: ladName(key, en), lv: L.lv, lvT: lvHead(key, L.lv, en), best: L.best ? recSay(key, L.best, en) : '', last: L.last ? recSay(key, L.last, en) : '', n: L.n }); } return out; }
