let words = [
  "●   CHAOS   ",
  "●   DRUKTE   ",
  "●   STRESS   ",
  "●   RUIS   ",
  "●   #   ",
  "●   PANIEK   ",
  "●   CLICKBAIT   ",
  "●   TEVEEL   ",
  "●   SPANNING   ",
  "●   ONRUST   ",
  "●   BLOKKEREN   ",
  "●   OVERPRIKKELD   ",
  "●   TWIJFEL   ",
  "●   @   "
];

let offsets = [];
let speeds = [];
let glitchChance = 0.08;

function setup() {
  createCanvas(windowWidth, windowHeight);

  for (let i = 0; i < words.length; i++) {
    offsets[i] = 0;
    speeds[i] = random(1, 8);
  }
}

function draw() {
  background(200);
  textStyle(BOLD);
  textSize(70);

  let bannerNumber = 0;
  let rowHeight = height / words.length;

  for (let y = 0; y < height; y += rowHeight) {
    let word = words[bannerNumber];
    let wordWidth = textWidth(word);

    if (bannerNumber % 2 === 0) {
      fill(254, 108, 248);
      rect(0, y, width, rowHeight);
      fill(254, 0, 0);
    } else {
      if (bannerNumber % 4 === 1) {
        fill(255);
        rect(0, y, width, rowHeight);
        fill(0);
      } else {
        fill(0);
        rect(0, y, width, rowHeight);
        fill(255);
      }
    }

    for (let x = 0; x < width + wordWidth; x += wordWidth) {
      let jitterX = random(-2, 2);
      let jitterY = random(-1, 1);

      if (bannerNumber % 2 === 0) {
        text(word, x + offsets[bannerNumber] + jitterX, y + rowHeight * 0.6 + jitterY);
        text(word, x + offsets[bannerNumber] - wordWidth + jitterX, y + rowHeight * 0.6 + jitterY);

        if (random(1) < glitchChance) {
          fill(0, 255, 255);
          text(word, x + offsets[bannerNumber] + jitterX + 2, y + rowHeight * 0.6 + jitterY);

          fill(255, 0, 255);
          text(word, x + offsets[bannerNumber] - wordWidth + jitterX - 2, y + rowHeight * 0.6 + jitterY);

          fill(254, 0, 0);
        }
      } else {
        text(word, x - offsets[bannerNumber] + jitterX, y + rowHeight * 0.6 + jitterY);
        text(word, x - offsets[bannerNumber] + wordWidth + jitterX, y + rowHeight * 0.6 + jitterY);

        if (random(1) < glitchChance) {
          fill(0, 255, 255);
          text(word, x - offsets[bannerNumber] + jitterX + 2, y + rowHeight * 0.6 + jitterY);

          fill(255, 0, 255);
          text(word, x - offsets[bannerNumber] + wordWidth + jitterX - 2, y + rowHeight * 0.6 + jitterY);

          if (bannerNumber % 4 === 1) {
            fill(0);
          } else {
            fill(255);
          }
        }
      }
    }

    offsets[bannerNumber] += speeds[bannerNumber];

    if (offsets[bannerNumber] > wordWidth) {
      offsets[bannerNumber] = 0;
    }

    bannerNumber++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}