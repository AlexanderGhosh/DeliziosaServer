const { MongoClient } = require('mongodb');

class MongoConection {
    constructor() {
    this.client = new MongoClient(
        `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@maindata.0hsso.mongodb.net/ClickAndCollect?retryWrites=true&w=majority`, 
        { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect();
    this.databases = {};
    this.activeDB = '';
    this.collections = {};
    this.activeColl = '';
    }

    database(name) {
        this.databases[name] = this.client.db(name);
        this.activeDB = name;
    }

    collection(name) {
        this.collections[name] = this.getActiveDB().collection(name);
        this.activeColl = name;
    }

    async findAll() {
        let cursor = this.getActiveCollection().find({});
        return await cursor.toArray();
    }
    
    async findOne(query) {
        return await this.getActiveCollection().findOne(query);
    }
    
    async insert(data) {
        await this.getActiveCollection().insertOne(data);
    }

    close() {
        client.close();
    }

    getActiveCollection() {
        return this.collections[this.activeColl];
    }

    getActiveDB() {
        return this.databases[this.activeDB];
    }
}

module.exports = {
    MongoConection
  };
  