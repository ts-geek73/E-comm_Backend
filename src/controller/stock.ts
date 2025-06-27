import { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../functions/product';
import { Product, StockEntry } from '../models';


const stockController = {
    addStock: async (req: Request, res: Response) => {
        try {
            const { stock_name, description, products, added_by } = req.body;

            if (!stock_name || !products || !added_by) {
                return sendErrorResponse(res, {
                    message: "stock_name, products, and added_by are required"
                }, 400);
            }

            if (!Array.isArray(products) || products.length === 0) {
                return sendErrorResponse(res, {
                    message: "Products array is required and cannot be empty"
                }, 400);
            }

            // Optional: Validate each product exists
            for (const p of products) {
                if (!p.product_id || !p.quantity) {
                    return sendErrorResponse(res, {
                        message: "Each product must have product_id and quantity"
                    }, 400);
                }

                const productExists = await Product.exists({ _id: p.product_id });
                if (!productExists) {
                    return sendErrorResponse(res, {
                        message: `Product not found for id: ${p.product_id}`
                    }, 404);
                }
            }

            const newStock = new StockEntry({
                stock_name,
                description,
                products,
                added_by,
            });

            await newStock.save();

            sendSuccessResponse(res, { stockEntry: newStock }, "Stock added successfully", 201);
        } catch (error) {
            console.error('Stock add error:', error);
            sendErrorResponse(res, {
                message: "Failed to add stock",
                details: error instanceof Error ? error.message : String(error),
            }, 500);
        }
    },

    getStockEntries: async (req: Request, res: Response) => {
        try {
            const stockEntries = await StockEntry.find()
                .populate('products.product_id', 'name price')
                .sort({ createdAt: -1 });

            sendSuccessResponse(res, { stockEntries }, "Stock entries fetched successfully", 200);
        } catch (error) {
            console.error('Fetch stock error:', error);
            sendErrorResponse(res, {
                message: "Failed to fetch stock entries",
                details: error instanceof Error ? error.message : String(error),
            }, 500);
        }
    },
};

export default stockController;
