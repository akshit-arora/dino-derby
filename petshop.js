// Pixel Pet Shop - a counting, adding and coin game for a 6 year old. Procedural pixel art, no assets, no libs.
// Nobody ever fails here: a wrong bag just gets a friendly count-along and another go.
(() => {
'use strict';
const P = window.PETSHOP;
const W = 960, H = 600;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = '"Trebuchet MS",Verdana,sans-serif';

// ---------- utils ----------
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = a => a[Math.floor(Math.random() * a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const sum = a => a.reduce((s, v) => s + v, 0);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const item = id => P.items.find(i => i.id === id);
const nameOf = (id, n) => n === 1 ? item(id).one : item(id).many;
function shade(hex, f) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 'rgb(' + c.map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)).join(',') + ')';
}

// ---------- pixel drawing helpers ----------
function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function nb(x, y, w, h, c, n) { px(x + n, y, w - 2 * n, h, c); px(x, y + n, w, h - 2 * n, c); }
function box(x, y, w, h, fill, edge, n = 6, b = 4) { nb(x, y, w, h, edge, n); nb(x + b, y + b, w - 2 * b, h - 2 * b, fill, Math.max(2, n - 2)); }
function txt(s, x, y, size, col = '#3e2723', al = 'center', outline) {
  ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textAlign = al; ctx.textBaseline = 'middle';
  if (outline) { ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function tw(s, size) { ctx.font = 'bold ' + size + 'px ' + FONT; return ctx.measureText(s).width; }
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c; }
function spr(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), c = makeCanvas(w, h), g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } } });
  return c;
}
function blit(c, x, y, k) { ctx.drawImage(c, Math.round(x), Math.round(y), c.width * k, c.height * k); }
function blitC(c, cx, cy, maxPx) { const k = Math.max(1, Math.floor(maxPx / Math.max(c.width, c.height))); blit(c, cx - c.width * k / 2, cy - c.height * k / 2, k); }

// ---------- sprites ----------
const ART = {
  apple: [['....n...', '...ngg..', '.rrnrrr.', 'rrrrrrrr', 'rwrrrrrr', 'rwrrrrrr', '.rrrrrr.', '..rr.rr.'], { g: '#43a047', r: '#e53935', w: '#ffcdd2', n: '#6d4c41' }],
  fish: [['........', '..bbb...', '.bbbbb.B', 'bwkbbbBB', 'bbbbbbBB', '.bbbbb.B', '..bbb...', '........'], { b: '#29b6f6', B: '#0277bd', w: '#fff', k: '#111' }],
  bone: [['........', 'kkk..kkk', 'kwwkkwwk', 'kwwwwwwk', 'kwwwwwwk', 'kwwkkwwk', 'kkk..kkk', '........'], { w: '#f5e6c8', k: '#8d6e63' }],
  ball: [['..bbbb..', '.bbwwbb.', 'bbwbbbbb', 'bwbbbbbb', 'bbbbbbbB', 'bbbbbbBB', '.bbbbBB.', '..BBBB..'], { b: '#1e88e5', B: '#0d47a1', w: '#e3f2fd' }],
  carrot: [['..gg.g..', '...ggg..', '..oooo..', '..oOoo..', '...oOo..', '...ooo..', '....oo..', '....o...'], { o: '#fb8c00', O: '#e65100', g: '#43a047' }],
  cookie: [['..tttt..', '.ttdttt.', 'ttttttdt', 'tdtttttt', 'ttttdttt', 'tttttttt', '.ttdttt.', '..tttt..'], { t: '#d9a066', d: '#6d4c41' }],
  star: [['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yyyyyy.', '.yy..yy.', 'yy....yy'], { y: '#ffca28' }],
  heart: [['........', '.rr..rr.', 'rrrrrrrr', 'rwrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...'], { r: '#e91e63', w: '#f8bbd0' }],
  crown: [['........', 'y..y..y.', 'yy.yy.yy', 'yyyyyyyy', 'yryyybyy', 'yyyyyyyy', 'yyyyyyyy', '........'], { y: '#ffca28', r: '#e53935', b: '#1e88e5' }],
  trophy: [['yyyyyyyy', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '...yy...', '...yy...', '..oooo..', '.oooooo.'], { y: '#ffca28', o: '#a1662f' }],
  parrot: [['...rrrr...', '..rrrrrr..', '..rwkrrr..', '..rrrooo..', '..rrrrro..', '.rrrrrr...', '.rrbbrr...', '.rrbbrr...', '..rbbr....', '..o..o....'], { r: '#e53935', b: '#1e88e5', k: '#111', w: '#fff', o: '#ff9800' }],
  dragon: [['.r......r.', '.rgggggg..', '..gwkggg..', '..gggggggo', '..gggyyg..', '.gggyyyg..', 'ggggyyyg..', '.gggyyyg..', '..gg..gg..', '..GG..GG..'], { g: '#43a047', G: '#2e7d32', y: '#fff59d', k: '#111', r: '#ef5350', w: '#fff', o: '#ff7043' }]
};
const IMG = {};
for (const k in ART) IMG[k] = spr(ART[k][0], ART[k][1]);

const FUR = {
  dog: { fur: '#a1744a', dark: '#5d4037', muz: '#f3d9b1', nose: '#111' },
  cat: { fur: '#ffa726', dark: '#e65100', muz: '#fff3e0', nose: '#ec407a' },
  bunny: { fur: '#f5f5f5', dark: '#f48fb1', muz: '#ffffff', nose: '#ec407a' },
  bear: { fur: '#8d6e63', dark: '#5d4037', muz: '#d7b899', nose: '#111' },
  frog: { fur: '#66bb6a', dark: '#2e7d32', muz: '#a5d6a7', nose: '#2e7d32' }
};
function animalCanvas(kind, shirt) {
  const a = FUR[kind], c = makeCanvas(16, 18), g = c.getContext('2d');
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  if (kind === 'dog') { r(1, 3, 3, 7, a.dark); r(12, 3, 3, 7, a.dark); }
  if (kind === 'cat') { r(3, 1, 3, 3, a.fur); r(10, 1, 3, 3, a.fur); r(4, 2, 1, 2, a.dark); r(11, 2, 1, 2, a.dark); }
  if (kind === 'bunny') { r(4, 0, 2, 5, a.fur); r(10, 0, 2, 5, a.fur); r(5, 1, 1, 3, a.dark); r(10, 1, 1, 3, a.dark); }
  if (kind === 'bear') { r(2, 2, 3, 3, a.fur); r(11, 2, 3, 3, a.fur); r(3, 3, 1, 1, a.dark); r(12, 3, 1, 1, a.dark); }
  r(3, 3, 10, 8, a.fur);
  r(5, 7, 6, 3, a.muz); r(7, 7, 2, 1, a.nose); r(7, 9, 2, 1, a.dark);
  if (kind === 'frog') {
    r(3, 2, 3, 3, a.fur); r(10, 2, 3, 3, a.fur); r(4, 3, 2, 2, '#fff'); r(10, 3, 2, 2, '#fff'); r(5, 3, 1, 2, '#111'); r(10, 3, 1, 2, '#111');
    r(5, 9, 6, 1, a.dark);
  } else {
    r(5, 5, 2, 2, '#111'); r(5, 5, 1, 1, '#fff'); r(9, 5, 2, 2, '#111'); r(9, 5, 1, 1, '#fff');
  }
  r(4, 8, 1, 1, '#ff8a80'); r(11, 8, 1, 1, '#ff8a80');
  if (kind === 'cat') { r(1, 8, 3, 1, '#bbb'); r(12, 8, 3, 1, '#bbb'); }
  if (shirt) {
    r(4, 11, 8, 7, shirt); r(3, 12, 1, 5, shirt); r(12, 12, 1, 5, shirt); r(3, 16, 1, 1, a.fur); r(12, 16, 1, 1, a.fur); r(6, 11, 4, 1, '#fff');
  } else {
    r(4, 11, 8, 5, a.fur); r(4, 16, 3, 2, a.dark); r(9, 16, 3, 2, a.dark);
  }
  return c;
}
function kidCanvas() {
  const c = makeCanvas(16, 18), g = c.getContext('2d');
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  r(3, 1, 10, 3, '#e53935'); r(2, 3, 12, 1, '#b71c1c'); r(3, 4, 1, 3, '#4e342e'); r(12, 4, 1, 3, '#4e342e');
  r(4, 4, 8, 7, '#ffcc80'); r(5, 6, 2, 2, '#111'); r(5, 6, 1, 1, '#fff'); r(9, 6, 2, 2, '#111'); r(9, 6, 1, 1, '#fff');
  r(4, 8, 1, 1, '#ff8a80'); r(11, 8, 1, 1, '#ff8a80'); r(6, 9, 4, 1, '#c62828');
  r(4, 11, 8, 7, '#fff'); r(5, 12, 6, 6, '#43a047'); r(3, 12, 1, 5, '#fff'); r(12, 12, 1, 5, '#fff'); r(3, 16, 1, 1, '#ffcc80'); r(12, 16, 1, 1, '#ffcc80');
  return c;
}
const CUST = {}; P.customers.forEach(c => { CUST[c.kind] = animalCanvas(c.kind, c.shirt); });
const PETIMG = {}; ['dog', 'cat', 'bunny', 'bear', 'frog'].forEach(k => { PETIMG[k] = animalCanvas(k, null); }); PETIMG.parrot = IMG.parrot; PETIMG.dragon = IMG.dragon;
const KID = kidCanvas();
const petScale = id => id === 'parrot' || id === 'dragon' ? 5 : 3;

const COIN_COL = { 1: '#cd7f32', 2: '#b0bec5', 5: '#ffc107', 10: '#ab47bc' };
function drawCoin(cx, cy, d, v) {
  const col = COIN_COL[v] || '#ffc107', x = cx - d / 2, y = cy - d / 2, p = Math.max(2, Math.round(d * 0.14));
  nb(x, y, d, d, shade(col, -0.45), p);
  nb(x + 2, y + 2, d - 4, d - 4, col, Math.max(1, p - 1));
  px(x + d * 0.25, y + d * 0.18, Math.max(2, d * 0.12), Math.max(2, d * 0.12), shade(col, 0.6));
  if (v) txt(String(v), cx, cy + 1, Math.round(d * 0.55), shade(col, -0.65));
}
function drawItemIcon(id, x, y, k) { blit(IMG[id], x, y, k); }

// ---------- audio ----------
let AC = null, muted = false;
try { muted = localStorage.getItem('petshop-muted') === '1'; } catch (e) {}
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
}
function tone(f, d, type = 'square', vol = 0.05, slide = 0, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  tap: () => tone(660, 0.07, 'square', 0.04, 220),
  pop: () => tone(440, 0.08, 'triangle', 0.05, -150),
  tick: i => tone(520 + i * 40, 0.09, 'triangle', 0.05),
  coin: () => { tone(988, 0.06, 'square', 0.035); tone(1319, 0.1, 'square', 0.035, 0, 0.05); },
  good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.05, 0, i * 0.09)),
  bad: () => { tone(300, 0.18, 'triangle', 0.07, -80); tone(240, 0.22, 'triangle', 0.07, -80, 0.16); },
  ui: () => { tone(880, 0.07, 'square', 0.04); tone(1320, 0.09, 'square', 0.04, 0, 0.06); },
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'square', 0.05, 0, i * 0.11)),
  buy: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.05, 0, i * 0.07)),
  pet: () => { tone(900, 0.08, 'triangle', 0.05, 300); tone(1200, 0.1, 'triangle', 0.05, 200, 0.08); }
};

// ---------- voice (built-in speech synthesis) ----------
const synth = window.speechSynthesis;
let voice = null;
function pickVoice() {
  if (!synth) return;
  const vs = synth.getVoices();
  voice = vs.find(v => /^en[-_](US|GB|AU)/i.test(v.lang) && /samantha|karen|google|zira|female/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
function say(text, cb) {
  let done = false;
  const fin = () => { if (!done) { done = true; if (cb) cb(); } };
  if (!synth || muted) { if (cb) setTimeout(fin, 520); return; }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1.15;
    u.onend = fin; u.onerror = fin;
    synth.speak(u);
    if (cb) setTimeout(fin, Math.max(1300, text.length * 95));
  } catch (e) { if (cb) setTimeout(fin, 520); }
}
const shush = () => { try { if (synth) synth.cancel(); } catch (e) {} };

// ---------- save ----------
const SAVE_KEY = 'petshop-v1';
const sv = { level: 1, coins: 0, pets: [], decor: [], served: 0, stickers: 0, streak: 0, miss: 0, stats: {} };
try { Object.assign(sv, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(sv)); } catch (e) {} };

// ---------- orders ----------
function makeOrder(level) {
  const mode = level === 7 ? rint(2, 6) : level;
  const ids = shuffle(P.items.map(i => i.id));
  const o = { mode, kind: 'items', rows: [], target: {}, sum: 0, shelf: [], spoken: '' };
  const num = v => ({ t: 'num', v }), ico = id => ({ t: 'icon', id }), op = v => ({ t: 'op', v }), words = v => ({ t: 'text', v });
  const a = ids[0], b = ids[1];
  if (mode === 1) {
    const n = rint(1, 10); o.target[a] = n;
    o.rows = [[num(n), ico(a)]]; o.spoken = `I would like ${n} ${nameOf(a, n)}, please!`;
  } else if (mode === 2) {
    let n = rint(1, 10), m = rint(1, 10); if (n + m > 18) m = 18 - n;
    o.target[a] = n; o.target[b] = m;
    o.rows = [[num(n), ico(a)], [num(m), ico(b)]];
    o.spoken = `I would like ${n} ${nameOf(a, n)} and ${m} ${nameOf(b, m)}, please!`;
  } else if (mode === 3) {
    const x = rint(1, 9), y = rint(1, 10 - x); o.target[a] = x + y;
    o.rows = [[num(x), ico(a), op('+'), num(y), ico(a)]];
    o.spoken = `I would like ${x} ${nameOf(a, x)} and ${y} more. How many is that? Put them all in the bag!`;
  } else if (mode === 4) {
    if (Math.random() < 0.5) {
      const x = rint(4, 15), y = rint(2, 20 - x); o.target[a] = x + y;
      o.rows = [[num(x), ico(a), op('+'), num(y), ico(a)]];
      o.spoken = `I would like ${x} ${nameOf(a, x)} and ${y} more. How many is that? Put them all in the bag!`;
    } else {
      const x = rint(8, 20), y = rint(2, x - 2); o.target[a] = x - y;
      o.rows = [[num(x), ico(a), op('−'), num(y)]];
      o.spoken = `I want ${x} ${nameOf(a, x)}, but I do not want ${y} of them. How many should go in the bag?`;
    }
  } else if (mode === 5) {
    const n = rint(3, 20); o.kind = 'coins'; o.sum = n; o.denoms = [1, 2, 5];
    o.rows = [[ico(a), words('costs'), num(n), { t: 'coin' }]];
    o.spoken = `This ${item(a).one} costs ${n} coins. Please take ${n} coins from my purse!`;
  } else {
    const small = Math.random() < 0.6, p = small ? rint(1, 9) : rint(11, 19), q = small ? 10 : 20;
    o.kind = 'coins'; o.sum = q - p; o.denoms = [1, 2, 5, 10];
    o.rows = [[ico(a), words('costs'), num(p), { t: 'coin' }], [words('I pay'), num(q), { t: 'coin' }]];
    o.spoken = `This ${item(a).one} costs ${p} coins. I am paying with ${q} coins. What is my change?`;
  }
  if (o.kind === 'items') {
    const need = Object.keys(o.target), extra = ids.filter(i => !need.includes(i)).slice(0, 4 - need.length);
    o.shelf = shuffle(need.concat(extra));
  } else o.shelf = o.denoms.slice();
  return o;
}
function checkBag(o, bag) {
  if (o.kind === 'coins') { const s = sum(bag); return { ok: s === o.sum, have: s, need: o.sum }; }
  const cnt = {}; bag.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; });
  for (const id in o.target) if ((cnt[id] || 0) !== o.target[id]) return { ok: false, id, have: cnt[id] || 0, need: o.target[id] };
  for (const id in cnt) if (!(id in o.target)) return { ok: false, id, have: cnt[id], need: 0 };
  return { ok: true };
}

// ---------- decor ----------
const DECOR = {
  bunting: { x: 20, y: 54, w: 920, h: 40, pv: { w: 220, h: 40 }, draw(t) {
    const cols = ['#e53935', '#ffca28', '#42a5f5', '#66bb6a', '#ab47bc'];
    px(0, 0, 920, 3, '#6d4c41');
    for (let i = 0; i < 23; i++) { const c = cols[i % 5], x = i * 40 + 6; for (let r = 0; r < 14; r++) px(x + r * 0.7, 3 + r, 28 - r * 1.4, 1, c); }
  } },
  plant: { x: 196, y: 276, w: 56, h: 64, draw(t) {
    px(14, 40, 28, 24, '#bf6a3a'); px(10, 36, 36, 8, '#a1572c'); px(14, 44, 28, 3, '#d98a58');
    const sw = Math.sin(t * 1.5) * 2;
    px(26 + sw, 8, 4, 30, '#2e7d32'); px(10 + sw, 14, 16, 8, '#43a047'); px(30 + sw, 10, 18, 8, '#43a047'); px(12 + sw, 24, 14, 7, '#66bb6a'); px(32 + sw, 24, 14, 7, '#66bb6a'); px(24 + sw, 2, 8, 8, '#66bb6a');
  } },
  window: { x: 30, y: 62, w: 130, h: 108, draw(t) {
    box(0, 0, 130, 108, '#81d4fa', '#fff', 4, 6);
    px(10, 10, 110, 88, '#81d4fa');
    px(94, 18, 18, 18, '#ffeb3b');
    const cx = ((t * 8) % 150) - 20; px(cx, 40, 36, 12, '#fff'); px(cx + 8, 32, 22, 10, '#fff');
    px(10, 76, 110, 22, '#7cb342'); px(60, 10, 8, 88, '#fff'); px(10, 50, 110, 6, '#fff');
  } },
  balloons: { x: 780, y: 70, w: 100, h: 130, draw(t) {
    const cols = ['#e53935', '#42a5f5', '#ffca28'];
    cols.forEach((c, i) => {
      const bx = 12 + i * 32 + Math.sin(t * 1.3 + i) * 4, by = 6 + (i % 2) * 14;
      nb(bx, by, 28, 36, c, 9); px(bx + 6, by + 6, 4, 4, shade(c, 0.6)); px(bx + 12, by + 36, 4, 4, shade(c, -0.3));
      px(bx + 13, by + 40, 2, 70 - (i % 2) * 14, '#fff');
    });
  } },
  tank: { x: 610, y: 244, w: 150, h: 96, draw(t) {
    box(0, 0, 150, 96, '#4fc3f7', '#eceff1', 6, 5);
    px(5, 40, 140, 51, '#29b6f6'); px(5, 80, 140, 11, '#ffe082'); px(20, 66, 6, 14, '#43a047'); px(120, 62, 6, 18, '#43a047');
    const f = (x0, y0, col, dir) => { const x = ((t * 22 * dir + x0) % 120 + 120) % 120 + 14; px(x, y0, 14, 8, col); px(x + (dir > 0 ? -5 : 14), y0 + 1, 5, 6, col); px(x + (dir > 0 ? 10 : 2), y0 + 2, 2, 2, '#111'); };
    f(0, 30, '#ff7043', 1); f(60, 52, '#ffca28', -1);
    px(40 + Math.sin(t * 3) * 3, 20 + (t * 20 % 30) * -0.5 + 15, 3, 3, '#e1f5fe');
  } },
  lamp: { x: 700, y: 0, w: 60, h: 62, draw(t) {
    px(29, 0, 2, 26, '#5d4037'); nb(8, 26, 44, 18, '#ef6c00', 6); nb(10, 28, 40, 14, '#ffa726', 5);
    px(24, 44, 12, 10, '#fff59d'); px(18, 54, 24, 3, 'rgba(255,245,157,.5)');
  } }
};
const drawDecor = (id, t) => { const d = DECOR[id]; ctx.save(); ctx.translate(d.x, d.y); d.draw(t); ctx.restore(); };

// ---------- static scene ----------
const WALL = makeCanvas(W, H), COUNTER = makeCanvas(W, H);
(function buildScene() {
  let g = WALL.getContext('2d');
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  r(0, 0, W, 340, '#ffe0b2');
  for (let x = 0; x < W; x += 48) r(x, 0, 24, 340, '#ffd8a0');
  r(0, 276, W, 6, '#8d6e63'); r(0, 282, W, 58, '#bcaaa4');
  for (let x = 0; x < W; x += 60) r(x, 282, 3, 58, '#a1887f');
  r(300, 6, 360, 48, '#5d3a1a'); r(304, 10, 352, 40, '#a1662f'); r(310, 16, 340, 4, '#c98a4b');
  g = COUNTER.getContext('2d');
  r(0, 340, W, 22, '#d9a066'); r(0, 340, W, 4, '#f0c48a'); r(0, 362, W, 10, '#8d5524');
  r(0, 372, W, 228, '#a1662f');
  for (let x = 0; x < W; x += 120) { r(x, 372, 4, 228, '#8d5524'); r(x + 4, 372, 2, 228, '#b87a3f'); }
})();

// ---------- state ----------
let scene = 'menu', storeTab = 'pets';
let time = 0, ph = 'enter', phT = 0;
let cust = null, lastKind = '', order = null, bag = [], tries = 0, hl = null, caTok = 0, shake = 0, sadT = 0;
let newSticker = false, shownCoins = sv.coins, toast = null, lastSayLevel = 0;
let parts = [], flyCoins = [], pops = {}, btns = [], pressed = null, pressT = 0, gearHold = 0, gearDown = false, resetArm = 0, shopBounce = 0;
let petObjs = [];
const STICKERS = ['apple', 'fish', 'bone', 'ball', 'carrot', 'cookie', 'star', 'heart', 'dog', 'cat', 'bunny', 'bear', 'frog', 'parrot', 'dragon', 'c1', 'c2', 'c5', 'crown', 'trophy'];

function syncPets() {
  petObjs = petObjs.filter(p => sv.pets.includes(p.id));
  sv.pets.forEach(id => { if (!petObjs.some(p => p.id === id)) petObjs.push({ id, x: rnd(260, 560), dir: Math.random() < 0.5 ? -1 : 1, spd: rnd(18, 40), hop: 0, wait: rnd(0, 2) }); });
}
syncPets();

// ---------- buttons / icons ----------
function icon(kind, cx, cy, s, col) {
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.2; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  ctx.beginPath();
  if (kind === 'check') { ctx.moveTo(cx - s * 0.4, cy); ctx.lineTo(cx - s * 0.1, cy + s * 0.32); ctx.lineTo(cx + s * 0.45, cy - s * 0.35); ctx.stroke(); }
  else if (kind === 'back') { ctx.moveTo(cx + s * 0.25, cy - s * 0.4); ctx.lineTo(cx - s * 0.25, cy); ctx.lineTo(cx + s * 0.25, cy + s * 0.4); ctx.stroke(); }
  else if (kind === 'speaker') { ctx.rect(cx - s * 0.4, cy - s * 0.15, s * 0.22, s * 0.3); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy - s * 0.15); ctx.lineTo(cx + s * 0.1, cy - s * 0.4); ctx.lineTo(cx + s * 0.1, cy + s * 0.4); ctx.lineTo(cx - s * 0.18, cy + s * 0.15); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + s * 0.28, cy - s * 0.2); ctx.lineTo(cx + s * 0.36, cy); ctx.lineTo(cx + s * 0.28, cy + s * 0.2); ctx.stroke(); }
  else if (kind === 'trash') { ctx.moveTo(cx - s * 0.3, cy - s * 0.25); ctx.lineTo(cx + s * 0.3, cy - s * 0.25); ctx.moveTo(cx - s * 0.12, cy - s * 0.38); ctx.lineTo(cx + s * 0.12, cy - s * 0.38); ctx.moveTo(cx - s * 0.22, cy - s * 0.15); ctx.lineTo(cx - s * 0.17, cy + s * 0.4); ctx.lineTo(cx + s * 0.17, cy + s * 0.4); ctx.lineTo(cx + s * 0.22, cy - s * 0.15); ctx.stroke(); }
  else if (kind === 'sound') { icon('speaker', cx, cy, s, col); if (muted) { ctx.strokeStyle = '#e53935'; ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.moveTo(cx - s * 0.42, cy + s * 0.42); ctx.lineTo(cx + s * 0.42, cy - s * 0.42); ctx.stroke(); } }
  else if (kind === 'gear') { ctx.lineWidth = s * 0.14; ctx.arc(cx, cy, s * 0.25, 0, 7); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3); ctx.lineTo(cx + Math.cos(a) * s * 0.44, cy + Math.sin(a) * s * 0.44); ctx.stroke(); } }
  ctx.restore();
}
function button(id, label, x, y, w, h, col, fn, o = {}) {
  const down = pressed === id && pressT > 0, dy = down ? 5 : 0, dim = o.dim;
  nb(x, y + 6, w, h, 'rgba(0,0,0,.35)', 6);
  box(x, y + dy, w, h, dim ? '#bdbdbd' : col, dim ? '#757575' : shade(col, -0.4));
  px(x + 8, y + dy + 7, w - 16, 3, dim ? '#e0e0e0' : shade(col, 0.4));
  if (o.icon) icon(o.icon, x + w / 2, y + dy + h / 2, Math.min(w, h) * 0.55, o.ic || '#fff');
  if (label) txt(label, x + w / 2, y + dy + h / 2 + 2, o.size || 30, o.tc || '#fff', 'center', shade(col, -0.45));
  btns.push({ id, x, y, w, h, fn });
}
function pill(x, y, w, h, label, col = '#fff8e1') {
  box(x, y, w, h, col, '#6d4c41', 6, 4); txt(label, x + w / 2 + 12, y + h / 2 + 2, 26, '#3e2723');
}
function coinPill(x, y) { pill(x, y, 120, 44, String(Math.round(shownCoins))); drawCoin(x + 26, y + 22, 28, 0); }

// ---------- order display ----------
function tokenW(t) { return t.t === 'num' ? tw(String(t.v), 58) + 6 : t.t === 'icon' ? 52 : t.t === 'op' ? 44 : t.t === 'coin' ? 44 : tw(t.v, 34) + 10; }
function drawTokens(row, cx, cy) {
  const total = sum(row.map(tokenW)); let x = cx - total / 2;
  row.forEach(t => {
    const w = tokenW(t), mx = x + w / 2;
    if (t.t === 'num') txt(String(t.v), mx, cy + 2, 58, '#3e2723');
    else if (t.t === 'icon') drawItemIcon(t.id, mx - 24, cy - 24, 6);
    else if (t.t === 'op') txt(t.v, mx, cy, 54, '#e65100');
    else if (t.t === 'coin') drawCoin(mx, cy, 36, 0);
    else txt(t.v, mx, cy + 2, 34, '#6d4c41');
    x += w;
  });
}
function drawBubble() {
  const e = clamp((phT - 0.9) * 3, 0, 1); if (e <= 0 || !order) return;
  const s = 0.6 + 0.4 * (1 - Math.pow(1 - e, 3)), cx = 495, cy = 137;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  box(230, 62, 530, 150, '#fff', '#3e2723', 14, 5);
  ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.moveTo(262, 204); ctx.lineTo(205, 252); ctx.lineTo(310, 204); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(272, 202); ctx.lineTo(222, 242); ctx.lineTo(300, 202); ctx.fill();
  const n = order.rows.length;
  order.rows.forEach((row, i) => drawTokens(row, 495 - 14, cy + (i - (n - 1) / 2) * 68));
  ctx.restore();
  if (e >= 1) button('repeat', '', 708, 160, 44, 44, '#42a5f5', () => { say(order.spoken); }, { icon: 'speaker' });
}

// ---------- bag layout ----------
function bagLayout() {
  const out = [], groups = [], seen = {};
  bag.forEach((v, i) => { if (!(v in seen)) { seen[v] = groups.length; groups.push({ v, list: [] }); } groups[seen[v]].list.push(i); });
  let row = 0;
  groups.forEach(g => {
    g.y = 416 + row * 28;
    g.list.forEach((bi, k) => out.push({ bi, v: g.v, x: 552 + (k % 9) * 27, y: 416 + (row + Math.floor(k / 9)) * 28 }));
    row += Math.ceil(g.list.length / 9);
  });
  return { out, groups };
}

// ---------- characters ----------
function drawChar(c, x, y, k, hop = 0, wob = 0) { blit(c, x + wob, y - hop, k); }
function custPos() { return { x: cust.x, y: 352 - 144 }; }

// ---------- particles ----------
function confetti(x, y, n = 36) {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-260, 260), vy: rnd(-380, -80), c: pick(['#e53935', '#ffca28', '#42a5f5', '#66bb6a', '#ab47bc', '#ff7043']), life: rnd(0.9, 1.6), s: rint(6, 10) });
}
function spawnFly(n) {
  for (let i = 0; i < n; i++) flyCoins.push({ x: 140 + rnd(-20, 20), y: 270, t: -i * 0.12 });
}

// ---------- play flow ----------
function startPlay() { scene = 'play'; nextCustomer(); }
function nextCustomer() {
  const choices = P.customers.filter(c => c.kind !== lastKind), c = pick(choices);
  lastKind = c.kind; cust = { kind: c.kind, x: -190 };
  order = makeOrder(sv.level); bag = []; tries = 0; hl = null; caTok++; ph = 'enter'; phT = 0; newSticker = false;
}
function addToBag(v) {
  if (ph !== 'fill') return;
  if (bag.length >= 24) { SFX.bad(); say('The bag is full!'); return; }
  caTok++; hl = null; bag.push(v); pops[v] = 0.25;
  if (order.kind === 'coins') { SFX.coin(); say(String(sum(bag))); }
  else { SFX.tap(); say(String(bag.filter(x => x === v).length)); }
}
function removeFromBag(bi) { if (ph !== 'fill') return; caTok++; hl = null; shush(); bag.splice(bi, 1); SFX.pop(); }
function clearBag() { if (ph !== 'fill' || !bag.length) return; caTok++; hl = null; shush(); bag = []; SFX.pop(); }
function countAlong(idxs, labels, done) {
  const tok = ++caTok; let i = 0;
  const step = () => {
    if (tok !== caTok) return;
    if (i >= idxs.length) { hl = null; if (done) done(); return; }
    hl = { idxs, i }; SFX.tick(i);
    say(labels[i], () => { i++; step(); });
  };
  step();
}
function submit() {
  if (ph !== 'fill') return;
  if (!bag.length) { SFX.bad(); say('Put something in the bag first!'); return; }
  caTok++; hl = null;
  const r = checkBag(order, bag); tries++;
  if (r.ok) success(); else fail(r);
}
function success() {
  const first = tries === 1;
  ph = 'good'; phT = 0; shush();
  const gain = 2 + (first ? 2 : 0) + (sv.level >= 4 ? 1 : 0);
  sv.coins += gain; sv.served++;
  const st = sv.stats[sv.level] || (sv.stats[sv.level] = { n: 0, f: 0 }); st.n++; if (first) st.f++;
  if (first) { sv.streak++; sv.miss = 0; } else { sv.miss++; sv.streak = 0; }
  if (sv.streak >= 3 && sv.level < 7) {
    sv.level++; sv.streak = 0; toast = { text: 'Level up! ' + P.levels[sv.level - 1], t: 2.6 };
    setTimeout(() => { if (scene === 'play') say('Level up!'); }, 1700);
  } else if (sv.miss >= 2 && sv.level > 1) { sv.level--; sv.miss = 0; }
  if (sv.served % P.customersPerSticker === 0 && sv.stickers < STICKERS.length) { sv.stickers++; newSticker = true; }
  save(); SFX.good(); say(pick(P.praise));
  confetti(150, 250); spawnFly(gain);
}
function fail(r) {
  SFX.bad(); shake = 0.55; sadT = 1.2;
  let msg, idxs, labels;
  if (order.kind === 'coins') {
    idxs = bag.map((_, i) => i); let run = 0; labels = bag.map(v => String(run += v));
    msg = r.have < r.need ? `You gave ${r.have} coins, but I need ${r.need}. Let us count!` : `You gave ${r.have} coins, but I only need ${r.need}. Let us count!`;
  } else {
    idxs = []; bag.forEach((v, i) => { if (v === r.id) idxs.push(i); }); labels = idxs.map((_, i) => String(i + 1));
    msg = r.need === 0 ? `Oh, I did not ask for ${nameOf(r.id, 2)}. Let us count them!`
      : r.have < r.need ? `Let us count the ${nameOf(r.id, 2)}. You have ${r.have}, but I need ${r.need}.` : `Let us count the ${nameOf(r.id, 2)}. You have ${r.have}, but I only need ${r.need}.`;
  }
  const tok = ++caTok;
  say(msg, () => { if (tok !== caTok) return; if (idxs.length) countAlong(idxs, labels, () => say('Try again!')); else say('Try again!'); });
}

// ---------- update ----------
function update(dt) {
  time += dt; phT += dt; pressT = Math.max(0, pressT - dt); shake = Math.max(0, shake - dt); sadT = Math.max(0, sadT - dt);
  shownCoins = Math.abs(shownCoins - sv.coins) < 0.1 ? sv.coins : lerp(shownCoins, sv.coins, Math.min(1, dt * 6));
  for (const k in pops) { pops[k] -= dt; if (pops[k] <= 0) delete pops[k]; }
  if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
  parts.forEach(p => { p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); parts = parts.filter(p => p.life > 0);
  flyCoins.forEach(c => {
    c.t += dt; if (c.t > 0) { const e = Math.min(1, c.t / 0.9); c.px = lerp(c.x, 120, e * e); c.py = lerp(c.y, 30, e * e) - Math.sin(e * Math.PI) * 60; if (e >= 1 && !c.done) { c.done = true; SFX.coin(); } }
  });
  flyCoins = flyCoins.filter(c => !c.done);
  petObjs.forEach(p => {
    p.hop = Math.max(0, p.hop - dt);
    if (p.wait > 0) { p.wait -= dt; return; }
    p.x += p.dir * p.spd * dt;
    if (p.x < 250) { p.x = 250; p.dir = 1; } if (p.x > 590) { p.x = 590; p.dir = -1; }
    if (Math.random() < dt * 0.25) p.wait = rnd(0.6, 2);
    if (Math.random() < dt * 0.1) p.dir *= -1;
  });
  if (resetArm > 0) resetArm -= dt;
  if (gearDown && scene === 'menu') { gearHold += dt; if (gearHold > 1.2) { gearHold = 0; gearDown = false; scene = 'parent'; SFX.ui(); } }
  if (scene !== 'play' || !cust) return;
  if (ph === 'enter') {
    cust.x = lerp(-190, 60, 1 - Math.pow(1 - clamp(phT / 1.1, 0, 1), 3));
    if (phT > 1.1) { ph = 'fill'; phT = 1.1; say(order.spoken); }
  } else if (ph === 'good') {
    if (phT > 2.3) { if (newSticker) { ph = 'sticker'; phT = 0; SFX.win(); confetti(480, 250, 60); say('You got a new sticker!'); } else { ph = 'leave'; phT = 0; } }
  } else if (ph === 'sticker') {
    if (phT > 4) { ph = 'leave'; phT = 0; }
  } else if (ph === 'leave') {
    cust.x -= 340 * dt; if (cust.x < -200) nextCustomer();
  }
}

// ---------- drawing: shared ----------
function drawShopBackdrop(withPets = true) {
  ctx.drawImage(WALL, 0, 0);
  txt(P.shopName, 480, 31, 32, '#ffe082', 'center', '#3e2723');
  sv.decor.forEach(id => { if (id !== 'tank' && id !== 'lamp') drawDecor(id, time); });
  if (sv.decor.includes('tank')) drawDecor('tank', time);
  if (sv.decor.includes('lamp')) drawDecor('lamp', time);
}
function drawPets(top = 0) {
  petObjs.forEach(p => {
    const k = petScale(p.id), c = PETIMG[p.id], hopY = p.hop > 0 ? Math.sin((1 - p.hop / 0.5) * Math.PI) * 26 : (p.wait > 0 ? 0 : Math.abs(Math.sin(time * 9 + p.x)) * 3);
    const x = p.x - c.width * k / 2, y = 346 - c.height * k - hopY;
    ctx.save(); if (p.dir > 0 && p.id !== 'dragon' && p.id !== 'parrot' || (p.id === 'dragon' || p.id === 'parrot') && p.dir < 0) { ctx.translate(x + c.width * k, 0); ctx.scale(-1, 1); ctx.drawImage(c, 0, y, c.width * k, c.height * k); } else ctx.drawImage(c, x, y, c.width * k, c.height * k); ctx.restore();
  });
}
function hitPets(p) {
  for (const o of petObjs) {
    const k = petScale(o.id), c = PETIMG[o.id];
    if (Math.abs(p.x - o.x) < c.width * k / 2 + 8 && p.y > 346 - c.height * k - 12 && p.y < 352) { o.hop = 0.5; SFX.pet(); return true; }
  }
  return false;
}
function drawToast() {
  if (!toast) return;
  const w = tw(toast.text, 34) + 60, e = Math.min(1, toast.t * 3, (2.6 - toast.t) * 4 + 0.2);
  ctx.save(); ctx.globalAlpha = clamp(e, 0, 1);
  box(480 - w / 2, 262, w, 56, '#ffb300', '#6d4c41', 8, 4); txt(toast.text, 480, 291, 34, '#fff', 'center', '#e65100'); ctx.restore();
}
function drawParts() {
  parts.forEach(p => px(p.x, p.y, p.s, p.s, p.c));
  flyCoins.forEach(c => { if (c.t > 0) drawCoin(c.px, c.py, 28, 0); });
}
function topBar(extra) {
  button('back', '', 10, 8, 48, 44, '#8d6e63', () => { SFX.ui(); shush(); caTok++; scene = 'menu'; }, { icon: 'back' });
  coinPill(66, 8);
  if (extra) extra();
}

// ---------- play scene ----------
function drawPlay() {
  drawShopBackdrop();
  drawPets();
  const hopG = ph === 'good' ? Math.abs(Math.sin(phT * 9)) * 18 : 0;
  // shopkeeper (cheers when order is good)
  drawChar(KID, 800, 352 - 144, 8, hopG);
  // customer
  if (cust) {
    const wob = shake > 0 ? Math.sin(time * 40) * 6 * (shake / 0.55) : 0;
    const walk = ph === 'enter' || ph === 'leave' ? Math.abs(Math.sin(time * 12)) * 8 : 0;
    drawChar(CUST[cust.kind], cust.x, 352 - 144, 8, hopG + walk, wob);
    if (ph === 'good' || ph === 'sticker') { const hy = 330 - 40 - hopG; drawItemIcon('heart', cust.x + 118, hy - 70 + Math.sin(time * 4) * 4, 3); drawItemIcon('heart', cust.x - 30, hy - 40 + Math.cos(time * 4) * 4, 2); }
    if (sadT > 0) txt('?', cust.x + 150, 215, 40, '#e53935', 'center', '#fff');
  }
  ctx.drawImage(COUNTER, 0, 0);
  // sticker progress
  const per = P.customersPerSticker, done = sv.served % per;
  txt('Next sticker  ' + done + '/' + per, 868, 351, 17, '#5d3a1a');
  // top bar
  topBar(() => pill(194, 8, 100, 44, 'Lv ' + sv.level, '#e1f5fe'));
  drawBubble();
  // shelf
  const active = ph === 'fill';
  order && order.shelf.forEach((v, i) => {
    const x = 28 + i * 114, y = 386, pop = pops[v] ? 1 + pops[v] * 0.5 : 1;
    box(x, y, 106, 150, '#ffe0b2', '#6d4c41', 8, 4);
    ctx.save(); ctx.translate(x + 53, y + 60); ctx.scale(pop, pop);
    if (order.kind === 'coins') drawCoin(0, 0, 70, v); else drawItemIcon(v, -32, -32, 8);
    ctx.restore();
    if (order.kind === 'items') txt(item(v).many, x + 53, y + 124, 21, '#5d3a1a');
    else txt(v === 1 ? '1 coin' : v + ' coins', x + 53, y + 124, 21, '#5d3a1a');
    btns.push({ id: 'shelf' + i, x, y, w: 106, h: 150, fn: () => addToBag(v) });
  });
  // bag
  box(496, 386, 310, 198, '#e8cfa0', '#8d6e63', 10, 5);
  const lay = bagLayout();
  if (order && order.kind === 'coins') txt('Total: ' + sum(bag), 651, 404, 26, '#5d3a1a'); else txt('My bag', 651, 404, 22, '#8d6e63');
  lay.groups.forEach(g => txt(String(g.list.length), 524, g.y + 12, 22, '#5d3a1a'));
  lay.out.forEach(o => {
    const lit = hl && hl.idxs.indexOf(o.bi) >= 0 && hl.idxs.indexOf(o.bi) <= hl.i, cur = hl && hl.idxs[hl.i] === o.bi;
    if (lit) px(o.x - 2, o.y - 2, 28, 28, cur ? '#ffeb3b' : '#c5e1a5');
    if (order.kind === 'coins') drawCoin(o.x + 12, o.y + 12, 24, 0); else drawItemIcon(o.v, o.x, o.y, 3);
    if (order.kind === 'coins') txt(String(o.v), o.x + 12, o.y + 13, 12, shade(COIN_COL[o.v], -0.65));
  });
  if (!bag.length && ph === 'fill') txt(order && order.kind === 'coins' ? 'Tap coins to add' : 'Tap things to add', 651, 490, 20, '#a1887f');
  if (active) lay.out.forEach(o => btns.push({ id: 'bag' + o.bi, x: o.x - 1, y: o.y - 2, w: 27, h: 28, fn: () => removeFromBag(o.bi) }));
  // buttons
  button('done', '', 818, 388, 124, 100, '#43a047', submit, { icon: 'check', dim: !active });
  button('clear', '', 818, 498, 124, 78, '#ef5350', clearBag, { icon: 'trash', dim: !active });
  drawToast();
  if (ph === 'sticker') drawStickerPopup();
  drawParts();
}
function drawStickerCard(i, x, y, w, h, got) {
  box(x, y, w, h, got ? '#fff' : '#cfd8dc', got ? '#ffb300' : '#90a4ae', 10, 4);
  if (!got) { txt('?', x + w / 2, y + h / 2 + 2, Math.min(w, h) * 0.5, '#90a4ae'); return; }
  const id = STICKERS[i], cx = x + w / 2, cy = y + h / 2;
  if (id[0] === 'c' && id.length <= 2 && !IMG[id]) drawCoin(cx, cy, Math.min(w, h) * 0.6, +id.slice(1));
  else if (PETIMG[id]) blitC(PETIMG[id], cx, cy, Math.min(w, h) - 16);
  else blitC(IMG[id], cx, cy, Math.min(w, h) - 18);
}
function drawStickerPopup() {
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
  const s = 0.6 + 0.4 * Math.min(1, phT * 4);
  ctx.save(); ctx.translate(480, 300); ctx.scale(s, s); ctx.translate(-480, -300);
  box(300, 100, 360, 400, '#fff8e1', '#ffb300', 14, 6);
  txt('New sticker!', 480, 150, 44, '#e65100');
  drawStickerCard(sv.stickers - 1, 380, 200, 200, 200, true);
  txt('Sticker ' + sv.stickers + ' of ' + STICKERS.length, 480, 440, 26, '#5d4037');
  ctx.restore();
  btns.length = 0; btns.push({ id: 'stk', x: 0, y: 0, w: W, h: H, fn: () => { ph = 'leave'; phT = 0; } });
}

// ---------- menu scene ----------
function drawMenu() {
  drawShopBackdrop();
  drawPets();
  drawChar(KID, 400, 352 - 160, 10, shopBounce > 0 ? Math.abs(Math.sin(shopBounce * 10)) * 20 : 0);
  ctx.drawImage(COUNTER, 0, 0);
  txt('Count, add and shop!', 480, 102, 26, '#fff', 'center', '#6d4c41');
  button('gear', '', 10, 8, 48, 44, '#757575', () => {}, { icon: 'gear' });
  button('mute', '', 66, 8, 48, 44, '#42a5f5', () => { muted = !muted; try { localStorage.setItem('petshop-muted', muted ? '1' : '0'); } catch (e) {} if (muted) shush(); else SFX.ui(); }, { icon: 'sound' });
  coinPill(122, 8);
  button('play', 'PLAY', 300, 392, 360, 88, '#43a047', () => { SFX.ui(); startPlay(); }, { size: 52 });
  button('store', 'PETS & SHOP', 190, 500, 270, 70, '#ab47bc', () => { SFX.ui(); scene = 'store'; }, { size: 28 });
  button('stickers', 'STICKERS', 500, 500, 270, 70, '#ffa726', () => { SFX.ui(); scene = 'stickers'; }, { size: 28 });
  // gear hold ring
  if (gearDown) { ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(34, 30, 30, -Math.PI / 2, -Math.PI / 2 + gearHold / 1.2 * Math.PI * 2); ctx.stroke(); }
  drawToast();
}

// ---------- store scene ----------
function drawStore() {
  ctx.fillStyle = '#fff3e0'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 48) px(x, 0, 24, H, '#ffecc8');
  topBar();
  button('tabp', 'Pets', 220, 10, 250, 52, storeTab === 'pets' ? '#ab47bc' : '#b0bec5', () => { storeTab = 'pets'; SFX.ui(); }, { size: 28 });
  button('tabd', 'Decor', 490, 10, 250, 52, storeTab === 'decor' ? '#ab47bc' : '#b0bec5', () => { storeTab = 'decor'; SFX.ui(); }, { size: 28 });
  const list = storeTab === 'pets' ? P.pets : P.decor, owned = storeTab === 'pets' ? sv.pets : sv.decor;
  list.forEach((it, i) => {
    const x = 40 + (i % 4) * 226, y = 92 + Math.floor(i / 4) * 246, has = owned.includes(it.id);
    box(x, y, 206, 228, has ? '#e8f5e9' : '#fff', has ? '#66bb6a' : '#8d6e63', 10, 4);
    if (storeTab === 'pets') {
      const c = PETIMG[it.id], k = petScale(it.id) + 1, hp = Math.abs(Math.sin(time * 5 + i)) * 4;
      blit(c, x + 103 - c.width * k / 2, y + 100 - c.height * k / 2 - hp, k);
    } else {
      const d = DECOR[it.id], pw = d.pv ? d.pv.w : d.w, ph2 = d.pv ? d.pv.h : d.h, k = Math.min(160 / pw, 100 / ph2);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 23, y + 20, 160, 100); ctx.clip();
      ctx.translate(x + 103 - pw * k / 2, y + 70 - ph2 * k / 2); ctx.scale(k, k); d.draw(time); ctx.restore();
    }
    txt(it.name, x + 103, y + 146, 24, '#3e2723');
    if (has) txt('Yours!', x + 103, y + 194, 26, '#2e7d32');
    else {
      const can = sv.coins >= it.cost;
      button('buy' + it.id, 'Buy ' + it.cost, x + 23, y + 164, 160, 50, can ? '#43a047' : '#9e9e9e', () => buy(storeTab, it), { size: 24 });
    }
  });
  if (toast) drawToast();
  drawParts();
}
function buy(tab, it) {
  const owned = tab === 'pets' ? sv.pets : sv.decor;
  if (owned.includes(it.id)) return;
  if (sv.coins < it.cost) { SFX.bad(); const need = it.cost - sv.coins; toast = { text: 'You need ' + need + ' more coin' + (need === 1 ? '' : 's') + '!', t: 2 }; say('You need ' + need + ' more coins. Keep serving customers!'); return; }
  sv.coins -= it.cost; owned.push(it.id); save(); SFX.buy(); syncPets(); confetti(480, 300, 40);
  toast = { text: 'You got ' + it.name + '!', t: 2 }; say('You got ' + it.name + '!');
}

// ---------- stickers scene ----------
function drawStickers() {
  ctx.fillStyle = '#e3f2fd'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 48) px(x, 0, 24, H, '#d6ecfb');
  topBar();
  txt('Sticker Book  ' + sv.stickers + '/' + STICKERS.length, 520, 34, 38, '#0d47a1');
  STICKERS.forEach((id, i) => drawStickerCard(i, 36 + (i % 5) * 180, 90 + Math.floor(i / 5) * 122, 164, 108, i < sv.stickers));
  const left = P.customersPerSticker - (sv.served % P.customersPerSticker);
  txt(sv.stickers >= STICKERS.length ? 'You got them all! Amazing!' : 'Serve ' + left + ' more customer' + (left === 1 ? '' : 's') + ' for the next sticker!', 480, 580, 26, '#0d47a1');
}

// ---------- parent scene ----------
function drawParent() {
  ctx.fillStyle = '#263238'; ctx.fillRect(0, 0, W, H);
  topBar();
  txt('Grown-ups corner', 520, 34, 36, '#fff');
  txt('Current level', 300, 110, 26, '#b0bec5');
  txt(sv.level + ' - ' + P.levels[sv.level - 1], 300, 150, 32, '#ffeb3b');
  button('lvm', '-', 90, 176, 90, 56, '#ef5350', () => { sv.level = Math.max(1, sv.level - 1); sv.streak = sv.miss = 0; save(); }, { size: 40 });
  button('lvp', '+', 420, 176, 90, 56, '#43a047', () => { sv.level = Math.min(7, sv.level + 1); sv.streak = sv.miss = 0; save(); }, { size: 40 });
  txt('Game adjusts by itself: 3 right first tries = up, 2 hard ones in a row = down.', 300, 262, 17, '#90a4ae');
  txt('Customers served: ' + sv.served + '    Coins: ' + sv.coins + '    Stickers: ' + sv.stickers, 300, 300, 22, '#fff');
  P.levels.forEach((n, i) => {
    const st = sv.stats[i + 1] || { n: 0, f: 0 }, y = 350 + i * 32;
    txt('Level ' + (i + 1) + '  ' + n, 90, y, 21, '#cfd8dc', 'left');
    txt(st.n ? st.f + ' of ' + st.n + ' right first time' : 'not played yet', 470, y, 21, '#90caf9', 'left');
  });
  button('reset', resetArm > 0 ? 'Tap again to erase' : 'Erase all progress', 640, 480, 290, 62, '#b71c1c', () => {
    if (resetArm > 0) { Object.assign(sv, { level: 1, coins: 0, pets: [], decor: [], served: 0, stickers: 0, streak: 0, miss: 0, stats: {} }); shownCoins = 0; save(); syncPets(); resetArm = 0; scene = 'menu'; } else resetArm = 3;
  }, { size: 22 });
}

// ---------- input ----------
function ptrPos(e) {
  const b = cv.getBoundingClientRect(), s = Math.min(b.width / W, b.height / H);
  return { x: (e.clientX - b.left - (b.width - W * s) / 2) / s, y: (e.clientY - b.top - (b.height - H * s) / 2) / s };
}
cv.addEventListener('pointerdown', e => {
  audioInit(); const p = ptrPos(e);
  for (let i = btns.length - 1; i >= 0; i--) {
    const b = btns[i];
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
      if (b.id === 'gear') { gearDown = true; gearHold = 0; return; }
      pressed = b.id; pressT = 0.14; b.fn(); return;
    }
  }
  if ((scene === 'play' || scene === 'menu') && hitPets(p)) return;
  if (scene === 'menu' && p.x > 400 && p.x < 560 && p.y > 190 && p.y < 352) { shopBounce = 0.6; SFX.pet(); say('Welcome to ' + P.shopName + '!'); }
});
const endGear = () => { gearDown = false; gearHold = 0; };
cv.addEventListener('pointerup', endGear); cv.addEventListener('pointercancel', endGear); cv.addEventListener('pointerleave', endGear);
cv.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('blur', () => { shush(); caTok++; endGear(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) shush(); });

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (shopBounce > 0) shopBounce -= dt;
  update(dt);
  btns = [];
  ctx.clearRect(0, 0, W, H);
  if (scene === 'play') drawPlay(); else if (scene === 'menu') drawMenu(); else if (scene === 'store') drawStore(); else if (scene === 'stickers') drawStickers(); else drawParent();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__petshop = () => ({ scene, ph, order, bag, sv, btns: btns.map(b => b.id) }); // debug hook for testing
})();
