var Bluebird = require('bluebird');
var MongoClient = require('mongodb').MongoClient;
var dbName = "test";
var collectionName = "my_collection";

var url = 'mongodb://localhost:27017/'+dbName;

exports.connect = function() {
    return new Bluebird(function(resolve, reject) {
        MongoClient.connect(url, function(err, db) {
            if(err) reject(err);
            else {
                console.log("Connected correctly to server", url);
                resolve(db);
            }
        });
    });
};

exports.close = function(db) {
    db.close();
};

exports.getData = function(db) {
    return new Bluebird(function(resolve, reject) {
        var collection = db.collection(collectionName);

        collection.find({}).toArray(function(err, docs) {

            //console.log("Found the following records");
            //console.dir(docs);
            resolve(docs);
        });
    });
};


