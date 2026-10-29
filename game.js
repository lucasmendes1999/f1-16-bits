/* ==========================================================================
   RETRO CHIPTUNE SOUND ENGINE (Top Gear SNES Style)
   ========================================================================== */
class RetroSoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.tempo = 144;
    this.isPlaying = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;

    this.engineOsc = null;
    this.engineGain = null;

    this.notes = {
      'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'Bb3': 233.08,
      'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'F4': 349.23, 'G4': 392.00, 'Ab4': 415.30, 'Bb4': 466.16,
      'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'F5': 698.46, 'G5': 783.99, 'Ab5': 830.61, 'Bb5': 932.33,
      '--': 0
    };

    this.bass = [
      'C3','C3','Eb3','F3', 'G3','G3','Bb3','C4', 'C3','C3','Eb3','F3', 'Bb3','G3','F3','Eb3',
      'Ab3','Ab3','C4','Eb4', 'Bb3','Bb3','D4','F4', 'C3','C3','Eb3','F3', 'G3','Bb3','C4','D4',
      'C3','C3','Eb3','F3', 'G3','G3','Bb3','C4', 'C3','C3','Eb3','F3', 'Bb3','G3','F3','Eb3',
      'F3','F3','Ab3','C4', 'G3','G3','Bb3','D4', 'C3','C3','C3','C3', 'Eb3','F3','G3','Bb3'
    ];

    this.lead = [
      '--','--','C5','D5', 'Eb5','D5','C5','Bb4', 'C5','--','G4','--', 'Bb4','C5','--','--',
      'Ab4','--','C5','--', 'Bb4','--','D5','--', 'C5','D5','Eb5','F5', 'G5','--','--','--',
      'Eb5','--','D5','--', 'C5','Bb4','C5','--', 'G4','--','Bb4','--', 'C5','--','--','--',
      'F4','--','Ab4','--', 'G4','--','Bb4','--', 'C5','--','Eb5','--', 'D5','Bb4','C5','--'
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupEngine();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(isGo = false) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isGo ? 'sine' : 'square';
    osc.frequency.setValueAtTime(isGo ? 940 : 440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.35 : 0.16));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + (isGo ? 0.36 : 0.18));
  }

  setupEngine() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
  }

  updateEngine(speedRatio) {
    if (!this.ctx || this.isMuted || !this.engineOsc) return;
    const base = 95;
    const gear = Math.min(6, 1 + Math.floor(Math.max(0, speedRatio) * 6));
    const gearRpm = Math.max(0, Math.min(1, speedRatio * 6 - (gear - 1)));
    const targetFreq = base + gearRpm * 220 + gear * 16;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    this.engineGain.gain.setTargetAtTime(0.06 + speedRatio * 0.08, this.ctx.currentTime, 0.05);
  }

  playBump() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playKerb() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playLap() {
    if (!this.ctx || this.isMuted) return;
    [523, 659, 784, 1046].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.09);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.09 + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.09);
      osc.stop(this.ctx.currentTime + i * 0.09 + 0.15);
    });
  }

  startMusic() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.schedule();
  }

  schedule() {
    if (!this.isPlaying) return;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += (60 / this.tempo) / 4;
      this.step = (this.step + 1) % this.bass.length;
    }
    this.timer = setTimeout(() => this.schedule(), 25);
  }

  playStep(step, time) {
    if (this.isMuted || !this.ctx) return;
    const b = this.bass[step];
    if (b && b !== '--') {
      this.synth(this.notes[b], time, 0.14, 'square', 0.14, 550);
    }
    const l = this.lead[step];
    if (l && l !== '--') {
      this.synth(this.notes[l], time, 0.22, 'sawtooth', 0.12, 1750);
    }
    if (step % 4 === 0) {
      this.kick(time);
    } else if (step % 8 === 4) {
      this.snare(time);
    }
  }

  synth(freq, time, dur, type, vol, filterFreq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + dur);
  }

  kick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.09);
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  snare(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  pauseEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    }
  }
}

/* ==========================================================================
   CIRCUITOS TOP-DOWN DE FORMULA 1 (Sentido Horário, Curvas Suaves e Reta Limpa)
   ========================================================================== */
class TopDownTrack {
  constructor(type = 'interlagos') {
    this.type = type;
    this.width = 260; // Pista larga e confortável para tangentes perfeitas
    this.runoffWidth = 55; // Gravel extends to the visible grass boundary.
    this.points = [];
    this.totalLength = 0;
    this.distances = [];
    this.name = 'INTERLAGOS GP';
    this.build();
    this.buildGrandstands();
  }

  buildGrandstands() {
    this.grandstands = [];
    const offset = this.width / 2 + 180;
    // Sparse sections of seating, with a different distribution on each circuit.
    const seed = [...this.type].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
    const clearOfRoad = (x, y) => this.points.every((point, index) => {
      const next = this.points[(index + 1) % this.points.length];
      const dx = next.x - point.x, dy = next.y - point.y;
      const t = Math.max(0, Math.min(1, ((x - point.x) * dx + (y - point.y) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(x - point.x - dx * t, y - point.y - dy * t) > this.width / 2 + 80;
    });
    for (let section = 0; section < 7; section++) {
      const point = this.getPointAtDistance(this.totalLength * ((section / 7 + (seed % 9) / 100) % 1));
      for (const side of [-1, 1]) {
        const x = point.x + point.nx * offset * side;
        const y = point.y + point.ny * offset * side;
        const angle = point.angle + (side === -1 ? Math.PI : 0);
        const cos = Math.cos(angle), sin = Math.sin(angle);
        let safe = true;
        // Check the whole footprint, including neighboring stretches of track.
        for (let sx = -200; sx <= 200 && safe; sx += 40) {
          for (let sy = -70; sy <= 70; sy += 35) {
            const wx = x + sx * cos - sy * sin, wy = y + sx * sin + sy * cos;
            if (!clearOfRoad(wx, wy) || (wx > -2050 && wx < 1150 && wy > -1040 && wy < -910)) {
              safe = false;
              break;
            }
          }
        }
        if (!safe || this.grandstands.some(stand => Math.hypot(stand.x - x, stand.y - y) < 460)) continue;
        this.grandstands.push({ x, y, angle, seed: seed + section * 17 });
        break;
      }
    }
  }

  renderGrandstands(ctx, camera) {
    const colors = ['#ee3454', '#ffda55', '#e4edf4', '#18bdcc', '#6485f6', '#f39253'];
    for (const stand of this.grandstands) {
      if (Math.abs(stand.x - camera.x) > camera.width / (2 * camera.zoom) + 240 ||
          Math.abs(stand.y - camera.y) > camera.height / (2 * camera.zoom) + 240) continue;
      ctx.save();
      ctx.translate(stand.x, stand.y);
      ctx.rotate(stand.angle);
      ctx.fillStyle = '#00000055';
      ctx.fillRect(-188, -48, 388, 116);
      ctx.fillStyle = '#1b2531';
      ctx.fillRect(-196, -64, 392, 128);
      for (let row = 0; row < 5; row++) {
        const y = -48 + row * 21;
        ctx.fillStyle = row % 2 ? '#59687a' : '#465569';
        ctx.fillRect(-184, y, 368, 17);
        for (let seat = 0; seat < 25; seat++) {
          if (seat === 8 || seat === 17) continue; // Access stairs.
          const code = stand.seed + row * 31 + seat * 13;
          const x = -177 + seat * 14;
          ctx.fillStyle = colors[code % colors.length];
          ctx.fillRect(x, y + 6, 8, 7);
          ctx.fillStyle = code % 3 === 0 ? '#ad795b' : '#e2b58e';
          ctx.fillRect(x + 2, y + 2, 5, 5);
        }
      }
      // Front rail faces the circuit; rear canopy and supports frame the crowd.
      ctx.fillStyle = '#a1b3c0';
      ctx.fillRect(-196, -66, 392, 5);
      ctx.fillStyle = '#d7e1e8';
      for (let x = -190; x <= 190; x += 38) ctx.fillRect(x, -64, 3, 13);
      ctx.fillStyle = '#b51f3c';
      ctx.fillRect(-202, 56, 404, 14);
      ctx.fillStyle = '#f13856';
      ctx.fillRect(-202, 52, 404, 5);
      ctx.fillStyle = '#e7edf1';
      ctx.fillRect(-196, -60, 4, 116);
      ctx.fillRect(192, -60, 4, 116);
      ctx.restore();
    }
  }

  build() {
    let rawPoints = [];
    const pitY = -800;

    if (this.type === 'monza') {
      this.name = 'MONZA GP';
      rawPoints = [
        { x: -1800, y: pitY },
        { x: -900,  y: pitY },
        { x: 100,   y: pitY },
        { x: 1100,  y: pitY },
        { x: 1700,  y: -750 },
        { x: 2200,  y: -500 },
        { x: 2550,  y: -100 },
        { x: 2550,  y: 350 },
        { x: 2200,  y: 650 },
        { x: 1500,  y: 750 },
        { x: 800,   y: 750 },
        { x: 0,     y: 850 },
        { x: -800,  y: 850 },
        { x: -1500, y: 700 },
        { x: -2100, y: 480 },
        { x: -2550, y: 150 },
        { x: -2650, y: -250 },
        { x: -2400, y: -650 },
        { x: -2150, y: pitY }
      ];
    } else if (this.type === 'silverstone') {
      this.name = 'SILVERSTONE GP';
      rawPoints = [
        { x: -1800, y: pitY },
        { x: -900,  y: pitY },
        { x: 100,   y: pitY },
        { x: 1100,  y: pitY },
        { x: 1750,  y: -600 },
        { x: 2200,  y: -250 },
        { x: 2050,  y: 200 },
        { x: 1450,  y: 480 },
        { x: 750,   y: 700 },
        { x: 50,    y: 850 },
        { x: -650,  y: 850 },
        { x: -1300, y: 650 },
        { x: -1750, y: 750 },
        { x: -2250, y: 450 },
        { x: -2550, y: 0 },
        { x: -2550, y: -450 },
        { x: -2200, y: pitY }
      ];
    } else if (this.type === 'spa') {
      this.name = 'SPA-FRANCORCHAMPS GP';
      rawPoints = [
        { x: -1800, y: pitY },
        { x: -900,  y: pitY },
        { x: 100,   y: pitY },
        { x: 1050,  y: pitY },
        { x: 1700,  y: -600 },
        { x: 2250,  y: -200 },
        { x: 2550,  y: 300 },
        { x: 2300,  y: 800 },
        { x: 1600,  y: 1000 },
        { x: 800,   y: 900 },
        { x: -100,  y: 1050 },
        { x: -850,  y: 950 },
        { x: -1550, y: 650 },
        { x: -2250, y: 300 },
        { x: -2550, y: -150 },
        { x: -2450, y: -600 },
        { x: -2150, y: pitY }
      ];
    } else if (this.type === 'suzuka') {
      this.name = 'SUZUKA GP';
      rawPoints = [
        { x: -1800, y: pitY },
        { x: -900,  y: pitY },
        { x: 100,   y: pitY },
        { x: 1050,  y: pitY },
        { x: 1700,  y: -600 },
        { x: 2200,  y: -350 },
        { x: 2400,  y: 50 },
        { x: 2150,  y: 380 },
        { x: 2450,  y: 650 },
        { x: 1950,  y: 900 },
        { x: 1200,  y: 800 },
        { x: 400,   y: 1000 },
        { x: -400,  y: 880 },
        { x: -1200, y: 1050 },
        { x: -1950, y: 750 },
        { x: -2480, y: 250 },
        { x: -2550, y: -250 },
        { x: -2350, y: -620 },
        { x: -2150, y: pitY }
      ];
    } else if (this.type === 'monaco') {
      this.name = 'MÔNACO GP';
      rawPoints = [
        { x: -1800, y: pitY },
        { x: -900,  y: pitY },
        { x: 100,   y: pitY },
        { x: 950,   y: pitY },
        { x: 1600,  y: -620 },
        { x: 2000,  y: -300 },
        { x: 2300,  y: 30 },
        { x: 2050,  y: 380 },
        { x: 2250,  y: 650 },
        { x: 1750,  y: 800 },
        { x: 1050,  y: 950 },
        { x: 200,   y: 1000 },
        { x: -600,  y: 850 },
        { x: -1350, y: 700 },
        { x: -1950, y: 580 },
        { x: -2450, y: 220 },
        { x: -2520, y: -220 },
        { x: -2300, y: -620 },
        { x: -2100, y: pitY }
      ];
    } else {
      this.name = 'INTERLAGOS GP';
      rawPoints = [
        { x: -1800, y: pitY },
        { x: -900,  y: pitY },
        { x: 100,   y: pitY },
        { x: 1050,  y: pitY },
        { x: 1700,  y: -580 },
        { x: 2100,  y: -300 },
        { x: 2350,  y: 80 },
        { x: 2050,  y: 600 },
        { x: 1250,  y: 900 },
        { x: 400,   y: 1000 },
        { x: -500,  y: 820 },
        { x: -1250, y: 1000 },
        { x: -1800, y: 720 },
        { x: -2350, y: 350 },
        { x: -2580, y: -120 },
        { x: -2400, y: -580 },
        { x: -2150, y: pitY }
      ];
    }

    // Interpolação Catmull-Rom de alta densidade (48 passos por segmento)

    this.points = [];
    const numRaw = rawPoints.length;
    const stepsPerSeg = 48;

    for (let i = 0; i < numRaw; i++) {
      const p0 = rawPoints[(i - 1 + numRaw) % numRaw];
      const p1 = rawPoints[i];
      const p2 = rawPoints[(i + 1) % numRaw];
      const p3 = rawPoints[(i + 2) % numRaw];

      for (let step = 0; step < stepsPerSeg; step++) {
        const t = step / stepsPerSeg;
        const x = this.catmullRom(p0.x, p1.x, p2.x, p3.x, t);
        const y = this.catmullRom(p0.y, p1.y, p2.y, p3.y, t);
        this.points.push({ x, y });
      }
    }

    // Pré-calcula distâncias acumuladas e normais
    this.totalLength = 0;
    this.distances = [0];
    const count = this.points.length;

    for (let i = 0; i < count; i++) {
      const next = this.points[(i + 1) % count];
      const dx = next.x - this.points[i].x;
      const dy = next.y - this.points[i].y;
      const segDist = Math.hypot(dx, dy);
      this.totalLength += segDist;
      this.distances.push(this.totalLength);

      const len = segDist || 1;
      this.points[i].nx = -dy / len;
      this.points[i].ny = dx / len;
      this.points[i].angle = Math.atan2(dy, dx);
    }
  }

  catmullRom(p0, p1, p2, p3, t) {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t * t2;
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
           (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
           v0 * t + p1;
  }

  getPointAtDistance(d) {
    let dist = ((d % this.totalLength) + this.totalLength) % this.totalLength;
    let low = 0, high = this.distances.length - 1;
    while (low <= high) {
      let mid = (low + high) >> 1;
      if (this.distances[mid] <= dist) low = mid + 1;
      else high = mid - 1;
    }
    const idx = Math.max(0, high);
    const p1 = this.points[idx % this.points.length];
    const p2 = this.points[(idx + 1) % this.points.length];
    const segDist = (this.distances[idx + 1] || this.totalLength) - this.distances[idx];
    const t = segDist > 0 ? (dist - this.distances[idx]) / segDist : 0;

    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
      angle: p1.angle,
      nx: p1.nx,
      ny: p1.ny
    };
  }

  getTrackPosition(dist, lateralOffset = 0) {
    const pt = this.getPointAtDistance(dist);
    return {
      x: pt.x + pt.nx * lateralOffset,
      y: pt.y + pt.ny * lateralOffset,
      angle: pt.angle
    };
  }

  render(ctx, camera) {
    ctx.save();
    ctx.translate(camera.width / 2, camera.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const count = this.points.length;
    const halfW = this.width / 2;
    const curbW = 24;

    // Gramado xadrez
    const gridSize = 220;
    const minX = -3600, maxX = 3600, minY = -2600, maxY = 2600;
    for (let gx = minX; gx < maxX; gx += gridSize) {
      for (let gy = minY; gy < maxY; gy += gridSize) {
        ctx.fillStyle = ((gx / gridSize + gy / gridSize) % 2 === 0) ? '#0a3d18' : '#0d4a1e';
        ctx.fillRect(gx, gy, gridSize, gridSize);
      }
    }

    this.renderGrandstands(ctx, camera);

    // Brita
    ctx.strokeStyle = '#c99a4e';
    ctx.lineWidth = this.width + this.runoffWidth * 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const pt = this.points[i % count];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Zebras Bicolores em Relevo 3D
    for (let i = 0; i < count; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % count];
      const isRed = (Math.floor(i / 2) % 2 === 0);
      ctx.fillStyle = isRed ? '#e60000' : '#f4f4f4';

      // Zebra Externa
      ctx.beginPath();
      ctx.moveTo(p1.x - p1.nx * halfW, p1.y - p1.ny * halfW);
      ctx.lineTo(p1.x - p1.nx * (halfW + curbW), p1.y - p1.ny * (halfW + curbW));
      ctx.lineTo(p2.x - p2.nx * (halfW + curbW), p2.y - p2.ny * (halfW + curbW));
      ctx.lineTo(p2.x - p2.nx * halfW, p2.y - p2.ny * halfW);
      ctx.closePath();
      ctx.fill();

      // Zebra Interna
      ctx.beginPath();
      ctx.moveTo(p1.x + p1.nx * halfW, p1.y + p1.ny * halfW);
      ctx.lineTo(p1.x + p1.nx * (halfW + curbW), p1.y + p1.ny * (halfW + curbW));
      ctx.lineTo(p2.x + p2.nx * (halfW + curbW), p2.y + p2.ny * (halfW + curbW));
      ctx.lineTo(p2.x + p2.nx * halfW, p2.y + p2.ny * halfW);
      ctx.closePath();
      ctx.fill();
    }

    // Borda de borracha
    ctx.strokeStyle = '#18171c';
    ctx.lineWidth = this.width + 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const pt = this.points[i % count];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Asfalto Principal
    ctx.strokeStyle = '#232228';
    ctx.lineWidth = this.width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const pt = this.points[i % count];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Racing line emborrachada
    ctx.strokeStyle = 'rgba(12, 10, 16, 0.45)';
    ctx.lineWidth = 42;
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const pt = this.points[i % count];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Faixas Centrais
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 5;
    ctx.setLineDash([28, 32]);
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const pt = this.points[i % count];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Pit Wall com Patrocinadores
    const pitY = -800;
    const pitWallY = pitY - halfW - 46;
    const pitStartX = -2000;
    const pitEndX = 1100;

    ctx.fillStyle = '#1c1b22';
    ctx.fillRect(pitStartX, pitWallY, pitEndX - pitStartX, 34);
    ctx.strokeStyle = '#ff0044';
    ctx.lineWidth = 3;
    ctx.strokeRect(pitStartX, pitWallY, pitEndX - pitStartX, 34);

    const sponsors = ['SHELL', 'PIRELLI', 'AGIP', 'GEAR F1', 'MAGNETI MARELLI', 'TAG HEUER', 'SEGA', 'BOSS'];
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let spIdx = 0;
    for (let sx = pitStartX + 90; sx < pitEndX - 60; sx += 180) {
      ctx.fillStyle = (spIdx % 2 === 0) ? '#ffd000' : '#00ffff';
      ctx.fillText(sponsors[spIdx % sponsors.length], sx, pitWallY + 17);
      spIdx++;
    }

    // Linha de Chegada Quadriculada
    const finishX = 0;
    const finishY = pitY;
    const cellS = 15;
    for (let row = -halfW; row < halfW; row += cellS) {
      for (let col = -cellS * 2; col <= cellS * 2; col += cellS) {
        const isWhite = ((Math.floor(row / cellS) + Math.floor(col / cellS)) % 2 === 0);
        ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
        ctx.fillRect(finishX + col, finishY + row, cellS, cellS);
      }
    }

    // Placas de 100m e 50m
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1050, finishY - halfW - 35, 45, 20);
    ctx.fillRect(1200, finishY - halfW - 35, 45, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('100m', 1072, finishY - halfW - 25);
    ctx.fillText('50m',  1222, finishY - halfW - 25);

    // Boxes do Grid de Largada
    for (let g = 1; g <= 12; g++) {
      const boxX = finishX - g * 115;
      const boxOffset = (g % 2 === 1) ? -45 : 45;
      const boxY = finishY + boxOffset;

      ctx.strokeStyle = '#ffd000';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX - 35, boxY - 24, 70, 48);

      ctx.fillStyle = '#ffd000';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`P${g}`, boxX, boxY);
    }

    ctx.restore();
  }
}

/* ==========================================================================
   TOP-DOWN FORMULA 1 GAME ENGINE (F1 16-BITS)
   ========================================================================== */
class TopDownF1Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.radarCanvas = document.getElementById('radarCanvas');
    this.radarCtx = this.radarCanvas.getContext('2d');

    this.audio = new RetroSoundEngine();
    this.selectedTrack = 'interlagos';
    this.track = new TopDownTrack(this.selectedTrack);

    this.playerName = 'A. SENNA';
    this.difficulty = 'medium';

    this.camera = {
      x: 0,
      y: 0,
      zoom: 0.88,
      width: this.canvas.width,
      height: this.canvas.height
    };

    this.player = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      angle: 0,
      speed: 0,
      maxSpeed: 300,
      accel: 105,
      brake: 240,
      steerSpeed: 2.15,
      lap: 1,
      rank: 12,
      trackDist: 0,
      distance: 0,
      hasPassedStartLine: false,
      halfwayChecked: false,
      livery: 'ferrari',
      name: 'A. SENNA'
    };

    this.racers = [];
    this.totalRacers = 12;

    this.lap = 1;
    this.totalLaps = 3;
    this.lapStartTime = 0;
    this.totalStartTime = 0;
    this.bestLapTime = Infinity;
    this.raceStarted = false;
    this.raceFinished = false;
    this.isPaused = false;
    this.countdownActive = false;
    this.session = 'menu';
    this.gridPosition = 12;
    this.sessionElapsed = 0;
    this.trackLimitPenalty = 0;
    this.trackLimitExcursion = false;
    this.trackLimitRecovery = 0;
    this.sessionToken = 0;

    this.particles = [];
    this.skidmarks = [];

    this.keys = { left: false, right: false, brake: false };

    this.resizeCanvas = () => {
      const { width, height } = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = Math.max(1, Math.round(width));
      this.canvas.height = Math.max(1, Math.round(height));
      this.camera.width = this.canvas.width;
      this.camera.height = this.canvas.height;
      this.camera.zoom = 0.88 * Math.max(0.55, Math.min(width / 960, height / 600));
      this.ctx.imageSmoothingEnabled = false;
    };
    this.resizeCanvas();
    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
    this.resizeObserver.observe(this.canvas.parentElement);

    this.bindEvents();
    this.setupTouchControls();
    this.setupDifficultyButtons();
    this.setupTrackCards();
    this.setupCarCustomization();
    this.setupRaceFeatures();
    this.setupChampionship();
    this.initGrid();
    this.render();
  }

  setupRaceFeatures() {
    this.sessionRecords = new Map();
    this.unsavedRecordKeys = new Set();
    this.weather = 'dry';
    this.reducedEffects = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    this.ghostEnabled = true;
    try {
      const preferences = JSON.parse(localStorage.getItem('f1-race-preferences'));
      if (typeof preferences?.reducedEffects === 'boolean') this.reducedEffects = preferences.reducedEffects;
      if (typeof preferences?.ghostEnabled === 'boolean') this.ghostEnabled = preferences.ghostEnabled;
    } catch { /* Preferences are optional. */ }
    const sync = () => {
      const effects = document.getElementById('modalEffectsBtn');
      effects.textContent = `EFEITOS REDUZIDOS: ${this.reducedEffects ? 'SIM' : 'NÃO'}`;
      effects.setAttribute('aria-pressed', String(this.reducedEffects));
      const ghost = document.getElementById('modalGhostBtn');
      ghost.textContent = `CARRO FANTASMA: ${this.ghostEnabled ? 'LIGADO' : 'DESLIGADO'}`;
      ghost.setAttribute('aria-pressed', String(this.ghostEnabled));
      try { localStorage.setItem('f1-race-preferences', JSON.stringify({ reducedEffects: this.reducedEffects, ghostEnabled: this.ghostEnabled })); } catch { /* Optional persistence. */ }
    };
    document.getElementById('modalEffectsBtn').addEventListener('click', () => { this.reducedEffects = !this.reducedEffects; sync(); });
    document.getElementById('modalGhostBtn').addEventListener('click', () => { this.ghostEnabled = !this.ghostEnabled; sync(); });
    sync();
    this.resetLapFeatures();
  }

  recordKey() {
    return `f1-record-v1-${this.selectedTrack}-${this.weather}-${this.difficulty}`;
  }

  resetLapFeatures() {
    this.timedLap = null;
    this.record = this.sessionRecords.get(this.recordKey()) || null;
    this.noticeUntil = 0;
    this.shake = 0;
    this.kerbCooldown = 0;
    this.sprayCooldown = 0;
    this.recordSaveFailed = this.unsavedRecordKeys.has(this.recordKey());
    this.ghostCursor = 0;
    document.getElementById('raceNotice').hidden = true;
    try {
      const saved = JSON.parse(localStorage.getItem(this.recordKey()));
      if (saved && Number.isFinite(saved.time) && saved.time > 0 && saved.time <= 600 &&
          Array.isArray(saved.samples) && saved.samples.length >= 2 && saved.samples.length <= 6002 &&
          saved.samples[0].t === 0 && saved.samples[0].progress === 0 &&
          saved.samples.every((sample, index) =>
            ['t', 'x', 'y', 'angle', 'progress'].every(key => Number.isFinite(sample[key])) &&
            sample.t >= 0 && sample.t <= saved.time && sample.progress >= 0 &&
            (!index || (sample.t > saved.samples[index - 1].t && sample.progress >= saved.samples[index - 1].progress)))) {
        if (!this.record || saved.time < this.record.time) this.record = saved;
      }
    } catch { /* No record yet, or storage is unavailable. */ }
  }

  notifyRace(message) {
    const notice = document.getElementById('raceNotice');
    notice.textContent = message;
    notice.hidden = false;
    this.noticeUntil = this.sessionElapsed + 4;
  }

  beginTimedLap() {
    this.ghostCursor = 0;
    this.timedLap = { start: this.sessionElapsed, origin: this.player.raceProgress, valid: true, samples: [] };
    this.sampleTimedLap(true);
  }

  sampleTimedLap(force = false) {
    const lap = this.timedLap;
    if (!lap) return;
    const t = this.sessionElapsed - lap.start;
    const last = lap.samples[lap.samples.length - 1];
    if (t > 600 || lap.samples.length >= 6002) { lap.valid = false; return; }
    if (last && t <= last.t) return;
    if (!force && last && t - last.t < 0.1) return;
    const progress = Math.max(0, this.player.raceProgress - lap.origin);
    if (last && progress < last.progress - 3) lap.valid = false;
    lap.samples.push({ t, x: this.player.x, y: this.player.y, angle: this.player.angle,
      progress: Math.max(last?.progress || 0, progress) });
  }

  completeTimedLap() {
    const lap = this.timedLap;
    if (!lap) return;
    this.sampleTimedLap(true);
    const time = this.sessionElapsed - lap.start;
    const progress = this.player.raceProgress - lap.origin;
    if (lap.valid && progress >= this.track.totalLength * 0.95 && time > 0 && lap.samples.length >= 2 &&
        (!this.record || time < this.record.time)) {
      this.record = { time, samples: lap.samples };
      this.sessionRecords.set(this.recordKey(), this.record);
      try {
        localStorage.setItem(this.recordKey(), JSON.stringify(this.record));
        this.recordSaveFailed = false;
        this.unsavedRecordKeys.delete(this.recordKey());
      } catch {
        this.recordSaveFailed = true;
        this.unsavedRecordKeys.add(this.recordKey());
      }
      this.notifyRace(`NOVO RECORDE! ${this.formatTime(time)}${this.recordSaveFailed ? ' · SOMENTE NESTA SESSÃO' : ''}`);
    } else if (!lap.valid) {
      this.notifyRace('VOLTA SEM RECORDE · LIMITES DA PISTA');
    } else {
      this.notifyRace(`VOLTA COMPLETA · ${this.formatTime(time)}`);
    }
    this.timedLap = null;
  }

  ghostAtTime() {
    if (!this.record || !this.timedLap || !this.ghostEnabled) return null;
    const time = this.sessionElapsed - this.timedLap.start;
    const samples = this.record.samples;
    if (time > this.record.time) return null;
    while (this.ghostCursor < samples.length - 2 && samples[this.ghostCursor + 1].t < time) this.ghostCursor++;
    const a = samples[this.ghostCursor], b = samples[this.ghostCursor + 1];
    const mix = Math.max(0, Math.min(1, (time - a.t) / (b.t - a.t)));
    const turn = Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle));
    return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix, angle: a.angle + turn * mix };
  }

  updateRaceTelemetry() {
    const active = this.raceStarted && !this.countdownActive;
    const gaps = document.getElementById('hudGaps');
    gaps.textContent = '';
    if (active && this.session === 'race') {
      const ordered = [...this.racers.map(r => ({ name: r.name, speed: r.speed * 2.2,
        progress: (r.lap - 1) * this.track.totalLength + r.trackDist })),
        { isPlayer: true, progress: this.player.raceProgress }].sort((a, b) => b.progress - a.progress);
      const index = ordered.findIndex(r => r.isPlayer);
      const ahead = ordered[index - 1], behind = ordered[index + 1];
      // Estimated gaps from distance and local speed, not measured timing-line intervals.
      const frontGap = ahead ? `${ahead.name} +${((ahead.progress - this.player.raceProgress) / Math.max(80, this.player.speed * 2.1)).toFixed(1)}s` : 'VOCÊ LIDERA';
      const backGap = behind ? `${behind.name} −${((this.player.raceProgress - behind.progress) / Math.max(80, behind.speed)).toFixed(1)}s` : 'ÚLTIMA POSIÇÃO';
      gaps.textContent = `INTERVALOS EST. · ${frontGap} | ${backGap}`;
    }
    document.getElementById('hudRecord').textContent = active
      ? `${this.weather === 'rain' ? 'CHUVA' : 'SECO'} · RECORDE: ${this.record ? this.formatTime(this.record.time) : '--:--.--'}${this.recordSaveFailed ? ' (NÃO SALVO)' : ''}` : '';
    const delta = document.getElementById('hudDelta');
    delta.textContent = '';
    if (active && this.record && this.timedLap && this.ghostEnabled) {
      const progress = this.player.raceProgress - this.timedLap.origin;
      const samples = this.record.samples;
      let lo = 0, hi = samples.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid].progress < progress) lo = mid; else hi = mid; }
      const a = samples[lo], b = samples[hi];
      if (progress >= 0 && progress <= b.progress) {
        const mix = Math.max(0, Math.min(1, (progress - a.progress) / Math.max(0.001, b.progress - a.progress)));
        const difference = this.sessionElapsed - this.timedLap.start - (a.t + (b.t - a.t) * mix);
        delta.textContent = `${this.timedLap.valid ? 'FANTASMA' : 'VOLTA INVÁLIDA'} · ${difference >= 0 ? '+' : '−'}${Math.abs(difference).toFixed(2)}s`;
        delta.dataset.faster = String(difference <= 0);
      }
    }
    if (this.sessionElapsed >= this.noticeUntil) document.getElementById('raceNotice').hidden = true;
  }

  setupChampionship() {
    this.championshipTracks = ['interlagos', 'monza', 'silverstone', 'spa', 'suzuka', 'monaco'];
    this.raceMode = 'single';
    this.championship = null;
    try {
      const saved = JSON.parse(localStorage.getItem('f1-championship-v1'));
      if (saved && saved.version === 1 && Number.isInteger(saved.round) && saved.round >= 0 && saved.round <= 6 &&
          typeof saved.playerName === 'string' && saved.playerName.length <= 14 &&
          ['easy', 'medium', 'hard'].includes(saved.difficulty) && Number.isInteger(saved.laps) && saved.laps >= 1 && saved.laps <= 10 &&
          Array.isArray(saved.drivers) && saved.drivers.length === 12 &&
          saved.drivers.filter(driver => driver.id === 'player').length === 1 &&
          new Set(saved.drivers.map(driver => driver.id)).size === 12 &&
          saved.drivers.every(driver => typeof driver.id === 'string' && typeof driver.name === 'string' &&
            Number.isInteger(driver.points) && driver.points >= 0 && Array.isArray(driver.finishes) &&
            driver.finishes.length === saved.round && driver.finishes.every(place => Number.isInteger(place) && place >= 1 && place <= 12))) {
        this.championship = saved;
      }
    } catch { /* A season can also be played without browser storage. */ }
    document.getElementById('raceMode').addEventListener('change', event => {
      this.raceMode = event.target.value;
      this.refreshChampionshipMenu();
    });
    document.getElementById('newChampionshipBtn').addEventListener('click', () => {
      if (this.championship?.round < 6 && !window.confirm('Apagar os pontos da temporada atual e começar outra?')) return;
      this.championship = null;
      try { localStorage.removeItem('f1-championship-v1'); } catch { /* Optional persistence. */ }
      this.refreshChampionshipMenu();
    });
    this.refreshChampionshipMenu();
  }

  saveChampionship() {
    try {
      localStorage.setItem('f1-championship-v1', JSON.stringify(this.championship));
      this.championshipSaveFailed = false;
    } catch { this.championshipSaveFailed = true; }
  }

  createChampionship() {
    this.initGrid();
    this.championship = {
      version: 1, round: 0, playerName: this.playerName, difficulty: this.difficulty,
      laps: Math.max(1, Math.min(10, Number(document.getElementById('raceLaps').value) || 3)),
      weather: document.getElementById('raceWeather').value === 'rain' ? 'rain' : 'dry',
      drivers: [{ id: 'player', name: this.playerName, points: 0, finishes: [] },
        ...this.racers.map(driver => ({ id: driver.name, name: driver.name, points: 0, finishes: [] }))]
    };
    this.saveChampionship();
  }

  championshipTable(container) {
    container.replaceChildren();
    if (!this.championship) return;
    const drivers = [...this.championship.drivers].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      for (let place = 1; place <= 12; place++) {
        const difference = b.finishes.filter(p => p === place).length - a.finishes.filter(p => p === place).length;
        if (difference) return difference;
      }
      return a.id.localeCompare(b.id);
    });
    const heading = document.createElement('p');
    heading.textContent = this.championship.round === 6
      ? `TEMPORADA CONCLUÍDA · CAMPEÃO: ${drivers[0].name}`
      : `CAMPEONATO · ${this.championship.round}/6 ETAPAS CONCLUÍDAS`;
    const table = document.createElement('table');
    table.className = 'qualify-table';
    const head = table.createTHead().insertRow();
    ['POS.', 'PILOTO', 'PTS'].forEach(label => {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; head.appendChild(cell);
    });
    const body = table.createTBody();
    drivers.forEach((driver, index) => {
      const row = body.insertRow();
      if (driver.id === 'player') row.className = 'qualify-player';
      [index + 1, driver.name, driver.points].forEach(value => { row.insertCell().textContent = value; });
    });
    container.append(heading, table);
    if (this.championshipSaveFailed) {
      const warning = document.createElement('p');
      warning.textContent = 'Não foi possível salvar neste navegador. O progresso ficará disponível enquanto esta página estiver aberta.';
      container.appendChild(warning);
    }
  }

  refreshChampionshipMenu() {
    const active = this.raceMode === 'championship';
    const season = this.championship;
    document.querySelectorAll('.track-card').forEach(card => { card.disabled = active; });
    document.getElementById('raceLaps').disabled = active && !!season && season.round < 6;
    const weatherSelect = document.getElementById('raceWeather');
    weatherSelect.disabled = active && !!season && season.round < 6;
    if (weatherSelect.disabled) weatherSelect.value = season.weather === 'rain' ? 'rain' : 'dry';
    document.getElementById('newChampionshipBtn').hidden = !active || !season;
    document.getElementById('championshipInfo').textContent = active
      ? (season && season.round < 6
        ? `${season.playerName} · PRÓXIMA ETAPA: ${season.round + 1}/6 · ${this.championshipTracks[season.round].toUpperCase()}`
        : 'Interlagos → Monza → Silverstone → Spa → Suzuka → Mônaco. Pontos: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1. Desempate por melhores colocações.')
      : 'Escolha qualquer circuito para disputar um GP avulso.';
    const table = document.getElementById('menuChampionshipTable');
    table.hidden = !active || !season;
    this.championshipTable(table);
  }

  initGrid() {
    const f1Drivers = [
      { name: 'M. SCHUMACHER',  team: 'Benetton',  livery: 'benetton', baseSpeed: 275 },
      { name: 'A. PROST',       team: 'Williams',  livery: 'williams', baseSpeed: 272 },
      { name: 'N. MANSELL',     team: 'Williams',  livery: 'williams', baseSpeed: 270 },
      { name: 'J. ALESI',       team: 'Ferrari',   livery: 'ferrari',  baseSpeed: 268 },
      { name: 'G. BERGER',      team: 'Ferrari',   livery: 'ferrari',  baseSpeed: 266 },
      { name: 'D. HILL',        team: 'Williams',  livery: 'williams', baseSpeed: 264 },
      { name: 'M. HÄKKINEN',    team: 'McLaren',   livery: 'mclaren',  baseSpeed: 262 },
      { name: 'R. BARRICHELLO', team: 'Jordan',    livery: 'jordan',   baseSpeed: 260 },
      { name: 'E. IRVINE',      team: 'Jordan',    livery: 'jordan',   baseSpeed: 258 },
      { name: 'J. HERBERT',     team: 'Lotus',     livery: 'lotus',    baseSpeed: 256 },
      { name: 'K. WENDLINGER',  team: 'Sauber',    livery: 'sauber',   baseSpeed: 254 }
    ];

    const diffMod = this.getDifficultyMod();
    // Give medium players room to recover after braking for manual cornering.
    this.player.maxSpeed = this.difficulty === 'medium' ? 310 : 300;
    this.player.accel = this.difficulty === 'medium' ? 125 : 105;
    const finishX = 0;
    const pitY = -800;

    let finishDist = 0;
    let minFinishDistSq = Infinity;
    for (let i = 0; i < this.track.points.length; i++) {
      const pt = this.track.points[i];
      if (pt.y < -600) {
        const dSq = (pt.x - finishX) ** 2 + (pt.y - pitY) ** 2;
        if (dSq < minFinishDistSq) {
          minFinishDistSq = dSq;
          finishDist = this.track.distances[i] || 0;
        }
      }
    }

    const totalLen = this.track.totalLength;

    const numberPool = Array.from({ length: 90 }, (_, i) => i + 1)
      .filter(number => number !== (this.player.number || 1));
    // Fisher-Yates shuffle: unique race numbers, excluding the player's choice.
    for (let i = numberPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numberPool[i], numberPool[j]] = [numberPool[j], numberPool[i]];
    }
    this.racers = f1Drivers.map((driver, idx) => {
      const gridPos = idx + 1 >= this.gridPosition ? idx + 2 : idx + 1;
      const boxX = finishX - gridPos * 115;
      const laneOffset = (gridPos % 2 === 1) ? -45 : 45;
      const boxY = pitY + laneOffset;
      const startDist = (finishDist - gridPos * 115 + totalLen) % totalLen;

      return {
        name: driver.name,
        number: numberPool[idx],
        team: driver.team,
        livery: driver.livery,
        gridSlot: gridPos,
        trackDist: startDist,
        laneOffset: laneOffset,
        targetLaneOffset: laneOffset,
        aggression: 0.35 + Math.random() * 0.65,
        rhythm: Math.random() * Math.PI * 2,
        decisionCooldown: 0,
        mistakeTimer: 0,
        x: boxX,
        y: boxY,
        angle: 0,
        speed: 0,
        maxSpeed: driver.baseSpeed * diffMod.speed,
        accel: (90 + Math.random() * 15) * diffMod.accel,
        lap: 1,
        halfwayChecked: false
      };
    });

    const playerGridPos = this.gridPosition;
    const playerLaneOffset = playerGridPos % 2 === 1 ? -45 : 45;
    const playerBoxX = finishX - playerGridPos * 115;
    const playerBoxY = pitY + playerLaneOffset;
    const playerStartDist = (finishDist - playerGridPos * 115 + totalLen) % totalLen;

    this.player.gridSlot = playerGridPos;
    this.player.trackDist = playerStartDist;
    this.player.raceProgress = playerStartDist;
    this.player.distance = playerStartDist;
    this.player.x = playerBoxX;
    this.player.y = playerBoxY;
    this.player.prevX = playerBoxX;
    this.player.prevY = playerBoxY;
    this.player.angle = 0;
    this.player.speed = 0;
    this.player.lap = 1;
    this.player.hasPassedStartLine = false;
    this.player.halfwayChecked = false;
    this.player.rank = playerGridPos;

    this.camera.x = this.player.x + 80;
    this.camera.y = this.player.y;
  }

  getDifficultyMod() {
    switch (this.difficulty) {
      case 'easy':
        return { speed: 0.86, accel: 0.85, qualifyingPace: 0.8 };
      case 'hard':
        return { speed: 1.01, accel: 1.06, qualifyingPace: 0.94 };
      case 'medium':
      default:
        return { speed: 0.94, accel: 0.92, qualifyingPace: 0.94 };
    }
  }

  setupTouchControls() {
    const pad = document.querySelector('.d-pad');
    const buttons = {
      left: document.getElementById('tLeft'),
      right: document.getElementById('tRight'),
      brake: document.getElementById('tBrake')
    };
    const pointers = new Map();
    const sync = () => {
      // The most recently pressed direction wins when using two fingers.
      const directions = [...pointers.values()].filter(key => key === 'left' || key === 'right');
      const direction = directions[directions.length - 1];
      for (const [key, button] of Object.entries(buttons)) {
        const pressed = key === 'brake' ? [...pointers.values()].includes(key) : direction === key;
        this.keys[key] = pressed;
        button.classList.toggle('pressed', pressed);
      }
    };
    const directionAt = (event) => {
      const rect = pad.getBoundingClientRect();
      if (event.clientX < rect.left - 20 || event.clientX > rect.right + 20 ||
          event.clientY < rect.top - 20 || event.clientY > rect.bottom + 20) return null;
      return event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
    };
    const bindPointer = (element, getKey) => {
      element.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, getKey(event));
        sync();
      });
      element.addEventListener('pointermove', (event) => {
        if (!pointers.has(event.pointerId)) return;
        const key = getKey(event);
        if (pointers.get(event.pointerId) !== key) {
          pointers.delete(event.pointerId);
          pointers.set(event.pointerId, key);
          sync();
        }
      });
      const release = (event) => {
        if (pointers.delete(event.pointerId)) sync();
      };
      element.addEventListener('pointerup', release);
      element.addEventListener('pointercancel', release);
      element.addEventListener('lostpointercapture', release);
      element.addEventListener('contextmenu', event => event.preventDefault());
    };
    bindPointer(pad, directionAt);
    bindPointer(buttons.brake, () => 'brake');
    this.resetControls = () => {
      pointers.clear();
      sync();
    };
    window.addEventListener('blur', this.resetControls);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetControls();
    });
  }

  setupCarCustomization() {
    const presets = {
      classic: { name: 'VERMELHO CLÁSSICO', body: '#d40000', wing: '#111111', accent: '#ffffff' },
      ocean: { name: 'AZUL VELOCIDADE', body: '#0077ee', wing: '#ffffff', accent: '#ffd000' },
      gold: { name: 'AMARELO ELÉTRICO', body: '#ffe600', wing: '#111111', accent: '#00ffff' },
      mint: { name: 'VERDE TURBO', body: '#00c78c', wing: '#102b35', accent: '#ffffff' },
      purple: { name: 'ROXO NEON', body: '#a855f7', wing: '#171125', accent: '#00ffcc' }
    };
    const inputs = {
      body: document.getElementById('carBodyColor'),
      wing: document.getElementById('carWingColor'),
      accent: document.getElementById('carAccentColor')
    };
    const buttons = document.querySelectorAll('[data-paint]');
    const validColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
    this.carPaint = { ...presets.classic };
    try {
      const saved = JSON.parse(localStorage.getItem('f1-car-paint'));
      if (saved && ['body', 'wing', 'accent'].every(key => validColor(saved[key]))) {
        this.carPaint = { body: saved.body, wing: saved.wing, accent: saved.accent };
      }
    } catch { /* The garage also works when browser storage is unavailable. */ }
    const update = () => {
      const selected = Object.keys(presets).find(key =>
        ['body', 'wing', 'accent'].every(color => presets[key][color] === this.carPaint[color]));
      document.getElementById('carPaintName').textContent = selected ? presets[selected].name : 'PINTURA PERSONALIZADA';
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paint === selected)));
      Object.entries(inputs).forEach(([key, input]) => { input.value = this.carPaint[key]; });
      const canvas = document.getElementById('carPreview');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(240, 78);
      ctx.scale(3, 3);
      this.renderF1CarSprite(ctx, 0, 0, 0, this.player.livery, '', true);
      ctx.restore();
      // Keep the large menu illustration in sync with the selected paint.
      document.querySelectorAll('#carRed stop').forEach(stop => stop.setAttribute('stop-color', this.carPaint.body));
      document.querySelectorAll('.home-car [fill]').forEach(node => {
        if (!node.dataset.originalFill) node.dataset.originalFill = node.getAttribute('fill');
        const fill = node.dataset.originalFill;
        if (['#ed2441', '#b20c2f', '#ff4850'].includes(fill)) node.setAttribute('fill', this.carPaint.body);
        if (['#ecebdc', '#161c28'].includes(fill)) node.setAttribute('fill', this.carPaint.wing);
        if (['#f5e9cb', '#ffe14b'].includes(fill)) node.setAttribute('fill', this.carPaint.accent);
      });
      try { localStorage.setItem('f1-car-paint', JSON.stringify(this.carPaint)); } catch { /* Optional persistence. */ }
    };
    buttons.forEach(button => button.addEventListener('click', () => {
      this.carPaint = { ...presets[button.dataset.paint] };
      update();
    }));
    Object.entries(inputs).forEach(([key, input]) => input.addEventListener('input', () => {
      this.carPaint[key] = input.value;
      update();
    }));
    update();
  }

  setupTrackCards() {
    const cards = document.querySelectorAll('.track-card');
    cards.forEach(card => {
      const preview = document.createElement('canvas');
      preview.width = 320;
      preview.height = 140;
      preview.className = 'circuit-preview';
      preview.setAttribute('aria-hidden', 'true');
      card.prepend(preview);
      const ctx = preview.getContext('2d');
      if (card.dataset.track === 'random') {
        ctx.fillStyle = '#ffe149';
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', 160, 94);
      } else {
        const points = new TopDownTrack(card.dataset.track).points;
        const xs = points.map(p => p.x), ys = points.map(p => p.y);
        const minX = Math.min(...xs), minY = Math.min(...ys);
        const width = Math.max(...xs) - minX, height = Math.max(...ys) - minY;
        const scale = Math.min(264 / width, 100 / height);
        const ox = (320 - width * scale) / 2, oy = (140 - height * scale) / 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = (p.x - minX) * scale + ox, y = (p.y - minY) * scale + oy;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#263a47';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.strokeStyle = '#b2d7d4';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ee2346';
        ctx.fillRect(ox + (points[0].x - minX) * scale - 4, oy + (points[0].y - minY) * scale - 4, 8, 8);
      }
      card.addEventListener('click', () => {
        cards.forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
        });
        card.setAttribute('aria-pressed', 'true');
        card.classList.add('selected');
        const choice = card.getAttribute('data-track');
        if (choice === 'random') {
          const tracks = ['interlagos', 'monza', 'silverstone', 'spa', 'suzuka', 'monaco'];
          this.selectedTrack = tracks[Math.floor(Math.random() * tracks.length)];
        } else {
          this.selectedTrack = choice;
        }
        this.track = new TopDownTrack(this.selectedTrack);
        this.initGrid();
        this.render();
      });
    });
  }

  setupDifficultyButtons() {
    const btns = document.querySelectorAll('[data-diff]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.difficulty = btn.getAttribute('data-diff');
      });
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (e.code === 'Space' && !e.target.matches('input, textarea, button, [contenteditable]')) {
        e.preventDefault();
        this.keys.brake = true;
      }
      if (['KeyP', 'Escape'].includes(e.code)) {
        this.toggleInteractiveMenu();
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (e.code === 'Space') this.keys.brake = false;
    });

    const titleScreen = document.getElementById('titleScreen');
    const trackScreen = document.getElementById('trackSelectScreen');
    const nameInput = document.getElementById('playerNameInput');
    const numberInput = document.getElementById('playerNumberInput');
    const normalizeNumber = value => Math.max(1, Math.min(90, Math.floor(Number(value) || 1)));
    try { numberInput.value = normalizeNumber(localStorage.getItem('f1-car-number')); } catch { /* Storage is optional. */ }
    const updateNumber = () => {
      this.player.number = normalizeNumber(numberInput.value);
      const menuNumber = document.querySelector('.home-car text');
      if (menuNumber) menuNumber.textContent = this.player.number;
      const canvas = document.getElementById('carPreview');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(240, 78);
      ctx.scale(3, 3);
      this.renderF1CarSprite(ctx, 0, 0, 0, this.player.livery, '', true);
      ctx.restore();
      try { localStorage.setItem('f1-car-number', String(this.player.number)); } catch { /* Storage is optional. */ }
    };
    numberInput.addEventListener('input', updateNumber);
    numberInput.addEventListener('change', () => { updateNumber(); numberInput.value = this.player.number; });
    updateNumber();

    nameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase();
      this.playerName = val.length > 0 ? val : 'A. SENNA';
      this.player.name = this.playerName;
      document.getElementById('hudDriverName').innerText = this.playerName;
    });

    document.getElementById('startBtn').addEventListener('click', () => {
      const val = nameInput.value.trim().toUpperCase();
      this.playerName = val.length > 0 ? val : 'A. SENNA';
      this.player.name = this.playerName;
      document.getElementById('hudDriverName').innerText = this.playerName;

      titleScreen.style.display = 'none';
      this.refreshChampionshipMenu();
      trackScreen.style.display = 'flex';
    });

    document.getElementById('backToTitleBtn').addEventListener('click', () => {
      trackScreen.style.display = 'none';
      titleScreen.style.display = 'flex';
    });

    document.getElementById('confirmTrackBtn').addEventListener('click', () => {
      trackScreen.style.display = 'none';
      this.startGame();
    });

    document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    document.getElementById('finishHomeBtn').addEventListener('click', () => this.goToHomeMenu());
    document.getElementById('qualifyRaceBtn').addEventListener('click', () => this.startQualifiedRace());
    document.getElementById('qualifyHomeBtn').addEventListener('click', () => this.goToHomeMenu());

    const menuTrigger = document.getElementById('menuTriggerBtn');
    const pauseBtn = document.getElementById('modalPauseBtn');
    const audioBtn = document.getElementById('modalAudioBtn');
    const crtBtn = document.getElementById('modalCrtBtn');
    const restartBtn = document.getElementById('modalRestartBtn');
    const homeBtn = document.getElementById('modalHomeBtn');
    const closeBtn = document.getElementById('modalCloseBtn');

    menuTrigger.addEventListener('click', () => this.toggleInteractiveMenu());
    closeBtn.addEventListener('click', () => this.toggleInteractiveMenu(false));

    pauseBtn.addEventListener('click', () => {
      if (this.isPaused) {
        this.toggleInteractiveMenu(false);
        return;
      }
      this.togglePause();
      pauseBtn.innerText = this.isPaused ? '▶️ RETOMAR CORRIDA' : '⏸️ PAUSAR CORRIDA';
    });

    audioBtn.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      audioBtn.innerText = muted ? '🔇 SOM: MUTADO' : '🔊 SOM: ATIVADO';
    });

    crtBtn.addEventListener('click', () => {
      const overlay = document.getElementById('crtOverlay');
      overlay.classList.toggle('crt-off');
      const isOff = overlay.classList.contains('crt-off');
      crtBtn.innerText = isOff ? '📺 FILTRO CRT: DESLIGADO' : '📺 FILTRO CRT: LIGADO';
    });

    restartBtn.addEventListener('click', () => {
      this.toggleInteractiveMenu(false);
      this.restartGame();
    });

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        this.toggleInteractiveMenu(false);
        this.goToHomeMenu();
      });
    }
  }

  goToHomeMenu() {
    this.sessionToken++;
    cancelAnimationFrame(this.animationFrame);
    this.session = 'menu';
    document.getElementById('raceNotice').hidden = true;
    ['hudGaps', 'hudRecord', 'hudDelta'].forEach(id => { document.getElementById(id).textContent = ''; });
    this.timedLap = null;
    this.shake = 0;
    this.gridPosition = 12;
    document.getElementById('qualifyScreen').style.display = 'none';
    this.resetControls();
    this.raceStarted = false;
    this.raceFinished = false;
    this.countdownActive = false;
    this.isPaused = false;
    this.audio.pauseEngine();
    this.audio.isPlaying = false;
    if (this.audio.timer) {
      clearTimeout(this.audio.timer);
      this.audio.timer = null;
    }

    const gantry = document.getElementById('startLightsOverlay');
    if (gantry) gantry.style.display = 'none';

    const finishScreen = document.getElementById('finishScreen');
    if (finishScreen) finishScreen.style.display = 'none';

    const trackScreen = document.getElementById('trackSelectScreen');
    if (trackScreen) trackScreen.style.display = 'none';

    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) titleScreen.style.display = 'flex';

    this.initGrid();
    this.render();
  }

  toggleInteractiveMenu(forceState = null) {
    const modal = document.getElementById('interactiveModal');
    const pauseBtn = document.getElementById('modalPauseBtn');
    const shouldOpen = (forceState !== null) ? forceState : (modal.style.display !== 'flex');

    if (shouldOpen) {
      this.resetControls();
      modal.style.display = 'flex';
      if (!this.isPaused && (this.raceStarted || this.countdownActive)) {
        this.togglePause();
      }
    } else {
      modal.style.display = 'none';
      if (this.isPaused) {
        this.togglePause();
      }
    }
    if (pauseBtn) {
      pauseBtn.innerText = this.isPaused ? '▶️ RETOMAR CORRIDA' : '⏸️ PAUSAR CORRIDA';
    }
  }

  togglePause() {
    if (!this.raceStarted && !this.countdownActive) return;
    this.resetControls();
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('modalPauseBtn');
    if (pauseBtn) {
      pauseBtn.innerText = this.isPaused ? '▶️ RETOMAR CORRIDA' : '⏸️ PAUSAR CORRIDA';
    }
    if (this.isPaused) {
      this.audio.pauseEngine();
    } else {
      this.lastTime = performance.now();
    }
  }

  startGame() {
    if (this.raceMode === 'championship') {
      if (!this.championship || this.championship.round >= this.championshipTracks.length) this.createChampionship();
      this.selectedTrack = this.championshipTracks[this.championship.round];
      this.track = new TopDownTrack(this.selectedTrack);
      this.playerName = this.championship.playerName;
      this.player.name = this.playerName;
      this.difficulty = this.championship.difficulty;
      document.getElementById('raceLaps').value = String(this.championship.laps);
      document.getElementById('raceWeather').value = this.championship.weather === 'rain' ? 'rain' : 'dry';
    }
    const selectedLaps = Number(document.getElementById('raceLaps').value);
    this.totalLaps = Number.isFinite(selectedLaps)
      ? Math.max(1, Math.min(10, Math.floor(selectedLaps))) : 3;
    this.sessionToken++;
    cancelAnimationFrame(this.animationFrame);
    this.session = 'qualifying';
    this.gridPosition = 12;
    this.sessionElapsed = 0;
    this.trackLimitPenalty = 0;
    this.trackLimitExcursion = false;
    this.trackLimitRecovery = 0;
    this.qualifyingStarted = false;
    this.qualifyingSector = 0;
    this.bestLapTime = Infinity;
    document.getElementById('qualifyScreen').style.display = 'none';
    this.resetControls();
    const activeCard = document.querySelector('.track-card.selected');
    if (this.raceMode !== 'championship' && activeCard && activeCard.getAttribute('data-track') === 'random') {
      const tracks = ['interlagos', 'monza', 'silverstone', 'spa', 'suzuka', 'monaco'];
      this.selectedTrack = tracks[Math.floor(Math.random() * tracks.length)];
      this.track = new TopDownTrack(this.selectedTrack);
    }
    this.weather = document.getElementById('raceWeather').value === 'rain' ? 'rain' : 'dry';
    this.resetLapFeatures();

    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('trackSelectScreen').style.display = 'none';
    document.getElementById('interactiveModal').style.display = 'none';
    document.getElementById('hudDriverName').innerText = this.playerName;

    this.audio.init();

    this.raceStarted = false;
    this.raceFinished = false;
    this.isPaused = false;
    this.lap = 1;
    this.particles = [];
    this.skidmarks = [];

    this.initGrid();
    // Qualifying has its own pace so the simulated times remain competitive.
    const qualifyingPace = this.getDifficultyMod().qualifyingPace * (this.weather === 'rain' ? 0.82 : 1);
    this.qualifyingRivals = this.racers.map(racer => ({
      name: racer.name,
      time: this.track.totalLength / (racer.maxSpeed * 2.2 * qualifyingPace) + 0.8
    }));
    this.racers = [];
    this.player.x = -650;
    this.player.y = -800;
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.player.speed = 250;
    this.player.trackDist = this.getNearestTrackPoint(this.player.x, this.player.y).dist;
    this.player.raceProgress = this.player.trackDist;
    this.player.distance = this.player.trackDist;
    this.camera.x = this.player.x + 80;
    this.camera.y = this.player.y;
    this.raceStarted = true;
    this.countdownActive = false;
    this.audio.startMusic();
    document.getElementById('startLightsOverlay').style.display = 'none';
    this.updateHUD(performance.now());

    this.lastTime = performance.now();
    this.animationFrame = requestAnimationFrame((t) => this.loop(t));
  }

  finishQualifying() {
    this.completeTimedLap();
    const time = this.sessionElapsed - this.qualifyingStartTime;
    const results = [...this.qualifyingRivals, { name: this.playerName, time, isPlayer: true }]
      .sort((a, b) => a.time - b.time || (a.isPlayer ? 1 : -1));
    this.gridPosition = results.findIndex(result => result.isPlayer) + 1;
    this.session = 'qualifying-result';
    this.raceStarted = false;
    this.resetControls();
    this.audio.pauseEngine();
    this.audio.playLap();
    document.getElementById('qualifyResult').textContent =
      `SUA VOLTA: ${this.formatTime(time)} • LARGADA EM ${this.gridPosition}º`;
    const body = document.getElementById('qualifyResults');
    body.replaceChildren();
    results.forEach((result, index) => {
      const row = document.createElement('tr');
      if (result.isPlayer) row.className = 'qualify-player';
      [String(index + 1), result.name, this.formatTime(result.time)].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    document.getElementById('qualifyScreen').style.display = 'flex';
  }

  startQualifiedRace() {
    if (this.session !== 'qualifying-result') return;
    this.sessionToken++;
    cancelAnimationFrame(this.animationFrame);
    this.session = 'race';
    this.sessionElapsed = 0;
    this.resetLapFeatures();
    this.lapStartElapsed = 0;
    this.trackLimitPenalty = 0;
    this.trackLimitExcursion = false;
    this.trackLimitRecovery = 0;
    this.resetControls();
    this.lap = 1;
    this.bestLapTime = Infinity;
    this.raceStarted = false;
    this.raceFinished = false;
    this.isPaused = false;
    this.particles = [];
    this.skidmarks = [];
    document.getElementById('qualifyScreen').style.display = 'none';
    this.initGrid();
    this.updateHUD(performance.now());
    document.getElementById('hudTime').textContent = '00:00.00';
    this.startF1Countdown();
    this.lastTime = performance.now();
    this.animationFrame = requestAnimationFrame(t => this.loop(t));
  }

  startF1Countdown() {
    const token = this.sessionToken;
    this.countdownActive = true;
    const overlay = document.getElementById('startLightsOverlay');
    const text = document.getElementById('gantryText');
    overlay.style.display = 'flex';
    text.innerText = 'GRID DE FORMULA 1 PRONTO';

    for (let i = 1; i <= 5; i++) {
      document.getElementById(`lamp${i}`).classList.remove('lit');
    }

    const lightStep = (step) => {
      if (!this.countdownActive || token !== this.sessionToken) return;
      if (step <= 5) {
        document.getElementById(`lamp${step}`).classList.add('lit');
        this.audio.playBeep(false);
        setTimeout(() => lightStep(step + 1), 750);
      } else {
        const waitTime = 800 + Math.random() * 700;
        setTimeout(() => {
          if (!this.countdownActive || token !== this.sessionToken) return;
          for (let i = 1; i <= 5; i++) {
            document.getElementById(`lamp${i}`).classList.remove('lit');
          }
          text.innerText = 'LUZES APAGADAS! LARGADA!';
          text.style.color = '#00ff44';
          this.audio.playBeep(true);
          this.audio.startMusic();

          this.raceStarted = true;
          this.countdownActive = false;
          this.player.speed = 0;
          this.sessionElapsed = 0;
    this.trackLimitPenalty = 0;
    this.trackLimitExcursion = false;
    this.trackLimitRecovery = 0;
          this.racers.forEach(r => {
            r.speed = 0;
          });

          this.lapStartTime = performance.now();
          this.totalStartTime = performance.now();
          this.lapStartElapsed = 0;
          if (this.totalLaps === 1) this.notifyRace('ÚLTIMA VOLTA · VALE TUDO PELA VITÓRIA!');

          setTimeout(() => {
            if (token !== this.sessionToken) return;
            overlay.style.display = 'none';
            text.style.color = '#00ffff';
          }, 1200);
        }, waitTime);
      }
    };

    setTimeout(() => lightStep(1), 600);
  }

  restartGame() {
    document.getElementById('finishScreen').style.display = 'none';
    this.startGame();
  }

  loop(now) {
    if (!this.lastTime) this.lastTime = now;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.isPaused) {
      this.update(dt, now);
    }
    this.render();

    if (this.raceStarted || this.countdownActive || this.isPaused) {
      this.animationFrame = requestAnimationFrame((t) => this.loop(t));
    }
  }

  update(dt, now) {
    if (this.countdownActive) {
      this.audio.updateEngine(0.1);
      return;
    }
    if (!this.raceStarted) return;
    this.sessionElapsed += dt;
    this.shake = Math.max(0, this.shake - dt * 16);
    this.kerbCooldown = Math.max(0, this.kerbCooldown - dt);
    this.sprayCooldown = Math.max(0, this.sprayCooldown - dt);

    const p = this.player;

    if (this.keys.brake) {
      p.speed = Math.max(0, p.speed - p.brake * (this.weather === 'rain' ? 0.65 : 1) * dt);
      if (p.speed > 100 && this.weather !== 'rain') this.addSkidmark(p);
      if (Math.random() < 0.35) {
        this.addParticle(p.x, p.y, '#ffffff', 0.3);
      }
    } else {
      const weatherMax = p.maxSpeed * (this.weather === 'rain' ? 0.9 : 1);
      p.speed = Math.min(weatherMax, p.speed + p.accel * (this.weather === 'rain' ? 0.82 : 1) * dt);
    }

    const speedRatio = p.speed / p.maxSpeed;
    const dynamicSteer = p.steerSpeed * (0.65 + (1 - speedRatio) * 0.35) *
      (this.weather === 'rain' ? 0.78 : 1);

    if (this.keys.left) {
      p.angle -= dynamicSteer * dt;
      if (speedRatio > 0.6) this.addSkidmark(p);
    } else if (this.keys.right) {
      p.angle += dynamicSteer * dt;
      if (speedRatio > 0.6) this.addSkidmark(p);
    }

    p.prevX = p.x;
    p.prevY = p.y;

    const speedWorld = p.speed * 2.1;
    p.x += Math.cos(p.angle) * speedWorld * dt;
    p.y += Math.sin(p.angle) * speedWorld * dt;
    this.constrainPlayerToTrack();

    const nearest = this.getNearestTrackPoint(p.x, p.y);
    const distFromCenter = Math.hypot(p.x - nearest.pt.x, p.y - nearest.pt.y);
    const halfRoad = this.track.width / 2;
    const isOnRoad = distFromCenter <= (halfRoad + 22);
    const isOnGrass = distFromCenter > halfRoad + this.track.runoffWidth;
    if (this.timedLap && !isOnRoad) this.timedLap.valid = false;
    if (distFromCenter >= halfRoad - 10 && distFromCenter <= halfRoad + 22 && p.speed > 70 && this.kerbCooldown === 0) {
      this.audio.playKerb();
      this.kerbCooldown = 0.12;
      if (!this.reducedEffects) this.shake = Math.max(this.shake, 1.5);
    }
    if (this.weather === 'rain' && p.speed > 75 && this.sprayCooldown === 0 && !this.reducedEffects) {
      const cars = [p, ...this.racers];
      for (const car of cars) {
        if (car.speed > 75 && Math.hypot(car.x - p.x, car.y - p.y) < 850) {
          this.addParticle(car.x - Math.cos(car.angle) * 35, car.y - Math.sin(car.angle) * 35, '#c0d9e8', 0.4);
        }
      }
      this.sprayCooldown = 0.08;
    }

    if (!isOnRoad) {
      p.speed = Math.max(45, p.speed - 160 * dt);
      if (Math.random() < 0.35) {
        this.addParticle(p.x, p.y, '#c99a4e', 0.4);
      }
    }

    // Penalize only beyond the gravel boundary, where the grass begins.
    // Serve the slowdown on the road so staying in the runoff cannot erase it.
    if (isOnGrass) {
      this.trackLimitRecovery = 0;
      if (!this.trackLimitExcursion) {
        this.trackLimitExcursion = true;
        this.trackLimitPenalty += 3;
      }
    } else {
      this.trackLimitRecovery += dt;
      if (this.trackLimitRecovery >= 0.5) this.trackLimitExcursion = false;
    }
    if (this.trackLimitPenalty > 0) {
      p.speed = Math.min(p.speed, 80);
      if (isOnRoad) this.trackLimitPenalty = Math.max(0, this.trackLimitPenalty - dt);
    }

    const totalLen = this.track.totalLength;
    let progressDelta = nearest.dist - p.trackDist;
    if (progressDelta > totalLen / 2) progressDelta -= totalLen;
    if (progressDelta < -totalLen / 2) progressDelta += totalLen;
    p.raceProgress += progressDelta;
    p.trackDist = nearest.dist;
    p.distance = nearest.dist;
    let finished = false;

    const finishX = 0;
    const pitY = -800;
    const crossedFinishLine = (p.prevX <= finishX && p.x >= finishX && Math.abs(p.y - pitY) < this.track.width);

    if (!p.hasPassedStartLine && crossedFinishLine) {
      p.hasPassedStartLine = true;
      this.beginTimedLap();
      if (this.session === 'race') this.lapStartElapsed = this.sessionElapsed;
      if (this.session === 'qualifying') {
        this.qualifyingStarted = true;
        this.qualifyingStartTime = this.sessionElapsed;
        this.qualifyingStartProgress = p.raceProgress;
      }
    }

    if (this.session === 'qualifying' && this.qualifyingStarted && isOnRoad) {
      const progress = p.raceProgress - this.qualifyingStartProgress;
      if (progress >= (this.qualifyingSector + 1) * totalLen / 4 && this.qualifyingSector < 3) {
        this.qualifyingSector++;
      }
      if (crossedFinishLine && this.qualifyingSector === 3 && progress >= totalLen * 0.95) {
        this.finishQualifying();
        return;
      }
    }

    if (p.hasPassedStartLine && p.distance > this.track.totalLength * 0.45 && p.distance < this.track.totalLength * 0.85) {
      p.halfwayChecked = true;
    }

    if (this.session === 'race' && p.halfwayChecked && crossedFinishLine) {
      p.halfwayChecked = false;
      this.completeTimedLap();
      const lapTime = this.sessionElapsed - this.lapStartElapsed;
      if (lapTime < this.bestLapTime) this.bestLapTime = lapTime;
      this.audio.playLap();

      if (this.lap >= this.totalLaps) {
        finished = true;
      } else {
        this.lap++;
        this.lapStartTime = now;
        this.lapStartElapsed = this.sessionElapsed;
        this.beginTimedLap();
        if (this.lap === this.totalLaps) this.notifyRace(`ÚLTIMA VOLTA! ${document.getElementById('raceNotice').textContent}`);
      }
    }

    this.sampleTimedLap();

    if (this.session === 'race') this.updateRacers(dt);
    if (finished) this.finishRace(now);

    const lookaheadDist = p.speed * 0.28;
    const targetCamX = p.x + Math.cos(p.angle) * lookaheadDist;
    const targetCamY = p.y + Math.sin(p.angle) * lookaheadDist;
    this.camera.x += (targetCamX - this.camera.x) * 4.5 * dt;
    this.camera.y += (targetCamY - this.camera.y) * 4.5 * dt;

    this.updateParticles(dt);
    this.audio.updateEngine(p.speed / p.maxSpeed);

    this.updateHUD(now);
  }

  constrainPlayerToTrack() {
    const p = this.player;
    const nearest = this.getNearestTrackPoint(p.x, p.y);
    const dx = p.x - nearest.pt.x;
    const dy = p.y - nearest.pt.y;
    const distance = Math.hypot(dx, dy);
    // Leave a runoff area beyond both edges of the road.
    const limit = this.track.width / 2 + 240;
    if (distance <= limit) return;

    p.x = nearest.pt.x + dx / distance * limit;
    p.y = nearest.pt.y + dy / distance * limit;
    p.speed = Math.min(p.speed, 80);
    // A position correction must not count as crossing the finish line.
    p.prevX = p.x;
    p.prevY = p.y;
  }

  getNearestTrackPoint(px, py) {
    let minDistSq = Infinity;
    let bestPoint = null;
    let bestDist = 0;
    const pts = this.track.points;
    for (let i = 0; i < pts.length; i++) {
      const start = pts[i];
      const end = pts[(i + 1) % pts.length];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq ? Math.max(0, Math.min(1, ((px - start.x) * dx + (py - start.y) * dy) / lengthSq)) : 0;
      const point = { x: start.x + dx * t, y: start.y + dy * t };
      const dSq = (px - point.x) ** 2 + (py - point.y) ** 2;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestPoint = point;
        bestDist = (this.track.distances[i] + Math.sqrt(lengthSq) * t) % this.track.totalLength;
      }
    }
    return {
      pt: bestPoint,
      dist: bestDist
    };
  }

  updateRacers(dt) {
    let carsAhead = 0;
    const totalLen = this.track.totalLength;
    const playerLapProgress = this.player.raceProgress;
    // Plan from the same snapshot so a car's decision does not depend on loop order.
    const playerPoint = this.track.getPointAtDistance(this.player.trackDist);
    const playerLane = (this.player.x - playerPoint.x) * playerPoint.nx +
      (this.player.y - playerPoint.y) * playerPoint.ny;
    const traffic = this.racers.map(car => ({
      car, trackDist: car.trackDist, laneOffset: car.laneOffset, speed: car.speed
    }));
    traffic.push({ car: this.player, trackDist: this.player.trackDist,
      laneOffset: playerLane, speed: this.player.speed * 2.1 / 2.2 });

    for (let i = 0; i < this.racers.length; i++) {
      const r = this.racers[i];
      r.decisionCooldown = Math.max(0, r.decisionCooldown - dt);
      r.mistakeTimer = Math.max(0, r.mistakeTimer - dt);
      const nearby = traffic.filter(other => other.car !== r).map(other => ({
        ...other, gap: (other.trackDist - r.trackDist + totalLen) % totalLen
      }));
      const blocker = nearby.filter(other => other.gap > 0 && other.gap < 210 &&
        Math.abs(r.targetLaneOffset - other.laneOffset) < 40)
        .sort((a, b) => a.gap - b.gap)[0];
      if (blocker && r.decisionCooldown === 0) {
        const passingLane = blocker.laneOffset >= 0 ? -55 : 55;
        const laneClear = nearby.every(other => Math.abs(other.laneOffset - passingLane) >= 40 ||
          (other.gap > 160 && other.gap < totalLen - 90));
        if (laneClear) {
          r.targetLaneOffset = passingLane;
          r.decisionCooldown = 1.2 + (1 - r.aggression);
        }
      }

      const chaser = nearby.filter(other => other.gap > totalLen - 230 && other.gap < totalLen - 85 &&
        other.speed > r.speed + 3).sort((a, b) => b.gap - a.gap)[0];
      if (!blocker && r.decisionCooldown === 0) {
        // Commit to one defensive move; never swerve into a car already alongside.
        const defendLane = chaser ? (chaser.laneOffset >= 0 ? 40 : -40) : 0;
        const safe = nearby.every(other => Math.abs(other.laneOffset - defendLane) >= 40 ||
          (other.gap > 110 && other.gap < totalLen - 100));
        if (safe) {
          r.targetLaneOffset = defendLane;
          r.decisionCooldown = chaser ? 2.8 : 1;
        }
      }

      // Read the approaching bend instead of taking every corner at full speed.
      const currentPoint = this.track.getTrackPosition(r.trackDist, 0);
      const nearPoint = this.track.getTrackPosition((r.trackDist + 100) % totalLen, 0);
      const farPoint = this.track.getTrackPosition((r.trackDist + 240) % totalLen, 0);
      const angleDelta = angle => Math.abs(Math.atan2(
        Math.sin(angle - currentPoint.angle), Math.cos(angle - currentPoint.angle)));
      const bend = Math.max(angleDelta(nearPoint.angle), angleDelta(farPoint.angle));
      const cornerPace = Math.max(0.72, 1 - bend * 0.32);
      if (bend > 0.3 && r.mistakeTimer === 0 && Math.random() < dt * 0.008 * r.aggression) {
        r.mistakeTimer = 0.6 + Math.random() * 0.8;
      }
      const rhythm = 1 + Math.sin(this.sessionElapsed * 0.19 + r.rhythm) * 0.018;
      let targetSpeed = r.maxSpeed * cornerPace * rhythm * (r.mistakeTimer > 0 ? 0.82 : 1);
      if (this.weather === 'rain') targetSpeed *= Math.max(0.73, 0.9 - bend * 0.12);
      if (blocker && blocker.gap > 90 && bend < 0.15) targetSpeed *= 1.015;
      for (const other of nearby) {
        if (other.gap > 0 && other.gap < 90 && Math.abs(r.laneOffset - other.laneOffset) < 32) {
          // Follow without applying a fresh percentage penalty on every frame.
          targetSpeed = Math.min(targetSpeed, other.speed * Math.max(0.45, other.gap / 90));
        }
      }
      // Match world acceleration during launch; bots use a different distance scale.
      const launchAcceleration = this.player.accel * 2.1 / 2.2;
      const acceleration = this.sessionElapsed <= 3 ? Math.min(r.accel, launchAcceleration) : r.accel;
      if (this.sessionElapsed <= 3) {
        targetSpeed = Math.min(targetSpeed, this.player.maxSpeed * 2.1 / 2.2);
      }
      r.speed = r.speed < targetSpeed
        ? Math.min(targetSpeed, r.speed + acceleration * dt)
        : Math.max(targetSpeed, r.speed - 260 * dt);

      r.laneOffset += (r.targetLaneOffset - r.laneOffset) * 2.5 * dt;
      r.trackDist += r.speed * 2.2 * dt;
      if (r.trackDist >= totalLen) {
        r.trackDist -= totalLen;
        r.lap++;
      }

      const trackPos = this.track.getTrackPosition(r.trackDist, r.laneOffset);
      r.x = trackPos.x;
      r.y = trackPos.y;
      r.angle = trackPos.angle;

      const distToPlayer = Math.hypot(r.x - this.player.x, r.y - this.player.y);
      r.contactCooldown = Math.max(0, (r.contactCooldown || 0) - dt);
      if (distToPlayer < 40 && r.contactCooldown === 0) {
        r.contactCooldown = 0.4;
        this.audio.playBump();
        if (!this.reducedEffects) this.shake = 5;
        const pushAngle = Math.atan2(this.player.y - r.y, this.player.x - r.x);
        this.player.x += Math.cos(pushAngle) * 5;
        this.player.y += Math.sin(pushAngle) * 5;
        this.player.speed *= 0.94;
        r.speed *= 0.94;
        this.addParticle(this.player.x, this.player.y, '#ffffff', 0.25);
      }

      const botLapProgress = (r.lap - 1) * totalLen + r.trackDist;
      if (botLapProgress > playerLapProgress) {
        carsAhead++;
      }
    }

    this.player.rank = Math.min(this.totalRacers, 1 + carsAhead);
  }

  getPlayerProgressIndex() {
    const nearest = this.getNearestTrackPoint(this.player.x, this.player.y);
    this.player.trackDist = nearest.dist;
    return nearest.dist;
  }

  addSkidmark(car) {
    if (this.skidmarks.length > 160) this.skidmarks.shift();
    this.skidmarks.push({
      x: car.x,
      y: car.y,
      alpha: 0.3,
      angle: car.angle
    });
  }

  addParticle(x, y, color, life = 0.4) {
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 35,
      vy: (Math.random() - 0.5) * 35,
      color,
      life,
      maxLife: life,
      size: 4 + Math.random() * 4
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateHUD(now) {
    this.updateRaceTelemetry();
    const penaltyEl = document.getElementById('trackLimitNotice');
    if (penaltyEl) {
      const remaining = this.trackLimitPenalty || 0;
      penaltyEl.hidden = remaining <= 0 || !this.raceStarted;
      penaltyEl.textContent = this.trackLimitExcursion && this.trackLimitRecovery === 0
        ? `FORA DA PISTA — VOLTE PARA CUMPRIR ${remaining.toFixed(1)}s DE PENALIDADE`
        : `PENALIDADE: ${remaining.toFixed(1)}s — LIMITE DE 80 KM/H`;
    }

    const speedEl = document.getElementById('hudSpeed');
    if (speedEl) speedEl.innerText = Math.floor(this.player.speed);

    const posEl = document.getElementById('hudPos');
    if (posEl) posEl.innerText = `${this.player.rank}º / ${this.totalRacers}`;

    const lapEl = document.getElementById('hudLap');
    if (lapEl) lapEl.innerText = `${this.track.name} • ${Math.min(this.lap, this.totalLaps)} / ${this.totalLaps}`;
    if (this.session === 'qualifying') {
      if (posEl) posEl.textContent = 'CLASSIFICAÇÃO';
      if (lapEl) lapEl.textContent = this.qualifyingStarted
        ? `${this.track.name} • VOLTA ÚNICA • SETOR ${Math.min(3, this.qualifyingSector + 1)}/3`
        : 'CRUZE A LINHA PARA INICIAR A VOLTA';
    }

    const timeEl = document.getElementById('hudTime');
    if (timeEl && this.raceStarted && !this.raceFinished) {
      const totalSec = this.sessionElapsed;
      timeEl.innerText = this.formatTime(totalSec);
      if (this.session === 'qualifying') {
        timeEl.textContent = this.formatTime(this.qualifyingStarted
          ? this.sessionElapsed - this.qualifyingStartTime : 0);
      }
    }

    const rpmRatio = Math.min(1.0, this.player.speed / this.player.maxSpeed);
    const rpmBar = document.getElementById('hudRpm');
    if (rpmBar) rpmBar.style.width = `${Math.floor(rpmRatio * 100)}%`;

    const leds = [
      document.getElementById('led1'),
      document.getElementById('led2'),
      document.getElementById('led3'),
      document.getElementById('led4'),
      document.getElementById('led5'),
      document.getElementById('led6')
    ];
    const numLit = Math.floor(rpmRatio * leds.length);
    leds.forEach((led, idx) => {
      if (!led) return;
      if (idx < numLit) led.classList.add('lit');
      else led.classList.remove('lit');
    });

    this.renderRadar();
  }

  renderRadar() {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(4, 12, 8, 0.9)';
    ctx.fillRect(0, 0, w, h);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let pt of this.track.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const pad = 250;
    minX -= pad; maxX += pad;
    minY -= pad; maxY += pad;

    const scaleX = w / (maxX - minX);
    const scaleY = h / (maxY - minY);

    const toRadarX = (wx) => (wx - minX) * scaleX;
    const toRadarY = (wy) => (wy - minY) * scaleY;

    ctx.strokeStyle = '#1d5e32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= this.track.points.length; i++) {
      const pt = this.track.points[i % this.track.points.length];
      const rx = toRadarX(pt.x);
      const ry = toRadarY(pt.y);
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    for (let r of this.racers) {
      ctx.beginPath();
      ctx.arc(toRadarX(r.x), toRadarY(r.y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(toRadarX(this.player.x), toRadarY(this.player.y), 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.arc(toRadarX(this.player.x), toRadarY(this.player.y), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  finishRace(now) {
    if (this.raceFinished) return;
    this.raceFinished = true;
    this.raceStarted = false;
    this.audio.playLap();

    const standings = this.racers.map(racer => ({
      name: racer.name,
      livery: racer.livery,
      number: racer.number,
      progress: (racer.lap - 1) * this.track.totalLength + racer.trackDist,
      isPlayer: false
    }));
    standings.push({ name: this.playerName, livery: this.player.livery, number: this.player.number,
      progress: this.player.raceProgress, isPlayer: true });
    // Use the same race progress as the position display when the player finishes.
    standings.sort((a, b) => b.progress - a.progress || Number(b.isPlayer) - Number(a.isPlayer));
    this.player.rank = standings.findIndex(driver => driver.isPlayer) + 1;
    const championshipResults = document.getElementById('championshipResults');
    championshipResults.hidden = this.raceMode !== 'championship';
    if (this.raceMode === 'championship' && this.championship && this.championship.round < 6) {
      const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0];
      standings.forEach((driver, index) => {
        const entry = this.championship.drivers.find(item => item.id === (driver.isPlayer ? 'player' : driver.name));
        if (entry) { entry.points += points[index]; entry.finishes.push(index + 1); }
      });
      this.championship.round++;
      this.saveChampionship();
      this.championshipTable(championshipResults);
    }
    document.getElementById('restartBtn').textContent = this.raceMode === 'championship'
      ? (this.championship.round < 6 ? 'PRÓXIMA ETAPA · CLASSIFICAÇÃO' : 'DISPUTAR NOVA TEMPORADA')
      : 'DISPUTAR NOVO GP';
    const podium = document.getElementById('podiumPlaces');
    podium.replaceChildren();
    standings.slice(0, 3).forEach((driver, index) => {
      const place = document.createElement('li');
      place.className = `podium-place podium-place-${index + 1}${driver.isPlayer ? ' podium-player' : ''}`;
      place.setAttribute('aria-label', `${index + 1}º lugar: ${driver.name}${driver.isPlayer ? ', você' : ''}`);
      const badge = document.createElement('span');
      badge.className = 'podium-badge';
      badge.textContent = ['CAMPEÃO', '2º LUGAR', '3º LUGAR'][index];
      badge.setAttribute('aria-hidden', 'true');
      const name = document.createElement('strong');
      name.className = 'podium-name';
      name.textContent = driver.name;
      const tag = document.createElement('span');
      tag.className = 'podium-driver-tag';
      tag.textContent = driver.isPlayer ? 'VOCÊ' : 'PILOTO';
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 120;
      canvas.className = 'podium-car';
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d');
      ctx.translate(120, 60);
      ctx.scale(2.3, 2.3);
      this.renderF1CarSprite(ctx, 0, 0, 0, driver.livery, '', driver.isPlayer, driver.number);
      const step = document.createElement('div');
      step.className = 'podium-step';
      step.textContent = String(index + 1).padStart(2, '0');
      step.setAttribute('aria-hidden', 'true');
      const raceNumber = document.createElement('span');
      raceNumber.className = 'podium-race-number';
      raceNumber.textContent = `CARRO #${driver.number || 1}`;
      place.append(badge, name, tag, canvas, raceNumber, step);
      podium.append(place);
    });

    const finishScreen = document.getElementById('finishScreen');
    const finishTitle = document.getElementById('finishTitle');
    const finishPos = document.getElementById('finishPos');
    const finishTime = document.getElementById('finishTime');
    const bestLapEl = document.getElementById('bestLapTime');
    const pilotEl = document.getElementById('finishPilotName');

    if (finishScreen) {
      finishScreen.style.display = 'flex';
      const stage = finishScreen.querySelector('.race-podium');
      stage.querySelector('.podium-confetti')?.remove();
      const confetti = document.createElement('div');
      confetti.className = 'podium-confetti';
      confetti.setAttribute('aria-hidden', 'true');
      const colors = ['#ffe15a', '#f44161', '#45ddc0', '#dbe7f3'];
      for (let i = 0; i < 42; i++) {
        const piece = document.createElement('i');
        piece.style.setProperty('--x', `${Math.random() * 100}%`);
        piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
        piece.style.setProperty('--delay', `${0.8 + Math.random() * 2}s`);
        piece.style.setProperty('--duration', `${2.5 + Math.random() * 2}s`);
        piece.style.setProperty('--color', colors[i % colors.length]);
        confetti.append(piece);
      }
      stage.append(confetti);
    }
    if (pilotEl) pilotEl.innerText = this.playerName;
    if (finishTitle) {
      finishTitle.innerText = this.player.rank === 1 ? 'VITÓRIA! P1 NO GRAND PRIX!' : 'BANDEIRA QUADRICULADA!';
    }
    if (finishPos) {
      finishPos.innerText = `VOCÊ TERMINOU EM ${this.player.rank}º LUGAR!`;
    }
    const totalSec = this.sessionElapsed;
    if (finishTime) finishTime.innerText = this.formatTime(totalSec);
    if (bestLapEl) bestLapEl.innerText = isFinite(this.bestLapTime) ? this.formatTime(this.bestLapTime) : '--:--.--';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    if (this.raceStarted && !this.reducedEffects && this.shake > 0) {
      ctx.translate(Math.sin(this.sessionElapsed * 93) * this.shake,
        Math.cos(this.sessionElapsed * 117) * this.shake * 0.65);
    }

    this.track.render(ctx, this.camera);

    ctx.save();
    ctx.translate(this.camera.width / 2, this.camera.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    for (let sm of this.skidmarks) {
      ctx.save();
      ctx.translate(sm.x, sm.y);
      ctx.rotate(sm.angle);
      ctx.fillStyle = `rgba(14, 12, 16, ${sm.alpha})`;
      ctx.fillRect(-12, -15, 24, 4);
      ctx.fillRect(-12, 11, 24, 4);
      ctx.restore();
    }

    const ghost = this.raceStarted ? this.ghostAtTime() : null;
    if (ghost) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      this.renderF1CarSprite(ctx, ghost.x, ghost.y, ghost.angle, this.player.livery, '', true);
      ctx.restore();
    }
    for (let r of this.racers) {
      this.renderF1CarSprite(ctx, r.x, r.y, r.angle, r.livery, r.name, false, r.number);
    }

    this.renderF1CarSprite(
      ctx,
      this.player.x,
      this.player.y,
      this.player.angle,
      this.player.livery,
      this.playerName,
      true
    );

    for (let pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (1 - alpha * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
    ctx.restore();
    this.renderRaceAtmosphere(ctx);
  }

  renderRaceAtmosphere(ctx) {
    if (!this.raceStarted && !this.countdownActive) return;
    const w = this.canvas.width, h = this.canvas.height;
    const time = this.sessionElapsed;
    ctx.save();
    if (this.weather === 'rain') {
      ctx.fillStyle = 'rgba(30, 58, 85, 0.16)';
      ctx.fillRect(0, 0, w, h);
      if (!this.reducedEffects) {
        ctx.strokeStyle = 'rgba(195, 224, 245, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 75; i++) {
          const x = ((i * 137.3 - time * 220) % (w + 40) + w + 40) % (w + 40) - 20;
          const y = (i * 83.7 + time * 580) % (h + 40) - 20;
          ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 18);
        }
        ctx.stroke();
      }
    }
    const speed = this.player.speed / this.player.maxSpeed;
    if (!this.reducedEffects && speed > 0.8) {
      ctx.strokeStyle = `rgba(219, 237, 255, ${(speed - 0.8) * 0.65})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 18; i++) {
        const angle = i * Math.PI * 2 / 18;
        const radius = 0.72 + ((time * 1.7 + i * 0.37) % 0.35);
        const x = Math.cos(angle) * w * 0.58, y = Math.sin(angle) * h * 0.58;
        ctx.moveTo(w / 2 + x * radius, h / 2 + y * radius);
        ctx.lineTo(w / 2 + x * (radius + 0.08), h / 2 + y * (radius + 0.08));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  renderF1CarSprite(ctx, x, y, angle, livery, pilotName, isPlayer, number = this.player.number || 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(3, 4, 34, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    let mainCol = '#d40000';
    let wingCol = '#111111';
    let accentCol = '#ffffff';

    if (livery === 'williams') { mainCol = '#002f6c'; wingCol = '#ffffff'; accentCol = '#ffd000'; }
    else if (livery === 'mclaren') { mainCol = '#ffffff'; wingCol = '#ff1801'; accentCol = '#ff1801'; }
    else if (livery === 'benetton') { mainCol = '#00a352'; wingCol = '#00c3e3'; accentCol = '#ffffff'; }
    else if (livery === 'jordan') { mainCol = '#ffe600'; wingCol = '#111111'; accentCol = '#00ffff'; }
    else if (livery === 'lotus') { mainCol = '#0b4a26'; wingCol = '#c5a059'; accentCol = '#ffd000'; }
    else if (livery === 'sauber') { mainCol = '#003882'; wingCol = '#ffffff'; accentCol = '#00d0ff'; }

    if (isPlayer && this.carPaint) {
      mainCol = this.carPaint.body;
      wingCol = this.carPaint.wing;
      accentCol = this.carPaint.accent;
    }

    // Reuse the menu illustration's geometry at race scale.
    if (!this.carSpritePaths) {
      this.carSpritePaths = [
        'M108 66L170 91M108 174L170 149M335 73L301 98M335 167L301 142',
        'M62 61H83V179H62Z',
        'M88 94L170 87L211 66L274 77L311 103L416 111L430 120L416 129L311 137L274 163L211 174L170 153L88 146Z',
        'M180 90L217 77L246 85L230 106H177ZM180 150L217 163L246 155L230 134H177Z',
        'M238 103L268 96L294 109V131L268 144L238 137Z',
        'M258 105L273 110V129L258 135Z',
        'M291 112H409V128H291',
        'M390 65H410V175H390Z',
        'M399 65H416V175H399',
        'M96 100H155V140H96Z',
        'M180 115H214V125H180ZM316 115H350V125H316Z',
        'M80 47H120M80 54H120M80 183H120M80 190H120M320 52H354M320 184H354'
      ].map(path => new Path2D(path));
      this.carTirePath = new Path2D();
      [[68, 38, 65, 53], [68, 149, 65, 53], [310, 43, 54, 48], [310, 149, 54, 48]]
        .forEach(([tx, ty, tw, th]) => {
          // Quadratic corners keep this compatible with older canvas engines.
          const r = 7;
          const path = this.carTirePath;
          path.moveTo(tx + r, ty);
          path.lineTo(tx + tw - r, ty);
          path.quadraticCurveTo(tx + tw, ty, tx + tw, ty + r);
          path.lineTo(tx + tw, ty + th - r);
          path.quadraticCurveTo(tx + tw, ty + th, tx + tw - r, ty + th);
          path.lineTo(tx + r, ty + th);
          path.quadraticCurveTo(tx, ty + th, tx, ty + th - r);
          path.lineTo(tx, ty + r);
          path.quadraticCurveTo(tx, ty, tx + r, ty);
          path.closePath();
        });
    }
    ctx.save();
    ctx.scale(0.2, 0.2);
    ctx.translate(-246, -120);
    ctx.strokeStyle = '#070a12';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    const paint = (index, color) => {
      ctx.fillStyle = color;
      ctx.fill(this.carSpritePaths[index]);
      ctx.stroke(this.carSpritePaths[index]);
    };
    ctx.strokeStyle = '#777d8b';
    ctx.lineWidth = 7;
    ctx.stroke(this.carSpritePaths[0]);
    ctx.strokeStyle = '#070a12';
    ctx.lineWidth = 4;
    const tires = ctx.createLinearGradient(0, 38, 0, 202);
    tires.addColorStop(0, '#3e414e');
    tires.addColorStop(0.4, '#11151e');
    tires.addColorStop(1, '#03050a');
    ctx.fillStyle = tires;
    ctx.fill(this.carTirePath);
    ctx.stroke(this.carTirePath);
    paint(1, mainCol);
    const body = ctx.createLinearGradient(0, 66, 0, 174);
    body.addColorStop(0, mainCol);
    body.addColorStop(0.5, mainCol);
    body.addColorStop(1, '#111827');
    paint(2, body);
    paint(3, mainCol);
    ctx.fillStyle = '#00000030';
    ctx.fill(this.carSpritePaths[3]);
    paint(4, '#101b2c');
    ctx.fillStyle = isPlayer ? '#ffe14b' : accentCol;
    ctx.beginPath();
    ctx.ellipse(263, 120, 17, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    paint(5, '#00bfc3');
    paint(6, mainCol);
    paint(7, accentCol);
    paint(8, wingCol);
    paint(9, accentCol);
    ctx.fillStyle = accentCol;
    ctx.fill(this.carSpritePaths[10]);
    ctx.strokeStyle = '#64717f';
    ctx.lineWidth = 2;
    ctx.stroke(this.carSpritePaths[11]);
    ctx.fillStyle = '#14151d';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(number), 119, 128, 38);
    ctx.restore();
    const isBraking = isPlayer ? this.keys.brake : false;
    ctx.fillStyle = isBraking ? '#ff0033' : '#440008';
    ctx.fillRect(-22, -2, 3, 4);
    if (isBraking) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 8;
      ctx.fillRect(-22, -2, 3, 4);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    if (!pilotName) return;

    ctx.save();
    ctx.translate(x, y - 30);
    ctx.fillStyle = isPlayer ? 'rgba(255, 0, 68, 0.92)' : 'rgba(10, 6, 24, 0.86)';
    ctx.strokeStyle = isPlayer ? '#ffd000' : '#00ffff';
    ctx.lineWidth = 1.5;

    const tagText = isPlayer ? `⭐ ${pilotName}` : pilotName;
    ctx.font = 'bold 8px monospace';
    const txtW = ctx.measureText(tagText).width;

    ctx.fillRect(-txtW / 2 - 5, -8, txtW + 10, 15);
    ctx.strokeRect(-txtW / 2 - 5, -8, txtW + 10, 15);

    ctx.fillStyle = isPlayer ? '#ffffff' : '#ffe600';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, 0, 0);

    ctx.restore();
  }
}

// Inicia o jogo automaticamente após o carregamento da página
window.addEventListener('load', () => {
  new TopDownF1Game();
});
