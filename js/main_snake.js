let numseg = 10;
let direction = 'right';

const xStart = 0; 
const yStart = 250; 
const diff = 10; 

let xCor = []
let yCor = []

let xfood = 0;
let yfood = 0;
let score;

function updatefoodcoordinates(){
    xfood = Math.floor(Math.random() * (width - 20) + 10); 
    yfood = Math.floor(Math.random() * (width - 20) + 10);
}

function setup() {
    score = createDiv('Score = 0');
    score.position(20, 120);
    score.id = "Points";
    score.style('color' , 'white');

    createCanvas(500, 500);
    frameRate(15);
    stroke(255);
    strokeWeight(10);
    updatefoodcoordinates();

    for (let i = 0; i < numseg; i++) {
        xCor.push(xStart + i * diff);
        yCor.push(yStart);
    }
}

function checkSnakeCollision() {
    const snakeHeadX = xCor[xCor.length - 1];
    const snakeheadY = yCor[yCor.length - 1];
    for (let i = 0; i < xCor.length - 1; i++) {
        if (xCor[i] === snakeHeadX && yCor[i] === snakeheadY) {
            return true;
        }
    }
}


function checkGameStatus(){
    if(
        xCor[xCor.length - 1] > width ||
        xCor[xCor.length - 1] < 0 ||
        yCor[yCor.length - 1] > height ||
        yCor[yCor.length - 1] < 0 ||
        checkSnakeCollision()
    )   {
        noLoop();
        const scoreVal = parseInt(score.html(). substring(8));
        score.html('You died! Your ending score was: ' + scoreVal);
    }
}

function checkForfood (){
    point(xfood, yfood);
    if (xCor[xCor.length - 1] >= xfood - 10
        && xCor[xCor.length - 1] <= xfood + 10
        && yCor[yCor.length - 1] >= yfood - 10
        && yCor[yCor.length - 1] <= yfood + 10) {
        const prevScore = parseInt(score.html().substring(8));
        score.html('score = ' + (prevScore +1));
        xCor.unshift(xCor[0]);
        yCor.unshift(yCor[0]);
        numseg++;
        updatefoodcoordinates();
    }
}

function draw () {
    background(100);
    for (let i = 0; i <numseg - 1; i++) {
        line(xCor[i], yCor[i], xCor[i + 1], yCor[i+ 1]);
    }
    keyPressed();
    updatesnakecoordinates();
    checkGameStatus();
    checkForfood();
}

function updatesnakecoordinates() {
    for(let i = 0; i < numseg - 1; i++){
        xCor[i] = xCor[i + 1];
        yCor[i] = yCor[i + 1];
    }

    switch (direction) {
        case 'up':
            xCor[numseg - 1] = xCor[numseg - 2];
            yCor[numseg - 1] = yCor[numseg - 2] - diff;
            break;
        case 'down':
            xCor[numseg - 1] = xCor[numseg - 2];
            yCor[numseg - 1] = yCor[numseg - 2] + diff;
            break;
        case 'left':
            xCor[numseg - 1] = xCor[numseg - 2] - diff;
            yCor[numseg - 1] = yCor[numseg - 2];
            break;
        case 'right':
            xCor[numseg - 1] = xCor[numseg - 2] + diff;
            yCor[numseg - 1] = yCor[numseg - 2];
            break;
    }
}

function keyPressed() {
    if(keyCode == 65 && direction != 'right')
        direction = 'left';
    else if(keyCode == 87 && direction != 'down')
        direction = 'up';
    else if(keyCode == 83 && direction != 'up')
        direction = 'down';
    else if(keyCode == 68 && direction != 'left')
        direction = 'right';
}
