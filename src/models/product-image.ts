import mongoose, { Schema, Document } from 'mongoose';
import { IProductImage } from '../types';


const productImageSchema = new Schema<IProductImage>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  imageUrl: {
    type: Array(Schema.Types.ObjectId),
    ref: 'Image',
    required: true,
  },
});

const ProductImage = mongoose.model<IProductImage>('ProductImage', productImageSchema);

export default ProductImage;
