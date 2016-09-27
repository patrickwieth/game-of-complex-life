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
            .then(mongo.empty(name))
            .then(mongo.close)
    };

    function stateToJS(state) {
        return {state: {color: state[2], energy: state[3], species: state[1]}};
    }
    function stateToPy(entry, index) {
        return [index, entry.state.species, entry.state.color, 0, "stay", 0]
    }
    function Array1DTo2D(newSizeFn, array) {
        var newSize = newSizeFn(array.length);
        var newArray = [];
        for(var i = 0; i < array.length; i += newSize) {
            newArray.push(array.slice(i, i+newSize));
        }
        return newArray;
    }
    function Array2DTo1D(array) {
        return [].concat.apply([], array);
    }

    this.readStateFromMongo = function(collection, stateLabel) {

        return mongo.connect()
            .then(mongo.getData(collection, stateLabel))
            .then(mongo.close)
            .then(R.prop('data'))
            .then(R.map(stateToJS))
            .then(R.curry(Array1DTo2D)(Math.sqrt));
    };

    this.saveStateToMongo = function(collection, step, state) {
        state = R.addIndex(R.map)(stateToPy, Array2DTo1D(state));

        return mongo.connect()
            .then(mongo.saveData(collection, step, state))
            .then(mongo.close);
    };

    this.evolve = R.curry(function(name, decisions) {
        return new Bluebird(function (resolve, reject) {
            var py = new PythonShell('/modelnumpy/interface.py', {
                mode: 'text',
                pythonPath: pythonPath[process.platform],
                args: ['evolve', name, JSON.stringify(decisions)]
            });

            py.end(function (err) {
                if (err) return reject(err);
                resolve("game " + name + " evolved");
            });
        });
    });
}