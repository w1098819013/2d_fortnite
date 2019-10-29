// TODO: may not be necessary

// const Stage = require('./model.js');


/* TODO: if we want to optimize this, we can only add state to the JSON
         object that has been changed.*/
//server side utils
class Utils{

    /* Takes in a stage instance, extracts its state and returns
       the state as a JSON object string */
    stageToJson(stage){
        var serialized = {}; //has two key-value pairs, player and actors

        //console.log("Converting player to JSON on server.")
        //console.log("Player's position: x " + String(stage.player.position.x) + " y: " + String(stage.player.position.y));
        //console.log("Player's velocity: x " + String(stage.player.velocity.x) + " y: " + String(stage.player.velocity.y));

        serialized['player'] = this.playerToJson(stage.player);
        serialized['actors'] = [];
        //each element in actors is a JSON of an actor
        serialized["initState"] = true; //signifies the first model that the client receives on connection.
        for(var i in stage.actors){
            switch(stage.actors[i].key){
                case 'tank':
                    // the first actor added in model is always the player (tank)
                    serialized['actors'].push(this.playerToJson(stage.actors[i]));
                case 'ball':
                    serialized['actors'].push(this.ballToJson(stage.actors[i]));
                    break;
                case 'box':
                    serialized['actors'].push(this.boxToJson(stage.actors[i]));
                    break;
                case 'opponent':
                    serialized['actors'].push(this.opponentToJson(stage.actors[i]));
                    break;
                case 'bullet':
                    serialized['actors'].push(this.bulletToJson(stage.actors[i]));
                    break;
                default:
                    break;
            }
        }
        return serialized;
    }

    /* Converts a player (an instance of a tank class) to a JSON object
       by storing its state in the JSON object. */
    playerToJson(player){
        var serialized = {};
        serialized['actorType'] = 'tank'; // added to discern actor types when when deserializing
        serialized['position'] = this.pairToJson(player.position);
        serialized['velocity'] = this.pairToJson(player.velocity);
        serialized['colour'] = player.colour;
        serialized['radius'] = player.radius; 
        serialized['health'] = player.health;
        serialized['isZombie'] = player.isZombie;
        serialized['savedState'] = player.savedState;
        serialized['stateVars'] = player.stateVars;
        serialized['turretDirection'] = this.pairToJson(player.turretDirection);
        serialized['fire'] = player.fire;
        serialized['pickup'] = player.pickup;
        serialized['ammunition'] = player.ammunition;
        serialized['actorID'] = player.actorID;
        return serialized
    }

    pairToJson(pair){
        var serialized = {};
        serialized['x'] = pair.x;
        serialized['y'] = pair.y;
        //console.log("converted pair to json: " + JSON.stringify(pair))
        return serialized;
    }

    ballToJson(ball){
        var serialized = {};
        serialized['actorType'] = 'ball'; // added to discern actor types when when deserializing
        serialized['position'] = this.pairToJson(ball.position);
        serialized['velocity'] = this.pairToJson(ball.velocity);
        serialized['colour'] = ball.colour;
        serialized['radius'] = ball.radius;
        serialized['isZombie'] = ball.isZombie;
        serialized['health'] = ball.health;
        serialized['stateVars'] = ball.stateVars;
        serialized['savedState'] = ball.savedState;
        return serialized;
    }

    boxToJson(box){
        var serialized = {};
        serialized['actorType'] = 'box'; // added to discern actor types when when deserializing
        serialized['position'] = this.pairToJson(box.position);
        serialized['velocity'] = this.pairToJson(box.velocity);
        serialized['colour'] = box.colour;
        serialized['radius'] = box.radius;
        serialized['isZombie'] = box.isZombie;
        serialized['health'] = box.health;
        serialized['savedState'] = box.savedState;
        serialized['stateVars'] = box.stateVars;
        serialized['actorID'] = box.actorID;
        return serialized
    }

    opponentToJson(opponent){
        var serialized = {};
        serialized['actorType'] = 'opponent'; // added to discern actor types when when deserializing
        serialized['position'] = this.pairToJson(opponent.position);
        serialized['velocity'] = this.pairToJson(opponent.velocity);
        serialized['colour'] = opponent.colour;
        serialized['radius'] = opponent.radius; 
        serialized['health'] = opponent.health;
        serialized['isZombie'] = opponent.isZombie;
        serialized['savedState'] = opponent.savedState;
        serialized['stateVars'] = opponent.stateVars;
        serialized['turretDirection'] = this.pairToJson(opponent.turretDirection);
        serialized['fire'] = opponent.fire;
        serialized['pickup'] = opponent.pickup;
        serialized['ammunition'] = opponent.ammunition;
        serialized['fireDelay'] = opponent.fireDelay;    
        serialized['actorID'] = opponent.actorID;        
        return serialized
    }

    bulletToJson(bullet){
        var serialized = {};
        serialized['actorType'] = 'bullet'; // added to discern actor types when when deserializing
        serialized['position'] = this.pairToJson(bullet.position);
        serialized['velocity'] = this.pairToJson(bullet.velocity);
        serialized['colour'] = bullet.colour;
        serialized['radius'] = bullet.radius; 
        serialized['savedState'] = bullet.savedState;
        serialized['stateVars'] = bullet.stateVars;
        serialized['lifetime'] = bullet.lifetime;
        serialized['actorID'] = bullet.actorID;    
        return serialized    
    }

    /* Given the client's current stage, update it with the values contained in the 
       newStageJson object */
    updateStage(stage, newStageJson){
        // TODO: for now, just take the stage as-is.  In the future, only modify the stage's values that have been changed.
        this.updatePlayer(stage, newStageJson['player']);

        // for now, overwrite all actors.
        var actors = [];

        for (var i = 0; i < newStageJson['actors'].length; i++){
            switch(newStageJson['actors'][i]['actorType']){
                case 'tank':
                    // the first actor added in model is always the player (tank)
                    // NOTE: currently assuming there is only one actor
                    actors.push(stage.player);
                case 'ball':
                    actors.push(this.retrieveBall(newStageJson['actors'][i]));
                    break;
                case 'box':
                    actors.push(this.retrieveBox(newStageJson['actors'][i]));
                    break;
                case 'opponent':
                    actors.push(this.retrieveOpponent(newStageJson['actors'][i]));
                    break;
                case 'bullet':
                    actors.push(this.retrieveBullet(newStageJson['actors'][i]));
                    break;
                default:
                    break;
            }
        }
        stage.actors = actors;
    }

    /* Given the current stage, update the player with the values from playerJson*/
    updatePlayer(stage, playerJson){
        stage.player.position = playerJson['position'];
        stage.player.velocity = playerJson['velocity'];
        stage.player.colour = playerJson['colour'];
        stage.player.radius = playerJson['radius'];
        stage.player.health = playerJson['health'];
        stage.player.isZombie = playerJson['isZombie'];
        stage.player.savedState = playerJson['savedState'];
        stage.player.stateVars = playerJson['stateVars'];
        stage.player.turretDirection = playerJson['turretDirection'];
        stage.player.fire = playerJson['fire'];
        stage.player.pickup = playerJson['pickup'];
        stage.player.ammunition = playerJson['ammunition'];
    }

    /* Create and return a ball actor from the ballJson object*/
    retrieveBall(stage, ballJson){
        var b = new Ball(stage, ballJson['position'], ballJson['velocity'], ballJson['colour'], ballJson['radius']);
        b.isZombie = ballJson['isZombie'];
        b.health = ballJson['health'];
        b.stateVars = ballJson['stateVars'];
        b.savedState = ballJson['savedState'];
        return b;
    }

    /* Create and return a box actor from the boxJson object*/
    retrieveBox(stage, boxJson){
        var b = new Box(stage, boxJson['position'], boxJson['colour'], boxJson['radius']);
        b.velocity = boxJson['velocity'];
        b.isZombie = boxJson['isZombie'];
        b.health = boxJson['health'];
        b.stateVars = boxJson['stateVars'];
        b.savedState = boxJson['savedState'];
        return b;
    }

    /* Create and return an opponent actor from the opponentJson object*/
    retrieveOpponent(stage, opponentJson){
        var o = new Opponent(stage, opponentJson['position'], opponentJson['velocity'], opponentJson['colour'], opponentJson['radius']);
        o.isZombie = opponentJson['isZombie'];
        o.health = opponentJson['health'];
        o.stateVars = opponentJson['stateVars'];
        o.savedState = opponentJson['savedState'];
        o.turretDirection = opponentJson['turretDirection'];
        o.fire = opponentJson['fire'];
        o.pickup = opponentJson['pickup'];
        o.ammunition = opponentJson['ammunition'];
        o.fireDelay = opponentJson['fireDelay'];
        return o;
    }

    /* Create and return a bullet actor from the bulletJson object*/
    retrieveBullet(stage, bulletJson){
        var b = new Ball(stage, bulletJson['position'], bulletJson['velocity'], bulletJson['colour'], bulletJson['radius']);
        b.isZombie = bulletJson['isZombie'];
        b.health = bulletJson['health'];
        b.stateVars = bulletJson['stateVars'];
        b.savedState = bulletJson['savedState'];
        b.isZombie = bulletJson['isZombie'];
        b.health = bulletJson['health'];
        b.stateVars = bulletJson['stateVars'];
        b.savedState = bulletJson['savedState'];
        b.lifetime = bulletJson['lifetime'];
        return b;
    }

}

// exports functions so they can be imported by node.js and controller.js
module.exports = Utils;