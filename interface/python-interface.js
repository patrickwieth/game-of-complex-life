/**
 * Created by prawda on 21.08.2016.
 */

var mongo = require('./mongo.js');


exports.create = function(name) {
    return new PyInterface();
};

var PythonShell = require('python-shell');
var R = require('ramda');

const pythonPath = {
    linux: 'python3',
    win32: 'python'
};

function PyInterface() {
    this.readStateFromMongo = function() {
        return mongo.connect()
            .then(mongo.getData);
    };

    this.evolve = function() {
        new PythonShell('/modelnumpy/interface.py', {
            mode: 'text',
            pythonPath: pythonPath[process.platform]
        });
    };


}