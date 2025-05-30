import mongoose, { Schema } from 'mongoose';
import { IUserInvoice } from '../types';

const UserInvoiceSchema = new Schema<IUserInvoice>(
    {
        email: { type: String, required: true },
        invoices: [{
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order',
                default: null,
            },
            invoice: {
                type: String,
                required: true,
            }
        }]

    },
    { timestamps: true }
);

const UserInvoice = mongoose.model<IUserInvoice>('UserInvoice', UserInvoiceSchema);

export default UserInvoice;
