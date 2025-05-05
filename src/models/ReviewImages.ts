import mongoose, { Schema, Document } from 'mongoose';
import { IReviewImages } from '../types';

const ReviewImagesSchema = new Schema<IReviewImages>({
    product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
    user_id: {
    type: String,
    required: true,
  },
  review_images: {
    type: Array(Schema.Types.ObjectId),
    ref: 'Image',
    required: true,
  },
});

const ReviewImages = mongoose.model<IReviewImages>('ReviewImages', ReviewImagesSchema);

export default ReviewImages;
