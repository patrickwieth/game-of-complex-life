import cellularAutomaton as ca
import numpy as np
import os, glob, sys
import util
from util import * #HexagonGenerator,SaveStatePicture,sort_nicely
sys.path.insert(0, '../')
from PyQt5.QtWidgets import QApplication
from simpleGUI import SimpleGUI
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
    filelist = glob.glob("pics/*")
    for f in filelist:
        os.remove(f)
    x = 16
    y = 16
    game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(x,y),param=ca.defaultParameters)

    game.setNewSpecies(nicePositions4(0,x,y), 'Clone', 'green', 30)
    game.setNewSpecies(nicePositions4(1,x,y), 'Move', 'blue', 3)
    game.setNewSpecies(nicePositions4(2,x,y), 'Move', 'blue', 3)
    game.setNewSpecies(nicePositions4(3,x,y), 'Move', 'blue', 3)
    

    saveStatePicture(game.getState(), "pics")

    for _ in range(30):
        state = game.getState()
        for s in game.findSpecies():
            game.setDecisions(s,makeDecision(state,s))
        #print(game.cells[game.cells[:,1] != 'empty',:4])
        game.evolve()
        saveStatePicture(state, "pics")

    #print(game.cells[game.cells[:,1] != 'empty',:4])

    app = QApplication(sys.argv)
    pics = sort_nicely(glob.glob("pics/*"))
    gui = SimpleGUI(pics)

    gui.show()
    sys.exit(app.exec_())

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
