/* Program name: main_hangman.js
*  Author: Cory Knoll
*  Date Last Modified: 12/4/2019
*  Purpose: Hangman game in Phaser framework to be embedded in AACK Retro Gaming website
*/

//create configuration for phaser game
var config = {
    type: Phaser.AUTO,
    width: 480,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);     //instance of Phaser game with config settings

//load all assets of game before creating it
function preload (){
    this.load.image('gallows', 'assets/Hangman/gallows.png');
    this.load.image('head', 'assets/Hangman/head.png');
    this.load.image('body', 'assets/Hangman/body.png');
    this.load.image('left_arm', 'assets/Hangman/left_arm.png');
    this.load.image('right_arm', 'assets/Hangman/right_arm.png');
    this.load.image('left_leg', 'assets/Hangman/left_leg.png');
    this.load.image('right_leg', 'assets/Hangman/right_leg.png');
    this.load.image('underscore', 'assets/Hangman/underscore.png');
    this.load.image('crossout', 'assets/Hangman/crossout.png');
    this.load.image('win', 'assets/Hangman/win.png');
    this.load.image('lose', 'assets/Hangman/lose.png');

    this.key = new Array();
    for(var i = 0; i < 26; i++){
        var char = String.fromCharCode(i+65);
        this.load.image(char, 'assets/Hangman/' + char + '.png');
    }
}

//display background and underscores andput all other assets outside the scene 
function create (){
    //solution characters for hangman game
    solution = ["A", "A", "C", "K", "R", "E", "T", "R", "O", "G", "A", "M", "I", "N", "G", "C", "O"];
    body_parts = new Array();                                   //stores all of the body parts displayed
    wrong_answers = new Array();                                //stores all of the incorrectly guessed

    //create background and load all bodyparts off screen
    this.add.image(240, 300, 'gallows');
    body_parts.unshift(this.add.image(-340, 268, 'left_leg'));
    body_parts.unshift(this.add.image(-340, 268, 'right_leg'));
    body_parts.unshift(this.add.image(-340, 268, 'left_arm'));
    body_parts.unshift(this.add.image(-340, 268, 'right_arm'));
    body_parts.unshift(this.add.image(-340, 268, 'body'));
    body_parts.unshift(this.add.image(-340, 268, 'head'));

    //load win and lose messages off screen
    win = this.add.image(-240, 300, 'win');
    win.depth = 100;
    lose = this.add.image(-240, 300, 'lose');
    lose.depth = 100;

    //load and place all underscores for hangman solution
    underscore = this.add.image(60, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(100, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(140, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(180, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(260, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(300, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(340, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(380, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(420, 480, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(80, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(120, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(160, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(200, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(240, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(280, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(360, 540, 'underscore'); underscore.setScale(.1);
    underscore = this.add.image(400, 540, 'underscore'); underscore.setScale(.1);

    //load all letters of solution off screen
    letter = new Array();
    letter.push(this.add.image(-60, 480, 'A'));
    letter.push(this.add.image(-100, 480, 'A'));
    letter.push(this.add.image(-140, 480, 'C'));
    letter.push(this.add.image(-180, 480, 'K'));
    letter.push(this.add.image(-260, 480, 'R'));
    letter.push(this.add.image(-300, 480, 'E'));
    letter.push(this.add.image(-340, 480, 'T'));
    letter.push(this.add.image(-380, 480, 'R'));
    letter.push(this.add.image(-420, 480, 'O'));
    letter.push(this.add.image(-80, 540, 'G'));
    letter.push(this.add.image(-120, 540, 'A'));
    letter.push(this.add.image(-160, 540, 'M'));
    letter.push(this.add.image(-200, 540, 'I'));
    letter.push(this.add.image(-240, 540, 'N'));
    letter.push(this.add.image(-280, 540, 'G'));
    letter.push(this.add.image(-360, 540, 'C'));
    letter.push(this.add.image(-400, 540, 'O'));
    for(var i = 0; i < letter.length; i++)
        letter[i].setScale(.2);

    //start listening for key presses
    this.input.keyboard.on('keydown', keyPressed, this);
}

//determine if key pressed is a correct or incorrect letter, display accordingly
function keyPressed(){

    //stop listen to key down
    this.input.keyboard.off('keydown', keyPressed, this);
    var char = String.fromCharCode(event.keyCode);  //character of key pressed
    var invalidSelection = true;                    //represent whether guess was correct or not

    //scan solution set for guessed character, display correct guess
    for(var i = 0; i < solution.length; i++){
        if (char == solution[i]){
            invalidSelection = false;
            if(letter[i].x < 0)
                letter[i].x *= -1;
        }
    }

    //if guess was not made previously, display guessed character in wrong
    //set, and display additional body parts of hangman
    if(invalidSelection){
        var alreadySelected = false;    //represents whether characters already guessed

        //determine if character already guessed (not penalized)
        for(var i= 0; i < wrong_answers.length; i++)
            if(wrong_answers[i] == char)
                alreadySelected = true;
        
        //display guessed character in wrong set, and display additional body parts of hangman
        if(!alreadySelected){
            wrong_answers.push(char);
            body_parts[wrong_answers.length-1].x *= -1;
            wrong_char = this.add.image(wrong_answers.length * 40, 420, char);
            wrong_char.setScale(.2);
            crossout = this.add.image(wrong_answers.length * 40, 420, 'crossout');
            crossout.setScale(.1);
        }
    }

    //listen for key up
    this.input.keyboard.on('keyup', keyReleased, this);
}

function keyReleased(){
    //stop listening for key up, listen for key down
    this.input.keyboard.off('keyup', keyReleased, this);
    this.input.keyboard.on('keydown', keyPressed, this);
}

//basic function of game object, constantly loops
function update(){
    var hasWon = true;  //represents whether game is won

    //if 6 answers guessed wrong, display lose message
    if(wrong_answers.length == 6){
        this.input.keyboard.off('keydown', keyPressed, this);
        lose.x = 240;
    }
    else{
        //if all solution letters displayed on-screen, game won
        for(var i = 0; i < letter.length; i++)
            if(letter[i].x < 0)
                hasWon = false;
    
        //stop listening to key pressed, display win message
        if(hasWon){
            this.input.keyboard.off('keydown', keyPressed, this);
            win.x = 240;
        }
    }
}