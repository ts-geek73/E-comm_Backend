import { Request, Response } from 'express';
import { Category } from '../models';

const CategoryController = {
    getAllCategory : async (req:Request , res:Response)  =>{
        try {
            const categorys = await Category.find()
            
            res.status(200).send(categorys)
        } catch (error) {
            
            res.status(200).send("Done")
        }
    }

};

export default CategoryController