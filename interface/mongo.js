var R = require('ramda');
var Bluebird = require('bluebird');
var MongoClient = require('mongodb').MongoClient;
var dbName = "gocl";
var url = 'mongodb://localhost:27017/'+dbName;

exports.connect = function(chain) {
    if(!chain) chain = {};

    return new Bluebird(function(resolve, reject) {
        MongoClient.connect(url, function(err, db) {
            if(err) reject(err);
            else {
                console.log("Connected correctly to server", url);
                chain.db = db;
                resolve(chain);
            }
        });
    });
};

exports.close = function(chain) {
    chain.db.close();
    return chain;
};

exports.getData = R.curry(function(collectionName, name, chain) {
    return new Bluebird(function(resolve, reject) {
        var collection = chain.db.collection(collectionName);

        collection.find({name: name}).toArray(function(err, docs) {
            if(err) reject(err);
            chain.data = docs[0].data;
            resolve(chain);
        });
    });
});

exports.saveData = R.curry(function(collectionName, name, data, chain) {
    return new Bluebird(function(resolve, reject) {
        var collection = chain.db.collection(collectionName);

        collection.updateOne(
            {"name": name},
            {$set: {data: data} },
            {upsert:true},
            function(err, docs) {
                if(err) reject(err);
                resolve(chain);
            });
    });
});

exports.empty = R.curry(function(collectionName, chain) {
    return new Bluebird(function(resolve, reject) {
        var collection = chain.db.collection(collectionName);

        collection.drop({}, function(err) {
            if(err) reject(err);
            resolve(chain);
        });
    });
});
