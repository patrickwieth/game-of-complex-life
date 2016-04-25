/**
 * Created by prawda on 14.01.2016.
 */

var R = require('ramda');

var cellularAutomaton = require('./cellular-automaton.js');

var CORPSE_COLOR = "black";
var PREDATOR_COLOR = "red";
var PREY_COLOR = "steelblue";
var DEAD_COLOR = "white";

function mapRandomStart(fn, array) {
    var startIndex = Math.floor(Math.random()*array.length);

    for(var i = 0; i <= array.length; i++) {
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

//var startIndex = Math.floor(Math.random()*this.neighbors.length);
//for(var i = 0; i <= this.neighbors.length; i++) {

//    var neighbor = this.neighbors[i+startIndex%this.neighbors.length];

var predatorCell = new cellularAutomaton.createCell( function init() {
        var huntRate = 0.3;

        return {
            color: PREDATOR_COLOR,
            alive: true,
            type: "predator"
        };
    },
    function update() {
        function goHunt(hunter) {
            var success = false;
            R.forEach(function (neighbor) {
                if (neighbor.state.alive && neighbor.state.type === 'prey') {
                    if (Math.random() > 0.3) {
                        neighbor.futureState.alive = true;
                        neighbor.futureState.type = 'predator';
                        neighbor.futureState.color = PREDATOR_COLOR;

                        success = true;
                    }
                }
            }, hunter.neighbors);
            return success;
        }

        if(this.state.alive === true) {
            var hunting = goHunt(this);

                if(hunting) return {
                    alive: true,
                    color: PREDATOR_COLOR,
                    type: 'predator'
                };
                else return {
                    alive: false,
                    color: CORPSE_COLOR,
                    type: 'predator'
                };
            }
            else {
                return {
                    alive: false,
                    color: CORPSE_COLOR,
                    type: 'prey'
                };
            }
        }
);

var lifeCell = new cellularAutomaton.createCell( function init () {
        var aliveRatio = 0.3;
        var rnd = Math.random();
        return {
            color: rnd < aliveRatio ? PREY_COLOR : DEAD_COLOR,
            alive: rnd < aliveRatio,
            type: "prey"
        };
    },
    function update() {

        function goHunt(hunter) {
            var success = false;
            R.forEach(function (neighbor) {
                if (neighbor.state.alive && neighbor.state.type === 'prey') {
                    if (Math.random() > 0.5) {
                        neighbor.futureState.alive = true;
                        neighbor.futureState.type = 'predator';
                        neighbor.futureState.color = PREDATOR_COLOR;

                        success = true;
                    }
                }
            }, hunter.neighbors);
            return success;
        }

        if(this.state.type === 'predator') {
            if(this.state.alive === true) {
                var hunting = goHunt(this);

                if(hunting) return {
                            alive: true,
                            color: PREDATOR_COLOR,
                            type: 'predator'
                };
                else return {
                    alive: false,
                    color: CORPSE_COLOR,
                    type: 'predator'
                };
            }
            else {
                return {
                    alive: false,
                    color: CORPSE_COLOR,
                    type: 'prey'
                };
            }


        }
        else {
            var neighborsAlive = 0;

            R.forEach(function(neighbor) {
                if(neighbor.state.alive && neighbor.state.type === 'prey') neighborsAlive++;
            }, this.neighbors);

            if(this.state.alive) {
                if(this.futureState.type === 'predator') {
                    return this.futureState;
                }
                else if(neighborsAlive > 6 || neighborsAlive < 2) return {
                    alive: false,
                    color: DEAD_COLOR,
                    type: "prey"
                };
                else return {
                    alive: true,
                    color: PREY_COLOR,
                    type: "prey"
                };
            }
            else {
                if(neighborsAlive === 3 || neighborsAlive === 2) return {
                    alive: true,
                    color: PREY_COLOR,
                    type: "prey"
                };
                else return {
                    alive: false,
                    color: DEAD_COLOR,
                    type: "prey"
                };
            }
        }
    }
);

var mooreNeighborhood = new cellularAutomaton.createNeighborhood(function () {
    var world = {};
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
            space[i][j].neighbors.push(space[mod(i + 1, size.x)][j]);
            space[i][j].neighbors.push(space[mod(i - 1, size.x)][j]);

            // upper neighbors
            space[i][j].neighbors.push(space[mod(i + j%2 - 1, size.x)][mod(j + 1, size.y)]);
            space[i][j].neighbors.push(space[mod(i + j%2, size.x)][mod(j + 1, size.y)]);

            // lower neighbors
            space[i][j].neighbors.push(space[mod(i + j%2 - 1, size.x)][mod(j - 1, size.y)]);
            space[i][j].neighbors.push(space[mod(i + j%2, size.x)][mod(j - 1, size.y)]);
        }
    }

    world.parameters = {
        huntRate: 0.3
    };

    world.space = space;

    return world;
});

var gameOfLife = new cellularAutomaton.createAutomat(mooreNeighborhood, lifeCell);

function print () {
    gameOfLife.applyFunc(function(cell) {
        console.log(cell.state);
    });
}


/*exports.init = function() {
    gameOfLife = new cellularAutomaton.createAutomat(mooreNeighborhood, lifeCell);
};*/
exports.init = R.bind(gameOfLife.init, gameOfLife);

exports.evolve = R.bind(gameOfLife.evolve, gameOfLife);

exports.getState = function() {
    return gameOfLife.world.space;
};

exports.buttonClick = function (event) {
    gameOfLife.world.space[event.x][event.y].futureState.alive = true;
    gameOfLife.world.space[event.x][event.y].futureState.type = "predator";
    gameOfLife.world.space[event.x][event.y].futureState.color = "red";
};

exports.setParameters = function (event) {
    gameOfLife.parameters.huntRate = event.huntRate
};