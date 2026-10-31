// Dino Derby - procedural pixel art top-down car game. No assets, no libs.
(() => {
'use strict';
const N = window.NARRATIVE;
let W = 960, H = 600; const WORLD = 2600, EDGE = 44;
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

// ---------- pixel sprite helpers ----------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c; }
function spr(rows, pal, s = 3) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = makeCanvas(w * s, h * s), g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * s, y * s, s, s); } } });
  return c;
}
function recolor(pal, map) { const p = Object.assign({}, pal); for (const k in map) p[k] = map[k]; return p; }

// ---------- sprites ----------
const S = {};
const CAR = [
  '.rrrrrrrrrrrrr..',
  'rrrrrRRRRrrrrrry',
  'rrrrRBBBBRrrrrrr',
  'rrrrRBBBBRrrrrrr',
  'rrrrrRRRRrrrrrry',
  '.rrrrrrrrrrrrr..'];
const CARPAL = { r: '#e53935', R: '#8e1b1b', B: '#90caf9', y: '#fff59d' };
S.car = spr(CAR, CARPAL, 3);
S.carHurt = spr(CAR, recolor(CARPAL, { r: '#ff8a80' }), 3);

const DINO = {
  compy: {
    pal: { g: '#9ccc3c', G: '#558b2f', k: '#111', y: '#ffeb3b', w: '#fff' },
    A: ['..G..G..', 'gggggggg', 'ggggggky', 'gggggggg', '..G..G..'],
    B: ['.G..G...', 'gggggggg', 'ggggggky', 'gggggggg', '...G..G.'],
    sc: 4
  },
  raptor: {
    pal: { o: '#ff9800', O: '#bf4a00', k: '#111', y: '#ffe082', w: '#fff' },
    A: ['...O..O.....', '..oooooooook', 'Oooooooooooy', 'OOooooooooyy', 'Oooooooooooy', '..oooooooook', '...O..O.....'],
    B: ['..O..O......', '..oooooooook', 'Oooooooooooy', 'OOooooooooyy', 'Oooooooooooy', '..oooooooook', '....O..O....'],
    sc: 4
  },
  trike: {
    pal: { b: '#78909c', B: '#455a64', f: '#ef6c4a', W: '#fffde7', k: '#111', w: '#fff' },
    A: ['...B..B...........', '..bbbbbbb.fffff...', '.bbbbbbbbbffffff..', 'bbbbbbbbbbffffkbW.', 'bbbbbbbbbbfbbbbbWW', 'bbbbbbbbbbffffkbW.', '.bbbbbbbbbffffff..', '..bbbbbbb.fffff...', '...B..B...........'],
    B: ['..B..B............', '..bbbbbbb.fffff...', '.bbbbbbbbbffffff..', 'bbbbbbbbbbffffkbW.', 'bbbbbbbbbbfbbbbbWW', 'bbbbbbbbbbffffkbW.', '.bbbbbbbbbffffff..', '..bbbbbbb.fffff...', '....B..B..........'],
    sc: 4
  },
  rex: {
    pal: { g: '#3f9142', G: '#1b5e20', s: '#7bc67e', k: '#111', w: '#fff', r: '#c62828', y: '#ffd54f' },
    A: [
      '......G....G..............',
      '...gggggggggggg...........',
      '..gsggsggsggggggg....gggg.',
      '.gggggggggggggggggggggggg.',
      'GgggggggggggggggggggyggGkw',
      'GGgggggggggggggggggggggrww',
      'GgggggggggggggggggggyggGkw',
      '.gggggggggggggggggggggggg.',
      '..gsggsggsggggggg....gggg.',
      '...gggggggggggg...........',
      '......G....G..............'],
    B: [
      '.....G....G...............',
      '...gggggggggggg...........',
      '..gsggsggsggggggg....gggg.',
      '.gggggggggggggggggggggggg.',
      'GgggggggggggggggggggyggGkw',
      'GGgggggggggggggggggggggrww',
      'GgggggggggggggggggggyggGkw',
      '.gggggggggggggggggggggggg.',
      '..gsggsggsggggggg....gggg.',
      '...gggggggggggg...........',
      '.......G....G.............'],
    sc: 4
  }
};
const DS = {};
for (const k in DINO) {
  const d = DINO[k];
  const panicPal = recolor(d.pal, { k: '#fff', y: '#ff5252' });
  const hurtPal = recolor(d.pal, Object.fromEntries(Object.keys(d.pal).map(c => [c, '#ffffff'])));
  DS[k] = {
    A: spr(d.A, d.pal, d.sc), B: spr(d.B, d.pal, d.sc),
    PA: spr(d.A, panicPal, d.sc), PB: spr(d.B, panicPal, d.sc),
    H: spr(d.A, hurtPal, d.sc)
  };
}

// trees / rocks (procedural pixel circles)
function mkTree(seed) {
  const r = seeded(seed), s = 3, c = makeCanvas(22 * s, 28 * s), g = c.getContext('2d');
  g.fillStyle = '#5d3a1a'; g.fillRect(9 * s, 20 * s, 4 * s, 8 * s);
  g.fillStyle = '#3e2610'; g.fillRect(12 * s, 20 * s, 1 * s, 8 * s);
  const greens = ['#1f5a2a', '#2e7d32', '#43a047', '#66bb6a'];
  for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
    const dx = x - 10.5, dy = y - 10.5, d = Math.hypot(dx, dy);
    if (d < 10.5 - (r() < 0.12 ? 1 : 0)) {
      let l = 2 + (-dx * 0.5 - dy * 0.7) / 10 * 1.6 + (r() - 0.5) * 1.1;
      g.fillStyle = greens[clamp(Math.round(l), 0, 3)]; g.fillRect(x * s, y * s, s, s);
    }
  }
  if (r() < 0.6) for (let i = 0; i < 4; i++) { g.fillStyle = '#e53935'; g.fillRect(rint(4, 16) * s, rint(4, 16) * s, s, s); }
  return c;
}
S.trees = [mkTree(11), mkTree(22), mkTree(33)];
function mkRock(pr, seed) {
  const r = seeded(seed), s = 3, d = pr * 2 + 2, c = makeCanvas(d * s, d * s), g = c.getContext('2d');
  const cols = ['#4a4f57', '#6b717a', '#8b919b', '#b5bac4'];
  for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
    const dx = x - pr, dy = y - pr, dd = Math.hypot(dx, dy * 1.1);
    if (dd < pr - (r() < 0.2 ? 1 : 0)) {
      const l = 2 + (-dx * 0.6 - dy * 0.8) / pr * 1.4 + (r() - 0.5) * 0.9;
      g.fillStyle = cols[clamp(Math.round(l), 0, 3)]; g.fillRect(x * s, y * s, s, s);
    }
  }
  return c;
}
S.rocks = [mkRock(6, 5), mkRock(8, 6), mkRock(10, 7)];

// ground tiles
function mkTile(kind, seed) {
  const r = seeded(seed), t = 16, s = 4, c = makeCanvas(t * s, t * s), g = c.getContext('2d');
  const base = kind === 0 ? ['#4f9a34', '#58a53b', '#468c2e'] : ['#b89466', '#c4a174', '#a98457'];
  for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) { g.fillStyle = base[r() < 0.8 ? 0 : (r() < 0.5 ? 1 : 2)]; g.fillRect(x * s, y * s, s, s); }
  if (kind === 0) {
    for (let i = 0; i < 6; i++) { const x = rint(0, 15), y = rint(0, 14); g.fillStyle = '#3a7a26'; g.fillRect(x * s, y * s, s, s); g.fillRect(x * s, (y + 1) * s, s, s); }
    if (r() < 0.35) { const x = rint(1, 14), y = rint(1, 14); g.fillStyle = pick(['#fff176', '#f48fb1', '#fff', '#ce93d8']); g.fillRect(x * s, y * s, s, s); }
  } else for (let i = 0; i < 4; i++) { g.fillStyle = '#8f6b43'; g.fillRect(rint(0, 15) * s, rint(0, 15) * s, s, s); }
  return c;
}
let worldImg;
function buildWorld() {
  const c = makeCanvas(WORLD, WORLD), g = c.getContext('2d');
  const tiles = [0, 1, 2, 3].map(i => mkTile(0, i + 1)), dirt = [0, 1].map(i => mkTile(1, i + 9));
  const rr = seeded(777), nx = rr() * 100, ny = rr() * 100;
  const n = (x, y) => Math.sin(x * 0.07 + nx) + Math.sin(y * 0.09 + ny) + Math.sin((x + y) * 0.05) * 0.8 + Math.sin((x - y) * 0.11 + nx);
  for (let ty = 0; ty < WORLD / 64 + 1; ty++) for (let tx = 0; tx < WORLD / 64 + 1; tx++) {
    const isDirt = n(tx, ty) > 1.9;
    g.drawImage(isDirt ? dirt[(tx + ty) & 1] : tiles[(tx * 7 + ty * 13) & 3], tx * 64, ty * 64);
  }
  // border
  g.fillStyle = '#1d3b1e';
  g.fillRect(0, 0, WORLD, EDGE); g.fillRect(0, WORLD - EDGE, WORLD, EDGE); g.fillRect(0, 0, EDGE, WORLD); g.fillRect(WORLD - EDGE, 0, EDGE, WORLD);
  g.fillStyle = '#2c552d';
  for (let i = 0; i < WORLD; i += 12) { const o = (i / 12) % 2 ? 6 : 0; g.fillRect(i, EDGE - 12 - o, 8, 12 + o); g.fillRect(i, WORLD - EDGE, 8, 12 + o); g.fillRect(EDGE - 12 - o, i, 12 + o, 8); g.fillRect(WORLD - EDGE, i, 12 + o, 8); }
  g.fillStyle = '#6d4c2a';
  for (let i = 0; i < WORLD; i += 40) { g.fillRect(i, EDGE - 4, 6, 4); g.fillRect(i, WORLD - EDGE, 6, 4); g.fillRect(EDGE - 4, i, 4, 6); g.fillRect(WORLD - EDGE, i, 4, 6); }
  worldImg = c;
}
buildWorld();

// HUD icons
const ICON = {
  heart: spr(['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff4d6d' }, 3),
  bolt: spr(['...yy', '..yy.', '.yyyy', '..yy.', '.yy..', 'y....'], { y: '#ffe14d' }, 3),
  wrench: spr(['.ww.ww.', '.wwwww.', '..www..', '..www..', '..www..', '..www..', '...w...'], { w: '#4dd0e1' }, 3),
  star: spr(['..y..', '..y..', 'yyyyy', '.yyy.', '.y.y.'], { y: '#fff176' }, 3),
  star2: spr(['.y.', 'yyy', '.y.'], { y: '#fff59d' }, 3),
  flag: spr(['kkkk', 'krrk', 'kkrk', 'k...', 'k...'], { k: '#fff', r: '#ef5350' }, 3)
};

// ---------- audio ----------
let AC = null, muted = false, engOsc = null, engGain = null;
function audioInit() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    engOsc = AC.createOscillator(); engGain = AC.createGain();
    engOsc.type = 'sawtooth'; engOsc.frequency.value = 50; engGain.gain.value = 0;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    engOsc.connect(lp); lp.connect(engGain); engGain.connect(AC.destination); engOsc.start();
  } catch (e) { AC = null; }
}
function tone(f, d, type = 'square', vol = 0.06, slide = 0, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  hit: () => { tone(440, 0.12, 'square', 0.07, -300); tone(660, 0.1, 'square', 0.05, 200, 0.05); },
  big: () => { tone(120, 0.25, 'sawtooth', 0.1, -80); tone(300, 0.15, 'square', 0.06, -200); },
  hurt: () => { tone(160, 0.3, 'sawtooth', 0.1, -100); },
  boost: () => { tone(200, 0.4, 'sawtooth', 0.06, 500); },
  ui: () => { tone(880, 0.08, 'square', 0.05); tone(1320, 0.1, 'square', 0.05, 0, 0.07); },
  stomp: () => { tone(70, 0.4, 'sawtooth', 0.14, -40); },
  pick: () => { tone(660, 0.08, 'square', 0.05); tone(990, 0.12, 'square', 0.05, 0, 0.07); },
  roar: () => { tone(110, 0.8, 'sawtooth', 0.12, -60); tone(90, 0.8, 'square', 0.06, -40); },
  lose: () => { [400, 300, 220, 150].forEach((f, i) => tone(f, 0.25, 'square', 0.07, 0, i * 0.2)); },
  win: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.06, 0, i * 0.13)); },
  jump: () => { tone(300, 0.15, 'triangle', 0.04, 300); },
  squeak: () => { tone(1200, 0.06, 'square', 0.025, 400); }
};

// ---------- input ----------
const keys = {};
const pressed = {};
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true; audioInit();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { ptrs.clear(); for (const k in keys) keys[k] = false; if (state === 'play') state = 'pause'; });
// ---------- touch / pointer input ----------
let touchMode = false;
const ptrs = new Map(); // id -> {x,y,boost}
const boostBtn = () => ({ x: W - 80, y: H - 190, r: 56 });
const revBtn = () => ({ x: 80, y: H - 190, r: 56 });
let boostReq = false;
function ptrPos(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; }
cv.addEventListener('pointerdown', e => {
  audioInit(); pressed.Enter = true; if (e.pointerType !== 'mouse') touchMode = true;
  const p = ptrPos(e), b = boostBtn();
  const rb = revBtn();
  p.boost = state === 'play' && hyp(p.x - b.x, p.y - b.y) < b.r + 14;
  p.rev = state === 'play' && !p.boost && hyp(p.x - rb.x, p.y - rb.y) < rb.r + 14;
  ptrs.set(e.pointerId, p); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  if (p.boost) boostReq = true;
});
cv.addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId); if (p && !p.boost && !p.rev) Object.assign(p, ptrPos(e)); });
for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, e => ptrs.delete(e.pointerId));
cv.addEventListener('contextmenu', e => e.preventDefault());
function touchSteer() { // -1..1 toward the finger, or null
  const rev = car.vf < -5 || [...ptrs.values()].some(q => q.rev);
  for (const p of ptrs.values()) { if (p.boost || p.rev) continue;
    const dx = p.x - (car.x - cam.x), dy = p.y - (car.y - cam.y); if (hyp(dx, dy) < 40) return 0;
    let da = Math.atan2(dy, dx) - car.a - (rev ? Math.PI : 0); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    return clamp(da * 2.5, -1, 1); }
  return null;
}
function fitCanvas() {
  const a = innerWidth / innerHeight;
  if (a >= 1) { H = 600; W = Math.round(Math.min(1400, 600 * a)); } else { W = 600; H = Math.round(Math.min(1200, 600 / a)); }
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
}
addEventListener('resize', fitCanvas); addEventListener('orientationchange', fitCanvas);
const K = {
  up: () => keys.ArrowUp || keys.KeyW || keys.__always, down: () => keys.ArrowDown || keys.KeyS || [...ptrs.values()].some(p => p.rev),
  left: () => keys.ArrowLeft || keys.KeyA, right: () => keys.ArrowRight || keys.KeyD
};

// ---------- species config ----------
const SP = {
  compy: { r: 16, hp: 1, speed: 120, sight: 300, turn: 5, pts: 150, hider: true, fight: 0, hurt: 0, name: 'compy' },
  raptor: { r: 20, hp: 1, speed: 135, sight: 320, turn: 5, pts: 100, hider: false, fight: 0, hurt: 0, burst: 1.1, jumper: false, name: 'raptor' },
  trike: { r: 32, hp: 1, speed: 75, sight: 260, turn: 3, pts: 300, hider: false, fight: 0, hurt: 0, charge: 0, name: 'trike' },
  rex: { r: 46, hp: 4, speed: 85, sight: 340, turn: 2.2, pts: 2500, hider: false, fight: 0, hurt: 0, charge: 0, name: 'rex' }
};

// ---------- game state ----------
let state = 'title', time = 0, shake = 0, hitstop = 0;
let car, dinos, obstacles, particles, floaters, skids, pickups, cam, hiscore = 0;
let waveStarted = false;
let score, combo, comboT, wave, waveTotal, waveKilled, waveEscaped, nextWaveT, introT, kills, escaped, bestCombo, seenSpecies, firstKill;
try { hiscore = +localStorage.getItem('dinoderby_hi') || 0; } catch (e) {}

// ---------- narrator ----------
const nar = { cur: null, t: 0, hold: 0, queue: [], lastQuip: -99 };
function say(text, dur = 3.4) { nar.queue.push({ text, dur }); }
function sayNow(text, dur = 3.4) { nar.queue.length = 0; nar.cur = { text, dur }; nar.t = 0; nar.hold = 0; }
function quip(key, force) {
  const list = N.quips[key]; if (!list) return;
  if (!force && (nar.cur || nar.queue.length || time - nar.lastQuip < 3.5)) return;
  nar.lastQuip = time;
  if (force) sayNow(pick(list), 3); else say(pick(list), 2.6);
}
function updateNarrator(dt) {
  if (!nar.cur && nar.queue.length) { nar.cur = nar.queue.shift(); nar.t = 0; nar.hold = 0; }
  if (nar.cur) {
    nar.t += dt * 55;
    if (nar.t >= nar.cur.text.length) { nar.hold += dt; if (nar.hold > nar.cur.dur) nar.cur = null; }
  }
}
function wrapText(text, maxW) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line); return lines;
}

// ---------- world setup ----------
function genObstacles() {
  obstacles = [];
  const r = seeded(4242);
  const place = (n, mk) => { let tries = 0; while (n > 0 && tries++ < 3000) {
    const x = rnd(EDGE + 60, WORLD - EDGE - 60), y = rnd(EDGE + 60, WORLD - EDGE - 60);
    if (hyp(x - WORLD / 2, y - WORLD / 2) < 200) continue;
    const o = mk(x, y); if (obstacles.some(q => hyp(q.x - o.x, q.y - o.y) < q.r + o.r + 60)) continue;
    obstacles.push(o); n--; } };
  place(90, (x, y) => ({ kind: 'tree', x, y, r: 13, img: pick(S.trees) }));
  place(45, (x, y) => { const i = rint(0, 2); return { kind: 'rock', x, y, r: [17, 23, 28][i], img: S.rocks[i] }; });
}
function resetGame() {
  car = { x: WORLD / 2, y: WORLD / 2 + 120, a: -Math.PI / 2, vx: 0, vy: 0, r: 21, hp: 100, boost: 0, boostCd: 0, wheel: 0, steer: 0, hurtT: 0, speed: 0, vf: 0, vl: 0, stompHit: 0 };
  dinos = []; particles = []; floaters = []; skids = []; pickups = [];
  cam = { x: car.x - W / 2, y: car.y - H / 2 };
  waveStarted = false; score = 0; combo = 0; comboT = 0; wave = 0; waveTotal = 0; waveKilled = 0; waveEscaped = 0; nextWaveT = 1.5; introT = 0;
  kills = 0; escaped = 0; bestCombo = 0; seenSpecies = {}; firstKill = true;
  nar.cur = null; nar.queue.length = 0; nar.lastQuip = -99; shake = 0;
}

function waveSpec(w) {
  return [
    { raptor: 2, compy: 2 },
    { compy: 3, raptor: 3 },
    { raptor: 3, compy: 3, trike: 1 },
    { raptor: 4, compy: 3, trike: 2 },
    { raptor: 4, compy: 4, trike: 2 },
    { rex: 1, raptor: 3, compy: 3 }
  ][w];
}
function spawnWave() {
  const spec = waveSpec(wave); let gid = 0;
  waveTotal = 0; waveKilled = 0; waveEscaped = 0;
  for (const type in spec) {
    let left = spec[type];
    while (left > 0) {
      const n = type === 'rex' ? 1 : Math.min(left, rint(2, 4)); left -= n;
      let gx, gy, t = 0;
      do { gx = rnd(EDGE + 150, WORLD - EDGE - 150); gy = rnd(EDGE + 150, WORLD - EDGE - 150); } while (hyp(gx - car.x, gy - car.y) < 380 && t++ < 50);
      for (let i = 0; i < n; i++) addDino(type, gx + rnd(-50, 50), gy + rnd(-50, 50), gid);
      gid++;
    }
  }
  for (const type in spec) if (!seenSpecies[type] && type !== 'rex') { seenSpecies[type] = 1; const sp = N.species[type]; if (sp) say(sp.name + ': ' + sp.desc, 4); }
  seenSpecies.rex = 1;
  if (spec.rex) { quip('bossAppears', true); SFX.roar(); shake = 18; }
  pickups.push({ x: rnd(300, WORLD - 300), y: rnd(300, WORLD - 300), t: 0 });
}
function addDino(type, x, y, group) {
  const T = SP[type];
  dinos.push({ type, x, y, vx: 0, vy: 0, hp: T.hp, maxhp: T.hp, r: T.r, group, panic: false, panicT: 0, calmT: 0, hitCd: 0, atkCd: rnd(0, 1), nm: 0,
    wa: rnd(Math.PI * 2), anim: rnd(10), jump: 0, jumpCd: rnd(0, 2), fighter: Math.random() < T.fight, state: 'idle', stompT: 0, stun: 0, face: rnd(Math.PI * 2), emote: 0, flash: 0, scatterDelay: 0, hide: null, speedMul: rnd(0.92, 1.08) });
}

// ---------- effects ----------
function puff(x, y, n, col = '#d9c9a0', sp = 80, life = 0.6, size = 5) {
  for (let i = 0; i < n; i++) { const a = rnd(Math.PI * 2), s = rnd(sp * 0.3, sp);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(life * 0.6, life), max: life, size: rnd(size * 0.6, size), col, kind: 'dust' }); }
}
function stars(x, y, n) {
  for (let i = 0; i < n; i++) { const a = rnd(Math.PI * 2), s = rnd(80, 260);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: rnd(0.5, 1), max: 1, size: 0, col: '', kind: Math.random() < 0.5 ? 'star' : 'star2', rot: 0, g: 200 }); }
}
function feathers(x, y, n, col) {
  for (let i = 0; i < n; i++) { const a = rnd(Math.PI * 2), s = rnd(40, 200);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.7, 1.3), max: 1.3, size: rnd(3, 6), col: pick([col, '#fff', '#ffe082']), kind: 'feather' }); }
}
function floater(x, y, text, col = '#fff', size = 22) { floaters.push({ x, y, text, col, size, life: 1, vy: -50 }); }

// ---------- game logic ----------
function startGame() {
  resetGame(); genObstacles(); state = 'play'; SFX.ui();
  N.intro.forEach(l => say(l, 3.2));
}
function addCombo() {
  combo++; comboT = 2.6; bestCombo = Math.max(bestCombo, combo);
  if (combo === 3 || combo === 6 || combo === 10 || combo === 15) quip('combo', true);
}
const mult = () => Math.min(10, 1 + Math.floor(combo / 2));

function killDino(d, hitAng) {
  const T = SP[d.type];
  const pts = T.pts * mult(); score += pts; kills++; waveKilled++; addCombo();
  const col = { compy: '#9ccc3c', raptor: '#ff9800', trike: '#90a4ae', rex: '#4caf50' }[d.type];
  stars(d.x, d.y, d.type === 'rex' ? 30 : 9); feathers(d.x, d.y, d.type === 'rex' ? 30 : 12, col); puff(d.x, d.y, d.type === 'rex' ? 16 : 7, '#e6dcc0', 140, 0.7, 8);
  floater(d.x, d.y - 30, pick(['POOF!', 'BONK!', 'BOING!', 'YEET!', 'ZAP!']), '#fff176', 24);
  floater(d.x, d.y - 8, '+' + pts, '#ffffff', 16);
  shake = Math.max(shake, d.type === 'rex' ? 26 : d.type === 'trike' ? 11 : 5); hitstop = d.type === 'rex' ? 0.25 : 0.04;
  d.dead = true; (d.type === 'rex' ? SFX.big : SFX.hit)();
  if (d.type === 'rex') { quip('bossDefeated', true); }
  else if (firstKill) { firstKill = false; quip('firstKill', true); }
}
function hurtCar(dmg, ang, push = 260) {
  return; // kid mode: the car is indestructible
  if (car.hurtT > 0 && dmg < 12) return;
  car.hp -= dmg; car.hurtT = 0.45; shake = Math.max(shake, 6 + dmg * 0.6); SFX.hurt();
  car.vx += Math.cos(ang) * push; car.vy += Math.sin(ang) * push;
  combo = Math.max(0, combo - 2); puff(car.x, car.y, 8, '#555', 90, 0.6, 6);
  floater(car.x, car.y - 30, '-' + Math.round(dmg), '#ff6b6b', 20);
  if (car.hp <= 30 && car.hp > 0) quip('lowHealth'); else quip('carDamaged');
  if (car.hp <= 0) { car.hp = 0; gameOver(); }
}
function gameOver() {
  state = 'over'; SFX.lose(); puff(car.x, car.y, 30, '#444', 160, 1.2, 10); stars(car.x, car.y, 14);
  sayNow(pick(N.quips.gameOver), 99);
  if (score > hiscore) { hiscore = score; try { localStorage.setItem('dinoderby_hi', hiscore); } catch (e) {} }
}
function victory() {
  state = 'win'; SFX.win(); if (score > hiscore) { hiscore = score; try { localStorage.setItem('dinoderby_hi', hiscore); } catch (e) {} }
  sayNow(pick(N.quips.victory), 99);
}

function updateCar(dt) {
  const fx = Math.cos(car.a), fy = Math.sin(car.a), rx = -fy, ry = fx;
  let vf = car.vx * fx + car.vy * fy, vl = car.vx * rx + car.vy * ry;
  const boosting = car.boost > 0;
  if ((keys.Space || boostReq || [...ptrs.values()].some(p => p.boost)) && car.boostCd <= 0 && state === 'play') { car.boost = 1.1; car.boostCd = 2.5; SFX.boost(); shake = Math.max(shake, 4); quip('boost'); puff(car.x - fx * 20, car.y - fy * 20, 10, '#ffd54f', 120, 0.4, 5); }
  boostReq = false;
  car.boost = Math.max(0, car.boost - dt); car.boostCd = Math.max(0, car.boostCd - dt); car.hurtT = Math.max(0, car.hurtT - dt);
  const maxF = car.boost > 0 ? 470 : 290;
  if (!K.down()) vf += (car.boost > 0 ? 1000 : 430) * dt;
  else if (K.down()) { if (vf > 15) vf -= 800 * dt; else vf -= 260 * dt; }
  else vf *= Math.max(0, 1 - 0.9 * dt);
  vf = clamp(vf, -120, maxF);
  if (vf > maxF - 1 && !boosting) vf = Math.min(vf, maxF);
  let s = (K.right() ? 1 : 0) - (K.left() ? 1 : 0);
  if (!s) { const ts = touchSteer(); if (ts !== null) s = ts; }
  car.steer = lerp(car.steer, s, Math.min(1, dt * 12));
  const sr = 3.8 * clamp(Math.abs(vf) / 140, 0, 1) * (vf < 0 ? -1 : 1) * (1 - Math.max(0, Math.abs(vf) - 300) / 900);
  car.a += car.steer * sr * dt;
  // recompute with new heading -> lateral velocity appears => drift
  const nfx = Math.cos(car.a), nfy = Math.sin(car.a), nrx = -nfy, nry = nfx;
  let vx = car.vx * 0 + vf * fx, vy = vf * fy; // keep forward speed along old axis blended below
  let ovx = car.vx, ovy = car.vy;
  let nf = ovx * nfx + ovy * nfy, nl = ovx * nrx + ovy * nry;
  nf += (vf - (ovx * fx + ovy * fy)) * 1; // apply throttle delta
  const handbrake = K.down() && Math.abs(nf) > 120 && s !== 0;
  const grip = handbrake ? 1.4 : (Math.abs(car.steer) > 0.3 && Math.abs(nf) > 220 ? 3.6 : 6.5);
  nl *= Math.exp(-grip * dt);
  car.vx = nfx * nf + nrx * nl; car.vy = nfy * nf + nry * nl;
  car.vf = nf; car.vl = nl; car.speed = hyp(car.vx, car.vy);
  car.x += car.vx * dt; car.y += car.vy * dt;
  car.wheel += nf * dt;
  // drift marks + dust
  if (Math.abs(nl) > 55 && car.speed > 90) {
    for (const o of [-1, 1]) skids.push({ x: car.x - nfx * 14 + nrx * o * 10, y: car.y - nfy * 14 + nry * o * 10, a: car.a, life: 5 });
    if (skids.length > 500) skids.splice(0, skids.length - 500);
    if (Math.random() < 0.6) puff(car.x - nfx * 16, car.y - nfy * 16, 1, '#d9c9a0', 40, 0.6, 7);
  } else if (car.speed > 120 && Math.random() < 0.25) puff(car.x - nfx * 18 + rnd(-6, 6), car.y - nfy * 18 + rnd(-6, 6), 1, '#cdbf9a', 30, 0.5, 5);
  if (car.boost > 0) particles.push({ x: car.x - nfx * 24, y: car.y - nfy * 24, vx: -nfx * 60 + rnd(-30, 30), vy: -nfy * 60 + rnd(-30, 30), life: 0.35, max: 0.35, size: rnd(4, 8), col: pick(['#ffd54f', '#ff9800', '#ff5722']), kind: 'dust' });
  // world bounds
  const m = EDGE + car.r;
  if (car.x < m) { car.x = m; car.vx = Math.abs(car.vx) * 0.4; } if (car.x > WORLD - m) { car.x = WORLD - m; car.vx = -Math.abs(car.vx) * 0.4; }
  if (car.y < m) { car.y = m; car.vy = Math.abs(car.vy) * 0.4; } if (car.y > WORLD - m) { car.y = WORLD - m; car.vy = -Math.abs(car.vy) * 0.4; }
  // obstacles
  for (const o of obstacles) {
    const dx = car.x - o.x, dy = car.y - o.y, d = hyp(dx, dy), md = o.r + car.r - 2;
    if (d < md && d > 0) {
      const nx = dx / d, ny = dy / d; car.x = o.x + nx * md; car.y = o.y + ny * md;
      const vn = car.vx * nx + car.vy * ny;
      if (vn < 0) { car.vx -= 1.5 * vn * nx; car.vy -= 1.5 * vn * ny;
        const imp = -vn; if (imp > 140) { const dm = (imp - 120) * 0.045 * (o.kind === 'rock' ? 1.3 : 0.8); hurtCar(dm, Math.atan2(ny, nx), 0); shake = Math.max(shake, 7); puff(o.x + nx * o.r, o.y + ny * o.r, 6, o.kind === 'tree' ? '#66bb6a' : '#aaa', 90, 0.5, 5); } else if (imp > 40) SFX.squeak(); }
    }
  }
}

function updateDino(d, dt) {
  const T = SP[d.type];
  d.hitCd -= dt; d.atkCd -= dt; d.nm -= dt; d.jumpCd -= dt; d.stun -= dt; d.flash -= dt; d.emote -= dt; d.scatterDelay -= dt;
  const dx = d.x - car.x, dy = d.y - car.y, dist = hyp(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const cfx = Math.cos(car.a), cfy = Math.sin(car.a);
  const aligned = clamp((cfx * -ux + cfy * -uy), 0, 1); // car heading toward dino
  const sight = T.sight * (d.panic ? 1.25 : 1);
  const threatening = car.speed > 30 || dist < 150;
  if (d.scatterDelay <= 0 && d.scatterDelay > -1) { d.scatterDelay = -5; if (!d.panic) setPanic(d); }
  if (dist < sight && threatening && state !== 'win') { if (!d.panic) setPanic(d); d.calmT = 0; }
  else if (d.panic) { d.calmT += dt; if (d.calmT > 1.8) { d.panic = false; d.panicT = 0; d.hide = null; } }
  if (d.panic) d.panicT += dt;

  let ax = 0, ay = 0, spd = T.speed * 0.28 * d.speedMul, turn = T.turn;
  if (d.stun > 0) { spd = 0; ax = 0; ay = 0; }
  else if (d.state === 'stomp') {
    d.stompT -= dt; spd = 0;
    if (d.stompT <= 0) {
      d.state = 'idle'; d.atkCd = 2.2; SFX.stomp(); shake = Math.max(shake, 22);
      puff(d.x, d.y, 24, '#c9b88c', 260, 0.8, 10);
      particles.push({ x: d.x, y: d.y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 0, kind: 'ring', col: '#fff' });
      if (hyp(car.x - d.x, car.y - d.y) < 150) hurtCar(14, Math.atan2(car.y - d.y, car.x - d.x), 420);
    }
  } else if (d.panic) {
    const charging = d.fighter && dist < 460 && T.charge;
    if (charging) {
      d.state = 'charge';
      // lead the target a bit
      const lead = clamp(dist / T.charge, 0, 1);
      const tx = car.x + car.vx * lead * 0.5 - d.x, ty = car.y + car.vy * lead * 0.5 - d.y, tl = hyp(tx, ty) || 1;
      ax = tx / tl; ay = ty / tl; spd = T.charge * d.speedMul;
      if (d.type === 'rex' && dist < 150 && d.atkCd <= 0) { d.state = 'stomp'; d.stompT = 0.75; d.emote = 0; floater(d.x, d.y - 60, 'STOMP!', '#ff8a65', 24); SFX.roar(); }
    } else {
      d.state = 'flee';
      // away + perpendicular dodge
      const rx = -cfy, ry = cfx; const side = (dx * rx + dy * ry) >= 0 ? 1 : -1;
      const dodge = clamp(1 - dist / 260, 0, 1) * (0.2 + aligned * 0.5);
      ax = ux + rx * side * dodge * 1.5; ay = uy + ry * side * dodge * 1.5;
      // slight pull to arena center to avoid pinning at walls
      const cx = WORLD / 2 - d.x, cy = WORLD / 2 - d.y, cl = hyp(cx, cy) || 1;
      const edgeness = clamp((hyp(d.x - WORLD / 2, d.y - WORLD / 2) - 800) / 500, 0, 1);
      ax += cx / cl * (0.12 + edgeness * 0.9); ay += cy / cl * (0.12 + edgeness * 0.9);
      // hide behind obstacles
      if (T.hider || (d.type === 'trike' && !d.fighter) ) {
        if (!d.hide || Math.random() < 0.01) {
          let best = null, bd = 380;
          for (const o of obstacles) { const od = hyp(o.x - d.x, o.y - d.y); if (od < bd && o.r >= 13) { // must be on the far side from car relative to us (not toward car)
            const odc = hyp(o.x - car.x, o.y - car.y); if (odc > od * 0.8) { bd = od; best = o; } } }
          d.hide = best;
        }
        if (d.hide) {
          const o = d.hide, ox = o.x - car.x, oy = o.y - car.y, ol = hyp(ox, oy) || 1;
          const tx = o.x + ox / ol * (o.r + d.r + 6), ty = o.y + oy / ol * (o.r + d.r + 6);
          const hx = tx - d.x, hy = ty - d.y, hl = hyp(hx, hy);
          if (hl < 10 && dist > 110) { ax = 0; ay = 0; spd = 0; d.state = 'hide'; }
          else if (dist > 90) { const w = 1.4; ax = ax * 0.5 + hx / hl * w; ay = ay * 0.5 + hy / hl * w; }
        }
      }
      spd = T.speed * d.speedMul * (1 + (d.type === 'raptor' && dist < 230 ? T.burst - 1 : 0.12));
      if (d.type === 'trike' || d.type === 'rex') spd = T.speed * 1.1 * d.speedMul;
      // jump away
      if (T.jumper && d.jump <= 0 && d.jumpCd <= 0 && dist < 120 && aligned > 0.65 && car.speed > 120) {
        d.jump = 0.5; d.jumpCd = rnd(1.6, 3); SFX.jump(); const rx2 = -cfy, ry2 = cfx; const sd = side;
        d.vx += rx2 * sd * 330; d.vy += ry2 * sd * 330; floater(d.x, d.y - 28, 'HUP!', '#ffffff', 14);
      }
    }
  } else {
    // calm: wander with herd cohesion
    d.wa += rnd(-1, 1) * dt * 2; ax = Math.cos(d.wa); ay = Math.sin(d.wa);
    let gx = 0, gy = 0, gc = 0;
    for (const o of dinos) if (o !== d && o.group === d.group) { gx += o.x; gy += o.y; gc++; }
    if (gc) { gx = gx / gc - d.x; gy = gy / gc - d.y; const gl = hyp(gx, gy); if (gl > 70) { ax += gx / gl * 0.9; ay += gy / gl * 0.9; } }
    const cx = WORLD / 2 - d.x, cy = WORLD / 2 - d.y, cl = hyp(cx, cy);
    if (cl > 1000) { ax += cx / cl * 1.2; ay += cy / cl * 1.2; }
    d.state = 'idle';
  }
  // separation + obstacle avoid
  for (const o of dinos) if (o !== d) { const sx = d.x - o.x, sy = d.y - o.y, sd = hyp(sx, sy), md = d.r + o.r + 8; if (sd < md && sd > 0) { ax += sx / sd * (d.panic ? 1.4 : 0.6); ay += sy / sd * (d.panic ? 1.4 : 0.6); } }
  for (const o of obstacles) { const sx = d.x - o.x, sy = d.y - o.y, sd = hyp(sx, sy), md = o.r + d.r + 24; if (sd < md && sd > 0 && d.state !== 'hide') { ax += sx / sd * 1.1; ay += sy / sd * 1.1; } }
  const al = hyp(ax, ay);
  let tvx = 0, tvy = 0; if (al > 0.001 && spd > 0) { tvx = ax / al * spd; tvy = ay / al * spd; }
  if (d.jump > 0) { d.jump -= dt; tvx = d.vx; tvy = d.vy; turn = 0; if (d.jump <= 0) d.jump = 0; } else {
    d.vx += (tvx - d.vx) * Math.min(1, turn * dt); d.vy += (tvy - d.vy) * Math.min(1, turn * dt);
  }
  if (d.stun > 0) { d.vx *= Math.max(0, 1 - 3 * dt); d.vy *= Math.max(0, 1 - 3 * dt); }
  d.x += d.vx * dt; d.y += d.vy * dt;
  const sp = hyp(d.vx, d.vy);
  if (sp > 12) d.face = Math.atan2(d.vy, d.vx);
  else if (d.state === 'charge' || d.state === 'stomp') d.face = Math.atan2(car.y - d.y, car.x - d.x);
  d.anim += dt * (d.panic ? 16 : 7) * clamp(sp / 120, 0.3, 2);
  // obstacles hard collide
  if (d.jump <= 0) for (const o of obstacles) { const sx = d.x - o.x, sy = d.y - o.y, sd = hyp(sx, sy), md = o.r + d.r * 0.8; if (sd < md && sd > 0) { d.x = o.x + sx / sd * md; d.y = o.y + sy / sd * md; } }
  // world edge / escape
  const m = EDGE + d.r;
  let atEdge = false;
  if (d.x < m) { d.x = m; atEdge = true; d.vx = Math.abs(d.vx) * 0.2; } if (d.x > WORLD - m) { d.x = WORLD - m; atEdge = true; d.vx = -Math.abs(d.vx) * 0.2; }
  if (d.y < m) { d.y = m; atEdge = true; d.vy = Math.abs(d.vy) * 0.2; } if (d.y > WORLD - m) { d.y = WORLD - m; atEdge = true; d.vy = -Math.abs(d.vy) * 0.2; }
  if (false && atEdge && d.panic && d.panicT > 1.2 && d.type !== 'rex' && dist > 200) {
    d.escaped = true; d.dead = true; escaped++; waveEscaped++; waveKilled++;
    floater(d.x, d.y - 20, 'ESCAPED!', '#80d8ff', 18); quip('dinoEscapes'); puff(d.x, d.y, 8, '#fff', 100, 0.5, 5);
  }
}
function setPanic(d) {
  d.panic = true; d.panicT = 0; d.emote = 1.2;
  if (Math.random() < 0.5) SFX.squeak();
  for (const o of dinos) if (o !== d && !o.panic && hyp(o.x - d.x, o.y - d.y) < 220) o.scatterDelay = rnd(0.05, 0.35); // herd scatters
}

function carDinoCollide() {
  for (const d of dinos) {
    if (d.dead || d.jump > 0.12 || (d.type === 'rex' && d.state === 'stomp' && false)) continue;
    const dx = d.x - car.x, dy = d.y - car.y, dist = hyp(dx, dy), md = car.r + d.r;
    const T = SP[d.type];
    if (dist < md + 22 && dist > md - 2 && car.speed > 190 && d.nm <= 0 && d.hitCd <= 0 && d.type !== 'rex') { d.nm = 2.5; score += 25 * mult(); floater(d.x, d.y - 26, 'CLOSE!', '#b3e5fc', 16); quip('nearMiss'); }
    if (dist >= md + 22) continue;
    const ang = Math.atan2(dy, dx);
    const sp = car.speed;
    if (sp > 20 && d.hitCd <= 0) {
      const dmg = d.type === 'rex' ? 1 + (car.boost > 0 ? 2 : 0) : 9;
      d.hp -= dmg; d.hitCd = 0.7;
      if (d.hp <= 0) killDino(d, ang);
      else {
        d.vx = Math.cos(ang) * 420; d.vy = Math.sin(ang) * 420; d.stun = 0.5; d.flash = 0.2; setPanic(d);
        car.vx *= 0.55; car.vy *= 0.55; shake = Math.max(shake, 12); hitstop = 0.06; stars(d.x, d.y, 8); puff(d.x, d.y, 6, '#e6dcc0', 100, 0.5, 6);
        floater(d.x, d.y - 32, 'OOF!', '#ffcc80', 22); SFX.big();
        if (T.hurt) hurtCar(T.hurt * 0.5, ang + Math.PI, 120);
        if (d.type === 'rex') { d.atkCd = Math.max(d.atkCd, 0.6); floater(d.x, d.y - 50, d.hp + ' HP', '#fff', 14); }
      }
    } else if (d.state === 'charge' && d.atkCd <= 0 && d.stun <= 0 && T.hurt) {
      d.atkCd = 1.1; hurtCar(T.hurt, Math.atan2(car.y - d.y, car.x - d.x), 300);
      d.vx = -Math.cos(ang) * 150; d.vy = -Math.sin(ang) * 150; d.stun = 0.25; floater(d.x, d.y - 30, 'HEAD-BUTT!', '#ffab91', 16);
    } else if (!d.dead) {
      // gentle push-out so car does not overlap
      const pen = Math.max(0, md - dist); d.x += Math.cos(ang) * pen * 0.6; d.y += Math.sin(ang) * pen * 0.6; car.x -= Math.cos(ang) * pen * 0.2; car.y -= Math.sin(ang) * pen * 0.2;
    }
  }
}

function updateWaves(dt) {
  if (wave >= 0 && dinos.length === 0 && waveTotal > 0) {
    waveTotal = 0; nextWaveT = 4; quip('waveClear', true);
    if (wave >= 5) { victory(); return; }
    score += 500 * (wave + 1); floater(car.x, car.y - 60, 'WAVE CLEAR +' + 500 * (wave + 1), '#a5d6a7', 22);
  }
  if (waveTotal === 0 && nextWaveT > 0) {
    nextWaveT -= dt;
    if (nextWaveT <= 0) {
      if (waveStarted) wave++; waveStarted = true;
      spawnWave(); waveTotal = dinos.length; introT = 3;
      const w = N.waves[wave]; if (w) { say(w.intro, 3.4); }
    }
  }
}

function update(dt) {
  time += dt;
  if (state === 'play' || state === 'title') {
    if (state === 'title') { // autopilot
      car.x += 0; keys.__auto = true;
    }
  }
  if (state === 'play') {
    updateCar(dt);
    for (const d of dinos) updateDino(d, dt);
    carDinoCollide();
    // pickups
    for (const p of pickups) { p.t += dt; if (hyp(p.x - car.x, p.y - car.y) < 36) { p.got = true; car.hp = Math.min(100, car.hp + 25); SFX.pick(); floater(p.x, p.y - 20, '+25 HP', '#4dd0e1', 20); stars(p.x, p.y, 8); } }
    pickups = pickups.filter(p => !p.got);
    const before = dinos.length; dinos = dinos.filter(d => !d.dead);
    comboT -= dt; if (comboT <= 0 && combo > 0) combo = 0;
    updateWaves(dt);
    introT = Math.max(0, introT - dt);
  } else if (state === 'title') {
    time += 0;
  }
  if (state === 'over') { for (const d of dinos) updateDino(d, dt * 0.4); }
  // camera
  const lead = 0.28;
  const tx = car.x + car.vx * lead - W / 2, ty = car.y + car.vy * lead - H / 2;
  cam.x = lerp(cam.x, tx, Math.min(1, dt * 5)); cam.y = lerp(cam.y, ty, Math.min(1, dt * 5));
  cam.x = clamp(cam.x, 0, WORLD - W); cam.y = clamp(cam.y, 0, WORLD - H);
  shake = Math.max(0, shake - dt * 40);
  // particles
  for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; p.vx *= 1 - 2 * dt * (p.kind === 'dust' ? 1 : 0.3); p.vy *= 1 - (p.g ? 0 : 2 * dt); }
  particles = particles.filter(p => p.life > 0); if (particles.length > 700) particles.splice(0, particles.length - 700);
  for (const f of floaters) { f.life -= dt * 0.9; f.y += f.vy * dt; }
  floaters = floaters.filter(f => f.life > 0);
  for (const s of skids) s.life -= dt; skids = skids.filter(s => s.life > 0);
  updateNarrator(dt);
  if (engOsc && AC) { const g = (state === 'play' ? 0.035 : 0) * (muted ? 0 : 1); engGain.gain.setTargetAtTime(g, AC.currentTime, 0.1); engOsc.frequency.setTargetAtTime(45 + car.speed * 0.18 + (car.boost > 0 ? 40 : 0), AC.currentTime, 0.05); }
}

// ---------- title demo (attract) ----------
function titleSetup() {
  resetGame(); genObstacles(); state = 'title';
  for (let i = 0; i < 12; i++) addDino(pick(['compy', 'raptor', 'raptor', 'trike']), car.x + rnd(-500, 500), car.y + rnd(-400, 400), i % 3);
}
function titleUpdate(dt) {
  time += dt;
  const t = time * 0.6; car.a += 0.9 * dt; car.vx = Math.cos(car.a) * 210; car.vy = Math.sin(car.a) * 210; car.speed = 210; car.wheel += 210 * dt;
  car.x += car.vx * dt * 0.0 + 0; car.y += 0;
  car.x = lerp(car.x, WORLD / 2 + Math.cos(t) * 380, 0.02) ; car.y = lerp(car.y, WORLD / 2 + Math.sin(t) * 260, 0.02);
  car.a = Math.atan2(Math.cos(t) * 260, -Math.sin(t) * 380);
  car.vx = -Math.sin(t) * 380 * 0.6; car.vy = Math.cos(t) * 260 * 0.6;
  for (const d of dinos) updateDino(d, dt);
  if (Math.random() < 0.3 && car.speed > 100) puff(car.x - Math.cos(car.a) * 20, car.y - Math.sin(car.a) * 20, 1, '#cdbf9a', 30, 0.5, 5);
  cam.x = lerp(cam.x, car.x - W / 2, 0.1); cam.y = lerp(cam.y, car.y - H / 2, 0.1);
  cam.x = clamp(cam.x, 0, WORLD - W); cam.y = clamp(cam.y, 0, WORLD - H);
  for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 2 * dt; p.vy *= 1 - 2 * dt; }
  particles = particles.filter(p => p.life > 0);
}

// ---------- drawing ----------
function drawSpr(img, x, y, ang = 0, flip = false) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (ang) ctx.rotate(ang); if (flip) ctx.scale(1, -1);
  ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
}
function shadow(x, y, rx, ry, a = 0.25) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); }
function drawCar() {
  const x = car.x - cam.x, y = car.y - cam.y;
  shadow(x + 4, y + 8, 38, 20, 0.28);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(car.a); ctx.scale(1.25, 1.25);
  // wheels (animated tread)
  const tread = (car.wheel * 0.25) % 6;
  for (const [wx, wy, st] of [[-15, -11, 0], [-15, 11, 0], [14, -11, car.steer * 0.45], [14, 11, car.steer * 0.45]]) {
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(st); ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-7, -3, 14, 6);
    ctx.fillStyle = '#555'; for (let i = -1; i < 3; i++) { const px = ((i * 6 + tread) % 18) - 8; if (px > -8 && px < 6) ctx.fillRect(px, -3, 2, 6); }
    ctx.restore();
  }
  const img = car.hurtT > 0 && Math.floor(time * 30) % 2 ? S.carHurt : S.car;
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  // headlights glow
  ctx.fillStyle = 'rgba(255,245,157,0.18)'; ctx.beginPath(); ctx.moveTo(24, -6); ctx.lineTo(80, -22); ctx.lineTo(80, 22); ctx.lineTo(24, 6); ctx.fill();
  if (state === 'over') { ctx.fillStyle = '#333'; ctx.fillRect(-4, -4, 8, 8); }
  ctx.restore();
}
function drawDino(d) {
  const x = d.x - cam.x, y = d.y - cam.y, z = d.jump > 0 ? Math.sin((1 - d.jump / 0.5) * Math.PI) * 34 : 0;
  shadow(x + 3, y + 6, d.r * 1.1 * (1 - z / 140), d.r * 0.7 * (1 - z / 140), 0.28);
  const set = DS[d.type];
  let img = Math.floor(d.anim) % 2 ? (d.panic ? set.PB : set.B) : (d.panic ? set.PA : set.A);
  if (d.flash > 0 && Math.floor(time * 40) % 2) img = set.H;
  let ang = d.face;
  if (d.state === 'stomp') ang += Math.sin(time * 60) * 0.08;
  const flip = Math.cos(ang) < 0; // keep sprites upright-ish: flip vertically when facing left
  const sq = d.state === 'stomp' ? 1 + Math.sin(time * 40) * 0.05 : 1;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - z)); ctx.rotate(ang); if (flip) ctx.scale(1, -1); if (sq !== 1) ctx.scale(sq, sq);
  ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
  if (d.state === 'stomp') { ctx.strokeStyle = 'rgba(255,80,60,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 150 * (1 - d.stompT / 0.75) + 20, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(255,80,60,0.25)'; ctx.beginPath(); ctx.arc(x, y, 150, 0, 7); ctx.stroke(); }
  if (d.emote > 0) { ctx.font = 'bold 22px "Courier New",monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#ff5252'; const ey = y - d.r - 22 - z - Math.sin(time * 20) * 2; ctx.strokeText('!', x, ey); ctx.fillText('!', x, ey); }
  if (d.state === 'hide') { ctx.font = 'bold 12px "Courier New",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('...', x, y - d.r - 8); }
  if (d.type === 'trike' && d.hp < d.maxhp) pipBar(x, y - d.r - 12, d.hp / d.maxhp);
}
function pipBar(x, y, f) { ctx.fillStyle = '#000'; ctx.fillRect(x - 17, y - 1, 34, 6); ctx.fillStyle = '#ef5350'; ctx.fillRect(x - 16, y, 32 * f, 4); }

function drawWorld() {
  const sx = Math.round(cam.x + (shake ? rnd(-shake, shake) * 0.5 : 0)), sy = Math.round(cam.y + (shake ? rnd(-shake, shake) * 0.5 : 0));
  const ox = sx - cam.x, oy = sy - cam.y; // shake offset
  ctx.save(); ctx.translate(-ox, -oy);
  ctx.drawImage(worldImg, cam.x, cam.y, W, H, 0, 0, W, H);
  // skids
  for (const s of skids) { ctx.save(); ctx.globalAlpha = Math.min(1, s.life / 3) * 0.45; ctx.translate(s.x - cam.x, s.y - cam.y); ctx.rotate(s.a); ctx.fillStyle = '#2a2018'; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
  // pickups
  for (const p of pickups) { const x = p.x - cam.x, y = p.y - cam.y - 4 - Math.sin(p.t * 4) * 4; if (x < -50 || x > W + 50 || y < -50 || y > H + 50) continue; shadow(x, y + 18, 14, 6); ctx.fillStyle = 'rgba(77,208,225,0.25)'; ctx.beginPath(); ctx.arc(x, y, 22 + Math.sin(p.t * 6) * 3, 0, 7); ctx.fill(); ctx.drawImage(ICON.wrench, x - ICON.wrench.width / 2, y - ICON.wrench.height / 2); }
  // y-sorted drawables
  const list = [];
  const vis = (x, y, pad = 80) => x > cam.x - pad && x < cam.x + W + pad && y > cam.y - pad && y < cam.y + H + pad;
  for (const o of obstacles) if (vis(o.x, o.y, 90)) list.push({ y: o.y, f: () => {
    const x = o.x - cam.x, y = o.y - cam.y;
    if (o.kind === 'tree') { shadow(x + 6, y + 2, 22, 9, 0.3); ctx.drawImage(o.img, Math.round(x - 33), Math.round(y - 72)); }
    else { shadow(x + 4, y + o.r * 0.6, o.r * 1.1, o.r * 0.6, 0.3); ctx.drawImage(o.img, Math.round(x - o.img.width / 2), Math.round(y - o.img.height / 2)); } } });
  for (const d of dinos) if (vis(d.x, d.y)) list.push({ y: d.y, f: () => drawDino(d) });
  list.push({ y: car.y, f: drawCar });
  list.sort((a, b) => a.y - b.y); for (const l of list) l.f();
  // particles
  for (const p of particles) {
    const x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y), t = p.life / p.max;
    if (p.kind === 'dust') { ctx.globalAlpha = t * 0.7; ctx.fillStyle = p.col; const s = p.size * (1.5 - t * 0.5); ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.globalAlpha = 1; }
    else if (p.kind === 'star' || p.kind === 'star2') { ctx.globalAlpha = Math.min(1, t * 2); const im = ICON[p.kind]; ctx.drawImage(im, x - im.width / 2, y - im.height / 2); ctx.globalAlpha = 1; }
    else if (p.kind === 'feather') { ctx.globalAlpha = Math.min(1, t * 1.5); ctx.fillStyle = p.col; ctx.fillRect(x, y + Math.sin(time * 12 + p.x) * 3, p.size, p.size * 0.6); ctx.globalAlpha = 1; }
    else if (p.kind === 'ring') { ctx.strokeStyle = `rgba(255,255,255,${t})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, (1 - t) * 180 + 10, 0, 7); ctx.stroke(); }
  }
  // floaters
  ctx.textAlign = 'center';
  for (const f of floaters) { ctx.globalAlpha = Math.min(1, f.life * 2); ctx.font = `bold ${f.size}px "Courier New",monospace`; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = f.col; const x = f.x - cam.x, y = f.y - cam.y; ctx.strokeText(f.text, x, y); ctx.fillText(f.text, x, y); ctx.globalAlpha = 1; }
  ctx.restore();
}
function drawSpeedLines() {
  const sp = car.speed; if (sp < 260 && car.boost <= 0) return;
  const k = clamp((sp - 240) / 300, 0, 1) + (car.boost > 0 ? 0.4 : 0); const n = Math.floor(k * 26);
  const a = Math.atan2(car.vy, car.vx);
  ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.12 + k * 0.2})`; ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) { const r = seeded(i * 97 + Math.floor(time * 20) * 13); const x = r() * W, y = r() * H, l = 40 + r() * 90 * k;
    if (hyp(x - W / 2, y - H / 2) < 150) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.stroke(); }
  ctx.restore();
  // vignette
  const g = ctx.createRadialGradient(W / 2, H / 2, 250, W / 2, H / 2, 560); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.15 + k * 0.25})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function text(t, x, y, size, col = '#fff', align = 'left', stroke = '#000') {
  ctx.font = `bold ${size}px "Courier New",monospace`; ctx.textAlign = align; ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = stroke; ctx.lineJoin = 'round';
  ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y);
}
function bar(x, y, w, h, f, col, bg = '#222') { ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.fillStyle = bg; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, w * f), h); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, Math.max(0, w * f), h / 3); }
function drawHUD() {
  // health
  // boost
  ctx.drawImage(ICON.bolt, 18, 14);
  const bf = car.boost > 0 ? 1 - 0 : 1 - car.boostCd / 2.5; bar(46, 18, 160, 14, bf, car.boost > 0 ? '#ffffff' : bf >= 1 ? '#ffe14d' : '#8a7a2a');
  
  // score/wave
  text(String(score).padStart(7, '0'), W / 2, 34, 30, '#fff', 'center');
  text((N.waves[wave] ? N.waves[wave].name : '').split(':')[0] + '  ·  ' + dinos.length + ' dinos left', W / 2, 56, 14, '#ffe082', 'center');
  text('HI ' + hiscore, W / 2, 74, 12, '#b0bec5', 'center');
  // combo
  if (combo > 1) { const sc = 1 + Math.min(0.5, (comboT > 2.2 ? (comboT - 2.2) * 2 : 0)); ctx.save(); ctx.translate(30, 130); ctx.scale(sc, sc); text('x' + mult(), 0, 0, 44, '#ffeb3b'); text(combo + ' COMBO', 0, 24, 16, '#fff'); ctx.restore(); ctx.fillStyle = '#000'; ctx.fillRect(28, 160, 104, 8); ctx.fillStyle = '#ff7043'; ctx.fillRect(30, 162, 100 * clamp(comboT / 2.6, 0, 1), 4); }
  // minimap
  const mx = W - 124, my = 14, ms = 110, k = ms / WORLD;
  ctx.fillStyle = 'rgba(10,25,10,0.65)'; ctx.fillRect(mx - 2, my - 2, ms + 4, ms + 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(mx - 2, my - 2, ms + 4, ms + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(mx + cam.x * k, my + cam.y * k, W * k, H * k);
  for (const d of dinos) { ctx.fillStyle = d.type === 'rex' ? '#ff1744' : d.type === 'trike' ? '#90a4ae' : d.panic ? '#ffab40' : '#c5e1a5'; const s = d.type === 'rex' ? 5 : d.type === 'trike' ? 3 : 2; ctx.fillRect(mx + d.x * k - s / 2, my + d.y * k - s / 2, s, s); }
  for (const p of pickups) { ctx.fillStyle = '#4dd0e1'; ctx.fillRect(mx + p.x * k - 2, my + p.y * k - 2, 4, 4); }
  ctx.fillStyle = '#ff5252'; ctx.fillRect(mx + car.x * k - 2, my + car.y * k - 2, 4, 4);
  // boss bar
  const rex = dinos.find(d => d.type === 'rex');
  if (rex) { bar(W / 2 - 150, 88, 300, 12, rex.hp / rex.maxhp, '#d32f2f'); text('KING REX', W / 2, 120, 14, '#ff8a80', 'center'); }
  // wave intro title
  if (introT > 0 && N.waves[wave]) { ctx.globalAlpha = clamp(introT, 0, 1); text(N.waves[wave].name, W / 2, 190, 34, '#fff59d', 'center'); ctx.globalAlpha = 1; }
  // off-screen pointer arrows for nearest dinos when few left
  if (dinos.length > 0 && dinos.length <= 4) for (const d of dinos) {
    const sx = d.x - cam.x, sy = d.y - cam.y; if (sx > 20 && sx < W - 20 && sy > 20 && sy < H - 20) continue;
    const a = Math.atan2(d.y - car.y, d.x - car.x), px = clamp(W / 2 + Math.cos(a) * 400, 24, W - 24), py = clamp(H / 2 + Math.sin(a) * 240, 24, H - 100);
    ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = '#ffeb3b'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  }
  drawBoostButton();
  drawBanner();
}
function drawRevButton() {
  const b = revBtn(), held = [...ptrs.values()].some(p => p.rev);
  ctx.globalAlpha = touchMode ? 0.9 : 0.55; ctx.fillStyle = '#90caf9'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r - (held ? 4 : 0), 0, 7); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#0d47a1'; ctx.beginPath(); ctx.moveTo(b.x, b.y + 16); ctx.lineTo(b.x - 18, b.y - 10); ctx.lineTo(b.x + 18, b.y - 10); ctx.closePath(); ctx.fill();
  text(touchMode ? 'BACK' : 'S', b.x, b.y + 38, 14, '#fff', 'center');
}
function drawBoostButton() {
  drawRevButton();
  const b = boostBtn(), ready = car.boostCd <= 0 && car.boost <= 0, held = [...ptrs.values()].some(p => p.boost);
  ctx.globalAlpha = touchMode ? 0.9 : 0.55; ctx.fillStyle = ready ? '#ffd54f' : '#6d5f2a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r - (held ? 4 : 0), 0, 7); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.drawImage(ICON.bolt, b.x - ICON.bolt.width / 2, b.y - ICON.bolt.height / 2 - 8);
  text(touchMode ? 'BOOST' : 'SPACE', b.x, b.y + 30, 14, '#fff', 'center');
}
function drawBanner() {
  if (!nar.cur) return;
  const bx = 40, bw = W - 80, bh = 84, by = H - bh - 14;
  ctx.fillStyle = 'rgba(15,12,30,0.88)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 4; ctx.strokeRect(bx, by, bw, bh); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(bx - 4, by - 4, bw + 8, bh + 8);
  // narrator mic icon
  ctx.fillStyle = '#ffd54f'; ctx.fillRect(bx + 14, by + 14, 38, 38); ctx.fillStyle = '#1a1230'; ctx.fillRect(bx + 18, by + 18, 30, 30);
  ctx.fillStyle = '#ff7043'; ctx.fillRect(bx + 27, by + 22, 12, 16); ctx.fillStyle = '#fff'; ctx.fillRect(bx + 29, by + 24, 4, 4); ctx.fillStyle = '#90a4ae'; ctx.fillRect(bx + 31, by + 38, 4, 6); ctx.fillRect(bx + 26, by + 43, 14, 3);
  text('NARRATOR', bx + 33, by + 72, 11, '#ffd54f', 'center');
  ctx.font = 'bold 20px "Courier New",monospace';
  const shown = nar.cur.text.slice(0, Math.floor(nar.t)); const lines = wrapText(shown, bw - 100);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
  const startY = by + (lines.length > 2 ? 28 : lines.length > 1 ? 38 : 50);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, bx + 70, startY + i * 25));
}
function overlay(title, sub, lines, col = '#fff') {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
  text(title, W / 2, 190, 64, col, 'center'); if (sub) text(sub, W / 2, 232, 20, '#ffe082', 'center');
  lines.forEach((l, i) => text(l, W / 2, 290 + i * 28, 18, '#fff', 'center'));
}
function render() {
  ctx.imageSmoothingEnabled = false;
  drawWorld();
  if (state === 'play' || state === 'pause' || state === 'over' || state === 'win') drawSpeedLines();
  if (state === 'title') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    const bob = Math.sin(time * 3) * 4;
    text(N.title, W / 2 + 4, 154 + bob, 78, '#b71c1c', 'center', 'rgba(0,0,0,0)'); text(N.title, W / 2, 150 + bob, 78, '#ffeb3b', 'center');
    text(N.subtitle, W / 2, 190, 22, '#fff', 'center');
    drawSpr(S.car, W / 2 - 150, 250, 0); drawSpr(DS.raptor.PA, W / 2 + 150, 250, Math.PI);
    ctx.font = 'bold 18px "Courier New",monospace'; ctx.textAlign = 'center';
    [touchMode ? 'TOUCH and HOLD to steer the car' : 'LEFT / RIGHT (or A / D) to steer', touchMode ? 'Yellow BOOST = zoom!   Blue BACK = reverse' : 'SPACE to boost    P pause    M mute', 'Bump all the dinosaurs! They run away!'].forEach((l, i) => text(l, W / 2, 310 + i * 28, 18, '#fff', 'center'));
    if (Math.floor(time * 2) % 2) text(touchMode ? 'TAP TO START' : 'PRESS ENTER TO START', W / 2, 460, 30, '#a5d6a7', 'center');
    text('HI SCORE ' + hiscore, W / 2, 500, 16, '#b0bec5', 'center');
  } else {
    drawHUD();
    if (state === 'pause') overlay('PAUSED', '', [touchMode ? 'Tap to keep playing' : 'P to resume']);
    if (state === 'over') { overlay('GAME OVER', 'Wave ' + (wave + 1) + ' reached', ['Score ' + score + '   Dinos bumped ' + kills + '   Escaped ' + escaped, 'Best combo ' + bestCombo, touchMode ? 'Tap to try again' : 'ENTER to try again'], '#ff6b6b'); drawBanner(); }
    if (state === 'win') { overlay('YOU WIN!', N.title, ['Score ' + score + '   Dinos bumped ' + kills + '   Best combo ' + bestCombo, ...(N.ending || []).slice(0, 3).map(s => s.length > 80 ? s.slice(0, 78) + '..' : s), touchMode ? 'Tap to play again' : 'ENTER to play again'], '#ffeb3b'); drawBanner(); }
  }
}

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (pressed.Enter && state === 'pause') state = 'play';
  if (pressed.KeyM) muted = !muted;
  if (pressed.KeyP || pressed.Escape) { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; }
  if ((pressed.Enter || pressed.Space) && state === 'title') startGame();
  else if (pressed.Enter && (state === 'over' || state === 'win')) { titleSetup(); startGame(); }
  for (const k in pressed) delete pressed[k];
  if (hitstop > 0) { hitstop -= dt; dt = dt * 0.05; }
  if (state === 'title') titleUpdate(dt);
  else if (state !== 'pause') update(dt);
  render();
  requestAnimationFrame(frame);
}
fitCanvas();
titleSetup();
window.__g = { get state() { return state; }, get car() { return car; }, get dinos() { return dinos; }, get wave() { return wave; }, get score() { return score; }, keys, startGame, clearDinos() { dinos.forEach(d => d.dead = true); }, get cam() { return cam; } };
requestAnimationFrame(frame);
})();
