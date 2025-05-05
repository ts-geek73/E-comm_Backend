import { Schema, model, Document } from 'mongoose';
import{ IUserProvider , UserProvider as ListProviders } from '../types';


const userSchema = new Schema<IUserProvider>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  provider: {
    type: String,
    enum: Object.values(ListProviders),
    required: true
  },
  authKey: { type: String },

});

const UserProvider = model<IUserProvider>('UserProvider', userSchema);
export default UserProvider;

export { IUserProvider, ListProviders };
