var R = require('ramda');
var should = require('should');

var pyInterface = require('../interface/python-interface.js');
var gameOfLife = require('../model/game-of-complex-life.js');

const testSize = 5;
var testCollection = "test_game";

gameOfLife.setSize(testSize);
gameOfLife.init();

describe('engine', function() {
    describe('interface', function() {
        it('should create a game-of-life instance', function(done) {
            var py = pyInterface.create();
            py.newGame(testCollection)
                .then(R.partial(py.readStateFromMongo, [testCollection]))
                .tap(function (result) {
                    result.should.have.length(testSize);
                    gameOfLife.setState(result);
                    gameOfLife.getState()[0][0].should.have.property('color');
                    gameOfLife.getState()[4][0].should.have.property('energy');
                    gameOfLife.getState()[0][4].should.have.property('species');
                })
                .then(R.partial(py.deleteGame, [testCollection]))
                .then(done);
        });

        it('should call evolve with decisions from python engine', function() {
            // var py = pyInterface.create("test");
            // py.evolveWithDecisions([]);
        });

        it('should clean the mongodb from test entries', function () {
            //var py = pyInterface.create();
        });
    });
});

