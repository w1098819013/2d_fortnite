function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }
var alphabets = "abcdefghijklmnopqrstuvwxyz";

//the following function is responsible for hashing a random key
//of length 'length' for actorid of stage's actors
function hashKey(length){ 
	var randomKey = '';
	for (var i=0; i<length; i++){
		randomKey += alphabets.charAt(Math.floor(Math.random() * 26));
	}
	return randomKey;
}

//server side model
/*
Implementing hashtable design of stage.actors
*/
class Stage {
	constructor(){ //canvas param rid
		// this.canvas = canvas;
	
		this.actors={}; // all actors on this stage (monsters, player, boxes, ...)
		this.player=null; // a special actor, the player
	
		// the logical width and height of the stage
		/**
		this.width=canvas.width;
		this.height=canvas.height;
		**/
		this.width=10000;
		this.height=10000;

		this.canvasWidth=700;
		this.canvasHeight=700;

		// The player
		let s = this.randomState();
		var b = new Tank(this, s.position, s.velocity, s.colour, s.radius, s.actorID);
		//console.log("server model hash function check: "+s.actorID);
		this.addPlayer(b);

		let numBalls=100, numBoxes=numBalls*10, numOpponents=numBalls;
		// Some balls
		/*
		for(let i=0;i<numBalls;i++){
			let s = this.randomState();
			var b = new Ball(this, s.position, s.velocity, s.colour, s.radius);
			this.addActor(b);
		}
		*/

		// Lots of boxes
		for(let i=0;i<numBoxes;i++){
			let s = this.randomState();
			var b = new Box(this, s.position, s.colour,40, s.actorID);
			this.addActor(b);
		}

		// Some opponents
		for(let i=0;i<numOpponents;i++){
			let s = this.randomState();
			var b = new Opponent(this, s.position, s.velocity, s.colour, s.radius, s.actorID);
			this.addActor(b);
		}
	}

	randomState(){
		//added in randomID generating function
		// ensures alpha is above 30.
		var red=randint(255), green=randint(255), blue=randint(255), alpha = Math.random() * (1 - 0.3) + 0.3;
		var x=Math.floor((Math.random()*this.width)),
			y=Math.floor((Math.random()*this.height));
	
		return {
			radius : randint(20),
			colour: 'rgba('+red+','+green+','+blue+','+alpha+')',
			position : new Pair(x,y),
			velocity : new Pair(rand(20), rand(20)),
			actorID : hashKey(7)
		}
	}

	setCanvas(canvas){
		this.canvas = canvas;
		this.width=10000;
		this.height=10000;

		this.canvasWidth=canvas.width;
		this.canvasHeight=canvas.height;
	}
	
	// Map an canvas coordinates to world coordinates
	mapCanvasToWorld(canvasPosition){
		var halfCanvas = (new Pair(this.canvasWidth/2, this.canvasHeight/2)).toInt();
		var playerPosition = this.player.position.toInt();

		var worldPosition = canvasPosition.vecAdd(playerPosition.vecSub(halfCanvas));
		return worldPosition;
	}
	/** Handle the mouse movement on the stage in canvas coordinates **/
	mouseMove(x,y){
		var canvasPosition=new Pair(x,y);
		var worldPosition=this.mapCanvasToWorld(canvasPosition);
		this.player.pointTurret(worldPosition);
	}
	/** Handle the mouse click on the stage in canvas coordinates **/
	mouseClick(x,y){
		var canvasPosition=new Pair(x,y);
		var worldPosition=this.mapCanvasToWorld(canvasPosition);
		this.player.setFire(true);
	}

	addPlayer(player){
		this.addActor(player);
		this.player=player;
	}

	removePlayer(){
		this.removeActor(this.player);
		this.player=null;
	}

	addActor(actor){
		this.actors[actor.actorID] = actor;
	}

	removeActor(actor){
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
		}
	}
	
	/*animate(){
		this.step();
		this.draw();
		// Remove zombies
		this.actors = this.actors.filter(actor => !actor.isZombie);
	}*/

	// Take one step in the animation of the game.  
	// Do this by asking each of the actors to take a single step. 
	step(){
		// step every actor in the actor HASH TABLE
		for(var i in this.actors){
			this.actors[i].step();
		}

	}

	// return the first actor at coordinates (x,y) return null if there is no such actor
	getActor(x, y){

		// actors HASH table
		for(var i in this.actors){
			if(this.actors[i].x==x && this.actors[i].y==y){
				return this.actors[i];
			}
		}

		return null;
	}
} // End Class Stage

class Pair {
	constructor(x,y){ this.x=x; this.y=y; }
	toString(){ return "("+this.x+","+this.y+")"; }
	norm2(){ return Math.sqrt(this.x*this.x+this.y*this.y); }
	normalize(){ return this.sProd(1.0/this.norm2()); }
	toInt(){ return new Pair(Math.round(this.x), Math.round(this.y)); }
	clone(){ return new Pair(this.x, this.y); }
	sProd(z){ return new Pair(this.x*z, this.y*z); }
	dotProd(other){ return new Pair(this.x*other.x, this.y*other.y); }
	vecAdd(other){ return new Pair(this.x+other.x, this.y+other.y); }
	vecSub(other){ return new Pair(this.x-other.x, this.y-other.y); }
	getX(){ return this.x};
}
class Actor {
	constructor(stage, position, velocity, colour, radius, actorID){
		this.stage = stage;

		// Below is the state of this
		this.position=position;
		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;
		this.isZombie = false;
		this.changedState = false;
		this.health = 10;
		this.actorID = actorID; //added new attribute for efficiency

		this.stateVars = [ "position" , "velocity", "colour", "radius", "isZombie", "health" ]; // should be static
		this.savedState = {};
	}
	saveState(){
		this.savedState={};
		for(var s in this.stateVars){
			this.savedState[this.stateVars[s]]= this[this.stateVars[s]];
		}
	}
	makeZombie(){ this.isZombie = true; }

	collide(other){ 
		// Stop us moving when we collide with someone else
		this.position = this.savedState.position;
		this.velocity = new Pair(0,0);
	}

	// Return a list of actors close this
	getCloseActors(delta){
		var closeActors = [];
 		for(var i in this.stage.actors){
			var other = this.stage.actors[i];
			if(other==this)continue;
			var distanceBetween = this.position.vecSub(other.position).norm2();
			if(distanceBetween<=(this.radius+other.radius+delta)){
				closeActors.push(other);
			}
                }
		return closeActors;
	}

	step(){
		// Save our previous state, just in case
		this.saveState(); 
		this.position=this.position.vecAdd(this.velocity);

		var collidingActors = this.getCloseActors(0);
		for(var i in collidingActors)this.collide(collidingActors[i]);
			
		// bounce off the walls
		if(this.position.x<0){
			this.position.x=0;
			this.velocity.x=Math.abs(this.velocity.x);
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
			this.velocity.x=-Math.abs(this.velocity.x);
		}
		if(this.position.y<0){
			this.position.y=0;
			this.velocity.y=Math.abs(this.velocity.y);
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
			this.velocity.y=-Math.abs(this.velocity.y);
		}
	}
	draw(context){
		context.fillStyle = this.colour;
   		// context.fillRect(this.x, this.y, this.radius,this.radius);
		context.beginPath(); 
		var intPosition = this.position.toInt();
		context.arc(intPosition.x, intPosition.y, this.radius, 0, 2 * Math.PI, false); 
		context.fill();   
	}
}

class Ball extends Actor {
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);
		this.key = 'ball'; // used by utils to determine actor type
	}
	headTo(position){
		this.velocity = position.vecSub(this.position).normalize();
	}
	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}
}

class Box extends Actor {
	constructor(stage, position, colour, radius, actorID){
		var velocity = new Pair(0,0);
		super(stage, position, velocity, colour, radius, actorID);
		this.key = 'box'; // used by utils to determine actor type
	}
	draw(context){
		var intPosition = this.position.toInt();
		var x=intPosition.x-this.radius;
		var y=intPosition.y-this.radius; 
		var width = this.radius*2; 
		context.fillStyle = this.colour;
		context.fillRect(x,y,width,width); 
		context.strokeStyle="x000";
		context.strokeRect(x,y,width,width);
	}
	step(){ return; }
}

class Tank extends Actor {

	constructor(stage, position, velocity, colour, radius, actorID){
		super(stage, position, velocity, colour, 10, actorID);

		this.stateVars.concat["fire", "ammunition", "pickup"];

		this.turretDirection = new Pair(1,0);
		this.fire = false; // whether we have to fire a bullet in the next step
		this.pickup = false;
		this.ammunition = 0;

		this.key = 'tank'; // used by utils to determine actor type
	}

	// Point the turret at crosshairs in world coordinates
	pointTurret(crosshairs){
		var delta = crosshairs.toInt().vecSub(this.position.toInt());
		if(delta.x!=0 || delta.y !=0){
			this.turretDirection = delta.normalize();
			//console.log("After pointTurret:"+this.turretDirection);
		}
	}
	getTurretPosition(){
		// position = ((x,y)+turretDirection*this.radius).toInt()
		return this.position.vecAdd(this.turretDirection.sProd(this.radius));
	}
	step(){
		if(this.fire && this.ammunition>0){
			this.ammunition--;
			var bulletVelocity = this.turretDirection.sProd(5).vecAdd(this.velocity);
			var bulletPosition = this.position.vecAdd(this.turretDirection.sProd(this.radius*2));
			var bulletID = hashKey(7);
			var bullet = new Bullet(this.stage, bulletPosition, bulletVelocity, "#000000", this.radius/5, bulletID);
			this.stage.addActor(bullet);
		}
		this.setFire(false);

		if(this.pickup){
			var closeActors = this.getCloseActors(5); // we may not be touching, but pick them up just the same
			var closeActor = closeActors.find(actor => actor.constructor.name=="Box");
			if(closeActor){
				this.ammunition=30;
				//console.log("Setting ammo to 30");
				this.health = 10;
			}
		}
		this.setPickup(false);

		super.step();
		this.velocity=this.velocity.sProd(.95);
	}
	setDirection(dx,dy){
		var newDirection = new Pair(dx,dy);
		var newVelocity = this.velocity.vecAdd(newDirection);
		var m = newVelocity.norm2();
		if(m>5)newVelocity=newVelocity.normalize().sProd(5);
		this.velocity = newVelocity;
	}
	draw(context){
		context.fillStyle = this.colour;
		context.beginPath(); 
		var intPosition = this.position.toInt();
		context.arc(intPosition.x, intPosition.y, this.radius, 0, 2 * Math.PI, false); 
		context.fill();   

		var turretPos = this.getTurretPosition().toInt();
		// console.log(turretPos);
		context.beginPath(); 
		context.arc(turretPos.x, turretPos.y, this.radius/2, 0, 2 * Math.PI, false); 
		context.fill();   
	}

	setFire(val){ this.fire = val; }
	setPickup(val){ this.pickup = val; }
}

class Opponent extends Tank {
	constructor(stage, position, velocity, colour, radius, actorID){
		super(stage, position, velocity, "#ff0000", 10, actorID);
		this.health=1;
		this.stateVars.concat["fireDelay"];
		this.ammunition=0; 
		this.fireDelay = 400;
		this.key = 'opponent'; // used by utils to determine actor type
	}
	setDirection(dx,dy){
		var newDirection = new Pair(dx,dy);
		var newVelocity = this.velocity.vecAdd(newDirection);
		var m = newVelocity.norm2();
		if(m>2)newVelocity=newVelocity.normalize().sProd(2);
		this.velocity = newVelocity;
	}
	step(){
		var player = this.stage.player;
		var toPlayer = player.position.vecSub(this.position).normalize();
		this.setDirection(toPlayer.x, toPlayer.y);
		this.pointTurret(player.position);
		if(toPlayer.norm2()<100){
			this.fireDelay=this.fireDelay-1;
			if(this.fireDelay<=0){
				this.setFire(true);
				this.fireDelay = 400;
			}
		}
		super.step();
	}
}

class Bullet extends Actor {
	constructor(stage, position, velocity, colour, radius, actorID){
		super(stage, position, velocity, colour, radius, actorID);
		this.lifetime = 200;
		this.key = 'bullet'; // used by utils to determine actor type
	}

	collide(other, newState){
		this.makeZombie();
		other.health--;
		if(other.health<=0)other.makeZombie();
	}

	step(){
		super.step();
		this.lifetime = this.lifetime -1;
		if(this.lifetime <= 0)this.makeZombie();
	}
	draw(context){
		context.fillStyle = this.colour;
		context.beginPath(); 
		var intPosition = this.position.toInt();
		context.arc(intPosition.x, intPosition.y, this.radius, 0, 2 * Math.PI, false); 
		context.fill();   
	}
}

// exports functions so they can be imported by node.js
module.exports = {Stage, Pair, Actor, Ball, Box, Tank, Opponent, Bullet};
