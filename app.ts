import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import userRoute from './routres/user';
import productRoute from './routres/product';
import categoryRoute from './routres/category';
import Product from './models/product'; 
import Brand from './models/brand';
import ImageURL from './models/Image';

interface ProductInterface {
  brand_id: any;
  name: string;
  description: string;
  price: number;
  brand: string; // Brand is a string here
  rating: number;
  features: string[];
  category_id?: string;
  parentCategory_id?: string;
  imageUrl: string; // imageUrl is a string here
  stock: number;
} 
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



    app.listen(port, () => {
      console.log(`App running on port ${port}`);
    });
  } catch (err) {
    console.error('Mongoose connection error:', err);
  }
};

app.get('/protected-endpoint', ClerkExpressWithAuth(), (req, res) => {
  res.json(req);
});

app.use('/', userRoute);
app.use('/product', productRoute);
app.use('/category', categoryRoute);

connectDB();

// REMINDER: FIX YOUR DATABASE!