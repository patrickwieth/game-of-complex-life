var should = require('should');


var pyInterface = require('../interface/python-interface.js');
var gameOfLife = require('../model/game-of-complex-life.js');

describe('engine', function() {
    describe('interface', function() {
        it('should create a game-of-life instance', function(done) {
            var py = pyInterface.create();
            py.newGame("test_game");

            py.readStateFromMongo("test_game")
                .then(function(state) {
                    state;
                    //gameOfLife.setState(state);
                    done();
                });
        });

        it('should read a state from mongodb and save to gameOfLife object', function() {
            var iface = pyInterface.create();
            iface.readStateFromMongo()
                .then(function(state) {
                    gameOfLife.setState(state);
                });
        });



        it('should call evolve from python engine', function() {
            // var py = pyInterface.create("test");
            // py.evolve();
        });

        it('should call evolve with decisions from python engine', function() {
            // var py = pyInterface.create("test");
            // py.evolveWithDecisions([]);
        });
    });
});

