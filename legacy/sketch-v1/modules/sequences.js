const Sequences = {
  arpeggio1(callback) {
    let seq = new Tone.Sequence(callback, ["C4", "E4", "G4", "B4"], "4n");

    seq.loop = false;
    return seq;
  },

  generateEuclideanSequence(callback, length, numBeats, offset = 0) {
    let pattern = Numbers.euclideanPattern(length, numBeats, offset);
    
    let sequencePattern = pattern.map((beat) => (beat ? 0 : null));
    // sequencePattern will look like [true, null, true, null, null, true, null...]
    
    let sequence = new Tone.Sequence(
      (time, note) => { if (note !== null) callback(time, note) },
      sequencePattern,
      "8n"
    );
    sequence.loop = false;
    
    return sequence;
  },
  
  generateEuclideanArpeggio(notes, callback, noteLength, patternLength, numBeats, offset = 0) {
    console.log(notes);
    let pattern = Numbers.euclideanPattern(patternLength, numBeats, offset);
    
    console.log(pattern)
    
    let notePattern = [];
    let noteIndex = 0;
    
    pattern.forEach((beat, i) => {
      let note = null;
      if (beat) {
        note = notes[noteIndex];
        noteIndex = noteIndex + 1;
      }
      notePattern.push(note)
    });
    
    console.log(notePattern)
    
    let sequence = new Tone.Sequence(
      (time, note) => { if (note !== null) callback(time, note) },
      notePattern,
      noteLength,
    );
    sequence.loop = false;
    
    return sequence;
  },

  pianoPhase(callback) {
    let seq = new Tone.Sequence(
      callback,
      [
        "E3",
        "F#3",
        "B3",
        "C#4",
        "D4",
        "F#3",
        "E3",
        "C#4",
        "B3",
        "F#3",
        "D4",
        "C#4",
        "4n",
      ],
      "16n"
    );

    seq.loop = false;
    return seq;
  },
};
