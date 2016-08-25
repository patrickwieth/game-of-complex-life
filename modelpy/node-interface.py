import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np

import sys, time, json


# simple JSON echo script
#for line in sys.stdin:
#	received_data = json.loads(line)


def functions_to_call(argument):
	switcher = {
	"init": "test",
	"killAll": "two",
	"newSpecies": "three",
	"setParameters": "zero",
	"registerDecisions": "one"
	}
	return switcher.get(argument, "nothing")

received_data = []


while True:
	for line in sys.stdin:
		received_data.append( json.loads(line) )

	#print(json.dumps({"result": functions_to_call(received_data['command'])}))
	print('{"bla": "bla"}')

	sys.stdout.flush()
	time.sleep(1)

try:
	print(json.dumps({"result": functions_to_call(received_data['command'])}))
except AttributeError:
	print("no command given with request", json.dumps(received_data))
# here should also be an except in case array (or null) is passed instead of object


mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
gameOfLife = ca.CellularAutomaton(mooreNeighborhood)


