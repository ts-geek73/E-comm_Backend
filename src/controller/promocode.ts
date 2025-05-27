import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { PromoCode } from "../models";
import { IPromoCode } from "../types";
import stripe from '../service/stripe'; // Your configured Stripe instance

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

      let stripeCoupon;
      if (type === "flat") {
        stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(amount * 100),
          currency: "inr",
          duration: "forever",
          name: code.toUpperCase().trim(),
          redeem_by: expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : undefined,
        });
      } else if (type === "percentage") {
        stripeCoupon = await stripe.coupons.create({
          percent_off: amount,
          duration: "forever",
          name: code.toUpperCase().trim(),
          redeem_by: expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : undefined,
        });
      } else {
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Invalid promo code type",
        }, 400);
      }

      // Save promo code in local DB with stripeCouponId for sync
      const promo = new PromoCode({
        code: code.toUpperCase().trim(),
        type,
        amount,
        expiryDate,
        stripeCouponId: stripeCoupon.id, // store Stripe coupon ID
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
      const { amount, codes, page = 1, limit = 12, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

      if (codes && amount) {
        const codeList = Array.isArray(codes) ? codes.map(c => c.toString().toUpperCase()) : [codes.toString().toUpperCase()];
        const promos = await PromoCode.find({ code: { $in: codeList } }).lean() as IPromoCode[];

        const amt = parseFloat(amount as string);
        if (isNaN(amt) || amt <= 0) {
          return sendErrorResponse(res, {
            message: "Invalid amount",
            details: "Amount must be a positive number",
          }, 400);
        }

        let totalDiscount: number = 0;
        const discountData: { discount: number, code: string , stripeId:string }[] = [];
        const invalidPromoCodes: { code: string, reason: string }[] = [];

        codeList.forEach(code => {
          const promo = promos.find(p => p.code.toUpperCase() === code);

          if (!promo) {
            invalidPromoCodes.push({ code, reason: "not found" });
            return;
          }

          if (promo.expiryDate && promo.expiryDate < new Date()) {
            invalidPromoCodes.push({ code, reason: "expired" });
            return;
          }

          const discount = promo.type === "flat"
            ? promo.amount
            : (promo.amount / 100) * amt;

          totalDiscount += discount;
          discountData.push({
            discount, code,
            stripeId: promo.stripeCouponId|| " "
          });
        });

        const finalAmount = Math.max(0, amt - totalDiscount);
        discountData.sort((a, b) => b.discount - a.discount);

        return sendSuccessResponse(res, {
          originalAmount: amt,
          discountData,
          totalDiscount,
          finalAmount,
          invalidPromoCodes,
        }, "Promo codes processed", 200);
      }

      // Fallback: Fetch promo list with pagination
      const skip = (Number(page) - 1) * Number(limit);
      const total = await PromoCode.countDocuments();
      const sortObj: any = { [sortField as string]: sortOrder === 'asc' ? 1 : -1 };

      const promos = await PromoCode.find()
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit));

      return sendSuccessResponse(res, {
        promos,
        total,
      }, "Promo codes retrieved successfully", 200);
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

      const existingPromo = await PromoCode.findById(id);
      if (!existingPromo) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Promo code not found",
        }, 404);
      }

      const shouldReplaceCoupon =
        updateData.amount !== undefined && updateData.amount !== existingPromo.amount ||
        updateData.type !== undefined && updateData.type !== existingPromo.type;

      let newStripeCouponId = existingPromo.stripeCouponId;

      if (shouldReplaceCoupon && existingPromo.stripeCouponId) {
        // Delete old coupon
        await stripe.coupons.del(existingPromo.stripeCouponId);

        // Create new coupon
        const newCoupon = await stripe.coupons.create({
          name: updateData.code || existingPromo.code,
          duration: 'once',
          percent_off: updateData.type === 'percentage' ? updateData.amount : undefined,
          amount_off: updateData.type === 'flat' ? Math.round(updateData.amount * 100) : undefined,
          currency: updateData.type === 'flat' ? 'inr' : undefined,
        });

        newStripeCouponId = newCoupon.id;
      }

      const updated = await PromoCode.findByIdAndUpdate(
        id,
        {
          ...updateData,
          stripeCouponId: newStripeCouponId,
        },
        { new: true }
      );

      if (!updated) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Promo code not found after update",
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

      // Find promo to get stripeCouponId
      const promoToDelete = await PromoCode.findById(id);
      if (!promoToDelete) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Promo code not found",
        }, 404);
      }

      // Delete coupon in Stripe if exists
      if (promoToDelete.stripeCouponId) {
        await stripe.coupons.del(promoToDelete.stripeCouponId);
      }

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
