const BIG = '판 이음매 자리라서 큰길(넓게 · 인도·가로수)로 어림했어요 — 테이프는 다 같은 굵기예요. "큰길은 여기"라고 바꿀 수 있어요';
const SMALL = '좁은 동네 길로 어림했어요 — 테이프는 다 같은 굵기예요';
const B = (cell, at, t, c, o = {}) => ({ cell, at, t, c, ...o });
import { RING_BLOCKS, RING_AREAS, RING_FILLS, RING_NATURE, RING_PROPS, KID_REQ } from './ourtown_ring.js?v=12';
const CELLR = cell => { const r = '가나다라마바사아자차'.indexOf(cell[0]), n = +cell.slice(1), x0 = (n - 3) * 25, y0 = (r - 2) * 25; return [x0, y0, x0 + 25, y0 + 25]; };
const SEA_KIDS = RING_BLOCKS.filter(b => b.kind === 'duckboat' || b.kind === 'parasol');

const curve = (C, n = 6) => { const out = []; for (let i = 0; i < C.length - 1; i++) { const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(a => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); } } out.push(C[C.length - 1]); return out; };
const BAY = curve([[276, -110], [275.5, -66], [272, -44], [264, -31], [255.5, -22], [251.5, -11], [254.5, -2.5], [264, 2.5], [273, 6.5], [276, 14], [276, 75]], 3).map(([x, y], i, A) => { if (i < 4 || i > A.length - 8) return [x, y]; const w = Math.sin(i * 1.7) * 0.35 + Math.sin(i * 0.63) * 0.25; return [x + w, y + w * 0.6]; });
const SEA_BAY = { ...RING_NATURE.find(n => n.k === 'sea'), poly: [[276, -110], [440, -110], [440, 75], ...BAY.slice().reverse()], ai: '보라 종이 칸 + 판 밖 바다(✨) · 물가는 굽은 만으로' };
const SAND_BAY = { ...RING_NATURE.find(n => n.k === 'sand'), poly: [...curve([[227, -50], [225.5, -36], [226.5, -21], [230.5, -7], [239, 1.5], [251, 6.5], [262, 9.5], [271, 13]], 3), ...BAY.filter(([x, y]) => y > -50 && y < 13).slice().reverse().map(([x, y]) => [x + 2.5, y]), [276, -50]], soft: 7, ai: '노란 종이 = 모래사장 · 풀밭과 만나는 곳은 섞음(✨)' };
const PARASOLS = [[236, -11, 3], [231, -29, 4], [243, -40, 3], [259, -45, 3], [247, -4, 2]].flatMap(([x, y, n], g) => Array.from({ length: n }, (_, k) => ({ id: 'pg' + g + '_' + k, k: 'parasol', x: x + Math.cos(k * 2.4 + g) * 1.1, y: y + Math.sin(k * 2.4 + g) * 1.1, ...(g === 0 && k === 0 ? { name: '파라솔', en: 'Parasols' } : { ai: '파라솔 몇 개씩 모여(✨ · 아이 블록 = 나12 파라솔)' }) })));
const ECO = ['rooftop', 'vines', 'flowers', 'woods'];
export const TOWN = {
  id: 'ourtown', title: '우리 마을', en: 'Our Town', scale: 500,
  mat: { x0: -50, y0: -50, w: 350, h: 250 }, school: [100, 0, 125, 25],
  grid: { xs: [-25, 0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275], ys: [-25, 0, 25, 50, 75, 100, 125, 150, 175], cols: 'num', rows: 'hangul', order: 'rowcol' },
  extras: RING_PROPS.filter(p => p.k === 'lifeguard' || p.k === 'mushroom'),
  req: [...KID_REQ.filter(r => ['weather', 'bump', 'bikegravity'].includes(r.k)).map(r => ({ k: r.k, by: r.by, why: r.why })), { k: 'swim', by: '지원·인우', why: '수영할 수 있는 바다 · 해수욕장' }, { k: 'mushroom', by: '유은', why: '산에 가끔 버섯(새송이 · 팽나무버섯 · 독우산광대버섯)' }],
  base: 'now', fillAround: true, life: true, yards: 'rpg', declutter: [0, 0, 250, 150],

  range: { peaks: [[-115, -115, 66, 95], [-125, 40, 46, 50], [40, -135, 50, 55], [130, -140, 42, 50]],
    ridges: [{ pts: [[-115, -115, 62], [-40, -128, 50], [40, -140, 46], [150, -150, 40], [230, -150, 30]], w: 55 }, { pts: [[-115, -115, 62], [-118, -30, 50], [-125, 60, 42], [-120, 130, 32], [-130, 200, 24]], w: 55 }],
    view: [7, 4], trail: [[13, 25], [7, 21], [15, 16], [8, 12], [12, 8], [7, 5]] },

  edges: [{ k: 'gorge', id: 'cheung', at: [225, 200], name: '층층골', en: 'Layer Gorge', ai: '✨ 판 남동쪽 밖 지층 절벽·폭포·화석 골짜기' },
    { k: 'crater', id: 'kkam', at: [25, 200], name: '까망봉', en: 'Kkamang Cone', ai: '✨ 판 남서쪽 밖 쉬는 작은 화산(말굽꼴 분화구)' },
    { k: 'tidebar', id: 'sseol', at: [307, -78], from: [268, -55], name: '썰물섬', en: 'Ebb-Tide Isle', ai: '✨ 해수욕장 북쪽 끝 앞바다(판 밖) 작은 섬 · 썰물 때만 드러나는 모래 바닷길' }],

  stam: { ai: '✨ AI가 채운 빈칸', swim: [{ id: 'R1', k: 3, ang: 0, kind: 'raft' }, { id: 'R2', k: 5, ang: -40, kind: 'rock' }, { id: 'R3', k: 7, ang: -75, kind: 'beacon' }],
    climb: [{ id: 'C1', k: 4, at: 'view', kind: 'rope', w: 8, d: 7 }, { id: 'C2', k: 6, at: 150, tiers: 2, w: 11, d: 9, bases: [-2.75, 2.75], slope: 9 }, { id: 'C3', k: 8, at: 'summit', kind: 'chain', w: 14, d: 9, flat: true, r0: 20 }],
    pads: [{ id: 'P1', at: 'view', coach: true }, { id: 'P2', at: 'summit', coach: true, r0: 14 }, { id: 'P3', at: 'rock', rock: 'C3' }] },
  ai: [
    { t: '아이가 블록·종이를 놓지 않은 자리도 이름표와 둘레에 맞게 완성된 동네로 채웠어요(건물·나무·길가 시설·차·사람)' },
    { t: '사8 파란 종이는 강이 시작되는 호수로 읽었어요(강은 호수에서 오른쪽 위로 흘러요 — 마10 이름표 「강→」)', at: [137.5, 112.5] },
    { t: '초록 종이 여섯 칸(다3~5 · 라3~5)은 뒷산으로 읽었어요 — 길이 지나는 곳은 골짜기로 낮게, 산 위 집은 평평한 터 위에(옹벽)', at: [37, 25] },
    { t: '노란 종이 세 칸(아3~5 「논밭」)은 다랑이 논과 밭으로 — 논두렁·물길·농로·농가는 AI가 채움', at: [37, 137] },
    { t: '논에 물이 와야 해서 호수(저수지)에서 길가를 따라 농수로를 냈어요 · 바꾸고 싶으면 말해 주세요', at: [60, 127] },
    { t: '뒷산 산줄기(판 밖 북서쪽 · 주봉 약 330m)·능선·바위·숲, 산자락 등산로와 전망대는 AI가 정했어요', at: [3, 3] },
  ],
  layers: {
    now: {
      name: '오늘', en: 'Today',

      tunnels: [{ id: 'T1', road: 'BW', a: [0, 30], b: [0, -25], name: '뒷산 1터널', en: 'Back Mountain Tunnel 1' }, { id: 'T2', road: 'v0', a: [25, 30], b: [25, -4], name: '뒷산 2터널', en: 'Back Mountain Tunnel 2' }],
      roads: [

        ...[[50, -25], [100, -50], [150, -50], [200, -50]].map(([x, y0], i) => ({ id: 'B' + i, pts: [[x, y0], [x, 200]], w: 4.8, trees: true, ai: BIG })), { id: 'BH', pts: [[-50, 75], [250, 75]], w: 4.8, trees: true, ai: BIG },
        ...[[25, -25], [75, -50], [125, -50], [175, -50], [225, -50]].map(([x, y0], i) => ({ id: 'v' + i, pts: [[x, y0], [x, 200]], w: 2.4, ai: SMALL })),
        ...[[25, -50, 250], [50, -50, 250], [100, -50, 300], [125, -50, 300]].map(([y, x0, x1], i) => ({ id: 'h' + i, pts: [[x0, y], [x1, y]], w: 2.4, ai: SMALL })),

        { id: 'BW', pts: [[0, -25], [0, 200]], w: 4.8, trees: true, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' }, { id: 'BE', pts: [[250, 0], [250, 200]], w: 4.8, trees: true, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' }, { id: 'BS', pts: [[-50, 150], [300, 150]], w: 4.8, trees: true, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' },
        { id: 'BN', pts: [[50, -25], [225, -25]], w: 4.8, trees: true, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' }, { id: 'hN', pts: [[-50, -25], [50, -25]], w: 2.4, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' },
        { id: 'vW', pts: [[-25, 50], [-25, 200]], w: 2.4, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' }, { id: 'vE', pts: [[275, 100], [275, 200]], w: 2.4, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' }, { id: 'hS', pts: [[-50, 175], [300, 175]], w: 2.4, ai: '둘레 판도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감' },
      ],
      nature: [

        { id: 'mt', k: 'hill', poly: [[-45, -45], [79, -45], [79, 18], [76, 40], [66, 53], [40, 55], [-45, 55]], peak: [8, 6], r: 74, h: 10, name: '뒷산', en: 'Back Mountain',
          ai: '초록 종이 여섯 칸 = 뒷산 기슭(산자락) — 큰 산줄기는 판 밖 북서쪽(주봉 약 330m)에 세움 · 높이·능선·바위는 AI가 정함 · 산을 지나는 길은 고개로 깎고 옹벽 · 산 위 집 자리는 평평하게 고름' },

        { id: 'lake', k: 'water', poly: [[129, 106], [134, 103.5], [141, 104], [146, 107.5], [147, 113], [144.5, 119], [138, 121.5], [131.5, 120], [128, 115.5]], smooth: 3, name: '호수', en: 'Lake', ai: '사8 파란 종이를 호수로 읽었어요' },
        { id: 'river', k: 'water', line: { pts: [[137.5, 112.5], [137.5, 87.5], [162.5, 87.5], [175, 75], [187.5, 62.5], [200, 50], [212.5, 37.5], [237.5, 37.5], [250, 37.5], [263, 37.5], [281, 37.5]], w: 4.4 }, smooth: 3, name: '강', en: 'River',
          ai: '파란 종이 칸(사8 → 바9 → 마10 → 라11 → 라12)을 따라 흐르게 — 사8 → 바9은 「계곡 캠핑장」 칸(바8)을 지나 굽게 · 마10·라11는 종이처럼 비스듬히(칸 모서리) · 강 폭 22m · 둔치 10m는 AI가 정함' },

        { id: 'canal', k: 'canal', line: { pts: [[131, 118.5], [131, 127.2], [3, 127.2]], w: 0.3 }, gate: true, name: '농수로', en: 'Irrigation Canal', ai: '논에 물이 와야 해서 호수(저수지)에서 길가를 따라 농수로를 냈어요 · 바꾸고 싶으면 말해 주세요' },

        ...RING_NATURE[0].cells.map(c => ({ id: 'rf' + c, k: 'forest', rect: CELLR(c), ai: RING_NATURE[0].ai })),
        SEA_BAY, SAND_BAY, ...RING_NATURE.filter(n => n.k === 'mudflat' || n.id === 'apond'),
      ],
      zones: [
        { id: 'r1', k: 'green', type: 'paddy', cell: '아3', c: 'yellow', note: '논밭' }, { id: 'r2', k: 'green', type: 'paddy', cell: '아4', c: 'yellow', note: '논밭' }, { id: 'r3', k: 'green', type: 'paddy', cell: '아5', c: 'yellow', note: '논밭' },
        { id: 'rp', k: 'live', cell: '마6', c: 'red', dens: 'dense', type: 'mix', note: '큰 아파트와 작은 아파트' },
      ],
      blocks: [

        ...[[0.45, 0.38], [0.55, 0.70]].map(a => B('다3', a, 'c2', 'red', { look: 'mountain-house', ai: '겉모습 ✨: 산속 집이라 낮은 산촌 집(돌 밑단·나무 벽·빨간 박공·굴뚝·장독대)으로 — 자리·색은 그대로' })),
        B('다4', [0.54, 0.19], 'c2', 'green'), B('다4', [0.43, 0.58], 'c2', 'green'), B('다4', [0.75, 0.35], 'ps', 'green', { rot: 90 }), B('다4', [0.66, 0.67], 'ps', 'green', { rot: 60 }), B('다4', [0.21, 0.54], 'pl', 'green'), B('다4', [0.21, 0.74], 'pl', 'green'),
        B('다5', [0.23, 0.39], 'pe', 'red', { rot: 90, look: 'condo', ai: '겉모습 ✨: 산에 높이 세운 빨간 판 = 산속 리조트 콘도(묵어 가는 집 · 나무 발코니·박공 지붕)로 — 자리·크기·색 그대로' }), B('다5', [0.45, 0.46], 'c3', 'red', { look: 'condo', ai: '겉모습 ✨: 옆 높은 빨간 판과 한 무리 = 산속 리조트 콘도 낮은 동으로 — 자리·크기·색 그대로' }), B('다5', [0.42, 0.23], 'c2', 'green'), B('다5', [0.27, 0.58], 'c2', 'green'), B('다5', [0.70, 0.18], 'pe', 'green', { rot: 90 }), B('다5', [0.74, 0.36], 'pe', 'green', { rot: 90 }),
        B('라4', [0.44, 0.42], 'pl', 'green'), B('라4', [0.40, 0.56], 'c2', 'yellow', { name: '산속 모두의 상점', en: 'Mountain Shop', look: 'mountain-store', ai: '이름표 글씨 「산속 모두악 상점」을 「모두의」로 읽었어요 · 겉모습 ✨: 숲 속 가게라 통나무 산장 가게(앞 데크·장작)로 — 자리 그대로' }), B('라4', [0.32, 0.72], 'pl', 'green', { rot: -30 }),
        B('라5', [0.27, 0.10], 'c2', 'green'), B('라5', [0.62, 0.13], 'c2', 'green'), B('라5', [0.48, 0.32], 'c2', 'green'), B('라5', [0.15, 0.43], 'c2', 'green'), B('라5', [0.42, 0.47], 'c2', 'green'), B('라5', [0.77, 0.69], 'c2', 'green'), B('라5', [0.71, 0.39], 'c2', 'red'), B('라5', [0.64, 0.63], 'c2', 'red'),

        ...[[0.31, 0.35], [0.51, 0.39], [0.76, 0.24], [0.47, 0.68], [0.28, 0.76], [0.77, 0.65]].map(a => B('다6', a, 'c2', 'red')), B('다6', [0.70, 0.45], 'c2', 'green'), B('다6', [0.80, 0.88], 'c2', 'green'),

        B('다8', [0.38, 0.22], 'c3', 'red'), B('다8', [0.66, 0.23], 'c2', 'red'), B('다8', [0.12, 0.58], 'pe', 'red'), B('다8', [0.23, 0.50], 'c2', 'red'), B('다8', [0.88, 0.54], 'pe', 'red', { rot: 20 }),
        ...[[0.09, 0.12], [0.84, 0.14], [0.54, 0.54], [0.60, 0.68], [0.24, 0.70]].map(a => B('다8', a, 'c2', 'green')),

        B('다9', [0.52, 0.42], null, 'yellow', { w: 6, d: 8, h: 2, name: '마트', en: 'Mart' }),

        B('다10', [0.42, 0.16], null, 'navy', { w: 4, d: 4, h: 6, name: '동물보호센터', en: 'Animal Shelter', kind: 'public' }), B('다10', [0.12, 0.66], null, 'navy', { w: 2, d: 3, h: 6, name: '동물병원', en: 'Animal Hospital', kind: 'public', note: '동물 보호 센터에 있는 동물들만 쓰는 병원' }),

        B('다11', [0.42, 0.14], null, 'navy', { w: 6, d: 3, h: 3, name: '동물 카페', en: 'Animal Cafe', kind: 'shop', note: '동물 카페에는 동물이 먹을 수 있는 여러 간식과 사람이 먹을 수 있는 음료, 휴게가 있다. 그리고 초록 잔디에서 동물과 산책할 수도 있다.' }),
        B('다11', [0.32, 0.79], 'c2', 'green'), B('다11', [0.62, 0.79], 'c2', 'green'), B('다11', [0.87, 0.79], 'pl', 'green'),

        ...[[0.18, 0.17], [0.21, 0.35], [0.59, 0.31], [0.49, 0.65], [0.21, 0.89]].map(a => B('다12', a, 'pl', 'green')),

        B('라6', [0.31, 0.13], 'c3', 'red'), ...[[0.41, 0.31], [0.07, 0.44], [0.15, 0.73], [0.80, 0.67]].map(a => B('라6', a, 'c2', 'red')),
        ...[[0.46, 0.09], [0.86, 0.42], [0.17, 0.55], [0.77, 0.67], [0.64, 0.86]].map(a => B('라7', a, 'c2', 'red')), ...[[0.28, 0.08], [0.77, 0.13], [0.77, 0.32], [0.12, 0.71], [0.36, 0.52], [0.41, 0.82]].map(a => B('라7', a, 'c2', 'green')),
        B('라8', [0.23, 0.22], 'pe', 'red', { rot: 70 }), B('라8', [0.74, 0.35], 'pe', 'red', { rot: 110 }),
        B('라8', [0.44, 0.12], 'c2', 'navy', { kind: 'office', sign: '영어 학원' }), B('라8', [0.59, 0.12], 'c2', 'navy', { kind: 'office', sign: '수학 학원' }), B('라8', [0.91, 0.14], null, 'navy', { w: 2, d: 2, h: 4, kind: 'office', sign: '미술 학원' }),
        B('라8', [0.19, 0.79], null, 'navy', { w: 2, d: 2, h: 4, kind: 'office', sign: '피아노 학원' }), B('라8', [0.86, 0.79], null, 'navy', { w: 2, d: 2, h: 4, kind: 'office', sign: '태권도' }),
        B('라9', [0.47, 0.56], null, 'navy', { w: 4, d: 2, h: 2, name: '경찰서', en: 'Police Station' }),
        ...[[0.14, 0.22], [0.62, 0.12], [0.32, 0.52], [0.66, 0.42], [0.66, 0.74], [0.20, 0.80]].map((a, i) => B('라10', a, 'pe', 'red', { rot: [30, 0, 90, 80, 70, 20][i] })),

        B('마3', [0.40, 0.20], 'pl', 'navy', { rot: -35, name: '경찰서', en: 'Police Station' }), B('마3', [0.46, 0.62], 'pl', 'navy', { rot: 60 }),
        ...[[0.27, 0.19], [0.52, 0.15], [0.70, 0.25], [0.50, 0.44], [0.19, 0.60], [0.53, 0.65], [0.76, 0.61], [0.07, 0.90]].map(a => B('마4', a, 'c2', 'yellow')),
        B('마5', [0.31, 0.12], null, 'white', { w: 2, d: 2, h: 4, name: '병원', en: 'Hospital' }), B('마5', [0.77, 0.76], 'pl', 'green', { rot: 30 }),
        ...[[0.43, 0.06], [0.82, 0.12], [0.93, 0.45], [0.88, 0.78], [0.35, 0.93], [0.06, 0.35], [0.66, 0.05]].map((a, i) => B('마6', a, 'pe', 'orange', { rot: [0, 80, 90, 100, 10, 90, 20][i] })),
        ...[[0.26, 0.08], [0.07, 0.60], [0.21, 0.87]].map(a => B('마7', a, 'c2', 'navy')), ...[[0.48, 0.12], [0.05, 0.29], [0.33, 0.37], [0.55, 0.71], [0.81, 0.72]].map(a => B('마7', a, 'c2', 'green')),
        B('마7', [0.76, 0.25], null, 'yellow', { w: 4, d: 6, h: 4, name: '마트', en: 'Mart' }),
        B('마8', [0.21, 0.35], 'c3', 'yellow', { name: '꼬리 용품 상점', en: 'Pet Supply Shop', ai: '이름표 글씨를 「꼬리 용품 상점」으로 읽었어요' }), B('마8', [0.63, 0.42], 'c3', 'yellow'),
        ...[[0.33, 0.10], [0.14, 0.33], [0.43, 0.33], [0.62, 0.38], [0.30, 0.60], [0.75, 0.68], [0.52, 0.80]].map((a, i) => B('마9', a, 'c2', 'white', i ? { wing: true, ai: '「병원」 칸의 흰 블록 일곱 개 — 첫째는 본관, 나머지는 병동으로 지었어요' } : { name: '병원', en: 'Hospital' })),

        ...[[0.25, 0.15, 'red'], [0.45, 0.10, 'red'], [0.62, 0.20, 'red'], [0.40, 0.62, 'red'], [0.55, 0.48, 'red'], [0.76, 0.33, 'red'], [0.86, 0.12, 'orange'], [0.12, 0.84, 'orange'], [0.70, 0.74, 'orange'], [0.34, 0.31, 'green'], [0.62, 0.38, 'green'], [0.20, 0.58, 'green'], [0.82, 0.56, 'green'], [0.46, 0.86, 'green']]
          .map(([u, v, c], i) => B('마11', [u, v], 'pe', c, { rot: (i * 37) % 180 })),
        B('마12', [0.49, 0.12], 'pe', 'red'), B('마12', [0.81, 0.12], 'pe', 'red', { rot: 90 }), B('마12', [0.16, 0.38], 'pe', 'red', { rot: 80 }), B('마12', [0.54, 0.40], 'pe', 'red', { rot: 60 }), B('마12', [0.84, 0.48], null, 'red', { w: 2, d: 2, h: 4 }), B('마12', [0.59, 0.69], 'c3', 'red'),
        ...[[0.19, 0.14], [0.43, 0.33], [0.70, 0.41], [0.82, 0.27], [0.29, 0.71], [0.73, 0.70]].map(a => B('마12', a, 'c2', 'green')),

        B('바3', [0.60, 0.35], null, 'navy', { w: 2, d: 4, h: 2, rot: 30, name: '사우나', en: 'Sauna', kind: 'shop' }),
        B('바4', [0.57, 0.12], 'c3', 'yellow', { name: '공장', en: 'Factory' }), B('바4', [0.19, 0.33], 'c3', 'yellow'), B('바4', [0.42, 0.37], 'c2', 'yellow'), B('바4', [0.10, 0.53], 'c2', 'yellow'), B('바4', [0.61, 0.62], 'c3', 'yellow'), B('바4', [0.88, 0.42], 'pl', 'yellow'),
        B('바5', [0.86, 0.10], 'pe', 'red', { rot: 60 }), B('바5', [0.40, 0.69], 'ps', 'red', { rot: 30 }), B('바5', [0.76, 0.73], 'pe', 'red', { rot: 100 }),
        B('바6', [0.12, 0.26], 'pl', 'green', { rot: 80 }), B('바6', [0.75, 0.48], 'pl', 'green', { rot: -30 }), B('바6', [0.17, 0.70], 'pl', 'green', { rot: -20 }), B('바6', [0.49, 0.48], 'c3', 'navy', { kind: 'play', name: '놀이터', en: 'Playground', ai: '놀이터 칸의 남색 블록은 놀이 기구(큰 정글짐)로 읽었어요' }),
        B('바7', [0.40, 0.20], 'pe', 'yellow', { kind: 'office', name: '은행', en: 'Bank', sign: '은행' }), B('바7', [0.64, 0.11], 'pe', 'yellow', { kind: 'office' }), B('바7', [0.45, 0.43], 'pe', 'yellow', { kind: 'office' }),
        B('바7', [0.67, 0.36], 'pe', 'green'), B('바7', [0.76, 0.54], 'pe', 'green'), B('바7', [0.46, 0.64], 'pe', 'green'),
        B('바8', [0.82, 0.10], 'c2', 'navy', { name: '캠핑장 관리소', en: 'Camp Office', ai: '계곡 캠핑장 칸의 남색 블록은 캠핑장 관리소로 읽었어요' }),
        B('바10', [0.31, 0.66], 'c3', 'red', { name: '풀빌라', en: 'Pool Villa', pool: true }), ...[[0.71, 0.35], [0.53, 0.42], [0.64, 0.47], [0.05, 0.72], [0.62, 0.72], [0.20, 0.86]].map(a => B('바10', a, 'c2', 'green')),
        B('바11', [0.70, 0.10], 'c3', 'red'), B('바11', [0.20, 0.23], 'c3', 'red'), B('바11', [0.72, 0.75], 'c3', 'red'),
        B('바11', [0.52, 0.18], 'pl', 'green', { rot: 30 }), B('바11', [0.82, 0.31], 'ps', 'green', { rot: 90 }), B('바11', [0.30, 0.52], 'pe', 'green'), B('바11', [0.56, 0.48], 'pl', 'green', { rot: -40 }), B('바11', [0.36, 0.79], 'pl', 'green'),
        B('바12', [0.50, 0.50], null, 'black', { w: 11, d: 11, h: 3, kind: 'school', name: '학교', en: 'School', flat: true, ai: '검은 종이 = 학교(범례) — 우리 학교 말고 두 번째 학교로 지었어요' }),

        B('사3', [0.15, 0.25], 'pl', 'green'), B('사3', [0.78, 0.49], 'pl', 'green', { rot: -10 }), B('사3', [0.06, 0.87], 'pl', 'green', { rot: 90 }), B('사3', [0.46, 0.23], 'c3', 'red'), ...[[0.76, 0.17], [0.12, 0.55], [0.64, 0.71], [0.27, 0.82]].map(a => B('사3', a, 'c2', 'red')),
        B('사4', [0.46, 0.29], 'c3', 'red'), B('사4', [0.29, 0.66], 'pl', 'green', { rot: 80 }), B('사4', [0.84, 0.92], 'c2', 'red'),
        B('사5', [0.14, 0.12], null, 'white', { w: 2, d: 2, h: 4, name: '병원', en: 'Hospital' }),
        B('사6', [0.25, 0.15], 'pl', 'orange', { rot: -20 }), B('사6', [0.22, 0.65], 'pl', 'orange', { rot: 15 }), B('사6', [0.78, 0.76], 'pl', 'orange', { rot: 10 }), ...[[0.84, 0.23], [0.52, 0.44], [0.08, 0.85]].map(a => B('사6', a, 'c2', 'yellow')),
        ...[[0.82, 0.15], [0.22, 0.78], [0.78, 0.66]].map(a => B('사7', a, 'c3', 'yellow')),
        B('사9', [0.52, 0.54], 'c3', 'yellow', { name: '대형마트', en: 'Big Mart', big: true }),
        ...[[0.13, 0.19, 15], [0.45, 0.27, 30], [0.76, 0.33, -60], [0.23, 0.59, 0], [0.53, 0.63, 15], [0.83, 0.77, 30], [0.21, 0.85, 0]].map(([u, v, r]) => B('사10', [u, v], 'pl', 'green', { rot: r })),
        B('사11', [0.16, 0.60], null, 'green', { w: 6, d: 15, h: 1 }), B('사11', [0.80, 0.15], 'c3', 'red'), B('사11', [0.55, 0.71], 'c3', 'red'), ...[[0.48, 0.27], [0.85, 0.55], [0.38, 0.90], [0.82, 0.93]].map(a => B('사11', a, 'c2', 'green')),
        B('사11', [0.34, 0.09], 'c2', 'white', { name: '쉼터 보건실', en: 'Rest Area Clinic', ai: '쉼터 칸의 흰 블록 — 흰색 = 병원(범례)이라 작은 보건실로 지었어요' }),
        ...[[0.07, 0.10], [0.44, 0.10], [0.78, 0.10], [0.42, 0.41], [0.91, 0.44], [0.16, 0.80], [0.48, 0.81], [0.87, 0.82]].map((a, i) => B('사12', a, 'pe', 'orange', { rot: [80, 0, 30, 60, 70, 20, 40, 30][i] })),

        B('아6', [0.57, 0.38], 'c3', 'navy', { name: '노인정', en: 'Senior Center' }),
        B('아7', [0.71, 0.24], null, 'navy', { w: 4, d: 2, h: 1, rot: 15, name: '행정복지센터', en: 'Community Center' }), B('아7', [0.17, 0.56], null, 'navy', { w: 4, d: 2, h: 1, rot: 20 }),
        B('아8', [0.34, 0.25], 'pl', 'navy', { name: '보건소', en: 'Health Center' }), B('아8', [0.82, 0.22], 'pl', 'navy'), B('아8', [0.28, 0.59], 'pl', 'navy', { rot: -30 }), B('아8', [0.73, 0.65], 'pl', 'navy'),
        B('아9', [0.48, 0.41], null, 'yellow', { w: 4, d: 3, h: 1, name: '공장', en: 'Factory' }),
        B('아10', [0.39, 0.42], null, 'navy', { w: 12, d: 3, h: 1, name: '영화관', en: 'Cinema', kind: 'cinema' }),
        B('아11', [0.45, 0.27], 'c2', 'yellow', { name: '젤리 케이크 공장', en: 'Jelly Cake Factory' }),
        B('아12', [0.35, 0.53], null, 'navy', { w: 4, d: 4, h: 3, name: '축구장', en: 'Soccer Field', ai: '남색 블록 + 「축구장」 이름표 = 경기장 옆 지붕 있는 계단식 관람석과 매표·탈의실로 읽었어요(경기장은 땅 위)' }),

        ...RING_BLOCKS.filter(b => !SEA_KIDS.includes(b)),
      ],
      props: [{ id: 'stone', k: 'bridge', cell: '라12', at: [0.45, 0.5], name: '돌다리', en: 'Stepping Stones', stones: true, along: 'ns' },

        ...PARASOLS, ...SEA_KIDS.filter(b => b.kind !== 'parasol').flatMap((b, i) => { const n = b.kind === 'parasol' ? 3 : b.cell === '가14' ? 4 : 3, [x0, y0] = CELLR(b.cell); return Array.from({ length: n }, (_, k) => ({ id: 'sk' + i + '_' + k, k: b.kind === 'parasol' ? 'parasol' : 'duckboat', x: x0 + 25 * Math.min(0.9, Math.max(0.1, b.at[0] + (k ? ((k * 37) % 7 - 3) * 0.06 : 0))), y: y0 + 25 * Math.min(0.9, Math.max(0.1, b.at[1] + (k ? ((k * 53) % 5 - 2) * 0.07 : 0))), ...(k ? { ai: '아이 블록 둘레에 몇 개 더(✨)' } : { name: b.name, en: b.en }) })); })],

      areas: [
        { cell: '다3', t: '산 집', style: [], ai: '뒷산 꼭대기 쪽 집 두 채 — 평평하게 고른 터 · 둘레는 산숲' },
        { cell: '다4', t: '숲', style: [], ai: '뒷산 숲(초록 블록 = 큰 나무)' }, { cell: '라3', t: '숲', style: [], ai: '뒷산 숲' },
        { cell: '다5', t: '산에 있는 집', style: ['bigtree'], ai: '산 중턱 집 — 평평하게 고른 터 · 세운 초록 판 = 큰 나무' },
        { cell: '라5', t: '숲속 마을', style: ['flowers', 'woods'], fill: { k: 'live', type: 'house', dens: 'sparse' }, ai: '숲속 마을 — 산자락 숲 사이 집 몇 채 · woods = 집 사이까지 숲(KIDLOOK-2 들머리에서 숲속으로 보이게)' },
        { cell: '다6', t: '자연친화 마을', style: ECO, fill: { k: 'live', type: 'house', dens: 'normal' }, ai: '자연친화 마을 — 집 사이 나무·꽃 · 옥상 정원 · 덩굴 벽' },
        { cell: '다8', t: '자연 도시(생태계 보호)', style: [...ECO, 'trail', 'solar', 'bigtree'], fill: { k: 'live', type: 'mix', dens: 'sparse' }, ai: '생태계 보호 — 숲길·꽃길 · 옥상 정원 · 태양광 · 큰 나무(「자연 마을」 이름표도 같은 칸)' },
        { cell: '다11', t: '동물 카페', style: ['pets', 'flowers'], fill: { k: 'work', type: 'shop', dens: 'sparse' }, ai: '초록 잔디에서 동물과 산책 — 잔디 산책 마당 · 강아지들' },
        { cell: '다12', t: '동물 쉬는 곳', style: ['pets', 'woods'], ai: '초록 판(풀밭) 다섯 장 = 넓은 풀밭 · 동물 쉼터(그늘집)·물그릇 · 강아지·고양이' },
        { cell: '다10', t: '동물보호센터', style: ['pets'], ai: '동물보호센터 마당(울타리 · 강아지)' },
        { cell: '라6', t: '마을', style: ['flowers'], fill: { k: 'live', type: 'house', dens: 'normal' } },
        { cell: '라7', t: '자연친화 마을', style: ECO, fill: { k: 'live', type: 'house', dens: 'normal' }, ai: '자연친화 마을 — 집 사이 나무·꽃 · 옥상 정원 · 덩굴 벽' },
        { cell: '라8', t: '학원가 아파트', fill: { k: 'live', type: 'apt', dens: 'normal' }, ai: '학원가 — 남색 블록 다섯 = 학원(영어·수학·미술·피아노·태권도) · 둘레 아파트' },
        { cell: '라10', t: '아파트', fill: { k: 'live', type: 'apt', dens: 'normal' } },
        { cell: '마4', t: '음식점들', fill: { k: 'work', type: 'shop', dens: 'normal' }, sign: 'food', ai: '노란 블록 아홉 = 음식점들(간판은 AI가 정함 — 분식·국수·치킨…)' },
        { cell: '마7', t: '마트, 자연 건물', style: ['rooftop', 'vines'], fill: { k: 'work', type: 'shop', dens: 'normal' }, ai: '마트 + 자연 건물(옥상 정원·덩굴 벽)' },
        { cell: '마11', t: '자연친화도시', style: [...ECO, 'bigtree'], fill: { k: 'live', type: 'apt', dens: 'sparse' }, ai: '세운 판 열네 개 = 높은 건물 숲(「큰건물」 이름표) · 초록 세운 판 = 큰 나무 · 옥상 정원·덩굴 벽' },
        { cell: '마12', t: '자연친화 도시', style: [...ECO, 'bigtree'], fill: { k: 'live', type: 'apt', dens: 'sparse' }, ai: '자연친화 도시 — 아파트 사이 숲 · 옥상 정원 · 덩굴 벽' },
        { cell: '바5', t: '아파트', fill: { k: 'live', type: 'apt', dens: 'normal' } },
        { cell: '바7', t: '은행 이랑 공원', style: ['flowers', 'woods'], ai: '노란 세운 판 = 은행 건물 · 초록 세운 판 = 큰 나무(공원)' },
        { cell: '바8', t: '계곡 캠핑장', style: ['camp'], ai: '계곡(강) 옆 캠핑장 — 텐트·모닥불·식탁·캠핑카(AI)' },
        { cell: '바10', t: '풀빌라', style: ['pool', 'woods'], fill: { k: 'live', type: 'house', dens: 'sparse' }, ai: '풀빌라 — 아이 집에 수영장 · 둘레에 수영장 딸린 집 몇 채' },
        { cell: '바11', t: '자연도시', style: [...ECO, 'trail'], fill: { k: 'live', type: 'mix', dens: 'sparse' }, ai: '자연도시 — 숲길 · 옥상 정원 · 덩굴 벽' },
        { cell: '사3', t: '자연 친화 도시(농촌 마을)', style: ['woods', 'flowers'], fill: { k: 'live', type: 'house', dens: 'sparse' }, ai: '농촌 마을 — 논 옆 농가와 텃밭 · 나무' },
        { cell: '사4', t: '자연 친화 도시(농촌)', style: ['woods', 'flowers'], fill: { k: 'live', type: 'house', dens: 'sparse' }, ai: '농촌 마을 — 농가 · 텃밭 · 나무' },
        { cell: '사6', t: '빌라', fill: { k: 'live', type: 'house', dens: 'dense' } },
        { cell: '사7', t: '상가들', fill: { k: 'work', type: 'shop', dens: 'dense' } },
        { cell: '사10', t: '산책로', style: ['trail', 'flowers', 'woods'], ai: '초록 판 일곱 장 = 잔디밭 · 둘레 산책로 · 꽃' },
        { cell: '사11', t: '쉼터', style: ['flowers', 'woods'], ai: '긴 초록 판 = 잔디 광장 · 정자 같은 쉼터는 AI' },
        { cell: '사12', t: '아파트', fill: { k: 'live', type: 'apt', dens: 'sparse' } },
        { cell: '바6', t: '놀이터', style: ['flowers'], ai: '초록 판 = 잔디 · 남색 블록 = 큰 정글짐' },
        { cell: '아12', t: '축구장', style: ['soccer'], ai: '축구장 — 잔디 경기장·흰 선·골대·조명탑(AI) · 남색 블록 = 관람석' },
        { cell: '아6', t: '노인정', fill: { k: 'live', type: 'house', dens: 'normal' } },
        { cell: '아7', t: '행정복지 센터', fill: { k: 'work', type: 'office', dens: 'normal' } },
        { cell: '아10', t: '영화관', fill: { k: 'work', type: 'shop', dens: 'normal' } },

        ...RING_AREAS,
      ],

      fills: [
        { cell: '다9', k: 'work', type: 'shop', dens: 'normal', style: ['parking'] }, { cell: '라9', k: 'work', type: 'shop', dens: 'normal' },
        { cell: '마3', k: 'work', type: 'shop', dens: 'normal' }, { cell: '마5', k: 'work', type: 'office', dens: 'normal' }, { cell: '마8', k: 'work', type: 'shop', dens: 'normal' }, { cell: '마9', k: 'work', type: 'office', dens: 'normal' },
        { cell: '바3', k: 'work', type: 'shop', dens: 'normal' }, { cell: '바4', k: 'work', type: 'factory', dens: 'normal' }, { cell: '바12', k: 'live', type: 'house', dens: 'normal' },
        { cell: '사5', k: 'work', type: 'office', dens: 'normal' }, { cell: '사9', k: 'work', type: 'shop', dens: 'normal', style: ['parking'] },
        { cell: '아8', k: 'work', type: 'office', dens: 'normal' }, { cell: '아9', k: 'work', type: 'factory', dens: 'normal' }, { cell: '아11', k: 'work', type: 'factory', dens: 'normal' },
        { cell: '라11', k: 'green', type: 'park' }, { cell: '라12', k: 'green', type: 'park' }, { cell: '마10', k: 'green', type: 'park' }, { cell: '바9', k: 'green', type: 'park' }, { cell: '사8', k: 'green', type: 'park' },

        ...RING_FILLS,
      ],

      works: [
        { id: 'w_shiitake', k: 'shiitake', cell: '가3', ai: '산 특산물 — 숲 그늘에 참나무 원목을 세워 표고버섯을 길러요(✨)' },
        { id: 'w_cabbage', k: 'cabbage', cell: '가4', ai: '산 특산물 — 높고 서늘한 산비탈 고랭지 배추밭(✨)' },
        { id: 'w_potato', k: 'potato', cell: '나2', ai: '산 특산물 — 산비탈 감자밭(✨)' },
        { id: 'w_lumber', k: 'lumber', cell: '라1', ai: '산 일 — 숲에서 베어 낸 나무를 모아 두는 목재 야적장(✨)' },
        { id: 'w_bee', k: 'beehive', cell: '다1', ai: '산 특산물 — 숲 꽃에서 꿀을 모으는 양봉장(✨)' },
        { id: 'w_ranch', k: 'pasture', cell: '나5', ai: '산 목장 — 풀밭에 한우·양을 길러요(✨ 교과서 산 지역)' },
        { id: 'w_salt', k: 'saltpan', cell: '라13', ai: '바다 특산물 — 갯벌 옆 바닷물을 말려 소금을 얻는 염전(✨)' },
        { id: 'w_laver', k: 'seaweed', cell: '마14', ai: '바다 특산물 — 갯벌 앞바다 김 양식장(✨)' },
        { id: 'w_oyster', k: 'oyster', cell: '다14', ai: '바다 특산물 — 굴 양식장(✨)' },
      ],

      changes: [
        { id: 'c_eco', k: 'ecobridge', ai: '산길이 숲을 둘로 나눈 곳에 동물이 건너는 생태 통로(✨)' },
        { id: 'c_reed', k: 'reeds', ai: '강가 갈대 — 물을 맑게 하는 생태 하천(✨)' },
        { id: 'c_rest', k: 'rest', cell: '다1', ai: '숲을 몇 해 쉬게 하는 자연 휴식년제(✨)' },
        { id: 'c_golf', k: 'golf', cell: '가4', ai: '놀이용 상황 — 숲을 골프장으로 바꿀까? 찬성·반대 팻말(✨ 정답 없음)' },
        { id: 'c_slide', k: 'landslide', ai: '가파른 산비탈 길 — 산사태 주의(✨)' },
        { id: 'c_park', k: 'parking', ai: '지역 문제 — 불법 주차 + 단속 CCTV 팻말(✨)' },
        { id: 'c_dump', k: 'dumping', ai: '지역 문제 — 쓰레기 무단 투기(✨ 바로 옆 분리수거장이 해결)' },
        { id: 'c_reclaim', k: 'reclaim', cell: '다13', ai: '교과서 간척 — 바다를 막아(방조제) 새로 만든 땅 · 논과 작은 산업 용지(✨ 빈칸 · 아이 갯벌 마13·바13은 그대로)' },
        { id: 'c_noise', k: 'noisewall', ai: '지역 문제 — 큰길 소음 + 아파트 앞 방음벽(✨)' },
      ],

      fill2: [
        { id: 'f_shade', k: 'shade', cell: '나7', at: [0.49, 0.74], ai: '읍내 우체국 곁 빈 잔디 — 우체국·사무실에 온 사람이 기다리며 쉴 그늘이 없어서, 마을 어귀에 흔한 큰 나무(정자나무) 밑 정자 쉼터로(✨)' },
        { id: 'f_garden', k: 'garden', cell: '차1', at: [0.44, 0.63], ai: '시내 남서쪽 끝 빈 잔디 — 아파트·상가에 사는 이웃이 흙을 만질 곳이 없어서, 빈터를 칸으로 나눠 가꾸는 마을 텃밭으로 · 옆 칸 들(딸기 하우스·배 과수원)과 이어짐(✨)' },
        { id: 'f_flower', k: 'flower', cell: '자5', at: [0.55, 0.64], ai: '곤충 박물관 앞 빈 잔디 — 박물관에서 본 나비·벌을 밖에서 직접 보도록 꿀이 많은 꽃을 심은 꽃밭(✨)' },
        { id: 'f_cairn', k: 'cairn', cell: '다3', at: [0.7, 0.19], ai: '뒷산 전망대 가는 산길 곁 평평한 자리 — 오르는 사람이 돌을 하나씩 얹어 쌓은 돌탑과 걸상(쉬어 가는 곳 · 길 표시)(✨)' },
        { id: 'f_gym', k: 'gym', cell: '바5', at: [0.26, 0.77], ai: '「아파트」 칸 아파트 곁 빈 잔디 — 아파트 사는 이웃이 아침저녁 몸을 푸는 운동 쉼터(✨)' },
        { id: 'f_bikes', k: 'bikes', cell: '사2', at: [0.5, 0.62], ai: '관광 동네(아쿠아리움·뷔페) 빈 잔디 — 놀러 온 사람이 자전거를 세울 곳이 없어서 자전거 보관대(✨)' },
      ],

      kidlook: [
        { cell: '다6', k: 'rain', mid: true, ai: '자연친화 마을 — 빗물 저금통·공동 텃밭·생태 연못·분리수거장·투수 블록 길·자전거 · 집 지붕 태양광 · mid = 묶음은 칸 가운데 쪽(표지석 곁 띠는 큰길과 담 사이라 걸어서 못 들어감 · KIDLOOK-2) — 들머리엔 풍력·저금통·텃밭 상자' },
        { cell: '마11', k: 'temp', ai: '자연친화도시 — 덩굴 시렁·벽면 녹화(덩굴 벽) 앞·맨 벽 앞·나무 그늘 온도계 셋 · 아파트 옥상 정원' },
        { cell: '다8', k: 'obs', ai: '자연 도시(생태계 보호) — 생태 보호 구역(밧줄 울)·새집·곤충 호텔·생태 연못' },
        { cell: '바11', k: 'perm', ai: '자연도시 — 투수 블록 길과 아스팔트를 나란히·빗물 정원(자갈 고랑)' },
        { cell: '사3', k: 'jang', ai: '자연 친화 도시(농촌 마을) — 돌 단 장독대·돌담·텃밭 이랑·경운기' },
        { cell: '라5', k: 'tree', ai: '숲속 마을 — 큰 소나무 사이 흙 오솔길·통나무 의자·그루터기' },
        { cell: '다3', k: 'wood', ai: '산 집 — 돌축대·처마 밑 받침목·장작더미' },
        { cell: '다5', k: 'hole', ai: '산에 있는 집 — 비탈 아래 축대와 물빠짐 구멍·배수 도랑' },
        { cell: '라8', k: 'bus', ai: '학원가 아파트 — 학원 버스 정류장·노란 어린이 통학버스·시간표 판' },
        { cell: '자11', k: 'alley', ai: '유럽 옛 마을 — 돌길 분수 광장·꽃 화분·옛 가로등 · 골목에 매단 간판 셋' },
      ],
      fac: [
        { k: 'streetlight', rule: 'allroads', ai: true }, ...['crosswalk', 'signal', 'bikelane'].map(k => { const r = KID_REQ.find(q => q.k === k); return { k, rule: r.rule,     by: r.by, why: r.why }; }),
        { k: 'busstop', rule: 'bigroads', ai: true }, { k: 'bench', rule: 'parks', ai: true }, { k: 'schoolzone', rule: 'school', ai: true },
      ],
    },
  },
};
