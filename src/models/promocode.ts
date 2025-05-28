import mongoose, { Schema, Document } from "mongoose";
import { IPromoCode } from "../types";

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["flat", "percentage"], required: true },
    amount: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    stripeCouponId: { type: String, default: null },
  },
  { timestamps: true }
);

const PromoCode = mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);
export default PromoCode;
