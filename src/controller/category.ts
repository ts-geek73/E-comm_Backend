import { Request, Response } from 'express';
import { Category } from '../models';
import { sendErrorResponse, sendSuccessResponse } from '../functions/product';

const CategoryController = {
    getAllCategory : async (req:Request , res:Response)  =>{
        try {
            const categorys = await Category.find()
            return sendSuccessResponse(res,categorys,"Se3nd Category successfully",200)
        } catch (error) {
            
            // res.status(200).send("Done")
            return sendErrorResponse(res,"Internal server error",500)
        }
    }

};

export default CategoryController