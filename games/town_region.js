export const REGN = {
  읍내: { n: '어울목', en: 'Eoulmok', mean: '길이 모여 사람들이 어울리는 길목', mean_en: 'where roads meet and people gather', look: '마을 가운데예요. 우리 학교와 우체국, 소방서, 은행이 있어요' },
  들: { n: '넘실들', en: 'Neomsildeul', mean: '벼 이삭이 바람에 넘실대는 너른 들', mean_en: 'wide fields where rice waves in the wind', look: '논밭과 딸기 비닐하우스, 배 과수원, 약초 시장이 있어요' },
  산: { n: '솔솔재', en: 'Solsoljae', mean: '솔바람이 솔솔 부는 고개 마을', mean_en: 'a pass where the pine breeze blows', look: '뒷산 기슭에 표고 재배장과 배추밭, 목장, 산림 스키장이 있어요' },
  강: { n: '두런내', en: 'Dureonnae', mean: '강을 따라 사람들이 두런두런 모이는 마을', mean_en: 'a riverside village full of friendly chatter', look: '호수와 강, 계곡 캠핑장, 동물보호센터, 병원 거리가 있어요' },
  바다: { n: '출렁포', en: 'Chulleongpo', mean: '파도가 출렁이고 배가 드나드는 포구', mean_en: 'a harbor where waves roll and boats come and go', look: '선착장과 어항, 수산물 시장, 염전, 해수욕장이 있어요' },
  시내: { n: '반짝시', en: 'Banjjaksi', mean: '밤에도 불빛이 반짝이는 큰 거리', mean_en: 'busy streets that sparkle even at night', look: '영화관과 버스 터미널, 곤충 박물관, 축구장이 있어요' },
  관광: { n: '나들터', en: 'Nadeulteo', mean: '나들이 온 손님이 머물다 가는 터', mean_en: 'where visitors come to spend a day out', look: '대형 아쿠아리움과 관광 안내소, 뷔페가 있어요' } };
export const REG_KEYS = Object.keys(REGN);
export const regName = (rg, en) => { const R = REGN[rg]; return R ? (en ? R.en : R.n) : ''; };

export function createRegion(o) {
  const ST = { cur: null, kid: null, cand: '', since: 0, lastAnn: {}, longDay: {}, kidDay: {}, log: [], first: true };
  function tick(me, now) { if (o.off()) return; const rg = o.region(me.x, me.z); if (!rg || !REGN[rg]) return; const K = o.kid(me.x, me.z), key = rg + '|' + (K ? K.g : '');
    if (rg === ST.cur && (K ? K.g : null) === ST.kid) { ST.cand = ''; return; }
    if (key !== ST.cand) { ST.cand = key; ST.since = now; return; }
    if (now - ST.since < 1500) return;
    ST.cand = ''; const first = ST.first; ST.first = false; const en = o.en(), d = o.day();
    if (K) { const was = ST.kid; ST.kid = K.g; if (first || was === K.g || ST.kidDay[K.g] === d) return; ST.kidDay[K.g] = d;
      const t = en ? K.t + ' — a neighborhood the kids named' : K.t + ' — 아이들이 지은 동네'; o.say(t, 3.4); ST.log.push({ kid: K.g, rg, long: true, t }); if (ST.log.length > 40) ST.log.shift(); return; }
    ST.kid = null; if (rg === ST.cur) return; const was = ST.cur; ST.cur = rg; if (first || was == null) return;
    if (ST.lastAnn[rg] != null && now - ST.lastAnn[rg] < 180000) return; ST.lastAnn[rg] = now;
    const R = REGN[rg], long = ST.longDay[rg] !== d; ST.longDay[rg] = d;
    const t = en ? 'Welcome to ' + R.en + (long ? ' — ' + R.mean_en : '') : R.n + '에 들어왔어요' + (long ? ' — ' + R.mean : '');
    o.say(t, long ? 4.2 : 2.6); ST.log.push({ rg, long, t }); if (ST.log.length > 40) ST.log.shift(); }
  return { tick, cur: () => ST.cur, kid: () => ST.kid, log: () => ST.log, reset: () => { ST.cur = null; ST.kid = null; ST.cand = ''; ST.first = true; ST.lastAnn = {}; ST.longDay = {}; ST.kidDay = {}; ST.log = []; } };
}

const KROW = '가나다라마바사아자차카타파하', BARE = /^(집|아파트|빌라|마을|펜션|노인정|풀빌라)$/;
export function kidHoods(areas, isHome) { const C = [];
  for (const a of areas || []) { const t = (a.hood || a.t || '').trim(); if (!t || a.noStone && !a.hood) continue; const live = (a.fill && a.fill.k === 'live') || a.card === '사는 곳' || /\s집$/.test(t);     if (!live || BARE.test(t) || (!a.hood && isHome(t))) continue;
    for (const c of a.cells || (a.cell ? [a.cell] : [])) { const r = KROW.indexOf(c[0]), k = parseInt(c.slice(1), 10); if (r < 0 || !(k >= 1)) continue; C.push({ cell: c, r, c: k, t, key: t.replace(/\(.*?\)/g, '').replace(/\s/g, ''), ai: a.ai || '' }); } }
  const G = []; for (const q of C) { if (q.g != null) continue; const g = { id: 'k' + G.length, key: q.key, cells: [] }; G.push(g); const st = [q]; q.g = g.id;
    while (st.length) { const p = st.pop(); g.cells.push(p); for (const o of C) if (o.g == null && o.key === p.key && Math.abs(o.r - p.r) <= 1 && Math.abs(o.c - p.c) <= 1) { o.g = g.id; st.push(o); } } }
  const byCell = new Map(); for (const g of G) { g.names = [...new Set(g.cells.map(q => q.t))]; g.t = g.cells[0].t; for (const q of g.cells) byCell.set(q.cell, { g: g.id, t: q.t, short: q.t.replace(/\s*\(.*?\)\s*/g, '').trim() || q.t }); }
  return { groups: G, byCell }; }
