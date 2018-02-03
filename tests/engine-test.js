var R = require('ramda');
var should = require('should');

var pyInterface = require('../interface/python-interface.js');
var gameOfLife = require('../model/game-of-complex-life.js');

const testSize = 5;
var testName = "test_game";

gameOfLife.setSize(testSize);


describe('engine', function() {
    describe('interface', function() {
        var py = pyInterface.create();

        it('should create a game-of-life instance and load its state into JS', function(done) {
            gameOfLife.init();

            py.newGame(testSize, {name: testName})
                .then(py.readStateFromMongo("step0"))
                .tap(function (res) {
                    result = res.data;
                    result.should.have.length(testSize);
                    gameOfLife.setState(result);
                    gameOfLife.getState()[0][0].state.should.have.property('color');
                    gameOfLife.getState()[4][0].state.should.have.property('energy');
                    gameOfLife.getState()[0][4].state.should.have.property('species');
                })
                .then(py.deleteGame)
                .finally(done);
        });

        it('should call evolve with empty decisions', function(done) {
            py.newGame(testSize, {name: testName})
                .then(py.evolve([]))
                .then(py.deleteGame)
                .finally(done);
        });

        it('should place a new species', function(done) {
            gameOfLife.init();

            py.newGame(testSize, {name: testName})
                .tap(R.partial(gameOfLife.newSpecies, [1, {color: "Red", species: "test", position: {x: 1, y: 1}}]))
                .tap(py.saveStateToMongo("step0", gameOfLife.getState()))
                .then(py.deleteGame)
                .finally(done);
        });

        it('should place a new species and move 1 field', function(done) {
            gameOfLife.init();

            py.newGame(testSize, {name: testName})
                .tap(R.partial(gameOfLife.newSpecies, [1, {color: "Red", species: "test", position: {x: 1, y: 1}}]))
                .then(py.saveStateToMongo("step0", gameOfLife.getState()))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 0}]}]))
                .tap(function() {
                    // TODO checks here
                })
                .then(py.deleteGame)
                .finally(done);
        });

        it('should place a new species and move in a circle', function(done) {
            this.timeout(12000);    // TODO WTF? 12s

            gameOfLife.init();

            py.newGame(testSize, {name: testName})
                .tap(R.partial(gameOfLife.newSpecies, [1, {color: "Red", species: "test", position: {x: 1, y: 1}}]))
                .then(py.saveStateToMongo("step0", gameOfLife.getState()))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 0}]}]))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 1}]}]))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 2}]}]))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 3}]}]))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 4}]}]))
                .then(py.evolve([{species: "test", decisions: [{action: "move", value: 5}]}]))
                .tap(function() {
                    // TODO checks here
                })
                .then(py.deleteGame)
                .finally(done);
        });
    });
});

