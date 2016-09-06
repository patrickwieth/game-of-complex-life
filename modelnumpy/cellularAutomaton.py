import numpy as np

# important functions of the CellularAutomaton are:
# evolve()                                      #iteration
# setNewSpecies(i,spec,color='green',eng=0)     #add species at position i
# killSpecies(spec)                             #kill all cells of certain species
# setParameters(param)                          #set game parameters
# getState()                                    #get game state
# setState(state)                               #overwrite game state
# setDecisions(spec,dec)                        #set decisions for a species, use evolve after all decisions are set
# findSpecies()                                 #just a list of all the living species


# Constructor for Cellular Automaton
class CellularAutomaton(object):
    # Cells are now np.array, [id, species, color, energy, goal, value
    #                         0       1      2      3      4      5
    # futureStates [species, color, energy]
    # neighbors for all cells
    # secondneighbors for all cells
    # targetedby for all cells
    # a state consists of [species,color,energy,goal,value]
    emptyState = np.array(['empty', 'white', 0, 'stay', 0])
    deadState = np.array(['empty', 'black', 0, 'stay', 0])

    def __init__(self, initialState=None, param=None):
        if initialState == None:
            initialState = initializeHexagonal()
        if param == None:
            param = defaultParameters
        self.setState(initialState)
        self.setParameters(param)
        self.decisions = {}
        self.species = self.findSpecies()
        self.step = 0

    def evolve(self):
        self.species = self.findSpecies()  # build list of all living species
        self.cells[:, 3] = self.cells[:, 3].astype(np.float32)  # not sure where they turn into strings
        self.cells[:, 4] = 'stay'  # reset goals
        self.cells[:, 5] = 0  # reset goals
        self.cells[self.cells[:, 1] == 'empty', 2] = 'white'  # killed empty cells can now be white
        self.futureStates = np.copy(self.cells[:, 1:4])  # copy of current states for future states

        self.registerGoals()
        self.registerActions()
        self.futureStates = np.copy(self.cells[:, 1:4]) #copy current states for future states since energy was paid
        self.resolveActions()
        self.updateCells()
        self.step += 1
        # uncomment this to retain decisions
        self.decisions = {}

    def registerActions(self):
        targets = self.neighbors[np.arange(len(self.cells)), np.int_(self.cells[:, 5])]
        # first filter actions for those with enough energy, everyone else 'stays'
        self.cells[(self.cells[:, 4] == 'move') & (self.cells[:, 3] < self.parameters['energy']['move']), 4] = 'stay'
        self.cells[(self.cells[:, 4] == 'clone') & (self.cells[:, 3] < self.parameters['energy']['clone']), 4] = 'stay'
        self.cells[(self.cells[:, 4] == 'fight') & (self.cells[:, 3] < self.parameters['energy']['fight']), 4] = 'stay'

        # take away their energy
        self.cells[(self.cells[:, 4] == 'stay'), 3] -= self.parameters['energy']['stay']
        self.cells[(self.cells[:, 4] == 'move'), 3] -= self.parameters['energy']['move']
        self.cells[(self.cells[:, 4] == 'clone'), 3] -= self.parameters['energy']['clone']
        self.cells[(self.cells[:, 4] == 'fight'), 3] -= self.parameters['energy']['fight']

        # if the target is invalid, cancel their move. energy is still lost
        self.cells[self.cells[targets, 1] == 'wall', 4] = 'stay'
        self.cells[(self.cells[:, 4] == 'move') & (self.cells[targets, 1] != 'empty'), 4] = 'stay'
        self.cells[(self.cells[:, 4] == 'clone') & (self.cells[targets, 1] != 'empty'), 4] = 'stay'
        self.cells[(self.cells[:, 4] == 'fight') & (
            (self.cells[targets, 1] == 'empty') | (self.cells[targets, 1] == 'wall')), 4] = 'stay'

        # randomly reduce duplicate targets
        mask = np.arange(len(self.cells))[(self.cells[:, 4] == 'move') | (self.cells[:, 4] == 'clone')]
        for i in np.arange(len(self.cells)):
            while np.sum(targets[mask] == i) > 1:
                indi = mask[targets[mask] == i]
                rem = np.random.choice(indi, 1)
                self.cells[rem, 4] = 'stay'
                mask = np.arange(len(self.cells))[(self.cells[:, 4] == 'move') | (self.cells[:, 4] == 'clone')]

    def resolveActions(self):
        targets = self.neighbors[np.arange(len(self.cells)), np.int_(self.cells[:, 5])]

        # first resolve all but fighting
        # walls cant be targeted and walls with 0 or less energy become empty
        mask = (self.cells[:, 1] == 'wall') & (self.cells[:, 3] <= 0)
        self.futureStates[mask] = ['empty', 'white', 0.0]

        # moving cells leave an empty cell
        mask = self.cells[:, 4] == 'move'
        self.futureStates[targets[mask]] = np.copy(self.cells[mask, 1:4])
        self.futureStates[mask] = ['empty', 'white', 0.0]

        # cloning cells copy their state
        mask = self.cells[:, 4] == 'clone'
        self.futureStates[mask] = np.copy(self.cells[mask, 1:4])
        self.futureStates[targets[mask]] = np.copy(self.cells[mask, 1:4])

        # fights make cells empty
        mask = (self.cells[:, 4] == 'fight')
        self.futureStates[mask] = np.copy(self.cells[mask, 1:4])    # cells that stay
        mask = mask & (self.futureStates[targets][:,0] != 'empty') & (self.futureStates[targets][:,0] != 'wall')
        self.futureStates[targets[mask]] = ['empty', 'black', 0.0]


        # cells without energy will die here before they get energy, if your species is too active it's bad
        mask = ((self.cells[:, 1] != 'empty') & (self.cells[:, 3] <= 0))
        self.futureStates[mask] = ['empty', 'black', 0.0]
        mask = ((self.futureStates[:, 0] != 'empty') & (self.futureStates[:, 2] <= 0))
        self.futureStates[mask] = ['empty', 'black', 0.0]

    def updateCells(self):
        theParameters = self.parameters

        # depending on the order here, cells only get energy before or after update
        # since move and clone target energies were already set, we add energy afterwards for now
        self.cells[:, 1:4] = self.futureStates

        emptyNeighbors = self.cells[self.neighbors, 1] == 'empty'
        self.cells[:, 3] += np.sum(emptyNeighbors, axis=1) * self.parameters['energy']['fromEmptyCells'] + \
                            self.parameters['energy']['fromSun']
        # hmm, just setting empty and walls cells to 0 energy, bc why not
        self.cells[self.cells[:, 1] == 'empty', 3] = 0.0
        # this resets the goals, not necessary but easier to make tests for
        self.cells[:, 4] = 'stay'
        self.cells[:, 5] = 0
        self.cells[self.cells[:, 1] == 'wall', 3] = 0.0

    def findSpecies(self):
        return np.unique(self.cells[:, 1])

    # TODO non standard goals can be used to avoid energy loss so fix that
    def registerGoals(self):
        # decisions sind [action, value]
        speciesCounter = {}
        for s in self.species:
            if (s != 'empty') & (s != 'wall'):  # wall and empty 'stay' anyway
                speciesCounter[s] = np.sum(self.cells[:, 1] == s)
                # if someone messed up his decisions and they are longer or shorter than the count of his species we dont want errors, his problem
                try:
                    decisionsForThisSpecies = self.decisions[s]
                    l = int(min(np.sum(self.cells[:, 1] == s), len(decisionsForThisSpecies)))
                    self.cells[(self.cells[:, 1] == s), 4] = np.copy(decisionsForThisSpecies[:, 0])  # all actions set
                    self.cells[(self.cells[:, 1] == s), 5] = np.int_(np.copy(decisionsForThisSpecies[:, 1]))  # all targets set
                except:
                    #print('problem with decisions of ', s)
                    pass
        #TODO maybe make some verbosity stuff to print this, so it does not spam when training
        #print("species counter: ", speciesCounter)

    # =========Interface=================

    def setNewSpecies(self, i, spec, color='green', eng=2):
        self.cells[i, 1] = spec
        self.cells[i, 2] = color
        self.cells[i, 3] = eng
        self.cells[i, 4] = 'stay'
        self.cells[i, 5] = 0
        self.futureStates[i] = np.copy(self.cells[i, 1:4])

    def killSpecies(self, spec):
        self.futureStates[self.cells[:, 1] == spec] = ['empty', 'black', 0.0]

    def setParameters(self, param):
        self.parameters = param

    def getState(self):
        return {'cells': np.copy(self.cells), 'neighbors': np.copy(self.neighbors),
                'secondneighbors': np.copy(self.secondneighbors), 'futureStates': np.copy(self.futureStates),
                'shape': np.copy(self.shape), 'step': self.step}

    def setState(self, state):
        self.step = np.copy(state['step'])
        self.cells = np.copy(state['cells'])
        self.neighbors = np.copy(state['neighbors'])
        self.secondneighbors = np.copy(state['secondneighbors'])
        self.futureStates = np.copy(state['futureStates'])
        self.shape = np.copy(state['shape'])
        self.targetedBy = np.int_(np.zeros((len(self.cells), 6)))

    def setDecisions(self, species, decisions):
        self.decisions[species] = np.copy(decisions)


defaultParameters = {
    'energy': {'stay': 1, 'move': 2, 'fight': 4, 'clone': 10, 'wall': 1, 'fromEmptyCells': 1, 'fromSun': 0},
    'size' : {'x': 5, 'y': 5} 
    }


def initializeHexagonal(x=10, y=10):
    x = int(x);
    y = int(y)
    if (x < 3) | (y < 3):
        print("too small board, increasing size to minimum")
        x = min(3, x);
        y = min(3, y)
    cells = np.empty((x * y, 6), dtype='object')
    cells[:, 0] = np.arange(len(cells))
    cells[:, 1] = 'empty'
    cells[:, 2] = 'white'
    cells[:, 3] = 0
    cells[:, 4] = 'stay'
    cells[:, 5] = 0

    futureStates = np.copy(cells[:, 1:4])

    temp = np.arange(x * y)
    neighbors = np.zeros((x * y, 6))
    neighbors[:, 0] = (np.int_(temp / y) + 1) % x * y + temp % y
    neighbors[:, 1] = (np.int_(temp / y) - 1) % x * y + temp % y
    neighbors[:, 2] = ((np.int_(temp / y) + temp % y % 2 - 1 ) % x) * y + (temp % y + 1) % y
    neighbors[:, 3] = ((np.int_(temp / y) + temp % y % 2  ) % x) * y + (temp % y + 1) % y
    neighbors[:, 4] = ((np.int_(temp / y) + temp % y % 2 - 1 ) % x) * y + (temp % y - 1) % y
    neighbors[:, 5] = ((np.int_(temp / y) + temp % y % 2  ) % x) * y + (temp % y - 1) % y
    neighbors = np.int_(neighbors)

    temp = np.reshape(np.arange(x * y), (x,y))
    #TODO fix second neighbors
    secondneighbors = np.zeros((x * y, 12))
    secondneighbors[:, 0] = np.copy(np.roll(np.roll(temp, 1, axis=1), 1, axis=1).flatten())
    secondneighbors[:, 1] = np.copy(np.roll(np.roll(temp, 1, axis=0), 2, axis=1).flatten())
    secondneighbors[:, 2] = np.copy(np.roll(np.roll(temp, 2, axis=0), 1, axis=1).flatten())
    secondneighbors[:, 3] = np.copy(np.roll(np.roll(temp, 2, axis=0), 0, axis=1).flatten())
    secondneighbors[:, 4] = np.copy(np.roll(np.roll(temp, 2, axis=0), -1, axis=1).flatten())
    secondneighbors[:, 5] = np.copy(np.roll(np.roll(temp, 1, axis=0), -1, axis=1).flatten())
    secondneighbors[:, 6] = np.copy(np.roll(np.roll(temp, 0, axis=0), -2, axis=1).flatten())
    secondneighbors[:, 7] = np.copy(np.roll(np.roll(temp, -1, axis=0), -1, axis=1).flatten())
    secondneighbors[:, 8] = np.copy(np.roll(np.roll(temp, -2, axis=0), -1, axis=1).flatten())
    secondneighbors[:, 9] = np.copy(np.roll(np.roll(temp, -2, axis=0), 0, axis=1).flatten())
    secondneighbors[:, 10] = np.copy(np.roll(np.roll(temp, -2, axis=0), 1, axis=1).flatten())
    secondneighbors[:, 11] = np.copy(np.roll(np.roll(temp, -1, axis=0), 2, axis=1).flatten())
    secondneighbors = np.int_(secondneighbors)

    return {'cells': cells, 'neighbors': neighbors, 'secondneighbors': secondneighbors, 'futureStates': futureStates,
            'shape': np.shape(temp), 'step': 0}
