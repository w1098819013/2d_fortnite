// Client-side Utils class
class Utils{

    /* Takes in a stage instance, extracts its state and returns
       the state as a JSON object string */
    stageToJson(stage){
        var serialized = {};
        serialized['player'] = this.playerToJson(stage.player);
        serialized['actors'] = [];
        for(var i = 0; i < stage.actors.length; i++){
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
        return serialized
    }

    pairToJson(pair){
        var serialized = {};
        serialized['x'] = pair.x;
        serialized['y'] = pair.y;
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
        return serialized
    }

    bulletToJson(bullet){
        var serialized = {};
        serialized['actorType'] = 'bullet'; // added to discern actor types when when deserializing
        serialized['position'] = this.pairToJson(opponent.position);
        serialized['velocity'] = this.pairToJson(opponent.velocity);
        serialized['colour'] = opponent.colour;
        serialized['radius'] = opponent.radius; 
        serialized['health'] = opponent.health;
        serialized['isZombie'] = opponent.isZombie;
        serialized['savedState'] = opponent.savedState;
        serialized['stateVars'] = opponent.stateVars;
        serialized['lifetime'] = opponent.lifetime;
    }

    /* Given the client's current stage, update it with the values contained in the 
       newStageJson object */
    updateStage(stage, newStageJson){

        var actors = {};
        var o;

        for (var i = 0; i < newStageJson['actors'].length; i++){
            //console.log(newStageJson['actors'][i]['actorType']);
            switch(newStageJson['actors'][i]['actorType']){ //each i is an actor's JSON 
                case 'tank':
                    // the first actor added in model is always the player (tank)
                    // NOTE: currently assuming there is only one actor
                    this.initPlayer(stage, newStageJson['actors'][i]);
                    actors[stage.player.actorID] = stage.player;
                case 'ball':
                    o = this.initBall(stage, newStageJson['actors'][i]);
                    actors[o.actorID] = o;
                    break;
                case 'box':
                    o = this.initBox(stage, newStageJson['actors'][i]);
                    actors[o.actorID] = o;
                    break;
                case 'opponent':
                    o = this.initOpponent(stage, newStageJson['actors'][i]);
                    actors[o.actorID] = o;                    
                    break;
                case 'bullet':
                    this.initBullet(stage, newStageJson['actors'][i]);
                    actors[o.actorID] = o;                    
                    break;
                default:
                    break;
            }
        }
        stage.actors = actors;
        //console.log(actors);
    }

    initPlayer(stage, playerJson){ //used only when it is the initial stage
        stage.player.position = this.retrievePair(playerJson['position']);
        stage.player.velocity = this.retrievePair(playerJson['velocity']);
        stage.player.colour = playerJson['colour'];
        stage.player.radius = playerJson['radius'];
        stage.health = playerJson['health'];
        stage.isZombie = playerJson['isZombie'];
        stage.savedState = playerJson['savedState'];
        stage.stateVars = playerJson['stateVars'];
        stage.turretDirection = this.retrievePair(playerJson['turretDirection']);
        stage.fire = playerJson['fire'];
        stage.pickup = playerJson['pickup'];
        stage.ammunition = playerJson['ammunition'];
        stage.player.actorID = playerJson['actorID'];
    }



    initOpponent(stage, opponentJson){
        var o = new Opponent(stage, this.retrievePair(opponentJson['position']), this.retrievePair(opponentJson['velocity']), opponentJson['colour'], opponentJson['radius'], opponentJson["actorID"]);
        o.isZombie = opponentJson['isZombie'];
        o.health = opponentJson['health'];
        o.stateVars = opponentJson['stateVars'];
        o.savedState = opponentJson['savedState'];
        o.turretDirection = this.retrievePair(opponentJson['turretDirection']);
        o.fire = opponentJson['fire'];
        o.pickup = opponentJson['pickup'];
        o.ammunition = opponentJson['ammunition'];
        o.fireDelay = opponentJson['fireDelay'];
        o.actorID = opponentJson['actorID'];
        return o;
    }


    /* Create and return a ball actor from the ballJson object*/
    initBall(stage, ballJson){
        var b = new Ball(stage, this.retrievePair(ballJson['position']), this.retrievePair(ballJson['velocity']), ballJson['colour'], ballJson['radius']);
        b.isZombie = ballJson['isZombie'];
        b.health = ballJson['health'];
        b.stateVars = ballJson['stateVars'];
        b.savedState = ballJson['savedState'];
        b.actorID = ballJson['actorID'];
        return b;
    }

    /* Create and return a box actor from the boxJson object*/
    initBox(stage, boxJson){
        var b = new Box(stage, this.retrievePair(boxJson['position']), boxJson['colour'], boxJson['radius'], boxJson['actorID']);
        b.velocity = this.retrievePair(boxJson['velocity']);
        b.isZombie = boxJson['isZombie'];
        b.health = boxJson['health'];
        b.stateVars = boxJson['stateVars'];
        b.savedState = boxJson['savedState'];
        b.actorID = boxJson['actorID'];
        return b;
    }

    /* Create and return a bullet actor from the bulletJson object*/
    initBullet(stage, bulletJson){
        var positionPair = new Pair(bulletJson["position_x"], bulletJson["position_y"]);
        var velocityPair = new Pair(bulletJson["velocity_x"], bulletJson["velocity_y"]);
        var b = new Bullet(stage, positionPair, velocityPair, "#000000", bulletJson['radius'], bulletJson['actorID']);
        b.stateVars = bulletJson['stateVars'];
        b.savedState = bulletJson['savedState'];
        b.lifetime = bulletJson['lifetime'];
        b.key = bulletJson['actorType'];
        return b;
    }

    retrievePair(pairJson){
        return new Pair(pairJson['x'], pairJson['y']);
    }


    updateStageTrimmed(stage, newTrimmedJson){ 
        //client side receives JSON, then apply the updates it to stage
        for (var i = 0; i < newTrimmedJson['actors'].length; i++){

            switch(newTrimmedJson['actors'][i]['actorType']){ //each i is an actor's JSON 
                case 'tank':
                    this.updatePlayer(stage, newTrimmedJson['actors'][i]);
                    break;

                case 'opponent':
                    this.updateOpponent(stage, newTrimmedJson['actors'][i]);
                    break;

                case 'bullet':
                    var b = newTrimmedJson['actors'][i];
                    if (stage.actors.hasOwnProperty(b['actorID'])){
                        this.updateBullet(stage, b);
                    }
                    else{
                        stage.addActor(this.initBullet(stage, b));
                    }
                    break;
            }
        }
    }

    /* Given the current stage, update the player with the values from playerJson*/
    updatePlayer(stage, playerJson){
        stage.player.position.x = playerJson["position_x"];
        stage.player.position.y = playerJson["position_y"];
        stage.player.velocity.x = playerJson["position_x"];
        stage.player.velocity.y = playerJson["position_y"];
        stage.player.isZombie = playerJson['isZombie'];
        stage.player.fire = playerJson['fire'];
        stage.player.pickup = playerJson['pickup'];
        stage.player.ammunition = playerJson['ammunition'];
        stage.player.actorID = playerJson['actorID'];
        stage.player.turretDirection.x = playerJson['turretDirection_x'];
        stage.player.turretDirection.y = playerJson['turretDirection_y'];
        let playerKey = playerJson['actorID'];
        stage.actors[playerKey] = stage.player;
    
    }

    updateOpponent(stage, opponentJson){
        let opponentKey = opponentJson['actorID'];
        let opponent = stage.actors[opponentKey];
        opponent.position.x = opponentJson["position_x"];
        opponent.position.y = opponentJson["position_y"];
        opponent.velocity.x = opponentJson["position_x"];
        opponent.velocity.y = opponentJson["position_y"];
        opponent.isZombie = opponent["isZombie"];
        opponent.turretDirection.x =  opponentJson["turretDirection_x"];
        opponent.turretDirection.y =  opponentJson["turretDirection_y"];
        opponent.fire = opponentJson["fire"];        
    }

    updateBullet(stage, bulletJson){
        let bulletKey = bulletJson["actorID"];
        let bullet = stage.actors[bulletKey];
        bullet.actorID = bulletKey;
        bullet.position.x = bulletJson["position_x"];
        bullet.isZombie = bulletJson["isZombie"];
        bullet.position.y = bulletJson["position_y"];
        bullet.velocity.x = bulletJson["velocity_x"];
        bullet.velocity.y = bulletJson["velocity_y"];
        bullet.lifetime = bulletJson['lifetime'];
        bullet.colour = bulletJson["colour"];
        bullet.radius = bulletJson["radius"];
    }

}