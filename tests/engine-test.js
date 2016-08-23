var should = require('should');

var user = {
    name: 'tj'
    , pets: ['tobi', 'loki', 'jane', 'bandit']
};

user.should.have.property('name', 'tj');
user.should.have.property('pets').with.lengthOf(4);

var pyInterface = require('../python-interface.js');

describe('engine', function() {
    describe('communication', function(){
        it('should talk to python', function(done){
            var py = pyInterface.create();

            py.send();
            

            py.printBuffer();
            setTimeout(py.printBuffer, 500);

            setTimeout(done, 1000);

        });
    });
});

