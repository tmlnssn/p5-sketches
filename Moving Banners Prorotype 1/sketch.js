function setup() {
  createCanvas(400, 700);
}

function draw() {
  background(200);
  let bannerNumber = 0;

for(let y = 0; y < height; y+=50) {
 
  
if (bannerNumber % 2 === 0) {
  fill(255, 0, 0);
}
 else {
  fill(0, 0, 255);
}
  rect(0, y, width, 50);
  
  bannerNumber++;
}
  
}