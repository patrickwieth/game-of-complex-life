/**
 * Created by prawda on 21.08.2016.
 */

var mongo = require('./mongo.js');


exports.create = function() {
    return new PyInterface();
};

var PythonShell = require('python-shell');
var R = require('ramda');

const pythonPath = {
    linux: 'python3',
    win32: 'python'
};

function PyInterface() {

    this.create = function(name) {
        console.log(name);
        var bla = new PythonShell('/modelnumpy/interface.py', {
            mode: 'text',
            pythonPath: pythonPath[process.platform],
            args: ['create', name]
        });
    };

    this.readStateFromMongo = function(collection) {
        return mongo.connect()
            .then(function(db) {
                mongo.getData(db, collection)
                    .then(function(result) {
                        console.log(result);
                    })
            })

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