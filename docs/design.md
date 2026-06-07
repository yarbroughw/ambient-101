# Ambient 101 — workshop web app

Source of truth for product scope and implementation direction.

## Background

- **v1** was a p5.js + Tone.js + Tonal.js sketch (ITP Camp 2025), optimized for learning by editing code in the p5 web editor. It lives in the repo as `legacy/sketch-v1/`.
- **This app** is a hosted web application for a **re-run of the workshop** with a **narrower scope**: participants compose and control sound **through the UI**, not by modifying source code. Instructor explanations can focus on **listening and theory** (phase, loop length, tonality/modality) rather than programming.

Workshop slides (`Generative Music Workshop.pdf` at repo root) motivate concepts such as incommensurable tape loops, coprime lengths, time/space analogies (BPM vs Hz), scales/modes, and relative keys. **Markov chains** and **Euclidean rhythms** appear in the slides and in v1 code but are **out of scope** until after a camp-ready release (they may return as optional/advanced features).

## Goals

1. **Reliable workshop delivery**: one URL, predictable audio startup (browser autoplay policies), guardrails so attendees rarely break the tab.
2. **Compose loops in the UI**: a bounded sequencer-style surface—not an open-ended DAW.
3. **Laptop orchestra**: many machines contribute **independent tape loops**; the facilitator uses **tonality/modality** and **loop length relationships** as teaching hooks.
4. **Instructor demo**: **multiple tape loops in one interface** on a single laptop.
5. **Participant workflow**: attendees develop several loops and pick a favorite; at the **finale**, roughly **one loop audible per laptop** so the room reads as N voices, not N×layers.

## Current state

The app in `app/` is a **camp-usable composition surface**: user-authored loops, live editing, local persistence, and the horizontal row layout from the target UI. Audio starts empty; participants add blank loops or workshop presets.

### Audio

- **Browser audio gate** (`StartAudioButton` → `ensureAudioStarted`).
- **`TapeLoop`**: `Tone.Loop`-driven period per loop; `start` / `stop` / `test(playbackDurationSec)`; wall-clock `getProgress()` for visuals; editable loop duration. **Hot-reload** on pattern edits preserves loop phase while running (no full restart).
- **Declarative patterns**: `LoopPattern` / `PatternNote` types; `compilePatternToSink()` schedules notes; pitch derived at playback from `scale` + `scaleStep` + `octaveShift` via `stepToPitch()`.
- **Schedulable note sink**: notes on the Transport so `stop` cancels future hits; `prepare` / `silence` on transport changes.
- **Per-loop voice**: **pad** or **pluck** synth → filter → gain → meter → **per-reel effects bus** (`loopEffects.ts`: dry/wet reverb + ping-pong delay) → master input; per-reel volume on the voice gain.
- **Global master** (`globalEffects.ts`): master volume + FFT analyser tap on the master output.
- **Preset templates** (`demoPatterns.ts`): `bass`, `melody1`, `melody2` workshop fixtures—available via the presets menu, not loaded by default.

### Pattern model

| Field | Role |
|-------|------|
| `scaleStep` (−11…+11) | Stable composable index; row in the grid; morphs when scale changes |
| `octaveShift` (−2…+2) | Transposes entire melody on the grid |
| `scale` | Tonal scale string (e.g. `C4 minor`); editable dropdown |
| `startTime`, `duration` | Seconds on the tape, relative to loop start |
| `bpm` | Melody tempo; sets grid step length and playhead speed |
| `loopDuration` | Tape period (reel, `Tone.Loop`); independent of grid width |
| `volume` | Per-reel level (0–1) |
| `reverb`, `delay` | Per-reel FX send (0–1); defaults 0.75 / 0.3 |
| `instrument` | `pad` or `pluck` |

Notes are constrained to the **32-column grid** and **23 scale-step rows** at authoring time (`patternFitsGrid`, `noteFitsGrid`).

### Persistence

- **`localStorage`** (`loopStorage.ts`, key `ambient-101:loops`): versioned JSON blob; saves on every pattern change—no save button or notification.
- Restored when audio starts: stack order, labels, notes, BPM, scale, octave, duration, instrument, volume, reverb, delay.
- **Not persisted**: playback state, expanded row, master volume, mute/solo/favorite (not yet implemented).

### UI

- **Workshop palette** from sketch-v1 (`theme.css`). Layout tokens in `layout.css`. App shell max-width 720px, UI scale 1.1×.
- **Toolbar** (three-column grid): play all / stop all | **master FFT spectrum** | **master volume** dial.
- **Loop stack**: full-width **horizontal `TapeLoopRow` bars**, stacked vertically. One row expanded at a time (accordion). **Spacebar**: stop all if any reel is playing, else start all.
- **Add controls**: **+** adds a blank loop; **presets ▾** adds `bass`, `melody1`, or `melody2`.

**Collapsed row** (summary):

| Region | Behavior |
|--------|----------|
| Transport | play / stop / test (speaker icon; pulses during test) |
| Volume | Ableton-style triangle fader + level meter |
| Reel | 12 o’clock tick, rotating playhead dot, lap flash at cycle start |
| Duration | Read-only cooldown seconds in reel center (stored as `loopDuration`) |
| Label | Click to edit inline |
| Mini melody view | Fixed-width note timeline over **melody window** + playhead |
| Metadata | BPM, instrument, scale — display only |
| ⋯ menu | Duplicate; export (disabled, placeholder) |
| Actions | Expand editor; delete (with confirm modal) |

**Expanded row** (`LoopEditor`):

| Region | Behavior |
|--------|----------|
| **Subheader bar** | Aligned with collapsed header: **cooldown** dial (under reel), **BPM** dial (under label), scale + instrument + octave + **reverb** / **delay** dials (tape lane, FX to the right of inst/oct) |
| **Melody grid** | 32×23 step grid; drag to paint spans; right-edge resize; click bar to delete; keyboard toggle on focused cell |

### Dual clocks (shipped)

Tape loops teach two different durations:

| Clock | Domain | UI |
|-------|--------|-----|
| **Cooldown** (`loopDuration`) | Full tape period before the melody repeats (e.g. 11s) | Reel rotation, lap flash, **cooldown** dial |
| **Melody window** | Fixed 32-step grid at BPM (`480 / bpm` seconds) | Mini melody view, expanded grid playhead, test duration, **BPM** dial |

The reel answers: *when does this tape come back around relative to the others?* (instructor language: **cooldown**)  
The melody window answers: *where in the composable grid do notes live, and how fast does the playhead cross it?*

### Mini melody view (shipped)

- **X-axis = full melody window** at the reel’s BPM (not note-derived span). Fixed max width (`--mini-melody-max-width`).
- Notes positioned by `startTime` / `duration` within the window; vertical lanes from resolved pitch range.
- **Playhead** during loop playback or test; hidden when idle.
- **Test** auditions the **full melody window** (not cut off at the last note).

### Transport rules

- **Play** disabled while reel is running; **stop** disabled while stopped.
- **Test** disabled while reel is playing; starting play cancels an in-progress test.
- Test button shows a subtle icon pulse while the test runs.

## Next steps

Ordered toward camp-ready polish. Items within a phase can be parallelized.

### 1. Time model completion

- **Dial inactive arcs** — grey out forbidden ranges on cooldown/BPM dials (FX dials today have no inactive arc).

### 2. Orchestra controls

- **Mute / solo** for comparing layers on one laptop.
- **Favorite** designation for the finale (one audible loop per laptop).
- **Reorder** loops in the stack (optional).
- Optional later: global key/scale for the room.

### 3. Sharing and presets

- **Export / import** — clipboard or shareable encoding of a reel (menu item exists, disabled).
- **Instrument selector** — enable toolbar dropdown; voice swap may require reel rebind.

### 4. Polish

- Persist **master volume** to `localStorage`.
- Reel ring level visualization (meter data exists; side meter used today).
- Random seed exposure for any randomized behavior.
- Undo (open decision).

### 5. Housekeeping

- Keep this document aligned with shipped behavior after major features land.

## Time model

### Canonical storage: seconds on the tape

- **`loopDuration`**: seconds—drives `Tone.Loop`, reel, and coprime-length pedagogy.
- **Note events**: `scaleStep`, `startTime`, `duration`, `velocity`—pitch compiled at playback.
- **`bpm`**: per-loop **melody tempo**—sets grid step length and playhead speed across the fixed grid.
- **Melody window**: `480 / bpm` seconds—derived from BPM only; grid extent and mini-melody X-axis.

### Melody window vs tape length (shipped model)

Composition uses a **short fixed grid**; playback uses a **longer tape** when needed.

| Concept | Role |
|---------|------|
| **Grid** | **32 columns** (two bars of 16th-note steps), fixed pixel width—composable window, not the whole tape |
| **`bpm`** | Independent melody tempo; `stepSec = 60 / bpm / 4`; sets **playhead speed** across the grid |
| **Melody window** | `32 × stepSec` seconds—`480 / bpm` |
| **`loopDuration`** | Independent tape period (reel, `Tone.Loop`); may exceed melody window; trailing time is silence |

**Why:** Many long loops (ensemble spacing) must not produce a huge scrollable grid of rests. Users compose in two bars; lengthening the tape is separate.

**Playhead (grid + mini melody):** scans left → right over the melody window during playback or test, then hides. Reel playhead reflects full `loopDuration`.

**Phasing** is a **multi-loop** property (different `loopDuration` values across rows), not within a single loop.

### Validation (no dialogs)

Invalid states must be **unreachable**, not corrected after the fact.

**Coupling (bidirectional clamps):**

| Control | Floor | Ceiling |
|---------|-------|---------|
| **Cooldown** (`loopDuration`) | melody window (`480 / bpm`) | app maximum (60s) |
| **Melody BPM** | `480 / loopDuration` (grid must fit on tape) | app maximum (240) |

Equivalently: **melody window ≤ cooldown** at all times.

**Additional rules (enforced in UI):**

1. Every note: `startTime + duration ≤ loopDuration`
2. Every note: `startTime + duration ≤ melody window` (grid extent)
3. Every note: `scaleStep` within −11…+11

**Preferred control**: Ableton-style **dials** with greyed inactive arcs for forbidden ranges (cooldown + BPM dials shipped; inactive arcs not yet).

## Scale and tonality

- **Per-loop scale**: editable dropdown (`WORKSHOP_SCALES`); changing scale **morphs pitches**, not grid shape.
- **Scale-step storage**: notes store `scaleStep`, not MIDI or pitch class—switching scale re-resolves the same steps in the new tonality.
- **Octave shift**: transposes the whole melody (−2…+2) without changing which grid rows are used.
- **Grid rows**: fixed 23 rows (−11…+11); pitch name + step label per row. No fold/highlight modes in v1—scale-only view.
- **Default for orchestra**: shared global key/scale (facilitator sets “everyone in C minor”) is enough for the group lesson; per-loop scale is already supported in the UI.

## Multiple loops per browser

- **Shipped**: create (blank or preset), duplicate, delete (with confirm), smart label increment (`melody1` → `melody2`).
- **Not yet**: reorder, mute/solo, favorite.
- **Finale** is a facilitation rule: one audible loop per laptop. Favorite/mute would enforce this in software later.

## Sequencer / composition (scoped)

- Bounded step grid—not piano-roll parity.
- **Fixed 32-column grid** at fixed cell size; BPM sets step seconds and playhead speed.
- **Gestures**: drag empty cells to paint; right-edge handle to extend/shrink; click bar body to delete; space/enter on focused cell toggles a single step.
- **Explicit non-goals for camp-ready v1**: arbitrary polyphony beyond grid rules, Euclidean/Markov generators, open-ended plugin architecture, left-edge resize (right edge only today).

## Randomness

Any randomized behavior should expose a **random seed** for reproducible demos and debugging.

## Orchestra “sync”

No centralized server clock. **Drift between laptops** is intentional. Shared musical references (global tonic, scale family), if added, are orthogonal to random seed.

## Technology

- **App**: Vite + TypeScript + React in `app/` (`ambient-101-app`, semver `0.x` until camp freeze).
- **Audio / theory**: Tone.js for scheduling and synthesis; Tonal for scales and naming.

## Repository layout

```
/docs/design.md          — this document
/legacy/sketch-v1/       — frozen p5 reference
/app/                    — Vite React app
```

## Open decisions

- **Undo** scope and UX.
- **Export format**: hex, base64, or raw JSON for sharing.
- **Accordion**: strict one-expanded-row (current) vs allow multiple.
- **Favorite / mute / solo** control naming and finale UX.
- **Per-loop instrument change**: rebind voice on change vs require new reel.
