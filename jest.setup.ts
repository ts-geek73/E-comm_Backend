import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const mongod = MongoMemoryServer.create();

export const connect = async () => {
   const uri = await (await mongod).getUri();
   await mongoose.connect(uri);
}

jest.setTimeout(20000);

export const closeDatabase = async () => {
   await mongoose.connection.dropDatabase();
   await mongoose.connection.close();
   await (await mongod).stop();
}
export const clearDatabase = async () => {
   const collections = mongoose.connection.collections;
   for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
   }
}

import express from 'express';
import routes from './src/routres';

export const app = express();
app.use(express.json());
app.use('/', routes); 


// beforeAll(async () => {
//   const uri = (await mongod).getUri();
//   await mongoose.connect(uri);
// });

// afterEach(async () => {
//   const collections = await mongoose?.connection?.db?.collections();
//   for (let collection of collections!) {
//     await collection.deleteMany({});
//   }
// });

// afterAll(async () => {
//   await mongoose.disconnect();
//   await mongod.stop();
// });
