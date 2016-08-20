import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np

#Initialisieren
mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
gameOfLife = ca.CellularAutomaton(mooreNeighborhood)

init = gameOfLife.init
evolve = gameOfLife.evolve

def printAllStates():
    def printState(cell):
        print(cell.state)  # console.log
    gameOfLife.applyFunc(printState)

def registerDecisions(species, decisions):
    gameOfLife.decisions[species] = decisions

def getState():
    return gameOfLife.world['space']

def killAll(species):
    def func(cell):
        if cell.state.species == species:
            cell.kill()
    gameOfLife.applyFunc(func)

def makeDecision():
    return {'action': "clone", 'value': int(np.random.ranf()*6)}
    freeNeighbors = []
    """
    for(i = 0 i < len(this.neighbors) i++) {
        if(this.neighbors[i].state.species !== 'empty') {
            if(this.neighbors[i].state.color !== this.color) {
                return {
                    action: "fight",
                    value: i
        else {
            freeNeighbors.push(i)

    if(len(freeNeighbors) > 0) {
        return {
            action: "clone",
            value: freeNeighbors[Math.floor(Math.random()*len(freeNeighbors))]

    else {
        return {
            action: "stay",
            value: Math.floor(Math.random() * 6)
"""

def newSpecies(clientId, event):
    gameOfLife.decisions[event['species']] = []

    def func():
        return {'color': event['color'], 'species': event['species'], 'energy': 0}

    newCell = ca.Cell(func)
    gameOfLife.world['space'][event['position']['x']][event['position']['y']].state = newCell.state
    gameOfLife.world['space'][event['position']['x']][event['position']['y']].futureState = newCell.futureState


def setParameters(event):
    gameOfLife.parameters.someProperty = event.someProperty


def mapRandomStart(fn, array):
    startIndex = int(np.random.ranf() * len(array))

    for i in range(len(array)):
        pass
        # array[i+startIndex%len(array)] = R.merge(array[i+startIndex%len(array)], fn(array[i+startIndex%len(array)])


def shuffle(array):
    currentIndex = len(array)
    temporaryValue = 0
    randomIndex = 0

    # While there remain elements to shuffle...
    while (0 != currentIndex):
        # Pick a remaining element...
        randomIndex = int(np.random.ranf() * currentIndex)
        currentIndex -= 1

        # And swap it with the current element.
        temporaryValue = array[currentIndex]
        array[currentIndex] = array[randomIndex]
        array[randomIndex] = temporaryValue

    return array

#===================HIER BEGINNT DAS BEISPIEL================

gameOfLife.parameters = gameOfLife.world['parameters']
newSpecies(np.random.randint(0,10),{'species': 'test', 'color': 'Red', 'position':{'x': 0, 'y':0}})

for _ in range(3):
    dec = []
    for j,n in enumerate(gameOfLife.world["space"]):
        for i,m in enumerate(n):
            print(j,i,m.state['species'],m.goal,m.state)
            if m.state['species'] == 'test': dec.append(makeDecision())
    print(dec)
    registerDecisions('test', dec)
    evolve()
for j,n in enumerate(gameOfLife.world["space"]):
    for i,m in enumerate(n):
        print(j,i,m.state['species'],m.goal,m.state)

