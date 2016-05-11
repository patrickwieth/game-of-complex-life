var goL = (function(){
    var goL ={};
    var size = {
                x: 100,
                y: 100
            };

    var space = [];

    for(var i = 0; i < size.x; i++) {
        space.push([]);
        for(var j = 0; j < size.y; j++) {
            space[i].push(false);
        }
    }


    goL.clearGrid = function(){
        for(var i = 0; i < size.x; i++) {
            for(var j = 0; j < size.y; j++) {
                space[i][j] = false;
            }
        }
    };


    goL.get = function(d){ // get status of pth bit
        var x = d%size.x;
        var y = Math.floor(d/size.x);
        return space[x%size.x][y%size.y];
    };

    goL.put = function(x, y, z){ // set status of pth bit to s
        space[x%size.x][y%size.y] = z;
    };

    goL.reset = function(){
        console.log("reset pressed");
    };

    function handleClick(p){
        var x = p%size.x;
        var y = Math.floor(p/size.x);
        console.log(x, y);

        var shittyColors =  ["yellow", "blue"];
        var colorDice = ["steelblue", "red", "green", "teal", "orange", "purple", "pink", "brown", "cyan", "magenta", "grey"];

        var position = {x: x, y: y, color: colorDice[Math.floor(Math.random()*colorDice.length)]};

        socket.send({
            type: "buttonClick",
            value: position
        });
    }

    goL.clearGrid();
    /* circles
    var rects = d3.select("svg").selectAll("circle").data(d3.range(0,bits)).enter().append("circle")
        .attr("cx",function(d){ return (d&127)*7;})
        .attr("cy",function(d){ return (d>>>7)*7;})
        .attr("r",3)
        //.attr("width",7).attr("height",7)     //exchange "circle" with "rect" 2 times and uncomment this to get rects
        .style("fill",function(d){ return goL.get(d)==1? "steelblue":"white";})
        .on("click",handleClick);*/

    var rects = d3.select("svg").selectAll("path").data(d3.range(0,size.x*size.y)).enter().append("path")
        .attr("d", function(d) {
            var spacingH = 10;
            var spacingV = 9;
            var row = Math.floor(d/size.x);
            var col = d%size.x;

            var points = [
                [col*spacingH + row%2*spacingH/2, 3+row*spacingV],
                [col*spacingH + row%2*spacingH/2, 9+row*spacingV],
                [5+col*spacingH + row%2*spacingH/2, 12+row*spacingV],
                [10+col*spacingH + row%2*spacingH/2, 9+row*spacingV],
                [10+col*spacingH + row%2*spacingH/2, 3+row*spacingV],
                [5+col*spacingH + row%2*spacingH/2, row*spacingV]
            ];

            return "M "+points[0][0]+" "+points[0][1]+" "+
            "L "+points[1][0]+" "+points[1][1]+" "+
            "L "+points[2][0]+" "+points[2][1]+" "+
            "L "+points[3][0]+" "+points[3][1]+" "+
            "L "+points[4][0]+" "+points[4][1]+" "+
            "L "+points[5][0]+" "+points[5][1]+" "+
            "L "+points[0][0]+" "+points[0][1]+" ";
        })
        .attr("stroke", function(d) {
            return goL.get(d);
        })
        .attr("stroke-width", 1)
        .on("click", handleClick);



    goL.setGrid = function(array){  //set the initial bits
        //goL.clearGrid();

        /*
        if(arguments.length > 0){
            d3.range(0,ar.length).forEach(function(y) {
                d3.range(0,ar[0].length)
                    .forEach(function(x) {
                        goL.put(x, y, ar[x][y]);
                    })
            });
        }*/
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
        rects.style("fill",function(d) {
            return goL.get(d);
        });

        space = array;
    };

    return goL;
}());