const W = 800;
const H = 600;
const BW = 10;
const BH = 22;
const VO = 2;
const HI_KEY = 'tetrus-pulse-hi';
const CB_KEY = 'tetrus-pulse-best-combo';

const PAL = [0x46f5ff, 0xff5dd7, 0x9a68ff, 0x4f75ff, 0xc7ff44, 0xffa33a, 0xff5a8d, 0x66738f];

const SCORE = [0, 100, 300, 500, 800];
const SEND = [0, 0, 1, 2, 4];

const SHAPES = [
  [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
];

const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];

const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const KEY_TO_ARCADE = {};
for (const [code, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) KEY_TO_ARCADE[norm(key)] = code;
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#050816',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  scene: { create, update },
});

function create() {
  const s = this;
  s.inputState = { held: Object.create(null), pressed: Object.create(null) };

  const onDown = (e) => {
    const code = KEY_TO_ARCADE[norm(e.key)];
    if (!code) return;
    if (!s.inputState.held[code]) s.inputState.pressed[code] = 1;
    s.inputState.held[code] = 1;
  };
  const onUp = (e) => {
    const code = KEY_TO_ARCADE[norm(e.key)];
    if (code) s.inputState.held[code] = 0;
  };

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  const cleanup = () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  };
  s.events.once('shutdown', cleanup);
  s.events.once('destroy', cleanup);

  s.bg = s.add.graphics();
  s.glow = s.add.graphics();
  s.glow.setBlendMode(Phaser.BlendModes.ADD);
  s.fg = s.add.graphics();

  s.title = s.add.text(W / 2, 42, 'TETRISKI', {
    fontFamily: 'monospace',
    fontSize: '36px',
    color: '#f8fbff',
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5);

  s.credit = s.add.text(W / 2, 84, 'resonance falling-block arcade', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#a8b4d8',
    align: 'center',
  }).setOrigin(0.5);

  s.menu1 = s.add.text(W / 2, 236, 'SOLO RESONANCE', {
    fontFamily: 'monospace',
    fontSize: '26px',
    color: '#f8fbff',
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5);

  s.menu2 = s.add.text(W / 2, 298, 'VERSUS SPLIT', {
    fontFamily: 'monospace',
    fontSize: '26px',
    color: '#f8fbff',
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5);

  s.info = s.add.text(W / 2, 540, '', {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#90a4d7',
    align: 'center',
    lineSpacing: 5,
  }).setOrigin(0.5);

  s.hud1 = s.add.text(0, 0, '', {
    fontFamily: 'monospace',
    fontSize: '18px',
    color: '#f8fbff',
    lineSpacing: 5,
  }).setOrigin(0, 0.5);

  s.hud2 = s.add.text(0, 0, '', {
    fontFamily: 'monospace',
    fontSize: '16px',
    color: '#f8fbff',
    align: 'right',
    lineSpacing: 5,
  }).setOrigin(1, 0.5);

  s.over1 = s.add.text(W / 2, H / 2 - 18, '', {
    fontFamily: 'monospace',
    fontSize: '40px',
    color: '#f8fbff',
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5).setDepth(10);

  s.over2 = s.add.text(W / 2, H / 2 + 44, '', {
    fontFamily: 'monospace',
    fontSize: '16px',
    color: '#d9e7ff',
    align: 'center',
    lineSpacing: 5,
  }).setOrigin(0.5).setDepth(10);

  s.phase = 'menu';
  s.mode = 1;
  s.sel = 0;
  s.nav = 0;
  s.hi = 0;
  s.bestCombo = 0;
  s.boards = [];
  s.flash = 0;
  s.pulse = 0.2;
  s.bpm = 120;
  s.beatAt = 0;
  s.beatFlip = 0;
  s.beatPhase = 0;
  s.beatStrong = 0;
  s.warpT = 0;
  s.swapT = 0;
  s.barStep = 0;
  s.zmBusy = 0;
  s.lastBeat = 0;
  s.particles = [];
  s.rings = [];
  s.trails = [];
  s.dust = [];

  for (let i = 0; i < 48; i += 1) {
    s.dust.push({
      x: Math.random() * W,
      y: Math.random() * H,
      v: 0.015 + Math.random() * 0.04,
      o: Math.random() * 7,
      s: 1 + Math.random() * 2,
    });
  }

  loadKey(HI_KEY).then((v) => { s.hi = v; });
  loadKey(CB_KEY).then((v) => { s.bestCombo = v; });

  syncUi(s);
}

function update(time, delta) {
  const s = this;
  stepFx(s, time, delta);

  const beatInt = 60000 / s.bpm;
  if ((s.phase === 'menu' || s.phase === 'play') && time > s.beatAt) {
    s.beatAt = (s.beatAt || time) + beatInt;
    if (time - s.beatAt > beatInt) s.beatAt = time + beatInt;
    s.beatFlip = (s.beatFlip + 1) & 3;
    s.lastBeat = time;
    s.pulse += 0.06;
  }
  s.beatPhase = Math.max(0, 1 - (time - s.lastBeat) / 220);

  if (s.phase === 'menu') updateMenu(s);
  else if (s.phase === 'play') updatePlay(s, time, delta);
  else updateOver(s);

  Music.tick(s, delta);

  s.title.setScale(1 + Math.sin(time * 0.004) * 0.015 + s.pulse * 0.02 + s.beatPhase * 0.04);
  syncUi(s);
  draw(s, time);
}

function updateMenu(s) {
  let v = 0;
  if (held(s, 'P1_U') || held(s, 'P2_U')) v -= 1;
  if (held(s, 'P1_D') || held(s, 'P2_D')) v += 1;
  if (v && !s.nav) {
    s.sel = Phaser.Math.Wrap(s.sel + v, 0, 2);
    s.nav = 1;
    s.pulse += 0.1;
    snd(s, 'move');
  }
  if (!v) s.nav = 0;

  if (tapAny(s, ['START1', 'START2', 'P1_1', 'P1_2', 'P2_1', 'P2_2'])) {
    startGame(s, s.sel ? 2 : 1);
  }
}

function updatePlay(s, time, delta) {
  if (s.mode === 1 && s.boards[0]) s.boards[0].time += delta;
  for (const b of s.boards) {
    if (s.phase !== 'play') break;
    tickBoard(s, b, time, delta);
  }
  s.boltT -= delta;
  if (s.boltT <= 0) {
    s.boltT = 700 + Math.random() * 2400;
    bolt(s);
  }
  ambient(s, mxl(s), delta);
}

function bolt(s) {
  if (!s.boards.length) return;
  const b = s.boards[(Math.random() * s.boards.length) | 0];
  const cells = [];
  for (let y = VO; y < BH; y += 1) for (let x = 0; x < BW; x += 1) if (b.a[y][x]) cells.push([x, y]);
  if (!cells.length) return;
  const cell = cells[(Math.random() * cells.length) | 0];
  const fx = b.x + (cell[0] + 0.5) * b.c;
  const fy = b.y + (cell[1] - VO + 0.5) * b.c;
  const th = s.mode === 1 ? theme(b.lv) : 0;
  const col = th ? th.frame : 0x7be8ff;
  s.trails.push({
    beam: 1, x: fx, y: b.y - 24,
    h: fy - (b.y - 24), w: b.c * 0.4, a: 1, c: 0xffffff, e: col, l: 360,
    j: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
  });
  ring(s, fx, fy, col, 10, 260, 2);
  burst(s, fx, fy, col, 6, 120, 1);
  s.flash += 0.1;
  s.pulse += 0.08;
}

function updateOver(s) {
  if (tapAny(s, ['START1', 'START2'])) startGame(s, s.mode);
  else if (tapAny(s, ['P1_1', 'P1_2', 'P2_1', 'P2_2'])) {
    s.phase = 'menu';
    s.boards = [];
    s.bpm = 120;
    s.over1.setText('');
    s.over2.setText('');
    Music.stopMusic(s);
  }
}

function startGame(s, mode) {
  s.phase = 'play';
  s.mode = mode;
  s.flash = 0.12;
  s.pulse = 0.6;
  s.bpm = 120;
  s.boltT = 1200;
  s.particles = [];
  s.rings = [];
  s.trails = [];
  s.over1.setText('');
  s.over2.setText('');

  s.boards = mode === 1
    ? [makeBoard(300, 106, 20, 'SOLO', ['P1_L', 'P1_R', 'P1_D', 'P1_U', 'P1_1', 'P1_2', 'P1_3', 'P1_4'])]
    : [
        makeBoard(92, 126, 16, 'P1', ['P1_L', 'P1_R', 'P1_D', 'P1_U', 'P1_1', 'P1_2', 'P1_3', 'P1_4']),
        makeBoard(548, 126, 16, 'P2', ['P2_L', 'P2_R', 'P2_D', 'P2_U', 'P2_1', 'P2_2', 'P2_3', 'P2_4']),
      ];

  for (const b of s.boards) {
    for (let i = 0; i < 3; i += 1) b.next.push(pull(b));
    spawn(s, b, 1);
  }
  snd(s, 'start');
  if (s.music) s.music.vol = 0.85;
  Music.initAudio(s);
  Music.startLevelMusic(s, 1);
}

function makeBoard(x, y, c, name, keys) {
  const a = [];
  for (let i = 0; i < BH; i += 1) a.push(row());
  return {
    x, y, c, name, keys,
    side: x < W / 2 ? 1 : -1,
    a,
    bag: [], next: [],
    hold: -1, holdUsed: 0,
    p: null,
    fall: 0, lock: 0,
    score: 0, lines: 0, lv: 1,
    combo: 0, comboT: 0,
    charge: 0,
    res: 0, resT: 0, resQueue: [],
    time: 0, gar: 0, fast: 0,
    hole: x < W / 2 ? 1 : 6,
    mdir: 0, mtime: 0, mfirst: 0,
    flash: 0, dead: 0,
  };
}

function tickBoard(s, b, time, delta) {
  if (!b.p || b.dead) return;

  if (b.comboT > 0) {
    b.comboT -= delta;
    if (b.comboT <= 0) b.combo = 0;
  }
  if (b.res) {
    b.resT -= delta;
    if (b.resT <= 0) releaseResonance(s, b);
  }
  if (!b.p || b.dead) return;

  const k = b.keys;

  if (tap(s, k[7])) holdSwap(s, b);
  if (!b.p) return;

  if (tap(s, k[6])) tryResonance(s, b);
  if (!b.p) return;

  let dir = 0;
  if (held(s, k[0])) dir -= 1;
  if (held(s, k[1])) dir += 1;
  if (dir !== b.mdir) {
    b.mdir = dir;
    b.mfirst = 0;
    b.mtime = time;
  }
  if (dir && time >= b.mtime) {
    if (move(b, dir, 0)) {
      snd(s, 'move');
      s.pulse += 0.015;
    }
    b.mtime = time + (b.mfirst ? 46 : 140);
    b.mfirst = 1;
  }
  if (!dir) b.mfirst = 0;

  if (tap(s, k[3]) || tap(s, k[4])) spin(s, b);
  if (tap(s, k[5])) {
    hardDrop(s, b);
    return;
  }
  if (s.phase !== 'play' || !b.p) return;

  const fast = held(s, k[2]);
  if (fast && !b.fast) snd(s, 'fast');
  b.fast = fast ? 1 : 0;
  const resMult = b.res ? 0.35 : 1;
  const mult = fast ? 18 : 1;
  b.fall += delta * mult * resMult;

  const step = speed(b);
  while (b.fall >= step && s.phase === 'play' && b.p) {
    b.fall -= step;
    if (move(b, 0, 1)) {
      if (mult > 1) {
        b.score += 1;
        s.pulse += 0.004;
      }
    } else break;
  }
  if (!b.p) return;

  if (!fit(b, b.p.i, b.p.r, b.p.x, b.p.y + 1)) {
    b.lock += delta;
    if (b.lock > 320) lockPiece(s, b);
  } else {
    b.lock = 0;
  }
}

function speed(b) {
  return Math.max(50, 820 * Math.pow(0.82, b.lv - 1));
}

function move(b, dx, dy) {
  const p = b.p;
  if (!p) return 0;
  if (!fit(b, p.i, p.r, p.x + dx, p.y + dy)) return 0;
  p.x += dx;
  p.y += dy;
  b.lock = 0;
  return 1;
}

function spin(s, b) {
  const p = b.p;
  if (!p) return 0;
  const col = tint(s.mode === 1 ? theme(b.lv) : 0, p.i);
  const nr = (p.r + 1) & 3;
  for (const [kx, ky] of KICKS) {
    if (fit(b, p.i, nr, p.x + kx, p.y + ky)) {
      p.x += kx;
      p.y += ky;
      p.r = nr;
      b.lock = 0;
      const c = center(b);
      burst(s, c[0], c[1], col, 6, 120, 0.35);
      s.pulse += 0.08;
      snd(s, 'rot');
      return 1;
    }
  }
  return 0;
}

function hardDrop(s, b) {
  const p = b.p;
  if (!p) return;
  const sy = p.y;
  let n = 0;
  const col = tint(s.mode === 1 ? theme(b.lv) : 0, p.i);

  while (fit(b, p.i, p.r, p.x, p.y + 1)) {
    p.y += 1;
    n += 1;
  }

  if (n) {
    b.score += n * 2;
    for (const q of SHAPES[p.i][p.r]) {
      const gx = b.x + (p.x + q[0]) * b.c + b.c * 0.2;
      const gy1 = b.y + (sy + q[1] - VO) * b.c + b.c * 0.2;
      const gy2 = b.y + (p.y + q[1] - VO) * b.c + b.c * 0.2;
      s.trails.push({
        x: gx, y: Math.min(gy1, gy2),
        h: Math.abs(gy2 - gy1) + b.c * 0.6,
        w: b.c * 0.6, a: 0.6, c: col, l: 520,
      });
    }
    const c = center(b);
    const bw = b.c * (s.mode === 1 ? 0.9 + Math.min(0.25, b.lv * 0.05) : 0.8);
    s.trails.push({
      beam: 1, x: c[0], y: b.y - 18,
      h: c[1] + b.c * 1.1 - (b.y - 18),
      w: bw, a: 1, c: 0xffffff, e: col, l: 460,
      j: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
    });
    ring(s, c[0], c[1] + b.c * 0.7, col, n > 10 ? 34 : 24, n > 10 ? 280 : 220, n > 10 ? 4 : 3);
    burst(s, c[0], c[1] + b.c * 0.7, col, 10, 180, 0.8);
    s.cameras.main.shake(90, 0.0025);
    s.pulse += 0.22;
    s.flash += 0.03;
  }
  snd(s, 'drop');
  lockPiece(s, b);
}

function lockPiece(s, b) {
  const p = b.p;
  if (!p) return;

  let top = 0;
  const rows = [];

  for (const q of SHAPES[p.i][p.r]) {
    const x = p.x + q[0];
    const y = p.y + q[1];
    if (y < 0) { lose(s, b); return; }
    if (y < VO) top = 1;
    b.a[y][x] = p.i + 1;
    if (!rows.includes(y)) rows.push(y);
  }
  if (top) { lose(s, b); return; }

  rows.sort((a, c) => a - c);
  const cleared = [];
  for (const y of rows) {
    let full = 1;
    for (let x = 0; x < BW; x += 1) {
      if (!b.a[y][x]) { full = 0; break; }
    }
    if (full) cleared.push(y);
  }

  const th = s.mode === 1 ? theme(b.lv) : 0;
  const col = tint(th, p.i);

  if (cleared.length) {
    for (let i = 0; i < cleared.length; i += 1) {
      b.a.splice(cleared[i], 1);
      b.a.unshift(row());
    }
    b.lines += cleared.length;
    b.lv = 1 + ((b.lines / 10) | 0);
    if (s.mode === 1) s.bpm = 120 + Math.min(40, (b.lv - 1) * 6);
    const mlv = s.boards.reduce((m, x) => x.lv > m ? x.lv : m, 1);
    Music.startLevelMusic(s, mlv);

    const cx = b.x + BW * b.c * 0.5;
    const cy = b.y + (((cleared[0] + cleared[cleared.length - 1]) * 0.5 + 0.5) - VO) * b.c;

    if (b.res) {
      b.resQueue.push({ n: cleared.length, cx, cy, col });
      deferredFx(s, cx, cy, col, cleared.length);
    } else {
      b.combo += 1;
      b.comboT = 2500;
      b.score += SCORE[cleared.length] * b.lv;
      if (b.combo > 1) b.score += 50 * (b.combo - 1) * b.lv;
      b.charge = Math.min(1, b.charge + 0.1 * cleared.length + (b.combo > 1 ? 0.02 * b.combo : 0));
      clearFx(s, b, cx, cy, cleared.length, col, cleared);
      if (b.combo > 1) snd(s, 'combo');
      if (b.combo > s.bestCombo) {
        s.bestCombo = b.combo;
        saveKey(CB_KEY, s.bestCombo);
      }
      if (s.mode === 2) {
        const other = s.boards[0] === b ? s.boards[1] : s.boards[0];
        other.gar += SEND[cleared.length] + (b.combo > 2 ? 1 : 0);
      }
    }
  } else if (!b.res) {
    b.combo = 0;
  }

  b.holdUsed = 0;
  spawn(s, b);
}

function holdSwap(s, b) {
  if (b.holdUsed || !b.p) return;
  const cur = b.p.i;
  if (b.hold < 0) {
    b.hold = cur;
    const i = b.next.shift();
    b.next.push(pull(b));
    b.p = { i, r: 0, x: 3, y: 0 };
  } else {
    const i = b.hold;
    b.hold = cur;
    b.p = { i, r: 0, x: 3, y: 0 };
  }
  b.fall = 0;
  b.lock = 0;
  b.holdUsed = 1;
  s.pulse += 0.1;
  snd(s, 'hold');
  if (!fit(b, b.p.i, 0, 3, 0)) lose(s, b);
}

function tryResonance(s, b) {
  if (b.res || b.charge < 1 || b.dead) return;
  b.res = 1;
  b.resT = 6500;
  b.resQueue = [];
  s.pulse += 0.5;
  s.flash += 0.18;
  filterRamp(s, 600, 0.3);
  snd(s, 'res_on');
  s.cameras.main.shake(120, 0.003);
}

function releaseResonance(s, b) {
  const q = b.resQueue;
  let total = 0;
  for (const e of q) total += e.n;

  if (total) {
    const bonus = 200 * total * total * b.lv;
    b.score += bonus;
    b.lines += 0;
    b.combo += q.length;
    b.comboT = 2500;
    if (b.combo > s.bestCombo) {
      s.bestCombo = b.combo;
      saveKey(CB_KEY, s.bestCombo);
    }
    if (s.mode === 2) {
      const other = s.boards[0] === b ? s.boards[1] : s.boards[0];
      other.gar += Math.min(8, (total * 1.5) | 0);
    }
    for (let i = 0; i < q.length; i += 1) {
      const e = q[i];
      setTimeout(() => {
        if (s.phase === 'play') {
          ring(s, e.cx, e.cy, e.col, 28, 420, 4);
          ring(s, e.cx, e.cy, 0xffffff, 16, 260, 2);
          burst(s, e.cx, e.cy, e.col, 18, 220, 1);
        }
      }, i * 55);
    }
    s.cameras.main.shake(240, 0.006);
    s.flash += 0.4;
    s.pulse += 1.4;
    b.flash = 1;
    snd(s, 'res_off');
  } else {
    snd(s, 'res_off');
    s.flash += 0.1;
  }
  filterRamp(s, 8000, 0.4);
  b.charge = 0;
  b.res = 0;
  b.resT = 0;
  b.resQueue = [];
}

function spawn(s, b, init) {
  if (!init && b.gar) {
    addGarbage(s, b);
    if (s.phase !== 'play') return;
  }
  const i = b.next.shift();
  b.next.push(pull(b));
  b.p = { i, r: 0, x: 3, y: 0 };
  b.fall = 0;
  b.lock = 0;
  if (!fit(b, i, 0, 3, 0)) lose(s, b);
}

function addGarbage(s, b) {
  let n = b.gar;
  b.gar = 0;
  while (n > 0) {
    n -= 1;
    b.hole = (b.hole + 3) % BW;
    b.a.shift();
    const r = Array(BW).fill(8);
    r[b.hole] = 0;
    b.a.push(r);
  }
  for (let y = 0; y < VO; y += 1) {
    for (let x = 0; x < BW; x += 1) {
      if (b.a[y][x]) { lose(s, b); return; }
    }
  }
  b.flash = 0.28;
  s.flash += 0.04;
  s.pulse += 0.15;
}

function fit(b, id, r, px, py) {
  for (const q of SHAPES[id][r]) {
    const x = px + q[0];
    const y = py + q[1];
    if (x < 0 || x >= BW || y >= BH) return 0;
    if (y >= 0 && b.a[y][x]) return 0;
  }
  return 1;
}

function pull(b) {
  if (!b.bag.length) {
    b.bag = [0, 1, 2, 3, 4, 5, 6];
    for (let i = 6; i > 0; i -= 1) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = b.bag[i];
      b.bag[i] = b.bag[j];
      b.bag[j] = t;
    }
  }
  return b.bag.pop();
}

function lose(s, b) {
  if (s.phase !== 'play') return;
  if (b.res) releaseResonance(s, b);
  b.dead = 1;
  s.phase = 'over';
  s.flash = 0.28;
  s.pulse = 1.1;
  s.cameras.main.shake(220, 0.005);
  snd(s, 'over');
  Music.setVolume(s, 0.22);

  if (s.mode === 1) {
    if (b.score > s.hi) {
      s.hi = b.score;
      saveKey(HI_KEY, s.hi);
      s.over1.setText('NEW HIGH');
    } else {
      s.over1.setText('GAME OVER');
    }
    s.over2.setText(`SCORE ${numText(b.score)}   LV ${b.lv}   LINES ${b.lines}\nBEST COMBO ${s.bestCombo}\nSTART RETRY   BTN MENU`);
  } else {
    const winner = s.boards[0] === b ? s.boards[1] : s.boards[0];
    s.over1.setText(`${winner.name} WINS`);
    s.over2.setText(`LINES ${s.boards[0].lines} : ${s.boards[1].lines}\nSTART REMATCH   BTN MENU`);
  }
}

function clearFx(s, b, x, y, n, c, rows) {
  b.flash = n === 4 ? 1 : 0.65;
  const boardW = BW * b.c;

  if (rows) {
    for (const ry of rows) {
      const lineY = b.y + (ry - VO) * b.c + b.c * 0.5;
      s.trails.push({
        x: b.x, y: lineY - b.c * 0.5,
        w: boardW, h: b.c, a: 0.9, c, l: 420,
      });
      s.trails.push({
        x: b.x - 10, y: lineY - 2,
        w: boardW + 20, h: 4, a: 1, c: 0xffffff, l: 260,
      });
      for (let cx = 0; cx < BW; cx += 1) {
        s.trails.push({
          beam: 1, x: b.x + (cx + 0.5) * b.c, y: b.y - 24,
          h: lineY - (b.y - 24), w: b.c * 0.45, a: 0.9, c: 0xffffff, e: c, l: 360,
          j: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
        });
      }
      for (let k = 0; k < 26; k += 1) {
        const a = Math.random() * Math.PI * 2;
        const v = 320 * (0.4 + Math.random() * 1.3);
        s.particles.push({
          x: b.x + Math.random() * boardW,
          y: lineY,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 220,
          g: 280 + Math.random() * 200,
          a: 1,
          s: 2 + Math.random() * 4,
          c: Math.random() < 0.4 ? 0xffffff : c,
          l: 520 + Math.random() * 320,
        });
      }
      ring(s, b.x + boardW * 0.5, lineY, c, 16, 260, 2);
      ring(s, b.x + boardW * 0.5, lineY, 0xffffff, 8, 180, 3);
    }
  }

  ring(s, x, y, c, n === 4 ? 34 : 22, n === 4 ? 620 : 420, n === 4 ? 5 : 3);
  ring(s, x, y, 0xffffff, n === 4 ? 22 : 14, 320, 2);
  ring(s, x, y, c, n === 4 ? 50 : 34, n === 4 ? 760 : 520, 2);
  ring(s, x, y, c, n === 4 ? 70 : 46, n === 4 ? 920 : 640, 2);
  ring(s, W * 0.5, H * 0.5, c, n === 4 ? 120 : 80, n === 4 ? 900 : 640, n === 4 ? 6 : 3);
  ring(s, W * 0.5, H * 0.5, 0xffffff, n === 4 ? 80 : 50, n === 4 ? 620 : 420, 3);
  burst(s, x, y, c, n === 4 ? 44 : 26, n === 4 ? 320 : 220, 1.2);
  burst(s, x, y, 0xffffff, n === 4 ? 20 : 12, n === 4 ? 220 : 140, 1.5);

  if (n === 4) {
    s.trails.push({
      beam: 1, x, y: b.y - 24,
      h: y - (b.y - 24) + b.c * 0.6,
      w: b.c * 1.1, a: 1, c: 0xffffff, e: c, l: 560,
      j: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
    });
  }

  s.flash += n === 4 ? 0.85 : 0.48;
  s.flashC = c;
  s.pulse += n === 4 ? 1.8 : 0.8;
  s.warpT = n === 4 ? 500 : 350;
  if (n >= 2) ring(s, W * 0.5, H * 0.5, c, n === 4 ? 180 : 130, n === 4 ? 1100 : 800, n === 4 ? 8 : 5);
  if (n === 4) s.swapT = 400;
  s.cameras.main.shake(n === 4 ? 360 : 200, n === 4 ? 0.014 : 0.008);
  if (n >= 2) swell(s);
  const cam = s.cameras.main;
  const zm = n === 4 ? 1.04 : 1.02;
  s.zmBusy = 1;
  cam.zoomTo(zm, 120);
  s.time.delayedCall(140, () => { cam.zoomTo(1, 260); s.zmBusy = 0; });
  snd(s, `c${n}`);
}

function deferredFx(s, x, y, c, n) {
  ring(s, x, y, c, 10, 180, 2);
  burst(s, x, y, c, 5, 90, 0.5);
  s.pulse += 0.1;
  snd(s, 'defer');
}

function center(b) {
  let x = 0;
  let y = 0;
  for (const q of SHAPES[b.p.i][b.p.r]) {
    x += b.p.x + q[0] + 0.5;
    y += b.p.y + q[1] + 0.5;
  }
  return [b.x + (x / 4) * b.c, b.y + ((y / 4) - VO) * b.c];
}

function burst(s, x, y, c, n, sp, lift) {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const v = sp * (0.3 + Math.random() * 1.1);
    s.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - sp * lift,
      g: 120 + Math.random() * 140,
      a: 0.9,
      s: 2 + Math.random() * 4,
      c,
      l: 360 + Math.random() * 220,
    });
  }
}

function ring(s, x, y, c, r, l, w) {
  s.rings.push({ x, y, c, r, a: 0.55, v: r * 3.5, l, w });
}

function theme(lv) {
  if (lv < 2) return {
    k: 0, bg: 0x020612, band: [0x0c1cff, 0x2feaff],
    frame: 0x28dfff, glow: 0x1b5cff, dust: 0x39e8ff,
    text: '#e8fbff', hot: '#7feeff',
    cells: [0x1e46ff, 0x215fff, 0x2ecfff, 0x66f7ff],
  };
  if (lv < 4) return {
    k: 1, bg: 0x090100, band: [0x200000, 0xff2d19],
    frame: 0xff2c26, glow: 0x6c0400, dust: 0xff9a22,
    text: '#fff1d7', hot: '#ffd576',
    cells: [0xa90000, 0xff2515, 0xff5125, 0xff8a3d],
  };
  if (lv < 7) return {
    k: 2, bg: 0x120024, band: [0x2a0030, 0xff3eea],
    frame: 0xff52e0, glow: 0x5a0070, dust: 0xffb0ff, side: 0x9b44ff,
    text: '#ffe0ff', hot: '#ff95ff',
    cells: [0xa000c0, 0xff3fe0, 0xff75ff, 0xffc0ff],
  };
  return {
    k: 3, bg: 0x101010, band: [0x303030, 0xffffff],
    frame: 0xffffff, glow: 0xffe0a0, dust: 0xfff0c0, side: 0xffcf40,
    text: '#ffffff', hot: '#ffffff',
    cells: [0xffb060, 0xffe0a0, 0xffffe0, 0xffffff],
  };
}

function tint(th, id) {
  return th ? th.cells[id % th.cells.length] : PAL[id];
}

function timeText(ms) {
  const t = (ms / 1000) | 0;
  const m = (t / 60) | 0;
  const s = t % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function numText(n) {
  return n.toLocaleString('en-US');
}

function fxPlasma(bg, th, time, beat, flash) {
  const t = time * 0.0006;
  const amp = 1 + flash * 0.5;
  for (let y = 0; y < H; y += 8) {
    const s1 = Math.sin(y * 0.02 + t);
    const s2 = Math.sin(y * 0.013 - t * 1.3 + beat * 2);
    const c = s1 + s2 < 0 ? th.band[0] : th.band[1];
    bg.fillStyle(c, (0.08 + Math.abs(s1 + s2) * 0.04) * amp);
    bg.fillRect(0, y, W, 9);
  }
}

function fxCopper(bg, th, time, beat, flash) {
  const t = time * 0.0009;
  const amp = 1 + flash * 0.7;
  for (let i = 0; i < 5; i += 1) {
    const y = H * 0.5 + Math.sin(t + i * 1.1) * H * 0.42;
    const h = 36 + Math.sin(t * 2 + i) * 8 + beat * 14;
    bg.fillStyle(i & 1 ? th.band[1] : th.frame, 0.1 * amp);
    bg.fillRect(0, y - h * 0.5, W, h);
    bg.fillStyle(th.dust, 0.18 * amp);
    bg.fillRect(0, y - 2, W, 2);
  }
}

function fxSunburst(bg, th, time, beat, flash) {
  const cx = W * 0.5;
  const cy = H * 0.5;
  const rot = time * 0.00025;
  const amp = 1 + flash * 0.8;
  bg.lineStyle(2 + beat * 4, th.frame, (0.1 + beat * 0.14) * amp);
  for (let i = 0; i < 24; i += 1) {
    const a = rot + (i / 24) * Math.PI * 2;
    bg.lineBetween(cx, cy, cx + Math.cos(a) * 640, cy + Math.sin(a) * 640);
  }
  bg.fillStyle(th.glow, 0.18 * amp);
  bg.fillCircle(cx, cy, 60 + beat * 30);
}

function fxTunnel(bg, th, time, beat, flash) {
  const cx = W * 0.5;
  const cy = H * 0.5;
  const t = time * 0.0015;
  const amp = 1 + flash * 0.9;
  for (let i = 0; i < 8; i += 1) {
    const p = (t + i / 8) % 1;
    const r = p * 520;
    bg.lineStyle(2 + beat * 3, i & 1 ? th.frame : th.band[1], (1 - p) * 0.22 * amp);
    bg.strokeEllipse(cx, cy, r * 1.6, r);
  }
  bg.fillStyle(th.dust, 0.15 + beat * 0.2);
  bg.fillCircle(cx, cy, 14 + beat * 18);
}

function soloBg(s, th, lv, time) {
  const bg = s.bg;
  const glow = s.glow;
  const bp = s.beatPhase;
  const fl = Math.min(1, s.flash);
  const warp = 1 + (s.warpT / 500) * 2.5;
  const t = time * warp;
  const k = s.swapT > 0 ? (th.k + 2) & 3 : th.k;

  bg.fillStyle(th.bg, 1);
  bg.fillRect(0, 0, W, H);

  if (!k) fxPlasma(bg, th, t, bp, fl);
  else if (k === 1) fxCopper(bg, th, t, bp, fl);
  else if (k === 2) fxSunburst(bg, th, t, bp, fl);
  else fxTunnel(bg, th, t, bp, fl);

  for (const d of s.dust) {
    glow.fillStyle(th.dust, 0.03 + d.s * 0.02 + s.pulse * 0.01);
    glow.fillCircle(d.x, d.y, d.s + th.k * 0.4);
  }

  if (s.beatStrong > 0) {
    glow.fillStyle(th.frame, s.beatStrong * 0.1);
    glow.fillRect(0, 0, W, H);
  }
}

function draw(s, time) {
  const bg = s.bg;
  const glow = s.glow;
  const fg = s.fg;
  const pulse = s.pulse;
  const solo = s.mode === 1 && s.boards[0];
  const th = solo ? theme(s.boards[0].lv) : 0;

  bg.clear();
  glow.clear();
  fg.clear();

  if (th) {
    soloBg(s, th, s.boards[0].lv, time);
  } else {
    const vl = mxl(s);
    soloBg(s, theme(vl), vl, time);
  }

  for (const tr of s.trails) {
    if (tr.amb) {
      glow.fillStyle(tr.c, tr.a * 0.6);
      glow.fillCircle(tr.x, tr.y, tr.r);
    } else if (tr.beam) {
      glow.fillStyle(tr.e || tr.c, tr.a * 0.12);
      glow.fillRect(tr.x - tr.w * 2.4, tr.y, tr.w * 4.8, tr.h);
      glow.fillStyle(tr.c, tr.a * 0.2);
      glow.fillRect(tr.x - tr.w, tr.y, tr.w * 2, tr.h);
      glow.fillStyle(tr.c, tr.a * 0.18);
      glow.fillCircle(tr.x, tr.y + tr.h, tr.w * 1.6);
      fg.fillStyle(tr.c, tr.a * 0.96);
      fg.fillRect(tr.x - tr.w * 0.24, tr.y, tr.w * 0.48, tr.h);
      fg.lineStyle(2, tr.c, tr.a * 0.35);
      let px = tr.x;
      let py = tr.y;
      for (let i = 0; i < tr.j.length; i += 1) {
        const nx = tr.x + tr.j[i] * tr.w * 0.7;
        const ny = tr.y + (tr.h * (i + 1)) / tr.j.length;
        fg.lineBetween(px, py, nx, ny);
        px = nx;
        py = ny;
      }
      fg.lineBetween(px, py, tr.x, tr.y + tr.h);
    } else {
      glow.fillStyle(tr.c, tr.a);
      glow.fillRect(tr.x, tr.y, tr.w, tr.h);
    }
  }

  for (const r of s.rings) {
    glow.lineStyle(r.w, r.c, r.a);
    glow.strokeCircle(r.x, r.y, r.r);
  }
  for (const p of s.particles) {
    glow.fillStyle(p.c, p.a);
    glow.fillCircle(p.x, p.y, p.s);
  }

  if (s.phase !== 'menu') {
    if (s.mode === 2) {
      glow.fillStyle(0x7be8ff, 0.08 + pulse * 0.05);
      glow.fillRect(W / 2 - 3, 90, 6, 420);
      fg.fillStyle(0xffffff, 0.18);
      fg.fillRect(W / 2 - 1, 90, 2, 420);
    }
    for (const b of s.boards) drawBoard(s, b, th && s.mode === 1 ? th : 0);
  }

  if (s.phase === 'menu') {
    fg.lineStyle(2, PAL[0], 0.35);
    fg.strokeRect(140, 208, 520, 150);
    glow.fillStyle(s.sel ? PAL[1] : PAL[0], 0.1 + s.beatPhase * 0.05);
    glow.fillRect(150, s.sel ? 274 : 218, 500, 48);
  }

  if (s.phase === 'over') {
    glow.fillStyle(PAL[1], 0.08);
    glow.fillRect(140, 190, 520, 180);
    fg.fillStyle(0x020611, 0.82);
    fg.fillRect(150, 200, 500, 160);
    fg.lineStyle(2, 0xffffff, 0.22);
    fg.strokeRect(150, 200, 500, 160);
  }

  if (s.flash > 0) {
    if (s.flashC) {
      glow.fillStyle(s.flashC, Math.min(0.35, s.flash * 0.28));
      glow.fillRect(0, 0, W, H);
    }
    glow.fillStyle(0xffffff, Math.min(0.55, s.flash * 0.32));
    glow.fillRect(0, 0, W, H);
  }
}

function drawBoard(s, b, th) {
  const fg = s.fg;
  const glow = s.glow;
  const x = b.x;
  const y = b.y;
  const c = b.c;
  const w = BW * c;
  const h = 20 * c;

  if (b.res) {
    const t = b.resT / 6500;
    glow.fillStyle(th ? th.frame : PAL[1], 0.14 + s.beatPhase * 0.08);
    glow.fillRect(x - 18, y - 14, w + 36, h + 28);
    glow.fillStyle(0xffffff, 0.05 * t);
    glow.fillRect(x, y, w, h);
  }

  if (th) {
    glow.fillStyle(th.frame, 0.05 + b.flash * 0.03);
    glow.fillRect(x - 12, y - 8, 8, h + 16);
    glow.fillRect(x + w + 4, y - 8, 8, h + 16);
    glow.fillRect(x - 8, y + h + 4, w + 16, 8);
    fg.fillStyle(0x000000, 0.9);
    fg.fillRect(x, y, w, h);
    fg.lineStyle(3, th.frame, 0.75 + s.beatPhase * 0.18);
    fg.lineBetween(x, y, x, y + h);
    fg.lineBetween(x + w, y, x + w, y + h);
    fg.lineBetween(x, y + h, x + w, y + h);
  } else {
    glow.fillStyle(PAL[0], 0.03 + b.flash * 0.03);
    glow.fillRect(x - 10, y - 10, w + 20, h + 20);
    fg.fillStyle(0x08101f, 0.92);
    fg.fillRect(x, y, w, h);
    fg.lineStyle(2, 0x87d7ff, 0.28 + b.flash * 0.25 + s.beatPhase * 0.12);
    fg.strokeRect(x - 1, y - 1, w + 2, h + 2);
  }

  fg.lineStyle(1, th ? th.frame : 0x1b2748, th ? 0.12 : 0.32);
  for (let i = 1; i < BW; i += 1) fg.lineBetween(x + i * c, y, x + i * c, y + h);
  for (let i = 1; i < 20; i += 1) fg.lineBetween(x, y + i * c, x + w, y + i * c);

  for (let ry = VO; ry < BH; ry += 1) {
    for (let rx = 0; rx < BW; rx += 1) {
      const v = b.a[ry][rx];
      if (v) block(s, x + rx * c, y + (ry - VO) * c, c, tint(th, v - 1), 1, v === 8, th);
    }
  }

  if (b.p) {
    let gy = b.p.y;
    while (fit(b, b.p.i, b.p.r, b.p.x, gy + 1)) gy += 1;
    piece(s, b, b.p.i, b.p.r, b.p.x, gy, 0.35, 1, th);
    piece(s, b, b.p.i, b.p.r, b.p.x, b.p.y, 1, 0, th);
  }

  if (b.flash > 0) {
    glow.fillStyle(0xffffff, b.flash * 0.3);
    glow.fillRect(x, y, w, h);
  }

  preview(s, b, th);
  holdBox(s, b, th);
  chargeMeter(s, b, th);
  if (s.mode === 2) garbageBar(s, b);
  if (b.combo > 1) comboLabel(s, b, th);
}

function piece(s, b, id, r, px, py, a, ghost, th) {
  for (const q of SHAPES[id][r]) {
    const y = py + q[1];
    if (y < VO) continue;
    const x = b.x + (px + q[0]) * b.c;
    const gy = b.y + (y - VO) * b.c;
    if (ghost) {
      const gc = 0xffffff;
      s.glow.fillStyle(tint(th, id), 0.045 * a);
      s.glow.fillRect(x - 4, gy - 4, b.c + 8, b.c + 8);
      s.fg.fillStyle(0x000000, 0.34 * a);
      s.fg.fillRect(x + 3, gy + 3, b.c - 6, b.c - 6);
      s.fg.lineStyle(2, gc, 0.92 * a);
      s.fg.strokeRect(x + 2, gy + 2, b.c - 4, b.c - 4);
      s.fg.lineStyle(1, tint(th, id), 0.25 * a);
      s.fg.strokeRect(x + 4, gy + 4, b.c - 8, b.c - 8);
    } else {
      if (a >= 1) {
        s.glow.fillStyle(tint(th, id), 0.08 + s.beatPhase * 0.14);
        s.glow.fillCircle(x + b.c * 0.5, gy + b.c * 0.5, b.c * 1.9);
      }
      block(s, x, gy, b.c, tint(th, id), a, 0, th);
    }
  }
}

function block(s, x, y, c, col, a, dull, th) {
  s.glow.fillStyle(col, (dull ? 0.06 : 0.16) * a);
  s.glow.fillRect(x - 4, y - 4, c + 8, c + 8);
  s.glow.fillStyle(col, (dull ? 0.035 : 0.09) * a);
  s.glow.fillRect(x - 8, y - 8, c + 16, c + 16);
  s.fg.fillStyle(col, (dull ? 0.55 : 0.85) * a);
  s.fg.fillRect(x + 1, y + 1, c - 2, c - 2);
  s.fg.fillStyle(0xffffff, 0.16 * a);
  s.fg.fillRect(x + 2, y + 2, c - 4, 2);
  s.fg.fillStyle(0xffffff, 0.06 * a);
  s.fg.fillRect(x + 2, y + 2, 2, c - 4);
  if (th && th.k >= 2) {
    s.fg.fillStyle(0xffffff, 0.12 * a);
    s.fg.fillRect(x + c * 0.35, y + c * 0.35, c * 0.3, c * 0.3);
  }
}

function preview(s, b, th) {
  const c = Math.max(6, (b.c * 0.45) | 0);
  const tone = th ? th.frame : 0xffffff;
  const rightX = b.x + BW * b.c + (s.mode === 1 ? 40 : 24);
  for (let i = 0; i < 3; i += 1) {
    const py = b.y + 12 + i * (c * 4 + 18);
    s.fg.fillStyle(0x000000, 0.85);
    s.fg.fillRect(rightX - 6, py - 6, c * 5, c * 4 + 12);
    s.fg.lineStyle(1, tone, 0.4);
    s.fg.strokeRect(rightX - 6, py - 6, c * 5, c * 4 + 12);
    if (b.next[i] != null) mini(s, b.next[i], rightX, py, c, th);
  }
}

function holdBox(s, b, th) {
  const c = Math.max(6, (b.c * 0.45) | 0);
  const tone = th ? th.frame : 0xffffff;
  const x = b.x - (s.mode === 1 ? 108 : 84);
  const y = b.y + 12;
  s.fg.fillStyle(0x000000, 0.85);
  s.fg.fillRect(x - 6, y - 6, c * 5, c * 4 + 12);
  s.fg.lineStyle(1, b.holdUsed ? 0x555577 : tone, b.holdUsed ? 0.3 : 0.6);
  s.fg.strokeRect(x - 6, y - 6, c * 5, c * 4 + 12);
  s.fg.fillStyle(tone, 0.5);
  if (b.hold >= 0) mini(s, b.hold, x, y, c, th, b.holdUsed ? 0.35 : 1);
}

function chargeMeter(s, b, th) {
  const col = th ? th.frame : PAL[1];
  const x = b.x - (s.mode === 1 ? 28 : 22);
  const y = b.y + 16;
  const hh = 20 * b.c - 32;
  s.fg.fillStyle(0x000000, 0.7);
  s.fg.fillRect(x - 4, y - 4, 12, hh + 8);
  s.fg.lineStyle(1, col, 0.4);
  s.fg.strokeRect(x - 4, y - 4, 12, hh + 8);
  const fh = hh * b.charge;
  s.glow.fillStyle(col, 0.3 + (b.charge >= 1 ? 0.3 + s.beatPhase * 0.3 : 0));
  s.glow.fillRect(x - 10, y + hh - fh - 10, 24, fh + 20);
  s.fg.fillStyle(col, 0.9);
  s.fg.fillRect(x - 2, y + hh - fh - 2, 8, fh + 4);
  if (b.res) {
    const t = b.resT / 6500;
    s.glow.lineStyle(3, 0xffffff, 0.6 * t);
    s.glow.strokeRect(x - 6, y - 6, 16, hh + 12);
  }
}

function comboLabel(s, b, th) {
  const col = th ? th.hot : '#ffffff';
  // handled via hud text; skip graphics
  void col;
}

function mini(s, id, x, y, c, th, alpha) {
  const sh = SHAPES[id][0];
  let minx = 9;
  let miny = 9;
  let maxx = -1;
  let maxy = -1;
  for (const q of sh) {
    if (q[0] < minx) minx = q[0];
    if (q[1] < miny) miny = q[1];
    if (q[0] > maxx) maxx = q[0];
    if (q[1] > maxy) maxy = q[1];
  }
  const ox = x + ((4 - (maxx - minx + 1)) * c) / 2 - minx * c;
  const oy = y + ((4 - (maxy - miny + 1)) * c) / 2 - miny * c;
  const a = alpha == null ? 0.82 : 0.82 * alpha;
  for (const q of sh) block(s, ox + q[0] * c, oy + q[1] * c, c, tint(th, id), a, 0, th);
}

function garbageBar(s, b) {
  const x = b.side > 0 ? b.x + BW * b.c + 8 : b.x - 10;
  const y = b.y + 20 * b.c - 8;
  for (let i = 0; i < Math.min(b.gar, 12); i += 1) {
    s.glow.fillStyle(PAL[6], 0.14);
    s.glow.fillRect(x - 2, y - i * 8 - 2, 8, 6);
    s.fg.fillStyle(PAL[6], 0.82);
    s.fg.fillRect(x, y - i * 8, 4, 4);
  }
}

function stepFx(s, time, delta) {
  for (const d of s.dust) {
    d.y -= d.v * delta * 3;
    d.x += Math.sin(time * 0.0005 + d.o) * d.v * delta * 1.5;
    if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
    if (d.x < -10) d.x = W + 10;
    else if (d.x > W + 10) d.x = -10;
  }
  for (let i = s.particles.length - 1; i >= 0; i -= 1) {
    const p = s.particles[i];
    p.x += p.vx * delta * 0.001;
    p.y += p.vy * delta * 0.001;
    p.vy += p.g * delta * 0.001;
    p.a -= delta / p.l;
    p.s *= 0.998;
    if (p.a <= 0) s.particles.splice(i, 1);
  }
  for (let i = s.rings.length - 1; i >= 0; i -= 1) {
    const r = s.rings[i];
    r.r += r.v * delta * 0.001;
    r.a -= delta / r.l;
    if (r.a <= 0) s.rings.splice(i, 1);
  }
  for (let i = s.trails.length - 1; i >= 0; i -= 1) {
    const t = s.trails[i];
    if (t.amb) {
      t.x += t.vx * delta * 0.001;
      t.y += t.vy * delta * 0.001;
    }
    t.a -= delta / t.l;
    if (t.a <= 0) s.trails.splice(i, 1);
  }
  s.flash = Math.max(0, s.flash - delta * 0.0009);
  if (s.flash <= 0) s.flashC = 0;
  s.pulse = Math.max(0.05, s.pulse - delta * 0.0005);
  s.beatStrong = Math.max(0, s.beatStrong - delta * 0.0025);
  s.warpT = Math.max(0, s.warpT - delta);
  s.swapT = Math.max(0, s.swapT - delta);
  for (const b of s.boards) b.flash = Math.max(0, b.flash - delta * 0.003);
}

function syncUi(s) {
  const menu = s.phase === 'menu';
  const play = s.phase === 'play';
  const over = s.phase === 'over';

  s.menu1.setVisible(menu);
  s.menu2.setVisible(menu);
  s.credit.setVisible(menu);
  s.over1.setVisible(over);
  s.over2.setVisible(over);

  if (menu) {
    s.title.setText('TETRISKI');
    s.title.setColor('#f8fbff');
    s.menu1.setColor(s.sel === 0 ? '#46f5ff' : '#a8b4d8');
    s.menu2.setColor(s.sel === 1 ? '#ff5dd7' : '#a8b4d8');
    s.menu1.setScale(s.sel === 0 ? 1.08 : 1);
    s.menu2.setScale(s.sel === 1 ? 1.08 : 1);
    s.info.setText(`RESONANCE ARCADE\nHI ${numText(s.hi)}   BEST COMBO ${s.bestCombo}\nUP DOWN SELECT   BTN PLAY   BTN3 RESONANCE   BTN4 HOLD`);
    s.hud1.setVisible(0);
    s.hud2.setVisible(0);
    return;
  }

  s.menu1.setScale(1);
  s.menu2.setScale(1);
  s.title.setText(s.mode === 1 ? 'TETRISKI' : 'VERSUS');

  if (s.mode === 1) {
    const b = s.boards[0];
    const th = theme(b.lv);
    s.hud1.setVisible(1);
    s.hud2.setVisible(1);
    s.title.setColor(th.hot);
    const comboStr = b.combo > 1 ? `\nCOMBO x${b.combo}` : '';
    const resStr = b.res ? `\nRESONANCE ${(b.resT / 1000).toFixed(1)}` : b.charge >= 1 ? '\nREADY BTN3' : '';
    s.hud1.setColor(th.text).setPosition(20, 286).setText(`LV\n${b.lv}\n\nLINES\n${b.lines}${comboStr}${resStr}`);
    s.hud2.setColor(th.text).setPosition(780, 286).setText(`TIME\n${timeText(b.time)}\n\nSCORE\n${numText(b.score)}\n\nHI\n${numText(s.hi)}`);
    s.info.setColor(th.hot).setText(play ? 'MOVE   BTN1 ROTATE   BTN2 DROP   BTN3 RESONANCE   BTN4 HOLD' : '');
  } else {
    const a = s.boards[0];
    const b = s.boards[1];
    s.hud1.setVisible(1);
    s.hud2.setVisible(1);
    s.title.setColor('#f8fbff');
    s.hud1.setColor('#f8fbff');
    s.hud2.setColor('#f8fbff');
    s.info.setColor('#90a4d7');
    const aC = a.combo > 1 ? ` xC${a.combo}` : '';
    const bC = b.combo > 1 ? `xC${b.combo} ` : '';
    const aR = a.res ? ' RES' : a.charge >= 1 ? ' RDY' : '';
    const bR = b.res ? 'RES ' : b.charge >= 1 ? 'RDY ' : '';
    s.hud1.setPosition(20, 92).setText(`P1 L${a.lines} S${numText(a.score)}${aC}${aR}${a.gar ? ` G${a.gar}` : ''}`);
    s.hud2.setPosition(780, 92).setText(`${b.gar ? `G${b.gar} ` : ''}${bR}${bC}S${numText(b.score)} L${b.lines} P2`);
    s.info.setText(play ? 'BTN1 ROTATE  BTN2 DROP  BTN3 RESONANCE  BTN4 HOLD' : '');
  }
}

function held(s, code) {
  return !!s.inputState.held[code];
}

function tap(s, code) {
  if (!s.inputState.pressed[code]) return 0;
  s.inputState.pressed[code] = 0;
  return 1;
}

function tapAny(s, codes) {
  for (const code of codes) if (tap(s, code)) return 1;
  return 0;
}

function norm(key) {
  if (typeof key !== 'string' || !key) return '';
  return key === ' ' ? 'space' : key.toLowerCase();
}

function row() {
  return Array(BW).fill(0);
}

function ctx(s) {
  try {
    const c = s.sound && s.sound.context;
    if (!c) return null;
    if (c.state === 'suspended') c.resume();
    if (!s._filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 8000;
      f.Q.value = 0.7;
      f.connect(c.destination);
      s._filter = f;
    }
    if (!s._mgain) {
      const mf = c.createBiquadFilter();
      mf.type = 'lowpass';
      mf.frequency.value = 2400;
      mf.Q.value = 0.8;
      const mg = c.createGain();
      mg.gain.value = 0;
      mf.connect(mg);
      mg.connect(c.destination);
      const sr = c.sampleRate;
      const len = (sr * 0.9) | 0;
      const ir = c.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch += 1) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i += 1) {
          const tt = i / len;
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - tt, 3);
        }
      }
      const conv = c.createConvolver();
      conv.buffer = ir;
      const wet = c.createGain();
      wet.gain.value = 0.35;
      mf.connect(conv);
      conv.connect(wet);
      wet.connect(c.destination);
      s._mfilter = mf;
      s._mgain = mg;
      s._wet = wet;
    }
    return c;
  } catch {
    return null;
  }
}

function dest(s, c) {
  return s._filter || c.destination;
}

function filterRamp(s, target, dur) {
  const c = ctx(s);
  if (!c || !s._filter) return;
  const now = c.currentTime;
  try {
    s._filter.frequency.cancelScheduledValues(now);
    s._filter.frequency.setValueAtTime(s._filter.frequency.value, now);
    s._filter.frequency.linearRampToValueAtTime(target, now + dur);
  } catch {}
}

function tone(s, c, from, to, dur, vol, type, delay) {
  const o = c.createOscillator();
  const g = c.createGain();
  const now = c.currentTime + (delay || 0);
  o.type = type || 'triangle';
  o.connect(g);
  g.connect(dest(s, c));
  o.frequency.setValueAtTime(from, now);
  if (to) o.frequency.exponentialRampToValueAtTime(to, now + dur * 0.85);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.start(now);
  o.stop(now + dur);
}

function noise(s, c, dur, vol, hp, delay) {
  const now = c.currentTime + (delay || 0);
  const sr = c.sampleRate;
  const len = Math.max(1, (sr * dur) | 0);
  const buf = c.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  src.buffer = buf;
  f.type = 'highpass';
  f.frequency.value = hp || 1200;
  src.connect(f);
  f.connect(g);
  g.connect(dest(s, c));
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.start(now);
  src.stop(now + dur);
}

function kickDrum(s, c, from, to, dur, vol, delay) {
  tone(s, c, from, to || from * 0.24, dur || 0.08, vol || 0.04, 'sine', delay || 0);
}

function snd(s, id) {
  const c = ctx(s);
  if (!c) return;
  if (id === 'c1' || id === 'c2' || id === 'c3' || id === 'c4') {
    const r = s.music ? MP[s.music.idx][0] : 45;
    const off = [0, 5, 7, 12][id.charCodeAt(1) - 49];
    const fc = 440 * Math.pow(2, (r + off - 57) / 12);
    tone(s, c, fc, fc, 0.4, 0.05, 'triangle', 0.04);
  }
  if (id === 'move') tone(s, c, 760, 540, 0.045, 0.025, 'square');
  else if (id === 'rot') tone(s, c, 980, 720, 0.06, 0.03, 'triangle');
  else if (id === 'fast') {
    kickDrum(s, c, 180, 55, 0.06, 0.035);
    tone(s, c, 760, 240, 0.07, 0.016, 'sawtooth');
  }
  else if (id === 'drop') tone(s, c, 160, 56, 0.18, 0.09, 'square');
  else if (id === 'hold') {
    tone(s, c, 440, 660, 0.06, 0.03, 'triangle');
    tone(s, c, 880, 1100, 0.04, 0.02, 'sine', 0.02);
  }
  else if (id === 'defer') {
    tone(s, c, 660, 880, 0.08, 0.025, 'triangle');
    tone(s, c, 1320, 1760, 0.05, 0.012, 'sine', 0.02);
  }
  else if (id === 'combo') tone(s, c, 880, 1760, 0.1, 0.028, 'triangle');
  else if (id === 'c1') {
    kickDrum(s, c, 210, 58, 0.08, 0.045);
    tone(s, c, 240, 420, 0.13, 0.04, 'sawtooth');
    tone(s, c, 760, 520, 0.16, 0.018, 'triangle', 0.018);
    noise(s, c, 0.04, 0.01, 2600, 0.012);
  }
  else if (id === 'c2') {
    kickDrum(s, c, 220, 56, 0.085, 0.048);
    tone(s, c, 220, 380, 0.13, 0.038, 'sawtooth');
    tone(s, c, 420, 700, 0.11, 0.03, 'triangle', 0.045);
    tone(s, c, 880, 620, 0.18, 0.018, 'triangle', 0.075);
    noise(s, c, 0.05, 0.012, 2500, 0.02);
  } else if (id === 'c3') {
    kickDrum(s, c, 230, 54, 0.09, 0.052);
    tone(s, c, 200, 340, 0.15, 0.04, 'sawtooth');
    tone(s, c, 360, 620, 0.13, 0.033, 'triangle', 0.04);
    tone(s, c, 620, 1040, 0.16, 0.03, 'triangle', 0.085);
    tone(s, c, 1240, 760, 0.2, 0.015, 'sine', 0.12);
    noise(s, c, 0.065, 0.014, 2300, 0.018);
  } else if (id === 'c4') {
    kickDrum(s, c, 240, 52, 0.1, 0.06);
    kickDrum(s, c, 180, 46, 0.09, 0.03, 0.035);
    tone(s, c, 180, 320, 0.18, 0.045, 'sawtooth');
    tone(s, c, 320, 560, 0.15, 0.036, 'triangle', 0.04);
    tone(s, c, 540, 980, 0.18, 0.034, 'triangle', 0.085);
    tone(s, c, 1360, 820, 0.22, 0.018, 'sine', 0.12);
    noise(s, c, 0.085, 0.018, 2100, 0.02);
  } else if (id === 'res_on') {
    tone(s, c, 660, 220, 0.5, 0.05, 'sawtooth');
    tone(s, c, 990, 330, 0.4, 0.03, 'triangle', 0.05);
    noise(s, c, 0.2, 0.02, 1800);
  } else if (id === 'res_off') {
    kickDrum(s, c, 280, 48, 0.18, 0.09);
    tone(s, c, 220, 640, 0.25, 0.06, 'sawtooth');
    tone(s, c, 440, 1280, 0.22, 0.04, 'triangle', 0.03);
    tone(s, c, 660, 1760, 0.2, 0.035, 'triangle', 0.06);
    tone(s, c, 880, 2200, 0.25, 0.03, 'sine', 0.09);
    tone(s, c, 1320, 2640, 0.28, 0.025, 'sine', 0.14);
    noise(s, c, 0.18, 0.03, 1600, 0.02);
  } else if (id === 'over') tone(s, c, 420, 70, 0.55, 0.12, 'sawtooth');
  else if (id === 'kick') kickDrum(s, c, 70, 45, 0.12, 0.03);
  else if (id === 'hat') noise(s, c, 0.03, 0.008, 4000);
  else if (id === 'start') tone(s, c, 320, 960, 0.2, 0.04, 'square');
}

const MP = [
  [33, 120, 0x1111, 0x0421, 0x2222, 1800, 2],
  [33, 128, 0x1111, 0x1248, 0x2222, 2000, 2],
  [35, 136, 0x1111, 0x2424, 0x4444, 2200, 2],
  [36, 144, 0x1115, 0x1248, 0x2222, 2400, 1],
  [38, 152, 0x1111, 0x4242, 0xA2A2, 2600, 1],
  [36, 160, 0x1113, 0x5555, 0xA5A5, 2800, 1],
  [33, 168, 0x1515, 0x2929, 0xA5A5, 3000, 3],
  [38, 176, 0x1555, 0x5A5A, 0xAAAA, 3200, 3],
  [40, 184, 0x1555, 0x5AAA, 0xAAAA, 3400, 2],
  [33, 192, 0x1555, 0xAAAA, 0xAAAA, 3600, 3],
  [45, 200, 0x1555, 0xAAAA, 0xAAAA, 3800, 3],
  [36, 210, 0x1DDD, 0x5555, 0xAAAA, 4200, 3],
  [33, 220, 0x1DDD, 0xFFFF, 0xAAAA, 4800, 3],
];
const MW = ['sine', 'triangle', 'sawtooth', 'square'];

function mxl(s) {
  let m = 1;
  for (const b of s.boards) if (b.lv > m) m = b.lv;
  return m;
}

function padSpawn(s, c, P) {
  const f = 440 * Math.pow(2, (P[0] - 69) / 12);
  const lv = mxl(s);
  const w = lv < 5 ? 'sine' : lv < 10 ? 'triangle' : 'sawtooth';
  const t = c.currentTime;
  const voices = [];
  for (const mult of [0.5, 0.75]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = w;
    o.frequency.value = f * mult;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 1.2);
    o.connect(g);
    g.connect(s._mfilter);
    o.start(t);
    voices.push({ o, g });
  }
  s._pad = voices;
}

function padKill(s, c) {
  if (!s._pad) return;
  const t = c.currentTime;
  for (const v of s._pad) {
    try {
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setValueAtTime(v.g.gain.value, t);
      v.g.gain.linearRampToValueAtTime(0, t + 0.4);
      v.o.stop(t + 0.45);
    } catch {}
  }
  s._pad = 0;
}

function swell(s) {
  const c = ctx(s);
  if (!c || !s._mfilter || !s.music) return;
  const hz = MP[s.music.idx][5];
  const f = s._mfilter.frequency;
  const t = c.currentTime;
  f.cancelScheduledValues(t);
  f.setValueAtTime(hz, t);
  f.linearRampToValueAtTime(hz * 1.6, t + 0.2);
  f.linearRampToValueAtTime(hz, t + 1.4);
}

function ambient(s, lv, dt) {
  if (!s.scale || Math.random() > (0.002 + lv * 0.0005) * dt) return;
  const th = theme(lv);
  const w = s.scale.width;
  const h = s.scale.height;
  const fast = lv >= 10;
  const drift = lv >= 4 && lv < 10;
  s.trails.push({
    amb: 1,
    x: Math.random() * w,
    y: fast ? -20 : h + 20,
    vx: drift ? (Math.random() * 40 - 20) : 0,
    vy: fast ? 220 + Math.random() * 140 : -(30 + Math.random() * 40),
    l: fast ? 1800 : 3600,
    a: 0.35,
    c: th.dust,
    r: fast ? 2 : 1.5,
  });
}

function mStep(s, c, P, st) {
  const f = 440 * Math.pow(2, (P[0] - 69) / 12);
  const bit = 1 << st;
  const save = s._filter;
  s._filter = s._mfilter;
  if (!(st & 3)) {
    kickDrum(s, c, 140, 48, 0.14, 0.18);
    s.beatPhase = 1;
    if (s._mgain && s.music) {
      const g = s._mgain.gain;
      const t = c.currentTime;
      const v = s.music.vol;
      g.cancelScheduledValues(t);
      g.setValueAtTime(v * 0.35, t + 0.015);
      g.linearRampToValueAtTime(v, t + 0.11);
    }
    if (s.scale) {
      const th = theme(mxl(s));
      ring(s, s.scale.width * 0.5, s.scale.height * 0.5, th.frame, 40, 180, 2);
    }
  }
  if (P[2] & bit) tone(s, c, f / 2, f / 2, 0.18, 0.14, MW[P[6]]);
  if (P[3] & bit) {
    const n = [0, 3, 5, 7, 10][(st * (3 + (P[0] & 3))) % 5] + 12;
    const f2 = f * Math.pow(2, n / 12);
    tone(s, c, f2, f2, 0.22, 0.08, 'triangle');
  }
  if (P[4] & bit) noise(s, c, 0.025, 0.04, 5000);
  s._filter = save;
}

function mDip(s, c, idx) {
  const g = s._mgain.gain;
  const t = c.currentTime;
  const v = s.music.vol;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0.0001, t + 0.1);
  g.linearRampToValueAtTime(v, t + 0.2);
  padKill(s, c);
  setTimeout(() => {
    if (!s.music) return;
    s.music.idx = idx;
    s.music.step = 0;
    s.music.acc = 0;
    const mf = s._mfilter;
    const tt = c.currentTime;
    mf.frequency.cancelScheduledValues(tt);
    mf.frequency.linearRampToValueAtTime(MP[idx][5], tt + 0.3);
    if (s._wet) {
      const w = 0.35 - Math.min(idx, 12) * 0.019;
      s._wet.gain.cancelScheduledValues(tt);
      s._wet.gain.linearRampToValueAtTime(w, tt + 0.4);
    }
    padSpawn(s, c, MP[idx]);
  }, 95);
}

const Music = {
  initAudio(s) { ctx(s); },
  startLevelMusic(s, lv) {
    const c = ctx(s);
    if (!c) return;
    const idx = ((lv - 1) % 13 + 13) % 13;
    const t = c.currentTime;
    if (!s.music) {
      s.music = { on: 1, idx, step: 0, acc: 0, vol: 0.85, muted: 0 };
      s._mfilter.frequency.value = MP[idx][5];
      s._mgain.gain.cancelScheduledValues(t);
      s._mgain.gain.linearRampToValueAtTime(0.85, t + 0.25);
      if (s._wet) s._wet.gain.value = 0.35 - Math.min(idx, 12) * 0.019;
      padSpawn(s, c, MP[idx]);
    } else {
      s.music.on = 1;
      if (s.music.idx !== idx) mDip(s, c, idx);
      else {
        s._mgain.gain.cancelScheduledValues(t);
        s._mgain.gain.linearRampToValueAtTime(s.music.vol, t + 0.2);
      }
    }
  },
  stopMusic(s) {
    if (!s.music) return;
    s.music.on = 0;
    if (s._mgain) {
      const c = ctx(s);
      const g = s._mgain.gain;
      const t = c.currentTime;
      g.cancelScheduledValues(t);
      g.linearRampToValueAtTime(0, t + 0.2);
      padKill(s, c);
    }
  },
  setMuted(s, b) {
    if (!s.music) return;
    s.music.muted = b ? 1 : 0;
    if (s._mgain) s._mgain.gain.value = b ? 0 : s.music.vol;
  },
  setVolume(s, v) {
    if (!s.music) return;
    s.music.vol = v;
    if (s._mgain && !s.music.muted) {
      const c = ctx(s);
      const g = s._mgain.gain;
      const t = c.currentTime;
      g.cancelScheduledValues(t);
      g.linearRampToValueAtTime(v, t + 0.15);
    }
  },
  tick(s, dt) {
    const M = s.music;
    if (!M || !M.on) return;
    const c = ctx(s);
    if (!c) return;
    M.acc += dt / 1000;
    const P = MP[M.idx];
    const d = 15 / P[1];
    while (M.acc >= d) {
      M.acc -= d;
      mStep(s, c, P, M.step);
      M.step = (M.step + 1) & 15;
    }
  },
};

function store() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw == null ? { found: 0, value: 0 } : { found: 1, value: JSON.parse(raw) };
      } catch {
        return { found: 0, value: 0 };
      }
    },
    async set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
  };
}

async function loadKey(k) {
  try {
    const r = await store().get(k);
    return r && r.found && typeof r.value === 'number' ? r.value : 0;
  } catch {
    return 0;
  }
}

function saveKey(k, v) {
  try { store().set(k, v); } catch {}
}
