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

var clients = [];

// Add a connect listener
io.on('connection', function(client) {

    // user gets his unique key
    var clientKey = clients.length + "_" + Math.floor(Math.random()*1000000000);
    clients.push({key: clientKey, species: "none", color: ""});
    client.send({key: clientKey});
    console.log("registered client "+clientKey);

    // Success!  Now listen to messages to be received
    client.on('message', function(event) {

        function validKey(event) {
            if(typeof event.key === 'string') {
                var id = clientId(event);
                return (clients[id].key === event.key)
            }
            else return false;
        }

        function clientId(event) {
            return event.key.split('_')[0];
        }

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
            if(event.type === 'newSpecies') {
                if(validKey(event)) {
                    var id = clientId(event);

                    // kill all old cells
                    gameOfLife.killAll(clients[id].species);

                    // register new species, first check for valid name
                    if(typeof event.species === 'string' && event.species !== 'empty' && event.species !== 'wall') {

                        clients[id].color = event.color;
                        clients[id].species = event.species;

                        gameOfLife.newSpecies(id, event);
                        console.log('Registering new species:',event);
                    }
                }
            }
            else if(event.type === 'decisions') {
                if(validKey(event)) {
                    gameOfLife.registerDecisions(clients[clientId(event)].species, event.value);
                    //console.log('Registered decisions from client:',event);
                    console.log("registered "+event.value.length+" decisions from user " + clientId(event));
                }
                else console.log("invalid key received for decisions");
            }
            else if(event.type === 'setParameters') {
                gameOfLife.setParameters(event);
                console.log('parameters from client:',event);
            }
        }

    });
    client.on('disconnect',function(){
        //clearInterval(interval);
        console.log('Client has disconnected');
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

var gameOfLife = require('./model/game-of-complex-life.js');

// updates of game come here:

var timePerFrame = 200;


var updates = function() {

    gameOfLife.evolve();

    var strippedState =
        R.map( function(row) {
            return R.map( R.path(['state']), row)
        }, gameOfLife.getState());

    io.sockets.volatile.emit('state', strippedState);
};

var updateInterval = setInterval(updates, timePerFrame);
