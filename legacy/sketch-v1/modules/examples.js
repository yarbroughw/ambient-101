const Examples = {
  Ensembles: {
    randomFrequency() {
      let synth = Synths.polySynth();

      let randomFrequency = random(80, 1000);

      let myLoops = [
        new TapeLoop("random").record((t) => {
          synth.triggerAttackRelease(randomFrequency, 1.0, t);
        }),
      ];

      return new TapeLoopEnsemble(myLoops).randomDurations();
    },

    randomFrequencies(num = 4) {
      let synth = Synths.polySynth("square");

      let myLoops = [];

      for (let i = 0; i < num; i++) {
        let randomFrequency = random(80, 1000);

        myLoops.push(
          new TapeLoop("random").record((t) => {
            synth.triggerAttackRelease(randomFrequency, 1.0, t);
          })
        );
      }

      return new TapeLoopEnsemble(myLoops).randomDurations();
    },

    ratiosOfRandomFrequency() {
      let synth = Synths.polySynth("square");

      let startingFrequency = random(80, 200);
      let frequency2 = startingFrequency * (3/2);
      let frequency3 = startingFrequency * (4/3);
      let frequency4 = startingFrequency * (5/4);

      let myLoops = [
        new TapeLoop("random").record((t) => {
          synth.triggerAttackRelease(startingFrequency, "8n", t);
        }),
        new TapeLoop("fifth").record((t) => {
          synth.triggerAttackRelease(frequency2, "8n", t);
        }),
        new TapeLoop("fourth").record((t) => {
          synth.triggerAttackRelease(frequency3, "8n", t);
        }),
        new TapeLoop("third").record((t) => {
          synth.triggerAttackRelease(frequency4, "8n", t);
        }),
      ];
      
      return new TapeLoopEnsemble(myLoops)
        .shufflePresetDurations()
        .playRate(2);
    },

    randomNotes(num = 4) {
      let synth = Synths.polySynth("square");

      let octaveRange = Array.from({ length: 24 }, (_, i) => i + 50);

      let shuffledOctaveRange = shuffle(octaveRange);

      let myLoops = [];

      for (let i = 0; i < num; i++) {
        let note = Tone.Midi(shuffledOctaveRange[i]);
        console.log(`Note${i + 1}: ${note.toMidi()} AKA ${note.toNote()}`);

        myLoops.push(
          new TapeLoop(`random${i}`).record((t) => {
            synth.triggerAttackRelease(note.toFrequency(), 2.0, t);
          })
        );
      }

      return new TapeLoopEnsemble(myLoops).randomDurations().playRate(1.5);
    },

    randomNotesFromScale(num = 8, scaleName = "C4 minor") {
      let randomNotes = Scales.randomNotesFromScale(num, scaleName);

      // let synth = Synths.polySynth("sawtooth", 0.8, 600);

      let myLoops = [];

      for (let i = 0; i < num; i++) {
        let note = Tone.Midi(randomNotes[i]);
        console.log(`Note${i + 1}: ${note.toMidi()} AKA ${note.toNote()}`);

        let synth = Synths.ambientSynth();
        
        let callback = (t) => {
          synth.triggerAttackRelease(note.toFrequency(), random(0, 2), t);
        }
        
        myLoops.push(
          new TapeLoop(`scale${i}`).record(callback)
        );
      }

      return new TapeLoopEnsemble(myLoops).randomDurations().playRate(1);
    },

    randomEuclideanPattern() {
      let synth = Synths.polySynth();

      let randomLength = random(Numbers.intRange(5, 10));
      let randomNumBeats = random(Numbers.intRange(3, randomLength));
      let randomOffset = random(Numbers.intRange(0, randomLength));

      let sequence = Sequences.generateEuclideanSequence(
        (t, note) => {
          synth.triggerAttackRelease(Tonal.Midi.midiToFreq(65), "16n", t);
        },
        randomLength,
        randomNumBeats,
        randomOffset
      );

      let myLoops = [
        new TapeLoop("pattern").record((t) => {
          sequence.stop(t);
          sequence.start(t);
        }),
      ];

      return new TapeLoopEnsemble(myLoops).randomDurations().playRate(2);
    },

    randomEuclideanPatterns(num = 8, scaleName = "E4 minor pentatonic") {
      let randomNotes = Scales.randomNotesFromScale(num, scaleName);

      let myLoops = [];

      for (let i = 0; i < num; i++) {
        let synth = Synths.polySynth("sine", 0.5, 2000);

        let callback = (t, note) => {
          synth.triggerAttackRelease(randomNotes[i], "16n", t);
        };

        let randomLength = random(Numbers.intRange(5, 10));
        let randomNumBeats = random(Numbers.intRange(3, randomLength));
        let randomOffset = random(Numbers.intRange(0, randomLength));

        let sequence = Sequences.generateEuclideanSequence(
          callback,
          randomLength,
          randomNumBeats,
          randomOffset
        );

        myLoops.push(
          new TapeLoop(`pattern${i}`).record((t) => {
            sequence.stop(t);
            sequence.start(t);
          })
        );
      }

      return new TapeLoopEnsemble(myLoops).shufflePresetDurations();
    },

    loadingScreen() {
      let synth = Synths.polySynth("sine", 0.5, 1500);

      let tapeLoops = [
        new TapeLoop("loop 1").record((t) => {
          synth.triggerAttackRelease("Bb4", 0.5, t);
          synth.triggerAttackRelease("F4", 0.5, t + 0.25);
          synth.triggerAttackRelease("C5", 0.5, t + 0.5);
        }),
        new TapeLoop("loop 2").record((t) => {
          synth.triggerAttackRelease("G4", 0.2, t);
          synth.triggerAttackRelease("G3", 0.2, t + 1);
        }),
        new TapeLoop("loop 3").record((t) => {
          synth.triggerAttackRelease("F2", 0.5, t, 1.5);
          synth.triggerAttackRelease("D2", 0.5, t + 2.5, 3.0);
        }),
        new TapeLoop("loop 4").record((t) => {
          synth.triggerAttackRelease("F4", 0.5, t, 1.5);
          synth.triggerAttackRelease("G4", 0.2, t + 2.5, 3.0);
        }),
        new TapeLoop("loop 5").record((t) => {
          synth.triggerAttackRelease("F5", 0.1, t, 0.5);
          synth.triggerAttackRelease("G5", 0.1, t + 0.75, 1.0);
        }),
        new TapeLoop("loop 6").record((t) => {
          synth.triggerAttackRelease("G4", 0.1, t, 0.5);
          synth.triggerAttackRelease("Bb5", 0.1, t + 0.75, 1.0);
          synth.triggerAttackRelease("A5", 0.1, t + 1.75, 1.0);
        }),
      ];

      return new TapeLoopEnsemble(tapeLoops).shufflePresetDurations()
    },

    tractorBeam() {
      let triangle = Synths.polySynth("sine", 0.1, 1500);
      let square = Synths.polySynth("square", 0.8, 600);

      let scaleDegree = Tonal.Scale.degrees("Eb4 whole tone");

      return new TapeLoopEnsemble([
        new TapeLoop("loop 0").record((t) => {
          triangle.triggerAttackRelease(scaleDegree(-12), 0.1, t, 10.0);
        }),
        new TapeLoop("loop 1").record((t) => {
          triangle.triggerAttackRelease(scaleDegree(3), 0.1, t);
          triangle.triggerAttackRelease(scaleDegree(5), 0.1, t + 0.5);
          triangle.triggerAttackRelease(scaleDegree(1), 0.1, t + 1.0);
        }),
        new TapeLoop("loop 2").record((t) => {
          square.triggerAttackRelease(scaleDegree(4), 0.2, t);
          square.triggerAttackRelease(scaleDegree(5), 0.1, t + 0.5, 1.5);
          square.triggerAttackRelease(scaleDegree(2), 0.2, t + 2.5);
        }),
        new TapeLoop("loop 3").record((t) => {
          square.triggerAttackRelease(scaleDegree(2), 0.2, t);
          square.triggerAttackRelease(scaleDegree(6), 0.1, t + 0.25);
          square.triggerAttackRelease(scaleDegree(7), 0.2, t + 0.75);
          square.triggerAttackRelease(scaleDegree(10), 0.2, t + 3.0);
        }),
      ])
        .shufflePresetDurations()
    },

    simpleSequence() {
      let synth = Synths.ambientSynth("triangle");

      let sequence = Sequences.arpeggio1((time, note) => {
        synth.triggerAttackRelease(note, "4n", time);
      });

      return new TapeLoopEnsemble([
        new TapeLoop("loop 1").record((t) => {
          sequence.stop(t);
          sequence.start(t);
        }),
      ]).shufflePrimeDurations();
    },

    pianoPhase() {
      let synth1 = Synths.makeTonePolySynth("square");
      let synth2 = Synths.makeTonePolySynth("triangle");

      let seq1 = Sequences.pianoPhase((time, note) => {
        synth1.triggerAttackRelease(note, "16n", time);
      });

      let seq2 = Sequences.pianoPhase((time, note) => {
        synth2.triggerAttackRelease(note, "16n", time);
      });

      return new TapeLoopEnsemble([
        new TapeLoop("phase1", 2).record((t) => {
          seq1.stop(t);
          seq1.start(t);
        }),
        new TapeLoop("phase2", 2 * seq1.playbackRate).record((t) => {
          seq2.stop(t);
          seq2.start(t);
        }),
      ]);
    },
  },
};
