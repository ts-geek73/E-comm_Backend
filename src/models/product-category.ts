import mongoose, { Schema, Document } from 'mongoose';
import { IProductCategoty } from '../types';


// export interface IProductCategoty extends Document {
//   productId: mongoose.Types.ObjectId; // Reference to the Product
//   categories: mongoose.Types.ObjectId[]; // Reference to the Image
// }

const ProductCategotySchema = new Schema<IProductCategoty>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  categories: {
    type: Array(Schema.Types.ObjectId),
    ref: 'Category',
    required: true,
  },
});

const ProductCategoty = mongoose.model<IProductCategoty>('ProductCategoty', ProductCategotySchema);

export default ProductCategoty;
