var goL = (function () {
    var goL = {};
    var size = {
        x: 100,
        y: 100
    };

    var space = [];

    for (var i = 0; i < size.x; i++) {
        space.push([]);
        for (var j = 0; j < size.y; j++) {
            space[i].push({
                state: {},
                neighbors: []
            });
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


    goL.getColor = function (d) { // get status of pth bit
        var x = d % size.x;
        var y = Math.floor(d / size.x);
        return space[x % size.x][y % size.y].state.color;
    };

    goL.put = function (x, y, z) { // set status of x,y cell to z
        space[x % size.x][y % size.y].state = z;
    };

    goL.reset = function () {
        console.log("reset pressed");
    };

    function handleClick(p) {
        d3.event.preventDefault();  // for right click: this prevents browser context menu

        var position = {
            x: p % size.x,
            y: Math.floor(p / size.x)
        };
        console.log(position);
        console.log(space[position.x][position.y]);

        socket.send({
            type: "rightClick",
            key: myKey,
            position: position
        });
    }


    var svg = d3.select("body")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", function () {
            svg.attr("transform", d3.event.transform)
        }))
        .append("g");

    var spacingH = 120;
    var spacingV = 104;
    var map = svg.selectAll("path").data(d3.range(0, size.x * size.y)).enter().append("svg:image")
        .attr('x', function(d) {
            var row = Math.floor(d / size.x);
            var col = d % size.x;

            return spacingH * col + (row%2 * spacingH/2);
        })
        .attr('y', function(d) {
            var row = Math.floor(d / size.x);
            var col = d % size.x;

            return spacingV * row;
        })
        //.attr('width', 120)
        //.attr('height', 140)
        .on("contextmenu", handleClick)
        .attr("xlink:href", "imgs/blacksmith.png");

    /*
    var map = d3.select("svg").selectAll("path").data(d3.range(0, size.x * size.y)).enter().append("path")
        .attr("d", function (d) {
            var spacingH = 10;
            var spacingV = 9;
            var row = Math.floor(d / size.x);
            var col = d % size.x;

            var points = [
                [col * spacingH + row % 2 * spacingH / 2, 3 + row * spacingV],
                [col * spacingH + row % 2 * spacingH / 2, 9 + row * spacingV],
                [5 + col * spacingH + row % 2 * spacingH / 2, 12 + row * spacingV],
                [10 + col * spacingH + row % 2 * spacingH / 2, 9 + row * spacingV],
                [10 + col * spacingH + row % 2 * spacingH / 2, 3 + row * spacingV],
                [5 + col * spacingH + row % 2 * spacingH / 2, row * spacingV]
            ];

            return "M " + points[0][0] + " " + points[0][1] + " " +
                "L " + points[1][0] + " " + points[1][1] + " " +
                "L " + points[2][0] + " " + points[2][1] + " " +
                "L " + points[3][0] + " " + points[3][1] + " " +
                "L " + points[4][0] + " " + points[4][1] + " " +
                "L " + points[5][0] + " " + points[5][1] + " " +
                "L " + points[0][0] + " " + points[0][1] + " ";
        })
        .attr("stroke", function (d) {
            return goL.getColor(d);
        })
        .attr("stroke-width", 1)
        .on("click", handleClick);
    */


    goL.setGrid = function (array) {  //set the initial bits

        hasChanged = function (n) {
            var x = n % size.x;
            var y = Math.floor(n / size.x);
            return space[x][y] !== array[x][y];
        };

        /*
        map.style("fill", function (d) {
            return goL.getColor(d);
        });
        */

        map.filter(hasChanged)
            .attr("xlink:href", function(d) {
            return "imgs/"+goL.getColor(d)+".png";
        });

        for(var i = 0; i < size.x; i++) {
            for(var j = 0; j < size.y; j++) {
                space[i][j].state = array[i][j];
            }
        }
    };

    goL.makeDecisions = function() {
        function isOwned(cell) {
            return cell.state.species === name;
        }

        var decisions = [];

        // go through all cells and make decision for own cells
        for(var i = 0; i < size.x; i++) {
            for(var j = 0; j < size.y; j++) {
                if(isOwned(space[i][j])) {
                    decisions.push(goL.decisionFunction(space[i][j]));
                }
            }
        }

        return decisions;
    };

    goL.decisionFunction = function(cell) {
        var freeNeighbors = [];

        for(i = 0; i < cell.neighbors.length; i++) {
            if(cell.neighbors[i].state.species !== 'empty') {
                if(cell.neighbors[i].state.color !== cell.state.color) {
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
    };

    return goL;
}());