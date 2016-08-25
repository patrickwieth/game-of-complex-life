var should = require('should');

var user = {
    name: 'tj'
    , pets: ['tobi', 'loki', 'jane', 'bandit']
};

user.should.have.property('name', 'tj');
user.should.have.property('pets').with.lengthOf(4);

var pyInterface = require('../interface/python-interface.js');

describe('engine', function() {
    describe('communication', function(){
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

