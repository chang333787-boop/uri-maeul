export const FARM_V = 1;
export const FARM_MAX = 6;

export const CROPS = {
  '🥔': ['감자', 'Potato', 3, 4, 0x5c9a48, 0xc9a26a, 0.32, 'root'],
  '🥕': ['당근', 'Carrot', 3, 4, 0x6fb84e, 0xee7a2a, 0.30, 'root'],
  '🍅': ['방울토마토', 'Cherry tomato', 3, 5, 0x4f8f3e, 0xe2412f, 0.62, 'tall'],
  '🥒': ['오이', 'Cucumber', 3, 4, 0x5aa043, 0x3c7a2a, 0.58, 'tall'],
  '🌽': ['옥수수', 'Corn', 3, 3, 0x6aa84f, 0xf2c531, 0.85, 'tall'],
  '🥬': ['배추', 'Cabbage', 3, 3, 0x6fb34f, 0xc8e69a, 0.36, 'leafy'],
  '🍠': ['고구마', 'Sweet potato', 3, 4, 0x4f8a3e, 0xa8456a, 0.26, 'root'],
  '🍓': ['딸기', 'Strawberry', 3, 4, 0x4f9a40, 0xe0304a, 0.2, 'root'],
};

export const SEEDS = { spring: ['🥔', '🥕'], summer: ['🍅', '🥒', '🌽'], autumn: ['🥬', '🍠'], winter: [] };
export const seedsOf = s => SEEDS[s] || SEEDS.autumn;

export function plotState(P, day) { if (!P || !P.c) return 'empty'; const C = CROPS[P.c]; if (!C) return 'empty'; if (P.g >= C[2]) return 'ripe'; return P.w === day ? 'grow' : 'water'; }

export function farmGrow(S, day, rain) { let n = 0; for (const P of S.farm || []) { if (!P || !P.c || !CROPS[P.c]) continue; if (P.g >= CROPS[P.c][2]) continue; if (rain || P.w === day - 1) { P.g++; n++; } } return n; }

export function plantSpots(bed, P, day) { const st = plotState(P, day); if (st === 'empty') return []; const C = CROPS[P.c], k = Math.min(1, (P.g + (st === 'ripe' ? 1 : 0.35)) / (C[2] + 1)), out = [];
  const [a, b, rz] = bed, n = Math.max(3, Math.min(8, Math.floor((b - a - 0.4) / 0.8)));
  for (let i = 0; i < n; i++) { const x = a + 0.4 + (b - a - 0.8) * (n === 1 ? 0.5 : i / (n - 1)), z = rz + (i % 2 ? 0.22 : -0.22); out.push([x, z, k, st === 'ripe' ? 1 : 0]); }
  return out; }
