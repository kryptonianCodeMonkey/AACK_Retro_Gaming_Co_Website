/* Program name: main_3x3.js
*  Author: Cory Knoll
*  Date Last Modified: 12/4/2019
*  Purpose: 3x3 tile puzzle game in Phaser framework to be embedded in AACK Retro Gaming website
*/

//configuration for phaser game object
var config = {
    type: Phaser.AUTO,
    width: 410,
    height: 410,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

//instance of phaser game
var game = new Phaser.Game(config);

//load assets before creating game
function preload ()
{
    //preload all of the image assets for the game
    this.load.image('pixelBG', 'assets/3x3_Puzzle/pixelBG.png');
    this.load.image('logo', 'assets/3x3_Puzzle/logo.png');
    this.load.image('logo1', 'assets/3x3_Puzzle/logo1.png');
    this.load.image('logo2', 'assets/3x3_Puzzle/logo2.png');
    this.load.image('logo3', 'assets/3x3_Puzzle/logo3.png');
    this.load.image('logo4', 'assets/3x3_Puzzle/logo4.png');
    this.load.image('logo5', 'assets/3x3_Puzzle/logo5.png');
    this.load.image('logo6', 'assets/3x3_Puzzle/logo6.png');
    this.load.image('logo7', 'assets/3x3_Puzzle/logo7.png');
    this.load.image('logo8', 'assets/3x3_Puzzle/logo8.png');
    this.load.image('logo9', 'assets/3x3_Puzzle/logo9.png');
}

//create global variables for game
var grid_locations = [77, 205, 333]; //discreet x/y coordinates for tiles on grid
var open_index = 8;                  //starting empty tile index of grid
var game_won = false;                //track if current game is won

//create all images for puzzle, place them on grid locations, and randomize them
function create ()
{
    //apply images to starting locations
    background = this.add.image(grid_locations[1], grid_locations[1], 'pixelBG');
    logo1 = this.add.image(grid_locations[0], grid_locations[0], 'logo1');
    logo2 = this.add.image(grid_locations[1], grid_locations[0], 'logo2');
    logo3 = this.add.image(grid_locations[2], grid_locations[0], 'logo3');
    logo4 = this.add.image(grid_locations[0], grid_locations[1], 'logo4');
    logo5 = this.add.image(grid_locations[1], grid_locations[1], 'logo5');
    logo6 = this.add.image(grid_locations[2], grid_locations[1], 'logo6');
    logo7 = this.add.image(grid_locations[0], grid_locations[2], 'logo7');
    logo8 = this.add.image(grid_locations[1], grid_locations[2], 'logo8');

    //create grid array for tiles initialized to starting locations
    grid_logos = [logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8, null];

    randomize();

    //event listener to handle tile clicking
    this.input.on('pointerdown', click_resolution);
}

//continuously loop and check for winning conditions
function update ()
{
    //establish winning grid layout
    var winning_grid = [logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8, null];
    
    if(!game_won)
    {
        game_won = true;
        //tile image location should always correspond to grid array index
        for(var i = 0; i < 9; i++){
            if (grid_logos[i] != null){
                grid_logos[i].x = grid_locations[i % 3];
                grid_logos[i].y = grid_locations[Math.floor(i / 3)];
            }

            //if all grid logos match winning grid, game won!
            if (game_won && grid_logos[i] != winning_grid[i])
                game_won = false;
        }
    } else {
        logo9 = this.add.image(grid_locations[2], grid_locations[2], 'logo9');
        grid_logos[8] = logo9;
    }
}

//perform 1000 random click functions to jumple the tiles
function randomize(){
    //run through a thousand random indexes
    for (var i = 0; i < 1000; i++){
        var rd1 = Math.floor(Math.random() * 9);
        //if random tile is adjacent to empty space, swap them
        if (open_index % 3 != 0 && rd1 == open_index - 1 ||
            open_index % 3 != 2 && rd1 == open_index + 1 ||
            open_index >= 3 && rd1 == open_index - 3 ||
            open_index <= 5 && rd1 == open_index + 3){
            
            //swap null value and clicked index
            grid_logos[open_index] = grid_logos[rd1];
            grid_logos[rd1] = null;

            //keep track of current open index
            open_index = rd1;
        }
    }
}

//if a clicked tile is able to move, swap it with empty space
function click_resolution(event)
{
    if(!game_won){
        //get column of click (64 is half of tile width)
        if(event.x >= grid_locations[0] - 64 && event.x <= grid_locations[0] + 64)
            var column = 0;
        else if(event.x >= grid_locations[1] - 64 && event.x <= grid_locations[1] + 64)
            var column = 1;
        else if(event.x >= grid_locations[2] - 64 && event.x <= grid_locations[2] + 64)
            var column = 2;
        
        //get row of click (64 is half of tile height)
        if(event.y >= grid_locations[0] - 64 && event.y <= grid_locations[0] + 64)
            var row = 0;
        else if(event.y >= grid_locations[1] - 64 && event.y <= grid_locations[1] + 64)
            var row = 1;
        else if(event.y >= grid_locations[2] - 64 && event.y <= grid_locations[2] + 64)
            var row = 2;
        
        //get corresponding index of tile clicked
        var clicked_index = 3*row + column;

        //if clicked tile is adjacent to empty space, swap them
        if (open_index % 3 != 0 && clicked_index == open_index - 1 ||
            open_index % 3 != 2 && clicked_index == open_index + 1 ||
            open_index >= 3 && clicked_index == open_index - 3 ||
            open_index <= 5 && clicked_index == open_index + 3){
            
            //swap null value and clicked index
            grid_logos[open_index] = grid_logos[clicked_index];
            grid_logos[clicked_index] = null;

            //keep track of current open index
            open_index = clicked_index;
        }
    }
}