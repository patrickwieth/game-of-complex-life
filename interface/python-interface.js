/**
 * Created by prawda on 21.08.2016.
 */

var mongo = require('./mongo.js');


mongo.connect()
    .then(mongo.getData)
    .then(function(result) {
        result;
    });

exports.test = test;
exports.create = function(name) {
    return new PyInterface(name);
};

var PythonShell = require('python-shell');
var R = require('ramda');

console.log(process.platform);
const pythonPath = {
    linux: 'python3',
    win32: 'python'
};

function PyInterface() {
    this.shell = new PythonShell('/modelpy/node-interface.py', {
        mode: 'json',
        pythonPath: pythonPath[process.platform]
    });

    this.send = function() {
        return this.shell.send({"command": "killAll"});
    };

    this.end = function() {
        this.shell.end(function (err) {
            if (err) console.log(err);
        });
    };

    this.buffer = [];
    var that = this;

    this.printBuffer = function() {
        console.log(that.buffer);
    };

    this.shell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log("receive");
        that.buffer.push(message);
    });

}


function test() {

    console.log("bla");

    var pyshell = new PythonShell('/modelpy/node-interface.py', {
        mode: 'json',
        pythonPath: pythonPath
    });


    pyshell.stdout.on('data', function (data) {
        console.log(data);
    });

    pyshell.send({"command": "killAll"}).end(function (err) {
        if (err) console.log(err);

    });

    setTimeout(R.partial(terminate, [pyshell]), 1000);


}

function terminate(shell) {
    // end the input stream and allow the process to exit
    shell.end(function (err) {
        if (err) throw err;
        console.log('finished');
    });
}

function init() {
    pyshell.send({ command: 'init' });
}

function killAll(species) {
    pyshell.send({ command: 'killAll', value: species });
}

function newSpecies(clientId, event) {
    pyshell.send({ command: 'newSpecies', clientId: clientId, event: event });
}

function registerDecisions(species, value) {
    pyshell.send({ command: 'registerDecisions', species: species, value: value });
}

function setParameters(event) {
    pyshell.send({ command: 'setParameters', event: event });
}

