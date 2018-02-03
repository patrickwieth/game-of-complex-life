var R = require('ramda');
var Promise = require("bluebird");

exports.createAutomat = CellularAutomaton;
exports.createCell = Cell;
//exports.createNeighborhood = Neighborhood;

/*
 erlaubte actions f�r eine Zelle:

 {
 action: "move",
 value: 0 / 1 ... / 5 (neighbor index)
 }
 {
 action: "clone",
 value: 0 / 1 ... / 5 (neighbor index)
 }
 {
 action: "fight",
 value: 0 / 1 ... / 5 (neighbor index)
 }
 {
 action: "stay",
 value: ""
 }
 {
 action: "wall",
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

    this.setGoal = function (goal, params) {
        // only set the goal if there is enough energy, else "stay" is the default action (should be least energy consuming also)
        if(params && this.state.energy >= params.energy[goal.action]) {
            this.goal = goal;
        }
        else {
            this.goal =  {
                action: "stay",
                value: 0
            };
        }
    };

    this.kill = function () {
        this.state = deadState;
        this.futureState = emptyState;
    }
}
/*
function Neighborhood(createSpace) {
    this.createSpace = createSpace;
}
*/
// Constructor for Cellular Automaton
function CellularAutomaton(neighborhood) {
    var that = this;
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

    this.size = 100;
    this.neighborhood = {};
    this.neighborhood.createSpace = neighborhood;

    this.setSize = function(sizeXY) {
        this.size = sizeXY;
    };
    this.init = function () {

        this.world = this.neighborhood.createSpace(this.size);

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
    };

    this.setGoals = function () {
        var speciesCounter = {};

        var theDecisions = this.decisions;
        var theParameters = this.world.parameters;

        this.applyFunc(function (cell) {
            if (!isPassive(cell)) {
                // add species to the speciesCounter if entry does not exist or count up by 1 if the species exists in the counter already
                speciesCounter[cell.state.species] = speciesCounter[cell.state.species] ? speciesCounter[cell.state.species] + 1 : 1;

                // pick out the relevant list of decisions
                decisionsForThisSpecies = theDecisions[cell.state.species];

                // check if there are decisions left (if not cell will do nothing)
                if(decisionsForThisSpecies.length > 0) {
                    cell.setGoal(decisionsForThisSpecies[0], theParameters);
                    decisionsForThisSpecies.splice(0, 1);
                }
                else {
                    console.log("no decisions left for species "+cell.state.species+" this happens if not enough decisions were sent to server...");
                    cell.setGoal({}, 0);
                }
            }
        });

        console.log("species counter: ", speciesCounter);
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
        if (cell.goal.value >= 0 && cell.goal.value < cell.neighbors.length && cell.state.energy >= that.world.parameters.energy[cell.goal.action]) {
            cell.neighbors[cell.goal.value].targetedBy.push(cell);
        }
        else cell.goal.action = "stay";
    }

    function registerNothing(cell) {
    }

    this.resolveActions = function () {

        var theParameters = this.world.parameters;

        //first resolve all but fighting
        this.applyFunc(function (cell) {
            if (cell.state.species === 'wall') {
                resolveWall(cell, theParameters.energy.stay);
            }
            else if (cell.state.species === 'empty') {
                resolveEmpty(cell);
            }
            else if (cell.goal.action === 'stay') {
                resolveStay(cell, theParameters.energy.stay);
            }
            else if (cell.goal.action === 'move') {
                resolveMove(cell, theParameters.energy.move);
            }
            else if (cell.goal.action === 'clone') {
                resolveClone(cell, theParameters.energy.clone);
            }
            else if (cell.goal.action === 'fight') {
                resolveFight(cell, theParameters.energy.fight);
            }
        });

        // then resolve fighting
        this.applyFunc(function (cell) {
            resolveBeingAttacked(cell);
        });
    };

    function resolveWall(cell) {
        // wall cannot be targeted
        cell.targetedBy = [];

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
            cell.futureState.energy = 1;
        }
    }

    function resolveStay(cell, energyConsumed) {
        // if fighters are there, cell dies
        if (R.any(function (targeting) {
                return targeting.goal.action === 'fight'
            }, cell.targetedBy)) {
            cell.futureState = emptyState;
        }
        else {
            cell.targetedBy = [];
            cell.futureState.energy = cell.state.energy - energyConsumed;
        }
    }

    function resolveMove(cell, energyConsumed) {
        if (cell.goal === 'resolved')
            cell.futureState = emptyState;
        else {
            cell.futureState = cell.state;
            cell.futureState.energy = cell.state.energy - energyConsumed;
        }
    }

    function resolveClone(cell, energyConsumed) {
        if (cell.goal === 'resolved') {
            cell.futureState = cell.state;
            cell.futureState.energy = cell.state.energy - energyConsumed;
        }
        else
            cell.futureState = cell.state;
            //cell.futureState.energy = cell.state.energy - energyConsumed;
    }

    function resolveFight(cell, energyConsumed) {
        cell.futureState.energy = cell.state.energy - energyConsumed;
    }

    function resolveBeingAttacked(cell, energyConsumed) {
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
        var theParameters = this.world.parameters;

        function addEnergy(cell) {
            if(theParameters.energy.fromEmptyCells) {
                var emptyNeighbors = 0;
                cell.neighbors.forEach(function(neighbor) {
                    if(neighbor.state.species === 'empty') emptyNeighbors++;
                });
                cell.state.energy += emptyNeighbors * theParameters.energy.fromEmptyCells;
            }
            if(theParameters.energy.fromSun && true /* sunShines() */) {
                cell.state.energy += theParameters.energy.fromSun;
            }

            // death from exhaustion
            if(cell.futureState.energy < 0) {
                cell.futureState = emptyState;
            }
        }

        this.applyFunc(function (cell) {
            cell.state = R.merge(cell.state, cell.futureState);
            //cell.state = cell.futureState; // in the past this was not merged and just overwritten

            // also adjust energy
            addEnergy(cell);
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