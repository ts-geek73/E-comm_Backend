import mongoose, { Types ,Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  rating: number;
  features: string[];
  brand: Types.ObjectId; 
  category_id: Types.ObjectId;
  imageUrl: Types.ObjectId;
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
  brand: { 
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  imageUrl: {
    type: Schema.Types.ObjectId,
    ref: 'ImageURL', 
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;