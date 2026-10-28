// =====================================================================
//  REASSEMBLY
//  Een uit elkaar gehaald gezicht dat je zelf weer in elkaar puzzelt.
//  p5.js + ml5 faceMesh — live webcam, 4 losse gezichtsdelen.
//
//  Bediening:
//    muis   — klik en sleep een vakje
//    spatie — wissel stijl: zwart-wit → pixel → ASCII
// =====================================================================


// ---------------------------------------------------------------------
//  INSTELLINGEN — speel hier gerust mee
// ---------------------------------------------------------------------
const SETTINGS = {
  // Webcam
  VIDEO_W: 640,
  VIDEO_H: 480,

  // Resolutie van de interne uitsnede per vakje (hoger = scherper, zwaarder)
  BUFFER_RES: 128,

  // Formaat van de vakjes (px, bij een scherm van ~900 px hoog; schaalt mee)
  MIN_SIZE: 130,
  MAX_SIZE: 340,
  SIZE_LERP: 0.08,          // hoe snel een vakje naar zijn nieuwe formaat groeit

  // Beweging
  FLOAT_SPEED: 0.85,        // basissnelheid van het zweven
  NOISE_TIME: 0.00015,      // hoe snel de zweefrichting verandert
  STEER: 0.02,              // hoe soepel een vakje van richting wisselt
  EDGE_MARGIN: 60,          // afstand tot de rand waarop vakjes terugsturen
  SEPARATION: 0.02,         // hoe hard zwevende vakjes elkaar afstoten
  SCATTER_KICK: 3.5,        // duw bij een nieuw gezicht
  DRIFT_RAMP: 0.012,        // hoe geleidelijk een neergelegd vakje weer op gang komt

  // Neerleggen en wegdrijven
  REST_TIME: 8000,          // ms dat een neergelegd vakje blijft liggen

  // Face tracking
  FACE_LOST_MS: 500,        // ms zonder gezicht voordat de ruis verschijnt
  CROP_PADDING: 0.6,        // extra marge rond elk gezichtsdeel
  CROP_SMOOTHING: 0.25,     // 0..1 — lager = rustiger, maar trager
  MIN_CROP: 40,             // minimale uitsnede in videopixels

  // Stijl
  CONTRAST: 1.4,
  PIXEL_SIZE: 6,            // grootte van één pixelblok op het scherm
  PIXEL_LEVELS: 5,          // aantal grijstinten in pixelstijl
  ASCII_CELL: 11,           // grootte van één ASCII-teken op het scherm
  ASCII_CHARS: " .:-=+*#%@",
};

const STYLES = ["zwart-wit", "pixel", "ascii"];


// ---------------------------------------------------------------------
//  GEZICHTSDELEN — MediaPipe FaceMesh keypoint-indices
//  (links/rechts vanuit de persoon gezien)
// ---------------------------------------------------------------------
const PARTS = [
  { name: "linkeroog",
    indices: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466] },
  { name: "rechteroog",
    indices: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246] },
  { name: "neus",
    indices: [1, 2, 4, 5, 19, 94, 98, 327, 64, 294, 48, 278, 195, 197] },
  { name: "mond",
    indices: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 185, 40, 39, 37, 0, 267, 269, 270, 409] },
];


// ---------------------------------------------------------------------
//  GLOBALE STAAT
// ---------------------------------------------------------------------
let video;
let faceMesh;
let faces = [];
let lastFaceTime = -Infinity;
let faceWasVisible = false;

let parts = [];
let dragged = null;
let dragOffset;
let styleIndex = 0;


// ---------------------------------------------------------------------
//  SETUP
// ---------------------------------------------------------------------
function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: false, flipped: false });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");

  video = createCapture({
    video: {
      width: { ideal: SETTINGS.VIDEO_W },
      height: { ideal: SETTINGS.VIDEO_H },
      facingMode: "user",
    },
    audio: false,
  });
  video.elt.setAttribute("playsinline", ""); // nodig voor Safari
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  for (const p of PARTS) parts.push(new FacePart(p.name, p.indices));
  dragOffset = createVector(0, 0);
}

function gotFaces(results) {
  faces = results;
  if (results.length > 0) lastFaceTime = millis();
}


// ---------------------------------------------------------------------
//  DRAW
// ---------------------------------------------------------------------
function draw() {
  background(0);

  const faceVisible = millis() - lastFaceTime < SETTINGS.FACE_LOST_MS;

  // Gezicht komt (opnieuw) in beeld → nieuwe Picasso-formaten + verspreiden
  if (faceVisible && !faceWasVisible) onNewFace();
  faceWasVisible = faceVisible;

  const face = faces.length > 0 ? faces[0] : null;

  for (const p of parts) {
    if (face) p.updateCrop(face);
    p.capture(faceVisible);
    p.update(faceVisible);
  }

  separateParts();

  for (const p of parts) p.display(STYLES[styleIndex]);

  updateCursor();
}

function onNewFace() {
  for (const p of parts) {
    p.targetSize = randomSize();
    if (p !== dragged) p.scatter();
  }
}


// ---------------------------------------------------------------------
//  FACEPART
// ---------------------------------------------------------------------
class FacePart {
  constructor(name, indices) {
    this.name = name;
    this.indices = indices;

    this.size = randomSize();
    this.targetSize = this.size;
    this.pos = createVector(
      random(this.size / 2, width - this.size / 2),
      random(this.size / 2, height - this.size / 2)
    );
    this.vel = p5.Vector.random2D().mult(SETTINGS.FLOAT_SPEED);

    this.state = "floating";   // "floating" | "dragging" | "resting"
    this.restStart = 0;
    this.speedFactor = 1;
    this.noiseSeed = random(1000);

    // Uitsnede in videocoördinaten (vloeiend gemaakt)
    this.crop = null;

    // Interne buffers
    const R = SETTINGS.BUFFER_RES;
    this.buf = createGraphics(R, R);
    this.buf.pixelDensity(1);
    this.gray = new Float32Array(R * R);
    this.img = createImage(R, R);
  }

  // --- Face tracking -------------------------------------------------
  updateCrop(face) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of this.indices) {
      const k = face.keypoints[i];
      if (!k) continue;
      minX = min(minX, k.x); maxX = max(maxX, k.x);
      minY = min(minY, k.y); maxY = max(maxY, k.y);
    }
    if (minX === Infinity) return;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const s = max(SETTINGS.MIN_CROP, max(maxX - minX, maxY - minY) * (1 + SETTINGS.CROP_PADDING));

    if (!this.crop) {
      this.crop = { cx, cy, s };
    } else {
      const a = SETTINGS.CROP_SMOOTHING;
      this.crop.cx = lerp(this.crop.cx, cx, a);
      this.crop.cy = lerp(this.crop.cy, cy, a);
      this.crop.s = lerp(this.crop.s, s, a);
    }
  }

  // --- Beeld ophalen: live uitsnede of TV-ruis -------------------------
  capture(faceVisible) {
    const R = SETTINGS.BUFFER_RES;
    const videoReady = video && video.elt.readyState >= 2 && video.width > 0;

    if (!faceVisible || !this.crop || !videoReady) {
      // TV-ruis
      for (let i = 0; i < this.gray.length; i++) this.gray[i] = random(255);
      return;
    }

    const vw = video.width, vh = video.height;
    const s = min(this.crop.s, vw, vh);
    const sx = constrain(this.crop.cx - s / 2, 0, vw - s);
    const sy = constrain(this.crop.cy - s / 2, 0, vh - s);

    this.buf.image(video, 0, 0, R, R, sx, sy, s, s);
    this.buf.loadPixels();
    const px = this.buf.pixels;

    // Naar grijswaarden, en gespiegeld (zodat het voelt als een spiegel)
    for (let y = 0; y < R; y++) {
      for (let x = 0; x < R; x++) {
        const src = (y * R + x) * 4;
        const g = 0.299 * px[src] + 0.587 * px[src + 1] + 0.114 * px[src + 2];
        this.gray[y * R + (R - 1 - x)] = g;
      }
    }
  }

  // --- Beweging ------------------------------------------------------
  update(faceVisible) {
    this.size = lerp(this.size, this.targetSize, SETTINGS.SIZE_LERP);

    if (this.state === "dragging") {
      this.pos.set(mouseX + dragOffset.x, mouseY + dragOffset.y);
      this.keepInside();
      return;
    }

    if (this.state === "resting") {
      const restedLongEnough = millis() - this.restStart > SETTINGS.REST_TIME;
      if (!faceVisible || restedLongEnough) {
        this.state = "floating";
        this.speedFactor = 0;   // komt geleidelijk weer op gang
        this.vel = p5.Vector.random2D().mult(SETTINGS.FLOAT_SPEED * sizeScale());
      } else {
        return;
      }
    }

    // Zweven: richting volgt Perlin noise
    const angle = noise(this.noiseSeed, millis() * SETTINGS.NOISE_TIME) * TWO_PI * 2;
    const desired = p5.Vector.fromAngle(angle).mult(SETTINGS.FLOAT_SPEED * sizeScale());

    // Zacht terugsturen bij de randen
    const h = this.size / 2;
    const m = SETTINGS.EDGE_MARGIN;
    if (this.pos.x < h + m) desired.x += 0.5;
    if (this.pos.x > width - h - m) desired.x -= 0.5;
    if (this.pos.y < h + m) desired.y += 0.5;
    if (this.pos.y > height - h - m) desired.y -= 0.5;

    this.vel.lerp(desired, SETTINGS.STEER);
    this.speedFactor = min(1, this.speedFactor + SETTINGS.DRIFT_RAMP);
    this.pos.add(p5.Vector.mult(this.vel, this.speedFactor));

    // Stuiteren tegen de randen
    if (this.pos.x < h) { this.pos.x = h; this.vel.x = abs(this.vel.x); }
    if (this.pos.x > width - h) { this.pos.x = width - h; this.vel.x = -abs(this.vel.x); }
    if (this.pos.y < h) { this.pos.y = h; this.vel.y = abs(this.vel.y); }
    if (this.pos.y > height - h) { this.pos.y = height - h; this.vel.y = -abs(this.vel.y); }
  }

  scatter() {
    this.state = "floating";
    this.speedFactor = 1;
    this.vel = p5.Vector.random2D().mult(SETTINGS.FLOAT_SPEED * SETTINGS.SCATTER_KICK * sizeScale());
  }

  keepInside() {
    const h = this.size / 2;
    this.pos.x = constrain(this.pos.x, h, max(h, width - h));
    this.pos.y = constrain(this.pos.y, h, max(h, height - h));
  }

  contains(x, y) {
    return abs(x - this.pos.x) < this.size / 2 && abs(y - this.pos.y) < this.size / 2;
  }

  // --- Tekenen -------------------------------------------------------
  display(style) {
    const s = this.size;
    const x = this.pos.x - s / 2;
    const y = this.pos.y - s / 2;

    noStroke();
    fill(0);
    rect(x, y, s, s);

    if (style === "zwart-wit") this.drawGray(x, y, s);
    else if (style === "pixel") this.drawPixel(x, y, s);
    else this.drawAscii(x, y, s);

    noFill();
    stroke(255);
    strokeWeight(this.state === "dragging" ? 2.5 : 1.2);
    rect(x, y, s, s);
  }

  drawGray(x, y, s) {
    const img = this.img;
    img.loadPixels();
    for (let i = 0; i < this.gray.length; i++) {
      const v = applyContrast(this.gray[i]);
      const idx = i * 4;
      img.pixels[idx] = v;
      img.pixels[idx + 1] = v;
      img.pixels[idx + 2] = v;
      img.pixels[idx + 3] = 255;
    }
    img.updatePixels();
    image(img, x, y, s, s);
  }

  drawPixel(x, y, s) {
    // Klein beeldje van n×n pixels, scherp (zonder vervaging) opgeschaald.
    // Veel sneller dan losse rechthoeken, dus kleine pixels blijven soepel.
    const n = max(4, round(s / SETTINGS.PIXEL_SIZE));
    if (!this.pixImg || this.pixImg.width !== n) this.pixImg = createImage(n, n);
    const img = this.pixImg;
    const L = SETTINGS.PIXEL_LEVELS - 1;
    img.loadPixels();
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const v = applyContrast(this.sample(gx, gy, n));
        const q = round((v / 255) * L) / L * 255;
        const idx = (gy * n + gx) * 4;
        img.pixels[idx] = q;
        img.pixels[idx + 1] = q;
        img.pixels[idx + 2] = q;
        img.pixels[idx + 3] = 255;
      }
    }
    img.updatePixels();
    drawingContext.imageSmoothingEnabled = false;
    image(img, x, y, s, s);
    drawingContext.imageSmoothingEnabled = true;
  }

  drawAscii(x, y, s) {
    const n = max(4, round(s / SETTINGS.ASCII_CELL));
    const cell = s / n;
    const chars = SETTINGS.ASCII_CHARS;
    noStroke();
    fill(255);
    textSize(cell * 1.15);
    textAlign(CENTER, CENTER);
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const v = applyContrast(this.sample(gx, gy, n));
        const c = chars[min(chars.length - 1, floor((v / 256) * chars.length))];
        if (c !== " ") text(c, x + (gx + 0.5) * cell, y + (gy + 0.5) * cell);
      }
    }
  }

  // Grijswaarde in het midden van rastercel (gx, gy) van een n×n raster
  sample(gx, gy, n) {
    const R = SETTINGS.BUFFER_RES;
    const sx = floor(((gx + 0.5) / n) * R);
    const sy = floor(((gy + 0.5) / n) * R);
    return this.gray[sy * R + sx];
  }
}


// ---------------------------------------------------------------------
//  HULPFUNCTIES
// ---------------------------------------------------------------------
function sizeScale() {
  return min(width, height) / 900;
}

function randomSize() {
  return random(SETTINGS.MIN_SIZE, SETTINGS.MAX_SIZE) * sizeScale();
}

function applyContrast(g) {
  return constrain((g - 128) * SETTINGS.CONTRAST + 128, 0, 255);
}

// Zwevende vakjes duwen elkaar zachtjes uit elkaar
function separateParts() {
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j];
      const aFree = a.state === "floating";
      const bFree = b.state === "floating";
      if (!aFree && !bFree) continue;

      const d = p5.Vector.sub(b.pos, a.pos);
      const dist = d.mag();
      const minDist = (a.size + b.size) / 2;
      if (dist >= minDist) continue;

      if (dist < 0.001) d.set(random(-1, 1), random(-1, 1));
      d.setMag((minDist - dist) * SETTINGS.SEPARATION);
      if (aFree) a.pos.sub(d);
      if (bFree) b.pos.add(d);
    }
  }
}

function updateCursor() {
  if (dragged) {
    cursor("grabbing");
    return;
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].contains(mouseX, mouseY)) {
      cursor("grab");
      return;
    }
  }
  cursor(ARROW);
}


// ---------------------------------------------------------------------
//  INTERACTIE
// ---------------------------------------------------------------------
function mousePressed() {
  // Bovenste vakje eerst (laatste in de array wordt bovenop getekend)
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.contains(mouseX, mouseY)) {
      dragged = p;
      p.state = "dragging";
      dragOffset.set(p.pos.x - mouseX, p.pos.y - mouseY);
      parts.splice(i, 1);
      parts.push(p); // naar voren
      return false;
    }
  }
}

function mouseReleased() {
  if (dragged) {
    dragged.state = "resting";
    dragged.restStart = millis();
    dragged.vel.set(0, 0);
    dragged = null;
  }
}

function keyPressed() {
  if (key === " ") {
    styleIndex = (styleIndex + 1) % STYLES.length;
    return false; // voorkom scrollen
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (const p of parts) p.keepInside();
}
