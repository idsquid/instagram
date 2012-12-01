/* ---------------------------------
	VARIABLES
--------------------------------- */

// Controls
var resolution = [1440,900];
var speed = 10;
var state = 'loading'; // can also be 'grid', or 'featured'

// Appearance
var squareSize = 150;

// Helpers
var currentPos = [0,0];
var dx = 1;
var dy = 1;
var lastRender = new Date();

/* ---------------------------------
	SETUP
---------------------------------- */

// Grid
	var gridCols = Math.ceil(resolution[0] * 2 / squareSize);
	var gridRows = Math.ceil(resolution[1] * 2 / squareSize);
	var gridTotal = gridRows * gridCols;
	var grid = {
		width : gridCols * squareSize,
		height : gridRows * squareSize,
		index : {
			row : 0,
			col : 0,
			count : 0
		}
	};
	$('#grid-images').append('<canvas id="gridCanvas" width=' + grid.width + ' height='+ grid.height + ' style="display:none;">');
	$('#grid-images').append('<canvas id="gridView" width=' + resolution[0] + ' height='+ resolution[1] + '>');

// Shuffle
	var shuffle = {
		width: grid.width,
		height: grid.height,
		targetCorner : [0,0]
	}

  
/* ---------------------------------
	INITIALIZE
--------------------------------- */
	
theGrid('initialize');


/* ---------------------------------
	FUNCTIONS
--------------------------------- */

function theGrid(whenDone) {
//  Load Images, paint them, and advance grid object counter
	$('#grid-images .images').find('img').not('.painted').each(function() {
//		Get Placements
		var ctx = document.getElementById('gridCanvas').getContext('2d');
		var x = grid.index.col;
		var y = grid.index.row; //console.log(x + ', ' + y);
	
//		Draw Image
		var thumbnail = $(this)[0];
		ctx.drawImage(thumbnail,x*squareSize, y*squareSize, squareSize, squareSize);
		grid.index.count++;		
	  
// 		Advance counter 
		  grid.index.col++;
		  if (grid.index.col >= gridCols) {
		  	grid.index.col = 0;
		  	grid.index.row++;
		  	if (grid.index.row >= gridRows) {
		  		grid.index.row = 0
		  	}
		  }
	}); // .each()

//	Handle First Load
	if (whenDone == 'initialize') {
		// Make Sure the grid is filled
		if (grid.index.count < gridTotal && grid.index.count > 0) {
			$('#grid-images .images').removeClass('painted');
			theGrid('initialize');
		}
		else {
			state = 'grid';
			crank();
		};
	}
} // theGrid

function crank() {
// Run the order of events :  Postitioning, Featured Image Check, Shuffle
//	1. Advance Positioning of moveable elements
	position();
//  2. Featured Image call
	var cue = $('#featured-images .images').find('img').length;
	if (cue > 0 && state != 'featured') {
		featured();
	}
//	Shuffle Call
	else if (state != 'featured') {
		shuffleImages();
	}
//  Aaaand Repeat!
	setTimeout('crank()', 1000/30);
	//	requestAnimationFrame(crank);
}

function position() {
//	Get position from Plugin
	var moveMe = rectangle(currentPos[0], currentPos[1], new Date() - lastRender);
	lastRender = new Date();
//  Draw to our visible grid Canvas
	var viewCtx = document.getElementById('gridView').getContext('2d');
	viewCtx.drawImage($('#gridCanvas')[0], moveMe[0], moveMe[1]);	
//	Advance Counter
	currentPos[0] = moveMe[0];
	currentPos[1] = moveMe[1];
}

function featured() {
	alert('featured');
}

function shuffleImages() {
	//alert('shuffle');
}

/* ----------------------------------------------------------------------------------------
	PLUGINS
		1. Positioning Functions
		2. Canvas Shuffle Animations
----------------------------------------------------------------------------------------- */

function rectangle(x, y, dt) { 
//  Go Around
	if (x > -resolution[0] && y >= 0 ) {
		dx = 1; dy = 0;
	}
	else if (x <= -resolution[0] && y > -resolution[1] ) {
		dy = 1; dx = 0;
	}
	else if (y <= -resolution[1] && x <= 0) {
		dx = -1; dy = 0;
	}
	else {
		dx = 0; dy = -1;
	};
		
	x = x - (dx * dt * speed/100);
	y = y - (dy * dt * speed/100);
	return [x, y];
}

function edgeBounce(x, y, dt) { // not done
//  Go Around
	if ((dx < 0) && (x <= 0))
      dx = -dx;
    else if ((dx > 0) && (x >= resolution[0]))
      dx = -dx;
    
    if ((dy < 0) && (y <= 0))
      dy = -dy;
    else if ((dy > 0) && (y >= resolution[1]))
      dy = -dy;
		
	x = x - (dx * dt * speed/1000);
	y = y - (dy * dt * speed/1000);
	return [x, y];
}

/* ----------------------------------------------------------------------------------------
	UTILITIES
----------------------------------------------------------------------------------------- */

// Adjusted 
// Animation Frame
	window.requestAnimationFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })();




