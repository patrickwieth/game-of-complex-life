import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np

import sys, json



# simple JSON echo script
for line in sys.stdin:
	received_data = json.loads(line)


#print(received_data)

def functions_to_call(argument):
	switcher = {
	"init": "test",
	"killAll": "two",
	"newSpecies": "three",
	"setParameters": "zero", 
	"registerDecisions": "one"
	}
	return switcher.get(argument, "nothing")

try:
	print(json.dumps({"result": functions_to_call(received_data['command'])}))
except AttributeError:
	print("no command given with request", json.dumps(received_data))
# here should also be an except in case array (or null) is passed instead of object


mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
gameOfLife = ca.CellularAutomaton(mooreNeighborhood)


