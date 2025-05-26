import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { PromoCode } from "../models";
import { IPromoCode } from "../types";

const PromoCodeController = {
  createPromoCode: async (req: Request, res: Response) => {
    try {
      const { code, type, amount, expiryDate } = req.body;

      if (!code || !type || amount === undefined) {
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Code, type, and amount are required",
        }, 400);
      }

      const existing = await PromoCode.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        return sendErrorResponse(res, {
          message: "Conflict",
          details: "Promo code already exists",
        }, 400);
      }

      const promo = new PromoCode({
        code: code.toUpperCase().trim(),
        type,
        amount,
        expiryDate,
      });

      await promo.save();
      return sendSuccessResponse(res, { promo }, "Promo code created successfully", 201);

    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to create promo code",
        details: error.message,
      }, 500);
    }
  },

  getPromoCodes: async (req: Request, res: Response) => {
    try {
      const { code, amount } = req.query;

      if (!code || !amount) {
        const promos = await PromoCode.find().sort({ createdAt: -1 });
        return sendSuccessResponse(res, { promos }, "Promo codes retrieved successfully", 200);
      }

      const promo = await PromoCode.findOne({ code:code.toString().toUpperCase()}) as IPromoCode;
      if (!promo) {
        return sendErrorResponse(res, {
          message: "Promo code not found",
          details: "Invalid promoCodeId",
        }, 404);
      }

      if (promo.expiryDate && promo.expiryDate < new Date()) {
        return sendErrorResponse(res, {
          message: "Promo code expired.",
          details: "Promo code cannot be applied",
        }, 400);
      }

      const amt = parseFloat(amount as string);
      if (isNaN(amt) || amt <= 0) {
        return sendErrorResponse(res, {
          message: "Invalid amount",
          details: "Amount must be a positive number",
        }, 400);
      }

      let discount = 0;
      if (promo.type === "flat") {
        discount = promo.amount;
      } else if (promo.type === "percentage") {
        discount = (promo.amount / 100) * amt;
      }

      const finalAmount = Math.max(0, amt - discount);

      return sendSuccessResponse(res, {
        originalAmount: amt,
        discount,
        finalAmount,
      }, "Promo code applied successfully", 200);

    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch or apply promo code",
        details: error.message,
      }, 500);
    }
  },

  updatePromoCode: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase().trim();
      }

      const updated = await PromoCode.findByIdAndUpdate(id, updateData, { new: true });

      if (!updated) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Promo code not found",
        }, 404);
      }

      return sendSuccessResponse(res, { promo: updated }, "Promo code updated successfully", 200);

    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to update promo code",
        details: error.message,
      }, 500);
    }
  },

  deletePromoCode: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await PromoCode.findByIdAndDelete(id);
      if (!deleted) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Promo code not found",
        }, 404);
      }

      return sendSuccessResponse(res, {}, "Promo code deleted successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to delete promo code",
        details: error.message,
      }, 500);
    }
  }
};

export default PromoCodeController;
