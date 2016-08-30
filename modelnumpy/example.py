import cellularAutomaton as ca
import numpy as np

# GUIDE
# initilize game object with some initialState, e.g. cellularAutomaton.initializeHexagonal(), and some parameters, e.g. cellularAutomaton.defaultParameters
# add your species with game.setNewSpecies(index, name, color, energy), only index and name are really needed
# now the iterations start
#       1. get the game state, it's a dict with {cells, neighbors, secondneighbors, futureStates, shape}
#       2. make your decisions for your species by filtering cells, neighbors is an array that can be used as a mask for the cells array
#       2.2 register your decisions with setDecisions(name, ['actions',targetvalue] where actions are valid actions and targetvalues are the neighbor index
#       3. call evolve()


# Initialisieren
def main():
    game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(5,5),param=ca.defaultParameters)

    game.setNewSpecies(3, 'Move', 'blue', 3)
    game.setNewSpecies(11, 'Clone', 'grey', 5)

    for _ in range(10):
        state = game.getState()
        for s in game.findSpecies():
            game.setDecisions(s,makeDecision(state,s))
        print(game.cells[game.cells[:,1] != 'empty',:4])
        game.evolve()

    print(game.cells[game.cells[:,1] != 'empty',:4])
    exit()

# this is not how you have to make your decisions
# this is just some simple function that makes decisions for species 'Move' and 'Clone'
def makeDecision(state, spec):
    mask = state['cells'][:, 1] == spec
    N = np.sum(mask)
    if N < 1:
        return np.array([])
    dec = np.empty((N, 2),dtype=object)
    dec[:, 0] = 'stay'
    dec[:, 1] = 0
    cells = state['cells'][mask]
    neighbors = state['cells'][np.int_(state['neighbors'][mask])]
    secondneighbors = state['cells'][np.int_(state['secondneighbors'][mask])]

    if spec == 'Move':
        dec[:,0] = 'move'
        dec[:,1] = np.random.randint(0,len(neighbors[0]),N)

    if spec == 'Clone':
        dec[:,0] = 'clone'
        dec[:,1] = np.random.randint(0,len(neighbors[0]),N)

    return dec

if __name__ == "__main__":
    main()