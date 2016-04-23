/**
 * Created by prawda on 14.01.2016.
 */

var R = require('ramda');

var cellularAutomaton = require('./cellular-automaton.js');

var ALIVE_COLOR = "steelblue";
var DEAD_COLOR = "white";

var lifeCell = new cellularAutomaton.createCell(
    function init () {
        var aliveRatio = 0.3;
        var rnd = Math.random();
        return {
            color: rnd < aliveRatio ? ALIVE_COLOR : DEAD_COLOR,
            alive: rnd < aliveRatio
        };
    },
    function update() {
        var neighborsAlive = 0;

        R.forEach(function(neighbor) {
            if(neighbor.state.alive) neighborsAlive++;
        }, this.neighbors);

        if(this.state.alive) {
            if(neighborsAlive > 4 || neighborsAlive < 2) return {
                alive: false,
                color: DEAD_COLOR
            };
            else return{
                alive: true,
                color: ALIVE_COLOR
            };
        }
        else {
            if(neighborsAlive === 3 || neighborsAlive === -1) return {
                alive: true,
                color: ALIVE_COLOR
            };
            else return {
                alive: false,
                color: DEAD_COLOR
            };
        }
    }
);

var mooreNeighborhood = new cellularAutomaton.createNeighborhood(function () {
    var space = [];

    var size = {
        x: 100,
        y: 100
    };

    for(var i = 0; i < size.x; i++) {
        space.push([]);
        for(var j = 0; j < size.y; j++) {
            space[i].push(R.clone(lifeCell));
            space[i][j].init();
        }
    }

    // the good modulo (works for negative values also)
    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    // hexagonal neighboorhood
    for(i = 0; i < size.x; i++) {
        for(j = 0; j < size.y; j++) {
            // left and right neighbors
            space[i][j].neighbors.push(space[mod(i + 1, size.x)][mod(j, size.y)]);
            space[i][j].neighbors.push(space[mod(i - 1, size.x)][mod(j, size.y)]);

            // upper neighbors
            space[i][j].neighbors.push(space[mod(i + j%2 - 1, size.x)][mod(j + 1, size.y)]);
            space[i][j].neighbors.push(space[mod(i + j%2, size.x)][mod(j + 1, size.y)]);

            // lower neighbors
            space[i][j].neighbors.push(space[mod(i + j%2 - 1, size.x)][mod(j - 1, size.y)]);
            space[i][j].neighbors.push(space[mod(i + j%2, size.x)][mod(j - 1, size.y)]);
        }
    }

    return space;
});

var gameOfLife = new cellularAutomaton.createAutomat(mooreNeighborhood, lifeCell);

function print () {
    gameOfLife.applyFunc(function(cell) {
        console.log(cell.state);
    });
}

//print();

//gameOfLife.updateNeighbors();
//gameOfLife.updateCells();
//console.log("update");

//print();


exports.init = R.bind(gameOfLife.init, gameOfLife);

exports.evolve = R.bind(gameOfLife.evolve, gameOfLife);

exports.getState = function() {
    return gameOfLife.world.space;
};

exports.buttonClick = function (event) {
    gameOfLife.world.space[event.x][event.y].futureState.alive = true;
};



var measureTime = function (functionToExec, iterations) {
    var start = new Date();

    for(var i = 0; i < iterations; i++) {
        functionToExec();
    }

    var end = new Date();
    var diff = end.getTime() - start.getTime();

    console.log("Time to evaluate: ",diff);
    console.log("Time per execution: ",diff/iterations);
};

//measureTime(evolve, 10);
//gameOfLife.print();

