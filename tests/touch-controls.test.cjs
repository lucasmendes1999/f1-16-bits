/* Run with: node tests/touch-controls.test.cjs */
function runTouchTests(source) {
  const assert = (value, message) => { if (!value) throw Error(message); };
  const target = () => ({ handlers: {}, addEventListener(name, callback) { this.handlers[name] = callback; } });
  const win = { ...target(), ontouchstart: null };
  function element(left, right) {
    return { ...target(), classList: { toggle() {} }, setPointerCapture() {},
      getBoundingClientRect() { return { left, right, top: 300, bottom: 372, width: right - left }; } };
  }
  const pad = element(28, 184), left = element(28, 100), right = element(112, 184), brake = element(600, 672);
  const document = { ...target(), querySelector: () => pad,
    getElementById: id => ({ tLeft: left, tRight: right, tBrake: brake })[id] };
  const Game = new Function('window', 'document', source + '\nreturn TopDownF1Game;')(win, document);
  const game = Object.create(Game.prototype);
  game.keys = { left: false, right: false, brake: false };
  game.setupTouchControls();
  const fire = (node, name, event = {}) => node.handlers[name]?.({ preventDefault() {}, ...event });
  const touch = (node, name, identifier, clientX) => fire(node, name,
    { changedTouches: [{ identifier, clientX, clientY: 335 }] });
  const pointer = (node, name, pointerId, clientX, pointerType = 'mouse') => fire(node, name,
    { pointerId, clientX, clientY: 335, pointerType, button: 0 });

  pointer(pad, 'pointerdown', 1, 55, 'touch');
  assert(!game.keys.left, 'Touch pointer stream must not duplicate Touch Events');
  touch(pad, 'touchstart', 1, 55);
  assert(game.keys.left && !game.keys.right, 'Left responds immediately');
  pointer(pad, 'lostpointercapture', 1, 55, 'touch');
  assert(game.keys.left, 'Capture loss must not cancel a held finger');
  for (let i = 0; i < 100; i++) {
    touch(pad, 'touchmove', 1, [102, 110, -30, 115][i % 4]);
    assert(game.keys.left && !game.keys.right, 'Held left survives repeated thumb drift');
  }
  touch(brake, 'touchstart', 3, 630);
  assert(game.keys.left && game.keys.brake, 'Steering and brake together');
  touch(win, 'touchend', 3, 630);
  assert(game.keys.left && !game.keys.brake, 'Lifting brake does not release steering');
  touch(pad, 'touchmove', 1, 135);
  assert(game.keys.right && !game.keys.left, 'Deliberate slide changes direction');
  touch(win, 'touchend', 1, 135);
  assert(!game.keys.left && !game.keys.right, 'Release outside controls stops steering');
  touch(pad, 'touchstart', 1, 55); touch(pad, 'touchstart', 2, 145);
  assert(game.keys.right && !game.keys.left, 'Latest finger wins');
  touch(win, 'touchcancel', 2, 145);
  assert(game.keys.left && !game.keys.right, 'Cancel only removes its own touch');
  fire(win, 'blur');
  assert(!game.keys.left && !game.keys.brake, 'Background resets controls');
  touch(win, 'touchend', 1, 55);
  assert(!game.keys.left, 'Old touch cannot restart steering after reset');

  pad.setPointerCapture = () => { throw Error('Capture unavailable'); };
  pointer(pad, 'pointerdown', 7, 55);
  assert(game.keys.left, 'Mouse/pen fallback survives capture failure');
  pointer(pad, 'lostpointercapture', 7, 55);
  assert(game.keys.left, 'Mouse capture loss does not discard press');
  pointer(win, 'pointermove', 7, 135);
  assert(game.keys.right && !game.keys.left, 'Window receives motion after capture failure');
  pointer(win, 'pointerup', 7, 135);
  assert(!game.keys.left && !game.keys.right, 'Window release prevents stuck steering');
  pointer(pad, 'pointerdown', 8, 55);
  pointer(win, 'pointercancel', 8, 55);
  assert(!game.keys.left, 'Pointer cancellation releases steering');
  touch(pad, 'touchstart', 9, 55); game.resetControls();
  assert(!game.keys.left && !game.keys.right && !game.keys.brake, 'Pause reset clears input');
  return 'PASS: Android touch hold, capture loss, repeated drift, multitouch brake, global release/cancel, mouse fallback and pause';
}
if (typeof module !== 'undefined' && require.main === module) {
  console.log(runTouchTests(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'game.js'), 'utf8')));
}