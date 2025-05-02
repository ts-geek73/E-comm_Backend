import mongoose, { Document, Schema } from 'mongoose';
import { ICategory } from '../types';

const categorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentCategory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    imageUrl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      required: true,
    },
  }
);

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
