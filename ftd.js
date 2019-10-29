var port = 10233; // // usually port 10230
var express = require('express');
var app = express();
// app.disable('etag');

// http://www.sqlitetutorial.net/sqlite-nodejs/connect/
const sqlite3 = require('sqlite3').verbose();

// https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// http://www.sqlitetutorial.net/sqlite-nodejs/connect/
// https://github.com/mapbox/node-sqlite3/wiki/API
// will create the db if it does not exist
var db = new sqlite3.Database('db/database.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});

// https://expressjs.com/en/starter/static-files.html
app.use(express.static('static-content')); 

function isEmptyObject(obj){
	return Object.keys(obj).length === 0;
}

app.post('/api/login', function (req, res) {
	var user = req.body.user;
	var password = req.body.password;

	var result = { "error": {} , "success":false};
	if(user==""){
		result["error"]["user"]="user not supplied";
	}
	if(password==""){
		result["error"]["password"]="password not supplied";
	}
	if(isEmptyObject(result["error"])){
		let sql = 'SELECT * FROM user WHERE user=? and password=?;';
		db.get(sql, [user, password], function (err, row){
  			if (err) {
				res.status(500); 
    				result["error"]["db"] = err.message;
  			} else if (row) {
				res.status(200);
				result.success = true;
			} else {
				res.status(401);
				result.success = false;
    				result["error"]["login"] = "login failed";
			}
			res.json(result);
		});
	} else {
		res.status(400);
		res.json(result);
	}
});


function validateUser(data){
	result = {};

	var user = data.user;
	var password = data.password;
	var confirmpassword = data.confirmpassword;
	var skill = data.skill;
	var year= data.year;
	var month= data.month;
	var day= data.day;

	if(!user || user==""){
		result["user"]="user not supplied";
	}
	if(!password || password==""){
		result["password"]="password not supplied";
	}
	if(!confirmpassword || password!=confirmpassword){
		result["confirmpassword"]="passwords do not match ";
	}
	if(!skill || -1==["beginner","intermediate","advanced"].indexOf(skill)){
		result["skill"]="invalid skill";
	}
	if(!year || !/^\d{4}$/.test(year)){
		result["year"]="invalid year";
	} else {
		year = parseInt(year);
		if(!(1900<=year && year<=2100))result["year"]="invalid year";
	}
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	if(!month || -1==months.indexOf(month)){
		result["year"]="invalid month";
	}
	if(!day || !/^\d{1,2}$/.test(day)){
		result["day"]="invalid day";
	} else {
		day = parseInt(day);
		if(!(1<=day && day<=31))result["day"]="invalid day";
	}
	return result;
}

// Create a new user
app.post('/api/user/:user', function (req, res) {
	var result = { error: validateUser(req.body) , success:false};
	if(isEmptyObject(result["error"])){
		let sql = 'INSERT INTO user '+
			'(user, password, skill, year, month, day, playmorning, playafternoon, playevening) ' +
			' VALUES(?,?,?,?,?,?,?,?,?);';
		let d = req.body;
		let params = [d.user, d.password, d.skill, d.year, d.month, d.day, d.playmorning, d.playafternoon, d.playevening];

		db.run(sql, params, function (err){
  			if (err) {
				res.status(500); 
    				result["error"]["db"] = err.message;
  			} else {
				if(this.changes!=1){
    					result["error"]["db"] = "Not updated";
					res.status(404);
				} else {
					res.status(200);
					result.success = true;
				}
			}
			res.json(result);
		});
	} else {
		res.status(400);
		res.json(result);
	}
});

// Update user
app.put('/api/user/:user', function (req, res) {
	var result = { error: validateUser(req.body) , success:false};
	if(isEmptyObject(result["error"])){
		let sql = 'UPDATE user SET '+
			' password=?, skill=?, year=?, month=?, day=?, playmorning=?, playafternoon=?, playevening=? ' +
			' WHERE user=? AND password=?;';
		let d = req.body;
		let params = [d.password, d.skill, d.year, d.month, d.day, d.playmorning, d.playafternoon, d.playevening, d.credentials.user, d.credentials.password];

		db.run(sql, params, function (err){
  			if (err) {
				res.status(500); 
    				result["error"]["db"] = err.message;
  			} else {
				if(this.changes!=1){
    					result["error"]["db"] = "Not updated";
					res.status(404);
				} else {
					res.status(200);
					result.success = true;
				}
			}
			res.json(result);
		});
	} else {
		res.status(400);
		res.json(result);
	}
});

app.get('/api/user/:user', function (req, res) {
	// console.log(JSON.stringify(req));
	// var user = req.body.user;
	// var password = req.body.password;

	var user = req.params.user;
	var password = req.query.password;

	var result = { error: {} , success:false};
	if(user==""){
		result["error"]["user"]="user not supplied";
	}
	if(password==""){
		result["error"]["password"]="password not supplied";
	}
	if(isEmptyObject(result["error"])){
		let sql = 'SELECT * FROM user WHERE user=? and password=?;';
		db.get(sql, [user, password], function (err, row){
  			if (err) {
				res.status(500); 
    				result["error"]["db"] = err.message;
  			} else if (row) {
				res.status(200);
				result.data = row;
				result.success = true;
			} else {
				res.status(401);
				result.success = false;
    				result["error"]["login"] = "login failed";
			}
			res.json(result);
		});
	} else {
		res.status(400);
		res.json(result);
	}
});

app.listen(port, function () {
  	console.log('ftd2 app listening on port '+port);
});

// db.close();

