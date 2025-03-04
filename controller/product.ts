import { Request, Response } from 'express';
import Product from '../models/product';

const productController = {

  createProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log("Backend Product create");
        const body = req.body;
        
        const { name, description, price, category, imageUrl, stock } = req.body;

        if(!name || !description || !price|| !category|| !imageUrl || !stock){
            return res.status(401).send("Missing the required Things");
        }

        if (typeof name !== 'string' || typeof description !== 'string' || typeof category !== 'string' || (imageUrl && typeof imageUrl !== 'string')) {
          return res.status(400).json({ message: 'Invalid data types.' });
        }
  
        if ( price < 0) {
          return res.status(400).json({ message: 'Invalid price.' });
        }
  
        if ( stock < 0) {
          return res.status(400).json({ message: 'Invalid stock.' });
        }

        const newProduct = await Product.insertOne(req.body)

      return res.status(200).json({ message: 'Product data stored successfully' });
    } catch (error: any) {
      console.error('Error storing user data:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },
  getAllProduct : async(req:Request, res:Response): Promise<Response> =>{
    try {

      const allProduct = await Product.find().sort()
      
      return res.status(200).json(allProduct)
    } catch (error) {
      
      return res.status(500).send("Server Error")
    }
  }

};

export default productController;
