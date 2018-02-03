import cellularAutomaton as ca
import numpy as np
import os, glob, sys
import util
from util import * #HexagonGenerator,SaveStatePicture,sort_nicely
sys.path.insert(0, '../')
from PyQt5.QtWidgets import QApplication
from simpleGUI2 import SimpleGUI2
from CorticalNetworkCell import CorticalNetworkCell

def update():
    state = game.getState()
    for s in game.findSpecies():
        game.setDecisions(s, makeDecision(state, s))
    # print(game.cells[game.cells[:,1] != 'empty',:4])
    game.evolve()
    saveStatePicture2(state, "pics/1.png")

def main():
    filelist = glob.glob("pics/*")
    for f in filelist:
        os.remove(f)
    x = 16
    y = 16



    game.setNewSpecies(nicePositions4(0,x,y), 'Clone', 'green', 30)
    game.setNewSpecies(nicePositions4(1,x,y), 'Move', 'blue', 3)
    game.setNewSpecies(nicePositions4(2,x,y), 'Move', 'blue', 3)
    game.setNewSpecies(nicePositions4(3,x,y), 'Move', 'blue', 3)
    game.setNewSpecies(nicePositions4(4, 6, 6), 'CNC_CELL', 'cyan', 3)

    saveStatePicture2(game.getState(), "pics/1.png")

    app = QApplication(sys.argv)
    gui = SimpleGUI2(None,"pics/1.png",update)

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

    if spec == 'CNC_CELL':
        dec=cnc.onNewIteration(state,N,cells,neighbors,secondneighbors,dec)

    return dec

if __name__ == "__main__":
    cnc = CorticalNetworkCell()
    game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(16, 16), param=ca.defaultParameters)
    main()
