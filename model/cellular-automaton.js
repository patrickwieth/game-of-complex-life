var R = require('ramda');
var Promise = require("bluebird");

exports.createAutomat = CellularAutomaton;
exports.createCell = Cell;
exports.createNeighborhood = Neighborhood;

/*
 erlaubte actions f�r eine Zelle:

 {
 action: "move"
 value: 0 / 1 ... / 5 (neighbor index)
 }
 {
 action: "clone"
 value: 0 / 1 ... / 5 (neighbor index)
 }
 {
 action: "fight"
 value: 0 / 1 ... / 5 (neighbor index)
 }
 {
 action: "stay"
 value: ""
 }
 {
 action: "wall"
 value: ""
 }
 */

function Cell(initFunction) {

    this.neighbors = [];
    this.targetedBy = [];

    this.init = function () {
        this.state = initFunction();
        this.futureState = initFunction();
    };

    this.init();

    this.setGoal = function (goal) {
        this.goal = goal;
    };

    this.kill = function () {
        this.state = deadState;
        this.futureState = emptyState;
    }
}

function Neighborhood(createSpace) {
    this.createSpace = createSpace;
}

// Constructor for Cellular Automaton
function CellularAutomaton(neighborhood) {

    this.decisions = {};

    this.applyFunc = function (f) {
        function recursion(level) {
            if (Array.isArray(level)) {
                R.forEach(recursion, level);
            }
            else if (typeof level === 'object') {
                f(level);
            }
            else console.log('elemental cell should be an object, but is:' + (typeof level));
        }
        recursion(this.world.space);
    };

    this.neighborhood = neighborhood;

    this.init = function () {

        this.world = this.neighborhood.createSpace();

        this.applyFunc(function (cell) {
            cell.init();
        })
    };

    this.init();

    this.evolve = function () {
        this.setGoals();
        this.registerActions();
        this.resolveActions();
        this.updateCells();

        console.log("cells updated");
    };

    this.setGoals = function () {
        var speciesCounter = {};

        var theDecisions = this.decisions;

        this.applyFunc(function (cell) {
            if (!isPassive(cell)) {

                speciesCounter[cell.state.species] = speciesCounter[cell.state.species] ? speciesCounter[cell.state.species] + 1 : 1;

                decisionsForThisSpecies = theDecisions[cell.state.species];

                // check if there are decisions left
                if(decisionsForThisSpecies.length > 0) {
                    cell.setGoal(decisionsForThisSpecies[0]);
                    decisionsForThisSpecies.splice(0, 1);
                }
                else {
                    //console.log("no decisions left for species "+cell.state.species);
                    cell.setGoal({action: "stay", value: 0});
                }
            }
        });

        console.log(speciesCounter);
    };

    this.registerActions = function () {
        this.applyFunc(function (cell) {
            if (!isPassive(cell)) {
                var actionFn = {
                    move: registerTarget,
                    clone: registerTarget,
                    fight: registerTarget,
                    stay: registerNothing,
                    wall: registerNothing
                };
                (actionFn[cell.goal.action] || actionFn.stay)(cell);
            }
        });
    };

    function registerTarget(cell) {
        if (cell.goal.value >= 0 && cell.goal.value < cell.neighbors.length) {
            cell.neighbors[cell.goal.value].targetedBy.push(cell);
        }
        else stay(cell);
    }

    function registerNothing(cell) {
    }

    this.resolveActions = function () {

        //first resolve all but fighting
        this.applyFunc(function (cell) {
            if (cell.state.species === 'wall') {
                resolveWall(cell);
            }
            else if (cell.state.species === 'empty') {
                resolveEmpty(cell);
            }
            else if (cell.goal.action === 'stay') {
                resolveStay(cell);
            }
            else if (cell.goal.action === 'move') {
                resolveMove(cell);
            }
            else if (cell.goal.action === 'clone') {
                resolveClone(cell);
            }
        });

        // then resolve fighting
        this.applyFunc(function (cell) {
            resolveFight(cell);
        });
    };

    function resolveWall(cell) {
        // wall cannot be targeted
        cell.targetedBy = [];

        cell.state.energy -= 1;
        if (cell.state.energy === 0) {
            cell.futureState = emptyState;
        }
    }

    function resolveEmpty(cell) {
        // filter all actions that move or clone into empty space
        var validActions = R.filter(function (targeting) {
            return targeting.goal.action === 'clone' || targeting.goal.action === 'move';
        }, cell.targetedBy);
        if (validActions.length > 0) {
            // pick one of these actions at random
            var pickedAction = validActions[Math.floor(Math.random() * validActions.length)];

            // if it is move, then remove the cell from its origin point
            if (pickedAction.goal.action === 'move') {
                pickedAction.futureState = emptyState;
                pickedAction.goal = 'resolved';
            }

            // copy targeting cell into future state of targeted cell
            cell.futureState = pickedAction.state;
        }
    }

    function resolveStay(cell) {
        // if fighters are there, cell dies
        if (R.any(function (targeting) {
                return targeting.goal.action === 'fight'
            }, cell.targetedBy)) {
            cell.futureState = emptyState;
        }
        else cell.targetedBy = [];
    }

    function resolveMove(cell) {
        if (cell.goal === 'resolved')
            cell.futureState = emptyState;
        else {
            cell.futureState = cell.state;
        }
    }

    function resolveClone(cell) {
        if (cell.goal === 'resolved') {
            cell.futureState = cell.state;
            cell.futureState.energy = 0;
        }
        else
            cell.futureState = cell.state;
    }

    function resolveFight(cell) {
        function isFought(cell) {
            return R.any(function (targeting) {
                return targeting.goal.action === 'fight'
            }, cell.targetedBy);
        }

        if(!isDestructible(cell) && isFought(cell)) {
            cell.futureState = deadState;
        }
    }

    this.updateCells = function () {
        this.applyFunc(function (cell) {

            cell.state = R.merge(cell.state, cell.futureState);
            //cell.state = cell.futureState;
        });
    };

    function isPassive(cell) {
        return cell.state.species === 'wall' || cell.state.species === 'empty';
    }

    function isDestructible(cell) {
        return cell.state.species !== 'wall' && cell.state.species === 'empty';
    }
}

var emptyState = {
    color: 'white',
    species: 'empty',
    energy: 0
};

var deadState = {
    color: 'black',
    species: 'empty',
    energy: 1
};