import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';
import { ProductCart } from './shoppingCart';

const OrderSchema = new Schema<IOrder>(
    {
        email: { type: String, required: true },
        items: Array(ProductCart),
        amount: { type: Number, required: true },
        session_id: { type: String },


        shipping_address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            default: null,
        },

        billing_address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            default: null,
        },

        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'shipped', 'complete', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
