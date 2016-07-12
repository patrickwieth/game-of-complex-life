/**
 * Created by prawda on 14.01.2016.
 */

var R = require('ramda');

var cellularAutomaton = require('./cellular-automaton.js');

var CORPSE_COLOR = "black";
var EMPTY_COLOR = "white";


var emptyCell = new cellularAutomaton.createCell(
    function init() {
        return {
            color: EMPTY_COLOR,
            species: 'empty',
            energy: 0
        };
    }
);


var mooreNeighborhood = new cellularAutomaton.createNeighborhood(function () {
    var world = {};
    var space = [];

    var size = {
        x: 100,
        y: 100
    };

    for (var i = 0; i < size.x; i++) {
        space.push([]);
        for (var j = 0; j < size.y; j++) {
            space[i].push(R.clone(emptyCell));
        }
    }

    // the good modulo (works for negative values also)
    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    // hexagonal neighboorhood
    for (i = 0; i < size.x; i++) {
        for (j = 0; j < size.y; j++) {

            // left and right neighbors
            space[i][j].neighbors.push(space[mod(i + 1, size.x)][j]);
            space[i][j].neighbors.push(space[mod(i - 1, size.x)][j]);

            // upper neighbors
            space[i][j].neighbors.push(space[mod(i + j % 2 - 1, size.x)][mod(j + 1, size.y)]);
            space[i][j].neighbors.push(space[mod(i + j % 2, size.x)][mod(j + 1, size.y)]);

            // lower neighbors
            space[i][j].neighbors.push(space[mod(i + j % 2 - 1, size.x)][mod(j - 1, size.y)]);
            space[i][j].neighbors.push(space[mod(i + j % 2, size.x)][mod(j - 1, size.y)]);
        }
    }

    world.space = space;

    // this is not in use, but should be!
    world.parameters = {

        energy: {
            stay: 1,
            move: 2,
            fight: 4,
            clone: 10,
            wall: 1,
            fromEmptyCells: 1,
            fromSun: 0
        }
    };

    return world;
});

var gameOfLife = new cellularAutomaton.createAutomat(mooreNeighborhood);


function print() {
    gameOfLife.applyFunc(function (cell) {
        console.log(cell.state);
    });
}


exports.init = R.bind(gameOfLife.init, gameOfLife);

exports.evolve = R.bind(gameOfLife.evolve, gameOfLife);

exports.registerDecisions = function(species, decisions) {
    gameOfLife.decisions[species] = decisions;
};

exports.getState = function () {
    return gameOfLife.world.space;
};

exports.killAll = function (species) {
    gameOfLife.applyFunc(function (cell) {
        if(cell.state.species == species) cell.kill();
    });
};

/*
function makeDecision() {

    return {
        action: "clone",
        value: Math.floor(Math.random()*6)
    };

    var freeNeighbors = [];

    for(i = 0; i < this.neighbors.length; i++) {
        if(this.neighbors[i].state.species !== 'empty') {
            if(this.neighbors[i].state.color !== this.color) {
                return {
                    action: "fight",
                    value: i
                };
            }
        }
        else {
            freeNeighbors.push(i);
        }
    }

    if(freeNeighbors.length > 0) {
        return {
            action: "clone",
            value: freeNeighbors[Math.floor(Math.random()*freeNeighbors.length)]
        }
    }
    else {
        return {
            action: "stay",
            value: Math.floor(Math.random() * 6)
        };
    }
}
*/
exports.newSpecies = function (clientId, event) {

    gameOfLife.decisions[event.species] = [];

    var newCell = new cellularAutomaton.createCell(
        function init() {
            return {
                color: event.color,
                species: event.species,
                energy: 0
            };
        }
    );

    gameOfLife.world.space[event.position.x][event.position.y].state = newCell.state;
    gameOfLife.world.space[event.position.x][event.position.y].futureState = newCell.futureState;

};

exports.setParameters = function (event) {
    gameOfLife.parameters.someProperty = event.someProperty;
};


function mapRandomStart(fn, array) {
    var startIndex = Math.floor(Math.random() * array.length);

    for (var i = 0; i <= array.length; i++) {
//        array[i+startIndex%array.length] = R.merge(array[i+startIndex%array.length], fn(array[i+startIndex%array.length]);
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
