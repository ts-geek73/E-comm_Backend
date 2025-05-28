import { model, Schema } from "mongoose";
import { IProductCart, IShoppingCart } from "../types"

export const ProductCart = new Schema<IProductCart>({
  product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  qty: { type: Number, required: true },
  notes: { type: String, required: false }
});

const ShoppingCartSchema = new Schema<IShoppingCart>({
  user_id: { type: String, required: true },
  products: { type: [ProductCart], required: true }, // ✅ correct way
})

const ShoppingCart = model<IShoppingCart>("ShoppingCart", ShoppingCartSchema);

export default ShoppingCart;
