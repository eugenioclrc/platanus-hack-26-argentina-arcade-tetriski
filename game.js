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
  s.lastBeat = 0;
  s.musicStep = 0;
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
    snd(s, s.beatFlip & 1 ? 'hat' : 'kick');
    playMusic(s);
  }
  s.beatPhase = Math.max(0, 1 - (time - s.lastBeat) / 220);

  if (s.phase === 'menu') updateMenu(s);
  else if (s.phase === 'play') updatePlay(s, time, delta);
  else updateOver(s);

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
}

function updateOver(s) {
  if (tapAny(s, ['START1', 'START2'])) startGame(s, s.mode);
  else if (tapAny(s, ['P1_1', 'P1_2', 'P2_1', 'P2_2'])) {
    s.phase = 'menu';
    s.boards = [];
    s.bpm = 120;
    s.over1.setText('');
    s.over2.setText('');
  }
}

function startGame(s, mode) {
  s.phase = 'play';
  s.mode = mode;
  s.flash = 0.12;
  s.pulse = 0.6;
  s.bpm = 120;
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
  return Math.max(70, 820 - (b.lv - 1) * 55);
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
      for (let k = 0; k < 14; k += 1) {
        const a = Math.random() * Math.PI * 2;
        const v = 260 * (0.4 + Math.random() * 1.2);
        s.particles.push({
          x: b.x + Math.random() * boardW,
          y: lineY,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 160,
          g: 280 + Math.random() * 200,
          a: 1,
          s: 2 + Math.random() * 3,
          c: Math.random() < 0.4 ? 0xffffff : c,
          l: 520 + Math.random() * 260,
        });
      }
      ring(s, b.x + boardW * 0.5, lineY, c, 16, 260, 2);
    }
  }

  ring(s, x, y, c, n === 4 ? 34 : 22, n === 4 ? 620 : 420, n === 4 ? 5 : 3);
  ring(s, x, y, 0xffffff, n === 4 ? 22 : 14, 320, 2);
  ring(s, x, y, c, n === 4 ? 50 : 34, n === 4 ? 760 : 520, 2);
  burst(s, x, y, c, n === 4 ? 32 : 18, n === 4 ? 260 : 180, 1.1);
  burst(s, x, y, 0xffffff, n === 4 ? 14 : 8, n === 4 ? 180 : 120, 1.4);

  if (n === 4) {
    s.trails.push({
      beam: 1, x, y: b.y - 24,
      h: y - (b.y - 24) + b.c * 0.6,
      w: b.c * 1.1, a: 1, c: 0xffffff, e: c, l: 560,
      j: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
    });
  }

  s.flash += n === 4 ? 0.4 : 0.18;
  s.pulse += n === 4 ? 1.4 : 0.6;
  s.cameras.main.shake(n === 4 ? 240 : 130, n === 4 ? 0.006 : 0.003);
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

function soloBg(s, th, lv, time) {
  const bg = s.bg;
  const glow = s.glow;
  const k = time * 0.001;
  const p = s.pulse;
  const bp = s.beatPhase;

  bg.fillStyle(th.bg, 1);
  bg.fillRect(0, 0, W, H);

  if (!th.k) {
    for (let i = 0; i < 4; i += 1) {
      const y = 72 + i * 118 + Math.sin(k * 1.7 + i) * 12;
      bg.fillStyle(th.band[i & 1], 0.1 + p * 0.04 + bp * 0.05);
      bg.fillRect(-20, y, W + 40, 54);
    }
    for (let i = 0; i < 5; i += 1) {
      const r = (time * 0.08 + i * 120) % 520;
      glow.lineStyle(2, th.frame, 0.035 + p * 0.05);
      glow.strokeCircle(W / 2, H / 2, r);
    }
    glow.fillStyle(th.glow, 0.06 + p * 0.03);
    glow.fillCircle(120 + Math.sin(k) * 36, 420, 110);
    glow.fillCircle(678 + Math.cos(k * 0.7) * 28, 160, 86);
  } else if (th.k === 1) {
    for (let i = 0; i < 7; i += 1) {
      const x = 80 + i * 96 + Math.sin(k * 0.8 + i) * 10;
      const y = 120 + (i & 1 ? 70 : 0);
      glow.fillStyle(th.glow, 0.04 + p * 0.02 + bp * 0.03);
      glow.fillCircle(x, y + i * 30, 90 + i * 4);
    }
    for (let i = 0; i < 5; i += 1) {
      const y = 90 + i * 110;
      bg.fillStyle(th.band[0], 0.04);
      bg.fillRect(0, y, W, 80);
    }
  } else if (th.k === 2) {
    for (let i = 0; i < 4; i += 1) {
      const r = (time * 0.1 + i * 130) % 480;
      glow.lineStyle(3, th.frame, 0.04 + bp * 0.04);
      glow.strokeCircle(W / 2, H / 2, r);
    }
    for (let i = 0; i < 3; i += 1) {
      const y = 110 + i * 140;
      bg.fillStyle(th.band[0], 0.06 + bp * 0.03);
      bg.fillRect(0, y, W, 70);
    }
    glow.fillStyle(th.glow, 0.08 + p * 0.03);
    glow.fillCircle(140 + Math.sin(k) * 40, 380, 120);
    glow.fillCircle(660 + Math.cos(k * 0.9) * 36, 180, 90);
  } else {
    for (let i = 0; i < 6; i += 1) {
      const y = 60 + i * 92;
      bg.fillStyle(th.band[1], 0.04 + bp * 0.05 + i * 0.005);
      bg.fillRect(0, y, W, 48);
    }
    for (const x of [80, 720]) {
      for (let i = 0; i < 4; i += 1) {
        glow.lineStyle(4, th.side, 0.1 + bp * 0.06);
        glow.strokeCircle(x, 140 + i * 100, 30);
      }
    }
    glow.fillStyle(th.glow, 0.1 + p * 0.04);
    glow.fillRect(284, 106, 232, 400);
  }

  for (const d of s.dust) {
    glow.fillStyle(th.dust, 0.03 + d.s * 0.02 + p * 0.01);
    glow.fillCircle(d.x, d.y, d.s + th.k * 0.4);
  }
}

function draw(s, time) {
  const bg = s.bg;
  const glow = s.glow;
  const fg = s.fg;
  const pulse = s.pulse;
  const k = time * 0.001;
  const solo = s.mode === 1 && s.boards[0];
  const th = solo ? theme(s.boards[0].lv) : 0;

  bg.clear();
  glow.clear();
  fg.clear();

  if (th) {
    soloBg(s, th, s.boards[0].lv, time);
  } else {
    bg.fillStyle(0x050816, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i += 1) {
      const y = 70 + i * 128 + Math.sin(k * 1.6 + i) * 36;
      bg.fillStyle(PAL[i % 3], 0.035 + i * 0.01 + pulse * 0.02 + s.beatPhase * 0.03);
      bg.fillRect(-20, y, W + 40, 56);
    }
    glow.fillStyle(PAL[1], 0.03 + pulse * 0.02);
    glow.fillCircle(120 + Math.sin(k) * 40, 110, 90);
    glow.fillStyle(PAL[0], 0.025 + pulse * 0.02);
    glow.fillCircle(700 + Math.cos(k * 0.8) * 36, 510, 120);
    for (let i = 0; i < 4; i += 1) {
      const r = (time * 0.08 + i * 120) % 520;
      glow.lineStyle(2, PAL[i % 3], 0.03 + pulse * 0.03);
      glow.strokeCircle(W / 2, H / 2, r);
    }
    for (const d of s.dust) {
      glow.fillStyle(0xffffff, 0.04 + d.s * 0.02);
      glow.fillCircle(d.x, d.y, d.s);
    }
  }

  for (const tr of s.trails) {
    if (tr.beam) {
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
    glow.fillStyle(0xffffff, s.flash * 0.18);
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
    fg.lineStyle(3, th.frame, 0.95);
    fg.lineBetween(x, y, x, y + h);
    fg.lineBetween(x + w, y, x + w, y + h);
    fg.lineBetween(x, y + h, x + w, y + h);
  } else {
    glow.fillStyle(PAL[0], 0.03 + b.flash * 0.03);
    glow.fillRect(x - 10, y - 10, w + 20, h + 20);
    fg.fillStyle(0x08101f, 0.92);
    fg.fillRect(x, y, w, h);
    fg.lineStyle(2, 0x87d7ff, 0.28 + b.flash * 0.25);
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
    glow.fillStyle(0xffffff, b.flash * 0.12);
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
    t.a -= delta / t.l;
    if (t.a <= 0) s.trails.splice(i, 1);
  }
  s.flash = Math.max(0, s.flash - delta * 0.0012);
  s.pulse = Math.max(0.05, s.pulse - delta * 0.0005);
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

const MUSIC_SCALE = [220, 277.18, 329.63, 392, 440, 523.25, 659.25, 880];
const MUSIC_BASS = [55, 55, 82.41, 65.41];
const MUSIC_PAT = [0, 4, 2, 5, 7, 4, 2, 6, 0, 4, 2, 5, 3, 2, 4, 7];

function playMusic(s) {
  if (s.phase !== 'play') return;
  const c = ctx(s);
  if (!c) return;
  const step = s.musicStep;
  s.musicStep = (step + 1) & 31;
  const bar = (step >> 4) & 3;
  if ((step & 3) === 0) {
    const bf = MUSIC_BASS[bar];
    tone(s, c, bf, bf, 0.28, 0.028, 'sawtooth');
    tone(s, c, bf * 2, bf * 2, 0.22, 0.012, 'triangle', 0.01);
  }
  const n = MUSIC_PAT[step & 15];
  const f = MUSIC_SCALE[n];
  const oct = (step & 7) === 3 ? 2 : 1;
  tone(s, c, f * oct, f * oct, 0.16, 0.018, 'triangle');
  if ((step & 7) === 6) tone(s, c, f * 2, f * 2, 0.1, 0.01, 'sine', 0.04);
}

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
