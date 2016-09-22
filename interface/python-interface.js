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

function PyInterface() {

    this.newGame = R.curry(function(name, gameSize) {
        return new Bluebird(function(resolve, reject) {
            var py = new PythonShell('/modelnumpy/interface.py', {
                mode: 'text',
                pythonPath: pythonPath[process.platform],
                args: ['create', name, gameSize]
            });

            py.end(function (err) {
                if (err) return reject(err);
                resolve("game "+name+" successfully created");
            });
        });
    });

    this.deleteGame = function(name) {
        return mongo.connect()
            .then(R.curry(mongo.empty)(R.__, name))
            .then(mongo.close)
    };

    this.readStateFromMongo = function(collection) {

        function stateConversion(state) {
            return {state: {color: state[2], energy: state[3], species: state[1]}};
        }
        function convertStateToJS(stateArray) {
            return R.map(stateConversion, stateArray.data);
        }
        function Array1DTo2D(newSizeFn, array) {
            var newSize = newSizeFn(array.length);
            var newArray = [];
            for(var i = 0; i < array.length; i += newSize) {
                newArray.push(array.slice(i, i+newSize));
            }

            return newArray;
        }

        return mongo.connect()
            .then(R.curry(mongo.getData)(R.__, collection))
            .then(convertStateToJS)
            .then(R.curry(Array1DTo2D)(Math.sqrt));
    };

    this.evolve = R.curry(function(name, decisions) {
        new PythonShell('/modelnumpy/interface.py', {
            mode: 'text',
            pythonPath: pythonPath[process.platform],
            args: ['evolve', name, JSON.stringify(decisions)]
        });
    });
}