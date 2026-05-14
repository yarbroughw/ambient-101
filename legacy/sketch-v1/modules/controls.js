const Controls = {
  keyPressed() {
    if (key === " ") {
      let anyRunning = ensemble.tapeLoops.some((loop) => loop.isRunning);

      if (anyRunning) {
        ensemble.stopAll();
      } else {
        ensemble.startAll();
      }

      return false;
    }
  },

  updateGlobalButtons() {
    if (!ensemble) {
      startEnsembleButton.setAttribute("disabled", true);
      stopEnsembleButton.setAttribute("disabled", true);

      return;
    }

    // the "play all" and "stop all" buttons are dynamically
    // enabled/disabled based on whether none, some, or all of
    // the tape loops are running.
    let allLoopsRunning = ensemble.tapeLoops.every((tl) => tl.isRunning);
    let someLoopsRunning = ensemble.tapeLoops.some((tl) => tl.isRunning);

    if (allLoopsRunning) {
      startEnsembleButton.setAttribute("disabled", true);
      stopEnsembleButton.removeAttribute("disabled");
    } else if (someLoopsRunning) {
      startEnsembleButton.removeAttribute("disabled");
      stopEnsembleButton.removeAttribute("disabled");
    } else {
      startEnsembleButton.removeAttribute("disabled");
      stopEnsembleButton.setAttribute("disabled", true);
    }
  },
};

function keyPressed() {
  Controls.keyPressed();
}
