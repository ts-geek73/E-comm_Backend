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
  },
  getLimitedProducts : async(req:Request , res:Response):Promise<Response> =>{
    try {
      const { start, length } = req.query;

      const startNum = parseInt(start as string, 10);
      const lengthNum = parseInt(length as string, 10);

      if (isNaN(startNum) || isNaN(lengthNum)) {
        return res.status(400).send("Invalid query parameters");
      }

      const limitedProducts = await Product.find().limit(lengthNum).skip(startNum)
      const lengthData = (await Product.find()).length
      return res.status(200).json({datas : limitedProducts , length:lengthData  })
    } catch (error) {
      return res.status(500).send("Internal Server Error")
    }
  },
  serachProduct: async(req:Request , res: Response):Promise<Response>=>{
    try {
      const { search } = req.query;
      if(!search){
        return res.status(400).send("Search Quaey Not Get")
      }

      const product = await Product.find({
        name: { $regex: search, $options: 'i' }
      });
      console.log("Product:= ",product);
      

      if(product.length === 0){
        console.log("Product not Found");
        
        const relatedProduct = await Product.find().limit(10)
        return res.status(201).json({msg:"Product Not Found",data:[], related : relatedProduct})
      }

      const relatedProduct = await Product.find({category:product[0].category , name: { $not: { $regex: search, $options: 'i' } }}).limit(10)
      // console.log("Related:= ", relatedProduct);
      
      return res.status(200).json({data: product , related : relatedProduct})
    } catch (error) {
      
      return res.status(500).send("Internal Serval Error")
    }
  },
  updateProduct: async(req:Request , res: Response) : Promise<Response>=>{
    try {
      return res.status(200).send("uiu")
    } catch (error) {
      return res.status(200).send("viudbd")
      
    }
  },
  deleteProduct: async(req:Request , res: Response) : Promise<Response>=>{
    try {
      return res.status(200).send("uiu")
    } catch (error) {
      return res.status(200).send("viudbd")
      
    }
  }
};

export default productController;
