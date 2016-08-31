import pymongo


client = pymongo.MongoClient("localhost", 27017)

db = client.gocl

def store_state(array, name, collection):
	data_dict = {"name": name, "data": array.tolist()}
	db[collection].insert_one(data_dict).inserted_id	

#def store_dict(dict_obj):
	#db.my_collection.insert_one(dict_obj).inserted_id	

def read_state(collection, name):
	return db[collection].find_one({"name": name})


