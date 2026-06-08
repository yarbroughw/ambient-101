# Ambient 101 — workshop web app

Source of truth for product scope and implementation direction.

## Background

- **v1** was a p5.js + Tone.js + Tonal.js sketch (ITP Camp 2025), optimized for learning by editing code in the p5 web editor. It lives in the repo as `legacy/sketch-v1/`.
- **This app** is a hosted web application for a **re-run of the workshop** with a **narrower scope**: participants compose and control sound **through the UI**, not by modifying source code. Instructor explanations can focus on **listening and theory** (phase, loop length, tonality/modality) rather than programming.

Workshop slides (`Generative Music Workshop.pdf` at repo root) motivate concepts such as incommensurable tape loops, coprime lengths, time/space analogies (BPM vs Hz), scales/modes, and relative keys. **Markov chains** and **Euclidean rhythms** appear in the slides and in v1 code but are **out of scope** until after a camp-ready release.

## Goals

1. **Reliable workshop delivery**: one URL, predictable audio startup (browser autoplay policies), guardrails so attendees rarely break the tab.
2. **Compose loops in the UI**: a bounded sequencer-style surface—not an open-ended DAW.
3. **Laptop orchestra**: many machines contribute **independent tape loops**; the facilitator uses **tonality/modality** and **loop length relationships** as teaching hooks.
4. **Instructor demo**: **multiple tape loops in one interface** on a single laptop.
5. **Participant workflow**: attendees develop several loops and pick a favorite; at the **finale**, roughly **one loop audible per laptop** so the room reads as N voices, not N×layers.

## Current state

The app in `app/` is a **camp-usable composition surface**: user-authored loops, live editing, local persistence, and the horizontal row layout from the target UI. Audio starts empty; participants add blank loops or workshop presets after clicking **Start audio**.

### Audio

- **Browser audio gate** (`StartAudioButton` → `ensureAudioStarted`); centered startup screen until audio is unlocked.
- **`TapeLoop`**: `Tone.Loop`-driven period per loop; `start` / `stop` / `test(playbackDurationSec)`; wall-clock `getProgress()` for visuals; editable loop duration. **Hot-reload** on pattern edits preserves loop phase while running.
- **Declarative patterns**: `LoopPattern` / `PatternNote` types; `compilePatternToSink()` converts grid columns to seconds at playback; pitch from `root` + `scale` + `scaleStep` + `octaveShift` via `stepToPitch()`.
- **Schedulable note sink**: notes on the Transport so `stop` cancels future hits; `prepare` / `silence` on transport changes.
- **Per-loop voice**: **pad** or **pluck** synth → filter → gain → meter → **per-reel effects bus** (dry + reverb + ping-pong delay sends) → master input; per-reel volume on the voice gain.
- **Global master** (`globalEffects.ts`): master volume → limiter → FFT analyser → destination.
- **Preset templates** (`demoPatterns.ts`): `bass`, `melody1`, `melody2`—available via the presets menu, not loaded by default.

### Pattern model

| Field | Role |
|-------|------|
| `scaleStep` (−11…+11) | Composable row index; morphs when scale changes |
| `startCol`, `spanCols` | Note position on the 32-column grid (canonical storage) |
| `root` | Pitch class (C, Db, … B) |
| `scale` | Scale type from `WORKSHOP_SCALE_TYPES` (e.g. `minor`, `dorian`) |
| `octaveShift` (−2…+2) | Transposes entire melody on the grid |
| `bpm` | Melody tempo; sets grid step length and playhead speed |
| `loopDuration` | Tape period (reel, `Tone.Loop`); independent of grid width |
| `volume` | Per-reel level (0–1) |
| `reverb`, `delay` | Per-reel FX send (0–1); defaults 0.75 / 0.3 |
| `instrument` | `pad` or `pluck` (selector disabled in editor today) |

Notes are constrained to the **32-column grid** and **23 scale-step rows** at authoring time (`patternFitsGrid`, `noteFitsGrid`).

### Persistence

- **Loops** — `localStorage` key `ambient-101:loops`, version **2** JSON blob; saves on every pattern change.
- **Palette** — `localStorage` key `ambient-101:palette`; saves on selection.
- **Restored with loops**: stack order, labels, notes, BPM, root, scale, octave, duration, instrument, volume, reverb, delay.
- **Legacy migration**: v1 notes stored as `startTime` / `duration` are converted to columns on load.
- **Not persisted**: playback state, expanded row, master volume, mute/solo/favorite.

### UI

- **Color palettes** (`PaletteSelector`): ten themes from sketch-v1 lineage; persisted choice. Layout tokens in `layout.css`. App shell max-width 720px, UI scale 1.1×.
- **Toolbar** (three-column grid): play all / stop all | **master FFT spectrum** | **global root + scale** + **master volume** dial.
- **Loop stack**: full-width horizontal `TapeLoopRow` bars, stacked vertically. One row expanded at a time (accordion). **Spacebar**: stop all if any reel is playing, else start all.
- **Add controls**: **+** adds a blank loop; **presets ▾** adds `bass`, `melody1`, or `melody2`.

**Collapsed row**: transport (play / stop / test) · volume fader + level meter · reel (rotation, lap flash, cooldown readout) · editable label · mini melody view + metadata (BPM, instrument, root + scale) · edit / delete actions · header **⋯ menu** (duplicate; export disabled).

**Expanded row** (`LoopEditor`): subheader aligned with collapsed header—**cooldown** and **BPM** dials, per-reel **root** + **scale** (`ScaleTypeSelect` with abbreviated readout), instrument (read-only), octave shift, **reverb** / **delay** dials—then the **32×23 melody grid** (drag to paint spans, right-edge resize, click bar to delete, keyboard toggle on focused cell).

**Global tonality**: toolbar root and scale apply to all reels; mixed values show `*` when reels disagree.

## Time model

Two clocks teach different durations:

| Clock | Domain | UI |
|-------|--------|-----|
| **Cooldown** (`loopDuration`) | Full tape period before the melody repeats | Reel rotation, lap flash, cooldown dial |
| **Melody window** | Fixed 32-step grid at BPM (`480 / bpm` seconds) | Mini melody view, grid playhead, test duration, BPM dial |

The reel answers: *when does this tape come back around relative to the others?*  
The melody window answers: *where in the composable grid do notes live, and how fast does the playhead cross it?*

**Why separate?** Many long loops (ensemble spacing) must not produce a huge scrollable grid of rests. Users compose in two bars; lengthening the tape is separate. **Phasing** is a multi-loop property (different `loopDuration` values), not within a single loop.

**Note storage**: grid **columns**, not seconds. `compilePatternToSink()` and `noteStartTime()` / `noteDurationSec()` derive playback times from `startCol`, `spanCols`, and `bpm`. The mini melody view positions notes by column fraction across the full window.

**Playhead**: grid and mini melody scan left → right over the melody window during playback or test, then hide. Reel playhead reflects full `loopDuration`. Test auditions the full melody window.

**Coupling** (enforced via dial min/max—no error dialogs):

| Control | Floor | Ceiling |
|---------|-------|---------|
| Cooldown | melody window (`480 / bpm`) | 60s |
| BPM | `480 / loopDuration` | 240 |

Equivalently: **melody window ≤ cooldown** at all times. Notes must fit within the 32 columns and −11…+11 scale steps.

## Scale and tonality

- **Per-loop tonality**: separate **root** and **scale type** dropdowns; changing scale **morphs pitches**, not grid shape.
- **Scale-step storage**: notes store `scaleStep`, not MIDI or pitch class.
- **Octave shift**: transposes the whole melody (−2…+2) without changing which grid rows are used.
- **Grid rows**: fixed 23 rows (−11…+11); pitch name + step label per row.
- **Workshop scale library**: 23 types in `WORKSHOP_SCALE_TYPES` (diatonic modes, pentatonics, world scales, blues, etc.).
- **Global controls**: facilitator can set root and scale type for all reels from the toolbar.

## Multiple loops per browser

- **Shipped**: create (blank or preset), duplicate, delete (with confirm), smart label increment (`melody1` → `melody2`).
- **Not yet**: reorder, mute/solo, favorite.
- **Finale** is a facilitation rule: one audible loop per laptop. Favorite/mute would enforce this in software later.

## Composition scope

- Bounded step grid—not piano-roll parity.
- **Gestures**: drag empty cells to paint; right-edge handle to extend/shrink; click bar body to delete; space/enter on focused cell toggles a single step.
- **Non-goals for camp-ready v1**: arbitrary polyphony beyond grid rules, Euclidean/Markov generators, open-ended plugin architecture, left-edge resize, per-reel instrument switching in the UI.

## Next steps

Ordered toward camp-ready polish.

1. **Dial inactive arcs** — grey out forbidden ranges on cooldown/BPM dials.
2. **Orchestra controls** — mute / solo; favorite for finale; optional stack reorder.
3. **Sharing** — export / import (menu item exists, disabled).
4. **Instrument selector** — enable per-reel voice swap (may require reel rebind).
5. **Polish** — persist master volume; reel ring level visualization; undo (open decision).

## Technology

- **App**: Vite + TypeScript + React in `app/` (`ambient-101-app`, semver `0.x` until camp freeze).
- **Audio / theory**: Tone.js for scheduling and synthesis; Tonal for scales and naming.
- **Tests**: Vitest + Testing Library + jsdom; CI runs lint, build, and tests on push/PR (`.github/workflows/test.yml`).

## Repository layout

```
/docs/design.md          — this document
/legacy/sketch-v1/       — frozen p5 reference
/app/                    — Vite React app
```

## Open decisions

- Undo scope and UX.
- Export format: hex, base64, or raw JSON.
- Accordion: strict one-expanded-row (current) vs allow multiple.
- Favorite / mute / solo control naming and finale UX.
- Per-loop instrument change: rebind voice on change vs require new reel.
