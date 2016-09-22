var Bluebird = require('bluebird');
var MongoClient = require('mongodb').MongoClient;
var dbName = "gocl";

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

exports.getData = function(db, collectionName) {
    return new Bluebird(function(resolve, reject) {
        var collection = db.collection(collectionName);

        collection.find({}).toArray(function(err, docs) {

            resolve(docs[0]);
        });
    });
};

exports.empty = function(db, collectionName) {
    return new Bluebird(function(resolve, reject) {
        var collection = db.collection(collectionName);

        collection.drop({}, function(err) {
            if(err) reject(err);
            resolve(db);
        });
    });
};
