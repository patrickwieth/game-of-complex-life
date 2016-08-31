import cellularAutomaton as ca
import numpy as np

import mongo




def create(name, size):
	game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(ca.defaultParameters['size']['x'],ca.defaultParameters['size']['y']), param=ca.defaultParameters)
	mongo.store_state(game.getState()['cells'], "step0", name)
	

def take_decisions_and_evolve(name, decisions):
	game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(ca.defaultParameters['size']['x'],ca.defaultParameters['size']['y']), param=ca.defaultParameters)

	cellState = np.array(mongo.read_state(name, "step0")['data'])

	state = game.getState()

	
	def num(s):
		try:
			return int(s)
		except ValueError:
			return s

	def map2d(fn, arr):
		return map(lambda x: map(fn, x), arr)


	# here should actually be something used like map or np.vectorize unfortunately does not work
	for x in range(len(cellState)):
		for y in range(len(cellState[x])):
			state['cells'][x][y] = num(cellState[x][y])

	print(cellState[0].astype(int))

	game.setState(state)
	game.setDecisions("fucksor", [["stay", 0], ["stay", 0]])

	game.evolve()

	mongo.store_state(game.getState()['cells'], "step"+str(game.getState()['step']), name)

	


create("game_of_the_day", 5)

take_decisions_and_evolve("game_of_the_day", [])