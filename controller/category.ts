import { Request, Response } from 'express';
import Category from '../models/category';

const CategoryController = {
    getAllCategory : async (req:Request , res:Response) : Promise<Response> =>{
        try {
            const categorys = await Category.find()
            
            return res.status(200).send(categorys)
        } catch (error) {
            
            return res.status(200).send("Done")
        }
    }

};

export default CategoryController