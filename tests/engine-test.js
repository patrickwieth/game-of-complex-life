var should = require('should');


var pyInterface = require('../interface/python-interface.js');
var gameOfLife = require('../model/game-of-complex-life.js');

describe('engine', function() {
    describe('interface', function() {
        it('should read a state from mongodb and save to gameOfLife object', function() {
            var iface = pyInterface.create();
            iface.readStateFromMongo()
                .then(function(state) {
                    gameOfLife.setState(state);
                });
        });

        it('should call evolve from python engine', function(){

            var py = pyInterface.create("test");

            py.evolve();
        });
    });
});

