let ensemble;

let startEnsembleButton = document.getElementById("start-ensemble-btn");
let stopEnsembleButton = document.getElementById("stop-ensemble-btn");

async function startEnsemble() {
  if (!ensemble) {
    console.log("Failed to start: ensemble not found");
    return;
  }

  // Try to unsuspend the audio context if it's suspended
  if (Tone.context.state === "suspended") {
    try {
      await Tone.context.resume();
      console.log("Audio context resumed");
    } catch (error) {
      console.error("Failed to resume audio context:", error);
      return;
    }
  }

  ensemble.startAll();
}

function stopEnsemble() {
  if (!ensemble) {
    console.log("Failed to stop: ensemble not found");
    return;
  }

  ensemble.stopAll();
}

function setup() {
  createCanvas(500, 500);

  setupSpectrum();

  let num = 8;
  let scaleName = "C4 minor";
  let longSynth = Synths.polySynth(
    {
      attack: 1.0,
      decay: 1.0,
      sustain: 0.7,
      release: 10.0,
    },
    "sawtooth",
    0.5,
    1000,
    6.0
  );
  let shortSynth = Synths.ambientSynth(200, 1.0);
  let pluckSynth = Synths.polySynth(
    {
      attack: 0.01,
      decay: 1.0,
      sustain: 0.9,
      release: 2.0,
    },
    "square",
    0.8,
    1000
  );

  console.log(Tonal.ScaleType.all().map((i) => i.name));
  let scaleDegree = Tonal.Scale.degrees("Eb3 malkos raga");

  let seq1 = Sequences.generateEuclideanArpeggio(
    [scaleDegree(-2), scaleDegree(-4), scaleDegree(4), scaleDegree(2)],
    (t, note) => {
      longSynth.triggerAttackRelease(note, 0.4, t, 2.0);
    },
    0.5,
    9,
    5,
    0
  );

  let seq2 = Sequences.generateEuclideanArpeggio(
    [scaleDegree(-1), scaleDegree(1), scaleDegree(-2), scaleDegree(-3)],
    (t, note) => {
      pluckSynth.triggerAttackRelease(note, 0.05, t);
    },
    0.5,
    11,
    7,
    0
  );

  let seq3 = Sequences.generateEuclideanArpeggio(
    [scaleDegree(5), scaleDegree(6), scaleDegree(7), scaleDegree(8)],
    (t, note) => {
      shortSynth.triggerAttackRelease(note, 0.3, t);
    },
    0.5,
    9,
    5,
    2
  );
  
  let seq4 = Sequences.generateEuclideanArpeggio(
    [scaleDegree(5), scaleDegree(5), scaleDegree(4), scaleDegree(6)],
    (t, note) => {
      pluckSynth.triggerAttackRelease(note, 0.2, t);
    },
    0.5,
    12,
    7,
    0
  );

  let myLoops = [
    new TapeLoop("bass").record((t) => {
      shortSynth.triggerAttackRelease(scaleDegree(-7), 3.0, t, 0.5);
      shortSynth.triggerAttackRelease(scaleDegree(-8), 3.0, t + 4, 0.3);
    }),
    new TapeLoop("bass2").record((t) => {
      longSynth.triggerAttackRelease(scaleDegree(-3), 1.0, t);
      longSynth.triggerAttackRelease(scaleDegree(-2), 2.0, t + 1);
      longSynth.triggerAttackRelease(scaleDegree(-4), 1.5, t + 3);
    }),
    new TapeLoop("sarahBass").record((t) => {
      pluckSynth.triggerAttackRelease(scaleDegree(-5), 4.0, t, 0.5);
      pluckSynth.triggerAttackRelease(scaleDegree(3), 4.0, t + 5, 0.5);
      pluckSynth.triggerAttackRelease(scaleDegree(-4), 4.0, t + 9, 0.5);
    }),
    new TapeLoop("pad1").record((t) => {
      shortSynth.triggerAttackRelease(scaleDegree(6), 1.0, t, 0.5);
      shortSynth.triggerAttackRelease(scaleDegree(7), 1.0, t + 1, 0.5);
      shortSynth.triggerAttackRelease(scaleDegree(5), 1.5, t + 2, 0.5);
    }),
    new TapeLoop("pad2").record((t) => {
      shortSynth.triggerAttackRelease(scaleDegree(11), 3.0, t, 0.2);
    }),
    new TapeLoop("melody1").record((t) => {
      longSynth.triggerAttackRelease(scaleDegree(7), 1.0, t);
      longSynth.triggerAttackRelease(scaleDegree(8), 1.0, t + 1);
      longSynth.triggerAttackRelease(scaleDegree(9), 1.5, t + 2);
    }),
    new TapeLoop("melody2").record((t) => {
      pluckSynth.triggerAttackRelease(scaleDegree(2), 0.4, t);
      pluckSynth.triggerAttackRelease(scaleDegree(8), 0.6, t + 1.5);
      pluckSynth.triggerAttackRelease(scaleDegree(7), 0.5, t + 3.0);
      pluckSynth.triggerAttackRelease(scaleDegree(5), 0.5, t + 3.5);
      pluckSynth.triggerAttackRelease(scaleDegree(6), 0.5, t + 4.0);
    }),
    new TapeLoop("melody3").record((t) => {
      pluckSynth.triggerAttackRelease(scaleDegree(9), 0.25, t);
      pluckSynth.triggerAttackRelease(scaleDegree(8), 0.25, t + 1.0);
      pluckSynth.triggerAttackRelease(scaleDegree(6), 0.25, t + 2.0);
      pluckSynth.triggerAttackRelease(scaleDegree(4), 0.25, t + 3.0);
      pluckSynth.triggerAttackRelease(scaleDegree(2), 1.0, t + 4.0);
    }),
    new TapeLoop("euclid1").record((t) => {
      seq1.stop(t);
      seq1.start(t);
    }),
    new TapeLoop("euclid2").record((t) => {
      seq2.stop(t);
      seq2.start(t);
    }),
    new TapeLoop("euclid3").record((t) => {
      seq3.stop(t);
      seq3.start(t);
    }),
    new TapeLoop("euclid4").record((t) => {
      seq4.stop(t);
      seq4.start(t);
    }),
  ];

  ensemble = new TapeLoopEnsemble(myLoops).randomDurations().playRate(0.5);

  Tone.Transport.start();
}

function draw() {
  background("#c8cdd2");

  if (ensemble) ensemble.draw();

  drawSpectrum();

  Controls.updateGlobalButtons();
}
