/* Program name: main_solitaire.js
*  Author: Cory Knoll
*  Date Last Modified: 12/4/2019
*  Purpose: Solitaire game in Phaser framework to be embedded in AACK Retro Gaming website
*/

//create configuration for phaser game
var config = {
    type: Phaser.AUTO,
    width: 960,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);     //instance of Phaser game with config settings
var TOP_ROW_Y = 80;                     //y coordinate of top row items
var FOUNDATIONS_START_X = 60;           //x coordinate of left most foundation item
var STOCK_START_X = 900;                //x coordinate of stcok item
var TABLEAU_Y = 240;                    //y coordinate of top of tableau items
var TABLEAU_START_X = 120               //x coordinate of left most tableau item
var COLUMN_OFFSET = 120;                //horizontal displacement of card stacks
var FACEUP_OFFSET = 25;                 //vertical displacement of face up card in tableaus
var FACEDOWN_OFFSET = 7;                //vertical displacement of face down card in tableaus

//lists of all possible card values (in order) and all suits (black first, then red)
var values = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'];
var suits = ['clubs', 'spades', 'diamonds', 'hearts'];

//card class extends the Phaser Sprite object, which handles image, location and interactivity,
//but card also contains all the details about a given card as well as its state
class Card extends Phaser.GameObjects.Sprite{
    //constructor
    constructor(config, num){
        if (num < 52) { //normal card in stock
            super(config.scene, config.x, config.y, 'red_back');    //parent constructor
            this.value = values[num%13];                            //face value
            this.order = num%13+1;                                  //order of card by face value
            this.suit = suits[Math.floor(num/13)];                  //suit value
            this.isBlack = num < 26;                                //boolean value, if suit is black
            this.faceDown = true;                                   //bolean value, if card is facedown (initially true)
        } else { //invisible uninteractible placeholder in the foundations
            super(config.scene, config.x, config.y, 'blank');
            this.value = 0;
            this.order = 0;
            this.suit = suits[num-52];
            this.isBlack = num < 2;
            this.faceDown = false;
        }

        //add card to scene and scale appropriately
        config.scene.add.existing(this);
        this.setScale(.19);
    }

    //flip card over, update facedown value and interactivity
    flip(){
        this.faceDown = !this.faceDown;
        if(this.faceDown){
            this.setTexture('red_back');
            this.disableInteractive();
        }
        else{
            this.setTexture(this.value + "_of_" + this.suit);
            this.setInteractive();
        }
    }

    //move the card sprite's location
    move(newX, newY){
        this.x = newX;
        this.y = newY;
    }
}

function preload (){
    this.stock = new Array();                                                                                       //face down stock pile
    this.talon = new Array();                                                                                       //face up draw pile
    this.tableaus = [new Array(), new Array(), new Array(), new Array(), new Array(), new Array(), new Array()];    //columns of andom face down cards and ordered faceup cards
    this.foundations = [new Array(), new Array(), new Array(), new Array()];                                        //stacks of in order cards by suit
    this.dragObjs = new Array();                                                                                    //card(s) currently in your hand to be dragged elsewhere
    this.foundation_symbols = new Array();                                                                          //Invisible uninteractible cards as placeholders in foundations
    this.lastTime = 0;                                                                                              //Time stamp of last click (used to chack for double click)

    //load all images for background, blanks and back of cards
    this.load.image('red_back', 'assets/Card_Backs/red_back.png');
    this.load.image('silver_outline', 'assets/Backgrounds/silver_outline.png');
    this.load.image('wood', 'assets/Backgrounds/wood.jpg');
    this.load.image('plaque', 'assets/Backgrounds/plaque.png');
    this.load.image('blank', 'assets/Card_Fronts/blank.png');
    this.load.image('win', 'assets/Backgrounds/win.png');

    //load images for symbols in foundations
    for(var i = 0; i < 4; i++){
        this.load.image(suits[i], 'assets/Backgrounds/' + suits[i] + '.png');
        this.foundation_symbols.push(suits[i]);
    }

    //load imaged for each face up card
    for (var i = 0; i < 52; i++)
        var card_face = this.load.image(values[i%13] + "_of_" + suits[Math.floor(i/13)], "assets/Card_Fronts/" + values[i%13] + "_of_" + suits[Math.floor(i/13)] + ".png");
}

function create (){
    //display background images and winning image
    //wood = this.add.image(480, 300, 'wood');
    //wood.setScale(.5);
    plaque = this.add.image(600, 80, 'plaque');
    plaque.setScale(.5);
    win_image = this.add.sprite(-480, 300, 'win');
    win_image.depth = 200;

    //display and scale outlines for each tableau, foundation, stock and talon, as well as symbols and blank cards in foundations
    for (var i = 0; i < 13; i++){
        if (i < 4){
            outline = this.add.image(FOUNDATIONS_START_X + COLUMN_OFFSET * i, TOP_ROW_Y, 'silver_outline');
            symbol = this.add.image(FOUNDATIONS_START_X + COLUMN_OFFSET * i, TOP_ROW_Y, this.foundation_symbols[i]);
            symbol.setScale(.19);
            this.foundations[i].push(new Card({scene:this,x:FOUNDATIONS_START_X + COLUMN_OFFSET * i,y:TOP_ROW_Y}, i+52));
        } else if (i < 11)
            outline = this.add.image(TABLEAU_START_X + COLUMN_OFFSET * (i-4), TABLEAU_Y, 'silver_outline');
        else
            outline = this.add.image(STOCK_START_X + COLUMN_OFFSET * (11-i), TOP_ROW_Y, 'silver_outline');
        outline.setScale(.2);
    }

    //create each card and add them to stock pile
    for(var i = 0; i < 52; i++)
        this.stock.push(new Card({scene:this,x:900,y:80}, i));
    
    //shuffle the stock pile and deal cards to begin play
    shuffle(this.stock);
    deal(this.stock, this.tableaus);

    //set up listeners for mouse click and 'R' keypress.
    this.keyR = this.input.keyboard.addKey('R');
    this.keyR.on('down', startPressR, this);
    this.input.on('pointerdown', startDrag, this);
}

//stop listening for R key down, and listen for R key up to reset Game
function startPressR(){
    this.keyR.off('down', startPressR, this);
    this.keyR.on('up', resetGame, this);
}

//gather all cards back to stock, reshuffle and redeal
function resetGame(){
    //gather cards from talon
    for(var j = 0; j < this.talon.length; j++)
        this.stock.push(this.talon.pop());

    //gather cards from hand
    for(var j = 0; j < this.dragObjs.length; j++)
        this.stock.push(this.dragObjs.pop());

    //gather cards from foundations
    for(var i = 0; i < 4; i++)
        while(this.foundations[i].length > 1)
            this.stock.push(this.foundations[i].pop());

    //gather cards from tableaus
    for(var i = 0; i < 7; i++)
        while(this.tableaus[i].length > 0)
            this.stock.push(this.tableaus[i].pop());

    //flip any face up cards in stock back to face down
    for(var i = 0; i < this.stock.length; i++)
        if(!this.stock[i].faceDown)
            this.stock[i].flip();
    
    //shuffle the deck and redeal
    shuffle(this.stock);
    deal(this.stock, this.tableaus);

    //remove win image from visible area
    win_image.x = -480;

    //stop listening for R key up, and listen to R key down, turn on click listener
    this.keyR.off('up', resetGame, this);
    this.keyR.on('down', startPressR, this);
    this.input.on('pointerdown', startDrag, this);
}

//randomly rearrange the stock pile of cards
function shuffle(deck){
    for (var i = 0; i < 1000; i++){
        var randA = Math.floor(Math.random()*deck.length);  //random number 0 - deck size - 1
        var randB = Math.floor(Math.random()*deck.length);  //random number 0 - deck size - 1

        //swap values at index randA and randB
        var newB = deck[randA];                             //holding variable for number to be swapped
        deck[randA] = deck[randB];
        deck[randB] = newB;
    }
}

//distribute cards from stock to tableaus starting with one card,
//then additional card for each additional column of tableaus, flip them face up
function deal(deck, tableaus){
    for(var i = 0; i < 7; i++){
        for(var j = 0; j < i + 1; j++)
            tableaus[i].push(deck.pop());
        tableaus[i][tableaus[i].length-1].flip();
    }
}

//start the process of dragging one or more cards
function startDrag(pointer, targets){
    //targets represents an interactable sprite (i.e. only a face up sprite)
    //find out if there is a target, or, if not, if the click occured on the stock pile
    if(targets.length){
        //click occured on a target
        clickDelay = this.time.now - this.lastTime;                             //click Delay is the time between now and the last click (to determine if double clicked)
        this.lastTime = this.time.now;                                          //last time is set to the current time for future clicks
        this.last_pos = position(targets[0].x, targets[0].y, this.tableaus);    //determine the position of the clicked item
        if(clickDelay < 350) {
            //double click occured, if it's a valid movement, send card to appropriate foundation
            var index = suits.indexOf(targets[0].suit); //the index of the appropriate foundation

            //if move to foundation is valid, add card from respective location to the hand (dragObjs), then transfer to the foundation
            if(isValidFoundation(targets[0], this.foundations[index]))
                if(this.last_pos >= 4){
                    if(this.last_pos < 11)
                        this.dragObjs.push(this.tableaus[this.last_pos - 4].pop());
                    else
                        this.dragObjs.push(this.talon.pop());
                    transfer(this.dragObjs, index, this.last_pos, this.tableaus, this.foundations);
                }
        } else {
            //drag occured on target
            //disable listener for click down
            this.input.off('pointerdown', startDrag, this);

            this.offsetX = pointer.x - targets[0].x;    //the displacement between the card's x coordinate and the pointer's x coordinate
            this.offsetY = pointer.y - targets[0].y;    //the displacement between the card's y coordinate and the pointer's y coordinate
                
            //find location of target, and move card(s) to hand for dragging
            if (this.last_pos < 4)
                //target is in foundations
                moveToHand(this.dragObjs, this.foundations[this.last_pos], this.foundations[this.last_pos].length - 1);
            else if(this.last_pos >= 4 && this.last_pos < 11){
                //target is in tableaus
                column = this.last_pos - 4;                                                                     //the column in tableaus in which target is located
                depth = (this.tableaus[column][this.tableaus[column].length-1].y - targets[0].y)/FACEUP_OFFSET; //number of cards layered over target
                index = this.tableaus[column].length - 1 - depth;                                               //index location of the target

                moveToHand(this.dragObjs, this.tableaus[column], index);
            } else
                //target is in talon
                moveToHand(this.dragObjs, this.talon, this.talon.length - 1);

            //begin listening for pointer movement and end of click
            this.input.on('pointermove', doDrag, this);
            this.input.on('pointerup', stopDrag, this);
        }
    } else if(isInBounds(pointer.x, pointer.y,
        STOCK_START_X - 48, STOCK_START_X + 48,
        TOP_ROW_Y - 69, TOP_ROW_Y + 69))
        //click is on stock pile; if stock has cards, flip the top one, else restock from talon
        if(this.stock.length > 0)
            flip_card(this.stock, this.talon);
        else if (this.talon.length > 0)
            restock(this.stock, this.talon);
}

//move card(s) from an array to dragObjs
function moveToHand(dragObjs, fromArray, index){
    var i = 0;
    while (index < fromArray.length){
        dragObjs.push(fromArray.splice(index, 1)[0]);
        dragObjs[dragObjs.length - 1].depth = 100 + i;
        i++;
    }
}

//transfer card from stock pile to talon (draw pile), flip it and bring it to the top of the pile
function flip_card(stock, talon){
    talon.push(stock.pop());
    talon[talon.length-1].flip();
}

//transfer all cards from talon back to stock pile, flip them
function restock(stock, talon){
    while(talon.length > 0){
        stock.push(talon.pop());
        stock[stock.length - 1].flip();
    }
}

//update location of all cards in dragObjs
function doDrag(pointer){
    //for each object being dragged, move it relative to pointer
    for(var i = 0; i < this.dragObjs.length; i++){
        this.dragObjs[i].x = pointer.x - this.offsetX;
        this.dragObjs[i].y = pointer.y - this.offsetY + FACEUP_OFFSET * i;
    }
}

//stop dragging cards and determine if a transfer is appropriate, or if cards should be sent back to their original location
function stopDrag(pointer){
    var action_pos = position(pointer.x, pointer.y, this.tableaus); //determine actionable position (if any). 0-3: foundations; 4-10: tableaus; 11: talon (not actionable)
    
    //transfer if a valid move exists, otherwise send back
    if(action_pos >= 0 && action_pos < 4                                        //card dragged to foundations
        && this.dragObjs.length == 1                                            //only 1 card dragged
        && isValidFoundation(this.dragObjs[0], this.foundations[action_pos]))   //move is approproate
            //move card to foundation
            transfer(this.dragObjs, action_pos, this.last_pos, this.tableaus, this.foundations);
    else if (action_pos >= 4 && action_pos < 11                                 //card dragged to a tableau
        && isValidTableau(this.dragObjs[0], this.tableaus[action_pos - 4]))     //move is appropriate
            //move card(s) to tableau
            transfer(this.dragObjs, action_pos, this.last_pos, this.tableaus, this.foundations);
    else
        //inappropriate movement, send back
        sendBack(this.dragObjs, this.last_pos, this.foundations, this.tableaus, this.talon);
    
    //stop drag, return to listening for startDrag
    this.input.on('pointerdown', startDrag, this);
    this.input.off('pointermove', doDrag, this);
    this.input.off('pointerup', stopDrag, this);
}

//determine if x and y represent a special position and return that position's value, else return -1
function position(x, y, tableaus){
    var half_width = 48;    //half of the width of a card
    var half_height = 69;   //half of the height of a card

    //in bounds of talon, return 11
    if(isInBounds(x, y,
        STOCK_START_X - COLUMN_OFFSET - half_width, STOCK_START_X - COLUMN_OFFSET + half_width,
        TOP_ROW_Y - half_height, TOP_ROW_Y + half_height))
        return 11;

    //in bounds of any foundation position, retrun column of foundations
    for(var i = 0; i < 4; i++)
        if(isInBounds(x, y,
            FOUNDATIONS_START_X + COLUMN_OFFSET * i - half_width, FOUNDATIONS_START_X + COLUMN_OFFSET * i + half_width,
            TOP_ROW_Y - half_height, TOP_ROW_Y + half_height))
            return i;

    //in bounds of any tableau position, return column of tableaus + 4
    //(bounds extend from top of tableau to a full card height down from bottom)
    for(var i = 0; i < 7; i++)
        if(tableaus[i].length > 0
                && isInBounds(x, y, TABLEAU_START_X + COLUMN_OFFSET * i - half_width, TABLEAU_START_X + COLUMN_OFFSET * i + half_width,
                            TABLEAU_Y - half_height, tableaus[i][tableaus[i].length - 1].y + (2 * half_height))
            || tableaus[i].length == 0
                && isInBounds(x, y, TABLEAU_START_X + COLUMN_OFFSET * i - half_width, TABLEAU_START_X + COLUMN_OFFSET * i + half_width,
                            TABLEAU_Y - half_height, TABLEAU_Y + (2 * half_height)))
        return i + 4;

    //not special position
    return -1;
}

//determine if xMin <= x <= xMax, and yMin <= y <= yMax
function isInBounds(x, y, xMin, xMax, yMin, yMax){
    return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
}

//determine if the card is same suit and next higher order of foundation
function isValidFoundation(card, foundation){
    var last_index = foundation.length - 1;
    var last_card = foundation[last_index];
    return card.suit == last_card.suit && card.order == last_card.order + 1;
}

//determine if the card is opposite color and next lower order of bottom card of tableau
//OR space is empty and card is a king
function isValidTableau(card, tableau){
    var last_index = tableau.length - 1;
    var last_card = tableau[last_index];
    return (last_index == -1 && card.order == 13) //space is empty and card is king
        || (last_index >= 0 && card.isBlack != last_card.isBlack && card.order == last_card.order - 1); //card is opposite color and one less than last card

}

//move cards from dragObjs to new position in foundation or tableau
function transfer(dragObjs, new_pos, last_pos, tableaus, foundations){
    var new_column = new_pos - 4;  //get relevant column of tableau
    var last_column = last_pos - 4;  //get relevant column of tableau
    if(new_pos < 4)
        //moving card to foundation
        foundations[new_pos].push(dragObjs.shift());
    else 
        //moving card(s) to a tableau
        while(dragObjs.length > 0)
            tableaus[new_column].push(dragObjs.shift());

    //if card came from tableau and bottom of tableau is now face down, flip it
    if (last_pos >= 4 && last_pos < 11
        && tableaus[last_column].length > 0
        && tableaus[last_column][tableaus[last_column].length - 1].faceDown)
        tableaus[last_column][tableaus[last_column].length - 1].flip();
}

//return all cards in dragObjs to their original positions
function sendBack(dragObjs, old_pos, foundations, tableaus, talon){
    while(dragObjs.length > 0)
        if(old_pos < 4)
            foundations[old_pos].push(dragObjs.shift());
        else if (old_pos < 11)
            tableaus[old_pos-4].push(dragObjs.shift());
        else
            talon.push(dragObjs.shift());
}

//basic function of game object, constantly loops
//updates placement of sprites and checks for and performs winning condition
function update(){
    //update sprite placements and depths in all piles in the game
    this.foundations.forEach(placeFoundations);
    this.tableaus.forEach(placeTableaus);
    placeTalon(this.talon);
    placeStock(this.stock);

    //check for winning conditions,
    //i.e. foundations full OR stock, talon and dragObjs empty and no face down cards
    if(foundationsFull(this.foundations)
    || (noFaceDown(this.tableaus) && noStockTalonDragObjs(this.stock, this.talon, this.dragObjs))){
        //game won, autofill any empty foundations
        autofillFoundations(this.foundations, this.tableaus);

        //put winning image in visible area
        win_image.x = 480;

        //stop listening for click
        this.input.off('pointerdown', startDrag, this);
    }
}

//scan through all cards in foundation, update theit x, y and depth values appropriately
function placeFoundations(element, index){
    for(var i = 0; i < element.length; i++){
        if(element[i].x != FOUNDATIONS_START_X + COLUMN_OFFSET * index || element[i].y != TOP_ROW_Y)
        element[i].x = FOUNDATIONS_START_X + COLUMN_OFFSET * index;
        element[i].y = TOP_ROW_Y;
        element[i].depth = i;
    }
}

//scan through all cards in tableaus, update theit x, y and depth values appropriately
function placeTableaus(element, index){
    var anchor = TABLEAU_Y;
    for(var i = 0; i < element.length; i++){
        if(element[i].x != TABLEAU_START_X + COLUMN_OFFSET * index || element[i].y != anchor)
        element[i].depth = i;
        element[i].x = TABLEAU_START_X + COLUMN_OFFSET * index;
        element[i].y = anchor;
        element[i].faceDown ? anchor += FACEDOWN_OFFSET : anchor += FACEUP_OFFSET;
    }
}

//scan through all cards in talon, update theit x, y and depth values appropriately
function placeTalon(talon){
    for(var i = 0; i < talon.length; i++){
        if(talon[i].x != STOCK_START_X - COLUMN_OFFSET || talon[i].y != TOP_ROW_Y)
        talon[i].x = STOCK_START_X - COLUMN_OFFSET;
        talon[i].y = TOP_ROW_Y;
        talon[i].depth = i;
    }
}

//scan through all cards in stock, update theit x, y and depth values appropriately
function placeStock(stock){
    for(var i = 0; i < stock.length; i++){
        if(stock[i].x != STOCK_START_X || stock[i].y != TOP_ROW_Y)
        stock[i].x = STOCK_START_X;
        stock[i].y = TOP_ROW_Y;
        stock[i].depth = i;
    }
}

//determine if all foundations completely filled
function foundationsFull(foundations){
    return foundations[0].length == 14
    && foundations[1].length == 14
    && foundations[2].length == 14
    && foundations[3].length == 14;
}

//determine if there is are no cards in the tableaus that are face down
function noFaceDown(tableaus){
    for (var i = 0; i < 7; i++)
        for (var j = 0; j < tableaus[i].length; j++)
            if(tableaus[i][j].faceDown)
                return false;
    return true;
}

//determine if the stock, talon and dragObjs arrays are empty
function noStockTalonDragObjs(stock, talon, dragObjs){
    return stock.length == 0 && talon.length == 0 && dragObjs.length == 0;
}

//scan through all tableaus transferring all appropriate cards to foundation until foundation is full
function autofillFoundations(foundations, tableaus){
    var transfer_cards = new Array()
    while(!foundationsFull(foundations))
        //until foundations are full
        for(var i = 0; i < 7; i++)
            //scan through each tableau
            if(tableaus[i].length > 0) {
                // tableau is not empty, see if last card is valid for foundation and, if so, transfer it.
                var last = tableaus[i].length - 1;
                var index = suits.indexOf(tableaus[i][last].suit);
                var pos = position(tableaus[i][last].x, tableaus[i][last].y, tableaus);
                if(isValidFoundation(tableaus[i][last], foundations[index])){
                    transfer_cards.push(tableaus[pos - 4].pop());
                    transfer(transfer_cards, index, pos, tableaus, foundations);
                }
            }
}
