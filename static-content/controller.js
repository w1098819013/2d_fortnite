
const utils = new Utils()

hasBeenSetup = false;
stage=null;
view = null;
interval=null;
canvas=null;
isMobile = false;
gui_state = {
	isLoggedIn : false,
	user     : "",
	password : ""
};
var socket = null;

function showUI(ui){
	$(".ui_top").hide();
	clearErrors(ui);
	if(!gui_state.isLoggedIn){
		$("#ui_nav").hide();
		if(ui!="#ui_login" && ui!="#ui_register"){
			ui="#ui_login";
		}
	} else {
		var ui_name = ui.substr(1); // remove the #
		$("#ui_nav").show();
		$("#ui_nav a").removeClass("nav_selected");
		$("#ui_nav a[name="+ui_name+"]").addClass("nav_selected");
	}
	if(ui=="#ui_play")startGame();
	else pauseGame();
	$(ui).show();
}

//Get Mouse Position
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function setupSocket(){
	if(stage == null){
		canvas = document.getElementById('stage');
		stage = new Stage(canvas);
		console.log("Created stage.");
	} else{
		console.log("Stage already created.");
	}
	//setupGame();

	socket = new WebSocket("ws://142.1.200.140:10234"); // usually port 10232
	socket.onopen = function (event) {
		// $('#sendButton').removeAttr('disabled');

		console.log("connected");
	};
	socket.onclose = function (event) {
		alert("You have been disconnected from the game.  \nclosed code:" + event.code + " reason:" +event.reason + " wasClean:"+event.wasClean);
	};
	socket.onmessage = function (event) {

		var data = JSON.parse(event.data);

		if (data.hasOwnProperty("initState")){
			utils.updateStage(stage, data);
		}
		else{
			//console.log("has Actors property: " + data.hasOwnProperty("actors"));
			//console.log("has initState property: " + data.hasOwnProperty("initState"));
			//console.log("actors array length: " + data['actors'].length);
			utils.updateStageTrimmed(stage, data);
			// console.log("Updated stage!");
		}

		if (!hasBeenSetup){
			setupGame();
			hasBeenSetup = true;
		}
		// setupGame();
	}
}

function setupGame(){

	isMobile = mobileCheck();
	console.log("Mobile user: " + isMobile);
	if(isMobile){
		$(".ui_mobile_controls").show();

		// TODO: lock orientation to portrait

		// When the direction buttons are held, move player.
		holdMoveButton(document.getElementById("control_up"), 'w', 0, -1);
		holdMoveButton(document.getElementById("control_left"), 'a', -1, 0);
		holdMoveButton(document.getElementById("control_right"), 'd', 1, 0);
		holdMoveButton(document.getElementById("control_down"), 's', 0, 1);

		// Device orientation (tilt) moves player
		if(window.DeviceOrientationEvent){
			// device orientation supported.
			window.addEventListener("deviceorientation", function(event) {
				let tiltLeftRight = Math.round(event.gamma);
				let tiltFrontBack = Math.round(event.beta);
				handleOrientationEvent(tiltLeftRight, tiltFrontBack);
			}, true);
		} else{ console.log("Device orientation not supported!"); }

	} else{
		$(".ui_mobile_controls").hide();
	}

	// https://javascript.info/keyboard-events
	document.addEventListener('keydown', function(event){
		var key = event.key;
		var moveMap = { 
			'a': { "dx": -1, "dy": 0},
			's': { "dx": 0, "dy": 1},
			'd': { "dx": 1, "dy": 0},
			'w': { "dx": 0, "dy": -1},
			'A': { "dx": -1, "dy": 0},
			'S': { "dx": 0, "dy": 1},
			'D': { "dx": 1, "dy": 0},
			'W': { "dx": 0, "dy": -1}
		};
		if(key in moveMap){
			//stage.player.setDirection(moveMap[key].dx, moveMap[key].dy);
			sendKeyboardEvent(key, moveMap[key].dx, moveMap[key].dy);
		} else if(key=="e"){
			//stage.player.setPickup(true);
			sendKeyboardEvent(key, 0, 0);
		}
	});
	//report the mouse position on click
	canvas.addEventListener("mousemove", function (event) {
    	var mousePos = getMousePos(canvas, event);
		//console.log(mousePos.x + ',' + mousePos.y);
		sendMouseMoveEvent(mousePos.x, mousePos.y);
	}, false);

	// This handles tap to fire and pickup on mobile too!
	canvas.addEventListener("click", function (event) {
    	var mousePos = getMousePos(canvas, event);
		sendMouseClickEvent(mousePos.x, mousePos.y);
		// on mobile, click also functions as 'e' to pickup
		if(isMobile){ sendKeyboardEvent('e', 0, 0); }
	}, false);
}

/* Given the left-right and front-back tilt axes, take the largest
   tilt and move the player in that direction 📲 */
function handleOrientationEvent(tiltLeftRight, tiltFrontBack){
	tiltSensitivity = 5;

	if(Math.abs(tiltLeftRight) > Math.abs(tiltFrontBack)){
		// left-right tilt is the largest, so use this for movement
		// negative tilt is left; positive right
		if(tiltLeftRight < 0 && Math.abs(tiltLeftRight) >= tiltSensitivity){
			sendKeyboardEvent('a', -1, 0);
		} 
		if(tiltLeftRight >= 0 && Math.abs(tiltLeftRight) >= tiltSensitivity){
			sendKeyboardEvent('d', 1, 0);
		}
	} else{
		// negative is forward; positive back
		if(tiltFrontBack < 0 && Math.abs(tiltFrontBack) >= tiltSensitivity){
			sendKeyboardEvent('w', 0, -1);
		} 
		if(tiltFrontBack >= 0 && Math.abs(tiltFrontBack) >= tiltSensitivity){
			sendKeyboardEvent('s', 0, 1);
		}
	}
}

/* MOBILE-ONLY: Send continuous keyboard events for key with dx and dy while
   btn is held.*/
function holdMoveButton(btn, key, dx, dy){
	var t;
	start = 1; // 1 ms
	var repeat = function() {
		sendKeyboardEvent(key, dx, dy);
		t = setTimeout(repeat, start);
	}

	// to work on desktop, use 'mouseup' and 'mousedown'.
	btn.addEventListener('touchstart', function(event){ repeat(); });
	btn.addEventListener('touchend', function(event){ clearTimeout(t); });
}

function mobileCheck(){
	var check = false;
	// TODO: change mobile check to account for tablets.
	(function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;}) (navigator.userAgent||navigator.vendor||window.opera,'http://detectmobilebrowser.com/mobile');
	return check;
}

/* Send the keyboard event as a JSON object over socket*/
function sendKeyboardEvent(key, dx, dy){
	let jsonObject = {};
	jsonObject['keyEvent'] = [dx, dy];
	if(key == "e" || key == "E"){
		jsonObject['setPickup'] = true;
	}
	socket.send(JSON.stringify(jsonObject));
}

function sendMouseClickEvent(x, y){
	let jsonObject = {};
	jsonObject['mouseClickEvent'] = [x, y];
	socket.send(JSON.stringify(jsonObject));
}

function sendMouseMoveEvent(x, y){
	let jsonObject = {};
	jsonObject['mouseMoveEvent'] = [x, y];
	socket.send(JSON.stringify(jsonObject));
}



function startGame(){
	interval=setInterval(function(){ 
		stage.animate();
		
	},20);
}
function pauseGame(){
	clearInterval(interval);
	interval=null;
}

function gui_logout(){
	gui_state.isLoggedIn=false;
	gui_state.user="";
	gui_state.password="";
	showUI("#ui_login");
}

function clearErrors(ui){
	$(ui+" .form-errors").html("");
}

function showErrors(ui,response){
	let s="";
	let errors=response.error;
	for(let e in errors){
		s = s+errors[e]+"<br/>";
	}
	$(ui+" .form-errors").html(s);
}

function gui_login(){
	var user = $("#ui_login [name=user]").val();
	var password = $("#ui_login [name=password]").val();
	clearErrors("#ui_login");
	var f = function(data, success){
		var s = success && data.success;
		if(s){
			gui_state.isLoggedIn=true;
			gui_state.user=user;
			gui_state.password=password;
                        setupSocket();  //changed from setupGame()
                        showUI("#ui_play");
		} else {
			gui_state.isLoggedIn=false;
			gui_state.user="";
			gui_state.password="";
                        showUI("#ui_login");
			showErrors("#ui_login",data);
		}
	}
	api_login(user, password, f);
}

function checkboxSelected(value){
	if(value)return true;
	return false;
}

function getProfileFromForm(formId){
	var data = {
		user : $(formId+" [data-name=user]").val(),
		password : $(formId+" [data-name=password]").val(),
		confirmpassword : $(formId+" [data-name=confirmpassword]").val(),
		skill : $(formId+" [data-name=skill]:checked").val(),
		year: $(formId+" [data-name=year]").val(),
		month: $(formId+" [data-name=month]").val(),
		day: $(formId+" [data-name=day]").val(),
		playmorning: checkboxSelected($(formId+" [data-name=playmorning]:checked").val()),
		playafternoon: checkboxSelected($(formId+" [data-name=playafternoon]:checked").val()),
		playevening: checkboxSelected($(formId+" [data-name=playevening]:checked").val())
	};
	return data;
}

function gui_register(){
	clearErrors("#ui_register");
	var data = getProfileFromForm("#ui_register");
	var f = function(response, success){
		if(success){
                        showUI("#ui_login");
		} else {
			showErrors("#ui_register",response);
		}
	}
	api_register(data, f);
}

function gui_profile(){
	clearErrors("#ui_profile");
	var data = getProfileFromForm("#ui_profile");
	var f = function(response, success){
		if(success){
			gui_state.password = data.password; // in case password changed
		} else {
			showErrors("#ui_profile",response);
		}
	}
	var credentials = { user: gui_state.user, password: gui_state.password };
	api_profile(data, f, credentials);
}

function putDataIntoProfileForm(data){
	var formId="#ui_profile";
	$(formId+" [data-name=user]").html(data.user);
	$(formId+" [data-name=password]").val(data.password);
	$(formId+" [data-name=confirmpassword]").val(data.password);
	$(formId+" [data-name=skill][value="+data.skill+"]").attr('checked',true);
	$(formId+" [data-name=year]").val(data.year);
	$(formId+" [data-name=month]").val(data.month);
	$(formId+" [data-name=day]").val(data.day);
	$(formId+" [data-name=playmorning]").attr('checked', data.playmorning==1);
	$(formId+" [data-name=playafternoon]").attr('checked', data.playafternoon==1);
	$(formId+" [data-name=playevening]").attr('checked', data.playevening==1);
}

function gui_profile_load(){
	var credentials = { user: gui_state.user, password: gui_state.password };
	var f = function(response, success){
		if(success){
			// response.data has fields to load into our form
			putDataIntoProfileForm(response.data);
			showUI("#ui_profile");
		} else {
			showErrors("#ui_profile",response);
		}
	}
	var credentials = { user: gui_state.user, password: gui_state.password };
	api_profile_load(f, credentials);
}

// This is executed when the document is ready (the DOM for this document is loaded)
$(function(){
        showUI("#ui_login");
});

