const PEOPLE = {
  '1학년': { t: '남', s: [['건우', '남'], ['로운', '남'], ['연우', '남'], ['수아', '여']] },
  '2학년': { t: '남', s: [['혜원', '여']] },
  '3학년': { t: '여', s: [['채원', '여'], ['예서', '여'], ['서하', '여'], ['시윤', '남'], ['민성', '남'], ['정우', '남']] },
  '4학년': { t: '남', s: [['윤호', '남'], ['유나', '여'], ['윤서', '여'], ['지유', '여'], ['하윤', '여'], ['하율', '남']] },
  '5학년': { t: '남', s: [['소율', '여'], ['아린', '여'], ['지우', '여'], ['지환', '남'], ['태오', '남'], ['도윤', '남'], ['지호', '남'], ['도현', '남']] },
  '6학년': { t: '남', s: [['우현', '남'], ['은찬', '남'], ['주원', '남'], ['준서', '남'], ['다온', '남'], ['연서', '여']] },
};

const STAFF = {
  '보건실': [['보건선생님', '여']],
  '사랑반': [['사랑반선생님', '여']],
  '나래반': [['나래반선생님', '여']],
  '유치원': [['유치원선생님', '여'], ['새싹이', '남', 'small'], ['풀잎이', '여', 'small'], ['하늘이', '여', 'small']],
  '도서실': [['사서선생님', '여']],
  '행정실': [['행정실장님', '여'], ['행정 선생님', '여'], ['행정 선생님', '여']],
  '교무실': [['교감선생님', '여'], ['교무 선생님', '여'], ['교무 선생님', '여']],
  '교장실': [['교장선생님', '남']],
  '돌봄교실': [['돌봄선생님', '여']],
  '급식실': [['급식선생님', '여'], ['청소선생님', '여']],
};

export const PROMO = typeof window !== 'undefined' && !!window.SM_PROMO;
const promoPeople = () => Object.fromEntries(Object.entries(PEOPLE).map(([cls, v]) => [cls, { t: v.t, desks: 6, s: Array.from({ length: 6 }, (_, i) =>
  [cls + ' 친구', v.s[i] ? v.s[i][1] : ((i - v.s.length) % 2 === 0) === (v.s[v.s.length - 1][1] === '남') ? '여' : '남']) }]));
const promoStaff = () => Object.fromEntries(Object.entries(STAFF).map(([room, L]) => [room, L.map(p => p[2] === 'small' ? ['유치원 친구', p[1], p[2]] : p)]));

export const SCHOOL = {
  name: '우리초등학교',
  people: PROMO ? promoPeople() : PEOPLE,
  staff: PROMO ? promoStaff() : STAFF,

  building: {
    floorHeight: 3.4,
    wallColor: 0xd8c39a,
    roofColor: 0x3e8e5e,

    front: {
      x: [-40, 51], z: [-34, -24], corridorDepth: 2.5,
      rooms: [
        { name: '원무실',   type: 'office',    span: [-40, -33.5], kinderOffice: true },
        { name: '유치원',   type: 'classroom', span: [-33.5, -23.3], kinder: true },
        { name: '사랑반',   type: 'classroom', span: [-23.3, -15] },
        { name: '돌봄교실', type: 'daycare',   span: [-15, -6.65] },
        { name: '행정실',   type: 'office',    span: [-6.65, -1.9] },
        { name: '교장실',   type: 'office',    span: [-1.9, 2.2] },
        { name: '교무실',   type: 'office',    span: [2.2, 10.4] },
        { name: '현관',     type: 'hall',      span: [10.4, 14.6] },
        { name: '화장실',   type: 'toilet',    span: [14.6, 24.15] },
        { name: '컴퓨터실', type: 'computer',  span: [24.15, 33.05] },
        { name: '1학년',    type: 'classroom', span: [33.05, 41.45] },
        { name: '3학년',    type: 'classroom', span: [41.45, 51] },
      ],
      kinderFacadeX: -23.3,
    },

    entrance: { x: [10.25, 14.75], z: [-24, -20], recess: { x: [10.75, 14.25], z: [-22.6, -20] }, innerDoorZ: -24.15 },

    wings: [
      { id: 'west', x: [-40, -11], z: [-44.5, -34], twoStory: true,
        rooms: [
          { name: '보건실', type: 'nurse',     span: [-40, -34.4] },
          { name: '나래반', type: 'classroom', span: [-34.4, -28.2] },
          { name: '문서고', type: 'storage',   span: [-28.2, -25.9], innerOnly: true },
          { name: '도서실', type: 'library',   span: [-25.9, -15.75] },
          { name: '계단',   type: 'stair',     span: [-15.75, -11] },
        ] },
    ],

    westLobby: { x: [-33.5, -25.9], northZ: -38.5, vestibuleZ: [-38.5, -36], kinderBlockZ: -36, sofa: [-29.6, -34.6] },

    kitchen: { x: [-7.8, 10], z: [-51, -34], wallHeight: 4.5, roofColor: 0x46352b, roofWest: 0.7,
               hallX0: -1,
               curtainZ: -48.4,

               doorC: 4.5,
               exitC: 0.8,
               staffC: 9.3,
               staffDoorC: -3,
               kitchenDoorZ: -38.9,
               serveZ: [-46.3, -40.9],
               storeDoorZ: -49.7,
               nutri: { x: [-3.4, -1], z: [-51, -46.95], doorZ: -47.55 },
               backDoorC: -4.5,
               cornerDoorZ: -49.7,
               passX: 6.2,
               dutyRoom: { x: [-7.8, -5], z: [-38, -34], doorC: -6.6 } },

    centerLobby: { x: [10, 15], z: [-36.7, -34] },

    linkCorridor: { x: [10, 12.5], z: [-51, -36.7] },

    eastWing: {
      x: [12.5, 45], z: [-51, -40.9], corridorDepth: 2.5,

      corridorEndX: 32.3,
      rooms: [
        { name: '2학년',   type: 'classroom', span: [12.5, 22.2] },
        { name: '4학년',   type: 'classroom', span: [22.2, 29.9] },
        { name: '과학실',  type: 'science',   span: [29.9, 40.5], door: 31.2 },
        { name: '과학준비실', type: 'storage', span: [32.3, 40.5], innerOnly: true, row: 'corridor' },
        { name: '창고',    type: 'storage',   span: [40.5, 45], external: true },
      ],
    },

    upper: {
      corridorDepth: 2.7,
      rooms: [
        { name: '6학년', type: 'classroom', span: [-40, -30.7] },
        { name: '5학년', type: 'classroom', span: [-30.7, -21.4] },
        { name: '소담실', type: 'office',    span: [-21.4, -15.75] },
      ],
    },
  },

  terrain: { TERR_Z: -13.6, fieldZ: -12.4, westX: -40.5, westZ: -4, gymSouthX: -43.5, gymSouthZ: -0.8, yard: -0.3, field: -1.35, court: -0.15 },

  frontYard: { strip: -22.5, walkN: -19.5, walkS: -17.5 },

  gym:        { center: [-66.25, -17.25], width: 29.5, depth: 25.5, wallHeight: 8, floorY: 0.15,
                annex: { x: [-51.5, -45], z: [-26, -7] }, doorZ: -18.75 },
  field:      { x: [-49.5, 50], z: [-12.4, 41] },
  eastFenceX: 39,
  eastPath:   { x: [40.5, 42.5] },
  porch:      { x: [9.25, 15.5] },
  southFenceZ: 41.5,
  playground: { center: [-39.5, 52] },
  kinderPlayground: { x: [-50, -41.5], z: [0.7, 14.5] },
  gymStairs:  { x: [-43.5, -40.5], zTop: -4, zBot: 0 },
  shelter:    { center: [-13, 46.75], length: 36 },
  plaza:      { x: [-33.8, 13.1], z: [44.5, 55.6] },
  bigTree:    [38.5, 30],
  forestPlay: { x: [22, 36], z: [37, 47] },
  sink:       [44, 16],
  gate:       [16.5, 55.5],
  bus:        [8, 50.5],

  garden:     { x: [10, 40.5], z: [-78.3, -59.5], poly: [[10, -75.6], [20, -75.6], [31.5, -78.3], [40.5, -59.5], [10, -59.5]], east: [59.5, -64.8] },
  gardenDeck: { center: [54.65, -49.75], x: [50, 59.3], z: [-56.5, -43] },

  parking:    { x: [-48, -1.3], z: [-80.75, -44.65], curb: [[-48, -80.75], [-27, -75.6], [-1.3, -75.6]] },

  shed:       { center: [0.9, -66], h: 2.6, units: [{ x: [-1.05, 2.85], z: [-73.55, -67.25] }, { x: [-1.05, 2.85], z: [-64.45, -58.45] }] },
  flagPole:   [8.7, -16.75],

  boundary: [[-86, -86], [-49, -86], [-49, -81.8], [-27, -76.4], [20, -76.4], [60, -86], [60, 45], [22, 52.5], [-50.5, 63], [-50.5, -0.8], [-86, -0.8]],
};

Object.assign(SCHOOL, { eastFenceX: 39.7, eastPath: { x: [40.15, 43.15] }, bigTree: [36.8, 28.4], forestPlay: { x: [28.0, 39.4], z: [44.8, 49.8] }, sink: [44.3, 31.6] });
SCHOOL.field.x[1] = 40.15;

SCHOOL.bballSand = { x: 29.0, z: [-8.0, 36.0] };

{ const B = SCHOOL.boundary, i = B.findIndex(p => p[0] === 22 && p[1] === 52.5);
  if (i >= 0 && B[i + 1] && B[i + 1][0] === -50.5 && B[i + 1][1] === 63) B.splice(i, 2, [21.1, 55.5], [11.9, 55.5], [-42.6, 69.3], [-50.5, 43.5]); }
SCHOOL.bus = [0.8, 50.6];
