const { MongoClient } = require('mongodb');

class MongoConection {
    constructor() {
    this.client = new MongoClient(
        `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@maindata.0hsso.mongodb.net/ClickAndCollect?retryWrites=true&w=majority`, 
        { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect();
    this.db = {};
    this.activeCollection = undefined;
    }

    activate(db, collection) {
        this.database(db);
        this.collection(collection)
    }

    database(name) {
        this.db = this.client.db(name);
        this.activeDB = name;
    }

    collection(name) {
        this.activeCollection = this.db.collection(name);
    }

    async findAll() {
        let cursor = this.activeCollection.find({});
        return await cursor.toArray();
    }
    
    async findOne(query, cb) {
        return await this.activeCollection.findOne(query, {}, cb);
    }
    
    async insert(data) {
        await this.activeCollection.insertOne(data);
    }

    async update(query, values, cb) {
        await this.activeCollection.updateOne(query, values, cb);
    }

    async remove(query, cb) {
        await this.activeCollection.deleteOne(query, cb);
    }

    close() {
        client.close();
    }
}

module.exports = {
    MongoConection
  };
  