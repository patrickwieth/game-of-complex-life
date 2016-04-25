/**
 * Created by prawda on 02.02.2015.
 */

var R = require('ramda');
var Promise = require("bluebird");

//webserver stuff
var express = require('express');
var app = express.createServer();

// communicate via io
var io = require('socket.io')(app);

//io.enable('browser client minification');  // send minified client
//io.enable('browser client etag');          // apply etag caching logic based on version number
//io.set('log level', 1);                    // reduce logging

// Add a connect listener
io.on('connection', function(client){

    // Success!  Now listen to messages to be received
    client.on('message',function(event){
        if(event === 'reset') {
            gameOfLife.init();
        }
        if(event === 'start') {
            updateInterval = setInterval(updates, timePerFrame);
        }
        if(event === 'stop') {
            clearInterval(updateInterval);
        }
        if(typeof event === 'object') {
            if(event.type === 'buttonClick') {
                gameOfLife.buttonClick(event.value);
            }
            else if(event.type === 'setParameters') {
                gameOfLife.setParameters(event);
            }

        }
        console.log('Received message from client:',event);
    });
    client.on('disconnect',function(){
        //clearInterval(interval);
        console.log('Server has disconnected');
    });

});


var port = process.env.NODE_ENV === 'production' ? 80 : 8080;
app.listen(port);
console.log('server running at http://127.0.0.1:'+port+'/');

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/app'));
});
app.set("view options", { layout: false });

app.get('/', function(req, res){
    res.render('index.html');
});

var gameOfLife = require('./model/game-of-lotkaVolterra.js');

// UPDATE PER WEBSOCKETS STUFF

var timePerFrame = 100;


var updates = function() {

    var strippedState =
        R.map( function(row) {
                return R.map( R.path(['state', 'color']), row)
            }, gameOfLife.getState());

    io.sockets.volatile.emit('state', JSON.stringify(strippedState));

    gameOfLife.evolve();

};

var updateInterval = setInterval(updates, timePerFrame);
