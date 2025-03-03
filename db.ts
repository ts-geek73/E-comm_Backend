
// const { MongoClient, ServerApiVersion } = require('mongodb');
// import dotenv from 'dotenv';
// dotenv.config()

// const uri = process.env.MONGO_URL;

// if (!uri) {
//   console.log("Url NOt Found");
// }
// else {

//   const client = new MongoClient(uri, {
//     serverApi: {
//       version: ServerApiVersion.v1,
//       strict: true,
//       deprecationErrors: true,
//     }
//   });

//   async function run() {
//     try {
//   await client.connect();
//       await client.db("admin").command({ ping: 1 });
//       console.log("You successfully connected to MongoDB!");
//     } finally {
//       console.log("closed");
      
//       await client.close();
//     }
//   }
//   run().catch(console.dir);
// }

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URL;

if (!uri) {
  console.error('MONGO_URL not found in environment variables.');
} else {
  mongoose
    .connect(uri)
    .then(() => console.log('Mongoose connected to MongoDB!'))
    .catch((err) => console.error('Mongoose connection error:', err));
}