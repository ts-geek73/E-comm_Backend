import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv'
import userRoute from './routres/user'
import productRoute from './routres/product'
import './db'
import cors from 'cors'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

dotenv.config();

const port = process.env.PORT 
const app = express();


app.use(cors())
app.use(express.json())
app.get('/protected-endpoint', ClerkExpressWithAuth(), (req, res) => {
  res.json(req)
})

app.use("/", userRoute)
app.use("/product", productRoute)

// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//     res.status(401).send('Unauthenticated!');
//   });

app.listen(port, () => {
  console.log(`App running on ${port}`);
});