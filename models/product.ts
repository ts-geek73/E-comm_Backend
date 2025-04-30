import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  rating: number;
  features?: string[]; // Optional field for product features
  image: mongoose.Types.ObjectId | null; // Reference to a single image
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    default: 'Default Product Name',
  },
  description: {
    type: String,
    required: true,
    default: 'Default product description',
  },
  price: {
    type: Number,
    required: true,
  },
  features: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
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
