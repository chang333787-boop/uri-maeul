const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const HOURS = 8, KID_HOURS = 2;
import { checkChat } from './chatfilter.js?v=1';
export const isTeacherRoom = (c) => !!(c && c.k && !/^🧒/.test(c.n || ''));
const CSS = `
.lb-pop{position:fixed;z-index:46;width:min(340px,92vw);max-height:80vh;overflow:auto;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;border-radius:14px;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.3);font:14px/1.5 "Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;box-sizing:border-box}
.lb-pop h4{margin:0 0 6px;font-size:16px}
.lb-pop .sm{color:#5a6b80;font-size:13px}
.lb-pop button{font:inherit;font-weight:800;border:0;border-radius:9px;padding:7px 11px;background:#1d3557;color:#fff;cursor:pointer}
.lb-pop button.sub{background:#e8edf3;color:#1d3557}
.lb-pop button.warn{background:#ffe3e3;color:#c92a2a}
.lb-pop .rooms{display:grid;gap:6px;margin:8px 0}
.lb-pop .rooms button{text-align:left;background:#eef4ff;color:#1d3557;border:2px solid #c9d8f0}
.lb-pop .rooms button.on{border-color:#1d3557;background:#fff3bf}
.lb-pop input{font:inherit;font-size:16px;border:2px solid #c9d3df;border-radius:9px;padding:7px 9px;box-sizing:border-box;width:100%;color:#1d3557;background:#fff}
.lb-pop .row{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}
.lb-pop .box{margin:6px 0;padding:6px 8px;background:#eef4ff;border-radius:8px}
.lb-pop .rg{display:grid;gap:6px;margin:6px 0}
.lb-pop .rg button{text-align:left;background:#eef4ff;color:#1d3557;border:2px solid #c9d8f0;font-size:15px;padding:9px 11px}
.lb-pop .rg button.on{border-color:#1d3557;background:#fff3bf}
.lb-pop .now{margin:6px 0;padding:7px 9px;border-radius:9px;background:#fff3bf;font-weight:700}
.lb-big{position:fixed;inset:0;z-index:47;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
.lb-big>div{background:#fffdf6;color:#1d3557;border:4px solid #1d3557;border-radius:22px;padding:22px 34px;text-align:center;max-width:92vw}
.lb-big .code{font-size:clamp(72px,16vw,150px);font-weight:900;letter-spacing:.12em;line-height:1.1;margin:6px 0}
.lb-big button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:9px 16px;background:#1d3557;color:#fff;cursor:pointer;margin-top:10px}
.lb-ask{position:fixed;inset:0;z-index:80;display:flex;align-items:flex-start;justify-content:center;padding-top:14vh;background:rgba(10,20,40,.45);box-sizing:border-box}
.lb-ask .lb-pop{position:relative;width:min(300px,92vw)}
.lb-ask input.pin{font-size:30px;font-weight:800;letter-spacing:.45em;text-align:center;padding:8px 0 8px .45em;margin:8px 0 2px}
.lb-ask input.pin::placeholder{font-size:15px;font-weight:600;letter-spacing:0;color:#9aa7b6}
.lb-ask .err{min-height:1.5em;color:#c92a2a;font-size:13px;font-weight:700}
.lb-ask .lb-pop{background:#fff8ea;color:#2b2420;border:4px solid #2b2420;border-radius:18px;box-shadow:0 7px 0 #2b2420,0 22px 44px rgba(0,0,0,.3);padding:14px 18px 16px}
.lb-ask .lb-pop h4{font-size:19px;font-weight:900}
.lb-ask input.pin{border:3px solid #2b2420;border-radius:12px;background:#fff;color:#2b2420;width:100%;box-sizing:border-box}
.lb-ask .lb-pop button{font-weight:800;font-size:15px;color:#fff;background:#3f8f4e;border:3px solid #2b2420;border-radius:12px;padding:7px 14px;min-height:44px;box-shadow:0 4px 0 #2b2420;cursor:pointer}
.lb-ask .lb-pop button:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2420}
.lb-ask .lb-pop button.sub{background:#f4e6c8;color:#2b2420}
`;

const CSS2 = `
.lb-pop{max-height:calc(100vh - 24px)}
.lb-pop .msg{margin-top:6px;color:#c92a2a;font-size:13px;font-weight:700}.lb-pop .msg.ok{color:#2b8a3e}.lb-pop .msg:empty{display:none}
.lb-pop button.big{display:block;width:100%;font-size:16px;padding:10px 12px;background:#ffd23c;color:#1d3557;border:2px solid #1d3557;text-align:center}
.lb-pop details{margin-top:6px}.lb-pop summary{cursor:pointer;font-weight:700;min-height:24px}
#mpChip.mp-call{background:#ffd23c;color:#1d3557;font-weight:800;box-shadow:0 0 0 3px #1d3557}
body.touch .lb-pop button,body.touch .lb-big button{min-height:44px}
`;
const addCss = () => { for (const [id, tx] of [['lb-css', CSS], ['lb-css2', CSS2]]) if (!document.getElementById(id)) { const st = document.createElement('style'); st.id = id; st.textContent = tx; document.head.appendChild(st); } };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const req = (path, method = 'GET', data) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));

const wipeRoom = (c) => Promise.all(['', 'w'].flatMap((sf) => ['/chat', '/ctl'].map((pt) => req('/rooms/c' + c + sf + pt, 'DELETE').catch(() => null))));
const rand = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
const hash = async (pin) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mv-memo:' + pin)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {   } } };
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {   } } };

export function askPin(title, o = {}) {
  addCss(); const prev = document.querySelector('.lb-ask'); if (prev && prev._x) prev._x();
  document.exitPointerLock?.();
  return new Promise((res) => {
    const mask = !!(window.CSS && window.CSS.supports && window.CSS.supports('-webkit-text-security', 'disc'));
    const wrap = document.createElement('div'); wrap.className = 'lb-ask ttl-keep';
    wrap.innerHTML = '<div class="lb-pop" role="dialog" aria-modal="true"><h4>🔒 ' + esc(title) + '</h4>' + (o.sub ? '<div class="sm">' + esc(o.sub) + '</div>' : '')
      + '<input class="pin" type="' + (mask ? 'text' : 'password') + '" inputmode="numeric" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="숫자 4자리" aria-label="' + esc(title) + '"' + (mask ? ' style="-webkit-text-security:disc"' : '') + '>'
      + '<div class="err" role="alert"></div><div class="row"><button class="sub" data-l="no">취소</button><button data-l="ok">확인</button></div></div>';
    const inp = wrap.querySelector('input'), err = wrap.querySelector('.err'); let busy = false;
    const done = (v) => { if (!wrap.isConnected) return; wrap.remove(); res(v); };
    const ok = async () => {
      if (busy) return; const v = inp.value;
      if (!/^\d{4}$/.test(v)) { err.textContent = '숫자 4자리를 넣어 주세요'; inp.focus(); return; }
      if (o.check) {
        busy = true; let m = null; try { m = await o.check(v); } catch (e) { m = '인터넷을 확인해 주세요'; } busy = false;
        if (m) { err.textContent = m; inp.value = ''; inp.focus(); return; }
      }
      done(v);
    };
    wrap._x = () => done(null); wrap._ok = ok;
    inp.addEventListener('input', () => { const v = inp.value.replace(/\D/g, '').slice(0, 4); if (v !== inp.value) inp.value = v; err.textContent = ''; });
    wrap.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-l]'); if (b) { if (b.dataset.l === 'ok') ok(); else done(null); } else inp.focus(); });
    document.body.appendChild(wrap); inp.focus();
  });
}

for (const t of ['keydown', 'keypress']) addEventListener(t, (e) => {
  const w = document.querySelector('.lb-ask'); if (!w) return;
  e.stopImmediatePropagation(); if (t !== 'keydown' || e.isComposing) return;
  if (e.key === 'Enter') { e.preventDefault(); w._ok && w._ok(); } else if (e.key === 'Escape') { e.preventDefault(); w._x && w._x(); }
}, true);

const PINF = 'sm.tpf', pinGet = () => { try { const j = JSON.parse(ss.get(PINF) || 'null'); return j && typeof j === 'object' ? j : { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } };
const pinWait = () => { const j = pinGet(), left = Math.ceil(((j.until || 0) - Date.now()) / 1000); return left > 0 ? '세 번 틀려서 잠시 쉬어요 — ' + left + '초 뒤에 다시 넣어 주세요' : null; };
const pinMiss = (bad) => { if (!bad) { ss.set(PINF, JSON.stringify({ n: 0, until: 0 })); return null; } const j = pinGet(), n = (j.n | 0) + 1; if (n >= 3) { ss.set(PINF, JSON.stringify({ n: 0, until: Date.now() + 60000 })); return '세 번 틀렸어요 — 1분 뒤에 다시 넣어 주세요'; } ss.set(PINF, JSON.stringify({ n, until: 0 })); return '비밀번호가 달라요 — 다시 넣어 주세요(' + (3 - n) + '번 남음)'; };

export async function teacherPin(toast = () => {}) {
  if (ss.get('sm.t') === '1') return true;
  let saved = null; try { saved = await req('/memoPin'); } catch (e) { toast('인터넷을 확인해 주세요'); return false; }
  let r = true;
  if (!saved) {
    if (!new URLSearchParams(location.search).has('setpin')) { toast('🔒 선생님 비밀번호가 아직 없어요 — 선생님께 알려 주세요', 3); return false; }
    const a = await askPin('선생님 비밀번호를 처음 정해요', { sub: '숫자 4자리 — 한 번 정하면 화면에서는 바꿀 수 없어요 · 메모장·블록 놀이·함께하기 방 만들기에 같이 써요' }); if (!a) return false;
    if (!(await askPin('한 번 더 넣어 주세요', { check: (v) => v === a ? null : '처음 넣은 것과 달라요 — 다시 넣거나, 취소하고 처음부터 해요' }))) return false;
    try { await req('/memoPin', 'PUT', await hash(a)); } catch (e) { toast('저장하지 못했어요'); return false; }
    r = 'new';
  } else if (!(await askPin('선생님 비밀번호', { check: async (v) => { const w = pinWait(); if (w) return w; if ((await hash(v)) === saved) { pinMiss(0); return null; } return pinMiss(1); } }))) return false;
  ss.set('sm.t', '1'); dispatchEvent(new CustomEvent('sm-teacher')); return r;
}

export function createLobby(o) {
  const { chip, suffix = '', label = '', join, leave, net, toast = () => {}, onTeacher = null, onGoTo = null, rooms = null } = o;
  addCss();
  let cur = null, pop = null, big = null, pollT = 0, popT = 0, anchor = null;
  const live = (p) => p && typeof p.e === 'number' && p.e > Date.now();

  const say = (m, sec = 3, ok) => { const el = pop && pop.isConnected && pop.querySelector('.msg'); if (el) { el.textContent = m || ''; el.classList.toggle('ok', !!ok); } else if (m) toast(m, sec); };
  async function check(c, r) {
    const p = await req('/codes/' + c); if (!live(p) || (r && p.r !== r)) return null;
    const x = await req('/lobby/' + p.r + '/x'); return x ? null : p;
  }
  function draw() {
    const N = net(), rgi9 = rooms ? (rooms.run ? rooms.run() : rooms.cur()) : 0, rg = rooms && cur && !cur.k && N && rgi9 ? rooms.list().find((q) => q.i === rgi9) : null, call = !!(rg && !rooms.inIt());
    chip.textContent = cur && N ? (call ? '👥 ' + (document.body.classList.contains('small') ? '' : cur.n + ' · ') + '🎮 ' + rg.t.replace(/^\S+\s+/, '').replace(/\s*\(.*?\)/, '') + ' 하는 중' : '👥 ' + cur.n + ' · ' + N.count + '명 · ' + N.name) : '👥 함께하기 (방 들어가기)';
    chip.classList.toggle('mp-call', call);
  }
  function enter(info, quiet) {
    cur = info; ls.set('mp.room', JSON.stringify(info)); join('c' + info.c + suffix, info); draw();
    clearInterval(pollT); pollT = setInterval(recheck, 20000);
    if (!quiet) toast('👥 「' + info.n + '」 방에 들어왔어요 — 친구들이 이름표와 함께 보여요', 3);
    dispatchEvent(new CustomEvent('sm-room', { detail: info }));
  }
  async function recheck() { if (!cur) return; try { if (!(await check(cur.c, cur.r))) out(cur.k ? '🚪 방이 끝났어요' : /^🧒/.test(cur.n) ? '🚪 방장이 방을 닫았어요' : '🚪 선생님이 방을 닫았어요'); } catch (e) {   } }
  function out(msg) { clearInterval(pollT); if (cur) leave(); cur = null; ls.set('mp.room', null); draw(); closePop(); if (msg) toast(msg, 3); dispatchEvent(new CustomEvent('sm-room', { detail: null })); }
  const closePop = () => { clearInterval(popT); if (pop) pop.remove(); pop = null; };
  function place(p) {
    const A = anchor && anchor.isConnected && anchor.getClientRects().length ? anchor : chip, r = A.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    const x = r.left > innerWidth / 2 ? r.right - w : r.left;
    p.style.left = Math.max(8, Math.min(innerWidth - w - 8, x)) + 'px';
    p.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.bottom + 6)) + 'px';
  }
  function popup(html) {
    closePop(); document.exitPointerLock?.();
    pop = document.createElement('div'); pop.className = 'lb-pop ttl-keep';   pop.innerHTML = html;
    for (const t of ['keydown', 'keyup']) pop.addEventListener(t, (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(pop); place(pop); return pop;
  }
  function showBig() {
    if (!cur) return; if (big) big.remove();
    big = document.createElement('div'); big.className = 'lb-big ttl-keep';
    big.innerHTML = '<div><div style="font-size:20px;font-weight:800">🏫 ' + esc(cur.n) + '</div><div class="sm" style="font-size:16px;color:#5a6b80">방 번호</div><div class="code">' + cur.c + '</div>'
      + '<div style="font-size:17px"><b>👥 함께하기</b> 단추(메뉴 화면 = 오른쪽 위 · 걷는 화면 = 왼쪽 위) → 「' + esc(cur.n) + '」 고르기 → 번호 4자리</div><div class="sm" style="font-size:15px;margin-top:4px">친구들이 들어오면 🏠 대기실에서 놀이를 고르고 ▶ 시작</div><button>닫기</button></div>';
    big.querySelector('button').onclick = () => { big.remove(); big = null; };
    big.addEventListener('click', (e) => { if (e.target === big) { big.remove(); big = null; } });
    for (const t of ['keydown', 'keyup']) big.addEventListener(t, (e) => { e.stopPropagation(); if (e.key === 'Escape' && big) { big.remove(); big = null; } });
    document.body.appendChild(big); document.exitPointerLock?.();
  }
  async function create(kid) {
    let name;
    if (kid) { const ck = checkChat(kid); if (!ck.ok) return say('이름을 고운 말로 바꿔 주세요'); name = ('🧒 ' + kid + '의 방').slice(0, 20); }
    else { if (!(await teacherPin(say))) return;
      const n = prompt('방 이름(아이들 목록에 보여요)', '우리 반'); if (n == null) return; name = (n.trim() || '우리 반').replace(/[<>]/g, '').replace(/^🧒\s*/, '').slice(0, 20); }
    const rid = rand(10), k = rand(24), e = Date.now() + (kid ? KID_HOURS : HOURS) * 3600e3;
    try {
      let c = null;
      for (let i = 0; i < 25 && !c; i++) { const t = String(1000 + Math.floor(Math.random() * 9000)); if (!live(await req('/codes/' + t))) c = t; }
      if (!c) return say('번호를 만들지 못했어요 — 다시 해 주세요');
      await req('/keys/' + rid, 'PUT', k);
      await req('/lobby/' + rid, 'PUT', { n: name, e, t: { '.sv': 'timestamp' } });
      await req('/codes/' + c, 'PUT', { r: rid, e, t: { '.sv': 'timestamp' } });
      await wipeRoom(c);
      closePop(); if (cur) out(); enter({ c, r: rid, n: name, e, k }); const M = net(); if (M) M.setName(kid || '선생님'); showBig();
      req('/lobby').then((L) => { for (const id in L || {}) if (!live(L[id])) req('/lobby/' + id, 'DELETE').catch(() => {}); }).catch(() => {});
    } catch (er) { say('방을 만들지 못했어요 — 인터넷을 확인해 주세요', 3); }
  }

  function ask(text, yes, no, onYes, sub) {
    anchor = null; const P = popup('<h4>' + esc(text) + '</h4>' + (sub ? '<div class="sm">' + esc(sub) + '</div>' : '') + '<div class="row"><button class="sub" data-l="no">' + esc(no) + '</button><button class="warn" data-l="yes">' + esc(yes) + '</button></div>');
    P.style.left = '50%'; P.style.top = '30%'; P.style.transform = 'translateX(-50%)';
    P.onclick = (e) => { e.stopPropagation(); const b = e.target.closest('[data-l]'); if (!b) return; closePop(); if (b.dataset.l === 'yes' && onYes) onYes(); };
    const nb = P.querySelector('[data-l=no]'); if (nb) nb.focus({ preventScroll: true });
  }
  async function shut() {
    if (!cur || !cur.k || !confirm('「' + cur.n + '」 방을 닫을까요? 들어와 있는 친구들이 모두 나가요.')) return;
    await wipeRoom(cur.c);
    try { await req('/lobby/' + cur.r + '/x/' + cur.k, 'PUT', true); } catch (e) { return toast('닫지 못했어요'); }
    out('🔒 방을 닫았어요');
  }
  async function openList(a) {
    anchor = a instanceof Element ? a : null;
    const N = net();
    if (cur) {
      const frs = () => (N && N.friends ? N.friends() : N && N.peers ? N.peers() : []);
      let others = frs();

      const RG = rooms ? rooms.list() : [], rgi = rooms ? rooms.cur() : 0, rgNow = RG.find(q => q.i === rgi), inIt = !!(rooms && rooms.inIt()), rgName = rgNow ? rgNow.t.replace(/\s*\(.*?\)/, '') : '';

      const wrHtml = rooms && rooms.panel ? '<button data-l="wr" class="big" style="margin:4px 0 6px">🏠 대기실 ' + (rgNow ? '· 🎮 ' + esc(rgName) : '— 놀이 고르기·▶ 시작') + '</button>' : '';
      const roomHtml = rooms && rooms.panel ? '' : !rooms || !rgNow ? '' : '<div class="now">🎮 지금 방 놀이: ' + esc(rgNow.t) + (cur.k ? ' <span class="sm cnt">· 들어온 친구 ' + rooms.count(rgi) + '/' + others.length + '</span>' : '')
        + (cur.k ? '<div class="row" style="justify-content:flex-start;margin-top:6px"><button data-l="rstart" title="다 모이면 — 대기실 방장 화면이 시작을 눌러요">▶ 모두 시작 · ' + rooms.count(rgi) + '명 들어옴</button><button class="sub" data-l="rend">⏹ 놀이 끝(자유롭게)</button>' + (!inIt ? '<button class="sub" data-l="rjoin">🎮 나도 같이</button>' : '') + '</div><div class="sm" style="font-weight:400;margin-top:3px">▶ = 친구들이 대기실에 다 들어오면 눌러요</div>'
          : !inIt ? '<button data-l="rjoin" class="big" style="margin-top:6px">▶ ' + esc(rgName) + ' 같이 하기</button><div class="sm" style="font-weight:400;margin-top:3px">친구들이 지금 하고 있어요</div>' : '<div class="sm" style="font-weight:400">지금 같이 하고 있어요</div>')
        + '</div>';
      const frHtml = () => '나: <b>' + esc(N ? N.name : '') + '</b><br>' + (others.length ? '친구 ' + others.length + '명' + (onGoTo ? ' <span class="sm">(누르면 그 친구 곁으로)</span>' : '') + '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">' + others.map((p, i) => '<span style="display:inline-flex;gap:2px;align-items:center">' + (onGoTo ? '<button class="sub" data-go="' + i + '" style="padding:4px 9px"><span style="color:' + p.color + '">●</span> ' + esc(p.label) + (p.mu ? ' 🔇' : '') + (p.act ? ' <span class="sm">' + esc(p.act) + '</span>' : '') + '</button>' : '<span style="padding:2px 6px"><span style="color:' + p.color + '">●</span> ' + esc(p.label) + (p.act ? ' <span class="sm">' + esc(p.act) + '</span>' : '') + '</span>')
          + (N && N.mute && p.id ? '<button class="sub" data-mu="' + i + '" style="padding:4px 7px" title="' + (p.mu ? '이 친구의 말·이모지를 다시 봐요' : '이 친구의 말·이모지를 나에게만 안 보이게 해요(친구는 몰라요)') + '" aria-label="' + esc(p.label) + (p.mu ? ' 다시 보기' : ' 말·이모지 숨기기') + '">' + (p.mu ? '👀 다시 보기' : '🙈') + '</button>' : '') + '</span>').join('') + '</div>' + (others.some(p => p.mu) ? '<div class="sm" style="margin-top:3px">🔇 = 말·이모지를 나에게만 숨긴 친구(이 탭 · 친구는 몰라요)</div>' : '') : '<span class="sm">아직 들어온 친구가 없어요</span>');
      const tips = '• 걷기·뛰기 · 😀 인사는 서로 보여요<br>• 📝 메모장은 같은 판이면 장면·깃발을 함께 써요<br>' + (rooms ? '• 🎮 <b>다 같이 놀이</b>(물총·숨바꼭질·로봇인 척·길잡이)는 🏠 대기실에서 방장이 고르고 ▶ 시작하면 모두 같이 들어가요<br>' : '• 💦 <b>물총 친구 대결</b>은 같은 방 친구들과 함께<br>') + '• 이야기·방탈출 같은 놀이는 <b>각자 따로</b> 해요';
      const P = popup('<h4>👥 ' + esc(cur.n) + ' <span class="sm">· 방 번호 ' + cur.c + '</span></h4>'
        + wrHtml + roomHtml + '<div class="msg" role="alert"></div>'
        + (cur.k && rooms && !rooms.panel ? '<div style="margin-top:8px;font-weight:800">🎮 다 같이 놀이 <span class="sm">— 누르면 방 친구 모두 그 놀이 대기실로 들어가요</span></div><div class="rg">' + RG.map(q => '<button data-rg="' + q.i + '"' + (q.i === rgi ? ' class="on"' : '') + '>' + esc(q.t) + (q.i === rgi ? ' ✓ 지금' : '') + '</button>').join('') + '</div>' : '')
        + (isTeacherRoom(cur) ? '<div style="margin-top:8px;font-weight:800">🧑‍🏫 선생님</div><div class="row" style="justify-content:flex-start;margin-top:4px">' + (onTeacher ? '<button data-l="gather" title="방 친구 모두를 내 곁으로">📣 모두 내 곁으로</button><button data-l="hold" title="모두 잠깐 멈추고 선생님 말씀 듣기">✋ 모두 멈춤</button><button class="sub" data-l="release">▶ 다시 움직여요</button><button class="sub" data-l="chatoff">💬 채팅 ' + (N && N.ctlData && N.ctlData.chat && N.ctlData.chat.off ? '켜기' : '끄기') + '</button><button class="sub" data-l="chatclr">🧹 채팅 지우기</button>' : '') + '<button class="sub" data-l="big">📺 번호 크게</button><button class="warn" data-l="shut">🔒 방 닫기</button></div>' : '')
        + '<div class="box fr">' + frHtml() + '</div>'
        + (cur.k ? '<details class="sm"><summary>❓ 친구들이 할 수 있는 것</summary>' + tips + '</details>' : '<div class="sm">' + tips + '</div>')
        + '<div class="row"><button class="sub" data-l="out">🚪 방 나가기</button><button class="sub" data-l="x">닫기</button></div>');

      clearInterval(popT); popT = setInterval(() => {
        if (pop !== P || !P.isConnected) { clearInterval(popT); return; }
        if (rooms && (rooms.cur() !== rgi || rooms.inIt() !== inIt)) { const m = P.querySelector('.msg'), mt = m ? m.textContent : '', ok = !!(m && m.classList.contains('ok')); openList(anchor); if (mt) say(mt, 0, ok); return; }
        others = frs(); const f = P.querySelector('.fr'); if (f) f.innerHTML = frHtml();
        if (rooms && rgNow) { const c = P.querySelector('.cnt'); if (c) c.textContent = '· 들어온 친구 ' + rooms.count(rgi) + '/' + others.length; const s = P.querySelector('[data-l=rstart]'); if (s) s.textContent = '▶ 모두 시작 · ' + rooms.count(rgi) + '명 들어옴'; }
      }, 2000);
      P.onclick = (e) => { e.stopPropagation(); const mu = e.target.closest('[data-mu]'); if (mu && N && N.mute) { const p9 = others[+mu.dataset.mu]; if (p9) { N.mute(p9.id, !p9.mu); others = frs(); const f = P.querySelector('.fr'); if (f) f.innerHTML = frHtml(); say(p9.mu ? '👀 ' + p9.label + ' 친구의 말·이모지가 다시 보여요' : '🙈 ' + p9.label + ' 친구의 말·이모지를 나에게만 숨겼어요 — 친구는 몰라요', 0, true); } return; }
        const g = e.target.closest('[data-go]'); if (g && onGoTo) { const p9 = others[+g.dataset.go]; if (p9 && p9.here === false) { say('📍 ' + p9.label + ' 친구는 지금 다른 곳(' + p9.act + ')에 있어요 — 같은 곳에 가면 보여요'); return; } closePop(); onGoTo(p9); return; }

        const rg = e.target.closest('[data-rg]'); if (rg && rooms) { rooms.pick(+rg.dataset.rg, true); openList(anchor); say('✓ 보냈어요 — 친구들이 2초 뒤 대기실로 가요 · 다 모이면 ▶ 모두 시작', 0, true); return; }
        const b = e.target.closest('[data-l]'); if (!b) return; const a = b.dataset.l;
        if (rooms && a === 'wr') { closePop(); rooms.panel(); return; }
        if (rooms && a === 'rjoin') { closePop(); rooms.join(); return; }
        if (rooms && a === 'rstart') { rooms.start(true); openList(anchor); say('▶ 시작 신호를 보냈어요 — 대기실 화면이 3·2·1을 세요', 0, true); return; }
        if (rooms && a === 'rend') { rooms.end(true); openList(anchor); say('⏹ 방 놀이를 마쳤어요 — 모두 자유롭게 다녀요', 0, true); return; }
        if (a === 'name') { say('방 안에서는 이름을 바꿀 수 없어요 — 방을 나가 다시 들어올 때 바꿔요'); return; }
        else if (a === 'out') out('👋 방에서 나왔어요'); else if (a === 'big') { closePop(); showBig(); } else if (a === 'shut') shut();
        else if ((a === 'gather' || a === 'hold' || a === 'release') && onTeacher) { closePop(); onTeacher(a); }
        else if (a === 'chatoff' && N) { const off = !(N.ctlData && N.ctlData.chat && N.ctlData.chat.off); N.ctl('chat', { off }); toast(off ? '💬 채팅을 껐어요' : '💬 채팅을 켰어요', 2); closePop(); }
        else if (a === 'chatclr' && N) { if (confirm('방 채팅을 모두 지울까요?')) { N.clearChat(); toast('🧹 채팅을 지웠어요', 2); } closePop(); } else closePop(); };
      return;
    }
    const P = popup('<h4>👥 함께하기</h4><div class="sm">선생님이나 친구가 연 방을 고르고, 방장 화면의 <b>번호 4자리</b>를 넣어요 · 내 방을 만들 수도 있어요.</div><div class="rooms"><div class="sm">방을 찾는 중…</div></div>'
      + '<div class="pick" style="display:none"><div style="display:flex;gap:6px;margin-top:4px"><input class="nm" maxlength="8" placeholder="내 이름" style="flex:1"><input class="cd" maxlength="4" inputmode="numeric" placeholder="번호 4자리" style="width:110px"></div><div class="row"><button data-l="go">들어가기</button></div></div>'
      + '<div class="msg" role="alert"></div>'
      + '<div class="row"><button data-l="mine" title="내가 방장 — 번호를 친구들에게 알려 주면 같이 놀아요(2시간)">🏠 내 방 만들기</button><button class="sub" data-l="new" title="선생님 비밀번호가 필요해요">🔒 선생님 방</button><button class="sub" data-l="x">닫기</button></div>');
    let sel = null;
    const nm = P.querySelector('.nm'), cd = P.querySelector('.cd'); nm.value = ls.get('mp.name') || '';
    const go = async () => {
      const name = nm.value.trim().replace(/[<>]/g, '').slice(0, 8), c = cd.value.trim();
      if (!name) { say('내 이름을 적어 주세요'); nm.focus(); return; }
      if (!checkChat(name).ok) { say('이름을 고운 말로 바꿔 주세요'); nm.select(); return; }
      if (!/^\d{4}$/.test(c)) { say('번호 4자리를 넣어 주세요'); cd.focus(); return; }
      let p = null; try { p = await check(c, sel.r); } catch (e) { return say('인터넷을 확인해 주세요'); }
      if (!p) { say('번호가 달라요 — 방장 화면의 번호를 다시 봐요', 3); cd.select(); return; }
      ls.set('mp.name', name); closePop(); enter({ c, r: sel.r, n: sel.n, e: p.e });
      const M = net(); if (M) M.setName(name); draw();
    };
    nm.addEventListener('input', () => say(''));
    cd.addEventListener('input', () => { const v = cd.value.replace(/\D/g, '').slice(0, 4); if (v !== cd.value) cd.value = v; say(''); });
    nm.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (cd.value) go(); else cd.focus(); } });
    cd.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) go(); });
    P.onclick = (e) => { e.stopPropagation(); const b = e.target.closest('[data-l],[data-r]'); if (!b) return;
      if (b.dataset.r) { sel = { r: b.dataset.r, n: b.dataset.n }; P.querySelectorAll('.rooms button').forEach((x) => x.classList.toggle('on', x === b)); P.querySelector('.pick').style.display = ''; place(P); (nm.value ? cd : nm).focus(); return; }
      const a = b.dataset.l; if (a === 'go') go(); else if (a === 'new') create();
      else if (a === 'mine') { P.querySelector('.pick').style.display = ''; const name = nm.value.trim().replace(/[<>]/g, '').slice(0, 8); if (!name) { say('내 이름을 먼저 적어 주세요 — 방 이름이 돼요'); place(P); nm.focus(); return; } if (!checkChat(name).ok) { say('이름을 고운 말로 바꿔 주세요'); place(P); nm.select(); return; } ls.set('mp.name', name); create(name); }
      else closePop(); };

    const t0 = Date.now(), again = () => { if (Date.now() - t0 < 120000) setTimeout(() => { if (pop === P && !sel) load(); }, 4000); };
    const load = async () => {
      let L = {}; try { L = (await req('/lobby')) || {}; } catch (e) { if (pop === P) { P.querySelector('.rooms').innerHTML = '<div class="sm">방 목록을 불러오지 못했어요 — 인터넷을 확인해 주세요</div>'; again(); } return; }
      if (pop !== P || sel) return;
      const kidR = (id) => /^🧒/.test(L[id].n || '') ? 1 : 0, ids = Object.keys(L).filter((id) => live(L[id]) && !L[id].x).sort((a, b) => kidR(a) - kidR(b) || (L[b].t || 0) - (L[a].t || 0));
      P.querySelector('.rooms').innerHTML = ids.length ? ids.map((id) => '<button data-r="' + esc(id) + '" data-n="' + esc(L[id].n) + '">' + (kidR(id) ? '' : '🏫 ') + esc(L[id].n) + (L[id].t ? ' <span class="sm">· ' + new Date(L[id].t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) + ' 열림</span>' : '') + '</button>').join('')
        : '<div class="sm">아직 열린 방이 없어요 — 🏠 내 방 만들기로 열거나, 선생님·친구가 방을 열면 저절로 여기에 보여요.</div>';
      place(P); if (!ids.length) again();
    };
    await load();
  }
  chip.addEventListener('click', (e) => { e.stopPropagation(); if (pop) closePop(); else openList(); });
  addEventListener('click', (e) => { if (pop && !pop.contains(e.target) && e.target !== chip) closePop(); });

  addEventListener('keydown', (e) => { if (e.key !== 'Escape' || e.isComposing || document.querySelector('.lb-ask')) return; if (big) { big.remove(); big = null; } else if (pop) closePop(); else return; e.preventDefault(); e.stopImmediatePropagation(); }, true);

  (async () => {
    const q = new URLSearchParams(location.search).get('code');
    let saved = null; try { saved = JSON.parse(ls.get('mp.room') || 'null'); } catch (e) {   }
    try {
      if (q && /^\d{4}$/.test(q)) {
        const p = await check(q); if (!p) { toast('그 방 번호는 지금 열려 있지 않아요', 3); }
        else { const L = await req('/lobby/' + p.r); enter({ c: q, r: p.r, n: (L && L.n) || '우리 반', e: p.e, k: saved && saved.c === q ? saved.k : undefined }); return; }
      }
      if (saved && live(saved) && (await check(saved.c, saved.r))) enter(saved, true); else if (saved) ls.set('mp.room', null);
    } catch (e) {   }
    draw();
  })();
  draw();

  return { draw, recheck, get room() { return cur; }, get teacherRoom() { return isTeacherRoom(cur); }, showBig, open: (a) => (pop && a instanceof Element && a === anchor ? closePop() : openList(a)), ask, leave: () => out(), teacher: (k, extra, quiet) => { if (onTeacher && cur && cur.k) onTeacher(k, extra, quiet); } };
}
