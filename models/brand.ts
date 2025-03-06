import mongoose, { Schema, Document } from 'mongoose';

interface Brand extends Document {
  name: string;
  logo: string;
  count: number;
  site?: string; 
}

const brandSchema = new Schema<Brand>({
  name: {
    type: String,
    required: true,
    unique: true, 
  },
  logo: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0, 
  },
  site: {
    type: String,
    required: false, 
  },
});

const Brand = mongoose.models.Brand || mongoose.model<Brand>('Brand', brandSchema);

export default Brand;