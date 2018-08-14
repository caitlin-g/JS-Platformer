let actorChars = {
  '@': Player,
  'o': Coin,
  'G' : Monster
};

function Level(plan) {
  // Uses the length of a single row to set the width of the level
  this.width = plan[0].length;

  // Uses the number of rows to set the height
  this.height = plan.length;

  // Stores the individual tiles in our own, separate arrays
  this.grid = [];
  this.actors = [];

  // Loops through each row in the plan, creating an array in our grid
  for (let y = 0; y < this.height; y++) {
    let line = plan[y], gridLine = [];

    // Loops through each array element in the inner array for the type of the tile
    for (let x = 0; x < this.width; x++) {
      // Gets the type from that character in the string. 'x', '!' or ' '
      // If the character is ' ', assigns null.

      let ch = line[x], fieldType = null;
      
      let Actor = actorChars[ch];
      if (Actor)
        this.actors.push(new Actor(new Vector(x,y), ch));
      else if (ch == "x")
        fieldType = "wall";
      else if (ch == "!")
        fieldType = "lava";

      // Pushes the fieldType, which is a string, to the end of the gridLine array.
      gridLine.push(fieldType);
    }
    // Push the entire row onto the array of rows.
    this.grid.push(gridLine);
  }
  this.player = this.actors.filter(function(actor) {
    return actor.type == "player";
  })[0];
}

//Coin Constructor Function
function Coin(pos) {
    this.basePos = this.pos = pos.plus(new Vector(0.2,0.1));
    this.size = new Vector(0.6, 0.6);
    this.wobble = Math.random() * Math.PI * 2;
}

//Monster Constructor Function
function Monster(pos) {
    this.basePos = this.pos = pos.plus(new Vector(-1,-2));
    this.size = new Vector(1, 1);
    this.wobble = Math.random() * Math.PI * 2;
}

//Adding type method to the objects prototypes
Coin.prototype.type = 'coin';
Player.prototype.type = 'player';
Monster.prototype.type = 'monster';


//Vector Constructor Function
function Vector(x, y) {
  this.x = x; this.y = y;
}

//Adding plus method on the Vector constructor function
// Vector arithmetic: v_1 + v_2 = <a,b>+<c,d> = <a+c,b+d>
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

//Adding times method on the Vector constructor function
// Vector arithmetic: v_1 * factor = <a,b>*factor = <a*factor,b*factor>
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};


// Adding Player's  size, speed and position.
function Player(pos) {
  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

// Helper function to easily create an element of a type provided 
// and assign it a class.
function elt(name, className) {
  let elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

// Main display class. We keep track of the scroll window using it.
function DOMDisplay(parent, level) {

// this.wrap corresponds to a div created with class of "game"
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  // In this version, we only have a static background.
  this.wrap.appendChild(this.drawBackground());

  // Keep track of actors
  this.actorLayer = null;

  // Update the world based on player position
  this.drawFrame();
}

let scale = 20;


DOMDisplay.prototype.drawBackground = function() {
  let table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";

  // Assign a class to new row element directly from the string from
  // each tile in grid
  this.level.grid.forEach(function(row) {
    let rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

// Draws the player agent
DOMDisplay.prototype.drawActors = function() {

  // Creates a new container div for actor dom elements
  let wrap = elt("div");

  this.level.actors.forEach(function(actor) {
    let rect = wrap.appendChild(elt("div",
                                    "actor " + actor.type));
  rect.style.width = actor.size.x * scale + "px";
  rect.style.height = actor.size.y * scale + "px";
  rect.style.left = actor.pos.x * scale + "px";
  rect.style.top = actor.pos.y
   * scale + "px";
});
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function() {
  let width = this.wrap.clientWidth;
  let height = this.wrap.clientHeight;

  // Keeps player at least 1/3 away from side of screen
  let margin = width / 3;

  // The viewport
  let left = this.wrap.scrollLeft, right = left + width;
  let top = this.wrap.scrollTop, bottom = top + height;

  let player = this.level.player;

  // Change coordinates from the source to our scaled.
  let center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

Level.prototype.obstacleAt = function(pos,size) {
  let xStart = Math.floor(pos.x);
  let xEnd = Math.ceil(pos.x + size.x);
  let yStart = Math.floor(pos.y);
  let yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0 || yEnd > this.height)
    return 'wall';

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++){
      let fieldType = this.grid[y][x];
      if (fieldType) {
          return fieldType;
    }
      }
  }

};

Level.prototype.actorAt = function(actor) {
  for (let i=0; i<this.actors.length; i++) {
      let other = this.actors[i];
      if (other != actor &&
        actor.pos.x + actor.size.x > other.pos.x &&
        actor.pos.x < other.pos.x + other.size.x &&
        actor.pos.y + actor.size.y > other.pos.y &&
        actor.pos.y < other.pos.y + other.size.y)
        return other;
    }
};

// Updates simulation each step based on keys & step size
Level.prototype.animate = function(step, keys) {

  // Ensures each is maximum 100 milliseconds 
  while (step > 0) {
    let thisStep = Math.min(step, maxStep);
      this.actors.forEach(function(actor){
      actor.act(thisStep, this, keys);
      }, this);

   // Loops across the step size, subtracing either the
   // step itself or 100 milliseconds
    step -= thisStep;
  }
};
let wobbleSpeed = 8;
let wobbleDist = 0.07;

Coin.prototype.act = function(step) {
  this.wobble += step * wobbleSpeed;
  let wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};
let maxStep = 0.05;

let playerXSpeed = 7;

Player.prototype.moveX = function(step, level, keys) {
  this.speed.x = 0;
  if (keys.left) this.speed.x -= playerXSpeed;
  if (keys.right) this.speed.x += playerXSpeed;

  let motion = new Vector(this.speed.x * step, 0);
  let newPos = this.pos.plus(motion);
  let obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle != "wall")
    this.pos = newPos;
};

let gravity = 70;
let jumpSpeed = 30;
let playerYSpeed = 7;

Player.prototype.moveY = function(step, level, keys) {
  this.speed.y += step * gravity;
  let motion = new Vector(0, this.speed.y * step);
  let newPos = this.pos.plus(motion);
  let obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle == 'wall') {
    if (keys.up && this.speed.y > 0)
      this.speed.y = -jumpSpeed;
    else
      this.speed.y = 0;
  } 
  else if (obstacle == 'lava')
  {
    this.pos = new Vector (5, 10)
  }
  else {
    this.pos = newPos;
  } 
  };

Monster.prototype.act = function(step) {
  let wobbleDist = 2
  this.wobble += step * wobbleSpeed;
  let wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
}

Player.prototype.act = function(step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);
  let otherActor = level.actorAt(this);
  if (otherActor) {
    if (otherActor.type == 'coin') {
      level.clearCoin(otherActor);
    }
    if (otherActor.type == 'monster') {
      this.pos = new Vector (5, 10);
    }
  }
};

Level.prototype.clearCoin = function(actor) {
    this.actors = this.actors.filter(function(other) {
      return other != actor;
    });
};


// Arrow key codes for readability
let arrowCodes = {37: "left", 38: "up", 39: "right", 40: "down"};

// Translate the codes pressed from a key event
function trackKeys(codes) {
  let pressed = Object.create(null);

  // alters the current "pressed" array which is returned from this function. 
  // The "pressed" variable persists even after this function terminates
  // That is why we needed to assign it using "Object.create()" as 
  // otherwise it would be garbage collected

  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      // If the event is keydown, set down to true. Else set to false.
      let down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;

      // We don't want the key press to scroll the browser window, 
      // This stops the event from continuing to be processed
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

// frameFunc is a function called each frame with the parameter "step"
// step is the amount of time since the last call used for animation
function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    let stop = false;
    if (lastTime != null) {
      // Sets a maximum frame step of 100 milliseconds to prevent
      // having big jumps
      let timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// This assigns the array that will be updated anytime the player
// presses an arrow key. We can access it from anywhere.
let arrows = trackKeys(arrowCodes);

// Organize a single level and begin animation
function runLevel(level, Display) {
  let display = new Display(document.body, level);

  runAnimation(function(step) {
    // Allow the viewer to scroll the level
    level.animate(step, arrows);
    display.drawFrame(step);
  });
}

function runGame(plans, Display) {
  function startLevel(n) {
    // Create a new level using the nth element of array plans
    // Pass in a reference to Display function, DOMDisplay (in index.html).
    runLevel(new Level(plans[n]), Display);
  }
  startLevel(0);
}
