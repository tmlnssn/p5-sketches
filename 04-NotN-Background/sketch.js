let topWords = ["ADDS", "SCROLL", "NOISE", "GLITCH", "SPAM", "ERROR", "PING", "LIKES", "CHAOS", "FOMO"];
let bottomWords = ["SILENCE", "PAUSE", "QUIET", "BREATHE", "SPACE", "PEACE", "SLOW", "CALM", "RESET", "FLOW"];

let topX = 0;
let bottomX = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");
}

function draw() {
  background(0);

  let whiteHeight = height * 0.36;

  // WITTE BOVENVLAK
  fill(255);
  noStroke();
  rect(0, 0, width, whiteHeight);

  // TEKSTLINTEN
  drawMovingRibbon(topWords, topX, 18, 1);
  drawMovingRibbon(bottomWords, bottomX, whiteHeight - 18, -1);

  topX += 0.6;
  bottomX -= 0.6;

  // GLITCH TITEL
  drawGlitchTitle("QUIET THE NOISE", width / 2, whiteHeight / 2);

  // ZWARTE ONDERKANT
  drawStaticBottom(whiteHeight);
}

function drawMovingRibbon(words, xOffset, y, direction) {
  textSize(20);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);

  let spacing = 150;
  let totalWidth = words.length * spacing;

  let x = xOffset % totalWidth;

  if (direction === 1) {
    x -= totalWidth;
  }

  for (let repeat = -1; repeat < 4; repeat++) {
    for (let i = 0; i < words.length; i++) {
      fill(0);
      text(words[i], x + i * spacing + repeat * totalWidth, y);
    }
  }
}

function drawGlitchTitle(title, x, y) {
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(width * 0.085);

  let glitchActive = frameCount % 180 < 18;

  if (glitchActive) {
    fill(255, 0, 80);
    text(title, x - random(4, 12), y + random(-3, 3));

    fill(180, 0, 255);
    text(title, x + random(4, 12), y + random(-3, 3));
  }

  fill(0);
  text(title, x, y);
}

function drawStaticBottom(startY) {
  let leftX = width * 0.30;
  let rightX = width * 0.52;

  stroke(255);
  strokeWeight(2);
  line(width / 2, startY, width / 2, height);

  noStroke();
  fill(255);
  textAlign(LEFT, TOP);

  textStyle(BOLD);
  textSize(36);
  text("Take Control", leftX, startY + 30);
  text("Step Back", rightX, startY + 30);

  textSize(17);
  textStyle(BOLD);

  text(
    "Hier komt uitleg over de\ninstallatie.",
    leftX,
    startY + 85
  );

  text(
    "We leven in een wereld\nwaarin alles continu om\naandacht vraagt.\n\nScrollen, notificaties,\nvideo’s, geluiden; het stopt\neigenlijk nooit.\n\nIn Step Back ontdek je\nhoeveel invloed je zelf hebt\nop de rust en chaos om je\nheen.\n\nKom dichterbij.\n\nNeem afstand.\n\nSteek je hand uit.\n\nErvaar wat er gebeurt",
    rightX,
    startY + 85
  );
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}