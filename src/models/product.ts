import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '../types';

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    default: 'Default Product Name',
  },
  short_description: {
    type: String,
    required: true,
    default: 'Default product description',
  },
  status: {
    type: Boolean,
    required: true,
    default: false,
  },
  long_description: {
    type: String,
    required: true,
    default: 'Default product description',
  },
  price: {
    type: Number,
    required: true,
  },

  image: {
    type: Schema.Types.ObjectId,
    ref: 'Image', 
    required: true,
    default: null, 
  },
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
