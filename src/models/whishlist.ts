import mongoose, { Schema, Document, Types } from "mongoose";
import { IWishlist } from "../types";

const WishlistSchema = new Schema<IWishlist>({
  user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
}, {
  timestamps: true,
});

const Wishlist = mongoose.model<IWishlist>("Wishlist", WishlistSchema);

export default Wishlist;
