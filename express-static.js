/* The client intitially connects to this server via the URL, which serves up static content  */

var express = require('express');
var app = express();

// static_files has all of statically returned content
// https://expressjs.com/en/starter/static-files.html
app.use('/',express.static('static-content')); // this directory has files to be returned

app.listen(10231, function () {
  console.log('Example app listening on port 10231!');
});

