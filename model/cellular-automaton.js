
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

function Cell(initFunction, updateFunction) {

    this.neighbors = [];
    this.targetedBy = [];

    this.update = updateFunction;

    this.init = function() {
        this.state = initFunction();
        this.futureState = initFunction();
        this.state.makeDecision = updateFunction;
        this.state.getNeighbors = function () {
            return this.neighbors;
        }
    };

    this.init();

    this.makeDecision = function () {
        this.goal = this.state.makeDecision();
    };
}

function Neighborhood(createSpace) {
    this.createSpace = createSpace;
}

// Constructor for Cellular Automaton
function CellularAutomaton(neighborhood, cell) {

    this.applyFunc = function(f) {

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

    this.init = function() {
        this.world = {};
        this.world.metric = neighborhood;
        this.world = this.world.metric.createSpace();

        this.applyFunc(function(cell) {
            cell.init();
        })
    };

    this.updateCells = function () {

        this.applyFunc(function(cell) {
            cell.futureState = cell.update();
        });
    };

    this.realizeUpdate = function () {

        this.applyFunc(function(cell) {
            cell.state = R.merge(cell.state, cell.futureState);
            //cell.state = cell.futureState;
        });
    };

    this.evolve = function () {
        this.realizeUpdate();
        this.updateCells();
    };

    this.evolve2 = function () {

        this.applyFunc(function(cell) {
            if(!isPassive(cell))
                cell.makeDecision();
        });

        this.registerActions();

        this.resolveActions();

        this.updateCells2();
    };

    this.updateCells2 = function() {
        this.applyFunc(function(cell) {

            cell.state = cell.futureState;
            cell.futureState = cell.state;
            cell.state.neighbors = cell.neighbors;
        });
    };

    this.resolveActions = function () {
        this.applyFunc(function(cell) {

                if (cell.state.type === 'wall') {
                    // wall cannot be targeted
                    cell.targetedBy = [];

                    cell.state.energy -= 1;
                    if(cell.state.energy === 0) {
                        cell.futureState = { type: 'empty' };
                    }
                }
                else if (cell.state.type === 'empty') {
                    resolveEmpty(cell);
                }
                else if (cell.goal.action === 'stay') {
                    // if fighters are there, cell dies
                    if (R.any(function (targeting) {
                            return targeting.goal.action === 'fight'
                        }, cell.targetedBy)) {
                        cell.futureState = {type: 'empty'};
                    }
                    else cell.targetedBy = [];

                }
                else if (cell.goal.action === 'fight') {
                    if (R.any(function (targeting) {
                            return targeting.goal.action === 'fight'
                        }, cell.targetedBy)) {
                        cell.futureState = {type: 'empty'};
                    }
                    else cell.targetedBy = [];
                }
                else if (cell.goal.action === 'move'){
                    resolveMove(cell);
                }
                else if (cell.goal.action === 'clone') {
                    // will the move be resolved? Then cell gets empty..
                    if(cell.neighbors[cell.goal.value].state.type === 'empty') {
                        cell.neighbors[cell.goal.value].futureState = cell.state;
                    }
                }

            })

    };

    function resolveEmpty(cell) {
        moveOrCloneInto(cell);
    }

    function resolveMove(cell) {
        if(cell.goal === 'resolved')
            cell.futureState = emptyState;
        else
            cell.futureState = cell.state;

    }

    function moveOrCloneInto(cell) {
        // filter all actions that move or clone into empty space
        var validActions = R.filter(function (targeting) {
            return targeting.goal.action === 'clone' || targeting.goal.action === 'move';
        }, cell.targetedBy);
        if(validActions.length > 0) {
            // pick one of these actions at random
            var pickedAction = validActions[Math.floor(Math.random()*validActions.length)];

            // if it is move, then remove the cell from its origin point
            if(pickedAction.goal.action === 'move') {
                pickedAction.futureState = emptyState;
                pickedAction.goal = 'resolved';
            }

            // copy targeting cell into future state of targeted cell
            cell.futureState = pickedAction.state;
            cell.targetedBy = [];

        }
        else {
            if(cell.futureState !== 'empty')            cell.futureState = cell.state;
        }
    }

    this.registerActions = function () {

        this.applyFunc(function(cell) {
            if(!isPassive(cell)) {
                var actionFn = {
                    move: registerTarget,
                    clone: registerTarget,
                    fight: registerTarget,
                    stay: stay,
                    wall: wall
                };
                (actionFn[cell.goal.action] || actionFn.stay)(cell);
            }
        });
    };

    function registerTarget(cell) {
        if(cell.goal.value >= 0 && cell.goal.value < cell.neighbors.length ) {
            cell.neighbors[cell.goal.value].targetedBy.push(cell);
        }
        else stay(cell);
    }

    function stay(cell) {

    }

    function wall(cell) {

    }

    function isPassive(cell) {
        return cell.state.type === 'wall' || cell.state.type === 'empty';
    }

    this.init();
}

var emptyState = {
    color: 'white',
    type: 'empty',
    energy: 0,
    makeDecision: function() {}
};