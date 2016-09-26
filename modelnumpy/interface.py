import cellularAutomaton as ca
import numpy as np
import sys

import mongo


def create(name, size):
	game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(ca.defaultParameters['size']['x'],ca.defaultParameters['size']['y']), param=ca.defaultParameters)
	mongo.store_state(name, "step0", game.getState()['cells'])
	mongo.set_last_step(name, "step0")

def take_decisions_and_evolve(name, decisions):
	game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(ca.defaultParameters['size']['x'],ca.defaultParameters['size']['y']), param=ca.defaultParameters)

	last_step = mongo.read_last_step(name)	
	mongoread = mongo.read_state(name, last_step['data'])
	cellState = np.array(mongoread['data'])

	state = game.getState()
	
	def num(s):
		try:
			return int(s)
		except ValueError:
			return s

	# here should actually be something used like map or np.vectorize unfortunately does not work
	for x in range(len(cellState)):
		for y in range(len(cellState[x])):
			state['cells'][x][y] = num(cellState[x][y])

	game.setState(state)
	
	#for x in decisions
	#	game.setDecisions("fucksor", [["stay", 0], ["stay", 0]]) 

	game.evolve()

	step_string = "step"+str(game.getState()['step'])
	mongo.store_state(name, step_string, game.getState()['cells'])
	mongo.set_last_step(name, step_string)


def functions_to_call(fn):
	switcher = {
	"create": create,	
	"evolve": take_decisions_and_evolve,
	"nothing": "bla"
	}
	return switcher.get(fn, "nothing")


functions_to_call(sys.argv[1])(sys.argv[2], sys.argv[3])