const Synths = {
  polySynth(
    envelope,
    waveform = "sawtooth",
    reverbWet = 1,
    filterCutoff = 2000
  ) {
    const reverb = new Tone.Reverb({
      decay: 6.0,
      preDelay: 0.03,
      wet: reverbWet,
    }).toDestination();
    let synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: {
        type: waveform,
      },
      envelope: envelope,
      volume: -12,
    });
    let filter = new Tone.Filter({
      frequency: filterCutoff,
      type: "lowpass",
      rolloff: -12,
    });
    let gain = new Tone.Gain(0.1);
    synth.connect(filter);
    filter.connect(gain);
    gain.connect(reverb);
    return synth;
  },

  ambientSynth() {
    const pad = new Tone.PolySynth();
    pad.set({
      oscillator: {
        type: "fatsawtooth",
      },
      envelope: {
        attack: 2.5,
        decay: 3.0,
        sustain: 0.8,
        release: 12.0,
      },
      volume: -10,
    });

    const preFilter = new Tone.Filter(6000, "lowpass");
    const preEQ = new Tone.EQ3({
      low: 3,
      mid: -1,
      high: 2,
    });

    const compression = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.3,
      release: 0.8,
    });

    const hallReverb = new Tone.Reverb({
      decay: 15.0,
      preDelay: 0.1,
      wet: 0.7,
    });

    const plateReverb = new Tone.Reverb({
      decay: 8.0,
      preDelay: 0.05,
      wet: 0.3,
    });

    const chorus = new Tone.Chorus({
      frequency: 0.3,
      delayTime: 8,
      depth: 0.9,
    }).start();

    const distortion = new Tone.Distortion(0.15);

    const delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: 0.4,
      wet: 0.2,
    });

    const postEQ = new Tone.EQ3({
      low: 1,
      mid: -2,
      high: 3,
    });

    const widener = new Tone.StereoWidener(0.8);

    pad.chain(
      preFilter,
      preEQ,
      compression,
      distortion,
      hallReverb,
      plateReverb,
      chorus,
      delay,
      widener,
      postEQ,
      Tone.Destination
    );

    return pad;
  },

  massiveAmbientSynth() {
    const layer1 = new Tone.PolySynth();
    const layer2 = new Tone.PolySynth();
    const layer3 = new Tone.PolySynth();

    layer1.set({
      oscillator: { type: "fatsawtooth" },
      envelope: { attack: 3.0, decay: 2.0, sustain: 0.9, release: 15.0 },
      volume: -10,
    });

    layer2.set({
      oscillator: { type: "fatcustom", partials: [1, 0.5, 0.25, 0.125] },
      envelope: { attack: 4.0, decay: 1.5, sustain: 0.7, release: 12.0 },
      volume: -14,
    });

    layer3.set({
      oscillator: { type: "sine" },
      envelope: { attack: 5.0, decay: 3.0, sustain: 0.6, release: 18.0 },
      volume: -16,
    });

    const reverb = new Tone.Reverb({
      decay: 20.0,
      preDelay: 0.15,
      wet: 0.8,
    });

    const chorus = new Tone.Chorus(0.2, 12, 0.95).start();
    const delay = new Tone.PingPongDelay("4n", 0.3);
    const filter = new Tone.Filter(8000, "lowpass");
    const compressor = new Tone.Compressor(-18, 6);

    const mixer = new Tone.Gain(0.3);

    layer1.connect(mixer);
    layer2.connect(mixer);
    layer3.connect(mixer);

    mixer.chain(filter, compressor, chorus, reverb, delay, Tone.Destination);

    return {
      triggerAttackRelease: (frequency, duration, time, velocity = 1) => {
        layer1.triggerAttackRelease(frequency, duration, time, velocity);
        layer2.triggerAttackRelease(
          frequency * 2,
          duration,
          time + 0.1,
          velocity * 0.6
        );
        layer3.triggerAttackRelease(
          frequency * 0.5,
          duration,
          time + 0.2,
          velocity * 0.4
        );
      },
    };
  },
};
