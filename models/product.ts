import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  rating: number;
  features: string[];
  brand_id: mongoose.Types.ObjectId; 
  category_id: mongoose.Types.ObjectId;
  imageUrl: mongoose.Types.ObjectId;
  stock: number;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  brand_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand', 
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  features: {
    type: [String],
    default: [],
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  imageUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Images', 
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
});

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;