/**
 * Created by prawda on 21.08.2016.
 */

var mongo = require('./mongo.js');
var Bluebird = require('bluebird');

exports.create = function() {
    return new PyInterface();
};

var PythonShell = require('python-shell');
var R = require('ramda');

const pythonPath = {
    linux: 'python3',
    win32: 'python'
};

const testSize = 5;

function PyInterface() {

    this.newGame = function(name) {
        return new Bluebird(function(resolve, reject) {
            var py = new PythonShell('/modelnumpy/interface.py', {
                mode: 'text',
                pythonPath: pythonPath[process.platform],
                args: ['create', name, testSize]
            });

            py.end(function (err) {
                if (err) return reject(err);
                resolve("game "+name+" successfully created");





            });
        });
    };

    this.deleteGame = function(name) {
        return mongo.connect()
            .then(R.curry(mongo.purge)(R.__, name))
            .then(mongo.close)
    };

    this.readStateFromMongo = function(collection) {
        return mongo.connect()
            .then(R.curry(mongo.getData)(R.__, collection));

    };

    this.evolve = function() {
        new PythonShell('/modelnumpy/interface.py', {
            mode: 'text',
            pythonPath: pythonPath[process.platform]
        });
    };

    this.evolveWithDecisions = function(decisions) {
        new PythonShell('/modelnumpy/interface.py', {
            mode: 'text',
            pythonPath: pythonPath[process.platform],
            args: ['evolve', JSON.stringify(decisions)]
        });
    };

}