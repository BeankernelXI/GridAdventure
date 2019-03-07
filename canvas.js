var canvas = document.querySelector('canvas');
var cc = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 500;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;    // for now assume it never resizes
const canvasCenter = {x:canvasWidth/2,y:canvasHeight/2};

const SimpleColor = {
  red: '#e6194b', green: '#3cb44b', yellow: '#ffe119', blue: '#4363d8', orange: '#f58231', purple: '#911eb4',
  cyan: '#42d4f4', magenta: '#f032e6', lime: '#bfef45', pink: '#fabebe', teal: '#469990', lavender: '#e6beff',
  brown: '#9a6324', beige: '#fffac8', maroon: '#800000', mint: '#aaffc3', olive: '#808000', apricot: '#ffd8b1',
  navy: '#000075', grey: '#a9a9a9', white: '#ffffff', black: '#000000',
}; // https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/

const defaultSquare = {color: SimpleColor.black}

const worldWidth = 1000
const worldArray = new Array(worldWidth*worldWidth).fill(defaultSquare);
function world(x,y){return worldArray[worldWidth*y + x];}
worldArray[worldWidth* 12 + 12] = {color: SimpleColor.blue};



const global = {
  scale: {x:40,y:40}, // TODO: initialize based on canvas size
  pos: {x:500,y:500},
  offset: {x:63,y:63},
  moving: false,
  lastClick: {x:0,y:0},
};


const drawMargin = 1;

function start(){
  const updateRate = 30; // ups
  window.setInterval(update, 1000/updateRate);
  update();
  draw();
}


function update() {
  console.log(global)
  if(global.moving) {moveTowardCenter();}
  console.log(global)
}

function draw() {
  cc.clearRect(0,0,canvasWidth,canvasHeight);

  for (x=0; x < (canvasWidth+global.offset.x)/global.scale.x; x++){
    for (y=0; y < (canvasHeight+global.offset.y)/global.scale.y; y++){
      cellDraw(x, y);
    }
  }

  window.requestAnimationFrame(draw);
}

//////////  Start  /////////////////////////////////////////////////////////////

start();

////////////////////////////////////////////////////////////////////////////////
///////////  The Meat  /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function cellDraw(x, y) {

  offset = {x:(global.scale.x * x - global.offset.x),
            y:(global.scale.y * y - global.offset.y)};

  cc.fillStyle = world(global.pos.x+x,global.pos.y+y).color;
  cc.fillRect(offset.x + drawMargin,
              offset.y + drawMargin,
              global.scale.x - drawMargin,
              global.scale.y - drawMargin)
}

function findGlobal(pos) {
  return {x:global.pos.x + Math.floor((global.offset.x + pos.x)/global.scale.x),
          y:global.pos.y + Math.floor((global.offset.y + pos.y)/global.scale.y) };
}

function setNextColor(pos) {
  newTile = Object.assign({}, world(pos.x,pos.y)); // this is dup.....
  newTile.color = SimpleColor.cyan;
  worldArray[worldWidth*pos.y + pos.x] = newTile;
}

function moveTowardCenter() {

  clickCenter = {x:(global.lastClick.x - global.pos.x + 0.5)*global.scale.x - global.offset.x,
                 y:(global.lastClick.y - global.pos.y + 0.5)*global.scale.y - global.offset.y};

  console.log(clickCenter)
  xDistanceToCenter = clickCenter.x - canvasCenter.x
  yDistanceToCenter = clickCenter.y - canvasCenter.y

  // adjust offset and click location
  global.offset.x += xDistanceToCenter/10;
  global.offset.y += yDistanceToCenter/10;

  // adjust pos if needed
  if (global.offset.x > global.scale.x || global.offset.x < 0) {
    error = Math.floor(global.offset.x / global.scale.x);
    global.offset.x -= error * global.scale.x;
    global.pos.x += error;
  }
  if (global.offset.y > global.scale.y || global.offset.y < 0) {
    error = Math.floor(global.offset.y / global.scale.y);
    global.offset.y -= error * global.scale.y;
    global.pos.y += error;
  }

  // turn off moving if at center
  if (xDistanceToCenter*xDistanceToCenter + yDistanceToCenter*yDistanceToCenter < 10){
    global.moving = false;
  }
}

////////////////////////////////////////////////////////////////////////////////
///////////  CLICK & TOUCH HANDLING  ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


canvas.addEventListener("wheel", function(e){
  e.preventDefault();
  // console.log(e)
});

canvas.addEventListener("click", onClick);
function onClick(){
  handleClick({ x:event.offsetX, y:event.offsetY});
};

// this will need to be broken out once there are other things to click on
function handleClick(pos){
  globalPos = findGlobal(pos);
  setNextColor(globalPos);
  global.lastClick = globalPos; // dup just in case
  global.moving = true;
}

/*

canvas.addEventListener("mousedown", onMousedown);
function onMousedown(){
  onPress({ x:event.offsetX, y:event.offsetY});
};
canvas.addEventListener("touchstart", onTouchstart);
function onTouchstart(){
  lastTouch = { x:event.targetTouches[0].pageX, y:event.targetTouches[0].pageY}
  onPress(lastTouch);
};

canvas.addEventListener("mouseup", onMouseup);
function onMouseup(){
  onRelease({ x:event.offsetX, y:event.offsetY});
};
canvas.addEventListener("touchend", onTouchend);
function onTouchend(){
  onRelease(lastTouch);
};

canvas.addEventListener("mousemove", onMousemove);
function onMousemove(){
  onMove({ x:event.offsetX, y:event.offsetY});
};
canvas.addEventListener("touchmove", onTouchmove);
function onTouchmove(){
  lastTouch = { x:event.targetTouches[0].pageX, y:event.targetTouches[0].pageY}
  onMove(lastTouch);
};

addEventListener('touchstart', function(){
  canvas.removeEventListener("mousedown", onMousedown);
  canvas.removeEventListener("mouseup", onMouseup);
  canvas.removeEventListener("mousemove", onMousemove);
});

function onPress(currentPressLocation){
  pressing = true;
  if(!shouldDrawRect && !dragging){
    lastPressLocation = currentPressLocation;
  }
}

function onRelease(currentReleaseLocation){
  if(shouldDrawRect || dragging){
    shouldDrawRect = false;
    recalculatePixels(lastPressLocation, currentReleaseLocation);
    draw();
  } else if(pressing && !dragging){
    shouldDrawRect = true
  }
  pressing = false;
  dragging = false;
}

function onMove(currentLocation){
  if(pressing && !dragging && !withinError(lastPressLocation, currentLocation) ){
    dragging = true;
  }

  if(shouldDrawRect || dragging){
    draw();
    startX = Math.min(lastPressLocation.x, currentLocation.x)
    startY = Math.min(lastPressLocation.y, currentLocation.y)
    width = Math.abs(lastPressLocation.x - currentLocation.x)
    height = Math.abs(lastPressLocation.y - currentLocation.y)
    cc.strokeRect(startX, startY, width, height ) // should I really be drawing in this func?
  }
}




//*/