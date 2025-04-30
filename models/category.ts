import mongoose, { Document, Schema } from 'mongoose';

interface ICategory extends Document {
  name: string;
  parentCategory_id: mongoose.Types.ObjectId | null;
  imageUrl: mongoose.Types.ObjectId; 
}

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
