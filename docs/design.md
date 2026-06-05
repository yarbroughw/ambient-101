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

## Shipped today (Phase 1)

The app in `app/` is past scaffold: audio and a first-pass loop UI are working.

### Audio

- **Browser audio gate** (`StartAudioButton` → `ensureAudioStarted`).
- **`TapeLoop`**: `Tone.Loop`-driven period, independent per loop; `start` / `stop` / `test`; wall-clock `getProgress()` for visuals; editable loop duration.
- **Per-loop voice**: pad synth → filter → gain → meter → shared reverb; `silence` / `prepare` on transport changes.
- **Schedulable note sink**: notes scheduled on the Transport so `stop` cancels future hits; fresh loop instance on each `start` avoids overlap.
- **Demo content**: two hardcoded patterns in C minor—`bass` (7s), `melody1` (11s)—compiled from imperative `TapeLoopCallback`s in `demoPatterns.ts`.

### UI (interim layout)

- **Workshop palette** from sketch-v1 (`theme.css`; colors sourced from `legacy/sketch-v1/`).
- **Toolbar**: play all / stop all after audio starts.
- **Loop grid**: square `TapeLoopCard` panels (100×140px) in a responsive grid—**placeholder layout** until horizontal rows land (see below).
- **Per card**: label, transport (play / stop / test), circular reel with 12 o’clock tick, rotating playhead dot, lap flash at cycle start (white pulse), inline loop duration edit.

### Not yet built

- User-authored patterns, sequencer grid, instrument/scale controls, mute/solo/favorite, add/remove loops, horizontal bar layout, mini melody view, reel level visualization (meter hook exists on `TapeLoop` but is not wired to the UI).

## Target UI: horizontal tape loop rows

Loops are **full-width horizontal bars**, **stacked vertically**—not a grid of square tiles. Expanding a loop grows the row **downward**, which is easier to picture than expanding inside a fixed tile.

### Collapsed row (summary, read-only)

Left-to-right (exact order TBD during implementation):

- Transport: play, stop, test
- **Reel** + rotating playhead (loop period), with lap flash at 12 o’clock
- **Loop duration** (seconds)
- Label
- **Metadata strip**: instrument, scale (if shown), tempo or derived melody span
- **Mini melody view** (see below)

One loop expanded at a time (accordion) is the default expectation.

### Expanded row (editable)

Same summary strip at top (or sticky), plus:

- Note grid for melody definition
- Instrument selector
- Duration controls for **loop** and **melody** (see Time model)
- Other per-loop settings as they are added

### Dual clocks (why two playheads)

Tape loops teach two different durations:

| Clock | Domain | UI |
|-------|--------|-----|
| **Tape loop** | Full loop period (e.g. 30s) | Reel rotation + lap flash |
| **Melody** | Musical content only (e.g. 2s of notes inside that 30s) | Mini melody view + horizontal playhead |

The reel answers: *when does this loop come back around relative to the others?*  
The mini melody answers: *when do notes fire inside one pass of the tape?*

Those are intentionally separate so sparse long loops (short gesture, long silence) stay legible.

### Mini melody view

- **X-axis = melody content only**, not full loop duration. If the loop is 30s and sounding content spans 2s, the mini view is 2s wide—no empty 28s tail.
- Notes render as a compact timeline (position/size from note times and lengths).
- **Playhead** scans left → right over the mini view while `loopTime` is inside the melody window; sits at the end (or idles) during the silent tail; resets each loop lap.
- **Expanded editor** may show the full loop timeline (0…loop duration) for placement; the collapsed mini view stays content-only.

## Time model

### Canonical storage: seconds on the tape

- **`loopDuration`**: seconds—drives `Tone.Loop`, reel, and coprime-length pedagogy.
- **Note events**: `startTime`, sounding duration, pitch, velocity—in seconds relative to loop start.
- **`melodySpan`**: derived from content (start of first note → end of last sounding note), or an explicit pattern-length cap—used for validation and the mini view width.

**Tempo (BPM)** and **bars/beats** are an **editing lens** for the grid (`step width ∝ 60/bpm`), not a replacement for loop duration. Always show derived **melody span** alongside loop duration (e.g. `2.4s / 30s`).

### Validation (no dialogs)

Invalid states must be **unreachable**, not corrected after the fact. No modal dialogs for duration conflicts.

**Rules:**

1. `melodySpan ≤ loopDuration`
2. Every note: `startTime + soundingDuration ≤ loopDuration`

**Bidirectional UI clamps:**

| Control | Floor | Ceiling |
|---------|-------|---------|
| Loop duration | `melodySpan` | app maximum (e.g. 60s) |
| Melody extent | — | `loopDuration` |

If melody is 7s, the loop-duration control **cannot go below 7s**. If loop is 30s, melody **cannot extend past 30s**.

**Preferred control**: Ableton-style **dials** with a **greyed inactive arc** for the forbidden range (e.g. loop dial shows 0–7s greyed when melody is 7s). Steppers, sliders with dead zones, and non-draggable grid boundaries are acceptable alternatives. Drag, scroll, and keyboard nudging all respect the same clamps.

When the user shortens the pattern (delete notes), `melodySpan` drops and the loop-duration floor moves down live.

When tempo or bar count changes, recompute `melodySpan` and apply the same ceilings—still no dialogs.

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
/app/                    — Vite React app (Phase 1 shipped)
```

## Open decisions

- Exact **grid defaults** (steps, octave span), **editing gestures** (toggle vs drag), **undo**.
- **Preset model**: factory presets vs blank slate; import/export (optional).
- **Per-loop scale** in v1 or post-camp.
- **Accordion**: strict one-expanded-row vs allow multiple.
- **Favorite / mute / solo** control naming and finale UX.
