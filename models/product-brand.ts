import mongoose, { Schema, Document } from 'mongoose';

export interface IProductBrand extends Document {
  productId: mongoose.Types.ObjectId; // Reference to the Product
  brands: mongoose.Types.ObjectId[]; // Reference to the Image
}

const ProductBrandSchema = new Schema<IProductBrand>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  brands: {
    type: Array(Schema.Types.ObjectId),
    ref: 'Brand',
    required: true,
  },
});

const ProductBrand = mongoose.model<IProductBrand>('ProductBrand', ProductBrandSchema);

export default ProductBrand;
