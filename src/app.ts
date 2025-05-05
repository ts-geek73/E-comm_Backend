import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import routes from './routres';



dotenv.config();

const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URL;

const app = express();

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    if (!uri) {
      console.error('MONGO_URL not found in environment variables.');
      return;
    }

    await mongoose.connect(uri);
    console.log('Mongoose connected to MongoDB!');


    app.get('/protected-endpoint', ClerkExpressWithAuth(), (req, res) => {
      res.json(req);
    });
    
    app.use('/', routes);

    app.listen(port, () => {
      console.log(`App running on port ${port}`);
    });
  } catch (err) {
    console.error('Mongoose connection error:', err);
  }
};



connectDB();
