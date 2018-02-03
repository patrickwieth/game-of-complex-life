/**
 * Created by prawda on 02.07.2017.
 */

var R = require('ramda');

var cellularAutomaton = require('./cellular-automaton-base.js');

var CORPSE_COLOR = "ruins";
var EMPTY_COLOR = "grass";

var deposits = ["water", "trees", "ore", "wind"];
var goods = ["iron", "steel", "wheat", "food", "wood", "lumber"];
var transportFactor = {
    'iron': 0.1,
    'steel': 0.1,
    'wheat': 0.1,
    'food': 0.1,
    'wood': 0.1,
    'lumber': 0.1
};

var normalBehavior = function () {
    var behavior = {
        'empty': function() {

        },
        'lumberjack': function() {
            if(this.trees >= 1) {
                this.trees -= 1;
                this.wood += 1;
            }
        },
        'mine': function() {

        },
        'blacksmith': function() {
            if(this.ore >= 1) {
                this.ore -= 1;
                this.iron += 1;
            }
        },
        'street': function() {
            function resourceFlow(A, B, transportCoefficient) {
                return (A - B) * transportCoefficient;
            }

            function iterateGoods(cellA, cellB) {
                return R.forEach(function (good) {
                    var flux = resourceFlow(cellA[good], cellB[good], transportFactor[good]);
                    console.log("flux: ", flux);    
                    cellA[good] -= flux;
                    cellB[good] += flux;
                }, goods);
            }

            R.forEach(iterateGoods(this), this.neighbors);


        }
    }
};

var emptyCell = new cellularAutomaton.createCell(
    function init() {
        return {
            color: EMPTY_COLOR,
            type: 'empty',

            ore: 0,
            trees: 0,
            water: 1,
            wind: 1,

            wood: 0,
            lumber: 0,
            iron: 0,
            steel: 0,
            wheat: 0,
            food: 0
        };
    },
    normalBehavior
);

var streetCell = function() {
    return new cellularAutomaton.createCell(
        function init(neighbors) {
            var streetNeighbors = R.reduce(function countStreetNeighbors() {
                
            }, neighbors);

            return {
                color: 'street',
                type: 'street',

                ore: 0,
                trees: 0,
                water: 1,
                wind: 1,

                wood: 0,
                lumber: 0,
                iron: 0,
                steel: 0,
                wheat: 0,
                food: 0
            };
        },
        normalBehavior
    );
};

var mooreNeighborhood = function (sizeXY) {
    var world = {};
    var space = [];

    var size = {
        x: sizeXY,
        y: sizeXY
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

    world.parameters = {

    };

    return world;
};

var gameOfLife = new cellularAutomaton.createAutomat(mooreNeighborhood);


function print() {
    gameOfLife.applyFunc(function (cell) {
        console.log(cell.state);
    });
}


exports.init = R.bind(gameOfLife.init, gameOfLife);

exports.evolve = R.bind(gameOfLife.evolve, gameOfLife);

exports.getState = function () {
    console.log(gameOfLife.world.space);
    return gameOfLife.world.space;
};

exports.setState = function (state) {

    //gameOfLife.world.space = R.addIndex(R.map)(R.addIndex(R.map)(R.merge, ), );

    for(var i = 0; i < gameOfLife.world.space.length; i++) {
        for(var j = 0; j < gameOfLife.world.space[i].length; j++) {
            gameOfLife.world.space[i][j] = R.merge(gameOfLife.world.space[i][j], state[i][j]);
        }
    }

    // gameOfLife.world.space = R.merge(gameOfLife.world.space, state); // this would be nice if it worked

    //gameOfLife.world.space = state; was this before
};

exports.killAll = function (species) {
    gameOfLife.applyFunc(function (cell) {
        if(cell.state.species == species) cell.kill();
    });
};

exports.handleClick = function (event) {
    console.log(event, gameOfLife.world.space);

    //gameOfLife.world.space[event.x][event.y] = streetCell(); 
    //gameOfLife.world.space[event.x][event.y].init();
    
};

exports.newSpecies = function (clientId, event) {

    gameOfLife.decisions[event.species] = [];

    var newCell = new cellularAutomaton.createCell(
        function init() {
            return {
                color: event.color,
                species: event.species,
                energy: 10
            };
        }
    );

    gameOfLife.world.space[event.position.x][event.position.y].state = newCell.state;
    gameOfLife.world.space[event.position.x][event.position.y].futureState = newCell.futureState;
};

exports.setParameters = function (event) {
    gameOfLife.parameters.someProperty = event.someProperty;
};
