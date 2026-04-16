function setup() { 
    createCanvas(400, 700); 
} 

function draw() { 
    background(200); 
   
    let y = 0; 
    while( y < height) { 
        rect(0, y, width, 50); 
        y +=50;} 
}