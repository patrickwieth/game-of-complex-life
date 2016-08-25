import pymongo, json

import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np

from bson import Binary, Code
from bson.json_util import dumps



# Initialisieren
mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
gameOfLife = ca.CellularAutomaton(mooreNeighborhood)




client = pymongo.MongoClient("localhost", 27017)

db = client.test


def store_dict(dict_obj):
	db.my_collection.insert_one(dict_obj).inserted_id	

def store_array(array, name):
	data_dict = {"name": name, "data": array.tolist()}
	db.my_collection.insert_one(data_dict).inserted_id	


gameArray = np.array([[3,2], [3,4], [5,6]])


dict_test = {"name": "state1", "a": [{"a": "a"},2,3]}

test = gameOfLife.state_dict()

#for x in np.nditer(test['world']['space'], ['refs_ok']):
#	print(x[0])

#print (test)

store_dict(test)

#store_array(gameArray, "gay")

#print(gameOfLife.world['space'][1][1])

#store_dict({"state": gameOfLife.world['space'], "name": "state1"})

def print_mongo():
	print(db.name)
	print(db.my_collection)
	for item in db.my_collection.find():
		print(item)


def read_state_from_mongo(name):
	bla = db.my_collection.find({"name": name})
	print(bla)

	print("ja sicher \n")

	for item in db.my_collection.find({"name": name}):
		print(item)

read_state_from_mongo("test")