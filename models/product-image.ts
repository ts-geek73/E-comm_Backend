import mongoose, { Schema, Document } from 'mongoose';

export interface IProductImage extends Document {
  productId: mongoose.Types.ObjectId; // Reference to the Product
  imageUrl: mongoose.Types.ObjectId[]; // Reference to the Image
}

const productImageSchema = new Schema<IProductImage>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  imageUrl: {
    type: Array(Schema.Types.ObjectId),
    ref: 'Image',
    required: true,
  },
});

const ProductImage = mongoose.model<IProductImage>('ProductImage', productImageSchema);

export default ProductImage;
