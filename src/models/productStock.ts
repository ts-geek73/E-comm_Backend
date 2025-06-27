import mongoose, { Schema } from 'mongoose';
import { IStockEntry } from '../types';

const stockEntrySchema = new Schema<IStockEntry>({
  stock_name: {
    type: String,
    required: true,
  },
  description: String,
  products: [
    {
      product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  added_by: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const StockEntry = mongoose.model<IStockEntry>('StockEntry', stockEntrySchema);

export default StockEntry;
