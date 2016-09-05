import pymongo


client = pymongo.MongoClient("localhost", 27017)

db = client.gocl

def set_last_step(collection, step):
	data_dict = {"name": "last_step", "data": step}
	db[collection].insert_one(data_dict).inserted_id		

def read_last_step(collection):
	return db[collection].find_one({"name": "last_step"})

def store_state(collection, name, array):
	data_dict = {"name": name, "data": array.tolist()}
	db[collection].insert_one(data_dict).inserted_id	

def read_state(collection, name):
	return db[collection].find_one({"name": name})


