import mongoose, { Schema, Document } from 'mongoose';
import { IImage } from '../types';

const imageSchema = new Schema<IImage>({
  url : {
    type: String,
    required: true,
  },
  name : {
    type: String,
    required: true,
  },
});

const Image = mongoose.models.Image || mongoose.model<IImage>('Image', imageSchema);

export default Image;