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

The app in `app/` has a working audio engine and the **horizontal row layout** from the target UI. Two fixed demo loops run independently with dual playheads, global FX, and a master spectrum. **Composition editing is not yet available**—patterns are hardcoded and the expanded row is a placeholder.

### Audio

- **Browser audio gate** (`StartAudioButton` → `ensureAudioStarted`).
- **`TapeLoop`**: `Tone.Loop`-driven period per loop; `start` / `stop` / `test(playbackDurationSec)`; wall-clock `getProgress()` for visuals; editable loop duration.
- **Declarative patterns**: `LoopPattern` / `PatternNote` types; `compilePatternToSink()` schedules notes; `melodyBounds()` derives content span for the mini melody view.
- **Schedulable note sink**: notes on the Transport so `stop` cancels future hits; fresh voice chain on each `start` avoids overlap.
- **Per-loop voice**: pad synth → filter → gain → meter → **global effects bus**; `silence` / `prepare` on transport changes.
- **Global effects bus** (`globalEffects.ts`): dry/wet reverb and ping-pong delay sends, master volume, FFT analyser tap on the master output.
- **Demo content**: two hardcoded patterns in C4 minor—`bass` (7s), `melody1` (11s)—in `demoPatterns.ts`.

### UI

- **Workshop palette** from sketch-v1 (`theme.css`; colors sourced from `legacy/sketch-v1/`). Layout tokens in `layout.css`. App shell max-width 720px, UI scale 1.1×.
- **Toolbar** (three-column grid): play all / stop all | **master FFT spectrum** | **global FX** (reverb, delay, volume dials).
- **Loop stack**: full-width **horizontal `TapeLoopRow` bars**, stacked vertically. One row expanded at a time (accordion).

**Collapsed row** (summary, mostly read-only):

| Region | Behavior |
|--------|----------|
| Transport | play / stop / test |
| Level meter | RMS bar with peak hold during playback or test |
| Reel | 12 o’clock tick, rotating playhead dot, lap flash at cycle start |
| Duration | Read-only seconds in reel center |
| Label | Pattern name |
| Mini melody view | Content-width note timeline + playhead (see below) |
| Metadata | BPM, instrument, scale — display only |
| Expand | Opens editor panel below |

**Expanded row**: same summary strip, except loop duration is click-to-edit (floor = `melodySpan`, max = 60s). Editor panel is a **placeholder** (“Sequencer editor coming soon…”).

### Dual clocks (shipped)

Tape loops teach two different durations:

| Clock | Domain | UI |
|-------|--------|-----|
| **Tape loop** | Full loop period (e.g. 11s) | Reel rotation + lap flash |
| **Melody** | Musical content only (e.g. ~8s of notes inside 11s) | Mini melody view + horizontal playhead |

The reel answers: *when does this loop come back around relative to the others?*  
The mini melody answers: *when do notes fire inside one pass of the tape?*

### Mini melody view (shipped)

- **X-axis = melody content only**, not full loop duration. Width is `melodyBounds` span (first note start → last note end).
- Notes render as a compact timeline (position/size from `startTime` and `duration`).
- **Playhead** scans left → right while `loopTime` is inside the melody window; **hidden** before the first note and after the last note ends (including the silent tail of the loop).
- **Test** transport previews melody content only (`test` duration = melody end).

## Next steps

Ordered toward a camp-ready release. Items within a phase can be parallelized.

### 1. Expanded sequencer editor

The main gap between demo and workshop use.

- Note grid for melody definition (bounded step grid, not piano-roll parity).
- Instrument selector (pad is the only voice today).
- Loop and melody duration controls with bidirectional clamps (see Time model).
- Presentation toggle: **highlight** vs **fold** for scale tones.
- Dual duration display in the summary strip (e.g. `8.0s / 11.0s`).

### 2. Pattern editing and validation

- User-authored patterns (replace hardcoded demos as the default path).
- Enforce `melodySpan ≤ loopDuration` and per-note bounds in the UI—invalid states unreachable, no dialogs.
- Ableton-style **dials** with greyed inactive arcs for forbidden ranges (reusable `Dial` component exists for FX today).
- BPM as an **editing lens** for the grid (`step width ∝ 60/bpm`); seconds remain canonical on the tape.

### 2b. Local persistence (later)

Rudimentary **`localStorage`** persistence so a refresh or return visit restores the user's work. Not camp-blocking until live editing ships; implement once patterns are user-authored.

**Persist (minimum):**

- Loop stack: order, count, and per-loop `LoopPattern` data (notes, `loopDuration`, BPM, scale, instrument, label).
- Per-loop UI config as needed (e.g. favorite, mute—when those exist).

**Out of scope for v1:** server sync, accounts, import/export file format (may follow from preset work in Open decisions). Serialize a versioned JSON blob; migrate or reset on schema change.

### 3. Multiple loops and orchestra controls

- Create, remove, and reorder loops in the stack.
- **Mute / solo** for comparing layers on one laptop.
- **Favorite** designation for the finale (one audible loop per laptop).
- Optional later: global key/scale control for the room; per-loop scale when it differs from global.

### 4. Polish and pedagogy hooks

- Reel ring level visualization (meter data exists; `reelVisualStyle.ts` helpers are unused—level is shown in the side meter today).
- Random seed exposure for any randomized behavior.
- Preset model, import/export, undo—see Open decisions.

## Time model

### Canonical storage: seconds on the tape

- **`loopDuration`**: seconds—drives `Tone.Loop`, reel, and coprime-length pedagogy.
- **Note events**: `startTime`, sounding duration, pitch, velocity—in seconds relative to loop start.
- **`bpm`**: per-loop **melody tempo**—sets grid step length and playhead speed across the fixed grid.
- **`melodySpan`**: derived from note content (`melodyBounds`)—mini melody view width and test length only; not the loop-duration floor.

### Melody window vs tape length (shipped model)

Composition uses a **short fixed grid**; playback uses a **longer tape** when needed.

| Concept | Role |
|---------|------|
| **Grid** | **32 columns** (two bars of 16th-note steps), fixed pixel width—composable window, not the whole tape |
| **`bpm`** | Independent melody tempo; `stepSec = 60 / bpm / 4`; sets **playhead speed** across the grid |
| **Melody window** | `32 × stepSec` seconds—derived from BPM only (`480 / bpm`) |
| **`loopDuration`** | Independent tape period (reel, `Tone.Loop`); may exceed melody window; trailing time is silence |

**Why:** Many long loops (ensemble spacing) must not produce a huge scrollable grid of rests. Users compose in two bars; lengthening the tape is separate.

**Playhead (expanded grid):** scans left → right over the melody window, then hides. Reel playhead reflects full `loopDuration`.

**Phasing** is a **multi-loop** property (different `loopDuration` values across rows), not within a single loop.

### Validation (no dialogs)

Invalid states must be **unreachable**, not corrected after the fact.

**Coupling (bidirectional clamps):**

| Control | Floor | Ceiling |
|---------|-------|---------|
| **Loop duration** | melody window (`480 / bpm`) | app maximum (e.g. 60s) |
| **Melody BPM** | `480 / loopDuration` (grid must fit on tape) | app maximum (e.g. 240) |

Equivalently: **melody window ≤ loop duration** at all times. Raising BPM shortens the melody window (faster playhead); lowering BPM lengthens it and may require a longer tape.

**Additional rules (when editing is live):**

1. Every note: `startTime + duration ≤ loopDuration`
2. Every note: `startTime + duration ≤ melody window` (grid extent)

**Preferred control**: Ableton-style **dials** with greyed inactive arcs for forbidden ranges.

**Display:** show **melody window / loop** (e.g. `5.0s / 11.0s`) in the editor—not note-derived span.

## Scale and tonality

- **Default for orchestra**: shared global key/scale (e.g. facilitator sets “everyone in C minor”) is enough for the group lesson.
- **Per-loop scale**: optional later—useful for display and fold/highlight in the editor; only show in the collapsed strip when it differs from global.
- **Representation**: stable **chromatic note storage + scale mask** so switching scale/fold/highlight does not destroy out-of-scale notes.

## Multiple loops per browser

- Several loops per tab: create, reorder, **mute/solo**, compare, designate a **favorite** for the finale.
- **Finale** is a facilitation rule: one audible loop per laptop. Optional later: an “ensemble listen” mode that mutes non-selected loops.

Currently: two fixed demo loops only.

## Sequencer / composition (scoped)

- Bounded step grid—not piano-roll parity.
- **Fixed 32-column grid** (two bars of 16ths at fixed cell size); BPM sets step seconds and playhead speed; not stretched to `loopDuration`.
- **Presentation toggle**:
  - **Highlight**: full pitch set in scope; scale tones emphasized.
  - **Fold**: non-scale rows hidden; underlying chromatic data preserved.
- **Explicit non-goals for camp-ready v1**: arbitrary polyphony editing, Euclidean/Markov generators, open-ended plugin architecture.

## Randomness

Any randomized behavior should expose a **random seed** for reproducible demos and debugging.

## Orchestra “sync”

No centralized server clock. **Drift between laptops** is intentional. Shared musical references (global tonic, scale family), if added, are orthogonal to random seed.

## Technology

- **App**: Vite + TypeScript + React in `app/` (`ambient-101-app`, semver `0.x` until camp freeze).
- **Audio / theory**: Tone.js for scheduling and synthesis; Tonal for scales, degrees, and naming.

## Repository layout

```
/docs/design.md          — this document
/legacy/sketch-v1/       — frozen p5 reference
/app/                    — Vite React app (horizontal rows + audio shipped)
```

## Open decisions

- **Editing gestures** (toggle vs drag), **undo**. Grid is fixed at 32 columns (two bars) for v1.
- **Preset model**: factory presets vs blank slate; import/export (optional). **localStorage** restore is the first persistence step—see §2b.
- **Per-loop scale** in v1 or post-camp.
- **Accordion**: strict one-expanded-row (current) vs allow multiple.
- **Favorite / mute / solo** control naming and finale UX.
