const Numbers = {
  firstNPrimes(n) {
    const primes = [2];
    let candidate = 3;

    while (primes.length < n) {
      let isPrime = true;
      for (let prime of primes) {
        if (candidate % prime === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(candidate);
      candidate += 2; // skip even numbers
    }

    return primes.slice(0, n);
  },

  euclideanPattern(length, numBeats, offset = 0) {
    let pattern = new Array(length).fill(false);

    for (let i = 0; i < numBeats; i++) {
      let index = Math.floor((i * length) / numBeats);
      pattern[index] = true;
    }

    if (offset !== 0) {
      pattern = pattern.slice(offset).concat(pattern.slice(0, offset));
    }

    return pattern;
  },

  intRange(start, end) {
    return Array.from({ length: end - start }, (_, i) => i + start);
  },

  presetMillisecondPrimes() {
    return [
      8300,
      8900,
      9700,
      10100,
      10300,
      10700,
      10900,
      11300,
      12700,
      13100,
      13700,
      13900,
    ];
  },
};
