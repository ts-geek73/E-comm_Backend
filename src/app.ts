import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import routes from './routres';
import path from 'path';

dotenv.config();

const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URL;

const app = express();

app.use(cors({
    origin: [
    process.env.NGROK_URL!,
    process.env.CLIENT_URL!
  ],
   credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Fix the path - use process.cwd() to get the project root
const uploadsPath = path.join(process.cwd(), 'public/uploads/products');
console.log('Uploads path:', uploadsPath); // Debug log

app.use(
  '/uploads/products',
  express.static(uploadsPath)
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint to verify path
app.get('/test-files', (req, res) => {
  const fs = require('fs');
  fs.readdir(uploadsPath, (err: any, files: any) => {
    if (err) {
      return res.status(500).json({ error: 'Cannot read directory', details: err, path: uploadsPath });
    }
    res.json({ 
      directory: uploadsPath,
      files: files,
      exists: fs.existsSync(uploadsPath)
    });
  });
});

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