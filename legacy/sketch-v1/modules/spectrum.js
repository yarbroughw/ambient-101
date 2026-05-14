let analyser;
let spectrumCanvas;
let spectrumCtx;
let smoothBuffer;

function setupSpectrum() {
  analyser = new Tone.Analyser("fft", 4096);
  Tone.getDestination().connect(analyser);

  spectrumCanvas = document.getElementById("spectrum-canvas");
  spectrumCtx = spectrumCanvas.getContext("2d");

  // Make it more horizontal for the header layout
  spectrumCanvas.width = 300;
  spectrumCanvas.height = 30;
}

function drawSpectrum() {
  let frequencyData = analyser.getValue();

  spectrumCtx.fillStyle = "#c8cdd2";
  spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
  
  let spectrumColor = color(Colors.SPECTRUM);
  spectrumColor.setAlpha(100);
  spectrumCtx.fillStyle = spectrumColor;

  spectrumCtx.beginPath();
  spectrumCtx.moveTo(0, spectrumCanvas.height);

  let sampleRate = 44100;
  let maxFreq = 6000;
  let minFreq = 20;

  if (!smoothBuffer) {
    smoothBuffer = new Array(spectrumCanvas.width).fill(0);
  }

  for (let x = 0; x < spectrumCanvas.width; x++) {
    let logPos = x / (spectrumCanvas.width - 1);
    let frequency = minFreq * Math.pow(maxFreq / minFreq, logPos);

    let exactBin = (frequency / (sampleRate / 2)) * frequencyData.length;
    let lowerBin = Math.floor(exactBin);
    let upperBin = Math.min(lowerBin + 1, frequencyData.length - 1);
    let fraction = exactBin - lowerBin;

    let lowerValue = Math.max(frequencyData[lowerBin], -120);
    let upperValue = Math.max(frequencyData[upperBin], -120);
    let dbValue = lowerValue + (upperValue - lowerValue) * fraction;

    let normalizedValue = (dbValue + 120) / 120;
    let scaledValue = Math.pow(normalizedValue, 0.5);
    let currentHeight = scaledValue * spectrumCanvas.height;

    smoothBuffer[x] = smoothBuffer[x] * 0.7 + currentHeight * 0.3;

    let height = smoothBuffer[x];
    let y = spectrumCanvas.height - height;

    spectrumCtx.lineTo(x, y);
  }

  spectrumCtx.lineTo(spectrumCanvas.width, spectrumCanvas.height);
  spectrumCtx.closePath();

  spectrumCtx.fill();
}
