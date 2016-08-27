import numpy as np

emptyState = {'color': 'white', 'species': 'empty', 'energy': 0}
deadState = {'color': 'black', 'species': 'empty', 'energy': 1}

"""
 erlaubte actions fuer eine Zelle:
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
"""


class Cell(object):
    def init(self):
        self.state = self.initFunction()
        self.futureState = self.initFunction()

    def __init__(self, initFunction):
        self.initFunction = initFunction
        self.neighbors = []
        self.targetedBy = []
        self.init()
        self.goal = {'action': 'stay'}

    def setGoal(self, goal, params):
        # only set the goal if there is enough energy, else "stay" is the default action (should be least energy consuming also)
        if (params != None) & (self.state['energy'] >= params['energy'][goal['action']]):
            self.goal = goal
        else:
            self.goal = {'action': "stay", 'value': 0}

    def kill(self):
        self.state = deadState
        self.futureState = emptyState
        self.goal = {'action': 'stay', 'value': 0}


class Neighborhood(object):
    def __init__(self, createSpace):
        self.createSpace = createSpace


# Constructor for Cellular Automaton
class CellularAutomaton(object):
    def applyFunc(self, f):
        def recursion(level):
            if isinstance(level, list):
                for l in level:
                    recursion(l)
            elif str(type(level)) == "<class 'cellularAutomaton.Cell'>":  # TODO unschoen
                f(level)
            else:
                print('elemental cell should be an object, but is:' + str(type(level)))

        recursion(self.world['space'])

    def isPassive(self, cell):
        return (cell.state['species'] == 'wall') | (cell.state['species'] == 'empty')

    def isDestructible(self, cell):
        return (cell.state['species'] != 'wall') & (cell.state['species'] == 'empty')

    def initCell(self, cell):
        cell.init()

    def init(self):
        self.world = self.neighborhood.createSpace()
        self.applyFunc(self.initCell)
        self.decisions = {}

    def __init__(self, neighborhood):
        self.parameters = None
        self.neighborhood = neighborhood
        self.init()

    def evolve(self):
        self.resetTargetBy()
        self.setGoals()
        self.registerActions()
        self.resolveActions()
        self.updateCells()

    def resetTargetBy(self):
        def func(cell):
            cell.targetedBy = []

        self.applyFunc(func)

    def setGoals(self):
        speciesCounter = {}

        theDecisions = self.decisions
        theParameters = self.world['parameters']

        def func(cell):
            if self.isPassive(cell) == False:
                # add species to the speciesCounter if entry does not exist or count up by 1 if the species exists in the counter already
                try:
                    speciesCounter[cell.state['species']] = speciesCounter[cell.state['species']] + 1
                except:
                    speciesCounter[cell.state['species']] = 1

                # pick out the relevant list of decisions
                decisionsForThisSpecies = theDecisions[cell.state['species']]

                # check if there are decisions left (if not cell will do nothing)
                if len(decisionsForThisSpecies) > 0:
                    cell.setGoal(decisionsForThisSpecies[0], theParameters)
                    theDecisions[cell.state['species']] = theDecisions[cell.state['species']][1:]
                else:
                    print(
                        "no decisions left for species " + cell.state[
                            'species'] + " this happens if not enough decisions were sent to server...")  # console.log
                    cell.setGoal({'action': 'stay', 'value': 0}, theParameters)
            else:
                cell.setGoal({'action': 'stay', 'value': 0}, theParameters)

        self.applyFunc(func)

        #print("species counter: ", speciesCounter)  # console.log

    def registerActions(self):
        def func(cell):
            if self.isPassive(cell) == False:
                actionFn = {
                    'move': self.registerTarget,
                    'clone': self.registerTarget,
                    'fight': self.registerTarget,
                    'stay': self.registerNothing,
                    'wall': self.registerNothing
                }
                actionFn[cell.goal['action']](cell)  # | actionFn['stay'](cell))

        self.applyFunc(func)

    def registerTarget(self, cell):
        if (cell.goal['value'] >= 0) & (cell.goal['value'] < len(cell.neighbors)):
            cell.neighbors[int(cell.goal['value'])].targetedBy.append(cell)
        else:
            self.registerNothing(cell)

    def registerNothing(self, cell):
        return

    def resolveActions(self):
        theParameters = self.world['parameters']

        # first resolve all but fighting
        def func(cell):
            if cell.goal == 'resolved':
                pass
                #print("strange")
            elif cell.state['species'] == 'wall':
                self.resolveWall(cell)  # , theParameters['energy']['stay'])
            elif cell.state['species'] == 'empty':
                self.resolveEmpty(cell)
            elif (cell.goal['action'] == 'stay'):
                self.resolveStay(cell, theParameters['energy']['stay'])
            elif cell.goal['action'] == 'move':
                self.resolveMove(cell, theParameters['energy']['move'])
            elif cell.goal['action'] == 'clone':
                self.resolveClone(cell, theParameters['energy']['clone'])
            elif cell.goal['action'] == 'fight':
                self.resolveFight(cell, theParameters['energy']['fight'])

        self.applyFunc(func)

        # then resolve fighting
        def funcFight(cell):
            self.resolveBeingAttacked(cell)

        self.applyFunc(funcFight)

    def resolveWall(self, cell):
        # wall cannot be targeted
        cell.targetedBy = []

        if cell.state['energy'] == 0:
            cell.futureState = emptyState

    def resolveEmpty(self, cell):
        # filter all actions that move or clone into empty space
        validActions = []
        for t in cell.targetedBy:  # validActions = ramba.filter(func, cell.targetedBy)
            if (t.goal['action'] == 'clone') | (t.goal['action'] == 'move'):
                validActions.append(t)

        if len(validActions) > 0:
            # pick one of these actions at random
            pickedAction = validActions[int(np.random.ranf() * len(validActions))]

            # if it is move, then remove the cell from its origin point
            if pickedAction.goal['action'] == 'move':
                pickedAction.futureState = emptyState
                pickedAction.goal = 'resolved'

            # copy targeting cell into future state of targeted cell
            cell.futureState = pickedAction.state

    def resolveStay(self, cell, energyConsumed):
        # if fighters are there, cell dies
        def func(targeting):
            return targeting.goal['action'] == 'fight'

        # if ramba.any(func, cell.targetedBy):  # ramba
        if len(cell.targetedBy) < 1:
            cell.targetedBy = []
            cell.futureState['energy'] = cell.state['energy'] - energyConsumed
            return

        if np.vectorize(func)(np.array(cell.targetedBy)).any():
            cell.futureState = emptyState
        else:
            cell.targetedBy = []
            cell.futureState['energy'] = cell.state['energy'] - energyConsumed

    def resolveMove(self, cell, energyConsumed):
        if cell.goal == 'resolved':
            cell.futureState = emptyState
        else:
            cell.futureState = cell.state
            cell.futureState['energy'] = cell.state['energy'] - energyConsumed

    def resolveClone(self, cell, energyConsumed):
        if cell.goal == 'resolved':
            cell.futureState = cell.state
            cell.futureState['energy'] = cell.state['energy'] - energyConsumed
        else:
            cell.futureState = cell.state
            cell.futureState['energy'] = cell.state['energy'] - energyConsumed

    def resolveFight(self, cell, energyConsumed):
        cell.futureState['energy'] = cell.state['energy'] - energyConsumed

    def resolveBeingAttacked(self, cell):
        def func(targeting):
            try:
                return targeting.goal['action'] == 'fight'
            except:
                return False

        def isFought(cell):
            if len(cell.targetedBy) < 1:
                return False
            else:
                return np.vectorize(func)(np.array(cell.targetedBy)).any()
            # return ramba.any(func, cell.targetedBy)  # TODO ramba

        if (self.isDestructible(cell) == False) & (isFought(cell)):
            #cell.futureState = deadState
            cell.kill()

    def updateCells(self):
        theParameters = self.world['parameters']

        def addEnergy(cell):
            if theParameters['energy']['fromEmptyCells']:
                emptyNeighbors = 0

                for n in cell.neighbors:
                    if n.state['species'] == 'empty':
                        emptyNeighbors += 1

                cell.state['energy'] += emptyNeighbors * theParameters['energy']['fromEmptyCells']
            if theParameters['energy']['fromSun'] & True:  # sunShines()
                cell.state['energy'] += theParameters['energy']['fromSun']

        def func(cell):
            cell.state = {**cell.state, **cell.futureState}
            # cell.state = cell.futureState; // in the past this was not merged and just overwritten
            # also adjust energy
            addEnergy(cell)

        self.applyFunc(func)

    def state_dict(self):
        state = []

        for x in range(len(self.world['space'])):
            state.append([])

            for y in range(len(self.world['space'][x])):
                #print(self.world['space'][x][y].state)
                state[x].append(self.world['space'][x][y].state)
        

        return {"state": state, "step": 0, "name": "test"}