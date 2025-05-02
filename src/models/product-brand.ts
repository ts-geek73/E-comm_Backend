import mongoose, { Schema, Document } from 'mongoose';
import { IProductBrand } from '../types';

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
