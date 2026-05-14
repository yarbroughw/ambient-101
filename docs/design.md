# Ambient 101 — workshop web app (design snapshot)

This document captures the agreed direction as of the initial scaffold. It is the source of truth for product scope until superseded.

## Background

- **v1** was a p5.js + Tone.js + Tonal.js sketch (ITP Camp 2025), optimized for learning by editing code in the p5 web editor. It lives in the repo as `legacy/sketch-v1/`.
- **This app** is a hosted, full web application for a **re-run of the workshop** with a **narrower scope**: participants compose and control sound **through the UI**, not by modifying source code. Instructor explanations can focus on **listening and theory** (phase, loop length, tonality/modality) rather than programming.

Workshop slides (`Generative Music Workshop.pdf` at repo root) motivate concepts such as incommensurable tape loops, coprime lengths, time/space analogies (BPM vs Hz), scales/modes, and relative keys. **Markov chains** and **Euclidean rhythms** appear in the slides and in v1 code but are **explicitly out of scope for the first shipped version** of this app (they may return later as optional/advanced features).

## Goals

1. **Reliable workshop delivery**: one URL, predictable audio startup (browser autoplay policies), enough guardrails that attendees rarely “break” the tab.
2. **Compose loops in the UI**: a bounded sequencer-style surface—not an open-ended DAW.
3. **Laptop orchestra**: many machines contribute **independent tape loops**; the facilitator uses **tonality/modality** and **loop length relationships** as teaching hooks.
4. **Instructor demo**: **multiple tape loops in one interface** so a single laptop can demonstrate without juggling separate projects.
5. **Participant workflow**: attendees may **develop several loops** and **pick a favorite** for sharing; only at the **very end** does the group aim for **roughly one sounding loop per laptop** so the room reads as N voices, not N×layers.

## Naming and versioning

- **Product name** (working): align with **Ambient 101** / “tape loop orchestra” framing used in the workshop.
- **Technical versioning**: follow **semver** in `package.json` (e.g. `0.x` until a camp-ready freeze, then `1.0.0` for a pinned build). Marketing “2.0” is optional language for “successor to the p5 sketch” and does not need to match semver.

## Core concepts (audio + UX)

### Tape loops

- Each loop has a **length** (time) and **content** (pitched pattern). Loops run **asynchronously** relative to one another so they **drift in phase**, producing long-period repetition (the pedagogical link to Eno / Airports and coprime lengths).

### Multiple loops per browser

- **Multiple loops per tab** are a **first-class** requirement: create/manage several loops, **mute/solo**, compare, and designate a **favorite** (or “the one I’ll use for the finale”)—exact control naming TBD during implementation.
- **Finale behavior** is a **facilitation rule**: ask everyone to have **only one loop audible** when listening as a full ensemble. Optional future guardrail: a dedicated “ensemble listen” mode that mutes non-selected loops (not required for first milestone).

### Sequencer / composition UI (scoped)

- **Pitch dimension**: user can work in **chromatic** mode or in **named scales/modes** (scale-aware editing).
- **Presentation toggle** (two modes):
  - **Highlight**: show the full chromatic grid (or full pitch set in scope); **scale tones are visually emphasized**; non-scale cells remain visible.
  - **Fold**: **non-scale tones are hidden** (or collapsed) so every visible step is in-scale. Useful for beginners; switching scales mid-edit should not silently destroy data—implementation should prefer a stable underlying representation (e.g. chromatic + mask) so notes outside the current scale are preserved when switching back to highlight/chromatic.

**Explicit non-goals for first ship**: piano-roll parity, arbitrary polyphony editing, Euclidean/Markov generators, open-ended plugin architecture.

### Randomness

- Any **randomized** behavior (e.g. humanize, pattern fill, stochastic picks) should support a user-visible **random seed** so outcomes are **reproducible** (demo, debugging, “same seed, different loop length” comparisons).

### Orchestra “sync” (clarification)

- There is **no requirement** for centralized server clock sync in the initial design. Natural **drift** between laptops is part of the aesthetic and the lesson.
- If **shared musical references** (e.g. global tonic, shared scale family) are added later, they are **orthogonal** to the random seed and should be spelled out in a future revision of this doc.

## Technology direction

- **Stack**: Vite + TypeScript + React for the application in `web/` (`package.json` name `ambient-101-web`, semver from `0.1.0` until a camp-ready release).
- **Audio / theory**: **Tone.js** for scheduling, synthesis, and transport; **Tonal** (or `@tonaljs/*` as appropriate) for scales, degrees, and naming—aligned with v1 capabilities but without exposing code to participants.

## Repository layout (initial)

```
/docs/design.md          — this document
/legacy/sketch-v1/       — frozen reference implementation (p5 + scripts)
/web/                    — Vite React app (scaffold)
```

## Open decisions (to resolve during implementation)

- Exact **grid size defaults** (steps per loop, octave span), **editing gestures** (toggle vs drag), and **undo** behavior.
- **Preset/content** model: factory presets vs blank slate; import/export of patches (optional).
- **Visualization**: minimal playhead/phase view vs richer loop timeline (balance polish vs schedule).
