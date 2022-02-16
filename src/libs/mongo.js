const { MongoClient } = require('mongodb');
const cli = require('nodemon/lib/cli');

let client = undefined;
let database = undefined;
let collection = undefined;

function Connect() {
    client = new MongoClient(
        `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@maindata.0hsso.mongodb.net/ClickAndCollect?retryWrites=true&w=majority`, 
        { useNewUrlParser: true, useUnifiedTopology: true });
    client.connect();
}

function OpenDatabase(database_n) {
    database = client.db(database_n);
}

function OpenCollection(collection_n) {
    collection = database.collection(collection_n);
}

function Close() {
    client.close();
}

async function FindAll() {
    let cursor = collection.find({});
    return await cursor.toArray();
}

async function FindOne(query) {
    return await collection.findOne(query);
}

async function Insert(data) {
    await collection.insertOne(data);
}

module.exports = {
    Connect,
    Close,
    OpenDatabase,
    OpenCollection,
    FindAll,
    FindOne,
    Insert
  };
  