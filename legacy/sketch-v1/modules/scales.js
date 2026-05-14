const Scales = {
  fromScaleDegree(scaleName, degree) {
    let currentScale = Tonal.Scale.degrees(scaleName);
    return currentScale(degree);
  },

  wholeToneScale(tonic) {
    return Tonal.Scale.degrees(tonic + " whole tone");
  },

  randomNotesFromScale(num, scale) {
    let range = Tonal.Range.numeric([0 - num / 2, num / 2]);
    let notes = range.map(Tonal.Scale.steps(scale));
    return shuffle(notes);
  },
};
