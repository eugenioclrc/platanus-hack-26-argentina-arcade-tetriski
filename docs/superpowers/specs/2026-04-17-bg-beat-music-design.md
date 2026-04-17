# Spec: Aggressive beat-reactive backgrounds + richer techno layers

**Date:** 2026-04-17
**Status:** Draft — awaiting user review
**Scope target:** `game.js` only. No changes to `metadata.json`, `cover.png`, or any other file.
**Byte budget:** ~1.8 KB net add → final ~34.8 KB minified (headroom ≥14 KB under the 50 KB cap).

## 1. Problem

Current background demoscene effects (plasma / copper / sunburst / tunnel) are hooked to `s.beatPhase` and `s.flash`, but the reaction is subtle — plasma color shifts, ray widths bump, bg amp multiplies by `1 + flash * 0.5..0.9`. Line clears already spawn 2 big shockwaves + themed screen tint + camera shake, but the background itself does not visibly transform on impact.

Music: 13 presets in `MP[]`, each is `[root, bpm, bassMask, leadMask, hatMask, filterHz, waveIdx]`. Each preset is one kick-on-quarter loop with a bass arp, a lead line, and a hat pattern. It loops for the whole level but feels static — no chord harmony, no snare backbeat, no breakdowns, no evolving tension.

User wants:
- Aggressive (Tetris Effect-style) beat reactivity in the background.
- Line clears to visibly transform the background, with intensity scaled by how many lines cleared.
- Richer techno layers inside the existing 13 presets (not more presets).

## 2. Goals / Success criteria

- Every music kick produces a visible background reaction (not just amp multiplier).
- Each line clear makes the background itself move/distort, not only spawn particles on top of it.
- Tetris (4-line) clears feel distinctly bigger than single-line clears.
- Each level's music has clearly audible techno layering: chord stabs, 16th-note arps, snare backbeat, sub-bass, breakdowns every ~8 bars.
- Byte size stays under 38 KB minified.

## 3. Non-goals

- No new demoscene effect types beyond the 4 existing ones.
- No new audio routing (reverb convolver, sidechain compressor, master filter stay as-is).
- No preset count change. Still 13 presets in `MP[]`.
- No menu / UI / cover / metadata changes.
- No new game mechanics, no new inputs, no persistence changes.

## 4. State additions

Five new fields on the scene state `s`, initialized in scene `create()` alongside `s.beatPhase`:

| Field | Type | Purpose | Decay / reset |
|-------|------|---------|----------------|
| `s.beatStrong` | number 0..1 | Drives heavier beat effects (kick strobe, camera zoom). Set to 1 on each music kick. | Decay rate `delta * 0.0025` (hits 0 in ~400 ms). |
| `s.warpT` | number ≥ 0 (ms) | While > 0, `soloBg` speeds up effect time. Set on `clearFx`. | Decrement by `delta` each frame. |
| `s.swapT` | number ≥ 0 (ms) | While > 0, `soloBg` dispatches to effect band `(th.k + 2) & 3` instead of `th.k`. Set only on tetris clears. | Decrement by `delta` each frame. |
| `s.barStep` | integer 0..31 | Bar counter. Increments once per 16-step bar (on step 0). Used for breakdowns. Wraps at 32 to give an 8-bar phrase cycle that repeats 4 times. |
| `s.flashC` | hex color or 0 | Already exists from prior work. No change. | Cleared when `s.flash <= 0`. |

No other existing state changes.

## 5. Background — beat reactivity (aggressive)

### 5.1 Kick strobe

On every music kick (`mStep` step `& 3` === 0), the existing code already sets `s.beatPhase = 1`, ducks music gain, and spawns one themed center ring. Add:

- Set `s.beatStrong = 1`.
- Camera zoom pulse: `cam.zoomTo(1.015, 80)` then `cam.zoomTo(1, 220)` via `s.time.delayedCall`. Skip if a clear-triggered zoom is already in progress (guard via `cam.zoom !== 1` is too fragile — use a boolean `s.zmBusy` flag set by `clearFx`).

### 5.2 Kick strobe overlay (rendered per frame in `draw` / `soloBg`)

In `soloBg`, after all effect dispatch and dust loop, if `s.beatStrong > 0`:
- `glow.fillStyle(th.frame, s.beatStrong * 0.10)`
- `glow.fillRect(0, 0, W, H)`

This gives one full-screen themed-color wash per kick that fades over ~400 ms, overlaid on top of all bg effects but beneath gameplay.

### 5.3 Existing beat-driven modulations

Keep all existing `s.beatPhase` modulations (fxPlasma s2 term, fxCopper height, fxSunburst line width + halo, fxTunnel line width + center, title scale, board frame, menu buttons). No removals.

## 6. Background — line-clear reactivity

### 6.1 Warp (all clears)

In `clearFx`, set `s.warpT = n === 4 ? 500 : 350`.

In `soloBg`, compute `const warp = 1 + (s.warpT / 500) * 2.5;` and pass `time * warp` to each `fx*` helper instead of raw `time`. This multiplies the effect's internal time scale 1x → 3.5x for ~400 ms, then settles back.

In `stepFx` (the per-frame update in the game loop), decrement: `s.warpT = Math.max(0, s.warpT - delta)`.

### 6.2 Explode (clears of n ≥ 2)

In `clearFx`, when `n >= 2`, spawn one giant radial expanding wave as a new ring entry:

```js
ring(s, W * 0.5, H * 0.5, c, n === 4 ? 180 : 130, n === 4 ? 1100 : 800, n === 4 ? 8 : 5);
```

This is distinct from the 2 existing screen-center shockwaves and is the slowest / biggest one. Parameters: larger start radius, longer lifespan, thicker line width.

### 6.3 Swap (tetris only, n === 4)

In `clearFx`, when `n === 4`, set `s.swapT = 400`.

In `soloBg`, compute `const k = s.swapT > 0 ? (th.k + 2) & 3 : th.k;` and dispatch `fx*` based on `k` instead of `th.k`. The effect transforms (plasma → sunburst, copper → tunnel, etc.) for ~400 ms then snaps back.

In `stepFx`, decrement: `s.swapT = Math.max(0, s.swapT - delta)`.

### 6.4 Intensity scaling summary

| Lines cleared | Warp | Explode | Swap |
|---------------|------|---------|------|
| 1 | 350 ms | — | — |
| 2 | 350 ms | medium wave | — |
| 3 | 350 ms | medium wave | — |
| 4 (tetris) | 500 ms | big wave | 400 ms |

## 7. Music — richer techno layers

All layers are added inside `mStep(s, c, P, st)` (existing function). No changes to `MP[]` shape: still `[root, bpm, bassMask, leadMask, hatMask, filterHz, waveIdx]`. Arp uses a fixed 16-step mask derived from existing data — no new preset column needed.

### 7.1 Snare backbeat

`mSnare(s, c, st)`:
- Fires on `st === 4 || st === 12` (beats 2 and 4 of a 16-step bar).
- Implementation: reuse existing `noise(s, c, dur, vol, hz)` helper with `dur=0.06`, `vol=0.05`, `hz=3500`. Routed through `s._mfilter` like other music tones.

### 7.2 Sub-bass on kick

`mSub(s, c, P, st)`:
- Fires on `st & 3 === 0` (same as kick).
- Sine wave one octave below tonic: `f = 440 * Math.pow(2, (P[0] - 69 - 12) / 12)`.
- Short envelope: 0.14 s, vol 0.09. Routed through `s._mfilter`.
- Skipped during breakdowns (see §7.5).

### 7.3 Chord stabs

`mChord(s, c, P, st)`:
- Fires on `st === 0 || st === 8` (once per half-bar).
- Three triangle-wave voices at root, major third, perfect fifth (offsets 0, 4, 7 semitones) one octave above tonic. Each voice: `tone(s, c, f, f, 0.32, 0.045, 'triangle')`.
- Routed through `s._mfilter`.

### 7.4 16th-note arpeggio

`mArp(s, c, P, st)`:
- Fires on every step (16th note) but only if `(P[3] >> st) & 1` is set — reuses `leadMask` bit. This means arps only trigger where the lead pattern is already firing; we overlay a quick 16th ornament.
- Pattern: `[0, 7, 12, 7]` (root, fifth, octave, fifth) indexed by `st & 3`.
- Very short, low-volume triangle tone (`dur=0.08`, `vol=0.04`) two octaves above tonic so it sits above the lead without clashing.

### 7.5 Breakdowns

Breakdown condition (inline in `mStep`, no separate helper):
- When `(s.barStep & 7) === 7` — the last bar of every 8-bar phrase — suppress kick and sub-bass for that one bar. Other layers (pad, chord, hat, arp, snare) continue.
- Creates an 8-bar breathing cycle: 7 bars full, 1 bar "airy", then drop.
- `s.barStep` increments once per full 16-step loop inside `mStep` at `st === 0`.

### 7.6 Preset mutation for higher levels (no new presets)

To give higher levels audibly more drive without adding preset data, parameterize layer enables by level via `mxl(s)`:

| Level band | Snare | Sub | Chord | Arp | Breakdown |
|------------|-------|-----|-------|-----|-----------|
| 1–3 | — | — | — | — | — |
| 4–6 | ✓ | ✓ | — | — | — |
| 7–9 | ✓ | ✓ | ✓ | ✓ | — |
| 10+ | ✓ | ✓ | ✓ | ✓ | ✓ |

Implementation: `mStep` reads `lv = mxl(s)` once per step and conditionally calls each layer helper. This makes progression feel like the track "builds up" as the player climbs.

## 8. File layout / integration

All edits land in `game.js`. No new files.

**Insertion points:**

1. **State init** (existing `create()` body where `s.beatPhase = 0` is set): append `s.beatStrong = 0; s.warpT = 0; s.swapT = 0; s.barStep = 0; s.zmBusy = 0;`.
2. **New helpers** (above `mStep`, near existing `swell`/`ambient`): `mSnare`, `mSub`, `mChord`, `mArp`. `mBreak` is a 3-line inline check inside `mStep`, no separate helper.
3. **`mStep` body**: add `beatStrong = 1` in kick branch. Add camera zoom pulse in kick branch (guarded by `s.zmBusy`). Add `if (st === 0) s.barStep = (s.barStep + 1) & 31;` at top. Call new layer helpers conditionally by level.
4. **`clearFx` body**: set `s.warpT`, spawn explode wave (n≥2), set `s.swapT` (n===4), set `s.zmBusy = 1` around existing `cam.zoomTo` (clear after `delayedCall`).
5. **`soloBg` body**: compute `warp`, `effTime = time * warp`, `k = s.swapT > 0 ? (th.k + 2) & 3 : th.k`, dispatch by `k` with `effTime`. Append kick strobe overlay after dust loop.
6. **`stepFx` body**: decrement `s.beatStrong`, `s.warpT`, `s.swapT`.

## 9. Data flow

```
mStep (every 16th note)
  ├─ if step === 0: s.barStep = (s.barStep + 1) & 31
  ├─ if step & 3 === 0 (kick):
  │    ├─ if !breakdown: kickDrum + beatStrong=1 + beatPhase=1 + cam zoom pulse
  │    └─ mSub (if lv ≥ 4 and !breakdown)
  ├─ mSnare (if lv ≥ 4 and step in {4,12})
  ├─ mChord (if lv ≥ 7 and step in {0,8})
  ├─ mArp (if lv ≥ 7 and leadMask bit set)
  └─ existing bass/lead/hat

clearFx (on line(s) cleared)
  ├─ existing rings, shockwaves, trails, particles, screen flash
  ├─ s.warpT = n===4 ? 500 : 350
  ├─ if n ≥ 2: ring(center, big, long)
  └─ if n === 4: s.swapT = 400

soloBg (every frame)
  ├─ warp = 1 + s.warpT/500 * 2.5
  ├─ k = s.swapT>0 ? (th.k+2)&3 : th.k
  ├─ fx* dispatch by k with time*warp
  └─ if s.beatStrong > 0: overlay full-screen themed wash

stepFx (every frame)
  ├─ s.beatStrong -= delta * 0.0025
  ├─ s.warpT     -= delta
  └─ s.swapT     -= delta
```

## 10. Risks / mitigations

- **Audio load**: adding 4 layers could push Web Audio node count. Mitigation: all new tones use short envelopes (<0.35 s) and hit existing `_mfilter` — no new routing. Node count per step worst case: kick + bass + lead + hat + snare + sub + chord×3 + arp = 10 short nodes, well within browser budget.
- **Visual noise on tetris**: stacking warp + explode + swap + existing shockwaves + flash could feel chaotic. Mitigation: warp only *accelerates* existing effect, swap only changes *which* effect, explode is a single ring. Alpha caps already in place (`Math.min(0.55, s.flash * 0.32)`).
- **Byte budget**: estimated +1.8 KB. If over, first cut is `mArp` (visual noise saver too, ~200 B), then chord stabs (~250 B). Warp/explode/swap are higher priority — keep those.
- **Readability of gameplay**: kick strobe uses 0.10 alpha, wash fades in 400 ms. Gameplay blocks render on `s.fg` layer above `s.glow`, so contrast is preserved.
- **Breakdown + clear interaction**: if a player clears during a breakdown bar, the layers still respond normally — breakdown only mutes kick+sub, not FX.

## 11. Verification

1. `node --check game.js` → syntax clean.
2. `npm run check-restrictions` → minified ≤ 50 KB (target ≤ 38 KB).
3. Manual in-browser checks (user runs `npm run dev`):
   - Menu: kick strobe visible, camera pulse visible on every beat.
   - L1–3: no snare/sub/chord/arp/break yet — only enhanced beat reactivity and bg warp/explode/swap on clears.
   - L4–6: snare on 2&4 audible, sub-bass present under kick.
   - L7–9: chord stabs every half-bar, arp ornament on leads.
   - L10+: one bar of breakdown every 8 bars.
   - Single line clear: bg warps briefly, no explode, no swap.
   - 2–3 line clear: warp + big explode ring.
   - Tetris: warp + big explode + effect-swap visible mid-clear.
4. No console errors. No frame drops on stock hardware.

## 12. Out of scope

- Cover image / metadata
- New demoscene effect types
- New preset entries
- Storage schema changes
- Input changes
- Menu redesign
