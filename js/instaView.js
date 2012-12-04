/* ---------------------------------
	VARIABLES
--------------------------------- */

// Controls
var resolution = [1440,900];
var speed = 10;
var state = 'loading'; // can also be 'grid', or 'featured'
var fps =30; // frames per second
var shuffleRate = 10;

// Appearance
var squareSize = 150;

// Helpers
var currentPos = [0,0];
var dx = 1;
var dy = 1;
var lastRender = new Date();
var frame = 0;

/* ---------------------------------
	SETUP
---------------------------------- */

// Grid 
	var gridCols = Math.ceil(resolution[0] / squareSize);
	var gridRows = Math.ceil(resolution[1] / squareSize);
	var gridWidth = gridCols * squareSize;
	var gridHeight = gridRows * squareSize;
	var gridTotal = gridRows * gridCols;
	function grid(num) {
		this.number = num,
		this.width = gridCols * squareSize,
		this.height = gridRows * squareSize,
		this.y = 0,
		this.x = 0,
		this.obj = {},
		this.index = {
			row : 0,
			col : 0,
			count : 0
		}
		return this;
	};
	var gridMaster = {
		active : 0,
		visible : [0],
		grids : []
	}
	for (x = 0; x<2; x++){
		for (y = 0; y<2; y++){
			var newGrid = new grid(x+y);
			newGrid.obj = $('<canvas class="gridMaster" width=' + newGrid.width + ' height='+ newGrid.height + ' style="display:none;">');
			$('#grid-images').append(newGrid.obj);
			gridMaster.grids.push(newGrid);
		}
	}
	$('#grid-images').append('<canvas id="gridView" width=' + resolution[0] + ' height='+ resolution[1] + '>');

// Shuffle
	var shuffle = {
		x2 : {
			counter: 1, 	// if true, throws a canvas, then counts down to 0 and repeats.
			container: '#x2',
			canvases : [] 	// receives objects.  {id, x, y, easing, counter}
		},
		x4 : {
			counter: 0,
			container : '#x4',
			canvases : []
		}
	};

  
/* ---------------------------------
	INITIALIZE
--------------------------------- */
	
loadGrid('initialize');


/* ---------------------------------
	FUNCTIONS
--------------------------------- */

function loadGrid(whenDone) {
//  Load Images, paint them, and advance grid object counter
	$('#grid-images .images').find('img').not('.painted').each(function() { 
//		Get Grid Master
		var grid = gridMaster.grids[gridMaster.visible[0]];
//		Get Placements
		var ctx = grid.obj[0].getContext('2d');
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
		  if(grid.index.count >= gridTotal) { 
		//	Switch active master grid
		  	gridMaster.visible[0] = gridMaster.visible[0]+1 > 3 ? 0 : gridMaster.visible[0]+1;
		  }
	}); // .each()

//	Handle First Load
	if (whenDone == 'initialize') { 
	//  Make Sure the grid is filled
		if (gridMaster.grids[3].index.count < gridTotal) {
			$('#grid-images .images').removeClass('painted');
			loadGrid('initialize');
		}
		else {
			state = 'grid';
			crank();
		};
	}
} // loadGrid

function crank() {
// Run the order of events :  Postitioning, Featured Image Check, Shuffle
//	1. Advance Positioning of moveable elements
	var dt = new Date() - lastRender;
	rectangle(currentPos[0], currentPos[1], dt);
	currentPos[0] = currentPos[0] - dx;
	currentPos[1] = currentPos[1] - dy;
	lastRender = new Date();
//	2. Move Grid
	moveGrid();
//  3. Featured Image call
	var cue = $('#featured-images .images').find('img').length;
	if (cue > 0 && state != 'featured') {
		featured();
	}
//	Shuffle Call
	else if (state != 'featured') {
		if (shuffle.x2.counter >= 1) {
			shuffle.x2.counter = 0;
			newShuffle(shuffle.x2, 2);
		}
		if (shuffle.x4.counter >= 1) {return false;
			shuffle.x4.counter = 0;
			newShuffle(shuffle.x4, 4);
		}
		updateShuffle(shuffle.x2);
		//updateShuffle(shuffle.x4);
	}
//  Aaaand Repeat!
	frame++;
	setTimeout('crank()', 1000/fps);
	//	requestAnimationFrame(crank);
}

function moveGrid() { 
//	Apply dx/dy
	var active = gridMaster.active; 
	var cue =   active == 0 ? [1,2,3] :
				active == 1 ? [2,3,0] :
				active == 2 ? [3,0,1] :
				active == 3 ? [0,1,2] : false;
	var x = gridMaster.grids[active].x;
	var y = gridMaster.grids[active].y; // console.log(x + ', ' + y);
	gridMaster.grids[active].x = x - dx;
	gridMaster.grids[active].y = y - dy;
//	Our Conditions
//	1. No New Active
	if (x <= 0 && y == 0 && Math.abs(x) < gridWidth) { 
		drawGrid({
			pos : 'right',
			grids : [active, cue[0]]
		});
	}
	else if (y < 0 && x == 0 && Math.abs(y) < gridHeight) {
		drawGrid({
			pos : 'below',
			grids : [active, cue[0]]
		});
	}
	else if (x < 0 && y < 0 && Math.abs(x) < gridWidth && Math.abs(y) < gridHeight) {
		drawGrid({
			pos : 'both',
			grids : [active, cue[0], cue[1], cue[2]]
		});
	}
//  New Active
	else if (Math.abs(x) > gridWidth && y ==0 ) {  
		gridMaster.active = cue[0];
		gridMaster.grids[cue[0]].x = x-gridWidth;
		gridMaster.grids[cue[0]].y = 0;
		moveGrid();
	}
	else if (Math.abs(y) > gridHeight && x == 0 ) {  
		gridMaster.active = cue[0];
		gridMaster.grids[cue[0]].x = 0;
		gridMaster.grids[cue[0]].y = y-gridHeight;
		moveGrid();
	}
	else if (Math.abs(x)>gridWidth && Math.abs(y)>gridHeight) { console.log('nob')
		gridMaster.active = cue[0];
		gridMaster.grids[cue[0]].x = 0;
		gridMaster.grids[cue[0]].y = 0;
		moveGrid();
	}
	else {alert('you stink: ' + x + ' ,' + y)};
}

function drawGrid(args) { //console.log(args.pos)
	var ctx = document.getElementById('gridView').getContext('2d');
	var x = gridMaster.grids[args.grids[0]].x
	var y = gridMaster.grids[args.grids[0]].y
//	Draw the canvases
	//ctx.drawImage(gridMaster.grids[args.grids[0]].obj[0], x, y);
	ctx.fillRect(x,y,1400,900);
	if (args.pos == 'right'){
		ctx.drawImage(gridMaster.grids[args.grids[1]].obj[0], x+gridWidth, y);
	}
	if (args.pos == 'below'){
		ctx.drawImage(gridMaster.grids[args.grids[1]].obj[0], x, y+gridHeight);
	}
	if (args.pos == 'both'){
		ctx.drawImage(gridMaster.grids[args.grids[1]].obj[0], x+gridWidth, y);
		ctx.drawImage(gridMaster.grids[args.grids[2]].obj[0], x, y+gridHeight);
		ctx.drawImage(gridMaster.grids[args.grids[3]].obj[0], x+gridWidth, y+gridHeight);
	}
}

function featured() {
	alert('featured');
}

/*
	SHUFFLE FUNCTIONS
*/
function newShuffle(handler, size) { //console.log('New frame ' +frame)
//	Create the Animated Canvas.  PLUGABLE
	var can = new simpleCan(squareSize * size);
	can.appendTo(handler.container + ' .paintings');
//	Add it our Positioning Cue
	var place = handPlacement(size);
	handler.canvases.push({
		x: place[0],
		y: place[1],
		targetX : place[2],
		targetY : place[3],
		age : 0,
		obj : can
	})
//	Update Counters
	handler.counter = handler.counter + shuffleRate/1000;
}
function updateShuffle(handler, size) { //console.log('Update frame ' + frame)
	var kill = 0;
	for (i=0; i<handler.canvases.length; i++){
		var canInfo = handler.canvases[i];
		var animCanvas = handler.canvases[i].obj;
	//	Kill Dead Canvases
		if (canInfo.age > 300) {
			kill++;
		}
	//	Move Live Canvases
		else {
		//	Calculate where to put the canvas
			//canInfo.targetX = Math.abs(canInfo.x-canInfo.targetX) > 1 ? canInfo.targetX - dx : dx;
			//canInfo.targetY = Math.abs(canInfo.y-canInfo.targetY) > 1 ? canInfo.targetY - dy : dy;
			canInfo.targetX = canInfo.targetX - dx;
			canInfo.targetY = canInfo.targetY - dy;
			canInfo.x = Math.round(canInfo.x + ((canInfo.targetX - canInfo.x) / shuffleRate));
			canInfo.y = Math.round(canInfo.y + ((canInfo.targetY - canInfo.y) / shuffleRate));
		//  Now put it there - either by css or CANVAS (preferreable)
			animCanvas.css({
				left : canInfo.x + 'px',
				top : canInfo.y + 'px'
			}); 
			//var viewCtx = document.getElementById('gridView').getContext('2d');
			//viewCtx.drawImage(animCanvas[0], canInfo.x, canInfo.y);
		//	Update Counters
			canInfo.age++;
		};
	} // for 
	for (j=0; j< kill; j++) {
		handler.canvases[j].obj.remove();
		handler.canvases.shift();
	};
//	Update Counters
	handler.counter = handler.counter + shuffleRate/1000;
}

/* ----------------------------------------------------------------------------------------
	PLUGINS
		1. Positioning Functions
		2. Canvas Shuffle Animations
----------------------------------------------------------------------------------------- */

function rectangle(x, y, dt) { 
//  Go Around
	if (x > -resolution[0] && y >= 0 ) {
		movex = 1; movey = 0;
	}
	else if (x <= -resolution[0] && y > -resolution[1] ) { 
		movey = 1; movex = 0;
	}
	else if (y <= -resolution[1] && x <= 0) {
		movex = -1; movey = 0;
	}
	else {
		movex = 0; movey = -1;
	};
	
	dx = (movex * dt * speed/100);
	dy = (movey * dt * speed/100);
		
	x = x - dx;
	y = y - dy;
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

// ANIMATED
function simpleCan(size) {
	var can = $('<canvas>').attr({
		width: size, height: size,
		style : 'left:-2000px; top:-2000px'
	})
	var ctx = can[0].getContext('2d');
	ctx.fillRect(0,0,300,300);
	return can;
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
    
// Get Random Starting point
function handPlacement(size) {
	var randDir = Math.round(Math.random()*4);
	
	var firstSquareX = (-currentPos[0] % squareSize) ; 
	var firstSquareY = (-currentPos[1] % squareSize); 
	//console.log(firstSquareX + ', ' + firstSquareY);
	
	
	var x = randDir % 4 == 0 ? firstSquareX + resolution[0] : // from right
			randDir % 3 == 0 ? firstSquareX - squareSize : // from left
			randDir % 2 == 0 ? firstSquareX :
			randDir % 1 == 0 ? firstSquareX  : false;
	
	var y = randDir % 4 == 0 ? firstSquareY : 
			randDir % 3 == 0 ? firstSquareY :
			randDir % 2 == 0 ? firstSquareY + resolution[1] : // from top
			randDir % 1 == 0 ? firstSquareY - squareSize : false; // from bottom
			
	return [x,y, Math.random()*resolution[0], Math.random()*resolution[1]];
};



