let speed = 6;

const BASE_W = 700;
const BASE_H = 1000;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");
  textStyle(BOLD);
  //noStroke();
}

function draw() {
  background(220);

  // schaalfactor op basis van huidige canvasgrootte
  let sx = width / BASE_W;
  let sy = height / BASE_H;

  // tekst schaalt ook mee
  textSize(40 * min(sx, sy));

  // hulpfunctie om rechthoeken te schalen
  function sRect(x, y, w, h) {
    rect(x * sx, y * sy, w * sx, h * sy);
  }

  // achtergrond
  fill(50);
  rect(0, 0, width, height);

  // RAND 1
  fill(254, 108, 248);
  sRect(0, 0, 630, 70);          
  fill(254, 0, 0);
  sRect(630, 0, 70, 930);        
  fill(0);
  sRect(70, 930, 630, 70);       
  fill(255);
  sRect(0, 70, 70, 930);         

  // RAND 2
  fill(0);
  sRect(70, 70, 490, 70);        
  fill(255);
  sRect(560, 70, 70, 790);       
  fill(254, 108, 248);
  sRect(140, 860, 490, 70);      
  fill(254, 0, 0);
  sRect(70, 140, 70, 790);       

  // RAND 3
  fill(255);
  sRect(140, 140, 350, 70);      
  fill(254, 108, 248);
  sRect(490, 140, 70, 650);      
  fill(254, 0, 0);
  sRect(210, 790, 350, 70);      
  fill(0);
  sRect(140, 210, 70, 650);      

  // RAND 4
  fill(254, 0, 0);
  sRect(210, 210, 210, 70);      
  fill(0);
  sRect(420, 210, 70, 510);      
  fill(255);
  sRect(280, 720, 210, 70);      
  fill(254, 108, 248);
  sRect(210, 280, 70, 510);      

  // MIDDEN - blauw flikkert
//   let flickerAlpha = map(sin(frameCount * 0.8), -1, 1, 40, 180);

//   if (frameCount % 12 === 0) {
//     flickerAlpha = 255;
//   }

//   fill(0, 0, 255, flickerAlpha);
//   sRect(280, 280, 140, 440);

  // TEKST IN DE BALKEN
  drawScrollingText(0, 0, 630, 70, "CHAOS", "horizontal", 1, color(0), sx, sy);
  drawScrollingText(630, 0, 70, 930, "NOISE", "vertical", 1, color(255), sx, sy);
  drawScrollingText(70, 930, 630, 70, "STATIC", "horizontal", -1, color(255), sx, sy);
  drawScrollingText(0, 70, 70, 930, "DOPAMINE", "vertical", -1, color(0), sx, sy);

  drawScrollingText(70, 70, 490, 70, "PING", "horizontal", 1, color(255), sx, sy);
  drawScrollingText(560, 70, 70, 790, "STRESS", "vertical", 1, color(0), sx, sy);
  drawScrollingText(140, 860, 490, 70, "OVERPRIKKELD", "horizontal", -1, color(0), sx, sy);
  drawScrollingText(70, 140, 70, 790, "LIKES", "vertical", -1, color(255), sx, sy);

  drawScrollingText(140, 140, 350, 70, "#", "horizontal", 1, color(0), sx, sy);
  drawScrollingText(490, 140, 70, 650, "CLICK", "vertical", 1, color(0), sx, sy);
  drawScrollingText(210, 790, 350, 70, "SPAM", "horizontal", -1, color(255), sx, sy);
  drawScrollingText(140, 210, 70, 650, "DOOMSCROLL", "vertical", -1, color(255), sx, sy);

  drawScrollingText(210, 210, 210, 70, "TRIGGER", "horizontal", 1, color(255), sx, sy);
  drawScrollingText(420, 210, 70, 510, "NOISE", "vertical", 1, color(255), sx, sy);
  drawScrollingText(280, 720, 210, 70, "@  <3", "horizontal", -1, color(0), sx, sy);
  drawScrollingText(210, 280, 70, 510, "BLOKKEREN", "vertical", -1, color(0), sx, sy);
}

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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}