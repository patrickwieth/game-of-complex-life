(function () {
    var name = "none";
    var newName = "none";

    var LOCAL_STORAGE_DECISION_FN = 'decisionFn';

    window.name = name;
    window.newName = newName;

    enableEditor();

    function enableEditor() {
        var editor = ace.edit("editor");
        //editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/javascript");

        editor.getSession().on('change', function(e) {
            setLocalStorageItem(LOCAL_STORAGE_DECISION_FN, editor.getValue());
            setDecisionFunction(editor.getValue());
        });

        var decisionFn = getLocalStorageItem(LOCAL_STORAGE_DECISION_FN);

        if(decisionFn) {
            editor.setValue(decisionFn);
        }
    }


    function setDecisionFunction(fn) {
        // fn should be something like: '(function(){})'
        if(fn[0] !== '(' && fn[fn.length - 1] !== ')') {
            fn = "(" + fn + ")";
        }

        console.log("setDecisionFunction fn:", fn);

        try {
            var decisionFunction = eval(fn);
        }
        catch (bla) {
            console.log('DecisionFn could not be parsed', bla, 'fn:', fn);
            return;
        }



        // here a check should be run
        var testCell = {
            state: {
                color: "green",
                energy: 2,
                species: "test"
            },
            neighbors: [
                {
                    state: {
                        color: "green",
                        energy: 2,
                        species: "test"
                    }
                },
                {
                    state: {
                        color: "blue",
                        energy: 2,
                        species: "test2"
                    }
                },
                {
                    state: {
                        color: "white",
                        energy: 0,
                        species: "empty"
                    }
                },
                {
                    state: {
                        color: "white",
                        energy: 0,
                        species: "empty"
                    }
                },
                {
                    state: {
                        color: "brown",
                        energy: 2,
                        species: "wall"
                    }
                },
                {
                    state: {
                        color: "purple",
                        energy: 1,
                        species: "test3"
                    }
                }
            ]
        };

        var testResult = decisionFunction(testCell);

        if (typeof testResult === 'object' && testResult.action && testResult.value) {
            goL.decisionFunction = decisionFunction;
            console.log("new decision function set", decisionFunction);
        }
        else console.log("failed to set decision function");
    }

    function setName(string) {

        newName = string.value;
        /*socket.send({
         type: "setParameters",
         huntRate: name
         });*/
    }

    function newUniv() {
        console.log("newUniv()");

        socket.send("reset");
    }

    function startUniv() {
        console.log("startUniv()");

        if (d3.select("#startBtn").html() == "Start") {
            d3.select("#startBtn").html("Pause");
            socket.send("start");
        }
        else {
            d3.select("#startBtn").html("Start");
            socket.send("stop");
        }
    }

    var socket = io.connect();
    window.socket = socket;

    // get registered
    var myKey;
    socket.on('message', function (event) {
        if (typeof event === 'object') {
            if (typeof event.key === 'string') {
                myKey = event.key;
                window.myKey = myKey;
                console.log(myKey);
            }
        }
    });

    // state of the game updates
    socket.on('state', function (data) {
        goL.setGrid(data);

        var decisions = goL.makeDecisions();
        socket.send({type: "decisions", key: myKey, value: decisions});
    });

    function getLocalStorageItem(name) {
        var item = window.localStorage.getItem(name);;
        try {
            item = JSON.parse(item);
        } catch(e) {}
        return item;
    }

    function setLocalStorageItem(name, value) {
        window.localStorage.setItem(name, typeof value === 'object' ? JSON.stringify(value) : value );
    }
})();