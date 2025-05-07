import mongoose, { Schema } from 'mongoose';
import { IBrand } from '../types';


const brandSchema = new Schema<IBrand>({
  name: {
    type: String,
    required: true,
    unique: true, 
  },
  logo: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    required: true,
  },
  site: {
    type: String,
    required: false, 
  },
});

const Brand = mongoose.models.Brand || mongoose.model<IBrand>('Brand', brandSchema);

export default Brand;