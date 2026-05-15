let speed = 6;

function setup() {
  createCanvas(700, 1000);
  textFont("Helvetica");
  textSize(28);
  textStyle(BOLD);
  noStroke();
}

function draw() {
  stroke(0);
  background(220);

  // achtergrond
  fill(220);
  rect(0, 0, width, height);

  // RAND 1
  fill(254, 108, 248);
  rect(0, 0, 630, 70);          // boven
  fill(254, 0, 0);
  rect(630, 0, 70, 930);        // rechts
  fill(0);
  rect(70, 930, 630, 70);       // onder
  fill(255);
  rect(0, 70, 70, 930);         // links

  // RAND 2
  fill(0);
  rect(70, 70, 490, 70);        // boven
  fill(255);
  rect(560, 70, 70, 790);       // rechts
  fill(254, 108, 248);
  rect(140, 860, 490, 70);      // onder
  fill(254, 0, 0);
  rect(70, 140, 70, 790);       // links

  // RAND 3
  fill(255);
  rect(140, 140, 350, 70);      // boven
  fill(254, 108, 248);
  rect(490, 140, 70, 650);      // rechts
  fill(254, 0, 0);
  rect(210, 790, 350, 70);      // onder
  fill(0);
  rect(140, 210, 70, 650);      // links

  // RAND 4
  fill(254, 0, 0);
  rect(210, 210, 210, 70);      // boven
  fill(0);
  rect(420, 210, 70, 510);      // rechts
  fill(255);
  rect(280, 720, 210, 70);      // onder
  fill(254, 108, 248);
  rect(210, 280, 70, 510);      // links

  // MIDDEN - alleen blauw flikkert
  let flickerAlpha = map(sin(frameCount * 0.8), -1, 1, 40, 180);

  // optioneel: af en toe extra harde flits
  if (frameCount % 12 === 0) {
    flickerAlpha = 255;
  }

  fill(0, 0, 255, flickerAlpha);
  rect(280, 280, 140, 440);

  // -------------------------
  // TEKST IN DE BALKEN
  // -------------------------

  // RAND 1
  drawScrollingText(0, 0, 630, 70, "CHAOS", "horizontal", 1, color(0));
  drawScrollingText(630, 0, 70, 930, "NOISE", "vertical", 1, color(255));
  drawScrollingText(70, 930, 630, 70, "STATIC", "horizontal", -1, color(255));
  drawScrollingText(0, 70, 70, 930, "DOPAMINE", "vertical", -1, color(0));

  // RAND 2
  drawScrollingText(70, 70, 490, 70, "PING", "horizontal", 1, color(255));
  drawScrollingText(560, 70, 70, 790, "STRESS", "vertical", 1, color(0));
  drawScrollingText(140, 860, 490, 70, "OVERPRIKKELD", "horizontal", -1, color(0));
  drawScrollingText(70, 140, 70, 790, "LIKES", "vertical", -1, color(255));

  // RAND 3
  drawScrollingText(140, 140, 350, 70, "#","horizontal", 1, color(0));
  drawScrollingText(490, 140, 70, 650, "CLICK", "vertical", 1, color(0));
  drawScrollingText(210, 790, 350, 70, "SPAM", "horizontal", -1, color(255));
  drawScrollingText(140, 210, 70, 650, "DOOMSCROLL", "vertical", -1, color(255));

  // RAND 4
  drawScrollingText(210, 210, 210, 70, "TRIGGER", "horizontal", 1, color(255));
  drawScrollingText(420, 210, 70, 510, "NOISE", "vertical", 1, color(255));
  drawScrollingText(280, 720, 210, 70, "@  <3", "horizontal", -1, color(0));
  drawScrollingText(210, 280, 70, 510, "BLOKKEREN", "vertical", -1, color(0));
}

function drawScrollingText(x, y, w, h, word, orientation, direction, txtColor) {
  fill(txtColor);

  let spacing = textWidth(word + "   ");
  let offset = (frameCount * speed * direction) % spacing;

  push();

  // clip de tekst binnen de balk
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, w, h);
  drawingContext.clip();

  if (orientation === "horizontal") {
    textAlign(LEFT, CENTER);

    for (let tx = x - spacing; tx < x + w + spacing; tx += spacing) {
      text(word, tx + offset, y + h / 2 + 2);
    }
  }

  if (orientation === "vertical") {
    translate(x + w / 2, y + h / 2);
    rotate(HALF_PI);
    textAlign(LEFT, CENTER);

    let longSide = h;

    for (let tx = -longSide / 2 - spacing; tx < longSide / 2 + spacing; tx += spacing) {
      text(word, tx + offset, 0);
    }
  }

  drawingContext.restore();
  pop();
}