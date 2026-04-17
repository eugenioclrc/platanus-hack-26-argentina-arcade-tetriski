# Aggressive Beat-Reactive BG + Techno Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the demoscene background react aggressively to every music kick and line clear (strobe + warp + explode + swap), and layer richer techno elements (snare, sub-bass, chord stabs, 16th arp, 8-bar breakdown) into the existing 13 presets, gated by level.

**Architecture:** All edits land in `game.js`. Five new scene-state fields drive the reactivity (`beatStrong`, `warpT`, `swapT`, `barStep`, `zmBusy`). Four new audio helpers (`mSnare`, `mSub`, `mChord`, `mArp`) reuse the existing `_mfilter` routing and the existing `tone`/`noise` primitives. `soloBg` gets a time-warp multiplier, a band-swap dispatch, and a kick-strobe overlay; `clearFx` sets the warp/swap timers and spawns one extra shockwave; `mStep` increments the bar counter, flips `beatStrong`, triggers a camera zoom pulse, and dispatches the layer helpers by level band.

**Tech Stack:** Vanilla JS, Phaser 3.87.0, Web Audio API. No new dependencies.

**Verification model:** There is no unit-test harness. Each task is verified by `node --check game.js` (syntax), `npm run check-restrictions` (size + sandbox restrictions), targeted `grep` confirmations, and a single commit per task. Manual in-browser verification happens at the end as one pass.

**Spec reference:** `docs/superpowers/specs/2026-04-17-bg-beat-music-design.md`.

**Key file anchors (current line numbers, may shift between tasks):**

- State init (`s.beatPhase = 0`) — game.js:217
- `clearFx` — game.js:766
- `soloBg` — game.js:972
- `stepFx` — game.js:1279
- `mxl` — game.js:1591
- `padSpawn` / `padKill` / `swell` / `ambient` — game.js:1597–1661
- `mStep` — game.js:1664
- Audio helpers: `tone(s,c,from,to,dur,vol,type,delay)` — game.js:1463, `noise(s,c,dur,vol,hp,delay)` — game.js:1478, `kickDrum(s,c,from,to,dur,vol,delay)` — game.js:1500
- `MP[]` presets — game.js:1574–1588, `MW` waves — game.js:1589

**Caveman note:** Final end-of-turn user messages (in chat) stay caveman-terse. Plan file itself uses normal prose so the engineer can read it end-to-end.

---

## Task 1: Scene-state fields + per-frame decay

**Files:**
- Modify: `game.js:217` (append new state fields next to `s.beatPhase = 0`)
- Modify: `game.js:1311–1313` (add decay lines inside `stepFx`)

- [ ] **Step 1: Append five new state fields to scene create**

In `game.js`, find the existing line `s.beatPhase = 0;` (around line 217) and insert the new fields immediately after it.

Edit (old_string unique — appears once):

```js
  s.beatPhase = 0;
  s.lastBeat = 0;
```

Replace with:

```js
  s.beatPhase = 0;
  s.beatStrong = 0;
  s.warpT = 0;
  s.swapT = 0;
  s.barStep = 0;
  s.zmBusy = 0;
  s.lastBeat = 0;
```

- [ ] **Step 2: Add decay lines inside `stepFx`**

In `game.js`, find these three consecutive lines inside `stepFx` (around line 1311):

```js
  s.flash = Math.max(0, s.flash - delta * 0.0009);
  if (s.flash <= 0) s.flashC = 0;
  s.pulse = Math.max(0.05, s.pulse - delta * 0.0005);
```

Replace with:

```js
  s.flash = Math.max(0, s.flash - delta * 0.0009);
  if (s.flash <= 0) s.flashC = 0;
  s.pulse = Math.max(0.05, s.pulse - delta * 0.0005);
  s.beatStrong = Math.max(0, s.beatStrong - delta * 0.0025);
  s.warpT = Math.max(0, s.warpT - delta);
  s.swapT = Math.max(0, s.swapT - delta);
```

- [ ] **Step 3: Verify syntax**

Run: `node --check game.js`
Expected: no output, exit code 0.

- [ ] **Step 4: Verify state fields wired**

Run: `grep -n "beatStrong\|warpT\|swapT\|barStep\|zmBusy" game.js`
Expected: at least 6 hits — 5 in the init block (line ~217–222) and 3 decay lines in `stepFx` (line ~1314–1316).

- [ ] **Step 5: Verify size**

Run: `npm run check-restrictions`
Expected: all checks pass. Minified size should be ~33.1 KB (up ~0.08 KB from 33.02 KB).

- [ ] **Step 6: Commit**

```bash
git add game.js
git commit -m "feat: scaffold beat/warp/swap state fields and decay"
```

---

## Task 2: `soloBg` — time warp + band swap + kick strobe

**Files:**
- Modify: `game.js:972–990` (rewrite body of `soloBg`)

**Context:** `soloBg` currently dispatches `fxPlasma`/`fxCopper`/`fxSunburst`/`fxTunnel` by `th.k` with raw `time`. After this task, it warps time (1x→3.5x for ~400 ms after clears), swaps the band (for ~400 ms after tetris), and lays a full-screen themed wash on every kick.

- [ ] **Step 1: Replace the body of `soloBg`**

In `game.js`, find the full current function (single exact match — the `fxTunnel`→`dust` loop block):

```js
function soloBg(s, th, lv, time) {
  const bg = s.bg;
  const glow = s.glow;
  const bp = s.beatPhase;
  const fl = Math.min(1, s.flash);

  bg.fillStyle(th.bg, 1);
  bg.fillRect(0, 0, W, H);

  if (!th.k) fxPlasma(bg, th, time, bp, fl);
  else if (th.k === 1) fxCopper(bg, th, time, bp, fl);
  else if (th.k === 2) fxSunburst(bg, th, time, bp, fl);
  else fxTunnel(bg, th, time, bp, fl);

  for (const d of s.dust) {
    glow.fillStyle(th.dust, 0.03 + d.s * 0.02 + s.pulse * 0.01);
    glow.fillCircle(d.x, d.y, d.s + th.k * 0.4);
  }
}
```

Replace with:

```js
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
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output.

- [ ] **Step 3: Verify warp + swap + strobe wired**

Run: `grep -n "s.warpT / 500\|s.swapT > 0\|s.beatStrong > 0" game.js`
Expected: 3 hits, all inside `soloBg`.

- [ ] **Step 4: Verify size**

Run: `npm run check-restrictions`
Expected: all checks pass. Minified size should be ~33.3 KB.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: soloBg time-warp, band-swap, and kick strobe overlay"
```

---

## Task 3: `clearFx` — set warpT, explode ring, swapT, zmBusy guard

**Files:**
- Modify: `game.js:826–835` (tail of `clearFx` — where `s.flash` and `cam.zoomTo` are)

**Context:** `clearFx` already spawns rings, shockwaves, burst, trails, a flash, a pulse, a camera shake, and a small zoom pulse (to 1.04 / 1.02) with a `delayedCall` back to 1. After this task it also sets `s.warpT` (every clear), spawns one big shockwave ring (n ≥ 2), sets `s.swapT` (n === 4), and guards the zoom pulse with `s.zmBusy` so the kick zoom in Task 4 does not fight it.

- [ ] **Step 1: Replace the clearFx tail block**

In `game.js`, find these 10 lines (single exact match — the only `s.cameras.main.shake(... 0.014 : 0.008` call):

```js
  s.flash += n === 4 ? 0.85 : 0.48;
  s.flashC = c;
  s.pulse += n === 4 ? 1.8 : 0.8;
  s.cameras.main.shake(n === 4 ? 360 : 200, n === 4 ? 0.014 : 0.008);
  if (n >= 2) swell(s);
  const cam = s.cameras.main;
  const zm = n === 4 ? 1.04 : 1.02;
  cam.zoomTo(zm, 120);
  s.time.delayedCall(140, () => cam.zoomTo(1, 260));
  snd(s, `c${n}`);
}
```

Replace with:

```js
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
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output.

- [ ] **Step 3: Verify `clearFx` hooks wired**

Run: `grep -n "s.warpT = n\|if (n === 4) s.swapT = 400\|s.zmBusy = 1" game.js`
Expected: 3 hits, all inside `clearFx`.

- [ ] **Step 4: Verify size**

Run: `npm run check-restrictions`
Expected: all checks pass. Minified size should be ~33.5 KB.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: clearFx warp, explode ring, tetris swap, zmBusy guard"
```

---

## Task 4: `mStep` — bar counter + beatStrong + kick zoom pulse + breakdown

**Files:**
- Modify: `game.js:1664–1693` (rewrite the body of `mStep` up to and including the kick branch; keep existing bass/lead/hat tail)

**Context:** `mStep` currently kicks on `!(st & 3)`, sets `s.beatPhase = 1`, ducks music gain via `_mgain`, and spawns one themed center ring. After this task it also: increments `s.barStep` once per 16-step bar; detects the 8-bar breakdown (`(s.barStep & 7) === 7`); suppresses the kick on breakdown; sets `s.beatStrong = 1` on every real kick; and triggers a camera zoom pulse guarded by `s.zmBusy`.

The audio-layer helpers (`mSnare`, `mSub`, `mChord`, `mArp`) are defined in Task 5–8; **call sites for them are stubbed in this task**. Their missing definitions will trip `mStep` only at runtime, not at parse time, so `node --check` still passes. Size stays inside budget.

- [ ] **Step 1: Rewrite `mStep` body**

In `game.js`, find the current `mStep` function in full (single exact match — ends with `s._filter = save; }`):

```js
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
```

Replace with:

```js
function mStep(s, c, P, st) {
  const f = 440 * Math.pow(2, (P[0] - 69) / 12);
  const bit = 1 << st;
  const save = s._filter;
  s._filter = s._mfilter;
  if (st === 0) s.barStep = (s.barStep + 1) & 31;
  const lv = mxl(s);
  const brk = lv >= 10 && (s.barStep & 7) === 7;
  if (!(st & 3) && !brk) {
    kickDrum(s, c, 140, 48, 0.14, 0.18);
    s.beatPhase = 1;
    s.beatStrong = 1;
    if (s._mgain && s.music) {
      const g = s._mgain.gain;
      const t = c.currentTime;
      const v = s.music.vol;
      g.cancelScheduledValues(t);
      g.setValueAtTime(v * 0.35, t + 0.015);
      g.linearRampToValueAtTime(v, t + 0.11);
    }
    if (s.scale) {
      const th = theme(lv);
      ring(s, s.scale.width * 0.5, s.scale.height * 0.5, th.frame, 40, 180, 2);
    }
    if (!s.zmBusy) {
      const cam = s.cameras.main;
      s.zmBusy = 1;
      cam.zoomTo(1.015, 80);
      s.time.delayedCall(100, () => { cam.zoomTo(1, 220); s.zmBusy = 0; });
    }
    if (lv >= 4) mSub(s, c, P);
  }
  if (lv >= 4 && (st === 4 || st === 12)) mSnare(s, c);
  if (lv >= 7 && (st === 0 || st === 8)) mChord(s, c, P);
  if (P[2] & bit) tone(s, c, f / 2, f / 2, 0.18, 0.14, MW[P[6]]);
  if (P[3] & bit) {
    const n = [0, 3, 5, 7, 10][(st * (3 + (P[0] & 3))) % 5] + 12;
    const f2 = f * Math.pow(2, n / 12);
    tone(s, c, f2, f2, 0.22, 0.08, 'triangle');
    if (lv >= 7) mArp(s, c, P, st);
  }
  if (P[4] & bit) noise(s, c, 0.025, 0.04, 5000);
  s._filter = save;
}
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output. Note: `mSub`/`mSnare`/`mChord`/`mArp` are referenced but not yet defined — that is fine, JS resolves function references at call time not parse time.

- [ ] **Step 3: Verify mStep wiring**

Run: `grep -n "s.barStep = (s.barStep + 1)\|s.beatStrong = 1\|cam.zoomTo(1.015\|brk = lv >= 10" game.js`
Expected: 4 hits, all inside `mStep`.

- [ ] **Step 4: Skip size check**

Do not run `npm run check-restrictions` yet — the minifier does not catch undefined-function references either, and size will jump in Task 5+. We commit the mStep scaffold here and grow it in Tasks 5–8.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: mStep bar counter, beatStrong, kick zoom pulse, breakdown"
```

---

## Task 5: `mSnare` — noise-based 2/4 backbeat (lv ≥ 4)

**Files:**
- Modify: `game.js` (insert new function above `mStep`, at current line ~1664)

- [ ] **Step 1: Add `mSnare` helper above `mStep`**

Find the block just before `mStep`:

```js
function mStep(s, c, P, st) {
  const f = 440 * Math.pow(2, (P[0] - 69) / 12);
```

Replace with:

```js
function mSnare(s, c) {
  noise(s, c, 0.06, 0.05, 3500);
}

function mStep(s, c, P, st) {
  const f = 440 * Math.pow(2, (P[0] - 69) / 12);
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output.

- [ ] **Step 3: Verify definition present**

Run: `grep -n "^function mSnare" game.js`
Expected: 1 hit, above `mStep`.

- [ ] **Step 4: Verify size**

Run: `npm run check-restrictions`
Expected: all checks pass. Minified size ~33.6 KB.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: mSnare 2-and-4 backbeat for lv>=4"
```

---

## Task 6: `mSub` — sine sub-bass under kick (lv ≥ 4)

**Files:**
- Modify: `game.js` (insert new function above `mStep`, right after `mSnare`)

- [ ] **Step 1: Add `mSub` helper**

Find:

```js
function mSnare(s, c) {
  noise(s, c, 0.06, 0.05, 3500);
}

function mStep(s, c, P, st) {
```

Replace with:

```js
function mSnare(s, c) {
  noise(s, c, 0.06, 0.05, 3500);
}

function mSub(s, c, P) {
  const f = 440 * Math.pow(2, (P[0] - 69 - 12) / 12);
  tone(s, c, f, f, 0.14, 0.09, 'sine');
}

function mStep(s, c, P, st) {
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output.

- [ ] **Step 3: Verify definition**

Run: `grep -n "^function mSub" game.js`
Expected: 1 hit.

- [ ] **Step 4: Verify size**

Run: `npm run check-restrictions`
Expected: pass. Minified size ~33.8 KB.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: mSub octave-down sub-bass on kick for lv>=4"
```

---

## Task 7: `mChord` — triad stabs twice per bar (lv ≥ 7)

**Files:**
- Modify: `game.js` (insert new function above `mStep`, right after `mSub`)

- [ ] **Step 1: Add `mChord` helper**

Find:

```js
function mSub(s, c, P) {
  const f = 440 * Math.pow(2, (P[0] - 69 - 12) / 12);
  tone(s, c, f, f, 0.14, 0.09, 'sine');
}

function mStep(s, c, P, st) {
```

Replace with:

```js
function mSub(s, c, P) {
  const f = 440 * Math.pow(2, (P[0] - 69 - 12) / 12);
  tone(s, c, f, f, 0.14, 0.09, 'sine');
}

function mChord(s, c, P) {
  const base = 440 * Math.pow(2, (P[0] - 69 + 12) / 12);
  for (const semi of [0, 4, 7]) {
    const f = base * Math.pow(2, semi / 12);
    tone(s, c, f, f, 0.32, 0.045, 'triangle');
  }
}

function mStep(s, c, P, st) {
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output.

- [ ] **Step 3: Verify definition**

Run: `grep -n "^function mChord" game.js`
Expected: 1 hit.

- [ ] **Step 4: Verify size**

Run: `npm run check-restrictions`
Expected: pass. Minified size ~34.1 KB.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: mChord triad stabs on halves for lv>=7"
```

---

## Task 8: `mArp` — 16th-note arp ornament on lead bits (lv ≥ 7)

**Files:**
- Modify: `game.js` (insert new function above `mStep`, right after `mChord`)

- [ ] **Step 1: Add `mArp` helper**

Find:

```js
function mChord(s, c, P) {
  const base = 440 * Math.pow(2, (P[0] - 69 + 12) / 12);
  for (const semi of [0, 4, 7]) {
    const f = base * Math.pow(2, semi / 12);
    tone(s, c, f, f, 0.32, 0.045, 'triangle');
  }
}

function mStep(s, c, P, st) {
```

Replace with:

```js
function mChord(s, c, P) {
  const base = 440 * Math.pow(2, (P[0] - 69 + 12) / 12);
  for (const semi of [0, 4, 7]) {
    const f = base * Math.pow(2, semi / 12);
    tone(s, c, f, f, 0.32, 0.045, 'triangle');
  }
}

function mArp(s, c, P, st) {
  const pat = [0, 7, 12, 7];
  const semi = pat[st & 3] + 24;
  const f = 440 * Math.pow(2, (P[0] - 69 + semi) / 12);
  tone(s, c, f, f, 0.08, 0.04, 'triangle');
}

function mStep(s, c, P, st) {
```

- [ ] **Step 2: Verify syntax**

Run: `node --check game.js`
Expected: no output.

- [ ] **Step 3: Verify definition**

Run: `grep -n "^function mArp" game.js`
Expected: 1 hit.

- [ ] **Step 4: Verify size**

Run: `npm run check-restrictions`
Expected: pass. Minified size ~34.4 KB. Must still be under 38 KB target.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: mArp 16th ornament on lead bits for lv>=7"
```

---

## Task 9: Manual in-browser verification

**Files:** None modified.

This task has no code edits. It is the single manual checkpoint before we declare the spec implemented.

- [ ] **Step 1: Start dev server**

Tell the user: "Run `npm run dev` and load `http://localhost:5173/` (or whatever port your config uses — check the terminal). I cannot run the dev server myself."

- [ ] **Step 2: Menu (L0) check**

Expected visual:
- Plasma bands cycling on the menu background.
- On every kick (~2 per second at 120 BPM), a subtle themed wash flashes over the whole scene.
- Camera zooms in microscopically (~1.5%) on every kick.

If no kick visible: open devtools console, confirm no errors referencing `mSub`/`mSnare`/`mChord`/`mArp` (they are only called by `mStep`, which only runs when music is playing — menu has pad only).

- [ ] **Step 3: Play L1–3**

Start a single-player game, play until lines clear.
- Music: kick + bass + hat + occasional lead. No snare, no chord, no arp (level gating).
- Background: plasma + kick strobe wash + camera zoom pulse every kick.
- Line clear (1 line): background time-warp visible for ~350 ms (plasma accelerates). No extra ring, no swap.
- Line clear (tetris): massive ring from center + warp 500 ms + background swaps from plasma to sunburst for ~400 ms, then snaps back.

- [ ] **Step 4: Play L4–6**

Continue play. Confirm audible:
- Snare crack on beats 2 and 4 of every bar.
- Sub-bass thump under every kick.

Confirm visual: copper bars with warp/swap reactivity as above.

- [ ] **Step 5: Play L7–9**

Confirm audible:
- Chord stabs (triad) on beats 1 and 3.
- 16th-note arp ornament sprinkled on lead notes.

Confirm visual: sunburst rays rotating, band swaps to warp tunnel on tetris.

- [ ] **Step 6: Play L10+**

Confirm audible:
- Every 8 bars, one full bar where kick and sub drop out ("breakdown"). Chord/arp/hat/pad continue. Then kick returns with full force.

Confirm visual: warp tunnel effect with maximum reactivity; tetris clear swaps back to plasma briefly.

- [ ] **Step 7: 2P mode check**

Start a 2-player game. Confirm:
- Background uses `mxl(s)` — effect band tracks max level across both players.
- Both players clearing at once: warp/explode/swap stack gracefully (warp timer overwrites, explode ring adds, swap timer overwrites).
- No visual chaos beyond acceptable.

- [ ] **Step 8: Readability check**

Throughout all levels, blocks should remain clearly visible over the background. If any level feels too busy:
- Reduce `th.frame` strobe alpha in `soloBg` from `s.beatStrong * 0.1` to `s.beatStrong * 0.07`.
- Reduce explode ring lifespan in `clearFx` from 1100/800 to 900/650.

Note: these are tuning-only tweaks, not spec deviations, and can ship as a follow-up commit.

- [ ] **Step 9: Stats check**

Run: `npm run check-restrictions`
Expected: all green. Minified size ~34.4 KB. Headroom ≥15 KB.

- [ ] **Step 10: Final commit (if any tuning tweaks)**

Only commit if Step 8 triggered a tweak. Otherwise Task 9 has no commit.

---

## Appendix: Rollback strategy

If any task breaks the game in a way that manual verification cannot be completed, revert that single commit and re-attempt with the corrected approach:

```bash
git log --oneline -10    # find the bad commit
git revert <hash>
```

No task's edits depend on later tasks for syntactic validity. `mStep` (Task 4) calls functions defined in Tasks 5–8, but those are runtime-resolved, so the interpreter only fails when `mStep` is actually invoked (i.e., during gameplay music). As long as Tasks 4–8 ship together, the chain is safe.

If size overshoots 38 KB at any point:
1. First cut: remove `mArp` call site in `mStep` and revert Task 8. Est. save: ~230 B.
2. Second cut: remove `mChord` call site and revert Task 7. Est. save: ~280 B.
3. Last resort: remove the explode ring from `clearFx` (Task 3 — single line). Est. save: ~160 B.

Do not cut warp (Task 2–3) or kick strobe (Tasks 2, 4) — those are the core user-requested reactivity.
