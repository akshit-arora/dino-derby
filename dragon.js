// Dragon Dash - colourful side-scrolling dragon flight game. Procedural pixel art, no assets, no libs.
// Nobody ever dies here: bonks just wobble Ember and spill a few coins.
(() => {
'use strict';
const N = window.DRAGON_NARRATIVE;
let W = 960, H = 600;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- utils ----------
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = a => a[Math.floor(Math.random() * a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const hyp = Math.hypot;
function seeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',') + ')';

// ---------- pixel sprite helpers ----------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c; }
function spr(rows, pal, s = 4) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = makeCanvas(w * s, h * s), g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * s, y * s, s, s); } } });
  return c;
}

// ---------- sprites ----------
const S = {};
const DPAL = { g: '#43a047', G: '#2e7d32', o: '#ffcc80', r: '#ef5350', R: '#b71c1c', k: '#111', w: '#fff', y: '#ffee58', h: '#1e88e5', H: '#0d47a1', s: '#ffcc80', t: '#fdd835', n: '#6d4c41' };
const DRAGON_A = [
  '.......hhhh',
  '......hHHHhh',
  '.rr...hssksh',
  'rrrR..ttttt.......gg',
  '.rrRR.tttt........gg',
  '..rrRgggggggggggggggg',
  'GGgggggggggggggggwkgg',
  '.GGgoooooooooooogggggy',
  '..GGgoooooooogggg.ggg',
  '....gg.gg....gg.gg'
];
const DRAGON_B = [
  '.......hhhh',
  '......hHHHhh',
  '......hssksh',
  '......ttttt.......gg',
  '.....tttt.........gg',
  'GGgggggggggggggggggg',
  'GGgggggggggggggggwkgg',
  '.GGgoooooooooooogggggy',
  '..rrrgoooooogggg.ggg',
  '...rrrRRR.gg..gg.gg'
];
S.dragon = [spr(DRAGON_A, DPAL, 5), spr(DRAGON_B, DPAL, 5)];

function mkRock(pr, seed) {
  const r = seeded(seed), s = 3, d = pr * 2 + 2, c = makeCanvas(d * s, d * s), g = c.getContext('2d');
  const cols = ['#6d4c41', '#8d6e63', '#a1887f', '#d7ccc8'];
  for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
    const dx = x - pr, dy = y - pr, dd = Math.hypot(dx, dy * 1.05);
    if (dd < pr - (r() < 0.2 ? 1 : 0)) {
      const l = 2 + (-dx * 0.6 - dy * 0.8) / pr * 1.4 + (r() - 0.5) * 0.9;
      g.fillStyle = cols[clamp(Math.round(l), 0, 3)]; g.fillRect(x * s, y * s, s, s);
    }
  }
  return c;
}
S.rock = mkRock(9, 5);
S.bush = spr([
  '...r.....r.....r..',
  '..ggg...ggg...ggg.',
  '.ggggg.ggggg.ggggg',
  'gggGgggggGgggggGgg',
  'ggggggGgggggGggggg',
  'gGggggggggggggggGg',
  'gggggggGggggGggggg',
  '.ggggggggggggggggg'], { g: '#2e9d3a', G: '#1b5e20', r: '#ff5252' }, 3);
S.crate = spr([
  'nnnnnnnnnn',
  'nBBBBBBBBn',
  'nBnBBBBnBn',
  'nBBnBBnBBn',
  'nBBBnnBBBn',
  'nBBBnnBBBn',
  'nBBnBBnBBn',
  'nBnBBBBnBn',
  'nBBBBBBBBn',
  'nnnnnnnnnn'], { n: '#6d4c41', B: '#ffb74d' }, 5);
S.cloud = spr([
  '......cccc.......ccc.....',
  '....cccccccc...ccccccc...',
  '...cccccccccccccccccccc..',
  '..ccckkcccccccccckkccccc.',
  '..cckwkcccccccccckwkcccc.',
  '..ccBBcccccccccccBBccccc.',
  '..ccccccccrrrrrcccccccc..',
  '...cccccccrcccrcccccccc..',
  '....cDDcccccccccDDcccc...',
  '.....DD..DD..DD..DD......'], { c: '#90a4ae', D: '#546e7a', k: '#111', w: '#fff', B: '#37474f', r: '#d32f2f' }, 4);
S.puff = spr([
  '..ccc.....',
  '.ccccc.cc.',
  'ccckcccccc',
  'cccccccccc',
  '.ccccccc..'], { c: '#cfd8dc', k: '#37474f' }, 5);

// power-up glyphs
const GL = {
  star: spr(['..y..', '..y..', 'yyyyy', '.yyy.', '.y.y.'], { y: '#ffd600' }, 4),
  heart: spr(['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#e91e63' }, 3),
  shield: spr(['bbbbb', 'bwwwb', 'bwwwb', '.bwb.', '..b..'], { b: '#1565c0', w: '#bbdefb' }, 4),
  triple: spr(['o..o.', '.oo.o', 'ooooo', '.oo.o', 'o..o.'], { o: '#ff6d00' }, 4),
  magnet: spr(['rr.rr', 'rr.rr', 'rr.rr', 'rrrrr', '.rrr.'], { r: '#d32f2f' }, 4),
  rainbow: spr(['.rrr.', 'roooR', 'oyyyo', 'yg.gy', 'g...g'], { r: '#e53935', o: '#fb8c00', y: '#fdd835', g: '#43a047', R: '#e53935' }, 4)
};
const PU = {
  star: { col: '#fff59d', w: 3 }, heart: { col: '#f8bbd0', w: 1 }, shield: { col: '#90caf9', w: 2 },
  triple: { col: '#ffcc80', w: 2 }, magnet: { col: '#ef9a9a', w: 2 }, rainbow: { col: '#ce93d8', w: 1 }
};
const GEM_COL = ['#e53935', '#ff9800', '#43a047', '#1e88e5', '#8e24aa'];

// ---------- themes & parallax ----------
const THEMES = [
  { sky: ['#4fc3f7', '#e1f5fe'], far: '#81c784', near: '#4caf50', gnd: '#6d4c2a', top: '#66bb6a', shape: 'hills', sun: '#fff176', cloud: '#fff' },
  { sky: ['#f8bbd0', '#fff3e0'], far: '#f48fb1', near: '#ce93d8', gnd: '#f8a56a', top: '#f06292', shape: 'hills', sun: '#fff59d', cloud: '#fff' },
  { sky: ['#311b92', '#7e57c2'], far: '#4527a0', near: '#6a4fc0', gnd: '#455a64', top: '#78909c', shape: 'spikes', sun: null, cloud: '#9575cd' },
  { sky: ['#ff7043', '#ffe082'], far: '#ffb74d', near: '#ffa726', gnd: '#d9a441', top: '#ffd54f', shape: 'hills', sun: '#fffde7', cloud: '#ffe0b2' },
  { sky: ['#78909c', '#eceff1'], far: '#b0bec5', near: '#cfd8dc', gnd: '#78909c', top: '#b0bec5', shape: 'towers', sun: '#fff', cloud: '#fff' }
];
THEMES.forEach(t => { t.skyRGB = t.sky.map(rgb); });
function mkLayer(th, h, col, seed, kind) {
  const w = 1024, c = makeCanvas(w, h), g = c.getContext('2d'), r = seeded(seed);
  const a = r() * 6, b = r() * 6, tw = Array.from({ length: 16 }, () => 0.35 + r() * 0.6);
  for (let x = 0; x < w; x += 4) {
    const t = x / w * Math.PI * 2; let hh;
    if (th.shape === 'spikes') hh = h * (0.3 + 0.65 * Math.pow(Math.abs(Math.sin(t * (kind ? 5 : 8) + a)), 0.8));
    else if (th.shape === 'towers') { hh = h * tw[Math.floor(x / 64)] * (kind ? 0.8 : 1); if (x % 24 < 8) hh -= 10; }
    else hh = h * (0.5 + 0.25 * Math.sin(t * 2 + a) + 0.15 * Math.sin(t * 5 + b) + 0.1 * Math.sin(t * 9 + a));
    hh = Math.round(hh / 4) * 4;
    g.fillStyle = col; g.fillRect(x, h - hh, 4, hh);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, h - hh, 4, 4);
  }
  return c;
}
THEMES.forEach((t, i) => { t.farL = mkLayer(t, 300, t.far, 31 + i, 0); t.nearL = mkLayer(t, 170, t.near, 71 + i, 1); });
const CLOUDS = (() => { const r = seeded(9); return Array.from({ length: 7 }, (_, i) => ({ x: i * 220 + r() * 100, y: 0.06 + r() * 0.3, s: 0.8 + r() * 0.9 })); })();

// ---------- audio ----------
let AC = null, muted = false;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
}
function tone(f, d, type = 'square', vol = 0.06, slide = 0, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  flap: () => tone(260, 0.1, 'triangle', 0.03, 180),
  fire: () => { tone(500, 0.12, 'sawtooth', 0.05, -300); },
  smash: () => { tone(220, 0.15, 'square', 0.07, -150); tone(660, 0.1, 'square', 0.05, 300, 0.05); },
  coin: () => { tone(988, 0.06, 'square', 0.035); tone(1319, 0.1, 'square', 0.035, 0, 0.05); },
  pick: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.1, 'square', 0.05, 0, i * 0.07)); },
  bonk: () => { tone(200, 0.25, 'triangle', 0.08, -120); },
  gem: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'square', 0.055, 0, i * 0.09)); },
  win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'square', 0.06, 0, i * 0.13)); },
  ui: () => { tone(880, 0.08, 'square', 0.05); tone(1320, 0.1, 'square', 0.05, 0, 0.07); },
  achoo: () => { tone(900, 0.1, 'sawtooth', 0.06, 200); tone(300, 0.4, 'sawtooth', 0.08, -200, 0.12); }
};

// ---------- input ----------
const keys = {}, pressed = {};
const ptrs = new Map(); // id -> {kind:'flap'|'fire'}
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true; audioInit();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { ptrs.clear(); for (const k in keys) keys[k] = false; if (state === 'play') state = 'pause'; });
const fireBtn = () => ({ x: W - 84, y: H - 112, r: 58 });
const muteBtn = () => ({ x: W - 88, y: 32, r: 24 });
function ptrPos(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; }
cv.addEventListener('pointerdown', e => {
  audioInit(); pressed.Tap = true;
  const p = ptrPos(e), f = fireBtn(), m = muteBtn();
  if (hyp(p.x - m.x, p.y - m.y) < m.r + 10) { muted = !muted; return; }
  const kind = state === 'play' && hyp(p.x - f.x, p.y - f.y) < f.r + 18 ? 'fire' : 'flap';
  ptrs.set(e.pointerId, { kind }); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, e => ptrs.delete(e.pointerId));
cv.addEventListener('contextmenu', e => e.preventDefault());
const held = k => { for (const p of ptrs.values()) if (p.kind === k) return true; return false; };
const flapHeld = () => held('flap') || keys.Space || keys.ArrowUp || keys.KeyW;
const fireHeld = () => held('fire') || keys.KeyF || keys.KeyX || keys.ArrowRight || keys.Enter;
function fitCanvas() {
  if (!innerWidth || !innerHeight) return;
  const a = innerWidth / innerHeight;
  if (a >= 1) { H = 600; W = Math.round(Math.min(1400, 600 * a)); } else { W = 600; H = Math.round(Math.min(1200, 600 / a)); }
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false; }
}
addEventListener('resize', fitCanvas); addEventListener('orientationchange', fitCanvas);

// ---------- game state ----------
let state = 'title', time = 0, scroll = 0, introIdx = 0, winT = 0;
let score = 0, smashes = 0, bonks = 0, level = 0, lvDist = 0, lvLen = 4000, spd = 210, nextAt = 600, patN = 0;
let phase = 'run', phaseT = 0, theme = 0, prevTheme = 0, blend = 1;
let hiscore = 0; try { hiscore = +localStorage.getItem('dragondash_hi') || 0; } catch (e) {}
let obs = [], coinsA = [], pups = [], fbs = [], parts = [], floats = [], gem = null, boss = null, gems = [];
let banner = { t: 0, text: '' }, big = { t: 0, title: '', sub: '' }, quipCd = 0, bonkTimes = [];
const P = { x: 150, y: 300, vy: 0, inv: 0, shield: false, triple: 0, magnet: 0, dash: 0, fireCd: 0, wing: 0, spin: 0 };
const gy = () => H - 60;
const playTop = () => Math.max(0, H - 640);

function quip(cat, force) {
  if (quipCd > 0 && !force) return;
  banner.text = pick(N.quips[cat]); banner.t = 2.4; quipCd = 1.8;
}
function puff(x, y, n, col, sp = 120, life = 0.6, size = 6) {
  for (let i = 0; i < n; i++) { const a = rnd(Math.PI * 2), v = rnd(sp * 0.3, sp); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, col, size: size * rnd(0.6, 1.2) }); }
}
function floater(x, y, s, col = '#fff') { floats.push({ x, y, s, col, t: 1 }); }

function startLevel(i) {
  level = i; lvDist = 0; lvLen = 4200 + i * 600; spd = 205 + i * 14; nextAt = 500; patN = 0;
  obs = []; coinsA = []; pups = []; gem = null; boss = null; phase = 'run';
  prevTheme = theme; theme = i; blend = i === 0 && prevTheme === 0 ? 1 : 0;
  big = { t: 2.8, title: 'Level ' + (i + 1), sub: N.levels[i].name };
}
function resetGame() {
  score = 0; smashes = 0; bonks = 0; gems = []; fbs = []; parts = []; floats = []; bonkTimes = [];
  Object.assign(P, { x: Math.max(110, W * 0.22), y: H / 2, vy: 0, inv: 0, shield: false, triple: 0, magnet: 0, dash: 0, fireCd: 0, spin: 0 });
  theme = 0; prevTheme = 0; startLevel(0);
}
function startGame() { resetGame(); state = 'play'; SFX.ui(); quip('start', true); }

// ---------- spawning ----------
const OB = {
  rock: { w: 56, h: 52, hp: 1, pts: 25, ground: true, img: () => S.rock },
  bush: { w: 54, h: 48, hp: 1, pts: 25, ground: true, img: () => S.bush },
  crate: { w: 50, h: 50, hp: 1, pts: 25, img: () => S.crate },
  cloud: { w: 100, h: 60, hp: 2, pts: 50, img: () => S.cloud },
  puff: { w: 50, h: 36, hp: 1, pts: 10, img: () => S.puff }
};
function addObs(type, x, y) {
  const d = OB[type], o = { type, x, y: y === undefined ? gy() - d.h / 2 : y, w: d.w, h: d.h, hp: d.hp, hit: 0, ph: rnd(6) };
  obs.push(o); return o;
}
function addPillar(top, x, len) {
  const pt = playTop();
  obs.push(top ? { type: 'pillar', x, y: (pt + len) / 2, w: 64, h: pt + len, hp: 99, top: true, hit: 0 } : { type: 'pillar', x, y: gy() - len / 2, w: 64, h: len, hp: 99, top: false, hit: 0 });
}
function coinArc(x, top, n = 5) { for (let i = 0; i < n; i++) { const k = (i - (n - 1) / 2) / ((n - 1) / 2); coinsA.push({ x: x + k * (n * 20), y: top - 30 - (1 - k * k) * 50, ph: i }); } }
function coinLine(x, y, n = 6) { for (let i = 0; i < n; i++) coinsA.push({ x: x + i * 36, y: y + Math.sin(i * 0.8) * 20, ph: i }); }
function spawnPattern() {
  const x = W + 60, pt = playTop(), g = gy(), lo = pt + 90, hi = g - 130;
  patN++;
  if (patN % 5 === 0) {
    const bag = []; for (const k in PU) for (let i = 0; i < PU[k].w; i++) bag.push(k);
    pups.push({ type: pick(bag), x: x + 40, y: rnd(lo, hi), ph: 0 }); coinLine(x + 120, rnd(lo, hi), 4); return;
  }
  const opts = ['rock', 'bush', 'crate', 'cloud', 'coins', 'double'];
  if (level >= 1) opts.push('pillar', 'pillar');
  const k = pick(opts);
  if (k === 'rock' || k === 'bush') { addObs(k, x); coinArc(x, g - 52); }
  else if (k === 'crate') { const y = rnd(lo, hi); addObs('crate', x, y); coinLine(x + 90, y, 4); }
  else if (k === 'cloud') { const y = rnd(lo, hi - 40); addObs('cloud', x, y); coinLine(x + 110, y + rnd(-40, 40), 5); }
  else if (k === 'coins') coinLine(x, rnd(lo, hi), 8);
  else if (k === 'double') { addObs('rock', x); addObs('crate', x + 170, rnd(lo, hi - 60)); coinArc(x + 85, g - 120, 5); }
  else { const top = Math.random() < 0.5; addPillar(top, x, top ? rint(120, 190) : rint(130, 210)); coinLine(x - 60, top ? pt + 280 : g - 280, 5); }
}

// ---------- gameplay events ----------
function bonk(o) {
  if (P.inv > 0 || P.dash > 0) return;
  if (P.shield) { P.shield = false; P.inv = 0.8; puff(P.x, P.y, 14, '#90caf9', 160, 0.5, 6); SFX.bonk(); return; }
  bonks++; P.inv = 1.6; P.vy = -230; SFX.bonk(); quip('bonk');
  const lost = Math.min(score, 15); score -= lost;
  for (let i = 0; i < 3; i++) parts.push({ x: P.x, y: P.y, vx: rnd(-120, 40), vy: rnd(-200, -60), life: 1, max: 1, col: '#ffd54f', size: 8, g: 600 });
  const now = time; bonkTimes = bonkTimes.filter(t => now - t < 12); bonkTimes.push(now);
  if (bonkTimes.length >= 3) { bonkTimes = []; P.shield = true; quip('shield', true); }
  if (o && o.type !== 'pillar') destroy(o, false);
}
function destroy(o, reward) {
  o.dead = true; const c = o.type === 'cloud' ? '#cfd8dc' : o.type === 'bush' ? '#4caf50' : o.type === 'crate' ? '#ffb74d' : '#a1887f';
  puff(o.x, o.y, 16, c, 220, 0.6, 7); puff(o.x, o.y, 8, '#fff59d', 180, 0.5, 5);
  if (reward) {
    score += OB[o.type].pts; smashes++; floater(o.x, o.y - 20, '+' + OB[o.type].pts, '#fff59d'); SFX.smash();
    if (smashes === 1 || smashes % 7 === 0) quip('smash');
    if (o.type === 'cloud') for (let i = 0; i < 3; i++) coinsA.push({ x: o.x + (i - 1) * 30, y: o.y, ph: i });
  }
}
function fire() {
  if (P.fireCd > 0) return;
  P.fireCd = 0.3; SFX.fire();
  const vys = P.triple > 0 ? [-130, 0, 130] : [0];
  for (const vy of vys) fbs.push({ x: P.x + 70, y: P.y + 4, vx: 640, vy });
  puff(P.x + 60, P.y + 4, 4, '#ffee58', 90, 0.25, 5);
}
function usePu(p) {
  SFX.pick(); puff(p.x, p.y, 14, PU[p.type].col, 160, 0.6, 6);
  if (p.type === 'star') { score += 50; floater(p.x, p.y, '+50', '#ffd600'); }
  else if (p.type === 'heart') { score += 100; P.vy = -280; floater(p.x, p.y, '+100', '#f48fb1'); puff(P.x, P.y, 12, '#f48fb1', 120, 0.9, 6); }
  else if (p.type === 'shield') { P.shield = true; quip('shield', true); }
  else if (p.type === 'triple') { P.triple = 12; quip('powerUp', true); }
  else if (p.type === 'magnet') { P.magnet = 10; quip('powerUp', true); }
  else if (p.type === 'rainbow') { P.dash = 3; P.inv = 3; quip('powerUp', true); }
}
function winGame() {
  state = 'win'; winT = 0; SFX.win(); fbs = []; obs = []; coinsA = [];
  if (score > hiscore) { hiscore = score; try { localStorage.setItem('dragondash_hi', hiscore); } catch (e) {} }
}
function collectGem() {
  gems[level] = true; score += 200; SFX.gem(); puff(P.x + 40, P.y, 30, GEM_COL[level], 260, 0.9, 8); puff(P.x + 40, P.y, 20, '#fff', 200, 0.7, 5);
  floater(P.x + 20, P.y - 40, '+200', '#fff');
  gem = null;
  if (level >= 4) { winGame(); return; }
  banner.text = N.levels[level].line; banner.t = 2.8; phase = 'banner'; phaseT = 3;
}

// ---------- update ----------
function update(dt) {
  time += dt; quipCd -= dt;
  const pt = playTop(), g = gy();
  if (state === 'title' || state === 'win') { scroll += 110 * dt; P.x = Math.max(110, W * 0.22); P.y = H / 2 + Math.sin(time * 2) * 22; if (state === 'win') winT += dt; blend = Math.min(1, blend + dt / 1.5); updateParts(dt); return; }
  const dashMul = P.dash > 0 ? 1.8 : 1, v = spd * dashMul;
  scroll += v * dt; blend = Math.min(1, blend + dt / 1.5);
  // player
  const up = flapHeld();
  P.vy += (up ? -1400 : 900) * dt; P.vy = clamp(P.vy, -330, 360);
  P.y += P.vy * dt;
  const ceil = pt + 30, floor = g - 24;
  if (P.y < ceil) { P.y = ceil; P.vy = Math.max(P.vy, 0); }
  if (P.y > floor) { P.y = floor; P.vy = Math.min(P.vy, 0); }
  P.x = Math.max(110, W * 0.22);
  P.inv = Math.max(0, P.inv - dt); P.triple = Math.max(0, P.triple - dt); P.magnet = Math.max(0, P.magnet - dt); P.dash = Math.max(0, P.dash - dt); P.fireCd -= dt;
  P.wing += dt * (up ? 9 : 3.5); if (up && Math.floor(P.wing) !== Math.floor(P.wing - dt * 9) && Math.random() < 0.25) SFX.flap();
  if ((fireHeld() || P.triple > 0) && phase !== 'banner') fire();
  if (P.dash > 0 && Math.random() < 0.9) parts.push({ x: P.x - 50, y: P.y + rnd(-10, 14), vx: -60, vy: 0, life: 0.6, max: 0.6, col: pick(['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa']), size: 8 });
  // level flow
  if (phase === 'run') {
    lvDist += v * dt;
    if (lvDist >= nextAt && lvDist < lvLen - 500) { spawnPattern(); nextAt += rnd(400, 560) * (1 + 0.2 * (dashMul - 1)); }
    if (lvDist >= lvLen) {
      for (const o of obs) if (o.type !== 'pillar' || o.x > W) o.dead = true;
      if (level >= 4) enterBoss(); else { phase = 'gem'; gem = { x: W + 40, y: P.y, t: 0 }; }
    }
  } else if (phase === 'banner') { phaseT -= dt; if (phaseT <= 0) startLevel(level + 1); }
  // gem
  if (gem) {
    gem.t += dt;
    if (gem.x > P.x + 220) { gem.x -= spd * 0.9 * dt; gem.y = lerp(gem.y, P.y, dt * 1.5); }
    else { const dx = P.x + 30 - gem.x, dy = P.y - gem.y, d = hyp(dx, dy) || 1; gem.x += dx / d * 260 * dt; gem.y += dy / d * 260 * dt; }
    if (hyp(gem.x - (P.x + 30), gem.y - P.y) < 36) collectGem();
  }
  // boss
  if (boss) updateBoss(dt);
  // obstacles
  for (const o of obs) {
    o.x -= v * dt; o.hit = Math.max(0, o.hit - dt);
    if (o.type === 'puff') { o.x -= 60 * dt; o.y += Math.sin(time * 4 + o.ph) * 30 * dt; }
    if (o.dead || o.x < -120) { o.dead = true; continue; }
    if (o.type !== 'pillar' && o.x < -60) continue;
    const pad = o.type === 'pillar' ? 1 : 0.8;
    if (Math.abs(P.x - o.x) < (66 + o.w * pad) / 2 && Math.abs(P.y + 2 - o.y) < (34 + o.h * pad) / 2) {
      if (P.dash > 0 && o.type !== 'pillar') destroy(o, true); else if (P.inv <= 0) bonk(o);
    }
  }
  obs = obs.filter(o => !o.dead);
  // fireballs
  for (const f of fbs) {
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.x > W + 40 || f.y < 0 || f.y > H) { f.dead = true; continue; }
    for (const o of obs) {
      if (o.dead) continue;
      const pad = o.type === 'pillar' ? 1 : 0.95;
      if (Math.abs(f.x - o.x) < (16 + o.w * pad) / 2 && Math.abs(f.y - o.y) < (16 + o.h * pad) / 2) {
        f.dead = true;
        if (o.type === 'pillar') puff(f.x, f.y, 6, '#ffcc80', 100, 0.3, 4);
        else { o.hp--; o.hit = 0.15; if (o.hp <= 0) destroy(o, true); else { puff(f.x, f.y, 6, '#fff', 100, 0.3, 4); SFX.smash(); } }
        break;
      }
    }
    if (!f.dead && boss && boss.hp > 0 && boss.hurtCd <= 0 && Math.abs(f.x - boss.x) < 90 && Math.abs(f.y - boss.y) < 100) { f.dead = true; hurtBoss(); }
  }
  fbs = fbs.filter(f => !f.dead); obs = obs.filter(o => !o.dead);
  // coins
  for (const c of coinsA) {
    c.x -= v * dt;
    if (P.magnet > 0 || P.dash > 0) { const dx = P.x - c.x, dy = P.y - c.y, d = hyp(dx, dy); if (d < 260 && d > 1) { c.x += dx / d * 420 * dt; c.y += dy / d * 420 * dt; } }
    if (hyp(c.x - P.x, c.y - P.y) < 38) { c.dead = true; score += 10; SFX.coin(); puff(c.x, c.y, 4, '#ffd54f', 80, 0.3, 4); }
    if (c.x < -30) c.dead = true;
  }
  coinsA = coinsA.filter(c => !c.dead);
  for (const p of pups) { p.x -= v * dt; p.ph += dt; if (hyp(p.x - P.x, p.y - P.y) < 48) { p.dead = true; usePu(p); } if (p.x < -50) p.dead = true; }
  pups = pups.filter(p => !p.dead);
  updateParts(dt);
  if (banner.t > 0) banner.t -= dt; if (big.t > 0) big.t -= dt;
}
function updateParts(dt) {
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; p.life -= dt; }
  parts = parts.filter(p => p.life > 0);
  for (const f of floats) { f.y -= 40 * dt; f.t -= dt; }
  floats = floats.filter(f => f.t > 0);
}
function enterBoss() {
  phase = 'boss'; boss = { x: W + 220, y: H / 2, hp: 3, hurtCd: 0, hit: 0, t: 0, sneeze: 3.5, happy: 0 };
  P.triple = Math.max(P.triple, 20);
  banner.text = N.grumbly[0] + ' ' + N.grumbly[1]; banner.t = 4.5;
  big = { t: 2.5, title: 'Help Grumbly!', sub: N.grumbly[1] };
}
function hurtBoss() {
  boss.hp--; boss.hurtCd = 0.6; boss.hit = 0.4; SFX.achoo(); puff(boss.x - 40, boss.y, 18, '#fff', 220, 0.7, 7);
  floater(boss.x - 20, boss.y - 100, boss.hp > 0 ? 'ACHOO!' : 'Ahh... better!', '#fff');
  if (boss.hp <= 0) { boss.happy = 2.5; score += 300; for (const o of obs) o.dead = true; }
}
function updateBoss(dt) {
  const b = boss; b.t += dt; b.hurtCd -= dt; b.hit -= dt;
  const pt = playTop(), tx = W - 150;
  if (b.x > tx) b.x = Math.max(tx, b.x - 160 * dt);
  const mid = (pt + gy()) / 2; b.y = mid + Math.sin(b.t * 0.9) * Math.min(150, (gy() - pt) / 2 - 110);
  if (b.hp > 0) {
    b.sneeze -= dt;
    if (b.sneeze <= 0 && b.x <= tx + 2) { b.sneeze = 3.2; const o = addObs('puff', b.x - 90, b.y + 10); o.x = b.x - 90; }
  } else {
    b.happy -= dt;
    if (Math.random() < 0.2) parts.push({ x: b.x + rnd(-80, 80), y: b.y - 90, vx: 0, vy: -70, life: 1.2, max: 1.2, col: '#f48fb1', size: 9 });
    if (b.happy <= 0) { boss = null; phase = 'gem'; gem = { x: W + 40, y: P.y, t: 0 }; }
  }
}

// ---------- drawing ----------
function text(s, x, y, size, col = '#fff', align = 'center', stroke = 'rgba(0,0,0,0.65)') {
  ctx.font = 'bold ' + size + 'px "Trebuchet MS",Verdana,sans-serif'; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function wrap(s, size, maxW) {
  ctx.font = 'bold ' + size + 'px "Trebuchet MS",Verdana,sans-serif';
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function drawSpr(img, x, y, ang = 0, alpha = 1) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (ang) ctx.rotate(ang); if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
}
function drawBG() {
  const th = THEMES[theme], pv = THEMES[prevTheme], g = gy();
  const grad = ctx.createLinearGradient(0, 0, 0, g);
  grad.addColorStop(0, mix(pv.skyRGB[0], th.skyRGB[0], blend)); grad.addColorStop(1, mix(pv.skyRGB[1], th.skyRGB[1], blend));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  if (th.sun) { ctx.fillStyle = th.sun; ctx.beginPath(); ctx.arc(W * 0.8, playTop() + 100, 36, 0, 7); ctx.fill(); ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(W * 0.8, playTop() + 100, 56, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  const cl = th.cloud;
  for (const c of CLOUDS) {
    const x = ((c.x - scroll * 0.08) % 1500 + 1500) % 1500 - 100, y = playTop() + c.y * 500, s = c.s;
    ctx.fillStyle = cl; ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y, 80 * s, 22 * s); ctx.fillRect(x + 14 * s, y - 14 * s, 44 * s, 16 * s); ctx.fillRect(x + 40 * s, y - 6 * s, 56 * s, 14 * s);
    ctx.globalAlpha = 1;
  }
  const layer = (L, f, h) => {
    const o = -((scroll * f) % 1024);
    for (let x = o; x < W; x += 1024) ctx.drawImage(L, Math.round(x), g - L.height + 6);
  };
  for (const [t, a] of [[pv, 1], [th, blend]]) { if (a < 1 && t === th && pv === th) continue; ctx.globalAlpha = a; layer(t.farL, 0.2); layer(t.nearL, 0.45); }
  ctx.globalAlpha = 1;
  // cave stalactites (cosmetic)
  if (theme === 2) { ctx.fillStyle = '#4527a0'; const o = -((scroll * 0.6) % 120); for (let x = o; x < W; x += 120) { const hh = 30 + ((x / 120 | 0) % 3) * 22; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 30, hh); ctx.fill(); } }
  // ground
  ctx.fillStyle = mix(rgb(pv.gnd), rgb(th.gnd), blend); ctx.fillRect(0, g, W, H - g);
  ctx.fillStyle = mix(rgb(pv.top), rgb(th.top), blend); ctx.fillRect(0, g, W, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; const go = -(scroll % 48); for (let x = go; x < W; x += 48) ctx.fillRect(x, g + 24, 20, 6);
}
function drawPillar(o) {
  const th = THEMES[theme], x = o.x - o.w / 2, y = o.y - o.h / 2, col = th.near;
  ctx.fillStyle = '#5d4a8a'; if (theme === 3) ctx.fillStyle = '#b8742a'; if (theme === 4) ctx.fillStyle = '#607d8b'; if (theme < 2) ctx.fillStyle = '#7b5e57';
  ctx.fillRect(x, y, o.w, o.h);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x, y, 12, o.h);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + o.w - 12, y, 12, o.h);
  ctx.fillStyle = '#ffd54f'; const cy = o.top ? y + o.h - 10 : y; ctx.fillRect(x - 6, cy, o.w + 12, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let i = 20; i < o.h - 10; i += 28) ctx.fillRect(x + 12, y + i, o.w - 24, 4);
}
function drawDragon() {
  if (P.inv > 0 && P.dash <= 0 && Math.floor(time * 12) % 2) return;
  const f = Math.floor(P.wing) & 1, ang = clamp(P.vy / 900, -0.3, 0.3) + (P.inv > 1 ? Math.sin(time * 40) * 0.08 : 0);
  if (P.shield) { ctx.strokeStyle = 'rgba(144,202,249,0.9)'; ctx.fillStyle = 'rgba(144,202,249,0.25)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(P.x, P.y, 72, 0, 7); ctx.fill(); ctx.stroke(); }
  drawSpr(S.dragon[f], P.x + 10, P.y - 6, ang);
}
function drawGemShape(x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x - r * 0.8, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
}
function drawBoss() {
  const b = boss, x = b.x, y = b.y, flash = b.hit > 0 && Math.floor(time * 20) % 2;
  ctx.fillStyle = flash ? '#fff' : '#b0bec5';
  for (const [dx, dy, r] of [[-30, -60, 60], [50, -50, 55], [-70, 10, 62], [60, 20, 65], [0, 40, 70], [0, -10, 80]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); }
  const happy = b.hp <= 0;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 50, y - 25, 20, 0, 7); ctx.arc(x + 5, y - 25, 20, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x - 54, y - 22, 8, 0, 7); ctx.arc(x + 1, y - 22, 8, 0, 7); ctx.fill();
  ctx.fillStyle = happy ? '#f48fb1' : '#e53935'; ctx.beginPath(); ctx.arc(x - 70, y + 5, 22, 0, 7); ctx.fill();
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 5; ctx.beginPath();
  if (happy) ctx.arc(x - 20, y + 20, 28, 0.1, Math.PI - 0.1); else ctx.arc(x - 20, y + 62, 28, Math.PI + 0.3, -0.3);
  ctx.stroke();
  if (!happy) { ctx.fillStyle = '#4fc3f7'; ctx.fillRect(x - 60, y - 2 + (time * 40 % 20), 5, 9); }
  // hp pips
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i < b.hp ? '#e53935' : 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 40 + i * 28, y - 135, 22, 10); }
}
function drawHUD() {
  text('★ ' + score, 16, 38, 28, '#fff', 'left');
  // progress bar
  const bw = W - 150;
  const f2 = phase === 'run' ? clamp(lvDist / lvLen, 0, 1) : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(16, 52, bw, 12);
  ctx.fillStyle = GEM_COL[level]; ctx.fillRect(16, 52, bw * f2, 12);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(16, 52, bw, 12);
  for (let i = 0; i < 5; i++) { const x = 28 + i * 34; if (gems[i]) drawGemShape(x, 90, 12, GEM_COL[i]); else { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 90, 9, 0, 7); ctx.stroke(); } }
  // power timers
  let py = 120; const tm = [['triple', P.triple, 12], ['magnet', P.magnet, 10], ['rainbow', P.dash, 3]];
  if (P.shield) { ctx.drawImage(GL.shield, 16, py - 10, 24, 24); py += 30; }
  for (const [k, v, mx] of tm) if (v > 0) { ctx.drawImage(GL[k], 16, py - 10, 24, 24); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(48, py, 80, 8); ctx.fillStyle = '#fff'; ctx.fillRect(48, py, 80 * Math.min(1, v / mx), 8); py += 30; }
  // buttons
  const m = muteBtn(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
  text(muted ? 'x' : '♪', m.x, m.y + 9, 26);
  if (state === 'play') {
    const f = fireBtn(), on = fireHeld();
    ctx.fillStyle = on ? '#ff9800' : 'rgba(255,87,34,0.88)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#ffee58'; ctx.beginPath(); ctx.moveTo(f.x, f.y - 30); ctx.quadraticCurveTo(f.x + 28, f.y - 2, f.x + 8, f.y + 18); ctx.quadraticCurveTo(f.x, f.y + 6, f.x - 8, f.y + 18); ctx.quadraticCurveTo(f.x - 28, f.y - 2, f.x, f.y - 30); ctx.fill();
    text('FIRE', f.x, f.y + 46, 20);
  }
}
function overlayBox(h) { const bw = Math.min(W - 32, 720), bx = (W - bw) / 2, by = H / 2 - h / 2; ctx.fillStyle = 'rgba(20,10,60,0.72)'; ctx.fillRect(bx, by, bw, h); ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 4; ctx.strokeRect(bx, by, bw, h); return { bw, bx, by }; }
function render() {
  drawBG();
  for (const o of obs) {
    if (o.type === 'pillar') { drawPillar(o); continue; }
    const img = OB[o.type].img();
    let y = o.y; if (o.type === 'cloud' || o.type === 'crate') y += Math.sin(time * 2 + o.ph) * 5;
    if (o.hit > 0) { ctx.globalAlpha = 0.6; } drawSpr(img, o.x, y); ctx.globalAlpha = 1;
  }
  for (const c of coinsA) {
    const w = Math.abs(Math.cos(time * 4 + c.ph)) * 9 + 3;
    ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.ellipse(c.x, c.y, w + 2, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe082'; ctx.beginPath(); ctx.ellipse(c.x, c.y, w, 9, 0, 0, 7); ctx.fill();
  }
  for (const p of pups) {
    const y = p.y + Math.sin(p.ph * 3) * 6;
    ctx.fillStyle = PU[p.type].col; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x, y, 38 + Math.sin(p.ph * 5) * 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = PU[p.type].col; ctx.beginPath(); ctx.arc(p.x, y, 28, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    const gl = GL[p.type]; ctx.drawImage(gl, Math.round(p.x - gl.width / 2), Math.round(y - gl.height / 2));
  }
  if (boss) drawBoss();
  if (gem) { ctx.globalAlpha = 0.3; ctx.fillStyle = GEM_COL[level]; ctx.beginPath(); ctx.arc(gem.x, gem.y, 34 + Math.sin(time * 6) * 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; drawGemShape(gem.x, gem.y, 22, GEM_COL[level]); }
  drawDragon();
  for (const f of fbs) { ctx.fillStyle = '#ff6d00'; ctx.beginPath(); ctx.arc(f.x, f.y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#ffee58'; ctx.beginPath(); ctx.arc(f.x + 3, f.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,109,0,0.5)'; ctx.fillRect(f.x - 26, f.y - 4, 20, 8); }
  for (const p of parts) { const a = clamp(p.life / p.max, 0, 1); ctx.globalAlpha = a; ctx.fillStyle = p.col; const s = p.size * (0.4 + 0.6 * a); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
  ctx.globalAlpha = 1;
  for (const f of floats) { ctx.globalAlpha = clamp(f.t * 2, 0, 1); text(f.s, f.x, f.y, 22, f.col); } ctx.globalAlpha = 1;
  if (state === 'title') drawTitle();
  else {
    drawHUD();
    if (big.t > 0 && state === 'play') { ctx.globalAlpha = clamp(big.t, 0, 1); text(big.title, W / 2, H / 2 - 60, Math.min(64, W / 9), '#fff59d'); text(big.sub, W / 2, H / 2 - 18, Math.min(30, W / 20), '#fff'); ctx.globalAlpha = 1; }
    if (banner.t > 0 && state === 'play') { ctx.globalAlpha = clamp(banner.t, 0, 1); const ls = wrap(banner.text, 24, W - 50); ls.forEach((l, i) => text(l, W / 2, H - 150 - (ls.length - 1 - i) * 30 + 0, 24, '#fff')); ctx.globalAlpha = 1; }
    if (state === 'pause') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H); text('PAUSED', W / 2, H / 2 - 10, 60, '#fff59d'); text('Tap to keep flying', W / 2, H / 2 + 36, 26); }
    if (state === 'win') drawWin();
  }
}
function drawTitle() {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
  const bob = Math.sin(time * 3) * 4;
  text(N.title, W / 2, 110 + bob, Math.min(76, W / 8.5), '#ffee58');
  text(N.subtitle, W / 2, 152, Math.min(26, W / 22), '#fff');
  const L = wrap(N.intro[introIdx], 26, Math.min(W - 80, 640)), h = 70 + L.length * 34, b = overlayBox(h);
  L.forEach((l, i) => text(l, W / 2, b.by + 52 + i * 34, 26, '#fff', 'center', 'rgba(0,0,0,0.4)'));
  const last = introIdx >= N.intro.length - 1;
  if (Math.floor(time * 2) % 2) text(last ? 'TAP TO FLY!' : 'TAP for next', W / 2, b.by + h + 46, 30, '#a5d6a7');
  text('Hold to flap up, let go to glide. FIRE to blast!', W / 2, H - 86, Math.min(20, W / 26), '#fff');
  text('BEST ' + hiscore, W / 2, H - 56, 18, '#ffe082');
}
function drawWin() {
  const stars = score >= 3200 ? 3 : score >= 1800 ? 2 : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
  const lines = N.ending.flatMap(s => wrap(s, 22, Math.min(W - 80, 640))), h = 230 + lines.length * 30, b = overlayBox(h);
  text('You did it, Ashwik!', W / 2, b.by + 54, Math.min(46, W / 13), '#fff59d');
  for (let i = 0; i < 3; i++) { const x = W / 2 + (i - 1) * 64, on = i < stars && winT > 0.4 + i * 0.4; ctx.globalAlpha = on ? 1 : 0.25; drawGemShape(x, b.by + 108, 26, on ? '#ffd600' : '#888'); }
  ctx.globalAlpha = 1;
  lines.forEach((l, i) => text(l, W / 2, b.by + 168 + i * 30, 22, '#fff', 'center', 'rgba(0,0,0,0.4)'));
  text('Score ' + score + '   Best ' + hiscore, W / 2, b.by + 188 + lines.length * 30, 24, '#ffe082');
  if (winT > 1.5 && Math.floor(time * 2) % 2) text('TAP to fly again', W / 2, b.by + h + 44, 30, '#a5d6a7');
}

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (pressed.KeyM) muted = !muted;
  if (pressed.KeyP || pressed.Escape) { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; }
  const go = pressed.Tap || pressed.Enter || pressed.Space;
  if (go) {
    if (state === 'title') { if (introIdx < N.intro.length - 1) { introIdx++; SFX.ui(); } else startGame(); }
    else if (state === 'pause') state = 'play';
    else if (state === 'win' && winT > 1.5) { introIdx = 0; resetGame(); state = 'play'; SFX.ui(); }
  }
  for (const k in pressed) delete pressed[k];
  if (state !== 'pause') update(dt);
  render();
  requestAnimationFrame(frame);
}
fitCanvas();
resetGame(); state = 'title';
window.__d = {
  get state() { return state; }, get score() { return score; }, get level() { return level; }, get phase() { return phase; }, get P() { return P; },
  get obs() { return obs; }, get boss() { return boss; }, get bonks() { return bonks; }, startGame,
  skip() { lvDist = lvLen; }, give(t) { usePu({ type: t, x: P.x, y: P.y }); }, setLevel(i) { gems = []; for (let k = 0; k < i; k++) gems[k] = true; startLevel(i); },
  hitBoss() { if (boss) hurtBoss(); }, step(sec) { for (let i = 0; i < sec * 60; i++) update(1 / 60); render(); }
};
requestAnimationFrame(frame);
})();
