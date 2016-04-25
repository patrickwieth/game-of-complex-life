
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

    this.update = updateFunction;

    this.init = function() {
        this.futureState = initFunction();
        this.state = initFunction();
    };

    this.init();
}

function Neighborhood(createSpace) {
    this.createSpace = createSpace;
}

// Constructor for Cellular Automaton
function CellularAutomaton(neighborhood, cell) {

    this.neighborhood = neighborhood;

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
            cell.state = cell.init();
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

    this.resolveActions = function () {
        this.applyFunc(function(cell) {
                if (cell.state.type === 'wall') {
                    // wall cannot be targeted
                    cell.targetedBy = [];
                }
                else if (cell.state.type === 'empty') {
                    // filter all actions that move or clone into empty space
                    var validActions = R.filter(function (targeting) {
                        return targeting.goal.action === 'clone' || targeting.goal.action === 'move';
                    }, cell.targetedBy);
                    // pick one of these actions at random
                    var pickedAction = validActions[Math.floor(Math.random()*validActions.length)];
                    // copy targeting cell into future state of targeted cell
                    cell.futureState = pickedAction.state;
                    // if it is move, then remove the cell from its origin point
                    if(pickedAction.goal.action === 'move') pickedAction.futureState.type === 'empty';
                }
                else if (cell.goal.action === 'stay') {
                    // if fighters are there, cell dies
                    if (R.any(function (targeting) {
                            return targeting.goal.action === 'fight'
                        }, cell.targetedBy)) {
                        cell.futureState.type = 'empty';
                    }
                    else cell.targetedBy = [];
                }
                else if (cell.goal.action === 'fight') {
                    if (R.any(function (targeting) {
                            return targeting.goal.action === 'fight'
                        }, cell.targetedBy)) {
                        cell.futureState.type = 'empty';
                    }
                    else cell.targetedBy = [];
                }
                else if (cell.goal.action === 'move'){
                    // will the move be resolved? Then cell gets empty..
                    if(cell.futureState.type === 'empty') {

                    }
                }
                else if (cell.goal.action === 'clone') {
                    // will the move be resolved? Then cell gets empty..
                    if(cell.futureState.type === 'empty') {

                    }
                }

            })

    };

    this.registerActions = function () {

        this.applyFunc(function(cell) {
            var actionFn = {
                move: registerTarget,
                clone: registerTarget,
                fight: registerTarget,
                stay: stay,
                wall: wall
            };

            (actionFn[cell.goal.action] || actionFn.stay)(cell);
        });
    };

    this.init();
}

function registerTarget(cell) {
    if(cell.goal.value >= 0 && cell.goal.value < cell.neighbors.length ) {
        cell.neighbor[cell.goal.value].targetedBy.push(cell);
    }
    else stayCell(cell);
}

function stay(cell) {

}

function wall(cell) {

}