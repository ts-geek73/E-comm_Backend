// models/Address.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IAddress, IAddressEntry } from '../types';

const AddressEntrySchema = new Schema<IAddressEntry>({
  address_name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  addressType: { type: String, enum: ['billing', 'shipping'], required: true },
});

const AddressSchema = new Schema<IAddress>(
  {
    email: { type: String, required: true, unique: true },
    addresses: [AddressEntrySchema],
  },
  { timestamps: true }
);

const Address = mongoose.model<IAddress>('Address', AddressSchema);
export default Address;
