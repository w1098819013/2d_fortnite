// Our new node server using Web Sockets.

var port = 10234; // usually port 10232
const Stage = require('./model.js');
const Utils = require('./utils.js');
// import { Stage, Pair, Actor, Ball, Box, Tank, Opponent, Bullet } from './static-content/model.js';
// import { Utils } from './static-content/utils.js';

// const JSON= require('circular-json');
console.log("Starting nodejs server.");

var WebSocketServer = require('ws').Server
   ,wss = new WebSocketServer({port: port});

//var messages=[];
var stage = new Stage.Stage(); // game model backend
var utils = new Utils();
var actorsToRemove = {}; // TODO: add actors to remove in step and send on next broadcast

// TODO: placed here for testing purposes, so I don't need to run all 3 servers
// to see that stageToJson is working properly.
serialized_stage = JSON.stringify(utils.stageToJson(stage));

wss.on('close', function() {
    console.log('disconnected');
});

wss.broadcast = function(model){

	serialized_stage = trimmedToJSON();
	for(let ws of this.clients){ 
		ws.send(JSON.stringify(serialized_stage)); 
	}

	// Alternatively
	// this.clients.forEach(function (ws){ ws.send(message); });
}

wss.on('connection', function(ws) {
	console.log("Client #" + wss.clients.size + " connected.");

	// this is the first client connected; start the timer
	if(wss.clients.size == 1){
		startGame();
	}

	// send the client the initial game stage
	serialized_stage = JSON.stringify(utils.stageToJson(stage));
	ws.send(serialized_stage);
	console.log("Sent initial stage to client #" + wss.clients.size);

	ws.on('message', function(message) {

		// JSON object with mouse and keyboard events
		var data = JSON.parse(message);

		// Apply mouse or keyboard events to the stage.
		// On the interval's next tick, the new stage will be broadcasted.
		if(data.hasOwnProperty('keyEvent')){
			handleKeyEvent(data);
		} 
		else if(data.hasOwnProperty("mouseMoveEvent")){
			handleMouseMoveEvent(data);
		}
		else if(data.hasOwnProperty('mouseClickEvent')){
			handleMouseClickEvent(data);
		}
	});

});

function handleKeyEvent(data){
	if(data.hasOwnProperty('setPickup')){
		stage.player.setPickup(true);
		stage.actors[stage.player.actorID].setPickup(true);

	} else{
		stage.player.setDirection(data['keyEvent'][0], data['keyEvent'][1]);
	}
	stage.player.changedState = true;
}

function handleMouseMoveEvent(data){
	//console.log(data);
	stage.mouseMove(data['mouseMoveEvent'][0], data['mouseMoveEvent'][1]);
	stage.player.changedState = true;
}

/* Server only received mouse events when the client clicks, so it handles
   the movement and click component of it at the same time. */
function handleMouseClickEvent(data){
	// mouse move
	//stage.mouseMove(data['mouseClickEvent'][0], data['mouseClickEvent'][1]);
	stage.player.changedState = true;

	// mouse click
	stage.mouseClick(data['mouseClickEvent'][0], data['mouseClickEvent'][1]);
}

function startGame(){
	// the same as animate(), except without the stage.draw()
	interval=setInterval(function(){ 
		stage.step();

		wss.broadcast(stage);

		// Remove zombies
		// The following removes zombies.
		for (var actor in stage.actors){
			if (stage.actors[actor].isZombie){
				delete stage.actors[actor];
			}
		} 

	},20);
}

//position, velocity, turret direction, saveState
function trimmedToJSON(){ 
	//takes the global stage and convert only data that are needed to JSON
	var serialized = {};
	serialized["actors"] = [];

	for(var key in stage.actors){
		switch(stage.actors[key].key){
			case "tank":
				var convertedJSON = tankToJSON(stage.actors[key]);
				serialized["actors"].push(convertedJSON);
				break;
			case "opponent":
				serialized["actors"].push(opponentToJSON(stage.actors[key]));
				break;
			case "bullet":
				var bulletJSON = bulletToJSON(stage.actors[key]);
				serialized["actors"].push(bulletJSON);
				break;				
		}
	}
	return serialized;
}

function tankToJSON(tank){

	// TODO: potential optimization: do not have client send mouse move events.  
	// instead, have the client update the turret direction themself and only 
	// send the mouse location when the client clicks.    

	var serialized = {};
	serialized["position_x"] = tank.position.x;
	serialized["position_y"] = tank.position.y;
	serialized["velocity_x"] = tank.velocity.x;
	serialized["velocity_y"] = tank.velocity.y;
	serialized["actorType"] = "tank";
	serialized["fire"] = tank.fire;
	serialized["ammunition"] = tank.ammunition;
	serialized['pickup'] = tank.pickup;
	serialized['fire'] = tank.fire;
	serialized['actorID'] = tank.actorID;
	serialized['turretDirection_x'] = tank.turretDirection.x;
	serialized['turretDirection_y'] = tank.turretDirection.y;
	return serialized;
}

function opponentToJSON(tank){
	var serialized = {};
	serialized['isZombie'] = tank.isZombie;
	if(tank.isZombie){
		console.log("Opponent killed.");
	}
	serialized["position_x"] = tank.position.x;
	serialized["position_y"] = tank.position.y;
	serialized["velocity_x"] = tank.velocity.x;
	serialized["velocity_y"] = tank.velocity.y;
	serialized["actorType"] = "opponent";
	serialized["fire"] = tank.fire;
	serialized["actorID"] = tank.actorID;
	serialized['turretDirection_x'] = tank.turretDirection.x;
	serialized['turretDirection_y'] = tank.turretDirection.y;
	return serialized;
}

function bulletToJSON(bullet){
	var serialized = {};
	serialized['isZombie'] = bullet.isZombie;
	serialized["lifetime"] = bullet.lifetime;
	serialized["position_x"] = bullet.position.x;
	serialized["position_y"] = bullet.position.y;
	serialized["velocity_x"] = bullet.velocity.x;
	serialized["velocity_y"] = bullet.velocity.y;
	serialized["actorType"] = "bullet";
	serialized["actorID"] = bullet.actorID;
	serialized["radius"] = bullet.radius;
	serialized['savedState'] = bullet.savedState;
	serialized['stateVars'] = bullet.stateVars;
	return serialized;
}



