// ─── INSTELLINGEN ─────────────────────────────────────────────────────────────
let speed = 1;
let targetSpeed = 1;
let currentSpeedZone = 0;

const MIN_SPEED = 0.5;
const MAX_SPEED = 18;
const SPEED_ZONE_BOUNDARIES = [0.12, 0.14, 0.16, 0.2];
const SPEED_ZONE_VALUES = [MIN_SPEED, 4, 8, 12, MAX_SPEED];
const ZONE_HYSTERESIS = 0.015;

const BASE_W = 700;
const BASE_H = 1000;

// Smoothing buffer
const BUFFER_SIZE = 20;
let faceSizeBuffer = [];
let smoothFaceSize = 0;

// Camera blokkeer staat
let wasBlocked = false;
let isBlocked = false;

// Particles
let particles = [];

// ─── BALKEN DEFINITIE ─────────────────────────────────────────────────────────
let bars = [];

// Explosie / herstel timing
let explodeQueue = [];
let restoreQueue = [];
let lastExplodeTime = 0;
let lastRestoreTime = 0;
const BAR_INTERVAL = 380;

function getTargetSpeedFromFaceSize(faceSize) {
  while (
    currentSpeedZone < SPEED_ZONE_BOUNDARIES.length &&
    faceSize > SPEED_ZONE_BOUNDARIES[currentSpeedZone] + ZONE_HYSTERESIS
  ) {
    currentSpeedZone++;
  }

  while (
    currentSpeedZone > 0 &&
    faceSize < SPEED_ZONE_BOUNDARIES[currentSpeedZone - 1] - ZONE_HYSTERESIS
  ) {
    currentSpeedZone--;
  }

  return SPEED_ZONE_VALUES[currentSpeedZone];
}

function initBars() {
  bars = [
    // RAND 1
    { id: 0,  x: 0,   y: 0,   w: 630, h: 70,  fill: [254,108,248], word: "CHAOS",    ori: "horizontal", dir:  1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    { id: 1,  x: 630, y: 0,   w: 70,  h: 930, fill: [254,0,0],     word: "NOISE",    ori: "vertical",   dir:  1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    { id: 2,  x: 70,  y: 930, w: 630, h: 70,  fill: [0,0,0],       word: "STATIC",   ori: "horizontal", dir: -1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    { id: 3,  x: 0,   y: 70,  w: 70,  h: 930, fill: [255,255,255], word: "DOPAMINE", ori: "vertical",   dir: -1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    // RAND 2
    { id: 4,  x: 70,  y: 70,  w: 490, h: 70,  fill: [0,0,0],       word: "PING",     ori: "horizontal", dir:  1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    { id: 5,  x: 560, y: 70,  w: 70,  h: 790, fill: [255,255,255], word: "RUSH",     ori: "vertical",   dir:  1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    { id: 6,  x: 140, y: 860, w: 490, h: 70,  fill: [254,108,248], word: "GLITCH",   ori: "horizontal", dir: -1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    { id: 7,  x: 70,  y: 140, w: 70,  h: 790, fill: [254,0,0],     word: "LIKES",    ori: "vertical",   dir: -1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    // RAND 3
    { id: 8,  x: 140, y: 140, w: 350, h: 70,  fill: [255,255,255], word: "SWIPE",    ori: "horizontal", dir:  1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    { id: 9,  x: 490, y: 140, w: 70,  h: 650, fill: [254,108,248], word: "CLICK",    ori: "vertical",   dir:  1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    { id: 10, x: 210, y: 790, w: 350, h: 70,  fill: [254,0,0],     word: "SPAM",     ori: "horizontal", dir: -1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    { id: 11, x: 140, y: 210, w: 70,  h: 650, fill: [0,0,0],       word: "ERROR",    ori: "vertical",   dir: -1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    // RAND 4
    { id: 12, x: 210, y: 210, w: 210, h: 70,  fill: [254,0,0],     word: "TRIGGER",  ori: "horizontal", dir:  1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    { id: 13, x: 420, y: 210, w: 70,  h: 510, fill: [0,0,0],       word: "ALERT",    ori: "vertical",   dir:  1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
    { id: 14, x: 280, y: 720, w: 210, h: 70,  fill: [255,255,255], word: "@   #",    ori: "horizontal", dir: -1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    { id: 15, x: 210, y: 280, w: 70,  h: 510, fill: [254,108,248], word: "FOMO",     ori: "vertical",   dir: -1, txtCol: [0,0,0],       state: "visible", glitchTimer: 0 },
    // MIDDEN
    { id: 16, x: 280, y: 280, w: 140, h: 440, fill: [20,20,20],    word: "",         ori: "horizontal", dir:  1, txtCol: [255,255,255], state: "visible", glitchTimer: 0 },
  ];
}

// ─── MEDIAPIPE SETUP ──────────────────────────────────────────────────────────
const videoEl = document.createElement("video");
videoEl.style.display = "none";
document.body.appendChild(videoEl);

const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

faceMesh.onResults((results) => {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    const top = landmarks[10];
    const bottom = landmarks[152];
    const dy = bottom.y - top.y;
    const dx = bottom.x - top.x;
    const rawSize = Math.sqrt(dx * dx + dy * dy);

    faceSizeBuffer.push(rawSize);
    if (faceSizeBuffer.length > BUFFER_SIZE) faceSizeBuffer.shift();
    smoothFaceSize = faceSizeBuffer.reduce((a, b) => a + b, 0) / faceSizeBuffer.length;
  } else {
    faceSizeBuffer = [];
    smoothFaceSize = 0;
  }
});

const mpCamera = new Camera(videoEl, {
  onFrame: async () => {
    await faceMesh.send({ image: videoEl });
  },
  width: 640,
  height: 480,
});
mpCamera.start();

// ─── P5 SETUP ────────────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("HELVETICA");
  textStyle(BOLD);
  initBars();
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function draw() {
  let now = millis();

  isBlocked = smoothFaceSize === 0;

  if (isBlocked && !wasBlocked) {
    startExplosionSequence();
  }
  if (!isBlocked && wasBlocked) {
    startRestoreSequence();
  }
  wasBlocked = isBlocked;

  // Snelheid
  if (isBlocked) {
    currentSpeedZone = 0;
    targetSpeed = MIN_SPEED;
  } else {
    targetSpeed = getTargetSpeedFromFaceSize(smoothFaceSize);
  }
  speed = lerp(speed, targetSpeed, 0.08);

  let sx = width / BASE_W;
  let sy = height / BASE_H;
  textSize(40 * min(sx, sy));

  background(0);

  // Explosie queue
  if (explodeQueue.length > 0 && now - lastExplodeTime > BAR_INTERVAL) {
    let idx = explodeQueue.shift();
    explodeBar(idx, sx, sy);
    lastExplodeTime = now;
  }

  // Herstel queue
  if (restoreQueue.length > 0 && now - lastRestoreTime > BAR_INTERVAL) {
    let idx = restoreQueue.shift();
    bars[idx].state = "glitching";
    bars[idx].glitchTimer = 60;
    lastRestoreTime = now;
  }

  // Balken tekenen
  for (let b of bars) {
    if (b.state === "gone") continue;

    if (b.state === "glitching") {
      b.glitchTimer--;
      if (b.glitchTimer <= 0) b.state = "visible";
      drawBarGlitch(b, sx, sy);
    } else if (b.state === "visible") {
      drawBar(b, sx, sy);
    }
  }

  // Middenbalk kleureffect
  let midBar = bars[16];
  if (midBar.state === "visible") {
    let r = map(speed, MIN_SPEED, MAX_SPEED, 0, 255);
    let bl = map(speed, MIN_SPEED, MAX_SPEED, 255, 0);
    let barH = map(speed, MIN_SPEED, MAX_SPEED, 0, 440 * sy);
    fill(20);
    noStroke();
    rect(280 * sx, 280 * sy, 140 * sx, 440 * sy);
    fill(r, 0, bl, 180);
    rect(280 * sx, 280 * sy + 440 * sy - barH, 140 * sx, barH);
  }

  // Particles
  noStroke();
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vx *= 0.99;
    p.life -= 0.004;
    p.size *= 0.995;

    fill(p.r, p.g, p.b, p.life * 255);
    rect(p.x, p.y, p.size, p.size);

    if (p.life <= 0 || p.size < 1) particles.splice(i, 1);
  }
}

// ─── BALK TEKENEN ─────────────────────────────────────────────────────────────
function drawBar(b, sx, sy) {
  let px = b.x * sx;
  let py = b.y * sy;
  let pw = b.w * sx;
  let ph = b.h * sy;

  fill(b.fill[0], b.fill[1], b.fill[2]);
  noStroke();
  rect(px, py, pw, ph);

  if (b.word !== "") {
    drawScrollingText(b.x, b.y, b.w, b.h, b.word, b.ori, b.dir,
      color(b.txtCol[0], b.txtCol[1], b.txtCol[2]), sx, sy);
  }
}

// ─── BALK GLITCH TEKENEN ──────────────────────────────────────────────────────
function drawBarGlitch(b, sx, sy) {
  if (frameCount % 3 === 0) return;

  let px = b.x * sx;
  let py = b.y * sy;
  let pw = b.w * sx;
  let ph = b.h * sy;

  let offsetX = random(-12, 12);
  let offsetY = random(-4, 4);

  fill(b.fill[0], b.fill[1], b.fill[2]);
  noStroke();
  rect(px + offsetX, py + offsetY, pw, ph);

  if (random() > 0.5) {
    fill(254, 0, 0, 120);
    rect(px + random(-20, 20), py, pw, ph * random(0.1, 0.4));
  }
  if (random() > 0.5) {
    fill(0, 255, 255, 80);
    rect(px + random(-15, 15), py + ph * random(0.5, 0.9), pw, ph * random(0.05, 0.2));
  }

  if (b.word !== "") {
    drawScrollingText(b.x, b.y, b.w, b.h, b.word, b.ori, b.dir,
      color(b.txtCol[0], b.txtCol[1], b.txtCol[2]), sx, sy);
  }
}

// ─── EXPLOSIE SEQUENCE ────────────────────────────────────────────────────────
function startExplosionSequence() {
  let indices = bars.map((_, i) => i);
  explodeQueue = shuffle(indices);
  restoreQueue = [];
  lastExplodeTime = millis();
}

// ─── HERSTEL SEQUENCE ─────────────────────────────────────────────────────────
function startRestoreSequence() {
  let indices = bars.filter(b => b.state === "gone").map(b => b.id);
  restoreQueue = shuffle(indices);
  explodeQueue = [];
  lastRestoreTime = millis();
}

// ─── BALK EXPLODEREN ──────────────────────────────────────────────────────────
function explodeBar(idx, sx, sy) {
  let b = bars[idx];
  if (b.state !== "visible") return;

  b.state = "gone";

  let px = b.x * sx;
  let py = b.y * sy;
  let pw = b.w * sx;
  let ph = b.h * sy;

  let tileSize = 10;
  let cols = ceil(pw / tileSize);
  let rows = ceil(ph / tileSize);
  let cx = px + pw / 2;
  let cy = py + ph / 2;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      let tx = px + col * tileSize;
      let ty = py + row * tileSize;

      let angle = atan2(ty - cy, tx - cx);
      let force = random(1, 6);

      let r = constrain(b.fill[0] + random(-20, 20), 0, 255);
      let g = constrain(b.fill[1] + random(-20, 20), 0, 255);
      let bl = constrain(b.fill[2] + random(-20, 20), 0, 255);

      particles.push({
        x: tx, y: ty,
        vx: cos(angle) * force * random(0.5, 1.5),
        vy: sin(angle) * force * random(0.5, 1.5) - random(1, 3),
        size: tileSize * random(0.5, 1.2),
        r: r, g: g, b: bl,
        life: random(0.6, 1.0)
      });
    }
  }
}

// ─── SHUFFLE ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SCROLLENDE TEKST ─────────────────────────────────────────────────────────
function drawScrollingText(x, y, w, h, word, orientation, direction, txtColor, sx, sy) {
  fill(txtColor);

  let px = x * sx;
  let py = y * sy;
  let pw = w * sx;
  let ph = h * sy;

  let textScale = min(sx, sy);
  let spacing = textWidth(word + "   ");
  let offset = (frameCount * speed * textScale * direction) % spacing;

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(px, py, pw, ph);
  drawingContext.clip();

  if (orientation === "horizontal") {
    textAlign(LEFT, CENTER);
    for (let tx = px - spacing; tx < px + pw + spacing; tx += spacing) {
      text(word, tx + offset, py + ph / 2 + 2 * textScale);
    }
  }

  if (orientation === "vertical") {
    translate(px + pw / 2, py + ph / 2);
    rotate(HALF_PI);
    textAlign(LEFT, CENTER);
    let longSide = ph;
    for (let tx = -longSide / 2 - spacing; tx < longSide / 2 + spacing; tx += spacing) {
      text(word, tx + offset, 0);
    }
  }

  drawingContext.restore();
  pop();
}

// ─── RESIZE ───────────────────────────────────────────────────────────────────
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initBars();
}