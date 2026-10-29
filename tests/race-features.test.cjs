/* Run with: node tests/race-features.test.cjs */
function runRaceFeatureTests(source) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const elements = new Map();
  const makeNode = () => ({
    style: { setProperty() {} }, classList: { add() {}, remove() {} }, dataset: {}, value: '3', hidden: false, textContent: '', children: [],
    setAttribute() {}, addEventListener() {}, replaceChildren() { this.children = []; },
    append(...nodes) { this.children.push(...nodes); }, appendChild(node) { this.children.push(node); },
    querySelector(selector) { return selector === '.podium-confetti' ? null : makeNode(); },
    createTHead() { return { insertRow: makeNode }; },
    createTBody() { return { insertRow: () => ({ ...makeNode(), insertCell: makeNode }) }; },
    getContext() { return { translate() {}, scale() {} }; }
  });
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, makeNode()); return elements.get(id); },
    querySelectorAll() { return []; }, createElement: makeNode
  };
  const saved = new Map();
  const storage = {
    getItem: key => saved.get(key) || null,
    setItem(key, value) { saved.set(key, value); }, removeItem(key) { saved.delete(key); }
  };
  const timers = [];
  const { Game, Track, Audio } = new Function('window', 'document', 'localStorage', 'setTimeout', 'performance', source +
    '\nreturn { Game: TopDownF1Game, Track: TopDownTrack, Audio: RetroSoundEngine };')(
    { addEventListener() {}, matchMedia() { return { matches: true }; } }, document, storage,
    callback => { timers.push(callback); }, { now: () => 1000 });
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    selectedTrack: 'interlagos', difficulty: 'medium', sessionElapsed: 0,
    player: { x: 0, y: 0, angle: 0, raceProgress: 0 }, track: { totalLength: 1000 }
  });
  g.setupRaceFeatures();
  assert(g.reducedEffects, 'Respect reduced-motion preference');
  const runLap = (duration, valid = true) => {
    g.sessionElapsed = 0; Object.assign(g.player, { x: 0, y: 0, raceProgress: 0 }); g.beginTimedLap();
    for (let i = 1; i <= 10; i++) {
      g.sessionElapsed = duration * i / 10;
      Object.assign(g.player, { x: i * 10, y: i * 2, raceProgress: i * 100 });
      g.sampleTimedLap();
    }
    g.timedLap.valid = valid;
    g.completeTimedLap();
  };
  runLap(60);
  assert(g.record.time === 60 && saved.has(g.recordKey()), 'Save a complete valid record');
  runLap(50, false);
  assert(g.record.time === 60, 'Reject invalid laps');
  runLap(65);
  assert(g.record.time === 60, 'Keep faster record');
  runLap(55);
  assert(g.record.time === 55, 'Replace record with faster lap');
  g.resetLapFeatures();
  assert(g.record.time === 55, 'Reload record');
  g.sessionElapsed = 0; g.player.raceProgress = 0; g.beginTimedLap();
  g.sessionElapsed = 2.75;
  const ghost = g.ghostAtTime();
  assert(Math.abs(ghost.x - 5) < 0.001, 'Interpolate ghost between recorded samples');
  assert(g.player.x === 100, 'Ghost does not change player position');
  g.record = { time: 2, samples: [
    { t: 0, x: 0, y: 0, angle: 3.1, progress: 0 },
    { t: 2, x: 20, y: 10, angle: -3.1, progress: 1000 }
  ] };
  g.sessionElapsed = 1; g.ghostCursor = 0;
  assert(Math.abs(g.ghostAtTime().angle - Math.PI) < 0.01, 'Interpolate across angle wrap');
  g.ghostEnabled = false;
  assert(g.ghostAtTime() === null, 'Ghost toggle');
  g.ghostEnabled = true;
  const dryKey = g.recordKey(); g.weather = 'rain';
  assert(g.recordKey() !== dryKey, 'Separate wet and dry records');
  g.resetLapFeatures(); assert(!g.record, 'No dry ghost in wet conditions');
  g.difficulty = 'hard';
  assert(g.recordKey() !== dryKey, 'Separate difficulty records');
  g.difficulty = 'medium'; g.weather = 'dry'; g.resetLapFeatures();
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  runLap(45);
  assert(g.recordSaveFailed, 'Report storage failure');
  g.resetLapFeatures();
  assert(g.record.time === 45 && g.recordSaveFailed, 'Keep unsaved faster record in memory');
  storage.setItem = (key, value) => saved.set(key, value);

  // Exercise the actual player update with real circuit geometry.
  const physics = weather => {
    const game = Object.create(Game.prototype);
    game.track = new Track('interlagos');
    const point = game.track.getTrackPosition(1000, 0);
    Object.assign(game, {
      weather, reducedEffects: true, raceStarted: true, session: 'test', sessionElapsed: 0,
      keys: { brake: true, left: false, right: false },
      player: { x: point.x, y: point.y, angle: point.angle, speed: 200, maxSpeed: 300,
        brake: 240, accel: 105, steerSpeed: 2.15, trackDist: 1000, raceProgress: 1000 },
      camera: { x: point.x, y: point.y }, shake: 0, kerbCooldown: 0, sprayCooldown: 0,
      trackLimitPenalty: 0, trackLimitRecovery: 0, trackLimitExcursion: false,
      audio: { updateEngine() {}, playKerb() {} },
      addParticle() {}, addSkidmark() {}, updateParticles() {}, updateHUD() {}
    });
    game.update(0.05, 1000);
    return game.player.speed;
  };
  assert(Math.abs(physics('dry') - 188) < 0.001, 'Dry braking');
  assert(Math.abs(physics('rain') - 192.2) < 0.001, 'Rain increases braking distance');

  // Both cars use the same weather modifiers and remain numerically stable.
  g.track = new Track('interlagos'); g.sessionElapsed = 10;
  g.player = { trackDist: 4000, raceProgress: 4000, speed: 200, accel: 105, maxSpeed: 300, x: 9999, y: 9999 };
  g.totalRacers = 12; g.audio = { playBump() {} }; g.addParticle = () => {};
  const car = (distance, lane, speed) => ({ trackDist: distance, laneOffset: lane, targetLaneOffset: lane,
    speed, maxSpeed: 270, accel: 100, lap: 1, aggression: 0.7, rhythm: 1, decisionCooldown: 0, mistakeTimer: 0 });
  g.racers = [car(1000, 0, 240), car(1130, 0, 180)]; g.updateRacers(0.016);
  assert(g.racers[0].targetLaneOffset === -55, 'Overtake slower car');
  g.weather = 'rain';
  for (let i = 0; i < 3000; i++) {
    g.sessionElapsed += 0.016; g.updateRacers(0.016);
    assert(g.racers.every(r => [r.speed, r.x, r.y, r.trackDist].every(Number.isFinite)), 'Finite AI state in rain');
  }

  // Full season regression: points and one-time accounting still work.
  Object.assign(g, { playerName: 'TEST', difficulty: 'medium', player: { raceProgress: 200 },
    track: { totalLength: 1000 }, totalStartTime: 0, bestLapTime: 20, sessionElapsed: 60,
    audio: { playLap() {} }, renderF1CarSprite() {},
    initGrid() { this.racers = Array.from({ length: 11 }, (_, i) => ({ name: 'BOT ' + i, lap: 1, trackDist: 100 - i })); }
  });
  document.getElementById('raceWeather').value = 'rain';
  g.setupChampionship(); g.createChampionship(); g.raceMode = 'championship';
  assert(g.championship.weather === 'rain', 'Save championship weather');
  for (let round = 1; round <= 6; round++) {
    g.raceFinished = false; g.finishRace(999999); g.finishRace(999999);
    assert(g.championship.round === round, 'Count race once');
  }
  assert(g.championship.drivers.find(driver => driver.id === 'player').points === 150, 'Six victories = 150 points');
  assert(document.getElementById('finishTime').innerText === '01:00.00', 'Use simulation time, excluding pauses');
  const resumed = Object.create(Game.prototype); resumed.setupChampionship();
  assert(resumed.championship.round === 6 && resumed.championship.weather === 'rain', 'Restore championship');
  const legacySeason = JSON.parse(storage.getItem('f1-championship-v1'));
  legacySeason.drivers[1].id = legacySeason.drivers[1].name = 'M. SCHUMACHER';
  storage.setItem('f1-championship-v1', JSON.stringify(legacySeason));
  const migrated = Object.create(Game.prototype); migrated.setupChampionship();
  assert(migrated.championship.drivers[1].id === 'M. COSTA' &&
    migrated.championship.drivers[1].points === legacySeason.drivers[1].points, 'Rebrand preserves championship points');

  // Canvas pass checks balanced save/restore and honors reduced visual effects.
  let depth = 0, strokes = 0;
  const context = new Proxy({}, { get(target, key) {
    if (key === 'save') return () => depth++;
    if (key === 'restore') return () => depth--;
    if (key === 'stroke') return () => strokes++;
    return () => {};
  }, set() { return true; } });
  g.canvas = { width: 960, height: 600 }; g.ctx = context;
  g.camera = { width: 960, height: 600, x: 0, y: 0, zoom: 1 };
  g.track = { render() {} }; g.skidmarks = []; g.racers = []; g.particles = [];
  g.player = { speed: 290, maxSpeed: 300 }; g.raceStarted = true; g.weather = 'rain';
  g.timedLap = null; g.reducedEffects = false; g.render();
  assert(depth === 0 && strokes > 0, 'Balanced rendering with rain and speed streaks');
  strokes = 0; g.reducedEffects = true; g.render();
  assert(depth === 0 && strokes === 0, 'Reduced effects disable animated overlays');

  const audio = new Audio();
  audio.updateEngine(0.8); audio.playKerb();

  // Backgrounding/pausing must not advance lights or release the grid.
  const countdown = Object.create(Game.prototype);
  let beeps = 0;
  Object.assign(countdown, { sessionToken: 1, isPaused: true, player: {}, racers: [], totalLaps: 3,
    audio: { playBeep() { beeps++; }, startMusic() {} } });
  countdown.startF1Countdown(); timers.shift()();
  assert(beeps === 0, 'Paused countdown does not advance lights');
  countdown.isPaused = false;
  for (let i = 0; i < 6; i++) timers.shift()();
  assert(beeps === 5, 'Five red lights');
  countdown.isPaused = true; timers.shift()();
  assert(!countdown.raceStarted && beeps === 5, 'Paused grid cannot launch');
  countdown.isPaused = false; timers.shift()();
  assert(countdown.raceStarted && beeps === 6, 'Resume releases grid');
  countdown.sessionToken++; timers.shift()();
  return 'PASS: records, ghost, storage failure, rain physics, AI, championship, pause-safe timing, rendering, audio and countdown pause';
}

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  console.log(runRaceFeatureTests(fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8')));
}
