/**
 * Created by prawda on 02.07.2017.
 */
var R = require('ramda');
var Promise = require("bluebird");

exports.createAutomat = CellularAutomaton;
exports.createCell = Cell;
//exports.createNeighborhood = Neighborhood;


function Cell(initFunction, updateFunction) {

    this.neighbors = [];
    this.targetedBy = [];

    this.init = function () {
        this.state = initFunction();
        this.futureState = initFunction();
    };

    this.init();

    this.update = updateFunction;

    this.kill = function () {
        this.state = deadState;
        this.futureState = emptyState;
    }
}

// Constructor for Cellular Automaton
function CellularAutomaton(neighborhood, size) {
    var that = this;

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

    this.size = size;
    this.neighborhood = {};
    this.neighborhood.createSpace = neighborhood;

    this.init = function () {
        this.world = this.neighborhood.createSpace(this.size);

        this.applyFunc(function (cell) {
            cell.init();
        })
    };

    this.init();

    this.evolve = function () {
        this.applyFunc(function(cell) {
            cell.update();
        });
        this.updateState();
    };

    this.updateState = function () {
        this.applyFunc(function (cell) {
            cell.state = R.merge(cell.state, cell.futureState);
            //cell.state = cell.futureState; // in the past this was not merged and just overwritten
        });
    };
}
