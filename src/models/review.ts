import mongoose, { Schema, Document } from 'mongoose';
import { IProductReview as IReview } from '../types';


const reviewShema = new Schema<IReview>({
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required: false, 
  },
  description: {
    type: String,
    required: false, 
  },
});

const Reviews = mongoose.model<IReview>('Reviews', reviewShema);

export default Reviews;