// Disassembly — prototype v2 (with face detection)
// A study of "Disassembly" by Irregular: the webcam feed is fragmented
// into a black-and-white mosaic with one red focal square in the middle.
//
// Behaviour
//   No face:   tiny noisy grid + a solid red anchor square
//   Face:      mosaic of varied tiles + your face in the red square
//
// Controls
//   SPACE  force the "face" state on/off (handy for testing without a face)
//   D      debug strip (camera pipeline + face status)
//   R      re-roll the layout right now
//   L      toggle the LED screen texture

// ---------- settings to play with ----------
const ROWS = 6;            // canvas height in base units
const CENTER = 4;          // red square size in base units (sits on rows 1–4)
const GRAY_RES = 320;      // resolution of the shared grayscale camera frame
const RED_RES = 160;       // resolution of the red square (lower = chunkier)
const RED_ZOOM = 1.8;      // how far the red square zooms into the feed
const HOLD_TIMES = [5000, 6000, 8000, 10000]; // ms a layout holds before re-rolling
const MAX_DEPTH = 2;       // how many times a 1-unit cell may split into four
const GAP = 2;             // px seam between mosaic cells
const LED_PITCH = 4;       // px spacing of the LED texture
const FACE_HOLD_MS = 500;  // a face must stay this long before the mosaic appears
const FACE_LOST_MS = 1000; // how long without a face before it goes back to noise

// ---------- state ----------
let video, camBuf, grayBuf, redBuf, ledBuf, tileBuf, rowBuf;
let u, cols, centerCol;
let cells = [];
let idleSize;
let flipOffset = 0;
let standing = false;
let showLed = true;
let nextChange = 0;
let showDebug = false;

// face detection (ml5)
let faceMesh = null;
let faces = [];
let faceSince = null;       // when the current face was first seen
let lastFaceAt = -Infinity; // last time a face was seen
let forceStanding = false;  // SPACE override

function preload() {
  if (typeof ml5 !== 'undefined') {
    faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: false });
  } else {
    console.warn('ml5 did not load; use SPACE to switch states by hand.');
  }
}

function setup() {
  pixelDensity(1); // keeps all the buffers light, especially on Retina
  video = createCapture(VIDEO);
  video.elt.setAttribute('playsinline', ''); // Safari
  // Instead of video.hide(): Safari can hand back black frames from a
  // display:none video, so keep it "visible" but transparent.
  video.style('position', 'absolute');
  video.style('top', '0');
  video.style('left', '0');
  video.style('opacity', '0');
  video.style('pointer-events', 'none');

  grayBuf = createGraphics(GRAY_RES, GRAY_RES);
  redBuf = createGraphics(RED_RES, RED_RES);
  redBuf.noStroke();

  sizeCanvas(true);
  reroll();

  if (faceMesh) faceMesh.detectStart(video, (results) => { faces = results; });
}

function draw() {
  background(12);

  if (video.elt.readyState < 2) {
    showMessage('Waiting for the camera. Allow access in Safari if it asks.');
    return;
  }

  try {
    updateGray();
    updatePresence();
    if (millis() > nextChange) reroll();

    if (standing) {
      for (const c of cells) drawCell(c);
      drawRedSquare();
    } else {
      drawIdle();
      drawAnchor();
    }

    if (showLed) image(ledBuf, 0, 0);
    if (showDebug) drawDebug();
  } catch (err) {
    console.error(err);
    showMessage('Error: ' + err.message);
    noLoop();
  }
}

// Switch between the two states with a little patience either way,
// so a blink or a quick head turn doesn't make the wall flicker.
function updatePresence() {
  const now = millis();
  if (faces.length > 0) {
    if (faceSince === null) faceSince = now;
    lastFaceAt = now;
  } else {
    faceSince = null;
  }

  let want;
  if (forceStanding) want = true;
  else if (standing) want = now - lastFaceAt < FACE_LOST_MS;
  else want = faceSince !== null && now - faceSince > FACE_HOLD_MS;

  if (want !== standing) {
    standing = want;
    reroll(); // fresh layout every time someone arrives or leaves
  }
}

// Solid red anchor square, shown while nobody is in front of the camera.
function drawAnchor() {
  push();
  noStroke();
  fill(255, 30, 25);
  rect(centerCol * u, u, CENTER * u, CENTER * u);
  pop();
}

// Three small previews, one per step of the camera pipeline, plus face status.
function drawDebug() {
  push();
  noStroke();
  fill(0, 200);
  rect(0, 0, 580, 160);
  image(video, 10, 10, 160, 120);
  image(camBuf, 180, 10, 160, 120);
  image(grayBuf, 350, 10, 120, 120);
  fill(255);
  textSize(12);
  textAlign(LEFT, TOP);
  text('1 raw video', 10, 136);
  text('2 camBuf', 180, 136);
  text('3 grayBuf', 350, 136);
  text('face: ' + (faces.length > 0 ? 'yes' : 'no') + (forceStanding ? ' (forced)' : ''), 480, 136);
  pop();
}

function showMessage(msg) {
  push();
  fill(255);
  noStroke();
  textSize(20);
  textAlign(CENTER, CENTER);
  text(msg, width / 2, height / 2);
  pop();
}

// ---------- camera ----------

// Mirror the webcam, crop it square and make it grayscale, once per frame.
// Every cell then just samples from this one small buffer.
function updateGray() {
  if (!camBuf) {
    const a = video.elt.videoWidth / video.elt.videoHeight;
    camBuf = createGraphics(round(GRAY_RES * max(a, 1)), round(GRAY_RES / min(a, 1)));
  }
  camBuf.image(video, 0, 0, camBuf.width, camBuf.height);

  const side = min(camBuf.width, camBuf.height);
  const sx = (camBuf.width - side) / 2;
  const sy = (camBuf.height - side) / 2;

  grayBuf.push();
  grayBuf.translate(GRAY_RES, 0);
  grayBuf.scale(-1, 1);
  grayBuf.image(camBuf, 0, 0, GRAY_RES, GRAY_RES, sx, sy, side, side);
  grayBuf.pop();
  grayBuf.filter(GRAY, false); // false = CPU filter, more reliable on buffers in Safari
}

// ---------- layout ----------

function reroll() {
  buildLayout();
  idleSize = max(8, round(u / random([4, 5, 6, 8])));
  rebuildIdleBuffers();
  nextChange = millis() + random(HOLD_TIMES);
}

// Start from a grid of 1-unit squares, reserve the red square,
// merge some free spots into big 2x2 tiles, then let the rest
// randomly split into 4, and maybe into 4 again.
function buildLayout() {
  cells = [];
  flipOffset = floor(random(2));

  const free = [];
  for (let c = 0; c < cols; c++) {
    free[c] = [];
    for (let r = 0; r < ROWS; r++) {
      const inRed = c >= centerCol && c < centerCol + CENTER && r >= 1 && r < 1 + CENTER;
      free[c][r] = !inRed;
    }
  }

  // each layout gets its own "mood": calmer or busier
  const pBig = random(0.3, 0.9);
  const pSplit = [random(0.15, 0.6), random(0.2, 0.7)];

  // big 2x2 tiles
  for (let r = 0; r < ROWS - 1; r += 2) {
    for (let c = 0; c < cols - 1; c++) {
      const fits = free[c][r] && free[c + 1][r] && free[c][r + 1] && free[c + 1][r + 1];
      if (fits && random() < pBig) {
        free[c][r] = free[c + 1][r] = free[c][r + 1] = free[c + 1][r + 1] = false;
        addCell(c * u, r * u, 2 * u);
      }
    }
  }

  // everything left is a 1-unit square that may split
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (!free[c][r]) continue;
      // the strips directly above and below the red square always go small
      const strip = (r === 0 || r === ROWS - 1) && c >= centerCol && c < centerCol + CENTER;
      subdivide(c * u, r * u, u, strip ? 1 : 0, pSplit, 0);
    }
  }
}

function subdivide(x, y, s, minDepth, pSplit, depth) {
  if (depth < MAX_DEPTH && (depth < minDepth || random() < pSplit[depth])) {
    const h = s / 2;
    subdivide(x, y, h, minDepth, pSplit, depth + 1);
    subdivide(x + h, y, h, minDepth, pSplit, depth + 1);
    subdivide(x, y + h, h, minDepth, pSplit, depth + 1);
    subdivide(x + h, y + h, h, minDepth, pSplit, depth + 1);
  } else {
    addCell(x, y, s);
  }
}

function addCell(x, y, s) {
  const col = round(x / s);               // column index among cells of this size
  cells.push({
    x, y, s,
    flip: (col + flipOffset) % 2 === 1,   // alternate upright / upside down per column
    zoom: s >= u ? random([1, 1.4, 1.9]) : random([1, 1.2]), // big tiles zoom in more
    fx: random(0.35, 0.65),               // where the zoomed crop sits
    fy: random(0.35, 0.65),
  });
}

// ---------- drawing ----------

function drawCell(c) {
  const sw = GRAY_RES / c.zoom;
  const sx = c.fx * (GRAY_RES - sw);
  const sy = c.fy * (GRAY_RES - sw);
  const s = c.s - GAP;

  push();
  if (c.flip) {
    translate(c.x, c.y + c.s);
    scale(1, -1);
    image(grayBuf, GAP / 2, GAP / 2, s, s, sx, sy, sw, sw);
  } else {
    image(grayBuf, c.x + GAP / 2, c.y + GAP / 2, s, s, sx, sy, sw, sw);
  }
  pop();
}

function drawRedSquare() {
  const sw = GRAY_RES / RED_ZOOM;
  const sx = (GRAY_RES - sw) / 2;

  redBuf.blendMode(BLEND);
  redBuf.image(grayBuf, 0, 0, RED_RES, RED_RES, sx, sx, sw, sw);
  redBuf.blendMode(MULTIPLY);           // grayscale × red = black-to-red
  redBuf.fill(255, 30, 25);
  redBuf.rect(0, 0, RED_RES, RED_RES);
  redBuf.blendMode(SCREEN);             // lift the blacks to a deep red
  redBuf.fill(70, 0, 0);
  redBuf.rect(0, 0, RED_RES, RED_RES);
  redBuf.blendMode(BLEND);

  image(redBuf, centerCol * u, u, CENTER * u, CENTER * u);
}

// "Passing by": the whole wall is one tiny repeating tile.
// Build an upright + flipped pair once, repeat it into a row,
// then repeat the row down the canvas. Cheap, even with thousands of tiles.
function drawIdle() {
  const s = idleSize;

  tileBuf.background(12);
  tileBuf.image(grayBuf, 0, 0, s - 1, s - 1);
  tileBuf.push();
  tileBuf.translate(s, s);
  tileBuf.scale(1, -1);
  tileBuf.image(grayBuf, 0, 1, s - 1, s - 1);
  tileBuf.pop();

  for (let x = 0; x < width; x += 2 * s) rowBuf.image(tileBuf, x, 0);
  for (let y = 0; y < height; y += s) image(rowBuf, 0, y);
}

// ---------- buffers & sizing ----------

function rebuildIdleBuffers() {
  if (tileBuf) tileBuf.remove();
  if (rowBuf) rowBuf.remove();
  tileBuf = createGraphics(idleSize * 2, idleSize);
  rowBuf = createGraphics(width, idleSize);
}

function buildLed() {
  if (ledBuf) ledBuf.remove();
  ledBuf = createGraphics(width, height);
  ledBuf.stroke(0, 90);
  ledBuf.strokeWeight(1);
  for (let x = 0; x < width; x += LED_PITCH) ledBuf.line(x + 0.5, 0, x + 0.5, height);
  for (let y = 0; y < height; y += LED_PITCH) ledBuf.line(0, y + 0.5, width, y + 0.5);
}

// Canvas is always a whole number of units wide, so the grid snaps cleanly.
function sizeCanvas(first) {
  u = floor(min(windowHeight / ROWS, windowWidth / (CENTER + 4)));
  cols = floor(windowWidth / u);
  centerCol = floor((cols - CENTER) / 2);
  if (first) createCanvas(cols * u, ROWS * u);
  else resizeCanvas(cols * u, ROWS * u);
  buildLed();
}

function windowResized() {
  sizeCanvas(false);
  reroll();
}

function keyPressed() {
  if (key === ' ') forceStanding = !forceStanding;
  if (key === 'r' || key === 'R') reroll();
  if (key === 'l' || key === 'L') showLed = !showLed;
  if (key === 'd' || key === 'D') showDebug = !showDebug;
  return false;
}
