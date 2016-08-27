var should = require('should');

var user = {
    name: 'tj'
    , pets: ['tobi', 'loki', 'jane', 'bandit']
};

user.should.have.property('name', 'tj');
user.should.have.property('pets').with.lengthOf(4);

var pyInterface = require('../interface/python-interface.js');
var gameOfLife = require('../model/game-of-complex-life.js');

describe('engine', function() {
    describe('interface', function() {
        it('should read a state from mongodb and save to gameOfLife object', function() {
            var interface = pyInterface.create();
            interface.readStateFromMongo()
                .then(function(state) {

                    gameOfLife.setState(state);
                });

        });

        it('should talk to python', function(done){
            // init a game
            pyInterface.create("test");

            // get the state

            var py = pyInterface.create();

            var bla = py.send();
            var blu = py.send();

            py.printBuffer();
            setTimeout(py.printBuffer, 500);

            setTimeout(done, 1000);

        });
    });
});

