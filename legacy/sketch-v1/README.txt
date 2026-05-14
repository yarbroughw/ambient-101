AMBIENT 101: MUSIC FOR USB PORTS

This sketch is a generative music application that implements Brian Eno's tape loop phasing technique from his album "Ambient 1: Music for Airports" (1978). It provides a simple coding interface that allows users to create and control multiple asynchronous audio loops that drift in and out of phase with each other to create an evolving musical landscape.

It was created to support a workshop session I led at NYU's ITP Camp 2025. Attendees used the sketch's framework to compose their own custom loops, learning concepts in software development and music theory in the process.

CORE CONCEPT

The sketch uses multiple audio loops of different durations running simultaneously. As these loops cycle at different rates, they fall in and out of sync with one another, creating polyrhythmic and harmonic relationships that shift over time. In the resulting musical landscape, true repetition only happens when all the loops return to their starting positions at the same moment. Depending on the loops' durations, this can take days, weeks, or even years.

This implementation extends Eno's original concept by visualizing the loops, supporting dynamic loop creation, implementing audio synthesis chains with Tone.js, and adding mathematical pattern generation via Euclidean rhythms.

DEPENDENCIES

- **p5.js 1.11.7**
- **Tone.js 15.1.5** - Web Audio API wrapper for synthesis, effects, and scheduling
- **Tonal.js** - Music theory utilities for scales, intervals, and note calculations

CODE STRUCTURE

```
/
├── index.html             # Main HTML page, including imports for deps
├── sketch.js              # p5.js main loop and setup
├── style.css              # UI styling
└── modules/
    ├── tape-loops.js      # Core loop classes
    ├── synths.js          # Audio synthesis logic using Tone.js
    ├── examples.js        # Preset tape loop "ensemble" configurations
    ├── sequences.js       # Pattern generation helpers, using Tone.Sequence
    ├── scales.js          # Music theory utilities, using Tonal.js
    ├── numbers.js         # Math utilities
    ├── spectrum.js        # Audio visualization, using Tone.Analyzer
    ├── controls.js        # Play/stop button logic & keypress listener
    └── colors.js          # Hex code constants for UI
```