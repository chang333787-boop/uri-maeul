const SKIP = '#mpChat,#mpChatBtn,.lb-pop,.lb-ask,#mpWR,input,textarea,[contenteditable],#memo-ui,.no-keytext';
const RX = [
  [/\s*\((?:[A-Z]|Esc|Tab)(?:\s*(?:=|→|로)[^)]{0,24})?\)/g, ''],
  [/\bW (?:앞으로|go) · A\/D (?:돌기|turn)/g, '이동 막대로 몰기'],
  [/A\/D(?:\(←→\))?로 좌우/g, '이동 막대로 좌우'],
  [/(^|[\s·—(])[A-DF-Z] = /g, '$1'],
  [/(^|[\s(·—\-'"‘“])E(?=$|[\s!=를로,.)·?'"’”])/g, '$1✋'],
];
export function noKeys(t) { let s = String(t); for (const [r, v] of RX) s = s.replace(r, v); return s; }
function fix(tn) { const v0 = tn.nodeValue; if (!v0 || !/[A-Z]/.test(v0)) return; const p = tn.parentElement; if (!p || p.closest(SKIP)) return; const v = noKeys(v0); if (v !== v0) tn.nodeValue = v; }
function walk(n) { if (n.nodeType === 3) { fix(n); return; } if (n.nodeType !== 1 || (n.closest && n.closest(SKIP))) return; const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) fix(t); }
let MO = null;
export function startKeyText() { if (MO) return; MO = new MutationObserver((recs) => { for (const r of recs) { if (r.type === 'characterData') fix(r.target); else for (const n of r.addedNodes) walk(n); } }); MO.observe(document.body, { subtree: true, childList: true, characterData: true }); walk(document.body); }
export function stopKeyText() { if (MO) { MO.disconnect(); MO = null; } }
export const keyTextOn = () => !!MO;
