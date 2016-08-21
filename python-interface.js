/**
 * Created by prawda on 21.08.2016.
 */


var PythonShell = require('python-shell');

var pyshell = new PythonShell('/modelpy/node-interface.py', {
    mode: 'json',
    pythonPath: 'python3'
});

var output = '';
pyshell.stdout.on('data', function (data) {
    console.log(data);
    output += ''+data;
});

pyshell.send({"command": "killAll"}).end(function (err) {
    if (err) console.log(err);
    console.log(output);
});

setTimeout(terminate, 1000);

function terminate() {
// end the input stream and allow the process to exit
    pyshell.end(function (err) {
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

