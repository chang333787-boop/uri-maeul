import * as THREE from 'three';
import { buildKid } from './kid.js?v=5';
import { attachLook, openLookPanel, parseLook, lookColors } from './look.js?v=1';
import { SET, openSetPanel, openGfxPick } from './settings.js?v=8';
import { afterRender, takePhoto, openPhotoPanel } from './photo.js?v=7';
import { buildWorld } from './world.js?v=161';
import { SCHOOL } from './layout.js?v=16';
import * as NAV from './nav.js?v=7';
import { makeMeta } from './mapmeta.js?v=12';
import { createMapApi } from './mapapi.js?v=105';
import { createTouch, touchPrimary } from './touch.js?v=11';
import { createTitle } from './title.js?v=29';
import { createFilm } from './film.js?v=17';
import { createTop } from './topview.js?v=11';
import { createDiag } from './diag.js?v=4';
import { createActions } from './actions.js?v=5';

const TOWN_PRE = ['games/town.js?v=347', 'games/town_yard.js?v=12', 'games/town_indoor.js?v=25', 'games/town_fire.js?v=1', 'games/town_jobs.js?v=32', 'games/town_bake.js?v=6', 'games/town_table.js?v=22', 'games/town_game.js?v=60', 'games/town_story.js?v=46', 'js/look.js?v=1', 'js/kid.js?v=5', 'js/keytext.js?v=1', 'games/town_tips.js?v=11', 'games/town_track.js?v=6', 'games/town_read.js?v=4', 'games/town_go.js?v=5', 'games/town_map2.js?v=3', 'games/town_friends.js?v=1', 'js/settings.js?v=8', 'js/photo.js?v=7', 'games/town_bugs.js?v=2', 'games/town_photos.js?v=5', 'games/town_anim.js?v=2', 'games/town_herd.js?v=5', 'games/town_worker.js?v=9', 'games/town_rhy.js?v=1', 'games/town_sim.js?v=2', 'games/town_show.js?v=3', 'games/town_showfind.js?v=5', 'games/town_outcrop.js?v=6', 'games/town_lifem.js?v=2', 'games/town_skill.js?v=8', 'games/town_minigame.js?v=18', 'games/town_lad.js?v=6', 'games/town_rank.js?v=9', 'games/town_reward.js?v=7', 'games/town_sea4.js?v=5', 'games/town_beach.js?v=3', 'games/town_rf.js?v=4', 'games/town_quiz.js?v=17', 'games/town_rec.js?v=28', 'js/lobby.js?v=20', 'games/town_boat.js?v=9', 'games/town_pollen.js?v=1', 'games/town_res.js?v=2', 'games/town_shore.js?v=9', 'games/town_xp.js?v=12', 'games/town_news.js?v=14', 'games/town_treasure.js?v=13', 'games/town_bus.js?v=1', 'games/town_emerg.js?v=22', 'games/town_why.js?v=10', 'games/town_fix.js?v=2', 'games/town_case.js?v=11', 'games/town_bldg.js?v=19', 'games/town_day.js?v=16', 'games/town_typhoon.js?v=14', 'games/town_wxev.js?v=1', 'games/town_road.js?v=11', 'games/town_ask.js?v=5', 'games/town_stam.js?v=5', 'games/town_enter.js?v=9', 'games/town_janggu.js?v=4', 'games/town_tower.js?v=2', 'games/town_night.js?v=6', 'games/town_chem.js?v=16', 'games/town_cellkit.js?v=10', 'games/town_tools.js?v=22', 'games/town_spend.js?v=6', 'games/town_cozy.js?v=3', 'games/town_bag.js?v=16', 'games/town_bag3.js?v=18', 'games/town_routine.js?v=4', 'games/town_wild.js?v=17', 'games/town_path.js?v=23', 'games/town_bundle2.js?v=1', 'games/town_regen.js?v=8', 'games/town_orient.js?v=9', 'games/town_photo.js?v=14', 'games/town_nb.js?v=2', 'games/town_after.js?v=5', 'games/town_feast.js?v=11', 'games/town_season.js?v=9', 'games/town_market.js?v=1', 'games/town_cue.js?v=11', 'games/town_disc.js?v=6', 'games/town_music.js?v=4', 'games/town_feel.js?v=4', 'games/town_efx.js?v=2', 'games/town_surp.js?v=9', 'games/town_ski.js?v=2', 'games/town_heal.js?v=1', 'games/town_subway.js?v=8', 'games/town_look.js?v=9', 'games/town_region.js?v=1', 'games/town_kidlook.js?v=8', 'games/town_pbox.js?v=12', 'games/town_cloud.js?v=6', 'games/town_dex.js?v=26', 'games/town_bundle.js?v=3', 'games/town_sky.js?v=1', 'games/town_farm.js?v=3', 'games/town_fish.js?v=2', 'games/town_deco.js?v=2', 'games/town_places.js?v=7', 'games/town_fire5.js?v=4', 'games/town_animals.js?v=1', 'games/town_salt.js?v=2', 'games/town_tsum.js?v=2', 'js/chatfilter.js?v=1', 'games/town_cine.js?v=2', 'games/town_enter2.js?v=5', 'games/town_laws.js?v=8', 'games/town_close.js?v=1'];
{ const q9 = new URLSearchParams(location.search); if (q9.get('town') && !window.SM_PROMO && TOWN_PRE.length) { window.SM_TOWNV = +TOWN_PRE[0].split('?v=')[1] || 0; for (const u of TOWN_PRE) { const l9 = document.createElement('link'); l9.rel = 'modulepreload'; l9.href = new URL('../' + u, import.meta.url).href; document.head.appendChild(l9); } } }
var inCorr = false;

const QS0 = new URLSearchParams(location.search);

const NORENDER = QS0.get('norender') === '1' || window.SM_NORENDER === 1;
const TITLE_ON = !QS0.get('shot') && !QS0.get('game') && !(QS0.get('town') && !window.SM_PROMO) && QS0.get('tour') !== '1' && !location.search.includes('check=1') && !location.search.includes('health=1') && QS0.get('title') !== '0';
const bootP = (p, s) => { if (TITLE_ON && window.bootP) window.bootP(p, s); };
let FILM_VIEW = null;
let CAM_OVR = null;
bootP(0.3, 0.4);

const canvas = document.getElementById('scene');

(() => { const H = document.head, add = (n, c) => { if (!H.querySelector('meta[name="' + n + '"]')) { const m = document.createElement('meta'); m.name = n; m.content = c; H.appendChild(m); } };
  add('apple-mobile-web-app-capable', 'yes'); add('mobile-web-app-capable', 'yes'); add('apple-mobile-web-app-status-bar-style', 'black-translucent'); add('apple-mobile-web-app-title', '우리 마을');
  if (!H.querySelector('link[rel="apple-touch-icon"]')) { try { const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'); g.fillStyle = '#1d4fa8'; g.fillRect(0, 0, 180, 180); g.fillStyle = '#ffd23c'; g.fillRect(0, 132, 180, 48);
    g.font = '96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🏘', 90, 72); g.fillStyle = '#10213f'; g.font = 'bold 30px sans-serif'; g.fillText('우리 마을', 90, 157);
    const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = c.toDataURL('image/png'); H.appendChild(l); } catch (e) {   } } })();

{ const HAS = ['#tour-talk', '#tour-media', '#tour-card', '#story-talk', '#story-end', '#memo-board', '#memo-form', '#memo-pick', '.eng-note', '.esc-lock', '.hudAsk', '.lb-pop', '.wg-lobby', '#mmap.mm-ov|mm-ov'];
  let pend = false, MM9 = null; const kick = () => { if (!pend) { pend = true; requestAnimationFrame(sync); } }, MO9 = new MutationObserver(kick); const sync = () => { pend = false; const B = document.body; if (!B) return; for (const q0 of HAS) { const [q, n] = q0.split('|'), c = 'h-' + (n || q.slice(1)), on = !!document.querySelector(q); if (B.classList.contains(c) !== on) B.classList.toggle(c, on); } const mm = document.getElementById('mmap'); if (mm !== MM9) { MO9.disconnect(); MM9 = mm; if (mm) MO9.observe(mm, { attributes: true, attributeFilter: ['class'] }); } };

  const el9 = L => { for (let i = 0; i < L.length; i++) if (L[i].nodeType === 1) return true; return false; };
  new MutationObserver(R => { if (pend) return; for (const r of R) if (el9(r.addedNodes) || el9(r.removedNodes)) { kick(); return; } }).observe(document.documentElement, { childList: true, subtree: true }); }

if (/iP(hone|od)/.test(navigator.userAgent || '')) { const m = document.querySelector('meta[name=viewport]'); if (m && /viewport-fit=cover/.test(m.content)) m.content = m.content.replace(/,?\s*viewport-fit=cover/, ''); document.documentElement.style.background = '#0b1220'; if (document.body) document.body.style.background = '#0b1220'; }
const GFX = (() => { const q = new URLSearchParams(location.search), hq = q.get('hq') === '1', lq = q.get('lq') === '1', dev = window.devicePixelRatio || 1;
  const cros = !hq && /CrOS/.test(navigator.userAgent || '');
  const mobile = !hq && (lq || touchPrimary() || Math.min(screen.width || 9999, screen.height || 9999) <= 500);
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent || '') || (/Macintosh/.test(navigator.userAgent || '') && navigator.maxTouchPoints > 1);
  const low = !hq && (lq || (!ios && (mobile || cros) && ((navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 3))));
  const cap = Math.min(dev, low ? 1.25 : mobile || cros ? 1.5 : 2), start = hq ? cap : Math.min(cap, cros ? 1 : 1.5), fix = +q.get('dpr') || 0;

  const adapt = !hq && !fix && q.get('adapt') !== '0' && !/[?&](check|health)=1/.test(location.search) && !q.get('shot');
  const aaQ = q.get('aa'), aa = aaQ === '1' ? true : aaQ === '0' ? false : !low && !cros;

  return { mode: low ? 'low' : mobile ? 'mobile' : cros ? 'cb' : 'desktop', dpr: fix || start, cap: fix || cap, start: fix || start, floor: fix || Math.min(start, mobile || (low && window.SM_PROMO) ? 1 : low || (cros && !window.SM_PROMO) ? 0.75 : 0.6), ios, shadow: low ? 0 : mobile || cros ? 1024 : 2048, adapt, aa, dev }; })();
if (NORENDER) { const p = Math.min(0.25, 64 / Math.max(64, innerWidth)); Object.assign(GFX, { dpr: p, cap: p, start: p, floor: p, adapt: false, aa: false, norender: true }); }

const FM = (() => { const q = new URLSearchParams(location.search), fixed = !!(window.SM_PROMO || NORENDER || q.get('hq') === '1' || +q.get('dpr') || q.get('adapt') === '0' || /[?&](check|health)=1/.test(location.search) || q.get('shot'));
  return { on: !fixed, q: false, mode: 'fixed', target: 60, lv: 0, step: '기본', fps: 0, fk: 1, dk: 1, shOff: false, slowN: 0, goodT: 0, cool: 0, hold: 0, upAt: -1e9, pre: 0, fail: [0, 0, 0], bt: 0, bn: 0, last: 0, lt: 0, draws: 0, vOn: 0, fb: 0, nb: 0, cb: 0, town: false, log: [] }; })();
const FM_STEP = ['기본', '안개 당김', '디테일 줄임', '그림자 끔'];
const FM_LITE = GFX.mode === 'cb' || GFX.mode === 'low', FM_LOW30 = GFX.mode === 'low';

function fmMode() { const a30 = FM.on && !SET.gm && FM_LOW30 && !!document.body && document.body.classList.contains('h-town'); FM.q = FM.on && (SET.gm === 1 || a30); FM.mode = !FM.on ? 'fixed' : SET.gm === 1 ? 'graphics' : SET.gm === 2 ? 'smooth' : 'auto'; FM.target = FM.q ? 30 : 60; FM.st = FM.mode === 'smooth' || (FM.mode === 'auto' && FM_LITE); }
fmMode(); GFX.fm = FM;

const renderer = (() => { try { return new THREE.WebGLRenderer({ canvas, antialias: GFX.aa, powerPreference: 'high-performance' }); } catch (e) {
  console.warn('[화면] WebGL을 만들지 못했어요', e); const d = document.createElement('div'); d.className = 'ttl-keep'; d.textContent = '3D 화면을 열지 못했어요. 크롬(브라우저)을 완전히 껐다가 다시 켜 주세요.';
  Object.assign(d.style, { position: 'fixed', inset: '0', zIndex: '100000', display: 'grid', placeItems: 'center', padding: '16px', textAlign: 'center', background: '#10213f', color: '#fff', font: '700 18px/1.5 sans-serif' });
  document.body.appendChild(d); throw e; } })();
if (NORENDER) {

  const fr = new THREE.Frustum(), pm = new THREE.Matrix4(), upv = new WeakMap();
  const up = (a) => { if (!a) return; const t = a.isInterleavedBufferAttribute ? a.data : a, v = upv.get(t); if (v === undefined || v < t.version) { upv.set(t, t.version); t.onUploadCallback(); } };
  let S9 = null, C9 = null; const vis = (o) => { if (!(o.isMesh || o.isLine || o.isPoints) || !o.geometry || !o.material || o.material.visible === false || !o.layers.test(C9.layers) || (o.frustumCulled && !fr.intersectsObject(o))) return;
    const g = o.geometry; for (const k in g.attributes) up(g.attributes[k]); up(g.index); if (o.isInstancedMesh) { up(o.instanceMatrix); up(o.instanceColor); } o.onAfterRender(renderer, S9, C9, g, o.material, null); };
  renderer.render = (s, c) => { if (s && s.matrixWorldAutoUpdate === true) s.updateMatrixWorld(); if (c && c.parent === null && c.matrixWorldAutoUpdate === true) c.updateMatrixWorld(); if (!s || !c) return;
    pm.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse); fr.setFromProjectionMatrix(pm); S9 = s; C9 = c; s.traverseVisible(vis); };
  renderer.compile = () => new Set(); renderer.compileAsync = (s) => Promise.resolve(s);
}

renderer.debug.checkShaderErrors = /[?&](debug|check)=1/.test(location.search);
const DBG9 = /[?&]debug=1/.test(location.search);

let CTXB = false;
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); if (CTXB) return;
  let L = []; try { L = JSON.parse(sessionStorage.getItem('sm-ctxlost') || '[]').filter(t => Date.now() - t < 600000); } catch (er) { L = []; }
  L.push(Date.now()); try { sessionStorage.setItem('sm-ctxlost', JSON.stringify(L.slice(-5))); } catch (er) {   }
  CTXB = L.length >= 2; console.warn('[화면] WebGL 문맥 잃음 — 10분 안 ' + L.length + '번째' + (CTXB ? ' · 단추로 다시 불러오기' : ' · 저절로 다시 불러오기'));
  const d = document.createElement('div'); d.className = 'ttl-keep';
  Object.assign(d.style, { position: 'fixed', inset: '0', zIndex: '99999', display: 'grid', placeItems: 'center', padding: '16px', textAlign: 'center', background: 'rgba(16,33,63,.88)', color: '#fff', font: '700 18px/1.5 sans-serif' });
  if (!CTXB) { d.textContent = '🔄 화면을 다시 불러오는 중이에요…'; document.body.appendChild(d); setTimeout(() => location.reload(), 1800); return; }
  d.id = 'ctxLost'; d.innerHTML = '<div>🔄 화면이 또 멈췄어요.<br>다른 탭을 닫고 아래 단추를 눌러 주세요.<br><button type="button" style="margin-top:14px;min-height:48px;padding:8px 24px;font:800 18px sans-serif;color:#10213f;background:#ffd23c;border:3px solid #fff;border-radius:12px;cursor:pointer">다시 불러오기</button></div>';
  document.body.appendChild(d); const b9 = d.querySelector('button'); b9.onclick = () => location.reload(); try { if (document.exitPointerLock) document.exitPointerLock(); b9.focus(); } catch (er) {   } }, false);
canvas.addEventListener('webglcontextrestored', () => { if (!CTXB) location.reload(); }, false);

const DIAG = window.SM_PROMO ? null : createDiag({ canvas, env: () => ({ renderer, GFX, FM, ADAPT, TIMING }) });

function audioUnlock() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
    if (AC.state === 'running') return; AC.resume();
    const b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0); } catch (e) {   }
}
for (const k of ['touchend', 'pointerup', 'click', 'keydown']) addEventListener(k, audioUnlock, { capture: true, passive: true });

let fsTried = false;
canvas.addEventListener('touchend', () => {
  if (fsTried || GFX.ios || !document.fullscreenEnabled || document.fullscreenElement || !touchPrimary()) return; fsTried = true;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {   } }).catch(() => {});
}, { passive: true });
const DPR = GFX.dpr;
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = GFX.shadow > 0;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = false;

renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe9f8);
scene.fog = new THREE.Fog(0xcfe9f8, 80, 260);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.3, 320);
const hemi = new THREE.HemisphereLight(0xc9dcf0, 0xb08a5e, 1.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0cf, 3.1);
sun.position.set(60, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(GFX.shadow || 1024, GFX.shadow || 1024);
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 95, bottom: -95, near: 20, far: 340 }); sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun);

{ let bm = 2600; try { bm = +localStorage.getItem('sm2.title.buildMs') || bm; } catch (e) {   } bootP(0.92, Math.min(15, bm * 1.15 / 1000)); }
await new Promise(r => { requestAnimationFrame(() => setTimeout(r)); setTimeout(r, 100); });

const GLASS_U = { uSkyRef: { value: new THREE.Color(0x8fc3ea) }, uGndRef: { value: new THREE.Color(0x5d6b73) }, uFr: { value: 0.6 }, uOut: { value: 1 } };

function glassFx(sh) {
  Object.assign(sh.uniforms, GLASS_U);
  sh.fragmentShader = 'uniform vec3 uSkyRef;\nuniform vec3 uGndRef;\nuniform float uFr;\nuniform float uOut;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
  vec3 gV = normalize(-vViewPosition), gN = normalize(vNormal);
  vec3 gWd = (vec4(gV, 0.0) * viewMatrix).xyz, gWn = (vec4(gN, 0.0) * viewMatrix).xyz, gP = cameraPosition + gWd * length(vViewPosition);
  float gC = 1.0 - abs(dot(gV, gN)), gFr = uFr * (0.3 + 0.7 * gC * gC * gC) * mix(0.35, 1.0, uOut);
  vec3 gRef = mix(uGndRef, uSkyRef, smoothstep(-0.2, 0.3, reflect(gWd, gWn).y));
  float gS = fract((gP.x + gP.z + gP.y) * 0.21), gW = fwidth(gS) + 0.004;   // 폭 = 화면 한 픽셀 이상(멀리서 반짝임·계단 방지)
  float gB = (smoothstep(0.2 - gW, 0.2 + gW, gS) - smoothstep(0.26 - gW, 0.26 + gW, gS)) + 0.6 * (smoothstep(0.31 - gW, 0.31 + gW, gS) - smoothstep(0.34 - gW, 0.34 + gW, gS));
  gB *= (1.0 - smoothstep(25.0, 60.0, length(vViewPosition))) * uOut;   // 멀면 줄은 옅게(하늘빛만)
  outgoingLight = mix(outgoingLight, gRef, gFr) + gB * uFr * 0.45;
  diffuseColor.a = clamp(mix(diffuseColor.a, 0.9, gFr) + gB * uFr * 0.35, 0.0, 1.0);
#include <opaque_fragment>`);
}
const warmDone = (() => { try {
  const T = new THREE.DataTexture(new Uint8Array(4), 1, 1), G = new THREE.BufferGeometry(), s = new THREE.Scene(), mats = []; T.needsUpdate = true;
  G.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  G.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  const L = o => new THREE.MeshLambertMaterial(o), B = o => new THREE.MeshBasicMaterial(o), D = THREE.DoubleSide;
  const add = (m, inst, col) => { mats.push(m); const o = inst ? new THREE.InstancedMesh(G, m, 1) : new THREE.Mesh(G, m); if (col) o.setColorAt(0, new THREE.Color()); s.add(o); };
  [B({ map: T, alphaTest: 0.5 }), B({}), L({ map: T }), L({ map: T, alphaTest: 0.5, side: D }), L({ map: T, side: D }), L({ transparent: true }), L({ vertexColors: true }),
   B({ map: T, vertexColors: true }), L({ map: T, vertexColors: true }), L({ map: T, transparent: true, side: D }), L({ map: T, vertexColors: true, transparent: true, side: D }),
   B({ vertexColors: true, fog: false })].forEach(m => add(m));
  add(L({}), true, true); { const m = L({ transparent: true }); m.onBeforeCompile = glassFx; add(m, true); } add(L({}), true);

  { const m = L({ map: T, vertexColors: true }); mats.push(m); const o = new THREE.Mesh(G, m); o.receiveShadow = true; s.add(o); }
  add(B({ map: T, transparent: true, depthWrite: false })); add(B({ vertexColors: true, fog: false, toneMapped: false, depthWrite: false }));
  { const m = L({ transparent: true, depthWrite: false }); m.onBeforeCompile = glassFx; add(m); }
  renderer.compile(s, camera, scene);
  return () => { mats.forEach(m => m.dispose()); G.dispose(); T.dispose(); };
} catch (e) { return () => {}; } })();
const TIMING = { buildMs: performance.now(), firstFrameMs: null };
const world = buildWorld(scene);
TIMING.buildMs = performance.now() - TIMING.buildMs;
if (TITLE_ON) { bootP(0.95, 0.2); try { localStorage.setItem('sm2.title.buildMs', Math.round(TIMING.buildMs)); } catch (e) {   } }
if (world.glassMesh) { world.glassMesh.material.onBeforeCompile = glassFx; world.glassMesh.material.needsUpdate = true; }

const SHADOW_RECV = new Set(['grass', 'dirt', 'pave', 'paveE', 'paveF', 'paveG', 'asph', 'gravel', 'chip', 'ilock', 'sand', 'hop', 'brick', 'kidHop', 'redRd']);
const ST_MESH = [];
scene.traverse(o => { if (o.userData.st) { o.castShadow = true; ST_MESH.push(o); } else if (o.userData.pat && SHADOW_RECV.has(o.userData.pat)) o.receiveShadow = true; });

for (const d of world.details) if (!d.inside) { d.mesh.castShadow = true; ST_MESH.push(d.mesh); }
let MAP = null;

const P = { x: 12.4, y: world.terrainAt(12.4, -6) + 0.01, z: -6, vy: 0, yaw: 0, ground: true, bh: 1.5, spd: 0 };

const pg = new THREE.Group();
const KID = buildKid(THREE, 'b');
attachLook(THREE, KID.rig);
pg.add(KID.rig);
scene.add(pg);
KID.rig.traverse(o => { o.castShadow = false; });

const blob = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 31);
  gr.addColorStop(0, 'rgba(20,24,34,0.42)'); gr.addColorStop(0.55, 'rgba(20,24,34,0.3)'); gr.addColorStop(1, 'rgba(20,24,34,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
  m.renderOrder = 1; scene.add(m); return m;
})();

let kidPh = 0, kidX = P.x, kidZ = P.z, kidT = 0, kidPoseWas = null;

let POL9 = null, faceY = 0, faceD = 0, leanS = 0, mvS = 0, camBY = null, airVy = 0, wasAir = false, landT = 9, landK = 0;
function kidTick(dt) {
  const v = CTRL.ride ? 0 : Math.hypot(P.x - kidX, P.z - kidZ) / Math.max(dt, 1e-3) * (4.2 / PHY.walk); kidX = P.x; kidZ = P.z; kidT += dt;
  const K = KID, sit = !!ACT.sit, air = !P.ground && !sit && !ACT.anim, mv = sit ? 0 : Math.min(1, v / 4.2), cr = CTRL.crouched && !sit;
  if (POL9 === null) POL9 = !window.SM_PROMO;
  if (POL9) { mvS += (mv - mvS) * (1 - Math.exp(-dt * 12)); if (v > 0.3 && !sit) kidPh += v * dt / (0.35 + 0.09 * v) * Math.PI; if (air) airVy = P.vy; else if (wasAir) { landT = 0; landK = Math.min(1, Math.max(0, -airVy - 2) / 9); } wasAir = air; landT += dt; }
  else if (v > 0.3 && !sit) kidPh += dt * (5.5 + v * 1.5);
  const A9 = POL9 ? 0.45 + 0.4 * Math.min(1, Math.max(0, (v - 1) / 6.5)) : 0.7, mv9 = POL9 ? mvS : mv, sw = Math.sin(kidPh) * A9 * mv9, run9 = POL9 ? Math.min(1, Math.max(0, (v - 5) / 2.5)) : 0;
  K.rig.position.set(0, sit ? K.sitY : cr ? -0.17 : (POL9 ? (run9 > 0.5 ? Math.abs(Math.sin(kidPh)) * 0.06 : Math.abs(Math.cos(kidPh)) * 0.04) : Math.abs(Math.sin(kidPh)) * 0.04) * mv9, sit && !ACT.sit.seat ? 0.42 : 0);
  K.rig.rotation.x = cr ? 0.28 : POL9 ? 0.18 * run9 * mv9 : 0;
  if (sit) { K.legL.g.rotation.x = K.legR.g.rotation.x = -1.5; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 1.5; K.armL.rotation.x = K.armR.rotation.x = -0.85; }
  else if (cr) { K.legL.g.rotation.x = -1.25 + sw * 0.35; K.legR.g.rotation.x = -1.25 - sw * 0.35; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 2.0;
    K.armL.rotation.x = -0.9 - sw * 0.3; K.armR.rotation.x = -0.9 + sw * 0.3; }
  else if (air) { if (POL9) { const u9 = Math.max(-1, Math.min(1, P.vy / PHY.jv));
      K.legL.g.rotation.x = -0.5 * Math.max(0, u9) - 0.1; K.legR.g.rotation.x = 0.25 * Math.max(0, u9) + 0.05; K.legL.knee.rotation.x = 0.2 + 0.5 * Math.max(0, u9); K.legR.knee.rotation.x = 0.1 + 0.2 * Math.max(0, u9); K.armL.rotation.x = K.armR.rotation.x = -2.5 * Math.max(0.25, u9) - 0.3 * Math.max(0, -u9); K.armL.rotation.z = -0.12 - 0.8 * Math.max(0, -u9); K.armR.rotation.z = 0.12 + 0.8 * Math.max(0, -u9); }
    else { K.legL.g.rotation.x = -0.5; K.legR.g.rotation.x = 0.25; K.legL.knee.rotation.x = 0.7; K.legR.knee.rotation.x = 0.3; K.armL.rotation.x = K.armR.rotation.x = -2.5; } }
  else { K.legL.g.rotation.x = sw; K.legR.g.rotation.x = -sw; K.legL.knee.rotation.x = Math.max(0, sw) * 0.9 + 0.3 * run9 * mv9; K.legR.knee.rotation.x = Math.max(0, -sw) * 0.9 + 0.3 * run9 * mv9;
    K.armL.rotation.x = -sw * 0.85 * (1 + 0.1 * run9); K.armR.rotation.x = sw * 0.85 * (1 + 0.1 * run9); if (POL9 && K.armL.rotation.z !== -0.12 && !CTRL.pose) K.armL.rotation.z = -0.12; }
  if ((tray || CTRL.hold) && !sit) K.armL.rotation.x = K.armR.rotation.x = -1.1;
  if (CTRL.pose === 'dig') { const d9 = Math.sin(kidT * 11); K.armL.rotation.x = K.armR.rotation.x = -1.3 + d9 * 0.6; K.rig.rotation.x = 0.35 + d9 * 0.08; }
  if (milk && !sit && !tray) K.armR.rotation.x = -0.7;
  if (CTRL.wave > 0 && !sit) { CTRL.wave -= dt; K.armR.rotation.x = -2.75 + Math.sin(kidT * 7) * 0.12; K.armR.rotation.z = 0.45 + Math.sin(kidT * 9) * 0.35; }
  else if (K.armR.rotation.z !== 0.12) K.armR.rotation.z = 0.12;
  K.head.rotation.x = mv > 0.1 ? 0.04 : Math.sin(kidT * 1.7) * 0.03;
  K.body.scale.y = 1 + (mv < 0.1 && !sit ? Math.sin(kidT * 2.2) * 0.008 : 0);
  if (POL9) { const sq = landT < 0.6 && !sit ? landK * Math.exp(-14 * landT) * Math.cos(20 * landT) : 0; K.body.scale.x = K.body.scale.z = 1 + 0.1 * sq; K.body.scale.y -= 0.16 * sq; if (sq > 0.05 && !air) { K.legL.knee.rotation.x += 0.6 * sq; K.legR.knee.rotation.x += 0.6 * sq; }
    if (!CTRL.pose && !sit) { leanS += (Math.max(-(CTRL.leanMax || 0.2), Math.min(CTRL.leanMax || 0.2, -faceD / Math.max(dt, 1e-3) * 0.018 * mv9)) - leanS) * (1 - Math.exp(-dt * 10)); K.rig.rotation.z = leanS; } }
  if (CTRL.pose !== kidPoseWas) { if (kidPoseWas === 'swim' || kidPoseWas === 'dizzy' || kidPoseWas === 'ski' || kidPoseWas === 'plant' || kidPoseWas === 'climb' || kidPoseWas === 'para') { K.armL.rotation.z = -0.12; K.armR.rotation.z = 0.12; K.head.rotation.z = 0; K.rig.rotation.z = 0; K.legL.g.rotation.z = K.legR.g.rotation.z = 0; } kidPoseWas = CTRL.pose; }
  if (CTRL.pose === 'swim') { const s9 = Math.sin(kidT * 5.2), m9 = Math.min(1, mv * 2 + 0.35); K.rig.rotation.x = 0.35 * mv; K.armL.rotation.x = K.armR.rotation.x = -2.0 + s9 * 0.55 * m9; K.armL.rotation.z = -0.12 - (0.5 + s9 * 0.4) * m9; K.armR.rotation.z = 0.12 + (0.5 + s9 * 0.4) * m9;
    K.legL.g.rotation.x = Math.sin(kidT * 7) * 0.4 * m9; K.legR.g.rotation.x = -Math.sin(kidT * 7) * 0.4 * m9; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 0.35; K.head.rotation.x = -0.15 * mv; }
  else if (CTRL.pose === 'chair') { K.rig.position.set(0, K.sitY, 0); K.legL.g.rotation.x = K.legR.g.rotation.x = -1.5; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 1.45 + Math.sin(kidT * 2) * 0.08; K.armL.rotation.x = K.armR.rotation.x = -0.55; }
  else if (CTRL.pose === 'ski') { K.rig.position.set(0, -0.1, 0); K.rig.rotation.x = 0.28; K.legL.g.rotation.x = K.legR.g.rotation.x = -0.55; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 0.9; K.armL.rotation.x = K.armR.rotation.x = -0.75; K.armL.rotation.z = -0.35; K.armR.rotation.z = 0.35; K.rig.rotation.z = (CTRL.poseY || 0) * 0.25;
    const pk9 = CTRL.poseK || 0; K.legL.g.rotation.z = pk9 & 2 ? -0.15 : 0; K.legR.g.rotation.z = pk9 & 2 ? 0.15 : 0;
    if (pk9 & 1) { K.rig.position.set(0, -0.3, 0); K.rig.rotation.x = 0.62; K.legL.g.rotation.x = K.legR.g.rotation.x = -1.0; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 1.55; K.armL.rotation.x = K.armR.rotation.x = -1.2; K.armL.rotation.z = -0.12; K.armR.rotation.z = 0.12; } }
  else if (CTRL.pose === 'lie') { K.rig.position.set(0, 0.12 + (CTRL.poseY || 0), 0); K.rig.rotation.x = -1.5; K.legL.g.rotation.x = K.legR.g.rotation.x = 0; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 0; K.armL.rotation.x = K.armR.rotation.x = 0.12; K.head.rotation.x = -0.1; }
  else if (CTRL.pose === 'plant') { const y9 = CTRL.poseY || 0, L9 = Math.floor(y9) / 99, D9 = y9 - Math.floor(y9), lean9 = 0.62 - 0.18 * L9 + 0.1 * D9; K.rig.position.set(0, -0.12, 0); K.rig.rotation.x = lean9; K.legL.g.rotation.x = K.legR.g.rotation.x = -0.45; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 0.6;
    K.armR.rotation.x = -lean9 - 0.45 - 1.05 * L9 + (0.85 + 1.05 * L9) * D9; K.armL.rotation.x = -lean9 - 0.95; K.armL.rotation.z = -0.3; K.head.rotation.x = -0.25 + 0.15 * L9; }
  else if (CTRL.pose === 'dizzy') { K.rig.position.set(0, K.sitY - 0.34, 0); K.rig.rotation.x = -0.22; K.legL.g.rotation.x = K.legR.g.rotation.x = -1.45; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 0.2;
    K.armL.rotation.x = K.armR.rotation.x = 0.55; K.armL.rotation.z = -0.6; K.armR.rotation.z = 0.6; K.head.rotation.z = Math.sin(kidT * 5) * 0.2; K.head.rotation.x = 0.1 + Math.sin(kidT * 3.3) * 0.08; K.rig.rotation.z = Math.sin(kidT * 2.5) * 0.06; }
  else if (CTRL.pose === 'climb') { const c9 = Math.sin(kidT * 6.5) * Math.min(1, Math.abs(CTRL.poseY || 0) * 1.4); K.rig.rotation.x = -0.08; K.armL.rotation.x = -2.6 + c9 * 0.45; K.armR.rotation.x = -2.6 - c9 * 0.45; K.armL.rotation.z = -0.25; K.armR.rotation.z = 0.25; K.legL.g.rotation.x = -0.55 - c9 * 0.4; K.legR.g.rotation.x = -0.55 + c9 * 0.4; K.legL.knee.rotation.x = 0.9 + c9 * 0.3; K.legR.knee.rotation.x = 0.9 - c9 * 0.3; K.head.rotation.x = -0.25; }
  else if (CTRL.pose === 'para') { K.rig.position.set(0, 0.05, 0); K.rig.rotation.x = 0.12; K.legL.g.rotation.x = K.legR.g.rotation.x = -1.2; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 1.1; K.armL.rotation.x = K.armR.rotation.x = -2.2; K.armL.rotation.z = -0.55; K.armR.rotation.z = 0.55; K.rig.rotation.z = (CTRL.poseY || 0) * 0.3; }
  ACTS.pose();
}

function terrainY(x, z, hy) { return world.terrainAt(x, z, hy); }

const GRIDN = new Map(), gkey = (gx, gz) => (gx + 2048) * 4096 + (gz + 2048);
for (const [k, a] of world.grid) { const c = k.indexOf(':'); GRIDN.set(gkey(+k.slice(0, c), +k.slice(c + 1)), a); }
{ const G = world.grid, set0 = G.set; G.set = function (k, a) { set0.call(G, k, a); const c = k.indexOf(':'); GRIDN.set(gkey(+k.slice(0, c), +k.slice(c + 1)), a); return G; }; }
world.cell = (gx, gz) => GRIDN.get(gkey(gx, gz));

let SEEN = new Uint32Array(8192), SEEN_G = 0;
function seenGen() { if (SEEN.length < world.colliders.length) { SEEN = new Uint32Array(world.colliders.length * 2); SEEN_G = 0; } if (++SEEN_G > 4e9) { SEEN.fill(0); SEEN_G = 1; } return SEEN_G; }
function groundAt(x, z, fromY) {
  let g = terrainY(x, z, fromY);
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8), gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y1 <= fromY + 0.55 && b.y1 > g) g = b.y1;
    }
  }
  return g;
}

function ceilAt(x, z, h0, h1) {
  let c = null;
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8), gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y0 >= h0 - 0.01 && b.y0 < h1 && (c === null || b.y0 < c)) c = b.y0;
    }
  }
  return c;
}
function blockedAt(x, z, y, h = 1.5) {
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8), gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y1 > y + 0.55 && b.y0 < y + h) return true;
    }
  }
  return false;
}

const PHY = { sc: 1, r: 0.26, st: 0.55, h: 1.5, walk: 4.2, run: 7.5, crawl: 1.9, jv: 5.2, g: 14, T: null };
function tinyBuild() {
  const T = { cols: [], grid: new Map(), mark: new Uint32Array(8192), gen: 1 };
  for (const c of world.colliders) { if (c.y0 < -1e5) continue; tinyAdd(c, T); }
  for (const b of world.allBoxes) if (b.ts) tinyAdd(b, T);
  return T;
}
function tinyAdd(c, T = PHY.T) {
  if (!T) return;
  const put = b => { const i = T.cols.push(b) - 1;
    for (let gx = Math.floor(b.x0 / 8); gx <= Math.floor(b.x1 / 8); gx++) for (let gz = Math.floor(b.z0 / 8); gz <= Math.floor(b.z1 / 8); gz++) { const k = gkey(gx, gz); let a = T.grid.get(k); if (!a) T.grid.set(k, a = []); a.push(i); } };
  if (c.tiny) { for (const t of c.tiny) put({ x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1, z0: t.z0, z1: t.z1, src: c }); }
  else if (c.vy1 != null) put({ x0: c.x0, x1: c.x1, y0: c.y0, y1: c.vy1, z0: c.z0, z1: c.z1, src: c });
  else put(c);
  if (T.mark.length < T.cols.length) { const a = new Uint32Array(T.cols.length * 2); T.mark = a; T.gen = 1; }
}
function tGen(T) { if (++T.gen > 4e9) { T.gen = 1; T.mark.fill(0); } return T.gen; }
function tGround(x, z, fromY) {
  const T = PHY.T, r = PHY.r, top = fromY + PHY.st, gen = tGen(T); let g = terrainY(x, z, fromY);
  for (let gx = Math.floor((x - 0.3) / 8); gx <= Math.floor((x + 0.3) / 8); gx++) for (let gz = Math.floor((z - 0.3) / 8); gz <= Math.floor((z + 0.3) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.src && b.src.y0 < -1e5) continue;
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.y1 <= top && b.y1 > g) g = b.y1; } }
  return g;
}
function tCeil(x, z, h0, h1) {
  const T = PHY.T, r = PHY.r, gen = tGen(T); let c = null;
  for (let gx = Math.floor((x - 0.3) / 8); gx <= Math.floor((x + 0.3) / 8); gx++) for (let gz = Math.floor((z - 0.3) / 8); gz <= Math.floor((z + 0.3) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.src && b.src.y0 < -1e5) continue;
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.y0 >= h0 - 0.01 * PHY.sc && b.y0 < h1 && (c === null || b.y0 < c)) c = b.y0; } }
  return c;
}
function tBlocked(x, z, y, h) {
  const T = PHY.T, r = PHY.r, st = y + PHY.st, gen = tGen(T);
  for (let gx = Math.floor((x - 0.3) / 8); gx <= Math.floor((x + 0.3) / 8); gx++) for (let gz = Math.floor((z - 0.3) / 8); gz <= Math.floor((z + 0.3) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.src && b.src.y0 < -1e5) continue;
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.y1 > st && b.y0 < y + h) return true; } }
  return false;
}

function slipStep(bX, bZ, sx, sz) {
  const E = 0.1, h = P.bh;
  if (bZ && Math.abs(sz) > 1e-5) { const d = Math.min(E, Math.abs(sz)), nz = P.z + sz; for (const s of sx > 1e-5 ? [1, -1] : sx < -1e-5 ? [-1, 1] : [1, -1]) { if (bX && s === Math.sign(sx)) continue; if (!pBlocked(P.x + s * E, nz, P.y, h) && !pBlocked(P.x + s * d, P.z, P.y, h)) { P.x += s * d; return; } } }
  if (bX && Math.abs(sx) > 1e-5) { const d = Math.min(E, Math.abs(sx)), nx = P.x + sx; for (const s of sz > 1e-5 ? [1, -1] : sz < -1e-5 ? [-1, 1] : [1, -1]) { if (bZ && s === Math.sign(sz)) continue; if (!pBlocked(nx, P.z + s * E, P.y, h) && !pBlocked(P.x, P.z + s * d, P.y, h)) { P.z += s * d; return; } } }
}

const pGround = (x, z, fromY) => PHY.T ? tGround(x, z, fromY) : groundAt(x, z, fromY);
const pCeil = (x, z, h0, h1) => PHY.T ? tCeil(x, z, h0, h1) : ceilAt(x, z, h0, h1);
const pBlocked = (x, z, y, h) => PHY.T ? tBlocked(x, z, y, h) : blockedAt(x, z, y, h);

function tCamHit(hx, hy, hz, dx, dy, dz, maxD) {
  const T = PHY.T, gen = tGen(T); let t = maxD;
  const ex = hx + dx * maxD, ez = hz + dz * maxD;
  for (let gx = Math.floor((Math.min(hx, ex) - 0.4) / 8); gx <= Math.floor((Math.max(hx, ex) + 0.4) / 8); gx++) for (let gz = Math.floor((Math.min(hz, ez) - 0.4) / 8); gz <= Math.floor((Math.max(hz, ez) + 0.4) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.nc || (b.src && b.src.y0 < -1e5)) continue;
      let t0 = 1e-4, t1 = t, ok = true;
      for (let ax = 0; ax < 3 && ok; ax++) {
        const o = ax === 0 ? hx : ax === 1 ? hy : hz, d9 = ax === 0 ? dx : ax === 1 ? dy : dz, lo = ax === 0 ? b.x0 : ax === 1 ? b.y0 : b.z0, hi = ax === 0 ? b.x1 : ax === 1 ? b.y1 : b.z1;
        if (Math.abs(d9) < 1e-8) { if (o < lo || o > hi) ok = false; }
        else { let a = (lo - o) / d9, c9 = (hi - o) / d9; if (a > c9) { const s9 = a; a = c9; c9 = s9; } if (a > t0) t0 = a; if (c9 < t1) t1 = c9; if (t0 > t1) ok = false; } }
      if (ok && t0 < t) t = t0; } }

  if (dy < -1e-4) { const fy = tGround(hx, hz, hy - PHY.st), tf = (fy + camera.near - hy) / dy; if (tf > 0 && tf < t) t = tf; }
  return t;
}
const TCAM = { want: 0, d: 0, sh: 0, x0: 0, y: 0, z0: 0 };
function camPoseT(hx, hy, hz, yaw, pch, CD, fov, aspect, dUse) {
  const S = PHY.sc, n = camera.near, m = n * 1.8 + 0.01 * S;
  const dx = Math.sin(yaw) * Math.cos(pch), dy = Math.sin(pch), dz = Math.cos(yaw) * Math.cos(pch);
  const hit = tCamHit(hx, hy, hz, dx, dy, dz, CD);
  let want = Math.min(CD, hit - m); if (want < 0.5 * S) want = Math.max(0.1 * S, Math.min(0.5 * S, hit - m));
  if (want < 0) want = 0;
  const d = dUse ?? want, cx = hx + dx * d, cy = hy + dy * d, cz = hz + dz * d;
  const hw = n * Math.tan(fov * Math.PI / 360) * aspect + 0.08 * S, rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const r = tCamHit(cx, cy, cz, rx, 0, rz, hw), l = tCamHit(cx, cy, cz, -rx, 0, -rz, hw);
  TCAM.sh = (r < hw && l < hw) ? (r - l) / 2 : r < hw ? r - hw : l < hw ? hw - l : 0;
  TCAM.want = want; TCAM.d = d; TCAM.x0 = cx; TCAM.y = cy; TCAM.z0 = cz;
  return TCAM;
}
let LOOK = null;

function setScale(s, o = {}) {
  s = Math.max(0.05, Math.min(1, +s || 1));
  if (s === 1) {
    Object.assign(PHY, { sc: 1, r: 0.26, st: 0.55, h: 1.5, walk: 4.2, run: 7.5, crawl: 1.9, jv: 5.2, g: 14, T: null });
    pg.scale.setScalar(1); camera.near = 0.3; camera.far = (LOOK && LOOK.far) || 320; camera.updateProjectionMatrix(); camD = CAM_D; camSh = 0;
    P.bh = CTRL.crouched ? CROUCH_H : 1.5; return 1;
  }
  const k = o.speed ?? Math.sqrt(s), gk = o.gravity ?? Math.sqrt(s), apex = o.jump ?? 0.97 * s;
  Object.assign(PHY, { sc: s, r: 0.26 * s, st: 0.55 * s, h: 1.5 * s, walk: 4.2 * k, run: 7.5 * k, crawl: 1.9 * k, g: 14 * gk });
  PHY.jv = Math.sqrt(2 * PHY.g * apex);
  if (!PHY.T) PHY.T = tinyBuild();
  pg.scale.setScalar(s); camera.near = Math.max(0.01, 0.3 * s); camera.far = o.far ?? ((LOOK && LOOK.far) || 160); camera.updateProjectionMatrix(); camD = CAM_D * s; camSh = 0;
  P.bh = (CTRL.crouched ? CROUCH_H : 1.5) * s; P.vy = 0;
  return s;
}

function camHit(hx, hy, hz, dx, dy, dz, maxD) {
  let t = maxD;
  const ex = hx + dx*maxD, ez = hz + dz*maxD;
  const k0x = Math.floor((Math.min(hx,ex)-0.4)/8), k1x = Math.floor((Math.max(hx,ex)+0.4)/8);
  const k0z = Math.floor((Math.min(hz,ez)-0.4)/8), k1z = Math.floor((Math.max(hz,ez)+0.4)/8);
  const gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k];
      if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (b.nc) continue;
      if (b.y1 - b.y0 < 1.5 && b.y0 < hy + 0.4) continue;
      let t0 = 1e-4, t1 = t, ok = true;
      for (let ax = 0; ax < 3 && ok; ax++) {
        const o = ax===0?hx:ax===1?hy:hz, d9 = ax===0?dx:ax===1?dy:dz;
        const lo = ax===0?b.x0:ax===1?b.y0:b.z0, hi = ax===0?b.x1:ax===1?b.y1:b.z1;
        if (Math.abs(d9) < 1e-8) { if (o < lo || o > hi) ok = false; }
        else {
          let a = (lo-o)/d9, c9 = (hi-o)/d9;
          if (a > c9) { const s9 = a; a = c9; c9 = s9; }
          if (a > t0) t0 = a; if (c9 < t1) t1 = c9;
          if (t0 > t1) ok = false;
        }
      }
      if (ok && t0 < t) t = t0;
    }
  }
  return t;
}

const keys = new Set(), KEY_NEW = new Set(), KEY_UP = new Set();
function keysClear() { keys.clear(); KEY_NEW.clear(); KEY_UP.clear(); }
function keysFrameEnd() { KEY_NEW.clear(); if (KEY_UP.size) { for (const k of KEY_UP) keys.delete(k); KEY_UP.clear(); } }
addEventListener('keydown', e => { if (!e.code) return;
  if (!keys.has(e.code)) KEY_NEW.add(e.code); keys.add(e.code); KEY_UP.delete(e.code);
  if (e.code === 'Space' && !e.repeat) TOUCH.jumpT = Math.max(TOUCH.jumpT, 0.12); });
addEventListener('keyup', e => { if (!e.code) return; if (KEY_NEW.has(e.code)) KEY_UP.add(e.code); else keys.delete(e.code); });
addEventListener('blur', keysClear);
document.addEventListener('visibilitychange', () => { if (document.hidden) keysClear(); });
let camYaw = 0, camPitch = 0.3, camFirst = false;
addEventListener('keydown', e => { if (e.code === 'KeyV' && !e.repeat) camFirst = !camFirst; });
const CAM_D = 6.3;
let roomLift = 0;
let camD = CAM_D, camLift = 0;
const TWN_MODAL = () => !!document.querySelector('.twn-p,.twn-dlg,.twn-play');
canvas.addEventListener('click', () => { if (!TOUCH.on && !CTRL.freeMouse && !TWN_MODAL()) canvas.requestPointerLock(); });

let LOOKT = -1e9, camZ = 1;
canvas.addEventListener('wheel', e => { if (!world.overAt || camFirst) return; e.preventDefault(); if (TWN_MODAL()) return; camZ = Math.max(4 / CAM_D, Math.min(18 / CAM_D, camZ * Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * 0.004))); }, { passive: false });
const MOUSE = { dx: 0, dy: 0, t0: 0, fd: 16.7, fl: 0, te: 0, drop: 0 };
document.addEventListener('pointerlockchange', () => { MOUSE.t0 = performance.now(); MOUSE.dx = MOUSE.dy = 0; if (document.pointerLockElement !== canvas) keysClear(); });
addEventListener('focus', () => { MOUSE.t0 = performance.now(); });

const DRAG = { on: false, x: 0, y: 0, m: 0, t: 0 };

const CURSOR = { on: false };
addEventListener('keydown', e => {
  if (e.code !== 'Tab' || e.repeat || TOUCH.on || CTRL.freeMouse || e.ctrlKey || e.altKey || e.metaKey) return;
  const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
  if (TITLE && TITLE.phase !== 'off') return;
  if (TWN_MODAL() && document.pointerLockElement !== canvas) return;
  e.preventDefault();
  if (document.pointerLockElement === canvas) { CURSOR.on = true; document.exitPointerLock(); toast('👀 마우스가 보여요 — 단추를 눌러요 · 화면을 누르거나 Tab = 다시 둘러보기', 2.6); }
  else if (!(window.__pause && window.__pause.on)) { CURSOR.on = false; canvas.requestPointerLock(); }
}, true);
canvas.addEventListener('mousedown', e => {
  if (document.pointerLockElement !== canvas || TOUCH.on) return;
  if (e.button === 0 || e.button === 2) dispatchEvent(new CustomEvent(e.button === 0 ? 'sm-click' : 'sm-rclick', { detail: { x: innerWidth / 2, y: innerHeight / 2, center: true } }));
});
canvas.addEventListener('mousedown', e => { if (!CTRL.freeMouse || TOUCH.on || (e.button !== 0 && e.button !== 2)) return; DRAG.on = true; DRAG.x = e.clientX; DRAG.y = e.clientY; DRAG.m = 0; DRAG.t = performance.now(); MOUSE.te = DRAG.t; });
canvas.addEventListener('contextmenu', e => { if (CTRL.freeMouse || document.pointerLockElement === canvas) e.preventDefault(); });
addEventListener('mouseup', e => {
  if (!DRAG.on) return; DRAG.on = false; canvas.style.cursor = '';
  if (DRAG.m < 6 && performance.now() - DRAG.t < 450 && e.button === 0) dispatchEvent(new CustomEvent('sm-click', { detail: { x: e.clientX, y: e.clientY } }));
});
addEventListener('mousemove', e => {
  if (DRAG.on && CTRL.freeMouse) { const mx = e.movementX || 0, my = e.movementY || 0; DRAG.m += Math.abs(mx) + Math.abs(my); if (DRAG.m >= 6) { canvas.style.cursor = 'grabbing'; if (Math.abs(mx) < 300 && Math.abs(my) < 200) { MOUSE.dx += mx; MOUSE.dy += my; } } return; }
  if (document.pointerLockElement !== canvas) return;
  const now = performance.now(), gap = Math.max(MOUSE.fd, Math.min(120, now - MOUSE.te)); MOUSE.te = now;
  const mx = e.movementX || 0, my = e.movementY || 0, ax = Math.abs(mx), ay = Math.abs(my);
  const fresh = now - MOUSE.t0 < 250, lim = fresh ? 200 : Math.max(300, gap * 8), limY = fresh ? 150 : Math.max(200, gap * 6);
  if (ax > lim || ay > limY) { MOUSE.drop++; return; }
  MOUSE.dx += mx; MOUSE.dy += my; if (my) LOOKT = now;
});
const TLOOK = { x: 0, y: 0 };
function mouseApply(dt = 1 / 60) {
  if (TLOOK.x || TLOOK.y) { const k = 1 - Math.exp(-Math.min(0.1, dt) * 40); let ax = TLOOK.x * k, ay = TLOOK.y * k;
    if (Math.abs(TLOOK.x - ax) < 0.4 && Math.abs(TLOOK.y - ay) < 0.4) { ax = TLOOK.x; ay = TLOOK.y; }
    TLOOK.x -= ax; TLOOK.y -= ay; camYaw -= ax * 0.0058; camPitch = Math.max(CTRL.pitchLo ?? -0.2, Math.min(1.1, camPitch + ay * 0.0042)); if (ay) LOOKT = performance.now(); }
  if (!MOUSE.dx && !MOUSE.dy) return;
  camYaw -= MOUSE.dx * 0.0026;
  camPitch = Math.max(CTRL.pitchLo ?? -0.2, Math.min(1.1, camPitch + MOUSE.dy * 0.0022));
  MOUSE.dx = MOUSE.dy = 0;
}

const TOUCH = createTouch({ canvas,
  look: (dx, dy) => { TLOOK.x += dx; TLOOK.y += dy; },
  zoom: k => { if (!world.overAt || camFirst) return; camZ = Math.max(4 / CAM_D, Math.min(18 / CAM_D, camZ * k)); },
  act: () => { if (MAP?.closeModal()) return; if (hotNear) act(hotNear); else MAP?.idleAct(); }, view: () => { camFirst = !camFirst; },
  onMode: on => { if (hotNear) hintEl.textContent = on ? hintEl.textContent.replace(/^E  /, '✋ ') : hintEl.textContent.replace(/^✋ /, 'E  ');
    if (MAP && MAP.minimap.visible) MAP.minimap.toggle(MAP.minimap.big); } });

const ACT = { anim: null, sit: null };
const CTRL = { frozen: false, speed: 1 };

Object.assign(CTRL, { wave: 0, crouchOK: false, crouched: false, crouchForce: null, peek: null, hot: null, hold: false, pose: null, noiseT: 0 });

const ACTS = createActions({ THREE, scene, camera, KID, pg, P, ACT, blocked: (x, z, y) => pBlocked(x, z, y, P.bh), groundAt: (x, z, y) => pGround(x, z, y), toast: m => toast(m), tone: (...a) => tone(...a), CTRL });
const SHOE_OUT = 0x4f7fd0;
KID.setShoe(SHOE_OUT);
if (world.busDoor) ACTS.busDoor(world.busDoor);
{ const H9 = world.hotspots;
  for (let i = H9.length - 1; i >= 0; i--) { const h = H9[i]; if (h.seat && h.cafe && (world.people || []).some(p => Math.hypot(p.x - h.seat.x, p.z - h.seat.z) < 0.45)) H9.splice(i, 1); }
  for (const h of H9) if (h.mic) ACTS.micStand(h); }
const CROUCH_H = 0.8;

function crouchTick() {
  const want = CTRL.crouchOK && !ACT.sit && !ACT.anim && (CTRL.crouchForce ?? (keys.has('KeyC') || (!CTRL.crouchNoCtrl && (keys.has('ControlLeft') || keys.has('ControlRight'))) || !!TOUCH.crouch));
  if (want && !CTRL.crouched) { CTRL.crouched = true; P.bh = CROUCH_H * PHY.sc; }
  else if (!want && CTRL.crouched) {
    if (!pBlocked(P.x, P.z, P.y, PHY.h)) { CTRL.crouched = false; P.bh = PHY.h; } }
}
const MOVE_K = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
const anyKey = L => { for (let i = 0; i < L.length; i++) if (keys.has(L[i])) return true; return false; };
function step(dt) {
  const moving = anyKey(MOVE_K) || TOUCH.m > 0 || TOUCH.jump || TOUCH.jumpT > 0;
  if (ACT.anim) {
    const a = ACT.anim; a.t = Math.min(1, a.t + dt / a.dur);
    P.x = a.from[0] + (a.to[0] - a.from[0]) * a.t; P.y = a.from[1] + (a.to[1] - a.from[1]) * a.t; P.z = a.from[2] + (a.to[2] - a.from[2]) * a.t;
    P.vy = 0; if (a.t >= 1) ACT.anim = null;
  } else if (ACT.sit && !moving) {
    P.x = ACT.sit.x; P.z = ACT.sit.z; P.y = ACT.sit.y; P.vy = 0;
  } else {
    ACT.sit = null;
    if (ACTS.busy && moving) ACTS.stop();
    physics(dt);
  }
  ACTS.tick(dt);
  const SE = ACT.sit && ACT.sit.seat;
  pg.position.set(SE ? SE.x : P.x, SE ? SE.y : P.y, SE ? SE.z : P.z);
  { const tY9 = SE ? SE.yaw : CTRL.face ?? P.yaw; if (POL9 && !SE && CTRL.face == null && !CTRL.ride && !ACT.anim) { let d = tY9 - faceY; d = Math.atan2(Math.sin(d), Math.cos(d)); const m = dt * 13; faceD = Math.abs(d) < m ? d : Math.sign(d) * m; faceY += faceD; } else { faceY = tY9; faceD = 0; } pg.rotation.y = faceY; }
  kidTick(dt);

  const indoor = ceilAt(P.x, P.z, P.y + 1.6, P.y + 5.5) !== null;
  const tFov = (camFirst ? 66 : indoor ? (inCorr ? 64 : 60) : 52) / (CTRL.zoom || 1);
  if (Math.abs(camera.fov - tFov) > 0.05) { camera.fov += (tFov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  { const S = PHY.sc, gy = pGround(P.x, P.z, P.y + 0.05 * S), h = Math.max(0, P.y - gy) / S, k = Math.max(0.35, 1 - h * 0.35);
    blob.position.set(P.x, gy + 0.045 * Math.max(S, 0.2), P.z); blob.scale.setScalar(0.95 * k * S); blob.material.opacity = k; blob.visible = !ACT.sit && h < 3; }
  pg.visible = !camFirst && camD > 0.45 * PHY.sc && !CTRL.hideMe;
  if (CTRL.hideMe) blob.visible = false;
  if (CTRL.peek) {
    const K9 = CTRL.peek; pg.visible = false; blob.visible = false;
    let dy9 = camYaw - K9.yaw; while (dy9 > Math.PI) dy9 -= Math.PI * 2; while (dy9 < -Math.PI) dy9 += Math.PI * 2;
    if (Math.abs(dy9) > 0.7) camYaw = K9.yaw + Math.sign(dy9) * 0.7;
    const pitch = Math.max(-0.35, Math.min(0.35, camPitch - 0.3));
    if (Math.abs(camera.fov - K9.fov) > 0.05) { camera.fov = K9.fov; camera.updateProjectionMatrix(); }
    camera.position.set(K9.x, K9.y, K9.z);
    camera.lookAt(K9.x - Math.sin(camYaw) * Math.cos(pitch), K9.y - Math.sin(pitch), K9.z - Math.cos(camYaw) * Math.cos(pitch));
    if (SHOT) applyShot(); return;
  }
  const eyeH = (CTRL.crouched ? 0.8 : 1.5) * PHY.sc, headH = (CTRL.crouched ? 0.8 : 1.3) * PHY.sc;
  if (camFirst) {
    const pitch = camPitch - 0.3, ey = (SE ? SE.y : P.y) + eyeH - (ACT.sit ? 0.42 * PHY.sc : 0), ex = SE ? SE.x : P.x, ez = SE ? SE.z : P.z;
    camera.position.set(ex, ey, ez);
    camera.lookAt(ex - Math.sin(camYaw) * Math.cos(pitch), ey - Math.sin(pitch), ez - Math.cos(camYaw) * Math.cos(pitch));
  } else if (PHY.T) {
    const S = PHY.sc, hx = P.x, hy = P.y + headH, hz = P.z, pch = Math.max(-0.2, Math.min(0.9, camPitch)), CD = (indoor ? 4.2 : CAM_D) * S;
    const want = camPoseT(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect).want;
    camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);
    const C = camPoseT(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect, camD);
    camSh = Math.abs(C.sh) > Math.abs(camSh) || C.sh * camSh < 0 ? C.sh : camSh + (C.sh - camSh) * Math.min(1, dt * 8);
    const rx = Math.cos(camYaw) * camSh, rz = -Math.sin(camYaw) * camSh;
    camera.position.set(C.x0 + rx, C.y, C.z0 + rz);
    camera.lookAt(hx + rx, hy, hz + rz);
  } else {
    if (camBY === null || !POL9 || SE || CTRL.ride || ACT.anim || Math.abs(P.y - camBY) > 2.5) camBY = P.y; else { const tY = P.ground ? P.y : Math.min(P.y, camBY + (P.y - camBY) * 0.35); camBY += (tY - camBY) * (1 - Math.exp(-dt * (P.ground ? 10 : 4))); }
    const RC = CTRL.room, hx = SE ? SE.x : P.x, hy = (SE ? SE.y + 0.1 : camBY) + headH, hz = SE ? SE.z : P.z, CD = RC ? RC.d * Math.max(0.8, Math.min(1.25, camZ)) : indoor ? 3.3 : CAM_D * (world.overAt ? camZ : 1); let pch = RC ? Math.min(camPitch, RC.p) : indoor ? Math.min(camPitch, 0.2) : camPitch;
    { let tgt = 0; if (world.overAt && !indoor && !RC && !SE && !camFirst) { const g0 = world.overAt(hx, hz, hy - headH); if (g0 != null) { const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), gA = world.overAt(hx + fx * 6, hz + fz * 6, hy), gB = world.overAt(hx - fx * CD, hz - fz * CD, hy);
          const up = gA != null ? Math.max(0, (gA - g0) / 6) : 0, need = gB != null ? Math.asin(Math.max(-1, Math.min(1, (gB + 1.4 - hy) / CD))) - pch : 0; tgt = Math.min(0.55, Math.max(up * 0.95, camPitch < 0 ? 0 : need, 0)); } }
      if (performance.now() - LOOKT > 3000) camLift += (tgt - camLift) * Math.min(1, dt * 2.4); pch += camLift; }
    let lookUp = 0; if (world.overAt && !indoor && !RC && pch < -0.12) { lookUp = -0.12 - pch; pch = -0.12; }
    if (RC) { let best = 0, bd = -1; for (let k = 0; k < 8; k++) { const p9 = pch + k * 0.1; if (k && p9 > 1.05) break; const c9 = Math.cos(p9), h9 = Math.min(CD, camHit(hx, hy, hz, Math.sin(camYaw) * c9, Math.sin(p9), Math.cos(camYaw) * c9, CD) - 0.3); if (h9 > bd + 0.08) { bd = h9; best = k * 0.1; } if (h9 >= CD * 0.82) break; } roomLift += (best - roomLift) * Math.min(1, dt * (best > roomLift ? 5 : 2)); pch += roomLift; } else roomLift = 0;
    const want = camPose(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect).want;
    camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);
    const C = camPose(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect, camD);
    camSh = Math.abs(C.sh) > Math.abs(camSh) || C.sh * camSh < 0 ? C.sh : camSh + (C.sh - camSh) * Math.min(1, dt * 8);
    const sh9 = camSh + (CTRL.shoulder || 0), rx = Math.cos(camYaw) * sh9, rz = -Math.sin(camYaw) * sh9;
    camera.position.set(C.x0 + rx, C.y, C.z0 + rz);
    if (lookUp) { const cp = camera.position, tx = hx + rx - cp.x, ty9 = hy - cp.y, tz = hz + rz - cp.z, hd = Math.hypot(tx, tz) || 1, el = Math.atan2(ty9, hd) + lookUp; camera.lookAt(cp.x + tx / hd * Math.cos(el) * 10, cp.y + Math.sin(el) * 10, cp.z + tz / hd * Math.cos(el) * 10); }
    else camera.lookAt(hx + rx, hy + camLift * 2.2 + roomLift * 1.4, hz + rz);
  }
  if (CAM_OVR) CAM_OVR(dt);
  if (SHOT) applyShot();
}

const CAMP = { want: 0, d: 0, sh: 0, x0: 0, y: 0, z0: 0 };
function nearClip(cx, cy, cz, fx, fy, fz, fov, aspect, hy) {
  const hh = 0.3 * Math.tan(fov * Math.PI / 360), hw = hh * aspect, rl = Math.hypot(fz, fx) || 1, rx = fz / rl, rz = -fx / rl;
  const ux = rz * fy, uy = fz * rx - fx * rz, uz = -fy * rx, fl = hy - 1.3 + 0.12;
  const k0x = Math.floor((cx - 1) / 8), k1x = Math.floor((cx + 1) / 8), k0z = Math.floor((cz - 1) / 8), k1z = Math.floor((cz + 1) / 8);
  for (let gx = k0x; gx <= k1x; gx++) for (let gz = k0z; gz <= k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const b = world.colliders[cell[k]];
      if (b.nc || b.y1 <= fl || (b.y1 - b.y0 < 1.5 && b.y0 < hy + 0.4)) continue;
      if (b.x1 < cx - 0.6 || b.x0 > cx + 0.6 || b.z1 < cz - 0.6 || b.z0 > cz + 0.6 || b.y1 < cy - 0.6 || b.y0 > cy + 0.6) continue;
      for (let c9 = 0; c9 < 5; c9++) { const sa = NCP[c9][0], sb = NCP[c9][1], ex = fx * 0.3 + rx * hw * sa + ux * hh * sb, ey = fy * 0.3 + uy * hh * sb, ez = fz * 0.3 + rz * hw * sa + uz * hh * sb;
        let t0 = 0, t1 = 1, ok = true;
        for (let a = 0; a < 3 && ok; a++) { const o = a === 0 ? cx : a === 1 ? cy : cz, d9 = a === 0 ? ex : a === 1 ? ey : ez, lo = a === 0 ? b.x0 : a === 1 ? b.y0 : b.z0, hi = a === 0 ? b.x1 : a === 1 ? b.y1 : b.z1;
          if (Math.abs(d9) < 1e-8) { if (o < lo || o > hi) ok = false; } else { let p = (lo - o) / d9, q = (hi - o) / d9; if (p > q) { const s9 = p; p = q; q = s9; } if (p > t0) t0 = p; if (q < t1) t1 = q; if (t0 > t1) ok = false; } }
        if (ok) return true; } } }
  return false;
}
const NCP = [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]];
function camPose(hx, hy, hz, yaw, pch, CD, fov, aspect, dUse) {
  const dx = Math.sin(yaw) * Math.cos(pch), dy = Math.sin(pch), dz = Math.cos(yaw) * Math.cos(pch);
  const hit = camHit(hx, hy, hz, dx, dy, dz, CD);
  let want = Math.min(CD, hit - 0.3);
  if (want < 0.5) want = Math.max(0.1, Math.min(0.5, hit - 0.12));
  for (let k = 0; k < 60 && want > 0.5 && nearClip(hx + dx * want, hy + dy * want, hz + dz * want, -dx, -dy, -dz, fov, aspect, hy); k++) want = Math.max(0.5, want - 0.1);
  if (world.overAt) for (let k = 0; k < 40 && want > 0.5; k++) { let bad = false; for (let f = 0.4; f < 1.05; f += 0.2) { const w9 = want * f, g = world.overAt(hx + dx * w9, hz + dz * w9, hy + dy * w9); if (g != null && hy + dy * w9 < g + 0.4) { bad = true; break; } } if (!bad) break; want = Math.max(0.5, want - 0.2); }
  const d = dUse ?? want, cx = hx + dx * d, cz = hz + dz * d; let cy = hy + dy * d;
  if (world.overAt) { const g = world.overAt(cx, cz, cy); if (g != null && cy < g + 0.4) cy = g + 0.4; }
  const hw = 0.3 * Math.tan(fov * Math.PI / 360) * aspect + 0.08, rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const r = camHit(cx, cy, cz, rx, 0, rz, hw), l = camHit(cx, cy, cz, -rx, 0, -rz, hw);
  CAMP.sh = (r < hw && l < hw) ? (r - l) / 2 : r < hw ? r - hw : l < hw ? hw - l : 0;
  CAMP.want = want; CAMP.d = d; CAMP.x0 = cx; CAMP.y = cy; CAMP.z0 = cz;
  return CAMP;
}
let camSh = 0;
function physics(dt) {
  crouchTick();
  if (CTRL.pin) { const q9 = CTRL.pin, ox = P.x, oz = P.z; P.x = q9.x; P.y = q9.y; P.z = q9.z; P.vy = 0; P.ground = !!q9.g; if (q9.yaw != null) P.yaw = q9.yaw; P.spd = Math.hypot(P.x - ox, P.z - oz) / Math.max(dt, 1e-4);
    if (q9.cam != null && !CTRL.frozen) { let d = q9.cam - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); camYaw += d * Math.min(1, dt * 1.6); } return; }
  const cr = CTRL.crouched, sp = (cr ? PHY.crawl : (keys.has('ShiftLeft') || keys.has('ShiftRight')) && !CTRL.noRun ? PHY.run : PHY.walk) * CTRL.speed;
  let mx = 0, mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) { mx -= Math.sin(camYaw); mz -= Math.cos(camYaw); }
  if (keys.has('KeyS') || keys.has('ArrowDown')) { mx += Math.sin(camYaw); mz += Math.cos(camYaw); }
  const turnK = CTRL.freeMouse && !TOUCH.on;
  if (keys.has('KeyA') || (!turnK && keys.has('ArrowLeft'))) { mx -= Math.cos(camYaw); mz += Math.sin(camYaw); }
  if (keys.has('KeyD') || (!turnK && keys.has('ArrowRight'))) { mx += Math.cos(camYaw); mz -= Math.sin(camYaw); }
  if (turnK && !CTRL.frozen) { if (keys.has('ArrowLeft')) camYaw += 2.0 * dt; if (keys.has('ArrowRight')) camYaw -= 2.0 * dt; }
  let sp2 = sp;
  if (mx === 0 && mz === 0 && TOUCH.m > 0) {
    mx = -Math.sin(camYaw) * TOUCH.my + Math.cos(camYaw) * TOUCH.mx; mz = -Math.cos(camYaw) * TOUCH.my - Math.sin(camYaw) * TOUCH.mx;
    sp2 = (cr ? PHY.crawl * Math.max(0.4, Math.min(1, TOUCH.m / 0.8)) : TOUCH.m >= 0.92 && !CTRL.noRun ? PHY.run : PHY.walk * Math.max(0.3, Math.min(1, (TOUCH.m - 0.15) / 0.6))) * CTRL.speed;
  }
  if (mx === 0 && mz === 0 && CTRL.steer) {
    const st = CTRL.steer; mx = st.x; mz = st.z; sp2 = st.v;
    if (st.cam && (mx || mz)) { let d = Math.atan2(-mx, -mz) - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); camYaw += d * Math.min(1, dt * 2.2); }
  }
  if (CTRL.frozen || CTRL.held) mx = mz = 0;
  const L = Math.hypot(mx, mz), ox = P.x, oz = P.z;
  if (L > 0) {
    mx /= L; mz /= L;
    if (CTRL.turnMax) { const a9 = Math.atan2(mx, mz), b9 = CTRL._dir ?? a9, lim = CTRL.turnMax * dt; let d9 = Math.atan2(Math.sin(a9 - b9), Math.cos(a9 - b9)); if (d9 > lim) d9 = lim; else if (d9 < -lim) d9 = -lim; const c9 = b9 + d9; CTRL._dir = c9; mx = Math.sin(c9); mz = Math.cos(c9); } else CTRL._dir = null;
    const sp = sp2, stp = Math.max(1, Math.ceil(sp * dt / 0.3)), sx = mx * sp * dt / stp, sz = mz * sp * dt / stp;
    for (let s9 = 0; s9 < stp; s9++) { const nx = P.x + sx; let bX = pBlocked(nx, P.z, P.y, P.bh); if (!bX) P.x = nx; const nz = P.z + sz; let bZ = pBlocked(P.x, nz, P.y, P.bh); if (!bZ) P.z = nz;
      if (CTRL.slip && (bX || bZ)) slipStep(bX, bZ, sx, sz); }
    P.yaw = Math.atan2(mx, mz);
  }
  P.spd = Math.hypot(P.x - ox, P.z - oz) / Math.max(dt, 1e-4);
  if (TOUCH.jumpT > 0) TOUCH.jumpT -= dt;
  if ((keys.has('Space') || TOUCH.jump || TOUCH.jumpT > 0) && P.ground && !CTRL.frozen && !CTRL.held && !cr && !CTRL.noJump) { P.vy = PHY.jv; P.ground = false; TOUCH.jumpT = 0; }
  P.vy -= PHY.g * dt;
  if (CTRL.glide > 0 && P.vy < -CTRL.glide) P.vy = -CTRL.glide;
  const y0 = P.y;
  P.y += P.vy * dt;

  if (P.vy > 0) { const c = pCeil(P.x, P.z, y0 + P.bh, P.y + P.bh); if (c !== null) { P.y = c - P.bh; P.vy = 0; } }

  const g = pGround(P.x, P.z, Math.max(y0, P.y));
  if (P.y <= g) { if (!P.ground && y0 - g > 0.35 * PHY.sc) CTRL.noiseT = 0.4; P.y = g; P.vy = 0; P.ground = true; }
  if (CTRL.noiseT > 0) CTRL.noiseT -= dt;
}

const SHOT = (() => {
  const s = new URLSearchParams(location.search).get('shot');
  if (!s) return null;
  const [x, y, z, h, p, f] = s.split(',').map(Number);
  return { x, y, z, h: (h || 0) * Math.PI / 180, p: (p || 0) * Math.PI / 180, f: f || 70 };
})();
function applyShot() {
  if (!SHOT.hid) { document.querySelectorAll('.chip').forEach(c => c.style.display = 'none'); SHOT.hid = true; }
  pg.visible = false; blob.visible = false;
  camera.fov = SHOT.f; camera.updateProjectionMatrix();
  camera.position.set(SHOT.x, SHOT.y, SHOT.z);
  camera.lookAt(SHOT.x + Math.sin(SHOT.h) * Math.cos(SHOT.p), SHOT.y + Math.sin(SHOT.p), SHOT.z - Math.cos(SHOT.h) * Math.cos(SHOT.p));
}

const HOT = world.hotspots;
const hintEl = document.createElement('div');
hintEl.className = 'chip'; hintEl.id = 'hint';
hintEl.style.cssText = 'left:50%;bottom:56px;transform:translateX(-50%);display:none;cursor:pointer;font-size:15px;padding:8px 16px';
document.body.appendChild(hintEl);
const toastEl = document.createElement('div'); toastEl.id = 'toast';
toastEl.className = 'chip';
toastEl.style.cssText = 'left:50%;top:56px;transform:translateX(-50%);display:none;font-size:15px;padding:8px 16px';
document.body.appendChild(toastEl);
let toastT = 0;
function toast(msg, sec = 2.2) { const T = document.body.classList.contains('title-on'); toastEl.classList.toggle('ttl-keep', T); toastEl.style.zIndex = T ? '45' : ''; toastEl.textContent = msg; toastEl.style.display = ''; toastT = sec; }
let hotNear = null, hotT = 0, hotLab = null;
function hotTick(dt) {
  if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.display = 'none';
  if ((hotT += dt) < 0.15) return;
  hotT = 0;
  let best = null, bd = 1e9;
  if (CTRL.hot) best = CTRL.hot;
  else if (!ACT.anim) for (const h of HOT) {
    if (h.off) continue;
    const d = (P.x - h.x) ** 2 + (P.z - h.z) ** 2;
    if (d < h.r * h.r && d < bd && Math.abs(P.y - h.y) < 1.6) { bd = d; best = h; }
  }
  if (mapOpened && best !== mapOpened) { if (MAP && MAP.minimap.visible && !MAP.game.current) MAP.minimap.hide(); mapOpened = null; }
  if (best !== hotNear || (best && best.label !== hotLab) || (!best && hintEl.style.display !== 'none')) {
    hotNear = best; hotLab = best && best.label;
    hintEl.style.display = best ? '' : 'none'; TOUCH.setNear(best);
    if (best) hintEl.textContent = (best.lock ? '' : TOUCH.on ? '✋ ' : 'E  ') + (best.kind === 'board' ? ['칠판에 낙서하기', '더 그리기', '칠판 지우기'][best.stage || 0] : best.kind === 'sit' && ACT.sit ? '일어나기' : best.label);
    hintEl.style.color = best && best.lock ? '#5f5a52' : ''; hintEl.style.background = best && best.lock ? '#e7e2d8' : '';
  }
}

const chalkTex = [1, 2].map(n => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 180;
  const g = c.getContext('2d'); g.strokeStyle = g.fillStyle = 'rgba(28,64,150,0.9)'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.arc(80, 90, 45, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(66, 78, 5, 0, 7); g.arc(94, 78, 5, 0, 7); g.fill();
  g.beginPath(); g.arc(80, 95, 24, 0.2, Math.PI - 0.2); g.stroke();
  g.font = '900 54px sans-serif'; g.fillText('안녕!', 160, 108);
  if (n === 2) {
    for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(400 + Math.cos(k * 1.26) * 26, 70 + Math.sin(k * 1.26) * 26, 16, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(400, 96); g.lineTo(400, 165); g.stroke();
    g.beginPath(); g.moveTo(170, 150); for (let x = 170; x < 330; x += 20) g.lineTo(x + 10, x % 40 ? 135 : 160); g.stroke();
  }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
});
const chalkGeo = new THREE.PlaneGeometry(1.5, 0.53);
let tray = null, milk = null, shoesIn = false, drumN = 0;

let AC = null;
function tone(freq, t0, dur, type = 'sine', vol = 0.25, drop = 0) {
  if (SET.mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (drop) o.frequency.exponentialRampToValueAtTime(drop, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {   }
}
const drumSnd = () => { tone(120, 0, 0.35, 'sine', 0.55, 45); tone(120, 0.3, 0.3, 'sine', 0.45, 45); tone(900, 0.15, 0.08, 'square', 0.06); };
const xyloSnd = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4, 'triangle', 0.22));
const songSnd = () => [392, 440, 494, 523, 494, 440, 392].forEach((f, i) => tone(f, i * 0.28, 0.32, 'triangle', 0.16));

function makeTray() {
  const g = new THREE.Group();
  const TM = c => new THREE.MeshLambertMaterial({ color: c });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.34), TM(0xc8d2da)));
  [[-0.13, 0.07, 0xf4f1e8], [0.13, 0.07, 0xc86a3a], [-0.16, -0.08, 0xc8452c], [0, -0.08, 0x6fa04f], [0.16, -0.08, 0xe8c35a]].forEach(([x, z, c], i) => {
    const f = new THREE.Mesh(i < 2 ? new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.BoxGeometry(0.1, 0.03, 0.09), TM(c));
    f.position.set(x, 0.02, -z); g.add(f); });
  g.userData.eaten = 0; return g;
}
const trayHands = () => { if (!tray) return; pg.add(tray); tray.position.set(0, KID.tray[0], KID.tray[1]); tray.rotation.set(0, 0, 0); };
const trayFood = k => { if (!tray) return; tray.userData.eaten = k; for (let i = 1; i < tray.children.length; i++) { const f = tray.children[i]; f.visible = k < 0.98; f.scale.setScalar(Math.max(0.05, 1 - k * (0.8 + i * 0.04))); } };
let mapOpened = null;
function act(h) {
  if (typeof h.use === 'function') {
    try { h.use(h); } catch (e) { console.error(e); }
    hotNear = null; if (h.once) h.off = true; MAP?.emit('interact', h); return;
  }
  MAP?.emit('interact', h);
  const A = (name, o = {}) => ACTS.play(name, { at: h.at, ats: h.ats, h, ...o });
  switch (h.kind) {
    case 'board': {
      const nx = ((h.stage || 0) + 1) % 3;
      A(nx === 0 ? 'erase' : 'write', { at: [h.bx, h.by, h.bz], msg: nx === 0 ? '🧽 칠판을 깨끗이 지웠어요' : '✏️ 칠판에 낙서했어요', midAt: 0.75, onMid: () => {
        h.stage = nx;
        if (!h.mesh) { h.mesh = new THREE.Mesh(chalkGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); h.mesh.position.set(h.bx, h.by, h.bz); h.mesh.rotation.y = h.ry || 0; scene.add(h.mesh); }
        h.mesh.visible = h.stage > 0;
        if (h.stage > 0) { h.mesh.material.map = chalkTex[h.stage - 1]; h.mesh.material.needsUpdate = true; } } });
      hotNear = null; break;
    }
    case 'sit':
      if (ACT.sit) { ACT.sit = null; hotNear = null; break; }
      ACTS.stop(true);
      ACT.sit = { x: h.x, z: h.z, y: h.y, seat: h.seat || null }; P.yaw = h.seat ? h.seat.yaw : h.yaw ?? Math.PI;
      if (tray && h.seat && h.seat.table) {
        const T = h.seat.table; scene.add(tray); tray.position.set(T[0], T[1] + 0.02, T[2]); tray.rotation.set(0, h.seat.yaw, 0);
        const e0 = tray.userData.eaten || 0; let told = e0 >= 1;
        ACTS.play('eat', { onEat: t => { const k = Math.min(1, e0 + t / 8); trayFood(k); if (k >= 1 && !told) { told = true; toast('😋 다 먹었어요! 식판은 식판 반납대에 돌려줘요'); } }, onEnd: () => trayHands() });
        toast(e0 >= 1 ? '🍽️ 식판이 비었어요 — 일어나서 반납대로' : '🍚 냠냠 — 식탁에 앉아 먹어요 (움직이면 일어나요)', 2.6);
      } else toast(h.bus ? '🚌 버스 의자에 앉았어요 — 움직이면 일어나요' : '💺 의자에 앉았어요 — 움직이면 일어나요');
      hotNear = null; break;
    case 'meal':
      if (!tray) A('reach', { msg: '🍚 급식을 받았어요 — 빈 의자에 가서 앉아 먹어요', midAt: 0.5, onMid: () => { if (!tray) { tray = makeTray(); trayHands(); } } });
      else toast(tray.userData.eaten >= 1 ? '🍽️ 다 먹은 식판은 식판 반납대에 돌려줘요' : '🍚 식판은 이미 받았어요 — 의자에 앉아 먹어요');
      break;
    case 'trayback':
      if (tray) { const t9 = tray; A('reach', { msg: t9.userData.eaten >= 1 ? '🍽️ 식판을 반납했어요 — 잘 먹었습니다!' : '🍽️ 식판을 반납했어요', midAt: 0.5,
        onMid: () => { if (tray !== t9) return; scene.attach(t9); if (h.at) t9.position.set(h.at[0], h.at[1] + 0.02, h.at[2]); tray = null; },
        onEnd: () => { if (t9.parent === scene) scene.remove(t9); } }); }
      else toast('반납할 식판이 없어요');
      break;
    case 'read': A('read'); break;
    case 'water': A('drink'); break;
    case 'wash': A(h.pump ? 'sanitize' : 'wash'); break;
    case 'garden': A('water'); break;
    case 'pot': A('spray'); break;
    case 'mic': A('mic', { at: h.at }); break;
    case 'shoes': A('shoes', { midAt: 0.85, msg: shoesIn ? '👞 운동화로 갈아신었어요' : '👟 실내화로 갈아신었어요', onMid: () => {
      shoesIn = !shoesIn; KID.setShoe(shoesIn ? KID.shoeIn : SHOE_OUT); h.label = shoesIn ? '운동화로 갈아신기' : '실내화로 갈아신기'; } }); break;
    case 'drum': (drumN++ % 2 ? xyloSnd : drumSnd)(); A('drum', { msg: drumN % 2 ? '🥁 둥둥 둥둥!' : '🎶 도미솔도~ 실로폰 소리' }); break;
    case 'milk':
      if (!milk) { milk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.09), new THREE.MeshLambertMaterial({ color: 0xf4f6f2 })); milk.position.set(...KID.milk); pg.add(milk); toast('🥛 우유를 하나 꺼냈어요'); }
      else { pg.remove(milk); milk = null; toast('🥛 우유를 다 마셨어요'); }
      break;
    case 'visit': A('scribble', { msg: '📝 방문록에 이름을 적었어요' }); break;
    case 'map': A('point', { msg: '🗺️ 학교 안내도 — 현관 · 가운데 로비 · 교실을 찾아가 봐요 (M · 지도 닫기)', midAt: 0.6, onMid: () => {
      if (MAP && !MAP.minimap.visible && !MAP.game.current) { MAP.minimap.show({ big: true }); mapOpened = h; } } }); break;
    case 'clock': { const d = new Date(); A('look', { msg: `🕰️ 지금은 ${d.getHours()}시 ${d.getMinutes()}분이에요` }); break; }
    case 'notice': A('look', { msg: '📋 이번 주 학생자치회 소식을 읽었어요' }); break;
    case 'aed': A('point', { msg: '❤️ AED(자동심장충격기) 보관함이에요 — 위급할 땐 선생님께 바로 알려요' }); break;
    case 'keypad': A('press', { msg: '🔢 과학실 번호키를 눌렀어요 — 삐빅!', midAt: 0.35, onMid: () => [1319, 1175, 1397].forEach((f, i) => tone(f, i * 0.09, 0.07, 'square', 0.05)) }); break;
    case 'song': songSnd(); A('sing', { msg: '🎵 교가를 흥얼거렸어요' }); break;
    case 'motto': A('look', { msg: '📜 우리 학교 교훈 — 바르고 슬기롭게' }); break;
    case 'flag': A('salute', { msg: '🇰🇷 태극기가 바람에 펄럭여요' }); break;
    case 'slide':
      ACTS.stop(true); ACT.anim = { from: h.from, to: h.to, t: 0, dur: h.dur ?? 0.9 }; P.yaw = h.yaw ?? Math.PI; toast('🎢 슝~'); break;
  }
}
addEventListener('keydown', e => { if (e.code === 'KeyE' && !e.repeat) { if (hotNear) act(hotNear); else MAP?.idleAct(); } });
hintEl.addEventListener('click', e => { e.stopPropagation(); if (MAP?.closeModal()) return; if (hotNear) act(hotNear); });

const doorMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

const glassMat = new THREE.MeshLambertMaterial({ color: 0xbfe3ee, transparent: true, opacity: 0.42, depthWrite: false });
glassMat.onBeforeCompile = glassFx;

const DOORS = world.doors.map(d => {

  const w = d.w + 0.1, h = (d.dh ?? 2.6) + (d.lintel ? 0.05 : 0);

  return { ax: d.ax, bx: d.cx, bz: d.cz, w, ow: d.w, h, y0: d.y0, glass: d.glass, open: 0, over: d.slideOver ? 0.12 : 0, color: d.color, slot: d.slot, film: d.film, lum: d.lum, swing: d.swing || null };
});
const _boxG = new THREE.BoxGeometry(1, 1, 1);
const SLID = DOORS.filter(o => !o.swing);
const nWood = SLID.filter(o => !o.glass && !o.film).length, nFilm = SLID.filter(o => o.film).length, nGlass = SLID.length - nWood - nFilm;

const filmTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#d4d6d8'; g.fillRect(0, 0, 128, 7); g.fillRect(0, 249, 128, 7); g.fillRect(0, 0, 7, 256); g.fillRect(121, 0, 7, 256);
  g.fillStyle = 'rgba(150,150,150,0.35)'; [[34, 190, 16], [80, 214, 22], [58, 150, 11], [96, 170, 9], [30, 228, 10]].forEach(([x, y, r]) => { for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.2566) * r * 0.7, y + Math.sin(k * 1.2566) * r * 0.7, r * 0.55, r * 0.32, k * 1.2566, 0, 7); g.fill(); } });
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(64, 86, 22, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,120,120,0.5)'; g.lineWidth = 4; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const doorInst = {
  film: new THREE.InstancedMesh(_boxG, new THREE.MeshBasicMaterial({ color: 0xffffff, map: filmTex }), Math.max(1, nFilm)),
  wood: new THREE.InstancedMesh(_boxG, doorMat, Math.max(1, nWood)),
  glass: new THREE.InstancedMesh(_boxG, glassMat, Math.max(1, nGlass)),
  win: new THREE.InstancedMesh(_boxG, new THREE.MeshLambertMaterial({ color: 0x9fc6d4 }), Math.max(1, nWood)),
  knob: new THREE.InstancedMesh(_boxG, new THREE.MeshLambertMaterial({ color: 0x6b6f75 }), Math.max(1, nWood)),
};
Object.values(doorInst).forEach(m => { m.frustumCulled = false; scene.add(m); });
doorInst.wood.count = nWood; doorInst.win.count = nWood; doorInst.knob.count = nWood; doorInst.glass.count = nGlass; doorInst.film.count = nFilm;
{ let iw = 0, ig = 0, i9 = 0; const _dc = new THREE.Color(); SLID.forEach(o => { o.idx = o.glass ? ig++ : o.film ? i9++ : iw++; if (o.film) doorInst.film.setColorAt(o.idx, _dc.set(o.color ?? 0xffffff)); else if (!o.glass) doorInst.wood.setColorAt(o.idx, _dc.set(o.color ?? 0xc08b4f).multiplyScalar(o.lum ?? 1)); });
  if (doorInst.wood.instanceColor) doorInst.wood.instanceColor.needsUpdate = true; if (doorInst.film.instanceColor) doorInst.film.instanceColor.needsUpdate = true; }

if (nFilm) { const fl = DOORS.filter(o => o.film); world.details.push({ mesh: doorInst.film, cx: fl.reduce((a, o) => a + o.bx, 0) / nFilm, cz: fl.reduce((a, o) => a + o.bz, 0) / nFilm, inside: true }); }
const _dM = new THREE.Matrix4(), _dP = new THREE.Vector3(), _dS = new THREE.Vector3(), _dQ = new THREE.Quaternion();

const quiltTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#1d2757'; g.fillRect(0, 0, 128, 256);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 5; i++) { const x = i * 32 - (j % 2) * 16, y = j * 32 - 8, gr = g.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 22);
    gr.addColorStop(0, '#2c3a7a'); gr.addColorStop(1, '#161e46'); g.fillStyle = gr; g.beginPath(); g.ellipse(x + 16, y + 16, 17, 17, 0, 0, 7); g.fill(); }
  g.fillStyle = '#e9eaee'; for (let j = 0; j < 9; j++) for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(i * 32 - (j % 2) * 16, j * 32 - 8, 2.6, 0, 7); g.fill(); }
  g.strokeStyle = '#f2f2f2'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 250);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const SWING = DOORS.filter(o => o.swing), SWP = { q: [], p: [], g: [] };
SWING.forEach(o => {
  const sw = o.swing, X = o.ax === 'x', L = sw.leaves || [o.ow], S = L.reduce((a, b) => a + b, 0), m = Math.max(0.03, (o.ow - S) / 2);
  const line = X ? o.bz : o.bx, c = X ? o.bx : o.bz, g0 = c - o.ow / 2, g1 = c + o.ow / 2, H9 = (o.h - (o.lintel ? 0.05 : 0)) - 0.02;
  o.lv = L.map((w, k) => {
    const s = L.length === 1 || k === 0 ? 1 : -1, hinge = s > 0 ? g0 + m : g1 - m, len = w * (o.ow - 2 * m) / S - 0.02, parts = [];
    const P = (mesh, a, y, pw, ph, t, col) => { const i = SWP[mesh].length; SWP[mesh].push(col ?? 0xffffff); parts.push({ mesh, i, a, y, pw, ph, t }); };
    if (sw.look === 'glass') { P('g', len / 2, o.y0 + H9 / 2, len - 0.1, H9 - 0.1, 0.03); [0.03, len - 0.03].forEach(a => P('p', a, o.y0 + H9 / 2, 0.06, H9, 0.05, 0xc9cdd1)); P('p', len / 2, o.y0 + H9 - 0.03, len - 0.1, 0.06, 0.05, 0xc9cdd1); P('p', len / 2, o.y0 + 0.06, len - 0.1, 0.12, 0.05, 0xc9cdd1); P('p', len - 0.12, o.y0 + 1.0, 0.03, 0.9, 0.12, 0xb8bcc0); }
    else if (sw.look === 'quilt') { P('q', len / 2, o.y0 + H9 / 2, len, H9, 0.06); if (w < 0.8) P('p', len / 2, o.y0 + 1.55, 0.25, 0.35, 0.07, 0xbfd8e2); P('p', len - 0.1, o.y0 + 1.05, 0.04, 0.6, 0.14, 0x8a5a36); }
    else if (sw.look === 'frost') {
      P('p', len / 2, o.y0 + H9 / 2, len - 0.1, H9 - 0.16, 0.03, 0xe9eef0);
      [0.03, len - 0.03].forEach(a => P('p', a, o.y0 + H9 / 2, 0.06, H9, 0.05, 0xc9cdd1)); P('p', len / 2, o.y0 + H9 - 0.04, len - 0.1, 0.08, 0.05, 0xc9cdd1); P('p', len / 2, o.y0 + 0.07, len - 0.1, 0.14, 0.05, 0xc9cdd1);
      P('p', len - 0.13, o.y0 + 1.15, 0.045, 1.15, 0.16, 0x6b3f26);
      if (k === 0) P('p', len - 0.25, o.y0 + 1.12, 0.08, 0.16, 0.08, 0x3a3d42);
      (sw.deco?.[k] || []).forEach(([u, y, dw, dh, col], i) => P('p', u * len, o.y0 + y, dw, dh, 0.036 + i * 0.002, col));
    }
    else { P('p', len / 2, o.y0 + H9 / 2, len, H9, 0.05, sw.color ?? 0xf2f2f0);
      if (sw.win !== false) P('p', len / 2, o.y0 + 1.5, Math.min(0.35, len * 0.4), 0.5, 0.06, 0xd6e4ea);
      if (sw.panel) [1.5, 0.62].forEach(y => P('p', len / 2, o.y0 + y, len * 0.6, 0.72, 0.062, sw.panel));
      if (sw.knob) P('p', len - 0.09, o.y0 + 0.98, 0.07, 0.07, 0.11, sw.knob); else P('p', len - 0.1, o.y0 + 1.0, 0.12, 0.04, 0.12, 0x9aa0a6); }
    return { hinge, s, parts, w: len };
  });
  o.lineC = line;
});
const swingInst = {}; let swingR = 0; const _swC = new THREE.Vector3();
SWING.forEach(o => _swC.add(new THREE.Vector3(o.bx, o.y0 + 1.2, o.bz))); if (SWING.length) _swC.divideScalar(SWING.length);
SWING.forEach(o => { swingR = Math.max(swingR, Math.hypot(o.bx - _swC.x, o.bz - _swC.z) + o.ow + 1.5); });
[['q', new THREE.MeshLambertMaterial({ color: 0xffffff, map: quiltTex })], ['p', new THREE.MeshLambertMaterial({ color: 0xffffff })], ['g', glassMat]].forEach(([k, mat]) => {
  const n = SWP[k].length, im = new THREE.InstancedMesh(_boxG, mat, Math.max(1, n)); im.count = n; swingInst[k] = im;
  if (k !== 'g') { const _c9 = new THREE.Color(); SWP[k].forEach((col, i) => im.setColorAt(i, _c9.set(col))); if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  im.boundingSphere = new THREE.Sphere(_swC.clone(), swingR); im.visible = n > 0; scene.add(im); });
const _sQ = new THREE.Quaternion(), _sY = new THREE.Vector3(0, 1, 0);
function setSwing(o) {
  const th = o.open * 1.45, X = o.ax === 'x', n = o.swing.n || 1;
  for (const L of o.lv) {
    const dA = L.s * Math.cos(th), dN = n * Math.sin(th);
    const dx = X ? dA : dN, dz = X ? dN : dA;
    _sQ.setFromAxisAngle(_sY, Math.atan2(-dz, dx));
    const hx = X ? L.hinge : o.lineC, hz = X ? o.lineC : L.hinge;
    for (const p of L.parts) { _dP.set(hx + dx * p.a, p.y, hz + dz * p.a); _dS.set(p.pw, p.ph, p.t); swingInst[p.mesh].setMatrixAt(p.i, _dM.compose(_dP, _sQ, _dS)); }
  }
  for (const k in swingInst) swingInst[k].instanceMatrix.needsUpdate = true;
}

function swingHits(o) {
  let n = 0; const X = o.ax === 'x', nn = o.swing.n || 1;
  for (const L of o.lv) { const len = L.w;
    const a0 = Math.min(L.hinge + L.s * 0.02, L.hinge + L.s * len), a1 = Math.max(L.hinge + L.s * 0.02, L.hinge + L.s * len), b0 = Math.min(o.lineC + nn * 0.16, o.lineC + nn * (len + 0.1)), b1 = Math.max(o.lineC + nn * 0.16, o.lineC + nn * (len + 0.1));
    const R9 = X ? [a0, a1, b0, b1] : [b0, b1, a0, a1];
    for (const b of world.allBoxes) { if (b.wall || b.y1 - b.y0 >= 2.6 || b.y1 <= o.y0 + 0.02 || b.y0 >= o.y0 + o.h) continue;
      if (b.x1 <= R9[0] || b.x0 >= R9[1] || b.z1 <= R9[2] || b.z0 >= R9[3]) continue; n++; } }
  return n;
}
function setDoor(o) {
  if (o.swing) { setSwing(o); return; }
  const s = o.open * (o.slide ?? 0) * (o.dir ?? 1);
  const X = o.ax === 'x', cx = X ? o.bx + s : o.bx + (o.over || 0), cz = X ? o.bz + (o.over || 0) : o.bz + s;
  const put = (m, lx, y, ww, hh, th) => {
    _dP.set(X ? cx + lx : cx, y, X ? cz : cz + lx); _dS.set(X ? ww : th, hh, X ? th : ww);
    m.setMatrixAt(o.idx, _dM.compose(_dP, _dQ, _dS));
  };
  if (o.glass) { put(doorInst.glass, 0, o.y0 + o.h/2, o.w, o.h, 0.16); doorInst.glass.instanceMatrix.needsUpdate = true; return; }
  if (o.film) { put(doorInst.film, 0, o.y0 + o.h/2, o.w, o.h, 0.16); doorInst.film.instanceMatrix.needsUpdate = true; return; }
  put(doorInst.wood, 0, o.y0 + o.h/2, o.w, o.h, 0.16);
  const ww = Math.min(0.5, o.ow * 0.4), edge = -(o.dir ?? 1) * (o.ow/2 - 0.16);
  if (o.slot) put(doorInst.win, edge * 0.35, o.y0 + 1.45, Math.min(0.6, o.ow * 0.5), 0.12, 0.18);
  else put(doorInst.win, edge * 0.35, o.y0 + 1.65, ww, 0.7, 0.18);
  put(doorInst.knob, edge, o.y0 + 1.0, 0.05, 0.22, 0.22);
  doorInst.wood.instanceMatrix.needsUpdate = doorInst.win.instanceMatrix.needsUpdate = doorInst.knob.instanceMatrix.needsUpdate = true;
}
const DOOR_ACT = [];
function doorTick(dt) {
  for (const o of DOORS) {
    const dx = P.x - o.bx, dz = P.z - o.bz;
    let near = dx * dx + dz * dz < 9 && Math.abs(P.y - o.y0) < 2;
    if (!near) for (let i = 0; i < DOOR_ACT.length; i++) { const a = DOOR_ACT[i], ax = a.x - o.bx, az = a.z - o.bz; if (ax * ax + az * az < 4 && Math.abs(a.y - o.y0) < 2) { near = true; break; } }
    const target = o.lock ? 0 : o.hold != null ? o.hold : near ? 1 : 0;
    if (Math.abs(target - o.open) < 0.002) continue;
    o.open += (target - o.open) * Math.min(1, dt * 6);
    setDoor(o);
  }
}

function sweepHits(o, dir, len = o.ow + 0.05) {
  const s = len * dir, T = 0.09, y0 = o.y0, y1 = o.y0 + o.h;
  const lo = Math.min(0, s), hi = Math.max(0, s);
  const sw = o.ax === 'x'
    ? { x0: o.bx - o.w/2 + lo, x1: o.bx + o.w/2 + hi, z0: o.bz - T, z1: o.bz + T }
    : { x0: o.bx - T, x1: o.bx + T, z0: o.bz - o.w/2 + lo, z1: o.bz + o.w/2 + hi };
  let n = 0;
  if (!o.swC || len > o.swLen || o.swN !== world.allBoxes.length) {
    const e = Math.max(len, o.ow + 0.05), R9 = o.ax === 'x' ? [o.bx - o.w/2 - e, o.bx + o.w/2 + e, o.bz - T, o.bz + T] : [o.bx - T, o.bx + T, o.bz - o.w/2 - e, o.bz + o.w/2 + e];
    o.swC = world.allBoxes.filter(b => !(b.wall || b.y1 - b.y0 >= 2.6) && !(b.x1 <= R9[0] || b.x0 >= R9[1] || b.z1 <= R9[2] || b.z0 >= R9[3] || b.y1 <= y0 || b.y0 >= y1)); o.swLen = e; o.swN = world.allBoxes.length; }
  for (const b of o.swC) {
    if (b.wall || b.y1 - b.y0 >= 2.6) continue;

    if (b.x1 <= sw.x0 || b.x0 >= sw.x1 || b.z1 <= sw.z0 || b.z0 >= sw.z1 || b.y1 <= y0 || b.y0 >= y1) continue;
    n++;
  }
  return n;
}

DOORS.forEach(o => {
  if (o.swing) { o.dir = 1; o.slide = 0; setDoor(o); return; }
  if (o.over) { o.dir = 1; o.slide = o.ow + 0.05; setDoor(o); return; }
  o.dir = sweepHits(o, 1) <= sweepHits(o, -1) ? 1 : -1;

  o.slide = o.ow + 0.05;
  while (o.slide > 0.3 && sweepHits(o, o.dir, o.slide)) o.slide -= 0.05;
  setDoor(o);
});
function doorCheck() {
  const bad = [];
  for (const o of DOORS) if (o.swing ? swingHits(o) : !o.over && sweepHits(o, o.dir, o.slide)) bad.push([+o.bx.toFixed(1), +o.bz.toFixed(1)]);
  if (bad.length) console.error('🚪 문 경로 간섭 ' + bad.length + '건: ' + JSON.stringify(bad.slice(0, 6)));
  else console.log('✅ 문 경로 간섭 0 (문 ' + DOORS.length + '개)');
  return bad;
}

const TIMES = {
  day:    { label: '☀️ 낮',  bg: 0xcfe9f8, near: 80, far: 260, sky: 0xc9dcf0, gnd: 0xb08a5e, hi: 1.4,  sc: 0xfff0cf, si: 3.1, sp: [60, 95, 45],   exp: 1.12 },
  sunset: { label: '🌇 노을', bg: 0xf3c193, near: 60, far: 230, sky: 0xf4cba4, gnd: 0x8a6a4e, hi: 1.15, sc: 0xffb066, si: 2.4, sp: [-88, 34, 26],  exp: 1.06 },
  night:  { label: '🌙 밤',  bg: 0x1f2b3f, near: 40, far: 175, sky: 0x5a73a0, gnd: 0x2c3444, hi: 1.15, sc: 0xa8bcda, si: 0.9, sp: [-30, 80, -60], exp: 1.12 },
};

TIMES.sunset.hi = 1.3;

TIMES.day.exp = 1.05; TIMES.sunset.exp = 1.12; TIMES.night.exp = 1.15;

const SKY_TOP = { day: 0x86bfee, sunset: 0xa8a2cf, night: 0x0b1322 };
const skyDome = (() => {
  const g = new THREE.SphereGeometry(290, 20, 8), ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false, depthWrite: false }));
  m.frustumCulled = false; m.renderOrder = -1; scene.add(m); return m;
})();
function skyPaint(k) {
  const P = skyDome.geometry.attributes.position, C = skyDome.geometry.attributes.color, lo = new THREE.Color(TIMES[k].bg), hi = new THREE.Color(SKY_TOP[k]), c = new THREE.Color();
  const sd = new THREE.Vector3(...TIMES[k].sp).setY(0).normalize(), glow = new THREE.Color(0xffc48a);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) / 290, y = P.getY(i) / 290, z = P.getZ(i) / 290, t = Math.min(1, Math.max(0, y));
    c.copy(lo).lerp(hi, Math.pow(t, 0.7));
    if (k === 'sunset') { const a = Math.max(0, (x * sd.x + z * sd.z) / (Math.hypot(x, z) || 1)); c.lerp(glow, a * a * a * Math.max(0, 1 - t * 2.2) * 0.55); }
    C.setXYZ(i, c.r, c.g, c.b); }
  C.needsUpdate = true;
}

const bakeCam = new THREE.PerspectiveCamera(1, 1, 0.1, 0.2); bakeCam.position.set(0, -5000, 0); bakeCam.lookAt(0, -6000, 0); bakeCam.updateMatrixWorld();
function bakeShadows() {
  const st = ST_MESH, vis = st.map(m => m.visible);
  st.forEach(m => { m.visible = true; });
  const t0 = performance.now();
  renderer.shadowMap.needsUpdate = true; renderer.render(scene, bakeCam);
  st.forEach((m, i) => { m.visible = vis[i]; });
  TIMING.bakeMs = +(performance.now() - t0).toFixed(2);
}

const stars = (() => {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, ph = Math.asin(0.06 + Math.random() * 0.93), R = 290;
    pos[i*3] = Math.cos(th) * Math.cos(ph) * R; pos[i*3+1] = Math.sin(ph) * R; pos[i*3+2] = Math.sin(th) * Math.cos(ph) * R; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff8e8, size: 1.7, sizeAttenuation: false, fog: false }));
  m.visible = false; m.frustumCulled = false; scene.add(m); return m;
})();

const clouds = (() => {
  let sd = 20260924; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const pos = [], col = [], blob = new THREE.IcosahedronGeometry(1, 1), bp = blob.attributes.position, m4 = new THREE.Matrix4();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), TOP = new THREE.Color(0xffffff), BOT = new THREE.Color(0xd3dcea), cc = new THREE.Color();
  for (let i = 0; i < 9; i++) {
    const th = i / 9 * Math.PI * 2 + rnd() * 0.5, R = 150 + rnd() * 60, cx = Math.cos(th) * R, cz = Math.sin(th) * R, cy = 58 + rnd() * 30, sc = 0.8 + rnd() * 0.5, k = 4 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++) {
      const ox = (j - (k - 1) / 2) * 9 * sc + (rnd() - 0.5) * 4, big = 1 - Math.abs(j - (k - 1) / 2) / k;
      m4.compose(new THREE.Vector3(cx + ox * Math.cos(th + 1.57), cy + big * 4.5 * sc, cz + ox * Math.sin(th + 1.57)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 3, 0)),
        new THREE.Vector3((9 + big * 9) * sc, (5 + big * 7) * sc, (8 + big * 7) * sc));
      for (let t = 0; t < bp.count; t += 3) {
        a.fromBufferAttribute(bp, t).applyMatrix4(m4); b.fromBufferAttribute(bp, t + 1).applyMatrix4(m4); c.fromBufferAttribute(bp, t + 2).applyMatrix4(m4);
        a.y = Math.max(a.y, cy - 1); b.y = Math.max(b.y, cy - 1); c.y = Math.max(c.y, cy - 1);
        n.subVectors(b, a).cross(c.clone().sub(a)); if (n.lengthSq() < 1e-6) continue; n.normalize();
        cc.copy(BOT).lerp(TOP, Math.min(1, Math.max(0, (n.y + 0.35) / 1.1)));
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); for (let q = 0; q < 3; q++) col.push(cc.r, cc.g, cc.b);
      }
    }
  }
  blob.dispose();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  m.frustumCulled = false; scene.add(m); return m;
})();
const CLOUD_TINT = { day: 0xffffff, sunset: 0xffc9a6, night: 0x34425a };

const flagBase = world.flag ? Float32Array.from(world.flag.geometry.attributes.position.array) : null;
let flagT = 0, flagAcc = 1, flagW = null;
function skyTick(dt) {
  clouds.position.set(camera.position.x, 0, camera.position.z); clouds.rotation.y += dt * 0.004;
  if (stars.visible) stars.position.set(camera.position.x, camera.position.y, camera.position.z);
  skyDome.position.copy(camera.position);
  { const c = camera.position, BR = world.details.brect; let o = 1;
    if (c.y < 9) for (let i = 0; i < BR.length; i++) { const r = BR[i]; if (c.x > r[0] && c.x < r[1] && c.z > r[2] && c.z < r[3]) { o = 0; break; } }
    if (GLASS_U.uOut.value !== o) { GLASS_U.uOut.value = o; glassApply(timeKey); } }
  if (!flagBase) return;

  flagT += dt; flagAcc += dt;
  if (flagAcc < 1 / 30) return;
  if (!flagW) { world.flag.updateMatrixWorld(); flagW = new THREE.Vector3().setFromMatrixPosition(world.flag.matrixWorld); }
  if (camera.position.distanceToSquared(flagW) > 70 * 70) return;
  flagAcc = 0;
  const P = world.flag.geometry.attributes.position, A = P.array;
  for (let i = 0; i < P.count; i++) { const x = flagBase[i*3], y = flagBase[i*3+1], u = (x + 0.7) / 1.4;
    A[i*3+2] = Math.sin(flagT * 3.4 - u * 5.2 + y * 0.9) * 0.11 * u + Math.sin(flagT * 1.3 - u * 2.1) * 0.04 * u;
    A[i*3+1] = y - 0.05 * u * u; }
  P.needsUpdate = true; world.flag.geometry.computeVertexNormals();
}

function glassApply(k) {
  if (!world.glassMesh) return;
  const gmat = world.glassMesh.material, glow = GLASS_U.uOut.value > 0.5 && !darkOn;
  gmat.emissive.setHex(!glow ? 0x000000 : k === 'night' ? 0xb08a3e : k === 'sunset' ? 0x3a2a14 : 0x000000); gmat.opacity = k === 'night' && glow ? 0.62 : 0.32;
  GLASS_U.uSkyRef.value.setHex(GLASS_SKY[k][0]); GLASS_U.uGndRef.value.setHex(GLASS_SKY[k][1]); GLASS_U.uFr.value = GLASS_SKY[k][2];
}
const GLASS_SKY = { day: [0x8fc3ea, 0x5d6b73, 0.6], sunset: [0xe9b995, 0x5e4a44, 0.55], night: [0x1c2a44, 0x0c1018, 0.22] };
const ORDER = ['day', 'sunset', 'night'];
let timeKey = 'day';

let darkOn = false;
const DARK = { hi: 0.4, si: 0.15, lamp: 0x3a3e48 };
function setDark(on) { on = !!on; if (on === darkOn) return darkOn; darkOn = on; if (world.lampMat) world.lampMat.color.setHex(on ? DARK.lamp : 0xfdfbf2); setTime(timeKey); return darkOn; }
const timeBtn = document.createElement('div');
timeBtn.className = 'chip'; timeBtn.id = 'timeChip';
timeBtn.style.cssText = 'right:10px;bottom:10px;cursor:pointer;user-select:none';
document.body.appendChild(timeBtn);
function setTime(k) {
  const t = TIMES[k]; if (!t) return timeKey;
  timeKey = k;
  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.bg); scene.fog.near = t.near; scene.fog.far = t.far;
  hemi.color.setHex(t.sky); hemi.groundColor.setHex(t.gnd); hemi.intensity = t.hi;
  sun.color.setHex(t.sc); sun.intensity = t.si; sun.position.set(t.sp[0], t.sp[1], t.sp[2]).setLength(170);
  renderer.toneMappingExposure = t.exp;
  skyPaint(k);
  bakeShadows();
  stars.visible = k === 'night';
  clouds.material.color.setHex(CLOUD_TINT[k]);
  if (darkOn) { hemi.intensity = t.hi * DARK.hi; sun.intensity = t.si * DARK.si; }
  glassApply(k);
  if (LOOK) lookApply();
  { const i = t.label.indexOf(' '); timeBtn.innerHTML = '<span class="ico">' + t.label.slice(0, i) + '</span><span class="lbl">' + t.label.slice(i) + '</span>'; timeBtn.title = t.label; }
  MAP?.emit('time', k);
  return k;
}
timeBtn.addEventListener('click', e => { e.stopPropagation(); setTime(ORDER[(ORDER.indexOf(timeKey) + 1) % 3]); });

function lookApply() {
  const o = LOOK && (LOOK[timeKey] ? { ...LOOK, ...LOOK[timeKey] } : LOOK); if (!o) return;
  if (o.horizon != null) { scene.background.setHex(o.horizon); scene.fog.color.setHex(o.fogColor ?? o.horizon); }
  if (o.fog) { scene.fog.near = o.fog[0]; scene.fog.far = o.fog[1]; }
  if (o.hemi) { hemi.color.setHex(o.hemi[0]); hemi.groundColor.setHex(o.hemi[1]); hemi.intensity = o.hemi[2]; }
  if (o.sun) { sun.color.setHex(o.sun[0]); sun.intensity = o.sun[1]; }
  if (o.exp) renderer.toneMappingExposure = o.exp;
  if (o.top != null) { const P9 = skyDome.geometry.attributes.position, C9 = skyDome.geometry.attributes.color, lo = new THREE.Color(o.horizon), hi = new THREE.Color(o.top), c = new THREE.Color();
    for (let i = 0; i < P9.count; i++) { const t = Math.min(1, Math.max(0, P9.getY(i) / 290)); c.copy(lo).lerp(hi, Math.pow(t, o.skyPow || 0.7)); C9.setXYZ(i, c.r, c.g, c.b); } C9.needsUpdate = true; }
  stars.visible = o.stars != null ? !!o.stars : timeKey === 'night';
  clouds.visible = o.clouds !== false; if (typeof o.clouds === 'number') clouds.material.color.setHex(o.clouds);
  if (o.far) { camera.far = o.far; camera.updateProjectionMatrix(); }
  document.body.dataset.look = o.ui || '';
}
function setLook(o) {
  const was = LOOK; LOOK = o || null;
  if (LOOK) { lookApply(); return; }
  if (!was) return; delete document.body.dataset.look; clouds.visible = true;
  camera.far = PHY.sc < 0.999 ? 160 : 320; camera.updateProjectionMatrix(); setTime(timeKey);
}
setTime('day');

const locBox = document.getElementById('loc');
let locT = 0;
function updateLoc() {
  const Z = MAP ? MAP.zoneAt(P.x, P.y, P.z) : null;
  inCorr = !!(Z && Z.kind === 'corridor' && Z.id !== 'music-passage');
  const t = '📍 ' + (Z ? Z.label : '학교'); if (t !== locBox.textContent) locBox.textContent = t;
}

const DETAIL_LITE = GFX.mode !== 'desktop';
const DETAIL_FAR = DETAIL_LITE ? 42 : 55, DETAIL_IN = DETAIL_LITE ? 16 : 20, DETAIL_IN_IN = DETAIL_LITE ? 24 : 30;

const OCC = { N: 720, R: 46, K: 6, hd: null, hy0: null, hy1: null, hl: null, hh: null, hw: null, hn: null, occ: null, planes: null, stairs: null, x: 1e9, y: 1e9, z: 1e9, ms: 0, off: false };
world.occ = OCC;

const RB = { cpu: new Float32Array(240), occ: new Float32Array(120), ci: 0, oi: 0 };
const rbPct = (a, n, p) => { const m = Math.min(n, a.length); if (!m) return null; const s = Array.from(a.subarray(0, m)).sort((x, y) => x - y); return +s[Math.min(m - 1, Math.floor(p * m))].toFixed(3); };
function occPrep() {
  const W = world.allBoxes.filter(b => b.wall && b.y1 - b.y0 >= 2.4), BR = world.details.brect, FH0 = world.details.FH, NK = OCC.N * OCC.K;
  OCC.occ = W; OCC.hd = new Float32Array(NK); OCC.hy0 = new Float32Array(NK); OCC.hy1 = new Float32Array(NK); OCC.hn = new Uint8Array(OCC.N);
  OCC.hl = new Float32Array(NK); OCC.hh = new Float32Array(NK); OCC.hw = new Int32Array(NK);
  OCC.rs = new Uint32Array(OCC.N); OCC.nd = new Uint8Array(OCC.N);
  OCC.cs = new Float64Array(OCC.N); OCC.sn = new Float64Array(OCC.N);
  for (let k = 0; k < OCC.N; k++) { const th = k * (Math.PI * 2 / OCC.N); OCC.cs[k] = Math.cos(th); OCC.sn[k] = Math.sin(th); }
  OCC.wb = new Float64Array(W.length * 6); W.forEach((w, i) => OCC.wb.set([w.x0, w.x1, w.z0, w.z1, w.y0, w.y1], i * 6));
  OCC.stairs = world.zones.filter(z => z.kind === 'stair' || (z.kind == null && /계단/.test(z.label) && !/창고/.test(z.label)));

  const C = world.colliders, G = world.grid;
  const inStair = (x, z, e = 0.6) => OCC.stairs.some(q => x > q.x0 - e && x < q.x1 + e && z > q.z0 - e && z < q.z1 + e);
  const bands = (r, hole) => { const HN = 260, cov = new Uint16Array(HN); let n = 0;
    for (let x = r[0] + 0.6; x < r[1] - 0.3; x += 1.5) for (let z = r[2] + 0.6; z < r[3] - 0.3; z += 1.5) { if (hole && inStair(x, z)) continue; n++;
      const hit = new Uint8Array(HN), cell = G.get(Math.floor(x / 8) + ':' + Math.floor(z / 8)) || [];
      for (const k of cell) { const b = C[k]; if (x < b.x0 - 0.02 || x > b.x1 + 0.02 || z < b.z0 - 0.02 || z > b.z1 + 0.02 || b.y1 < 2.2) continue;
        for (let h = Math.max(0, Math.ceil((b.y0 - 2.2) / 0.05)); h < HN && 2.2 + h * 0.05 <= b.y1; h++) hit[h] = 1; }
      for (let h = 0; h < HN; h++) cov[h] += hit[h]; }
    const L = []; for (let h = 0; h < HN; h++) if (n && cov[h] === n) { const b0 = 2.2 + h * 0.05; while (h + 1 < HN && cov[h + 1] === n) h++; L.push({ b: [b0, 2.2 + h * 0.05], hole }); }
    return L; };
  OCC.planes = BR.map((r, i) => bands(r, i === world.details.wing));
}

const _sl = [0, 0];
function slab(ox, oz, dx, dz, x0, x1, z0, z1) {
  let t0 = -1e9, t1 = 1e9;
  if (Math.abs(dx) < 1e-9) { if (ox < x0 || ox > x1) return false; } else { let a = (x0 - ox) / dx, b = (x1 - ox) / dx; if (a > b) { const s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; }
  if (Math.abs(dz) < 1e-9) { if (oz < z0 || oz > z1) return false; } else { let a = (z0 - oz) / dz, b = (z1 - oz) / dz; if (a > b) { const s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; }
  if (t0 > t1 || t1 < 0) return false; _sl[0] = Math.max(0, t0); _sl[1] = t1; return true;
}

const _as = [0, 0], _af = [0, 0];
function angSpan(cx, cz, x0, x1, z0, z1, outer) {
  const DA = Math.PI * 2 / OCC.N, a0 = Math.atan2((z0 + z1) / 2 - cz, (x0 + x1) / 2 - cx); let lo = 0, hi = 0;
  for (let c = 0; c < 4; c++) { let d = Math.atan2((c & 2 ? z1 : z0) - cz, (c & 1 ? x1 : x0) - cx) - a0; if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2; if (d < lo) lo = d; if (d > hi) hi = d; }
  const A = (a0 + lo) / DA, B = (a0 + hi) / DA; _af[0] = A; _af[1] = B;
  if (outer) { _as[0] = Math.floor(A); _as[1] = Math.ceil(B); return; }
  let k0 = Math.ceil(A), k1 = Math.floor(B); if (k1 < k0) k0 = k1 = Math.round(a0 / DA); _as[0] = k0; _as[1] = k1;
}

function occRays(cp, nd) {
  const { N, R, K, hd, hy0, hy1, hl, hh, hw, hn, cs, sn, wb } = OCC, px = cp.x, pz = cp.z; if (!nd) hn.fill(0);
  for (let i = 0, wi = 0; i < wb.length; i += 6, wi++) { const x0 = wb[i], x1 = wb[i + 1], z0 = wb[i + 2], z1 = wb[i + 3];
    if (x1 < px - R || x0 > px + R || z1 < pz - R || z0 > pz + R) continue;
    if (px > x0 && px < x1 && pz > z0 && pz < z1) continue;
    angSpan(px, pz, x0, x1, z0, z1); const A = _af[0], B = _af[1];
    for (let k = _as[0], k1 = _as[1]; k <= k1; k++) { const kk = ((k % N) + N) % N; if (nd && !nd[kk]) continue;
      if (!slab(px, pz, cs[kk], sn[kk], x0, x1, z0, z1) || _sl[0] > R) continue;
      const t = _sl[0], base = kk * K; let n = hn[kk], j = n;
      if (n === K) { if (t >= hd[base + K - 1]) continue; j = K - 1; } else hn[kk] = n + 1;
      while (j > 0 && hd[base + j - 1] > t) { const s = base + j - 1; hd[s + 1] = hd[s]; hy0[s + 1] = hy0[s]; hy1[s + 1] = hy1[s]; hl[s + 1] = hl[s]; hh[s + 1] = hh[s]; hw[s + 1] = hw[s]; j--; }
      hd[base + j] = t; hy0[base + j] = wb[i + 4]; hy1[base + j] = wb[i + 5]; hl[base + j] = Math.min(0, A - k); hh[base + j] = Math.max(0, B - k); hw[base + j] = wi; }
  }
}

const _fa = new Float32Array(9), _fb = new Float32Array(9);
let _rrP = false;
function rayRects(cp, dx, dz) { const BR = world.details.brect; for (let i = 0; i < BR.length; i++) { const r = BR[i]; if (OCC.planes[i].length && slab(cp.x, cp.z, dx, dz, r[0], r[1], r[2], r[3])) { _fa[i] = _sl[0]; _fb[i] = _sl[1]; } else _fa[i] = -1; } }
function stairHole(ox, oz, dx, dz, L) { for (const q of OCC.stairs) if (slab(ox, oz, dx, dz, q.x0, q.x1, q.z0, q.z1) && _sl[0] <= L) return true; return false; }
function lineMask(cp, base, n, dx, dz, t, ty) {
  const { hd, hy0, hy1, hl, hh } = OCC, hc = cp.y, g = (ty - hc) / Math.max(t, 1e-3); let m = 0, lo = 0, hi = 0;
  for (let j = 0; j < n; j++) { const d = hd[base + j]; if (d >= t) break; const h = hc + g * d;
    if (h >= hy0[base + j] - 0.02 && h <= hy1[base + j] + 0.02) { m |= 1 << j; if (hl[base + j] < lo) lo = hl[base + j]; if (hh[base + j] > hi) hi = hh[base + j]; } }
  if (m && lo <= -1 && hi >= 1) return m;
  if (_rrP) { _rrP = false; rayRects(cp, dx, dz); }
  for (let i = 0; i < 9; i++) { if (_fa[i] < 0) continue; const a = _fa[i], b = Math.min(_fb[i], t); if (b <= a) continue;
    for (const p of OCC.planes[i]) { const p0 = p.b[0], p1 = p.b[1]; let sa = a, sb = b;
      if (Math.abs(g) < 1e-6) { if (hc < p0 || hc > p1) continue; } else { let u = (p0 - hc) / g, v = (p1 - hc) / g; if (u > v) { const w = u; u = v; v = w; } sa = Math.max(a, u); sb = Math.min(b, v); if (sb < sa) continue; }
      if (p.hole && stairHole(cp.x + dx * sa, cp.z + dz * sa, dx, dz, sb - sa)) continue;
      return m | 128; } }
  return m;
}

function occGap(pb, pm, cb, cm, k, A, B) {
  const { hl, hh, hw, K } = OCC; let R = k - 1, L = k;
  for (let j = 0; j < K; j++) { if (!(pm >> j & 1)) continue; const e = k - 1 + hh[pb + j];
    if (e < k) { if (e > R) R = e; continue; }
    const w = hw[pb + j]; for (let i = 0; i < K; i++) if ((cm >> i & 1) && hw[cb + i] === w) return false; }
  for (let i = 0; i < K; i++) { if (!(cm >> i & 1)) continue; const s = k + hl[cb + i]; if (s > k - 1 && s < L) L = s; }
  return R < L - 0.02 && Math.max(R, A) < Math.min(L, B);
}
const _pm = new Uint8Array(9), _cm = new Uint8Array(9);

function nearStair(x, z) { const L = OCC.stairs; for (let i = 0; i < L.length; i++) { const q = L[i]; if (x > q.x0 - 2 && x < q.x1 + 2 && z > q.z0 - 2 && z < q.z1 + 2) return true; } return false; }
function occVisible(d, cp, pre) {
  const bx = d.box, BR = world.details.brect[d.bi];
  const x0 = bx.min.x, x1 = bx.max.x, z0 = bx.min.z, z1 = bx.max.z, y0 = bx.min.y, y1 = bx.max.y;
  const inB = cp.x > BR[0] && cp.x < BR[1] && cp.z > BR[2] && cp.z < BR[3];
  const FH0 = world.details.FH, slabOK = d.fl === 1 ? y1 <= FH0 + 0.35 : y0 >= FH0 - 0.05;
  if (inB && slabOK && d.bi === world.details.wing) { const camFl = cp.y > FH0 + 0.15 ? 2 : 1;
    if (camFl !== d.fl && !nearStair(cp.x, cp.z)) return false; }
  if (cp.x >= x0 && cp.x <= x1 && cp.z >= z0 && cp.z <= z1) return true;
  if (pre) return -1;
  const { N, K, hn, cs, sn } = OCC; angSpan(cp.x, cp.z, x0, x1, z0, z1, true); const A = _af[0], B = _af[1];
  let prev = false, pb = 0;
  for (let k = _as[0], k1 = _as[1]; k <= k1; k++) { const kk = ((k % N) + N) % N, dx = cs[kk], dz = sn[kk], cb = kk * K;
    let tE, tX;
    if (slab(cp.x, cp.z, dx, dz, x0, x1, z0, z1)) { tE = _sl[0]; tX = _sl[1]; }
    else {
      tE = 1e9; tX = -1e9; for (let c = 0; c < 4; c++) { const t = ((c & 1 ? x1 : x0) - cp.x) * dx + ((c & 2 ? z1 : z0) - cp.z) * dz; if (t < tE) tE = t; if (t > tX) tX = t; }
      if (tX <= 0) { prev = false; continue; } tE = Math.max(0, tE); }
    _rrP = true;

    for (let q = 0; q < 9; q++) { const t = q % 3 === 0 ? tE : q % 3 === 1 ? (tE + tX) / 2 : tX, ty = q < 3 ? y0 : q < 6 ? (y0 + y1) / 2 : y1;
      const m = lineMask(cp, cb, hn[kk], dx, dz, t, ty); if (!m) return true;
      if (prev && !((m | _pm[q]) & 128) && occGap(pb, _pm[q], cb, m, k, A, B)) return true;
      _cm[q] = m; }
    _pm.set(_cm); pb = cb; prev = true;
  }
  return false;
}
let detailT = 1;
const _fr = new THREE.Frustum(), _fm = new THREE.Matrix4(), _pd = [];

const OCC_BUDGET = 1.0, OCC_GROUP = 4;
const _pdCmp = (a, b) => ((a.cx - OCC.x) ** 2 + (a.cz - OCC.z) ** 2) - ((b.cx - OCC.x) ** 2 + (b.cz - OCC.z) ** 2);
function detailTick(dt, budget = Infinity) {
  detailT += dt;
  const cp = camera.position, moved = Math.abs(cp.x - OCC.x) + Math.abs(cp.y - OCC.y) + Math.abs(cp.z - OCC.z) > 0.15;
  let t0 = performance.now(), occW = false, prep = false;
  if (detailT >= 0.2 || moved) { detailT = 0;
    const camIn = ceilAt(cp.x, cp.z, cp.y - 0.3, cp.y + 4.5) !== null;
    const R = ((FILM_VIEW ? FILM_VIEW.far : DETAIL_FAR * FM.dk) + 11.3) ** 2, RI = FILM_VIEW ? R : ((camIn ? DETAIL_IN_IN : DETAIL_IN) * FM.dk + 11.3) ** 2;
    if (!OCC.occ) { const tp = performance.now(); occPrep(); prep = true; TIMING.occPrepMs = performance.now() - tp; t0 += TIMING.occPrepMs; }

    OCC.gen = (OCC.gen || 0) + 1; OCC.x = cp.x; OCC.y = cp.y; OCC.z = cp.z; occW = true;
    for (const d of world.details) {
      const dx = cp.x - d.cx, dz = cp.z - d.cz;
      d.on = !d.out && dx * dx + dz * dz < (d.inside ? RI : R);
      d.pend = d.on && d.inside && !OCC.off && !FILM_VIEW && d.box && d.bi != null ? OCC.gen : 0;
    }
  }

  camera.updateMatrixWorld(); _fr.setFromProjectionMatrix(_fm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  _pd.length = 0;
  for (const d of world.details) { const v = d.on && (!d.box || _fr.intersectsBox(d.box)); if (v && d.pend === OCC.gen) _pd.push(d); else d.mesh.visible = v; }
  if (_pd.length) { occW = true;
    const { N, rs, nd, hn } = OCC;
    if (budget < Infinity && _pd.length > OCC_GROUP) _pd.sort(_pdCmp);
    let g0 = 0;
    while (g0 < _pd.length) { const g1 = budget < Infinity ? Math.min(_pd.length, g0 + OCC_GROUP) : _pd.length; let any = false;
      for (let i = g0; i < g1; i++) { const d = _pd[i], r = occVisible(d, OCC, true); if (r !== -1) { d.mesh.visible = d.on = r; d.pend = 0; continue; }
        const b = d.box; angSpan(OCC.x, OCC.z, b.min.x, b.max.x, b.min.z, b.max.z, true);
        for (let k = _as[0]; k <= _as[1]; k++) { const kk = ((k % N) + N) % N; if (rs[kk] !== OCC.gen) { rs[kk] = OCC.gen; nd[kk] = 1; hn[kk] = 0; any = true; } } }
      if (any) { occRays(OCC, nd); nd.fill(0); }
      for (let i = g0; i < g1; i++) { const d = _pd[i]; if (d.pend) { d.mesh.visible = d.on = occVisible(d, OCC); d.pend = 0; } }
      g0 = g1; if (performance.now() - t0 > budget) break; }
    for (let i = g0; i < _pd.length; i++) { _pd[i].mesh.visible = true; OCC.defer = (OCC.defer || 0) + 1; } }
  if (occW) { OCC.ms = performance.now() - t0; if (!prep) RB.occ[RB.oi++ % RB.occ.length] = OCC.ms; }
  if (!OCC.st) { OCC.st = []; scene.traverse(o => { if (o.userData.st) OCC.st.push(o); }); }
  for (const m of OCC.st) m.visible = !m.userData.out && _fr.intersectsBox(m.geometry.boundingBox);
}

let rebakeT = 0;
const FILM = createFilm({ THREE, camera, renderer, scene, world, tone, setCam: f => { CAM_OVR = f; }, setView: v => { FILM_VIEW = v && { far: GFX.mode === 'desktop' ? v.far : GFX.mode === 'cb' ? Math.min(v.far, 150) : Math.min(v.far, 100) }; OCC.x = 1e9; },     setTime: k => setTime(k), getTime: () => timeKey, lookOn: () => !!LOOK });
const TOP = createTop({ THREE, camera, renderer, scene, world, setCam: f => { CAM_OVR = f; }, setView: v => { FILM_VIEW = v && { far: GFX.mode === 'desktop' ? v.far : GFX.mode === 'cb' ? Math.min(v.far, 150) : Math.min(v.far, 100) }; OCC.x = 1e9; },
  getZones: () => MAP && MAP.zones, zoneAt: (x, y, z) => MAP && MAP.zoneAt(x, y, z), player: () => ({ x: P.x, y: P.y, z: P.z }), setYaw: v => { camYaw = v; } });
MAP = createMapApi({ THREE, scene, camera, renderer, world, SCHOOL, film: FILM, top: TOP, look: o => setLook(o),
  q: { groundAt, blockedAt, ceilAt, segHit: camHit },
  pl: { P, ACT, CTRL, keys, touch: TOUCH, acts: ACTS, getYaw: () => camYaw, setYaw: v => { camYaw = v; },
    getFirst: () => camFirst, setFirst: v => { camFirst = !!v; }, getPitch: () => camPitch,
    look: (dx, dy) => { camYaw -= dx * 0.0058; camPitch = Math.max(CTRL.pitchLo ?? -0.2, Math.min(1.1, camPitch + dy * 0.0042)); if (dy) LOOKT = performance.now(); },
    setScale, tinyAdd: c => tinyAdd(c), pBlocked, pGround, scale: () => PHY.sc },
  ui: { toast, hint: hintEl, tone, setTime: k => setTime(k), getTime: () => timeKey, dark: on => setDark(on), isDark: () => darkOn }, hot: HOT,

  kid: { pg, KID }, doorLock: (n, on) => { const o = DOORS[n]; if (!o) return false; o.lock = !!on; if (on) { o.open = 0; setDoor(o); } return true; },

  doorHold: (n, v) => { const o = DOORS[n]; if (!o) return false; o.hold = v == null ? null : v ? 1 : 0; return true; }, doorActors: DOOR_ACT,
  rebake: () => { if (!rebakeT) rebakeT = setTimeout(() => { rebakeT = 0; bakeShadows(); }, 600); },
  prewarm: () => prewarm(), idle }, NAV, makeMeta(SCHOOL));

const ADAPT = (() => { const FL = GFX.floor || 0.6, L = []; for (let v = GFX.cap; v >= Math.max(0.75, FL) - 1e-6; v = Math.round((v - 0.25) * 100) / 100) L.push(v);
  if (!L.includes(GFX.start)) { L.push(GFX.start); L.sort((a, b) => b - a); } if (L[L.length - 1] > FL + 1e-6) L.push(FL);
  GFX.floor = GFX.adapt ? L[L.length - 1] : GFX.dpr;
  return { ladder: L, lvl: L.indexOf(GFX.start), s0: L.indexOf(GFX.start), ft: 0, buf: new Float32Array(256), srt: new Float32Array(256), bi: 0, bn: 0, winT: 0, evT: 0, big: 0, slowT: 0, goodT: 0, coolT: 3,
    fail: new Map(), steps: 0, last: 0, shadow0: GFX.shadow, log: [], hold: null }; })();
GFX.auto = ADAPT;
function setDpr(v) { GFX.dpr = v; renderer.setPixelRatio(v); }
function setShadowSize(sz) {
  if (!GFX.shadow || sun.shadow.mapSize.x === sz) return; GFX.shadow = sz; sun.shadow.mapSize.set(sz, sz);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } bakeShadows();
}
function adaptWin() {
  const A = ADAPT, B = A.buf, n = Math.min(A.bn, B.length); let k = 0, t = 0;
  for (let j = 1; j <= n && t < 2000; j++) { const v = B[(A.bi - j + B.length) % B.length]; A.srt[k++] = v; t += v; }
  const S = A.srt.subarray(0, k).sort(), m = Math.max(1, Math.ceil(k * 0.92)); let s = 0;
  for (let j = 0; j < m; j++) s += S[j];
  return s / m;
}

let BLD9 = 0;
function building() { if (!(window.SM_BUILD > 0)) { BLD9 = 0; return false; } const t = performance.now(); if (!BLD9) BLD9 = t; return t - BLD9 < 90000; }
function adaptReset(cool) { const A = ADAPT; A.bn = 0; A.winT = 0; A.evT = 0; A.slowT = A.goodT = 0; if (cool != null) A.coolT = Math.max(A.coolT, cool); }
function adaptTick(ts) {
  const A = ADAPT, raw = A.last ? ts - A.last : 0; A.last = ts;
  if (!GFX.adapt || !(raw > 0) || document.hidden) return;
  if (A.hold && A.hold()) { if (A.bn || A.winT) adaptReset(2); return; }
  if (building()) { adaptReset(3); return; }
  if (raw > 250) { if (++A.big < 3) return; } else A.big = 0;
  const d = Math.min(100, raw), sec = d / 1000;
  if (A.coolT > 0) { A.coolT -= sec; return; }
  A.buf[A.bi] = d; A.bi = (A.bi + 1) % A.buf.length; A.bn++; A.winT += d; A.evT += d;
  if (A.winT < 1000 || A.evT < 250) return;
  const dtE = A.evT / 1000; A.evT = 0; A.ft = adaptWin();
  const L0 = A.ladder;
  if (A.pre) {
    const P0 = A.pre; A.pre = null;
    if (A.ft > P0.ft * 0.88) { A.lvl = P0.lvl; setDpr(L0[A.lvl]); if (A.shadow0 > 1024 && GFX.shadow !== A.shadow0) setShadowSize(A.shadow0); A.capT = performance.now() + 300000; A.log.push(['cap', +A.ft.toFixed(1), +(performance.now() / 1000).toFixed(1)]);     adaptReset(2); return; }
  }
  if (A.capT && performance.now() < A.capT) { A.slowT = 0; return; }
  if (A.ft > (FM.q ? 36.5 : 18.5)) { A.slowT += dtE; A.goodT = 0; } else A.slowT = 0;
  const L = A.ladder, logp = () => A.log.push([+(performance.now() / 1000).toFixed(1), L[A.lvl], +A.ft.toFixed(1)]);
  if (A.slowT >= 1 && A.lvl < L.length - 1) {
    A.pre = { lvl: A.lvl, ft: A.ft }; A.fail.set(A.lvl, (A.fail.get(A.lvl) || 0) + 1); A.lvl++; A.steps++; logp();
    setDpr(L[A.lvl]); if (A.lvl === L.length - 1 && A.shadow0 > 1024) setShadowSize(1024);
    adaptReset(1.5); return;
  }
  if (A.lvl === 0 || FM.lv > 0) return;
  const up = A.lvl - 1, good = FM.q ? up >= A.s0 && A.ft < 35.5 : A.ft < 13 || (up >= A.s0 && A.ft < 17.5);
  if (good) A.goodT += dtE; else { A.goodT = 0; return; }
  const f = A.fail.get(up) || 0; if (f >= 3) return;
  if (A.goodT >= 4 * Math.min(16, 2 ** f)) {
    const wasFloor = A.lvl === L.length - 1; A.lvl = up; A.steps++; logp();
    setDpr(L[A.lvl]); if (wasFloor && A.shadow0 > 1024) setShadowSize(A.shadow0);
    adaptReset(1.5);
  }
}

function fmSet(lv) {
  FM.lv = lv; FM.step = FM_STEP[lv]; FM.fk = lv >= 1 ? 0.8 : 1;
  const dk = lv >= 2 ? 0.75 : 1; if (dk !== FM.dk) { FM.dk = dk; OCC.x = 1e9; }
  const off = lv >= 3 && GFX.shadow > 0; if (off !== FM.shOff) { FM.shOff = off; sun.castShadow = !off; renderer.shadowMap.enabled = !off && GFX.shadow > 0; if (!off) bakeShadows(); }
}
function fmEval(fps, now) {
  const F = FM; F.fps = Math.round(fps * 10) / 10; if (!F.st) { if (F.lv) fmSet(0); return; }
  if (F.cool > 0) { F.cool--; F.slowN = 0; F.goodT = 0; return; }
  if (F.pre) { const p0 = F.pre; F.pre = 0; if (fps < p0 * 1.04 + 0.5 && F.lv > 0) { F.log.push([+now.toFixed(1), 'nohelp', F.lv, F.fps]); fmSet(F.lv - 1); F.hold = now + 120; F.cool = 2; return; } }
  if (fps < (F.q ? 27 : 50)) { F.slowN++; F.goodT = 0; } else F.slowN = 0;
  const A = ADAPT, dprDone = !GFX.adapt || A.lvl >= A.ladder.length - 1 || (A.capT && performance.now() < A.capT);
  if (F.slowN >= 2 && F.lv < (F.town ? 1 : GFX.shadow > 0 ? 3 : 2) && now >= F.hold && dprDone) {     if (now - F.upAt < 12) F.fail[F.lv] = Math.min(4, F.fail[F.lv] + 1);
    F.pre = fps; fmSet(F.lv + 1); F.cool = 3; F.slowN = 0; F.log.push([+now.toFixed(1), 'down', F.lv, F.fps]); if (F.log.length > 40) F.log.splice(0, 20); return; }
  if (F.lv > 0 && fps >= (F.q ? 29.5 : 57)) { F.goodT++; if (F.goodT >= (F.q ? 30 : 6) * 2 ** F.fail[F.lv - 1]) {     F.upAt = now; fmSet(F.lv - 1); F.cool = 3; F.goodT = 0; F.log.push([+now.toFixed(1), 'up', F.lv, F.fps]); if (F.log.length > 40) F.log.splice(0, 20); } } else F.goodT = 0;
}
function fmTick(ts) {
  const F = FM, raw = F.last ? ts - F.last : 0; F.last = ts; F.draws++;
  if (!F.on || !(raw > 0)) return;
  if (document.hidden || window.SM_HOLD3D > 0 || (ADAPT.hold && ADAPT.hold())) { F.bt = F.bn = 0; return; }
  if (building()) { F.bt = F.bn = 0; F.cool = Math.max(F.cool, 3); return; }
  if (raw > 250) { F.bt = F.bn = 0; return; }
  F.bt += raw; F.bn++; if (F.bt < 1000) return;
  const fps = F.bn * 1000 / F.bt; F.bt = F.bn = 0; const tw = document.body.classList.contains('h-town');
  if (tw !== F.town) { F.town = tw; const q0 = F.q; fmMode(); if (F.q !== q0) { F.cool = Math.max(F.cool, 2); F.pre = 0; adaptReset(2); F.log.push([+(ts / 1000).toFixed(1), 'mode', F.mode + (F.q ? '30' : '60')]); if (F.log.length > 40) F.log.splice(0, 20); return; } }
  if (F.q && !F.st) { F.fps = Math.round(fps * 10) / 10; return; }
  fmEval(fps, ts / 1000);
}
function fmView() {

  const F = FM, f = scene.fog; F.vOn = 0; if (!f || F.fk === 1) return;
  F.nb = f.near; F.fb = f.far; f.near = F.nb * F.fk; f.far = F.fb * F.fk; F.vOn = 1;
  if (F.town) return;
  F.cb = camera.far; const nf = Math.max(f.far + 10, F.cb * F.fk);
  if (nf !== F.cb) { camera.far = nf; camera.updateProjectionMatrix(); F.vOn |= 2; }
  skyDome.scale.setScalar(Math.min(1, nf * 0.95 / 290)); F.vOn |= 4;
}
function fmViewEnd() { const F = FM, v = F.vOn; if (!v) return; F.vOn = 0; const f = scene.fog; if (f) { f.near = F.nb; f.far = F.fb; } if (v & 2) { camera.far = F.cb; camera.updateProjectionMatrix(); } if (v & 4) skyDome.scale.setScalar(1); }
function fmApply() { const was = FM.mode; fmMode(); if (was === FM.mode) return;
  fmSet(0); FM.fail.fill(0); FM.hold = 0; FM.cool = 2; FM.pre = 0; FM.lt = 0; FM.bt = FM.bn = 0; adaptReset(1.5); FM.log.push([+(performance.now() / 1000).toFixed(1), 'mode', FM.mode]); }
addEventListener('sm-set', (e) => { const d = e && e.detail; if (d && d.gm != null && d.gm !== SET.gm) SET.gm = d.gm; fmApply(); });

const FMLK = { sv: null };
function fmLock(off) { if (off) { if (FMLK.sv || !FM.on) return false; FMLK.sv = { ad: GFX.adapt, dpr: GFX.dpr }; FM.on = false; GFX.adapt = false; fmApply(); return true; }
  const sv = FMLK.sv; if (!sv) return false; FMLK.sv = null; setDpr(sv.dpr); GFX.adapt = sv.ad; FM.on = true; fmApply(); adaptReset(2); return true; }

function prewarm() {
  if (NORENDER) return 0;
  const P9 = renderer.properties, tmp = new THREE.Scene(), mats = []; let k = 0;
  scene.traverse(o => { if (!(o.isMesh || o.isPoints) || !o.material || Array.isArray(o.material)) return; const m = o.material; if (P9.get(m).currentProgram) return; mats.push(m);
    let p; if (o.isInstancedMesh) { p = new THREE.InstancedMesh(o.geometry, m, 1); if (o.instanceColor) p.setColorAt(0, _pwC); } else p = o.isPoints ? new THREE.Points(o.geometry, m) : new THREE.Mesh(o.geometry, m);
    p.receiveShadow = o.receiveShadow; tmp.add(p); k++; });
  if (!k) return 0;
  const t0 = performance.now();

  const touch = () => { const t1 = performance.now(); while (mats.length && performance.now() - t1 < 4) { const pr = P9.get(mats.pop()).currentProgram; if (pr) { try { pr.getUniforms(); pr.getAttributes(); } catch (e) {   } } } if (mats.length) idle(touch, 400); };

  try { renderer.compile(tmp, camera, scene); } catch (e) { return 0; }
  TIMING.prewarm = (TIMING.prewarm || 0) + k; TIMING.prewarmMs = +(performance.now() - t0).toFixed(1); idle(touch, 400); return k;
}
const _pwC = new THREE.Color();

function idle(fn, timeout = 1500) { return window.requestIdleCallback ? requestIdleCallback(fn, { timeout }) : setTimeout(() => fn({ timeRemaining: () => 8, didTimeout: true }), 60); }

const clock = new THREE.Clock();
const fpsBox = document.getElementById('fps');
if (fpsBox && !/[?&]debug/.test(location.search)) fpsBox.style.display = 'none';
let acc = 0, n = 0, simMs = 0;

let NET = null;
const CTLK = { m: null, q: null, join: 0, init: false }, NETP = { x: 0, y: 0, z: 0, h: 0 };

let holdEl = null, holdT = 0;
function holdOn() { holdOff(); document.exitPointerLock?.(); CTRL.held = true; holdEl = document.createElement('div'); holdEl.id = 'mpHold';
  holdEl.style.cssText = 'position:fixed;inset:0;z-index:48;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.45);color:#fff;font:900 clamp(28px,6vw,56px)/1.3 "Apple SD Gothic Neo","Malgun Gothic",sans-serif;text-align:center;text-shadow:0 3px 0 rgba(0,0,0,.35);pointer-events:auto';
  holdEl.innerHTML = '<div>✋ 잠깐 멈춰요!<div style="font-size:.5em;font-weight:800;margin-top:10px">선생님 말씀을 들어요</div></div>'; document.body.appendChild(holdEl); holdT = setTimeout(() => holdOff(), 90000); }
function holdOff(say) { clearTimeout(holdT); if (holdEl) { holdEl.remove(); holdEl = null; if (say) toast('▶ 다시 움직여요!', 2); } CTRL.held = false; }

let chatUI = null, CF = null;
function chatOn(on) {
  if (!on) { if (chatUI) chatUI.root.remove(); chatUI = null; return; } if (chatUI) return;
  const root = document.createElement('div'); root.id = 'mpChat'; root.style.cssText = 'position:fixed;left:10px;bottom:46px;z-index:23;width:min(360px,70vw);pointer-events:none;font:14px/1.4 "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  root.innerHTML = '<div class="log" style="display:flex;flex-direction:column;gap:3px;max-height:40vh;overflow:hidden"></div>'
    + '<div class="bar" style="display:none;pointer-events:auto;margin-top:6px;background:rgba(29,53,87,.92);border-radius:12px;padding:6px">'
    + '<div class="qk" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px"></div>'
    + '<div style="display:flex;gap:4px"><input maxlength="40" placeholder="말하기 (Enter 보내기 · Esc 닫기)" style="flex:1;min-width:0;font:inherit;font-size:15px;border:0;border-radius:8px;padding:6px 8px"><button class="go" style="font:inherit;font-weight:800;border:0;border-radius:8px;padding:6px 10px;background:#ffd23c;color:#1d3557;cursor:pointer">보내기</button><button class="x" aria-label="닫기" title="닫기(Esc)" style="font:inherit;font-weight:800;border:0;border-radius:8px;min-width:44px;padding:6px 10px;background:#e8edf3;color:#1d3557;cursor:pointer">✕</button></div>'
    + '<div class="why" style="color:#ffe066;font-size:12px;min-height:0;margin-top:3px"></div></div>';
  document.body.appendChild(root);
  const btn = document.createElement('div'); btn.id = 'mpChatBtn'; btn.className = 'chip'; btn.textContent = '💬'; btn.title = '채팅(T)'; btn.style.cssText = 'left:60px;top:84px;cursor:pointer;padding:4px 9px;pointer-events:auto';
  document.body.appendChild(btn);
  const log = root.querySelector('.log'), bar = root.querySelector('.bar'), inp = bar.querySelector('input'), why = bar.querySelector('.why');
  for (const t of ['keydown', 'keyup', 'keypress']) bar.addEventListener(t, (e) => e.stopPropagation());
  const outside = (e) => { if (bar.style.display !== 'none' && !bar.contains(e.target) && !btn.contains(e.target)) close(); };
  addEventListener('pointerdown', outside, true);
  let fadeT = 0;
  const U = { root: { remove() { clearInterval(fadeT); root.remove(); btn.remove(); removeEventListener('pointerdown', outside, true); } }, open, close, add, last: 0, lastTx: '', lastT: 0, lines: [] };
  function line(m, sys) { const d = document.createElement('div'); d.style.cssText = 'align-self:flex-start;max-width:100%;padding:3px 9px;border-radius:9px;background:rgba(29,53,87,.78);color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.3);word-break:break-all;transition:opacity .8s';
    d.innerHTML = sys ? '<i style="opacity:.8">' + m + '</i>' : '<b style="color:#ffd23c">' + String(m.n || '친구').replace(/[<>&]/g, '') + '</b> ' + String(m.tx).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); d._t = performance.now(); return d; }
  function add(m, sys) { const d = line(m, sys); log.appendChild(d); while (log.children.length > 20) log.firstChild.remove(); fade(); }
  function fade() { const now = performance.now(), openNow = bar.style.display !== 'none'; [...log.children].forEach((d, i, arr) => { const recent = i >= arr.length - 6; d.style.display = openNow || recent ? '' : 'none'; d.style.opacity = openNow || now - d._t < 20000 ? '1' : '0'; }); }
  fadeT = setInterval(fade, 2000);
  function off() { return NET && NET.ctlData && NET.ctlData.chat && NET.ctlData.chat.off; }
  function open(kb) { if (!NET) return; document.exitPointerLock?.(); bar.style.display = ''; why.textContent = off() ? '🔇 선생님이 채팅을 껐어요' : ''; fade(); if (kb || !document.body.classList.contains('touch')) setTimeout(() => inp.focus(), 20); }
  function close() { bar.style.display = 'none'; inp.blur(); fade(); }
  async function send(tx) {
    if (!NET || !CF) return; if (off()) { why.textContent = '🔇 선생님이 채팅을 껐어요'; return; }
    const now = performance.now(); if (now - U.last < 1500) { why.textContent = '조금 천천히 보내요'; return; }
    const r = CF.checkChat(tx); if (!r.ok) { if (r.why) why.textContent = '🙅 ' + r.why; return; }
    if (r.text === U.lastTx && now - U.lastT < 10000) { why.textContent = '같은 말을 또 보냈어요'; return; }
    U.last = now; U.lastTx = r.text; U.lastT = now; why.textContent = '';
    const ok = await NET.say(r.text); if (!ok) why.textContent = '🙅 보낼 수 없는 말이에요'; else { inp.value = ''; }
  }
  bar.querySelector('.go').addEventListener('click', (e) => { e.stopPropagation(); send(inp.value); });
  bar.querySelector('.x').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(inp.value); } else if (e.key === 'Escape') { e.preventDefault(); close(); } });
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (bar.style.display === 'none') open(); else close(); });
  import('./chatfilter.js?v=1').then((M) => { CF = M; bar.querySelector('.qk').innerHTML = M.QUICK.map((q) => '<button style="font:inherit;font-size:13px;border:0;border-radius:8px;padding:3px 8px;background:#e8edf3;color:#1d3557;cursor:pointer">' + q + '</button>').join('');
    bar.querySelectorAll('.qk button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); send(b.textContent); })); });
  chatUI = U;
}
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyT' || e.repeat || !chatUI || !NET) return; const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
  if (document.body.classList.contains('title-on') || CTRL.frozen) return; e.preventDefault(); chatUI.open(true);
});

let emoEl = null, emoT = -1e9;
function doEmote(i) {
  const now = performance.now(); if (now - emoT < 1500) return false; emoT = now;
  if (!ACT.sit && !CTRL.pose && !(ACTS.cur && !/^emo|^five/.test(ACTS.cur))) ACTS.play('emo' + i);
  if (NET) NET.emote(i); return true;
}
function emoCombo(f, i, kd) {
  const mx = (P.x + f.x) / 2, mz = (P.z + f.z) / 2, my = Math.max(P.y, f.y) + 1.55, nm = String(f.label || '친구').slice(0, 8);
  if (kd === 'five') { if (!ACT.sit && !CTRL.pose) ACTS.play('five', { at: [f.x, f.y + 1.2, f.z] }); setTimeout(() => { ACTS.emit(26, mx, my, mz, 0, 1, 0, { speed: 1.7, spread: 1, life: 0.9, size: 0.035, g: 2.5, color: 0xffd23c }); tone(1320, 0, 0.07, 'square', 0.06); tone(1760, 0.07, 0.09, 'square', 0.05); }, 380); toast('🙌 ' + nm + ' 친구와 하이파이브!', 2.4); }
  else if (kd === 'dance') { if (!ACT.sit && !CTRL.pose) ACTS.play('emo9'); for (let k = 0; k < 6; k++) ACTS.note(mx + (Math.random() - 0.5), my - 0.3, mz + (Math.random() - 0.5)); toast('💃 ' + nm + ' 친구와 같이 춤!', 2.4); }
  else { ACTS.emit(16, mx, my, mz, 0, 0.8, 0, { speed: 0.7, spread: 0.8, life: 1, size: 0.03, g: -0.2, color: 0xff7aa2 }); toast(i === 6 ? '🙇 ' + nm + ' 친구와 서로 꾸벅!' : '💞 ' + nm + ' 친구와 마음이 통했어요', 2.4); }
}
function emoChip(on) {
  if (!on) { if (emoEl) { const bar = emoEl.querySelector('.emo-bar'); if (bar) bar.style.display = 'none'; emoEl.classList.remove('open'); } return; } if (emoEl) return;
  if (!document.getElementById('emo-css')) { const st = document.createElement('style'); st.id = 'emo-css'; st.textContent = '#mpEmo.open{z-index:44!important;align-items:flex-start!important}#mpEmo .emo-bar{flex-wrap:wrap;max-width:min(330px,calc(100vw - 70px))}#mpEmo .emo-bar span{font-size:22px;padding:2px 4px;cursor:pointer;border-radius:8px}#mpEmo .emo-bar span:hover{background:rgba(255,255,255,.18)}body.touch #mpEmo .emo-bar span{min-width:40px;min-height:40px;display:inline-flex;align-items:center;justify-content:center}'; document.head.appendChild(st); }
  emoEl = document.createElement('div'); emoEl.id = 'mpEmo'; emoEl.className = 'chip'; emoEl.title = '몸짓·이모지(친구 방에 있으면 친구에게도 보여요)'; emoEl.style.cssText = 'left:10px;top:84px;cursor:pointer;display:flex;gap:2px;align-items:center;padding:4px 6px;pointer-events:auto';
  emoEl.innerHTML = '<span data-e="t" style="padding:2px 6px">😀</span><span class="emo-bar" style="display:none;gap:2px"></span>';
  import('./net.js?v=15').then((M) => { const bar = emoEl && emoEl.querySelector('.emo-bar'); if (!bar) return; bar.innerHTML = M.EMOTES.map((x, i) => '<span data-e="' + i + '" title="' + M.EMOTE_T[i] + '" role="button" aria-label="' + M.EMOTE_T[i] + '">' + x + '</span>').join(''); });
  emoEl.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-e]'); if (!b) return; const bar = emoEl.querySelector('.emo-bar');
    if (b.dataset.e === 't') { const op = bar.style.display === 'none'; bar.style.display = op ? 'flex' : 'none'; emoEl.classList.toggle('open', op); return; } if (doEmote(+b.dataset.e)) { bar.style.display = 'none'; emoEl.classList.remove('open'); } });
  document.body.appendChild(emoEl);
}
if (!window.SM_PROMO && !/[?&](check|health)=1/.test(location.search) && !new URLSearchParams(location.search).get('shot')) emoChip(true);
if (!window.SM_PROMO && new URLSearchParams(location.search).get('mp') !== '0' && !/[?&](check|health)=1/.test(location.search) && !new URLSearchParams(location.search).get('shot')) {
  const chip = document.createElement('div'); chip.id = 'mpChip'; chip.className = 'chip'; document.body.appendChild(chip);
  Promise.all([import('./net.js?v=15'), import('./lobby.js?v=20')]).then(([N, L]) => {

    const ROOMS = [null];
    let ROOMG = 0, ROOMRUN = false, roomT = 0, PENDG = null, holdTk = null, holdTkT = 0, OWNERID = null, LASTRES = null, goT = 0, endT = 0, WR = null, wrT = 0, wrMin = false, ownerPlay = null, READY = false;
    const actKey = (s) => String(s || '').replace(/^\S+\s+/, '');
    const rgName = () => (ROOMS[ROOMG] ? ROOMS[ROOMG].t.replace(/\s*\(.*?\)/, '') : null);
    const LOBBY = L.createLobby({ chip, net: () => NET, toast: (m, t) => toast(m, t),
      rooms: window.SM_LESSON ? null : { list: () => ROOMS.map((q, i) => q && { i, t: q.t }).filter(Boolean), cur: () => ROOMG, inIt: () => { const g = MAP.game.current; return !!(g && ROOMS[ROOMG] && g.id === ROOMS[ROOMG].id); },
        count: (i) => inGame(i), pick: (i, q) => roomPick(i, q), start: (q) => roomStart(q), end: (q) => roomEnd(q), join: () => roomLaunch(ROOMS[ROOMG] && ROOMS[ROOMG].id), panel: () => wrShow(true), run: () => (ROOMRUN ? ROOMG : 0) },
      join: (room) => { CTLK.join = Date.now(); CTLK.init = false; CTLK.m = CTLK.q = null; NET = N.createNet({ THREE, scene, room, kind: 'kid', onCombo: emoCombo, onChange: () => LOBBY.draw(), onDenied: () => LOBBY.recheck(), onCtl, onChat: (m) => { if (chatUI) { if (m) chatUI.add(m); else chatUI.add('🧹 선생님이 채팅을 지웠어요', true); } } }); emoChip(true); chatOn(true); document.body.classList.add('mp-in'); if (!MAP.game.current && !MAP.minimap.visible) MAP.minimap.show(); },
      leave: () => { if (NET) NET.leave(); NET = null; emoChip(false); chatOn(false); document.body.classList.remove('mp-in'); MAP.minimap.setPeers([]); holdOff(); holdChip(false); PENDG = null; },
      onGoTo: (p) => {
        if (!p) return; const g = MAP.game.current; if (g && /^watergun/.test(g.id) && g.handle && (g.handle.state === 'play' || g.handle.state === 'count')) return toast('경기 중에는 갈 수 없어요', 2);
        const y = p.y, a = Math.random() * Math.PI * 2, e = MAP.findEntry(p.x + Math.cos(a) * 1.6, p.z + Math.sin(a) * 1.6, y, null, 4) || MAP.findEntry(p.x, p.z, y, null, 6);
        if (!e) return toast('그 친구 곁으로 갈 길을 못 찾았어요', 2); MAP.hostTeleport([e.x, e.y, e.z]); toast('👋 ' + p.label + ' 곁으로 왔어요!', 2.5);
      },
      onTeacher: (k, extra, quiet) => {
        if (!NET) return; const n = NET.name;
        NET.ctl('cmd', { q: Date.now(), k, x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), by: NET.id, n: n.slice(0, 8), d: ROOMG + (ROOMRUN ? 100 : 0), ...(extra || {}) });
        if (!quiet && (k === 'go' || k === 'end')) toast(k === 'go' ? '▶ 모두 같이 들어가요!' : '🏠 모두 대기실로', 2.5);
        else if (!quiet) toast(k === 'gather' ? '📣 모두를 불렀어요' : k === 'hold' ? '✋ 모두 멈춤 — ▶ 다시 움직여요로 풀어요' : k === 'game' ? (ROOMS[ROOMG] ? '🎮 방 친구 모두 「' + ROOMS[ROOMG].t + '」 대기실로! — 다 모이면 ▶ 모두 시작' : '⏹ 방 놀이를 마쳤어요 — 모두 자유롭게') : k === 'gstart' ? '▶ 시작 신호를 보냈어요' : '▶ 다시 움직여요', 2.8);
        if (k === 'hold') holdChip(true); else if (k === 'release' || k === 'gather') holdChip(false);
      } });

    const WRG = { watergun_vs: { i: '💦', c: ['#2f80ed', '#56ccf2'], r: '청팀 vs 백팀 — 물총으로 상대 팀을 흠뻑 적셔요', m: '4분 · 둘로 나눠 팀 대결' },
      hideseek_vs: { i: '🙈', c: ['#f2994a', '#f2c94c'], r: '도망자 1명 vs 나머지 모두 술래', m: '한 판 1분 · 모두 한 번씩 도망자' },
      robots_vs: { i: '🤖', c: ['#6c5ce7', '#a29bfe'], r: '반장 1명이 로봇 무리 속 스파이 친구를 찾아요', m: '한 판 1분 · 모두 한 번씩 반장' },
      guide_vs: { i: '🧭', c: ['#219653', '#6fcf97'], r: '둘씩 한 팀 — 지도를 보고 길을 알려 줘요', m: '한 판 1분 · 팀 안에서 역할 바꾸기' } };
    const map9tone = (on) => { try { tone(on ? 880 : 520, 0, 0.12, 'sine', 0.08); if (on) tone(1320, 0.1, 0.16, 'sine', 0.07); } catch (e) {   } };
    const hexOf = (c) => (typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#4dabf7');
    const avSvg = (hex, k) => { const L9 = parseLook(k), lc = L9 && lookColors(L9), cs = (h) => '#' + h.toString(16).padStart(6, '0'), top = lc ? cs(lc.top) : hex, cap = lc ? cs(lc.cap) : hex, skin = lc ? cs(lc.skin) : '#f5cfa6';
      return '<svg class="av" viewBox="0 0 64 64" aria-hidden="true"><path d="M9 64q0-17 23-17t23 17z" fill="' + top + '"/><circle cx="32" cy="31" r="16" fill="' + skin + '"/><path d="M15 28a17 15 0 0 1 34 0z" fill="' + cap + '"/><rect x="30" y="24.5" width="22" height="5" rx="2.5" fill="' + cap + '"/><circle cx="26" cy="33" r="2.4" fill="#1d1530"/><circle cx="38" cy="33" r="2.4" fill="#1d1530"/><path d="M27 39.5q5 4 10 0" stroke="#1d1530" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="21.5" cy="37.5" r="2.6" fill="#ff8f8f" opacity=".5"/><circle cx="42.5" cy="37.5" r="2.6" fill="#ff8f8f" opacity=".5"/></svg>'; };
    function wrCss() { if (document.getElementById('wr-css')) return; const st = document.createElement('style'); st.id = 'wr-css'; st.textContent = `
#mpWR{position:fixed;inset:0;z-index:45;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:radial-gradient(circle at 70% 20%,#2b5aa6,#152b55 70%);color:#1d3557;font:15px/1.4 "Apple SD Gothic Neo","Malgun Gothic",sans-serif;-webkit-text-size-adjust:100%}
#mpWR button{font:inherit;cursor:pointer}
#mpWR .top{display:flex;align-items:center;gap:10px;color:#fff;flex-wrap:wrap;flex:none}
#mpWR .top .rn{font-weight:900;font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}
#mpWR .top .cd{background:#ffd23c;color:#1d3557;border-radius:8px;padding:2px 10px;font-weight:900;font-size:16px;letter-spacing:1px}
#mpWR .top .ct{font-weight:800;opacity:.9}#mpWR .top .gap{flex:1}
#mpWR .top button{font-weight:800;border:0;border-radius:10px;padding:6px 12px;min-height:44px;background:rgba(255,255,255,.16);color:#fff}
#mpWR .top button.out{background:#e85d5d}
#mpWR .bd{flex:1;min-height:0;display:flex;gap:12px}
#mpWR .side{width:224px;flex:none;display:flex;flex-direction:column;gap:8px;background:#eaf1fc;border-radius:16px;padding:10px;overflow:auto;box-shadow:inset 0 0 0 3px #c2d3ee}
#mpWR .big{font-weight:900;font-size:26px;border:0;border-radius:14px;padding:12px 8px;min-height:66px;color:#fff;background:linear-gradient(180deg,#3d7cf0,#1d4fb8);box-shadow:0 4px 0 #143a87;letter-spacing:1px}
#mpWR .big.rd{background:linear-gradient(180deg,#ffae5c,#f07b1a);box-shadow:0 4px 0 #b85a0e}
#mpWR .big.ok{background:linear-gradient(180deg,#46d27a,#24a352);box-shadow:0 4px 0 #1b7a3c;font-style:italic}
#mpWR .big:disabled{filter:grayscale(.75);opacity:.55;cursor:default}
#mpWR .big:not(:disabled):active{transform:translateY(3px);box-shadow:0 1px 0 #143a87}
#mpWR .hint{font-size:13px;color:#2f4d7a;font-weight:800;text-align:center;line-height:1.35}
#mpWR .sh{font-size:13px;font-weight:900;color:#5a6b80;margin-top:4px}
#mpWR .gl{display:flex;flex-direction:column;gap:6px}
#mpWR .gl button{font-weight:800;text-align:left;border:2px solid #c9d8f0;background:#fff;color:#1d3557;border-radius:12px;padding:7px 10px;min-height:44px}
#mpWR .gl button.on{border-color:#1d3557;background:#fff3bf;box-shadow:0 0 0 2px #ffd23c}
#mpWR .gl button:disabled{cursor:default}#mpWR .gl button:disabled:not(.on){opacity:.5}
#mpWR .sb{font-weight:800;border:0;border-radius:10px;padding:7px 10px;min-height:44px;background:#d6e2f5;color:#1d3557}
#mpWR .side .fill{flex:1}
#mpWR .main{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;min-height:0}
#mpWR .slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:10px;flex:1;min-height:0}
#mpWR .sl{position:relative;background:linear-gradient(180deg,#f8fbff,#d7e4f7);border:3px solid #b9cbe6;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 4px 30px;min-height:0;overflow:hidden;box-sizing:border-box}
#mpWR .sl .av{width:auto;height:min(92px,58%);max-width:80%;flex:none}
#mpWR .sl .nm{font-weight:900;font-size:17px;max-width:94%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#mpWR .sl .st{position:absolute;left:0;right:0;bottom:5px;text-align:center;font-size:13px;font-weight:800;color:#5a6b80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px}
#mpWR .sl.me{border-color:#ffd23c;box-shadow:inset 0 0 0 2px #ffd23c}
#mpWR .sl .tg{position:absolute;left:6px;top:6px;background:#ffd23c;color:#1d3557;font-weight:900;font-size:13px;border-radius:7px;padding:1px 7px;box-shadow:0 2px 0 #c99a12}
#mpWR .sl .tg.me{left:auto;right:6px;background:#1d3557;color:#fff;box-shadow:none}
#mpWR .sl.rdy{border-color:#2f9e44}
#mpWR .sl.rdy .st{color:#fff;font-size:21px;font-style:italic;font-weight:900;letter-spacing:2px;bottom:2px;text-shadow:0 2px 0 #1b7a3c,0 0 6px #1b7a3c,0 0 2px #1b7a3c}
#mpWR .sl.ing .st{color:#2b5a96}
#mpWR .sl.away{opacity:.55}
#mpWR .sl.empty{background:rgba(255,255,255,.08);border:3px dashed rgba(255,255,255,.3);color:rgba(255,255,255,.55);font-weight:800;padding:8px 4px}
#mpWR .sl .mini{position:absolute;right:6px;top:30px;border:0;border-radius:8px;padding:3px 7px;min-height:30px;font-size:12px;font-weight:800;background:#1d3557;color:#fff}
#mpWR .sum{color:#fff;font-weight:800;font-size:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:none}
#mpWR .sum .rd9{background:#2f9e44;border-radius:8px;padding:1px 8px}#mpWR .sum .gn{display:none;background:#ffd23c;color:#1d3557;border-radius:8px;padding:1px 8px}body.small #mpWR .sum .gn{display:inline}
#mpWR .sum button{border:0;border-radius:10px;padding:5px 10px;min-height:40px;font-weight:800;background:#ffd23c;color:#1d3557}
#mpWR .low{display:flex;gap:10px;flex:none;min-height:0}
#mpWR .card{flex:1.25;min-width:0;border-radius:16px;padding:12px 16px;color:#fff;background:linear-gradient(135deg,var(--c1),var(--c2));box-shadow:inset 0 0 0 3px rgba(255,255,255,.35),0 4px 0 rgba(0,0,0,.25);display:flex;gap:14px;align-items:center}
#mpWR .card .ic{font-size:56px;line-height:1;flex:none}
#mpWR .card b{display:block;font-size:24px;line-height:1.2;text-shadow:0 2px 0 rgba(0,0,0,.25)}
#mpWR .card .r{font-size:15px;font-weight:800}#mpWR .card .m{font-size:13px;font-weight:700;opacity:.95}
#mpWR .card.none{background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 3px rgba(255,255,255,.25);font-weight:800;font-size:17px}
#mpWR .last{flex:1;min-width:0;max-height:170px;overflow:auto;border-radius:16px;padding:9px 12px;background:#fff8dc;border:2px solid #f2d27a;font-size:13px}
#mpWR .last .rk-lb{margin:0;padding:0;border:0;background:none}
body.wr-on #mpChat{z-index:46}
body.wr-on.small #mpChat{display:none}
@media (max-height:620px){#mpWR .big{font-size:22px;min-height:54px;padding:8px}#mpWR .card .ic{font-size:40px}#mpWR .card b{font-size:20px}#mpWR .last{max-height:120px}#mpWR .sl .nm{font-size:15px}}
body.small #mpWR{gap:6px;padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
body.small #mpWR .top .rn{font-size:16px}body.small #mpWR .top .cd{font-size:14px}body.small #mpWR .top button{min-height:40px;padding:4px 10px;font-size:13px}
body.small #mpWR .bd{gap:8px}
body.small #mpWR .side{width:150px;padding:7px;gap:6px}
body.small #mpWR .big{font-size:18px;min-height:46px;padding:6px}
body.small #mpWR .hint{font-size:12px}
body.small #mpWR .gl{display:grid;grid-template-columns:1fr 1fr;gap:5px}body.small #mpWR .gl button{font-size:13px;padding:4px;min-height:44px;text-align:center}
body.small #mpWR .gl button .gt{display:none}body.small #mpWR .sb{font-size:12px;min-height:40px;padding:4px}
body.small #mpWR .slots{gap:6px}body.small #mpWR .sl{padding:4px 2px 20px;border-width:2px}body.small #mpWR .sl .av{height:min(52px,52%)}
body.small #mpWR .sl .nm{font-size:13px}body.small #mpWR .sl .st{font-size:12px;bottom:2px}body.small #mpWR .sl.rdy .st{font-size:15px}
body.small #mpWR .sl .tg{font-size:12px;left:3px;top:3px;padding:0 4px}body.small #mpWR .sl .tg.me{left:auto;right:3px}body.small #mpWR .sl .mini{top:22px;right:3px;min-height:26px}
body.small #mpWR .sum{font-size:13px}body.small #mpWR .low{display:none}
@media (orientation:portrait){body.small #mpWR .bd{flex-direction:column}body.small #mpWR .side{width:auto;flex:none;display:grid;grid-template-columns:1fr 1fr;align-items:start}
  body.small #mpWR .side .big,body.small #mpWR .side .hint{grid-column:1/-1}body.small #mpWR .side .sh,body.small #mpWR .side .fill{display:none}body.small #mpWR .gl{grid-column:1/-1;grid-template-columns:repeat(4,1fr)}
  body.small #mpWR .slots{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr))}body.small #mpWR .top .rn{max-width:60vw}}
`; document.head.appendChild(st); }
    function wrShow(on) { clearInterval(wrT); if (!on || !NET || !LOBBY.room || window.SM_LESSON) { if (WR) { WR.remove(); WR = null; } document.body.classList.remove('wr-on'); return; } const g = MAP.game.current;
      if (g && ROOMS.some(q => q && q.id === g.id)) return;
      wrCss(); if (!WR) { WR = document.createElement('div'); WR.id = 'mpWR'; WR.className = 'ttl-keep'; document.body.appendChild(WR); for (const t of ['keydown', 'keyup']) WR.addEventListener(t, (e) => e.stopPropagation()); WR.addEventListener('click', wrClick); document.exitPointerLock?.(); }
      document.body.classList.add('wr-on'); wrDraw(); wrT = setInterval(wrDraw, 1000); }
    function setReady(v) { READY = !!v; if (NET) NET.setAct(actNow()); wrDraw(); }
    const isRdy = (p) => actKey(p.act) === actKey(RDY), isWatch = (p) => actKey(p.act) === actKey(WATCH),
      inLobby = (p) => isRdy(p) || isWatch(p) || /자유 탐험/.test(p.act || '') || !p.act || (!ROOMRUN && ROOMS.some(q => q && actKey(p.act) === actKey(ACTS[q.id])));
    let wrAnn = null;
    function wrDraw() { if (!WR || !NET || !LOBBY.room) return; const Rm = LOBBY.room, own = !!Rm.k, Rg = ROOMS[ROOMG], G = Rg && WRG[Rg.id], ros = NET.roster(), esc9 = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      if (own && !ROOMRUN && OWNERID !== NET.id && wrAnn !== Rm.c && Date.now() - (CTLK.join || 0) > 2500) { wrAnn = Rm.c; LOBBY.teacher('game', null, true); }
      const run = !!(ROOMRUN && Rg), gName = (q) => q.t.replace(/^\S+\s+/, '').replace(/\s*\(.*?\)/, '');
      const meP = { id: NET.id, label: NET.name, act: actNow(), color: hexOf(NET.color), k: NET.kindCode, me: true }, all = [meP].concat(ros.map(p => ({ ...p, color: hexOf(p.color) })));
      const host = all.find(p => p.id === (own ? NET.id : OWNERID)) || null, hostWatch = !!host && (host.me ? !meIn() : isWatch(host));
      const rest = all.filter(p => p !== host), order = (host && !hostWatch ? [host] : []).concat(rest.filter(p => p.me), rest.filter(p => !p.me));
      const need = all.filter(p => p !== host && (p.me || (inLobby(p) && !isWatch(p)))), rdN = need.filter(p => (p.me ? READY : isRdy(p))).length, allRdy = rdN >= need.length;
      let playN = 0;
      const slot = (p) => { const isH = p === host, inG = run && (p.me ? false : actKey(p.act) === actKey(ACTS[Rg.id])), away = run ? !inG : !p.me && !inLobby(p), rdy = !run && !isH && (p.me ? READY : isRdy(p));
        if (!away) playN++;
        const st = run ? (inG ? '🎮 경기 중' : p.me ? '대기실' : '📍 ' + (p.act || '다른 곳')) : isH ? '' : rdy ? 'READY' : away ? '📍 ' + (p.act || '다른 곳') : '준비 중…';
        return '<div class="sl' + (p.me ? ' me' : '') + (rdy ? ' rdy' : '') + (inG ? ' ing' : '') + (away ? ' away' : '') + '">' + (isH ? '<span class="tg">👑 방장</span>' : '') + (p.me ? '<span class="tg me">나</span>' : '')
          + (p.me && isH && !run ? '<button class="mini" data-w="watch" title="이번 놀이는 구경만 해요">👀 구경만</button>' : '')
          + avSvg(p.color, p.k) + '<div class="nm">' + esc9(p.label) + '</div><div class="st">' + esc9(st) + '</div></div>'; };
      const cells = order.slice(0, 8).map(slot); while (cells.length < 8) cells.push('<div class="sl empty">빈 자리</div>');
      const more = order.length > 8 ? ' · 자리가 꽉 차서 ' + (order.length - 8) + '명은 구경' : '';
      const side = (run
          ? '<button class="big ok" data-w="join">▶ 같이 하기</button><div class="hint">🎮 지금 「' + esc9(gName(Rg)) + '」 하는 중</div>' + (own ? '<button class="sb" data-w="end">⏹ 모두 대기실로</button>' : '')
          : own ? '<button class="big" data-w="go"' + (Rg && (allRdy || LOBBY.teacherRoom) ? '' : ' disabled') + '>▶ 시작</button><div class="hint">' + (!Rg ? '먼저 아래에서 놀이를 골라요' : !allRdy && !LOBBY.teacherRoom ? '친구들이 모두 READY를 누르면 시작할 수 있어요 (' + rdN + '/' + need.length + ')' : '누르면 모두 같이 들어가요') + '</div>'
          : '<button class="big ' + (READY ? 'ok' : 'rd') + '" data-w="ready">' + (READY ? 'READY ✓' : '준비하기') + '</button><div class="hint">' + (!Rg ? '방장이 놀이를 고르는 중이에요' : READY ? '방장이 ▶ 시작하면 같이 들어가요 (다시 누르면 취소)' : '준비되면 눌러요') + '</div>')
        + '<div class="sh">🎮 놀이' + (own ? ' 고르기' : ' (방장이 골라요)') + '</div><div class="gl">' + ROOMS.map((q, i) => q && '<button data-g="' + i + '"' + (i === ROOMG ? ' class="on"' : '') + (own ? '' : ' disabled') + '>' + q.t.split(' ')[0] + '<span class="gt"> ' + esc9(gName(q)) + '</span></button>').filter(Boolean).join('') + '</div>'
        + '<div class="fill"></div><button class="sb" data-w="min">🚶 학교 둘러보며 기다리기</button>' + (chatUI ? '<button class="sb" data-w="chat">💬 채팅</button>' : '');
      const sum = '<div class="sum">' + (Rg ? '<span class="gn">' + Rg.t.split(' ')[0] + ' ' + esc9(gName(Rg)) + '</span>' : '') + '<span>🎮 함께 하는 사람 ' + playN + '명 ' + (host ? (hostWatch ? '(방장은 구경)' : '(방장 포함)') : '') + '</span>' + (!run && need.length ? '<span class="rd9">READY ' + rdN + '/' + need.length + '</span>' : '') + esc9(more)
        + (hostWatch ? '<span>👀 구경석: 👑 ' + esc9(host.label) + (host.me ? '(나)' : '') + '</span>' + (host.me && !run ? '<button data-w="play1">🎮 나도 같이 하기</button>' : '') : '') + '</div>';
      const card = G ? '<div class="card" style="--c1:' + G.c[0] + ';--c2:' + G.c[1] + '"><div class="ic">' + G.i + '</div><div><b>' + esc9(gName(Rg)) + '</b><div class="r">' + esc9(G.r) + '</div><div class="m">' + esc9(G.m) + '</div></div></div>'
        : '<div class="card none">' + (own ? '👈 왼쪽에서 함께 할 놀이를 골라요' : '⏳ 방장이 놀이를 고르는 중이에요') + '</div>';
      const L9 = LASTRES && Date.now() - LASTRES.at < 15 * 60e3 ? '<div class="last"><b>🏁 지난 경기 — ' + esc9(LASTRES.t || '') + '</b>' + (LASTRES.html || '') + '</div>' : '';
      const h = '<div class="top"><span class="rn">🏠 ' + esc9(Rm.n) + '</span><span class="cd">' + Rm.c + '</span><span class="ct">👥 ' + all.length + '명</span><span class="gap"></span>'
        + (own ? '<button data-w="big">📺 방 번호 크게</button>' : '') + '<button class="out" data-w="out">🚪 방 나가기</button></div>'
        + '<div class="bd"><div class="side">' + side + '</div><div class="main"><div class="slots">' + cells.join('') + '</div>' + sum + '<div class="low">' + card + L9 + '</div></div></div>';
      if (WR.dataset.h !== h) { WR.dataset.h = h; WR.innerHTML = h; } }
    function wrClick(e) { e.stopPropagation(); const t = e.target.closest('[data-g],[data-w]'); if (!t || t.disabled) return;
      if (t.dataset.g) { roomPick(+t.dataset.g); map9tone(true); return; }
      const w = t.dataset.w; if (w === 'ready') { setReady(!READY); map9tone(READY); return; } if (w === 'go') roomStart(); else if (w === 'end') roomEnd(); else if (w === 'join') { wrShow(false); roomLaunch(ROOMS[ROOMG] && ROOMS[ROOMG].id); }
      else if (w === 'watch' || w === 'play1') { ownerPlay = w === 'play1'; if (NET) NET.setAct(actNow()); wrDraw(); } else if (w === 'chat') { if (chatUI) chatUI.open(true); }
      else if (w === 'min') { wrShow(false); toast('👥 칩 → 🏠 대기실로 다시 열어요', 2.5); } else if (w === 'big') LOBBY.showBig && LOBBY.showBig(); else if (w === 'out') { wrShow(false); LOBBY.leave(); } }
    function holdChip(on) { clearTimeout(holdTkT); if (holdTk) { holdTk.remove(); holdTk = null; } if (!on) return;
      holdTk = document.createElement('div'); holdTk.id = 'mpHoldT'; holdTk.className = 'chip ttl-keep';
      holdTk.style.cssText = 'left:50%;top:96px;transform:translateX(-50%);z-index:44;min-height:44px;display:flex;align-items:center;box-sizing:border-box;background:#ffd23c;color:#1d3557;font-weight:800;font-size:15px;padding:8px 14px;cursor:pointer;pointer-events:auto;white-space:nowrap';
      holdTk.textContent = '✋ 모두 멈춤 중 — 눌러서 ▶ 다시 움직여요'; holdTk.title = '방 친구들이 다시 움직일 수 있어요';
      holdTk.addEventListener('click', (e) => { e.stopPropagation(); LOBBY.teacher('release'); });
      document.body.appendChild(holdTk); holdTkT = setTimeout(() => holdChip(false), 90000); }
    window.SM_MP = { room: () => LOBBY.room ? 'c' + LOBBY.room.c : null, net: () => NET, info: () => LOBBY.room, open: (a) => LOBBY.open(a),
      lead: () => !!(LOBBY.room && LOBBY.room.k && NET), gather: (extra) => { if (LOBBY.room && LOBBY.room.k && NET) LOBBY.teacher('gather', extra, true); },
      roomGame: () => (ROOMS[ROOMG] ? ROOMS[ROOMG].id : null), pickGame: (i) => roomPick(i), startAll: () => roomStart(),
      roomRun: () => (ROOMRUN && ROOMS[ROOMG] ? ROOMS[ROOMG].id : null), isOwner: () => !!(LOBBY.room && LOBBY.room.k), setLast: (r) => { LASTRES = r ? { ...r, at: Date.now() } : null; }, waiting: () => wrShow(true), endAll: () => roomEnd(),

      joinGame: () => roomLaunch(ROOMS[ROOMG] && ROOMS[ROOMG].id), roomName: rgName, roomList: () => ROOMS.filter(Boolean).map(q => ({ id: q.id, t: q.t.replace(/\s*\(.*?\)/, '') })),
      confirmLeave: (fn) => { const g = MAP.game.current; if (g && ROOMS[ROOMG] && g.id === ROOMS[ROOMG].id && !(LOBBY.room && LOBBY.room.k)) LOBBY.ask('방 놀이에서 나갈까요?', '🚪 나가기', '▶ 계속하기', fn, '나가도 👥 단추의 「▶ 같이 하기」로 다시 들어올 수 있어요'); else fn(); } };
    setInterval(() => LOBBY.draw(), 2000);
    MAP.on('gamestart', () => LOBBY.draw());
    MAP.on('gamestop', (ev) => { LOBBY.draw(); if (NET && ev && ev.id && ROOMS.some(q => q && q.id === ev.id) && !(ev.reason === 'replace')) setTimeout(() => wrShow(true), 300); const p = PENDG; PENDG = null; if (!p || (ev && ev.reason === 'replace') || Date.now() - p.t > 180000 || (TITLE && TITLE.phase !== 'off')) return; gatherTo(p.c, '📣 선생님 곁으로 왔어요!'); });
    setInterval(() => { if (NET) MAP.minimap.setPeers(NET.peers()); }, 500);
    const ACTS = { town: '🏘 마을', watergun: '💧 물총', watergun_vs: '💦 물총 대결', hideseek: '🙈 숨바꼭질 연습', hideseek_vs: '🙈 숨바꼭질', robots: '🤖 로봇인 척 연습', robots_vs: '🤖 로봇인 척', guide: '🧭 길잡이 연습', guide_vs: '🧭 길잡이', memo: '📝 메모장', memo_v3: '📝 메모장', story: '📖 이야기', newbook: '📖 신상책', robotpart: '📖 로봇 부품 소동', cricket: '📖 곤충 재판', world_bee: '🐝 꿀벌 세계', world_fruit: '🍒 과일 세계', world_animal: '🐾 동물 세계', escape: '🔐 방탈출', shrink: '🐜 개미', find_place: '📍 장소 찾기', tour: '🚌 견학' };
    const RDY = '✅ 준비 완료', WATCH = '👀 진행(구경)', actNow = () => { const g = MAP.game.current; return window.SM_ACT || (g ? ACTS[g.id] || '🎮 놀이' : READY && LOBBY.room ? RDY : LOBBY.room && LOBBY.room.k && !meIn() ? WATCH : '🏫 자유 탐험'); };
    setInterval(() => { if (!NET) return; NET.setAct(actNow()); }, 2000);

    function onCtl(C) {
      const first = !CTLK.init; CTLK.init = true;
      const m = C.match; if (m) { const k = m.seq + ':' + m.st; if (k !== CTLK.m) { CTLK.m = k; if (m.st === 'end' && !first && ROOMRUN && LOBBY.room && LOBBY.room.k) { clearTimeout(endT); endT = setTimeout(() => { if (ROOMRUN) roomEnd(true); }, 2000); }
 if ((m.st === 'lobby' || m.st === 'count' || m.st === 'hlobby' || m.st === 'hcount' || m.st === 'rlobby' || m.st === 'rcount' || m.st === 'globby' || m.st === 'gcount') && !first) invite(m); } }
      const c = C.cmd; if (c && c.q !== CTLK.q) { CTLK.q = c.q; if (c.by) OWNERID = c.by; roomSync(c, first); if (!first && c.by !== (NET && NET.id)) teacherCmd(c); wrDraw(); }
    }

    function roomSync(c, first) {
      if (typeof c.d !== 'number') return; const R9 = LOBBY.room, born = R9 && R9.e ? R9.e - 8 * 3600e3 - 120e3 : 0;
      if (c.q < born) return;
      ROOMG = ROOMS[c.d % 100] ? c.d % 100 : 0; ROOMRUN = !!ROOMG && c.d >= 100;
      if (first && !(R9 && R9.k)) { const g = MAP.game.current; if (ROOMRUN && !(g && g.id === ROOMS[ROOMG].id)) { toast('🎮 지금 방 놀이: ' + ROOMS[ROOMG].t + ' — 같이 들어가요!', 3); clearTimeout(roomT); roomT = setTimeout(() => roomLaunch(ROOMS[ROOMG] && ROOMS[ROOMG].id), 1500); } else if (!ROOMRUN) wrShow(true); }
    }
    function roomPick(i, q) { if (!LOBBY.room || !LOBBY.room.k || !NET) return; if (ROOMRUN) roomEnd(true); ROOMG = ROOMS[i] ? i : 0; LOBBY.teacher('game', null, true); wrDraw(); }

    function roomStart(q) { const R9 = ROOMS[ROOMG]; if (!R9 || !NET || !(LOBBY.room && LOBBY.room.k)) return; ROOMRUN = true; LASTRES = null; READY = false; LOBBY.teacher('go', null, q); wrShow(false); if (meIn()) roomLaunch(R9.id);
      clearInterval(goT); const t0 = Date.now(); let ok = 0;
      goT = setInterval(() => { if (!ROOMRUN || ROOMS[ROOMG] !== R9) { clearInterval(goT); return; } const total = NET.roster().length + (meIn() ? 1 : 0), n = inGame(ROOMG) + (meIn() && MAP.game.current && MAP.game.current.id === R9.id ? 1 : 0);
        if (n >= total) ok++; else ok = 0; if (ok >= 3 || Date.now() - t0 > 14000) { clearInterval(goT); const g = MAP.game.current; if (g && g.id === R9.id && g.handle && g.handle.netStart) g.handle.netStart(); LOBBY.teacher('gstart', null, true); } }, 500); }
    function roomEnd(q) { if (!(LOBBY.room && LOBBY.room.k) || !NET) return; clearInterval(goT); ROOMRUN = false; LOBBY.teacher('end', null, q); const g = MAP.game.current; if (g && ROOMS[ROOMG] && g.id === ROOMS[ROOMG].id && !gameEnding(g)) MAP.game.stop(); wrShow(true); }
    const meIn = () => (ownerPlay != null ? ownerPlay : !LOBBY.teacherRoom);
    const inGame = (i) => (NET && ROOMS[i] ? NET.roster().filter(p => actKey(p.act) === actKey(ACTS[ROOMS[i].id])).length : 0);
    const gameEnding = (g) => { const n9 = g && g.handle && g.handle.net; return !!(n9 && n9.st === 'end'); };
    function roomGo() {
      const R9 = ROOMS[ROOMG], g = MAP.game.current; clearTimeout(roomT); wrShow(false); READY = false;
      if (!R9) { if (g && ROOMS.some(q => q && q.id === g.id)) { MAP.game.stop(); toast('🏫 선생님이 놀이를 마쳤어요 — 자유롭게 다녀요', 3); } return; }
      if (g && g.id === R9.id) return;
      toast('▶ ' + R9.t.replace(/\s*\(.*?\)/, '') + ' — 같이 들어가요!', 2.5);
      roomT = setTimeout(() => { if (ROOMS[ROOMG] === R9 && ROOMRUN) roomLaunch(R9.id); }, 900);
    }
    function roomLaunch(id) {
      if (!id) return; clearTimeout(roomT); const g = MAP.game.current; if (g && g.id === id) return;
      if (TITLE && TITLE.phase !== 'off') { if (TITLE.phase === 'title' || TITLE.phase === 'menu') TITLE.go(id); else roomT = setTimeout(() => roomLaunch(id), 700); return; }
      MAP.game.load(id, {});
    }
    function invite(m) {
      const G = m.st[0] === 'h' ? { re: /^hideseek/, id: 'hideseek_vs', t: '🙈 같은 방에서 <b>숨바꼭질 대작전</b> ' } : m.st[0] === 'r' ? { re: /^robots/, id: 'robots_vs', t: '🤖 같은 방에서 <b>로봇인 척</b> ' } : m.st[0] === 'g' ? { re: /^guide/, id: 'guide_vs', t: '🧭 같은 방에서 <b>길잡이</b> ' } : { re: /^watergun/, id: 'watergun_vs', t: '💦 같은 방에서 <b>물총 팀 대결</b> ' };
      const g = MAP.game.current; if ((g && G.re.test(g.id)) || document.body.classList.contains('title-on')) return;
      if (ROOMS[ROOMG] && ROOMS[ROOMG].id === G.id) return;
      let d = document.getElementById('mpInvite'); if (d) d.remove();
      d = document.createElement('div'); d.id = 'mpInvite'; d.className = 'chip';
      d.style.cssText = 'left:50%;top:96px;transform:translateX(-50%);z-index:44;display:flex;gap:8px;align-items:center;font-size:15px;padding:8px 12px;pointer-events:auto';
      d.innerHTML = G.t + (/count$/.test(m.st) ? '경기가 곧 시작해요!' : '대기실이 열렸어요') + '<button data-i="go" style="font:inherit;font-weight:800;border:0;border-radius:9px;padding:5px 11px;background:#ffd23c;color:#1d3557;cursor:pointer">들어가기</button><button data-i="x" style="font:inherit;border:0;background:none;color:#fff;cursor:pointer">✕</button>';
      d.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-i]'); if (!b) return; d.remove(); if (b.dataset.i === 'go') MAP.game.load(G.id, {}); });
      document.body.appendChild(d); setTimeout(() => d.remove(), 15000);
    }
    function teacherCmd(c) {
      const g = MAP.game.current, st9 = g && g.handle && g.handle.state, ph9 = typeof st9 === 'string' ? st9 : st9 && st9.phase, inMatch = !!(g && /^(watergun|hideseek|robots|guide)/.test(g.id) && /^(play|count|hide|seek)$/.test(ph9 || ''));
      if (c.k === 'game') { const g9 = MAP.game.current; if (g9 && ROOMS.some(q => q && q.id === g9.id) && !gameEnding(g9)) MAP.game.stop(); wrShow(true); return; }
      if (c.k === 'go') { roomGo(); return; }
      if (c.k === 'end') { const g9 = MAP.game.current; if (g9 && ROOMS.some(q => q && q.id === g9.id) && !gameEnding(g9)) { MAP.game.stop(); toast('🏠 방장이 놀이를 마쳤어요 — 대기실로', 3); } else if (!g9) wrShow(true); return; }
      if (c.k === 'gstart') { const R9 = ROOMS[ROOMG]; if (g && R9 && g.id === R9.id && g.handle && g.handle.netStart) g.handle.netStart(); return; }
      if (c.k === 'gather') {
        if (inMatch) { PENDG = { c, t: Date.now() }; toast('📣 선생님이 불러요 — 놀이가 끝나면 선생님 곁으로 가요', 3); return; }
        PENDG = null; gatherTo(c, c.s ? null : '📣 선생님이 불러서 선생님 곁으로 왔어요!');
        dispatchEvent(new CustomEvent('sm-cmd', { detail: c }));
      } else if (c.k === 'hold') holdOn();
      else if (c.k === 'release') holdOff(true);
    }
    function gatherTo(c, msg) {
      const a = Math.random() * Math.PI * 2, e = MAP.findEntry(c.x + Math.cos(a) * 2.2, c.z + Math.sin(a) * 2.2, c.y, null, 4) || MAP.findEntry(c.x, c.z, c.y, null, 6);
      document.exitPointerLock?.(); MAP.hostTeleport(e ? [e.x, e.y, e.z] : [c.x, c.y, c.z]); if (msg) toast(msg, 3);
    }
    addEventListener('sm-name', (e) => { if (NET && e.detail) { NET.setName(e.detail); LOBBY.draw(); } });
    addEventListener('sm-room', (e) => { if (e.detail) setTimeout(() => wrShow(true), 700); else { ROOMG = 0; ROOMRUN = false; OWNERID = null; LASTRES = null; READY = false; wrShow(false); } });
  }).catch((e) => console.warn('[동시 접속] 못 켰어요', e));
}
function loop(ts) {
  requestAnimationFrame(loop);
  if (window.SM_HOLD3D > 0 && ts) { if (ts - (loop.held || 0) < 250) { ADAPT.last = ts; return; } loop.held = ts; }
  if (FM.q && ts) { const g = ts - FM.lt; if (g < 29.3) return; FM.lt = g > 50 ? ts : FM.lt + 33.34; }
  if (ts) fmTick(ts);
  if (!ADAPT.ext) adaptTick(ts || performance.now());
  const rd = clock.getDelta(), dt = Math.min(0.05, rd);
  if (DIAG) DIAG.frame(ts, rd, dt);
  const t0 = performance.now();
  if (ts) { if (MOUSE.fl) MOUSE.fd = Math.min(120, Math.max(1, ts - MOUSE.fl)); MOUSE.fl = ts; }
  mouseApply(dt);
  step(dt);
  doorTick(dt);
  hotTick(dt);
  if (NET) { NETP.x = P.x; NETP.y = P.y; NETP.z = P.z; NETP.h = P.yaw; NET.tick(dt, NETP); }
  MAP.tick(dt);
  keysFrameEnd();
  simMs = Math.max(simMs, performance.now() - t0);
  skyTick(dt);
  detailTick(dt, OCC_BUDGET);
  fmView();
  const tR0 = performance.now();
  renderer.render(scene, camera);
  afterRender(canvas);
  fmViewEnd();
  const tR1 = performance.now();
  acc += dt; n++;
  locT += dt;
  if (locT > 0.4) { locT = 0; updateLoc(); }
  RB.cpu[RB.ci++ % RB.cpu.length] = (tR0 - t0) + (performance.now() - tR1);
  if (acc > 1) {
    const fps = Math.round(n / acc);
    const dc = renderer.info.render.calls; FM.fps1 = fps; FM.dc = dc;
    fpsBox.textContent = fps + ' fps · ' + Math.round(GFX.dpr * 100) / 100 + 'x · ' + dc + ' dc · sim ' + simMs.toFixed(2) + 'ms' + (MAP.game.current ? ' · game ' + MAP.game.lastMs.toFixed(2) + 'ms' : '');
    if (DBG9 && dc > 300) console.warn('예산 초과: drawCalls', dc);
    if (DBG9 && simMs > 1) console.warn('예산 초과: sim ms', simMs.toFixed(2));
    acc = 0; n = 0; simMs = 0;
  }
}
loop();
TIMING.firstFrameMs = performance.now();
if (DIAG) DIAG.boot();

const TITLE = TITLE_ON ? createTitle({ THREE, camera, P, CTRL, keys, touch: TOUCH, SCHOOL, tone, toast, game: MAP.game, picker: MAP.picker, setCam: f => { CAM_OVR = f; }, film: FILM, world }) : null;
if (TITLE) ADAPT.hold = () => TITLE.phase !== 'off';
if (TITLE) TITLE.bootDone(); else document.getElementById('boot')?.remove();
warmDone();

idle(() => prewarm());
if (!/[?&](check|health)=1/.test(location.search)) idle(() => MAP.navIdle && MAP.navIdle(), 3000);

{
  const pz = document.createElement('div'); pz.id = 'pause';
  pz.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(20,30,50,.45);font-family:inherit';
  pz.innerHTML = '<div style="background:#fffdf5;border:4px solid #1d3557;border-radius:18px;padding:18px 22px;min-width:240px;text-align:center;box-shadow:0 8px 0 #1d3557;color:#1d3557;max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box">'
    + '<div style="font-size:22px;font-weight:800;margin-bottom:12px">⏸ 잠깐 멈춤</div>'
    + '<button data-a="go">▶ 계속하기</button><button data-a="menu">🏠 메뉴로</button><button data-a="pick">🎮 놀이 바꾸기</button><button data-a="look">🎨 내 모습</button><button data-a="photo">📷 사진</button><button data-a="set">⚙ 설정</button>'
    + '<div style="font-size:12px;color:#5a6a80;margin-top:8px">1·Enter 계속 · 2 메뉴 · 3 놀이 · 4 내 모습 · 5 사진 · 6 설정 · P/Esc = 멈춤 창</div></div>';
  pz.querySelectorAll('button').forEach(b => b.style.cssText = 'display:block;width:100%;min-height:46px;margin:8px 0 0;border:0;border-radius:12px;background:#ffd23f;color:#1d3557;font:inherit;font-size:17px;font-weight:700;cursor:pointer');
  if (window.SM_PROMO) {
    pz.querySelector('[data-a=pick]').remove(); pz.querySelector('[data-a=look]').remove(); pz.querySelector('[data-a=photo]').remove(); pz.querySelector('[data-a=set]').remove(); pz.querySelector('[data-a=menu]').textContent = '🏠 처음 화면으로';
    pz.lastElementChild.lastElementChild.textContent = '1·Enter 계속 · 2 처음 화면 · P/Esc = 멈춤 창'; }
  document.body.appendChild(pz);
  let userLock = false;
  const hide = () => { pz.style.display = 'none'; };
  const busy = () => CTRL.frozen || TOP.on || (TITLE && TITLE.phase !== 'off')
    || (MAP.picker && MAP.picker.panel) || document.querySelector('.eng-note,.hudAsk,.esc-lock,#tour-talk,#story-talk,#memo-ui .mp,.bk-panel,.lb-pop,.lb-big,.lb-ask,.wg-lobby,.twn-p,#lkPop,.st-pop,#phCd');
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) { userLock = true; CURSOR.on = false; hide(); return; }
    if (!userLock) return; userLock = false;
    if (CURSOR.on) return;
    setTimeout(() => { if (!document.pointerLockElement && !busy()) show(); }, 120);
  });
  pz.addEventListener('click', e => {
    const a = e.target.dataset && e.target.dataset.a; e.stopPropagation();
    if (a === 'menu') { hide(); if (TITLE) TITLE.backToMenu(); else location.href = location.pathname; return; }
    if (a === 'pick') { hide(); MAP.picker && MAP.picker.open(); return; }
    if (a === 'look') { hide(); lookOpen(); return; }
    if (a === 'photo') { hide(); openPhotoPanel({ shoot: photoShoot }); return; }
    if (a === 'set') { hide(); setOpen(); return; }
    hide(); if (!TOUCH.on && !CTRL.freeMouse) { try { const p9 = canvas.requestPointerLock(); if (p9 && p9.catch) p9.catch(() => {}); } catch (e) {   } }
  });
  const show = () => { keys.clear(); pz.style.display = 'flex'; };
  const photoShoot = () => takePhoto({ tone, net: () => NET, toast: (m, t) => toast(m, t), label: () => ((document.getElementById('loc') || {}).textContent || '').replace(/^\S+\s*/, '') });

  const lookOpen = () => { if (window.SM_PROMO || document.getElementById('lkPop')) return; keys.clear(); const fz0 = CTRL.frozen; CTRL.frozen = true; openLookPanel({ THREE, buildKid, onClose: () => { CTRL.frozen = fz0; } }); };
  addEventListener('sm-look-open', lookOpen);
  const setOpen = () => { if (window.SM_PROMO || document.getElementById('setPop')) return; keys.clear(); const fz0 = CTRL.frozen; CTRL.frozen = true; openSetPanel({ onClose: () => { CTRL.frozen = fz0; } }); };
  addEventListener('sm-set-open', setOpen);

  if (false && FM.on && !SET.gm && (!navigator.webdriver || /[?&]gmpick=1/.test(location.search))) {     let st0 = null, okN = 0;
    const iv = setInterval(() => { if (SET.gm) { clearInterval(iv); return; } if (document.hidden || busy() || pz.style.display === 'flex') { okN = 0; return; }
      if (!st0) { st0 = [P.x, P.z]; return; } if (Math.hypot(P.x - st0[0], P.z - st0[1]) < 3 || ++okN < 2) return;
      clearInterval(iv); keys.clear(); document.exitPointerLock?.(); const fz0 = CTRL.frozen; CTRL.frozen = true; openGfxPick({ en: document.documentElement.lang === 'en', onClose: () => { CTRL.frozen = fz0; } }); }, 1000); }

  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    const on = pz.style.display === 'flex';
    if (on) {
      const a = { Enter: 'go', NumpadEnter: 'go', Space: 'go', Digit1: 'go', Digit2: 'menu', Digit3: 'pick', Digit4: 'look', Digit5: 'photo', Digit6: 'set', KeyP: 'go', Escape: 'close' }[e.code];
      if (!a) return; e.preventDefault(); e.stopImmediatePropagation();
      if (a === 'close') hide(); else pz.querySelector('[data-a="' + a + '"]')?.click();
      return;
    }
    if (TITLE && TITLE.phase !== 'off') return;
    if (e.code === 'KeyP') { e.preventDefault(); userLock = false; document.exitPointerLock?.(); show(); }
    else if (e.code === 'KeyG' && !CTRL.frozen && !window.SM_PROMO) { e.preventDefault(); document.exitPointerLock?.(); MAP.picker && (MAP.picker.panel ? MAP.picker.close() : MAP.picker.open()); }
  }, true);

  addEventListener('keydown', e => {
    if (e.code !== 'Escape' || e.repeat || !CTRL.freeMouse || TOUCH.on || e.defaultPrevented) return;
    if ((TITLE && TITLE.phase !== 'off') || pz.style.display === 'flex' || busy() || document.querySelector('.lb-pop,.lb-big,.wg-lobby,#mpHold,#memo-here')) return;
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    userLock = false; show();
  });
  window.__pause = { show, hide, get on() { return pz.style.display === 'flex'; }, busy };
}

function fitView() {
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; if (!w || !h || (w === fitView.w && h === fitView.h)) return;
  fitView.w = w; fitView.h = h; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
}
addEventListener('resize', fitView); addEventListener('orientationchange', () => { fitView(); setTimeout(fitView, 350); });
if (window.visualViewport) visualViewport.addEventListener('resize', fitView);
if (window.ResizeObserver) new ResizeObserver(fitView).observe(canvas);
setInterval(fitView, 1000); fitView();

function reach(opt = {}) {
  const NV = MAP.navSync({ jump: !!opt.jump, fresh: true }), N = NV.raw, S = N.S;
  const zs = world.zones, bad = [], ok = [];
  if (!opt.jump) {
    const hit = new Uint8Array(zs.length);
    for (let i = 0; i < N.count; i++) { const x = N.X(i), z = N.Z(i), y = N.y[i]; for (let k = 0; k < zs.length; k++) if (!hit[k] && MAP.inZone(zs[k], x, y, z)) hit[k] = 1; }
    zs.forEach((Z, k) => (hit[k] ? ok : bad).push(Z.label));
  }

  let roof = 0; const roofAt = [], U = world.UPPER;
  for (let i = 0; i < N.count; i++) {
    const y = Math.round(N.y[i] * 2) / 2, x = N.X(i), z = N.Z(i);
    if (y > 3.0 && !(x > U[0] - 0.2 && x < U[1] + 0.2 && z > U[2] - 0.2 && z < U[3] + 0.2)) { roof++; if (roofAt.length < 5) roofAt.push([+x.toFixed(1), +z.toFixed(1), y]); }
  }
  if (roof) bad.push('옥상 도달 ' + roof + '칸 ' + JSON.stringify(roofAt));
  if (opt.probe) {
    const [px0, px1, pz0, pz1] = opt.probe;
    let top = -99, at = null;
    for (let i = 0; i < N.count; i++) { const x = N.X(i), z = N.Z(i), y = Math.round(N.y[i] * 2) / 2; if (x >= px0 && x <= px1 && z >= pz0 && z <= pz1 && y > top) { top = y; at = [x, z, y]; } }
    console.log('probe 최고 도달: ' + JSON.stringify(at));
    return { cells: N.count, ok, bad, probe: at };
  }
  if (bad.length) console.error('🚫 도달 불가 ' + bad.length + '곳: ' + bad.join(', '));
  else console.log(opt.jump ? '✅ 점프로 옥상 도달 0' : '✅ 도달성: 전 구역 ' + ok.length + '곳 통과 (칸 ' + N.count + ')');
  const res = { cells: N.count, ok, bad }; if (opt.keep) res.nav = NV; return res;
}

if (location.search.includes('check=1')) setTimeout(() => { reach(); reach({ jump: true }); doorCheck(); MAP.check(); window.SD2.health({ quick: true }).catch(e => console.error('🩺 검진 실패', e)); }, 60);
else if (location.search.includes('health=1')) setTimeout(() => window.SD2.health({ img: true }).then(r => console.log('🩺', JSON.stringify(r.counts))), 60);

const gndOf = b => { const U = world.UPPER; return (b.y0 >= U[4] - 0.15 && b.x0 > U[0] - 0.6 && b.x1 < U[1] + 0.6 && b.z0 > U[2] - 0.6 && b.z1 < U[3] + 0.6) ? U[4] : world.baseAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2); };
const FH2 = SCHOOL.building.floorHeight + 0.3;
function passCheck() {
  const out = [];
  const test = (pts, g) => pts.some(([x, y, z]) => y >= g + 0.05 && y <= g + 1.45 && !blockedAt(x, z, g) && groundAt(x, z, g) < y - 0.02);
  for (const b of world.allBoxes) {
    if (b.wall) continue; const g = gndOf(b);
    if (b.y0 > g + 1.4 || b.y1 < g + 0.12 || b.x1 - b.x0 > 40 || b.z1 - b.z0 > 40 || g > 3) continue;
    const pts = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push([b.x0 + (b.x1-b.x0)*(i+0.5)/3, (Math.max(b.y0, g+0.1) + Math.min(b.y1, g+1.4))/2, b.z0 + (b.z1-b.z0)*(j+0.5)/3]);
    if (test(pts, g)) out.push(['box', +((b.x0+b.x1)/2).toFixed(1), +((b.z0+b.z1)/2).toFixed(1)]);
  }
  for (const r of world.visRods) {
    const g = gndOf(r); if (r.y0 > g + 1.4 || r.y1 < g + 0.12) continue;
    const pts = []; for (let t = 0.1; t < 1; t += 0.2) pts.push([r.a[0] + (r.b[0]-r.a[0])*t, r.a[1] + (r.b[1]-r.a[1])*t, r.a[2] + (r.b[2]-r.a[2])*t]);
    if (test(pts, g)) out.push(['rod', +((r.x0+r.x1)/2).toFixed(1), +((r.z0+r.z1)/2).toFixed(1)]);
  }
  return out;
}
function standCheck() {
  const out = [];
  for (const c of world.colliders) {
    const g = gndOf(c), top = c.y1 - g;
    if (top < 0.15 || top > 1.52 || c.y0 > g + 0.6) continue;
    let ok = false;
    for (let i = 0; i < 3 && !ok; i++) for (let j = 0; j < 3 && !ok; j++) if (!blockedAt(c.x0 + (c.x1-c.x0)*(i+0.5)/3, c.z0 + (c.z1-c.z0)*(j+0.5)/3, c.y1)) ok = true;
    if (ok) out.push([+top.toFixed(2), +((c.x0+c.x1)/2).toFixed(1), +((c.z0+c.z1)/2).toFixed(1), +(c.x1-c.x0).toFixed(2), +(c.z1-c.z0).toFixed(2)]);
  }
  return out;
}

window.SD2 = {
  scene, camera, renderer, world, reach, detailTick, passCheck, standCheck,
  time: k => setTime(k || ORDER[(ORDER.indexOf(timeKey) + 1) % 3]),
  loc: () => { updateLoc(); return locBox.textContent; },
  tp(x, z, y = null) { P.x = x; P.z = z; P.y = y ?? (world.baseAt(x, z) + 0.01); P.vy = 0; },
  yaw(v) { camYaw = v; }, pitch(v) { if (v != null) camPitch = Math.max(-0.2, Math.min(1.1, v)); return camPitch; },
  pos: () => [P.x.toFixed(1), P.y.toFixed(1), P.z.toFixed(1)],
  step(nn = 1, keyList = []) { keyList.forEach(k => keys.add(k)); for (let i = 0; i < nn; i++) { mouseApply(); step(1/60); doorTick(1/60); hotTick(1/60); MAP.tick(1/60); keysFrameEnd(); } keyList.forEach(k => keys.delete(k)); detailTick(1); fmView(); renderer.render(scene, camera); fmViewEnd(); },
  doors: () => DOORS.length, doorCheck,
  near: () => hotNear && hotNear.label, act: () => hotNear && act(hotNear),
  film: FILM, top: TOP, acts: ACTS, hotNow: () => hotNear, actOn: h => act(h), camOvr: f => { CAM_OVR = f; }, pg,
  perf: () => ({ fps: FM.fps1 || 0, mode: FM.mode, steps: !!FM.st, target: FM.target, step: FM.lv, stepName: FM.step, dpr: GFX.dpr, dprLvl: ADAPT.lvl + '/' + (ADAPT.ladder.length - 1), fog: FM.fk, detail: FM.dk, shadow: !FM.shOff && GFX.shadow > 0, drawCalls: FM.dc || 0, gfxMode: GFX.mode, log: FM.log.slice(-8) }),
  touch: TOUCH, gfx: GFX, title: TITLE, input: { keys, KEY_NEW, KEY_UP, MOUSE, clear: keysClear }, prewarm, setDpr, setShadowSize, adaptTick, fmLock,
  cam: () => [+camYaw.toFixed(3), +camPitch.toFixed(3), camFirst, +camZ.toFixed(3)],

  map: MAP, phys: { groundAt, blockedAt, ceilAt, camHit, PHY, pGround, pBlocked, pCeil }, ACT, CTRL, camPose: (...a) => ({ ...camPose(...a) }),
  health: opt => import('./health.js?v=8').then(m => m.runHealth(window.SD2, opt || {})),

  timing: Object.defineProperties(TIMING, {
    frameCpuP50: { get: () => rbPct(RB.cpu, RB.ci, 0.5), enumerable: true }, frameCpuP95: { get: () => rbPct(RB.cpu, RB.ci, 0.95), enumerable: true },
    occP95: { get: () => rbPct(RB.occ, RB.oi, 0.95), enumerable: true }, reset: { value: () => { RB.ci = RB.oi = 0; } } }),
};
if (!window.SD) window.SD = { perf: window.SD2.perf };

Object.assign(window.SD, DIAG ? { diag: DIAG.get, diagClear: DIAG.clear, diagText: DIAG.text } : { diag: () => ({ off: '홍보판은 기록하지 않아요' }), diagClear: () => '', diagText: () => '' });
window.SD2.diag = window.SD.diag;

{ const QS = new URLSearchParams(location.search), G0 = QS.get('game') || (QS.get('tour') === '1' ? 'tour' : null) || (QS.get('town') && !window.SM_PROMO ? 'town' : null), GAME = window.SM_PROMO && G0 === 'town' ? null : G0;   if (GAME && !SHOT) MAP.game.load(GAME, Object.fromEntries(new URLSearchParams(location.search))); }
