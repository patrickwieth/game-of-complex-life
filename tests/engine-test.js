var R = require('ramda');
var should = require('should');

var pyInterface = require('../interface/python-interface.js');
var gameOfLife = require('../model/game-of-complex-life.js');

const testSize = 5;
var testCollection = "test_game";

gameOfLife.setSize(testSize);


describe('engine', function() {
    describe('interface', function() {
        it('should create a game-of-life instance and load its state into JS', function(done) {
            gameOfLife.init();
            var py = pyInterface.create();
            py.newGame(testCollection, testSize)
                .then(R.partial(py.readStateFromMongo, [testCollection, "step0"]))
                .tap(function (result) {
                    result.should.have.length(testSize);
                    gameOfLife.setState(result);
                    gameOfLife.getState()[0][0].state.should.have.property('color');
                    gameOfLife.getState()[4][0].state.should.have.property('energy');
                    gameOfLife.getState()[0][4].state.should.have.property('species');
                })
                .then(R.partial(py.deleteGame, [testCollection]))
                .finally(done);
        });

        it('should call evolve with empty decisions', function(done) {
            var py = pyInterface.create();
            py.newGame(testCollection, testSize)
                .then(R.partial(py.evolve, [testCollection, []]))
                .then(R.partial(py.deleteGame, [testCollection]))
                .finally(done);
        });

        it('should place a new species', function(done) {
            gameOfLife.init();
            var py = pyInterface.create();
            py.newGame(testCollection, testSize)
                .tap(R.partial(gameOfLife.newSpecies, [1, {color: "Red", species: "test", position: {x: 1, y: 1}}]))
                .tap(R.partial(py.saveStateToMongo, [testCollection, "step0", gameOfLife.getState()]))
                .then(R.partial(py.deleteGame, [testCollection]))
                .finally(done);
        });

        it('should place a new species and move in a circle', function(done) {
            done();
        });
    });
});

