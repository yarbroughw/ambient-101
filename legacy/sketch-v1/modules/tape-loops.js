class TapeLoop {
  constructor(label, duration = 5) {
    this.x = 0;
    this.y = 0;
    this.radius = 25;

    this.label = label;
    this.duration = duration;

    this.recording = null;
    this.toneLoop = null;

    this.isRunning = false;
    this.startedAt = 0;
  }

  setXY(x, y) {
    this.x = x;
    this.y = y;
  }

  setDuration(duration) {
    this.duration = duration;
    this.record(this.recording); // "re-record" w/ new duration
  }

  record(content) {
    this.recording = content;
    this.toneLoop = new Tone.Loop(content, this.duration);
    this.toneLoop.loop = false;
    return this;
  }

  start() {
    if (this.isRunning) return;

    if (!this.toneLoop) {
      console.warn("No content recorded! Use .record(...) first.");
      return;
    }

    // this.recording(Tone.now()); // initial play, before looping

    this.toneLoop.start(Tone.now());
    this.isRunning = true;
    this.startedAt = millis();

    console.log(`TapeLoop "${this.label}" started.`);

    this.stopButton.removeAttribute("disabled");
    this.startButton.attribute("disabled", true);
  }

  stop() {
    if (this.isRunning) {
      this.toneLoop.stop();
      console.log(`TapeLoop "${this.label}" stopped.`);
    }
    this.isRunning = false;

    this.startButton.removeAttribute("disabled");
    this.stopButton.attribute("disabled", true);

    return this;
  }

  test() {
    if (!this.recording) {
      console.warn("No content recorded! Use .record(...) first.");
      return;
    }
    this.recording(Tone.now());
  }

  createButtons() {
    let buttonSize = 23;
    let buttonSpacing = 25;
    let startX = this.x - this.radius - buttonSize / 4 - 7;
    let buttonY = this.y + 60;

    this.startButton = createButton("▶");
    this.startButton.position(startX, buttonY);
    this.startButton.size(buttonSize, buttonSize);
    this.startButton.class("tape-loop-btn tape-loop-start");
    this.startButton.mousePressed(() => this.start());

    this.stopButton = createButton("◼︎");
    this.stopButton.position(startX + buttonSpacing, buttonY);
    this.stopButton.size(buttonSize, buttonSize);
    this.stopButton.class("tape-loop-btn tape-loop-stop");
    this.stopButton.attribute("disabled", true);
    this.stopButton.mousePressed(() => this.stop());

    this.testButton = createButton("↺");
    this.testButton.position(startX + buttonSpacing * 2, buttonY);
    this.testButton.size(buttonSize, buttonSize);
    this.testButton.class("tape-loop-btn tape-loop-test");
    this.testButton.mousePressed(() => this.test());
  }

  draw() {
    push();
    translate(this.x, this.y);

    // Draw border around entire loop area
    fill(Colors.LOOP_BG);
    stroke(Colors.OUTLINE);
    strokeWeight(1);
    let borderWidth = 100;
    let borderHeight = 140;
    rect(-borderWidth / 2, -this.radius - 20, borderWidth, borderHeight);

    // draw circle and notch
    noFill();
    let circleColor = color(Colors.OUTLINE); 
    circleColor.setAlpha(this.isRunning ? 255 : 100);
    stroke(circleColor);
    strokeWeight(2);
    circle(0, 20, this.radius * 2);
    line(0, -this.radius + 15, 0, -this.radius + 26);

    // draw label
    textFont("monospace");
    textSize(10);
    noStroke();
    fill(Colors.LABELS);
    textAlign(CENTER);
    text(`${this.label}`, 0, this.radius - 50);
    
    // draw duration label (number of seconds)
    let secondsColor = color(Colors.OUTLINE); 
    secondsColor.setAlpha(this.isRunning ? 255 : 150);
    fill(secondsColor);
    textSize(8);
    text(`${this.duration.toFixed(1)}s`, 0, this.radius-1);

    if (this.isRunning) {
      let elapsed = (millis() - this.startedAt) / 1000;
      let progress = (elapsed % this.duration) / this.duration;
      let angle = map(progress, 0, 1, 0, TWO_PI);

      // Flash effect when crossing 12 o'clock
      if (progress < 0.05) {
        this.flashAmount = 1.0;
      }

      if (this.flashAmount > 0) {
        this.flashAmount *= 0.98;
        if (this.flashAmount < 0.01) this.flashAmount = 0;

        for (let i = 10; i >= 1; i--) {
          let flashColor = color(Colors.ACTIVE);
          flashColor.setAlpha((this.flashAmount * 50) / i);
          stroke(flashColor);
          noFill();
          strokeWeight(i * 3);
          circle(0, 20, this.radius * 2);
          line(0, -this.radius + 15, 0, -this.radius + 26);
        }
      }

      // draw progress dot
      let x = cos(angle - PI / 2) * this.radius;
      let y = sin(angle - PI / 2) * this.radius + 23;
      fill(Colors.ACTIVE);
      
      noStroke();
      circle(x, y-3, 8);
    }

    pop();
  }
}

class TapeLoopEnsemble {
  constructor(tapeLoops) {
    this.tapeLoops = tapeLoops;

    let startX = 60;
    let startY = 100;
    let loopWidth = 100;
    let rowHeight = 150;
    let margin = 10;

    let currentX = startX;
    let currentY = startY;

    this.tapeLoops.forEach((loop, index) => {
      if (currentX + loopWidth > width) {
        currentX = startX;
        currentY += rowHeight;
      }

      loop.setXY(currentX, currentY);
      currentX += loopWidth + margin;
    });

    this.tapeLoops.forEach((loop) => loop.createButtons());
  }

  shufflePrimeDurations() {
    let primes = shuffle(Numbers.firstNPrimes(this.tapeLoops.length));

    this.tapeLoops.forEach((loop, index) => {
      loop.setDuration(primes[index]);
    });

    return this;
  }

  shufflePresetDurations() {
    let millisecondDurations = shuffle(Numbers.presetMillisecondPrimes());

    this.tapeLoops.forEach((loop, index) => {
      loop.setDuration(millisecondDurations[index] / 1000);
    });

    return this;
  }

  randomDurations() {
    this.tapeLoops.forEach((loop, index) => {
      let durationMs = random(5000, 15000);
      loop.setDuration(durationMs / 1000);
    });

    return this;
  }

  playRate(newRate) {
    this.tapeLoops.forEach(
      (loop) => loop.setDuration(loop.duration / newRate)
    );
    return this;
  }

  startAll() {
    this.tapeLoops.forEach((loop) => loop.start());
  }

  stopAll() {
    this.tapeLoops.forEach((loop) => loop.stop());
  }

  draw() {
    this.tapeLoops.forEach((loop) => loop.draw());
  }
}
