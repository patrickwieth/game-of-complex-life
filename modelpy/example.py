import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np

# Initialisieren
mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
gameOfLife = ca.CellularAutomaton(mooreNeighborhood)

evolve = gameOfLife.evolve


def makeDecision(cell):
    if cell.state['species'] == 'empty':
        return {'action': "stay", 'value': 0}

    if cell.state['species'] == 'OnlyClone':
        return {'action': "clone", 'value': int(np.random.ranf() * 6)}

    if cell.state['species'] == 'CloneAndAttack':
        freeNeighbors = []
        for i in range(len(cell.neighbors)):
            if cell.neighbors[i].state['species'] != 'empty':
                if cell.neighbors[i].state['species'] != cell.state['species']:
                    if cell.neighbors[i].state['color'] != cell.state['color']:
                        #print("attack ",cell.state['species'],cell.neighbors[i].state['species'])
                        return {'action': 'fight', 'value': i}
            else:
                freeNeighbors.append(i)

        if (len(freeNeighbors) > 0):
            return {'action': "clone", 'value': freeNeighbors[int(np.random.ranf() * len(freeNeighbors))]}

        return {'action': "stay", 'value': 0}

    return {'action': "clone", 'value': int(np.random.ranf() * 6)}


def newSpecies(clientId, event):
    gameOfLife.decisions[event['species']] = []

    def func():
        return {'color': event['color'], 'species': event['species'], 'energy': 0}

    newCell = ca.Cell(func)
    gameOfLife.world['space'][event['position']['x']][event['position']['y']].state = newCell.state
    gameOfLife.world['space'][event['position']['x']][event['position']['y']].futureState = newCell.futureState


# ===================HIER BEGINNT DAS BEISPIEL================

gameOfLife.parameters = gameOfLife.world['parameters']
newSpecies(np.random.randint(0, 10), {'species': 'OnlyClone', 'color': 'Blue', 'position': {'x': 0, 'y': 0}})
newSpecies(np.random.randint(0, 10), {'species': 'CloneAndAttack', 'color': 'Green', 'position': {'x': 2, 'y': 2}})

def recursionDecision(level,output):
    if isinstance(level, list):
        for l in level:
            recursionDecision(l,output)
    elif str(type(level)) == "<class 'cellularAutomaton.Cell'>":  # TODO unschön
        try:
            output[level.state['species']].append(makeDecision(level))
        except:
            output[level.state['species']] = [makeDecision(level)]
    else:
        print('elemental cell should be an object, but is:' + str(type(level)))  # console.log in js

for _ in range(10):
    dec = {}
    recursionDecision(gameOfLife.world['space'],dec)
    """print(dec['empty'])
    try: print('OnlyClone',dec['OnlyClone'])
    except: pass
    try: print('CloneAndAttack',dec['CloneAndAttack'])
    except: pass"""
    gameOfLife.decisions = dec
    gameOfLife.setGoals()
    for j, n in enumerate(gameOfLife.world["space"]):
        for i, m in enumerate(n):
            print(
                '{:2d} {:2d} {:15s} {:5s} {:8s} {:2d}'.format(j, i, m.state['species'], m.state['color'], m.goal['action'], m.state['energy']))
            if m.goal['action'] == 'fight':
                pass
                #print(m.neighbors[int(m.goal['value'])].state['species'])
    dec = {}
    recursionDecision(gameOfLife.world['space'],dec)
    gameOfLife.decisions = dec
    evolve()

dec = {}
recursionDecision(gameOfLife.world['space'],dec)
"""try: print('OnlyClone',dec['OnlyClone'])
except: pass
try: print('CloneAndAttack',dec['CloneAndAttack'])
except: pass"""
gameOfLife.decisions = dec
gameOfLife.setGoals()
for j, n in enumerate(gameOfLife.world["space"]):
    for i, m in enumerate(n):
        print(
                '{:2d} {:2d} {:15s} {:5s} {:8s} {:2d}'.format(j, i, m.state['species'], m.state['color'], m.goal['action'], m.state['energy']))


# ===================Unbenutztes ist hier unten ========================

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

exit()
for i, m in enumerate(n):
            if m.state['species'] != 'empty':
                try:
                    dec[m.state['species']].append(makeDecision(m))
                except:
                    dec[m.state['species']] = [makeDecision(m)]