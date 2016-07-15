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

/*
    goL.clearGrid = function () {
        for (var i = 0; i < size.x; i++) {
            for (var j = 0; j < size.y; j++) {
                space[i][j] = false;
            }
        }
    };
*/

    goL.get = function (d) { // get status of pth bit
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
        var position = {
            x: p % size.x,
            y: Math.floor(p / size.x)
        };
        console.log(position);

        var shittyColors = ["yellow", "blue"];
        var colorDice = ["steelblue", "red", "green", "teal", "orange", "purple", "pink", "brown", "cyan", "magenta", "grey"];

        name = newName;

        socket.send({
            type: "newSpecies",
            key: myKey,
            color: colorDice[Math.floor(Math.random() * colorDice.length)],
            species: name,
            position: position
        });
    }

    /* circles
     var rects = d3.select("svg").selectAll("circle").data(d3.range(0,bits)).enter().append("circle")
     .attr("cx",function(d){ return (d&127)*7;})
     .attr("cy",function(d){ return (d>>>7)*7;})
     .attr("r",3)
     //.attr("width",7).attr("height",7)     //exchange "circle" with "rect" 2 times and uncomment this to get rects
     .style("fill",function(d){ return goL.get(d)==1? "steelblue":"white";})
     .on("click",handleClick);*/

    var rects = d3.select("svg").selectAll("path").data(d3.range(0, size.x * size.y)).enter().append("path")
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
            return goL.get(d);
        })
        .attr("stroke-width", 1)
        .on("click", handleClick);


    goL.setGrid = function (array) {  //set the initial bits
        /*
         var changedCells = [];

         for(var i = 0; i < size.x; i++) {
         for(var j = 0; j < size.y; j++) {
         if(space[i][j] !== array[i][j]) {
         changedCells.push(Math.floor(i*size.y)+j%size.x);
         }
         }
         }
         */

        rects.style("fill", function (d) {
            return goL.get(d);
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