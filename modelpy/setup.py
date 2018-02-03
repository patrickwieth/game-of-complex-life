import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np
import mongo

gameOfLife.parameters = gameOfLife.world['parameters']

# save state in mongoDB
