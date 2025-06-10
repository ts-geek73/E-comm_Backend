import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { User, WhishList } from "../models";
import { Request, Response } from 'express';

const whishListController = {
    getWhishList: async (req: Request, res: Response) => {
        try {
            console.log("whishList APi ");
            const { user_id } = req.query

            if (!user_id) {
                return sendErrorResponse(res, {
                    message: "user_id is required"
                }, 400)
            }
            
            const user = await User.findOne({ userId: user_id })
            if(!user?._id){
                return sendErrorResponse(res, {
                    message: "User Not Found",
                    details : JSON.stringify(user)
                }, 404)
            }

            const wishlist = await WhishList.findOne({ user_id: user?._id }).lean();
            const productIds = wishlist?.products || [];
            return sendSuccessResponse(res, { productIds }, "send the whishlist products", 200)
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    addToWhishList: async (req: Request, res: Response) => {
        try {
            console.log("Add to Wishlist API");
            const { user_id } = req.query;
            const { productId, productIds } = req.body;

            if (!user_id) {
                return sendErrorResponse(res, { message: "user_id is required" }, 400);
            }
            const user = await User.findOne({ userId: user_id })
            const wishlist = await WhishList.findOne({ user_id: user?._id });

            // If wishlist doesn't exist, create it with the products
            if (!wishlist) {
                const newWishlist = await WhishList.create({
                    user_id: user?._id,
                    products: productIds || [productId],
                });


                return sendSuccessResponse(res, { products: newWishlist.products }, "Wishlist created and products added", 200);
            }

            // Convert current wishlist products to a Set
            const existingProducts = new Set(wishlist.products.map(p => p.toString()));

            // Combine incoming productId(s)
            const incomingIds = [
                ...(productIds || []),
                ...(productId ? [productId] : []),
            ];

            // Add only new product IDs
            const updatedProducts = [
                ...wishlist.products,
                ...incomingIds.filter(id => !existingProducts.has(id)),
            ];

            wishlist.products = updatedProducts;
            await wishlist.save();

            return sendSuccessResponse(res, { products: wishlist.products }, "Products added to wishlist", 200);
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    removeToWhishList: async (req: Request, res: Response) => {
        try {
            console.log("Remove from Wishlist API");
            const { user_id } = req.query;
            const { productId, productIds } = req.body;

            if (!user_id) {
                return sendErrorResponse(res, { message: "user_id is required" }, 400);
            }

            const user = await User.findOne({ userId: user_id })
            const wishlist = await WhishList.findOne({ user_id: user?._id });

            if (!wishlist) {
                return sendSuccessResponse(res, { products: [] }, "No wishlist found", 200);
            }

            const removeIds = new Set([
                ...(productIds || []),
                ...(productId ? [productId] : []),
            ]);

            wishlist.products = wishlist.products.filter(
                pid => !removeIds.has(pid.toString())
            );

            await wishlist.save();

            return sendSuccessResponse(res, { products: wishlist.products }, "Products removed from wishlist", 200);
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

}

export default whishListController