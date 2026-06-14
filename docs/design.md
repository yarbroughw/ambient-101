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

The app in `app/` is a **camp-usable composition surface**: user-authored loops, live editing, local persistence, and the horizontal row layout from the target UI. The app opens on a **startup screen** listing saved ensembles; clicking an ensemble row (or creating one via **blank** / **presets**) doubles as the browser-audio unlock gesture and opens the editor directly.

### Audio

- **Browser audio gate**: `ensureAudioStarted` runs inside the startup screen's open/create row click (there is no separate start button); rows show `opening…` while the context resumes and surface errors inline. **Session recovery** resumes a suspended `AudioContext` after idle or tab backgrounding.
- **`TapeLoop`**: `Tone.Loop`-driven period per loop; `start` / `stop` / `test(playbackDurationSec)`; wall-clock `getProgress()` for visuals; editable loop duration. **Hot-reload** on pattern edits preserves loop phase while running. Downbeat notes fire immediately (not deferred to Transport).
- **Declarative patterns**: `LoopPattern` / `PatternNote` types; `compilePatternToSink()` converts grid columns to seconds at playback; pitch from `root` + `scale` + `scaleStep` + `octaveShift` via `stepToPitch()`.
- **Schedulable note sink**: notes on the Transport so `stop` cancels future hits; `prepare` / `silence` on transport changes.
- **Per-loop voice**: recipe-based instruments (`instruments/recipes.ts`; ids `pad`, `pluck`, `bass`, `bell`, `organ`, `keys`, `glass`, `strings`, `reed`, `marimba`, `harp`, `gong`, `brass`) → filter → chorus → gain → meter → **per-reel effects bus** (dry + reverb send + ping-pong delay) → master input; per-reel volume on the voice gain. Optional per-reel overrides for cutoff, resonance, chorus, attack, and release (absent = recipe default). Voices rebind live on instrument change (cutoff, resonance, attack, release reset; chorus persists).
- **Global master** (`globalEffects.ts`): per-reel reverb sends route into a **shared** `Tone.Reverb` convolution (one impulse, one space for the ensemble) → master volume → limiter → FFT analyser → destination. Ping-pong delay remains per-reel.
- **Loop presets** (`loopPresets.ts`): JSON files in `src/presets/reels/` imported via Vite glob (`scale`, `piano phase`, `aisatsana`); available from the add-menu presets dropdown and import JSON.
- **Ensemble presets** (`ensembleTemplates.ts`): JSON files in `src/presets/ensembles/` (`workshop-starter`, `airports`); each embeds full reel patterns (no preset-id references). Exported ensemble JSON with a `name` field is accepted as label/suggested name.

### Pattern model

| Field | Role |
|-------|------|
| `scaleStep` (−11…+11) | Composable row index; morphs when scale changes |
| `startCol`, `spanCols` | Note position on the 32-column grid (canonical storage) |
| `loopCols` (1…32) | Active grid width; the melody loops at this length (sub-2-bar seamless loops, e.g. piano phase). Dragged via the grid's loop-end handle |
| `root` | Pitch class (C, Db, … B) |
| `scale` | Scale type from `WORKSHOP_SCALE_TYPES` (e.g. `minor`, `dorian`, `chromatic`) |
| `octaveShift` (−2…+2) | Transposes entire melody on the grid |
| `bpm` | Melody tempo; sets grid step length and playhead speed. Stored, but edited indirectly via the **fill** slider (`bpm = bpmForFill(loopDuration, fill)`); kept as a float for gap-free seamless loops |
| `loopDurationMs` | Tape period (reel, `Tone.Loop`) in composed ms; the phasing object. Displayed/edited as playback seconds via pace |
| `volume` | Per-reel level (0–1) |
| `reverb`, `delay` | Per-reel FX send (0–1); defaults 0.75 / 0.3 |
| `instrument` | Recipe id; editable per reel in the expanded editor |
| `cutoff`, `resonance` | Optional low-pass override (Hz / Q) |
| `chorus` | Optional chorus wet (0–1) |
| `attack`, `release` | Optional amplitude envelope override (seconds) |

Notes are constrained to the **32-column grid** and **23 scale-step rows** at authoring time (`patternFitsGrid`, `noteFitsGrid`).

### Persistence

- **Ensembles** — `localStorage`: an index at `ambient-101:ensemble-index` plus one blob per ensemble at `ambient-101:ensemble:<id>` (loops + pace scale). Saved when leaving the editor; the startup list tracks last-opened.
- **Legacy migration**: the single-session `ambient-101:loops` blob (and v1 notes stored as `startTime` / `duration`) migrate on load. Legacy BPM is clamped on load so melody window ≤ tape period.
- **Settings** — `localStorage`:
  - `ambient-101:palette` — color theme; saves on selection
  - `ambient-101:lock-melody-tempo` — pace behavior (default off; migrates inverted from legacy `ambient-101:pace-affects-melody`)
  - `ambient-101:visual-latency-offset-ms` — playhead compensation (−100…+500 ms; default 0)
  - `ambient-101:timeline-motion` — `fixed-rate` or `fixed-width` (default `fixed-rate`)
  - `ambient-101:timeline-zoom-stop` — −2…+2 (default 0)
- **Restored with loops**: stack order, labels, notes, BPM, loopCols, root, scale, octave, duration, instrument, volume, reverb, delay, and voice overrides (cutoff, resonance, chorus, attack, release).
- **Not persisted**: playback state, expanded row, view mode, master volume, mute/solo/favorite, sync-label elapsed/remaining toggle.

### UI

- **Settings** (`SettingsButton` + `SettingsModal`): gear icon on startup screen and editor. Sections — **appearance** (palette selector, moved out of toolbar), **playback** (lock melody tempo checkbox), **sync** (visual sync offset slider with device + total latency readout).
- **Startup screen** (`StartupScreen`): saved-ensemble rows (name · reel count · `›`) that open on click; a quiet hover-revealed `×` deletes with confirm. **blank** and **presets ▾** create-and-open (ensemble presets: workshop starter, airports, import JSON). The **workshop starter** preset embeds the scale exercise reel inline.
- **Toolbar**: play all / stop all + **global pace** stepper | **global root + scale** | **master FFT spectrum** (spectral tilt, adaptive ceiling, spatial smoothing) | **master volume** dial.
- **View toggle row**: **ensemble sync label** | **timeline motion controls** (timeline view only) | **reels | timeline** switch (+ lowercase **`t`**).
- **Loop stack**: full-width horizontal `TapeLoopRow` bars, stacked vertically. One row expanded at a time (accordion). **Spacebar**: stop all if any reel is playing, else start all.
- **Ensemble sync label** (`EnsembleSyncLabel`): empty placeholder for single-reel ensembles (reserves layout space). With ≥2 reels but &lt;2 playing: `resync in {cycle}` (LCM of reel periods). With ≥2 playing: `resync in -{remaining} / {total} · {percent}%`; click toggles to `running for {elapsed} / {total} · {percent}%`. Uses playback-period ms and `heardNowSec()` for latency-aware animation.
- **Ensemble timeline view** (`EnsembleTimeline`): swaps the **Reels** view for a **scrolling tape-head** timeline. Each reel keeps its card (same height/position, so rows morph in place); inside, the loop is **tiled** and scrolls left under a single fixed white playhead (the "now"/tape head, shared across lanes), with the melody window drawn by the shared `MiniMelodyView`, a **silent tail strip** when fill &lt; 100% (subtle horizontal hairlines), and a seam at each loop boundary. Lanes scroll at the same px/second, but their seams cross the playhead at different rates (every `loopDuration`), so they drift in and out of alignment — **phasing** shown literally as tape of different lengths passing a head. On each downbeat a lane pulses its **whole border** (matching the Reels lap flash) and blooms the playhead; different lanes flash at different rates. Tape is laid out at **composed (unpaced) scale**, so **global pace shows up as scroll speed**, not as rescaled tiles. Scroll is driven by a **free-running phase**: it syncs to the audio once when the view appears, then advances by elapsed time ÷ the loop's current duration. Because `loop.duration` is the exact audio period it stays in sync without snapping (snapping each cycle caused a small skip), and a pace change only changes the speed — the tape never jumps. Laps (the downbeat flash) are counted from the phase wrap itself (`lapFlashKey`), so a rebuild on a pace/tonality change can't cause a false skip; lane phase resets when playback stops. Each lane is chipped with **reel name · loop length**; reels with no notes show an **empty reel** hint. Lanes match the Reels card height exactly (`content-box` so the border adds on top like the Reels article); tiles are memoized so only the per-frame transform updates. Lanes are otherwise read-only, but **clicking a lane jumps back to the Reels view scrolled to that reel**.
- **Timeline motion controls** (`TimelineMotionControls`, timeline view only): **rate / width** toggle (`fixed-rate` = tile width ∝ loop period; `fixed-width` = fixed tile width, scroll speed shows relative length) and **− / + zoom** (√2 steps per stop, −2…+2, persisted).
- **Add controls**: **+** adds a blank loop; **presets ▾** adds a reel preset (`scale`, `piano phase`, `aisatsana`) or **import JSON**.

**Collapsed row**: transport (play / stop / test) · volume fader + level meter · reel (rotation, **fill arc**, sounding/dim dot, lap bloom, tape-length readout) · editable label · mini melody view + metadata (**melody window seconds**, instrument, root + scale) · **pencil** (expand editor) + **⋯ menu** as a matched button pair (duplicate · copy JSON · **delete** with confirm).

**Expanded row** (`LoopEditor`): two-row subheader (`EditorSubheader`), grouped by concept —

**Row 1 (always visible):**
| Group | Controls |
|-------|----------|
| **timing** | **tape** dial + **fill** slider (% readout, derived melody seconds beneath; 100% = seamless, with a notch + greyed forbidden arc at the floating minimum) |
| **key** | root + scale (`ScaleTypeSelect` with abbreviated readout) + octave shift |
| **voice** | instrument selector + **sound** expander (▸/▾) |

**Row 2 (hidden until "sound" expanded):**
| Group | Controls |
|-------|----------|
| **filter** | cutoff, res (resonance) |
| **envelope** | attack, release |
| **fx** | reverb, delay, chorus |

Then the **32×23 melody grid** (drag to paint spans, drag bars to move, left/right-edge resize, click bar to delete, keyboard toggle on focused cell, and a **loop-end grip handle** with tooltip that drags `loopCols`). Row hit-testing uses measured cell layout (`rowAtClientYMeasured`).

**Global tonality**: toolbar root and scale apply to all reels. When reels disagree the control keeps showing the **last value it was set to** (seeded from the most common reel value on open) with a trailing `*`; picking any option — including the shown one — applies it to every reel.

## Time model

Two clocks teach different durations, but the user controls them as **period + fill** rather than two independent tempos:

| Clock | Domain | UI |
|-------|--------|-----|
| **Tape period** (`loopDurationMs`) | Full tape length before the melody repeats; the phasing object | Reel rotation, lap bloom, **tape** dial + readout (the UI says "tape", never "cooldown" — that word is reserved for the silent tail) |
| **Melody window** (`480 / bpm`, scaled by `loopCols`) | Wall-clock span of the active grid columns | Mini melody view, grid playhead, test duration, reel fill arc |

**Fill** = melody window ÷ tape period, in (0, 1] (`melodyFill`). It is the user-facing inner control — the **fill slider**, which replaces the old BPM dial. `bpm` is derived (`bpmForFill`) and stored; it is kept as an exact **float** so seamless is gap-free even when `480 / loopDuration` is not an integer (a 7s seamless reel needs bpm 480/7 ≈ 68.57).

- **100% fill = seamless**: the melody fills the whole tape, the reel ring is fully lit, and the last note meets the first with no silent gap. This is the control's ceiling — turn it up to lock the loop.
- **Below 100%** leaves a silent **cooldown tail** after the melody window each lap (visible in the timeline view as a tail strip).

The reel answers: *when does this tape come back around relative to the others?*  
The fill answers: *how much of that period is melody vs. silence?*

**Invariant — fill is sticky (default mode).** When **lock melody tempo** is off (default), dragging the tape dial re-derives `bpm` to hold the fill constant, so a seamless reel stays seamless (and a tail keeps its proportion) when its period changes. Consequence: lengthening a reel slows its melody proportionally — a tape-speed intuition, with no repitch. The window floor (bpm ≤ 240 ⇒ window ≥ 2s) makes the **fill minimum float with the tape period** (`minFillForLoopDuration`): short tapes are forced fuller — a 2s tape can only be seamless. The fill slider shows this as a notch with a greyed forbidden arc.

**Lock melody tempo** (settings → playback, default off): when on, global pace scales **tape period only**; melody BPM stays fixed — intended for phasing while keeping melodic speed constant. Toggling runs `adaptPatternForLockMelodyTempoChange()` to convert stored patterns between modes. With lock on, dragging the tape dial **does not** re-derive BPM to hold fill; tape floor becomes the melody-window duration. Pace stepper limits are stricter (`canStepPaceScale` rejects steps that would push fill &gt; 100% on seamless reels).

**Why a period + tail at all?** Many long loops (ensemble spacing) must not produce a huge scrollable grid of rests. Users compose in a fixed two bars; the tail lengthens the tape without enlarging the grid. **Phasing** is a multi-loop property (different `loopDuration` values), not within a single loop — and seamless reels phase most cleanly, with no silence between laps.

**Note storage**: grid **columns**, not seconds. `compilePatternToSink()` and `noteStartTime()` / `noteDurationSec()` derive playback times from `startCol`, `spanCols`, and `bpm`. The mini melody view positions notes by column fraction across the full window.

**Playhead & colour**: the grid and mini melody scan left → right over the melody window, then hide for the tail. Playhead position uses **heard-now** time (`outputLatency` + user visual sync offset). The reel dot sweeps the full `loopDuration`; it is **white while over the fill arc (melody sounding)** and **dim over the tail**, with a momentary **bloom** at 12 o'clock marking each lap — a separate channel so the lap still reads on seamless reels, where the dot never dims. Test auditions the full melody window.

**Bounds** (enforced via dial/slider min/max—no error dialogs):

| Control | Floor | Ceiling |
|---------|-------|---------|
| Tape period | 2s (or melody window when lock melody tempo on) | 60s |
| Fill | `minFillForLoopDuration` (2s window ÷ tape period, ≤ 1) | 100% (seamless) |

Equivalently: **melody window ≤ tape period** at all times. Notes must fit within the 32 columns and −11…+11 scale steps.

## Scale and tonality

- **Per-loop tonality**: separate **root** and **scale type** dropdowns; changing scale **morphs pitches**, not grid shape.
- **Scale-step storage**: notes store `scaleStep`, not MIDI or pitch class.
- **Octave shift**: transposes the whole melody (−2…+2) without changing which grid rows are used.
- **Grid rows**: fixed 23 rows (−11…+11); pitch name + step label per row.
- **Workshop scale library**: 24 types in `WORKSHOP_SCALE_TYPES` (diatonic modes, pentatonics, world scales, blues, **chromatic** for semitone stepping, etc.).
- **Global controls**: facilitator can set root and scale type for all reels from the toolbar.

## Multiple loops per browser

- **Shipped**: create (blank or preset), duplicate, delete (with confirm), smart label increment (`melody1` → `melody2`), synchronized start-all at a shared audio-clock instant, ensemble export/import JSON.
- **Not yet**: reorder, mute/solo, favorite.
- **Finale** is a facilitation rule: one audible loop per laptop. Favorite/mute would enforce this in software later.

## Composition scope

- Bounded step grid—not piano-roll parity.
- **Gestures**: drag empty cells to paint; drag a bar to move it across rows/columns; left/right-edge handles to resize; click bar body to delete; space/enter on focused cell toggles a single step; drag the loop-end grip handle (or arrow keys on it) to set `loopCols`.
- **Non-goals for camp-ready v1**: arbitrary polyphony beyond grid rules, Euclidean/Markov generators, open-ended plugin architecture.

## Next steps

Ordered toward camp-ready polish.

1. **Dial inactive arcs** — done for the fill slider (`softMin` notch + greyed arc); extend to the tape dial if useful.
2. **Orchestra controls** — mute / solo; favorite for finale; optional stack reorder.
3. **Sharing** — copy JSON / import JSON shipped per reel; ensemble-level export/import shipped.
4. **Polish** — persist master volume; reel ring level visualization; idle state for the master spectrum; undo (open decision).

## Technology

- **App**: Vite + TypeScript + React in `app/` (`ambient-101-app`, semver `0.x` until camp freeze).
- **Audio / theory**: Tone.js for scheduling and synthesis; Tonal for scales and naming.
- **Tests**: Vitest + Testing Library + jsdom; CI runs lint, build, and tests on push/PR (`.github/workflows/test.yml`).

## Repository layout

```
/docs/design.md          — this document
/legacy/sketch-v1/       — frozen p5 reference
/app/                    — Vite React app
  src/presets/reels/     — reel preset JSON
  src/presets/ensembles/ — ensemble preset JSON
```

## Open decisions

- Undo scope and UX.
- Accordion: strict one-expanded-row (current) vs allow multiple.
- Favorite / mute / solo control naming and finale UX.
