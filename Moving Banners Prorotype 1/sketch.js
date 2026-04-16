let offSet = 0;

function setup() {
  createCanvas(400, 700);
  textSize(16);
}

function draw() {
  background(200);
  textStyle(BOLD);
  textSize(12);
  
  let bannerNumber = 0;
  let word = "●   CHAOS   ";
  let wordWidth = textWidth(word);  

for(let y = 0; y < height; y+=50) {
 
  
if (bannerNumber % 2 === 0) {
    fill(254, 108, 248);
  }
   else {
    fill(255);
  }
   
rect(0, y, width, 50);
fill(254,0,0);

  


for(let x = 0; x <width; x += wordWidth){
   
if(bannerNumber %2 === 0){
  text(word, x + offSet, y + 30);
  text(word, x + offSet - wordWidth, y + 30);
    } else {
  text(word, x - offSet, y + 30);   
  text(word, x - offSet + wordWidth, y + 30);
    }
  }
bannerNumber++;  
}  
 

offSet += 1

if (offSet > wordWidth){
    offSet = 0;
  }
}