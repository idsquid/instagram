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
var dx = 0;
var dy = 0;
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

// GO!	
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
	diag(currentPos[0], currentPos[1], dt);
	currentPos[0] = currentPos[0] - dx; 
	currentPos[1] = currentPos[1] - dy;
		/* currentPos[0] = currentPos[0] < -squareSize ? currentPos[0] + squareSize :
						currentPos[0] > 0 ? currentPos[0] - squareSize : currentPos[0];
		currentPos[1] = currentPos[1] < -squareSize ? currentPos[1] + squareSize :
						currentPos[1] > 0 ? currentPos[1] - squareSize : currentPos[1]; */
	lastRender = new Date();
//	2. Move Grid
	moveGrid(true);
//  3. Featured Image call
	var cue = $('#featured-images > .images').find('img').length;
	if (cue > 0 && state != 'featured') {
		featured();
	}
//	Shuffle Call
	else if (state != 'featured') {
		if (shuffle.x2.counter >= 1) {
			shuffle.x2.counter = 0;
			newShuffle(shuffle.x2, 2);
		}
		if (shuffle.x4.counter >= 1.3) { //return false;
			shuffle.x4.counter = 0;
			newShuffle(shuffle.x4, 4);
		}
	}
	updateShuffle(shuffle.x2);
	updateShuffle(shuffle.x4);
	
//  Aaaand Repeat!
	/* frame++;
	if (frame == 60) {
		var image = $('<img src="img/image.jpg" />');
		$('#featured-images > .images').append(image);
	} */
	setTimeout('crank()', 1000/fps);
	//requestAnimationFrame(crank);
}

function moveGrid(firstCall) { //console.log('moveGrid: ' + frame);
//	Apply dx/dy
	var active = gridMaster.active; 
	var cue =   active == 0 ? [1,2,3] :
				active == 1 ? [2,3,0] :
				active == 2 ? [3,0,1] :
				active == 3 ? [0,1,2] : false;
	if (firstCall) {
		gridMaster.grids[active].x = gridMaster.grids[active].x - dx;
		gridMaster.grids[active].y = gridMaster.grids[active].y - dy;
	}
	var x = gridMaster.grids[active].x;
	var y = gridMaster.grids[active].y; // console.log(x + ', ' + y);

//	Our Conditions
	// Same active	
	if (x<=0 && y<=0 && x >= -gridWidth && y >= -gridHeight) {
		drawGrid({
			pos : 'both',
			grids : [active, cue[0], cue[1], cue[2]]
		});
	}
	// New Actives
	else if (x>0 && y<=0) { 
		gridMaster.active = cue[0];
		gridMaster.grids[cue[0]].x = x-gridWidth;
		gridMaster.grids[cue[0]].y = y;
		moveGrid(false);	
	}
	else if (x<=0 && y>0) { 
		gridMaster.active = cue[1];
		gridMaster.grids[cue[1]].x = x;
		gridMaster.grids[cue[1]].y = y-gridHeight;
		moveGrid(false);
	} 
	else if (x>0 && y>0) { 
		gridMaster.active = cue[2];
		gridMaster.grids[cue[2]].x = x-gridHeight;
		gridMaster.grids[cue[2]].y = y-gridHeight;
		moveGrid(false);	
	}
	else if (x<-gridWidth && y>-gridHeight) { 
		gridMaster.active = cue[0];
		gridMaster.grids[cue[0]].x = x+gridWidth;
		gridMaster.grids[cue[0]].y = y;
		moveGrid(false);	
	}
	else if (x>-gridWidth && y<-gridHeight) { 
		gridMaster.active = cue[1];
		gridMaster.grids[cue[1]].x = x;
		gridMaster.grids[cue[1]].y = y+gridHeight;
		moveGrid(false);	
	}
	else if (x<-gridWidth && y<-gridHeight) { 
		gridMaster.active = cue[2];
		gridMaster.grids[cue[2]].x = x+gridWidth;
		gridMaster.grids[cue[2]].y = y+gridHeight;
		moveGrid(false);	
	}
	else {alert('you still stink! ' + x + ', ' + y)};
}

function drawGrid(args) { //console.log('Draw Grid: ' +frame)
	var ctx = document.getElementById('gridView').getContext('2d');
	var x = gridMaster.grids[args.grids[0]].x
	var y = gridMaster.grids[args.grids[0]].y
//	Draw the canvases
	ctx.drawImage(gridMaster.grids[args.grids[0]].obj[0], x, y);
	//ctx.fillRect(x,y,1400,900);
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
//	Kill shuffle canvases	
	$('#shuffle-images > .paintings').find('canvas').each(function() {
		$(this).slideToggle(function() {
			$(this).remove();
		})
	});
}

/*
	SHUFFLE FUNCTIONS
*/
function newShuffle(handler, size) { 
//	Get the image to be painted
	if ($(handler.container).find('> .images > img').length) {
		var image = $(handler.container).find('> .images > img').first();
	//	this image will now be painted, so move it to the archive
		image.prependTo(handler.container + '>.images > .archive');
	}
	else if ($(handler.container).find('> .images > .archive > img').length) {
		var randImage = Math.floor(Math.random() * $(handler.container).find('> .images > .archive > img').length);
		var image = $(handler.container).find('> .images > .archive > img:eq('+randImage+')');
	}
	else {return false;}
//	Create the Animated Canvas.  PLUGABLE
	var can = new simpleCan(squareSize * size, image[0]);
	can.appendTo('#shuffle-images > .paintings');
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
function updateShuffle(handler, size) { //console.log('Update Shuffle: ' + frame)
	var kill = 0;
	for (i=0; i<handler.canvases.length; i++){
		var canInfo = handler.canvases[i];
		var animCanvas = handler.canvases[i].obj;
	//	Kill Dead Canvases
		if (canInfo.age > 300) {
			kill++;
		}
	//	Move Live Canvases
		else if (canInfo.age > 0) {
		//	Calculate where to put the canvas
			var distX = canInfo.targetX - canInfo.x;
			var distY = canInfo.targetY - canInfo.y;
			if (Math.abs(distX) > 0 || Math.abs(distY) > 0) {
				canInfo.x = canInfo.x + distX / 5;
				canInfo.y = canInfo.y + distY / 5;
			}
				canInfo.x = canInfo.x - dx;
				canInfo.y = canInfo.y - dy;
				canInfo.targetX = canInfo.targetX - dx;
				canInfo.targetY = canInfo.targetY - dy;
		//  Now put it there - either by css or CANVAS (preferreable)
			animCanvas.css({
				left : canInfo.x + 'px',
				top : canInfo.y + 'px'
			});  
			//var viewCtx = document.getElementById('gridView').getContext('2d');
			//viewCtx.drawImage(animCanvas[0], canInfo.x, canInfo.y);
		}
		//	Update Counters
			canInfo.age++;
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

function rectangle(x, y, dt) { //return false;
//  Go Around
	if (x >= -resolution[0] && y >= 0 ) {
		movex = 1; movey = 0;
	}
	else if (x < -resolution[0] && y >= -resolution[1] ) { 
		movex = 0; movey = 1; 
	}
	else if (y < -resolution[1] && x <= 0) {
		movex = -1; movey = 0;
	}
	else {
		movex = 0; movey = -1;
	};
	
	dx = Math.round(movex * dt * speed/100);
	dy = Math.round(movey * dt * speed/100); 
		
	x = x - dx;
	y = y - dy;
	return [x, y];
}

function diag(x,y,dt) {
	dx = Math.round(0 * dt * speed/100);
	dy = Math.round(-1 * dt * speed/100); 
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
function simpleCan(size, img) {
	var can = $('<canvas>').attr({
		width: size, height: size,
		style : 'left:-2000px; top:-2000px'
	})
	var ctx = can[0].getContext('2d');
	ctx.drawImage(img, 0, 0, size, size);
	//ctx.fillRect(0,0,300,300);
	return can;
}

/* ----------------------------------------------------------------------------------------
	UTILITIES
----------------------------------------------------------------------------------------- */

// Adjusted 
    
// Get Random Starting point
function handPlacement(size) {
	var randDir = Math.round(Math.random()*4);
	
	var firstSquareX = currentPos[0] % squareSize ; 
	var firstSquareY = currentPos[1] % squareSize; 
	//alert(firstSquareX + ', ' + firstSquareY);
	
	var targetSquareX = Math.round(Math.random()*(gridCols-3)) * squareSize + firstSquareX;
	var targetSquareY = Math.round(Math.random()*(gridRows-3)) * squareSize + firstSquareY - squareSize;
	
	var x = randDir % 4 == 0 ? targetSquareX + gridWidth : // from right
			randDir % 3 == 0 ? targetSquareX - gridWidth : // from left
			randDir % 2 == 0 ? targetSquareX :
			randDir % 1 == 0 ? targetSquareX  : false;
	
	var y = randDir % 4 == 0 ? targetSquareY : 
			randDir % 3 == 0 ? targetSquareY :
			randDir % 2 == 0 ? targetSquareY + gridHeight : // from top
			randDir % 1 == 0 ? targetSquareY - gridHeight : false; // from bottom

	//console.log('Hand Placement. X: ' + targetSquareX + ', Y: ' + targetSquareY);
	return [x,y, targetSquareX, targetSquareY];
};



