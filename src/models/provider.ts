import { Schema, model, Document } from 'mongoose';
import{ IUserProvider , UserProvider } from '../types';
// Enum to define types of user providers


const userSchema = new Schema<IUserProvider>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  provider: {
    type: String,
    enum: Object.values(UserProvider),
    required: true
  },
  authKey: { type: String },

});

const User = model<IUserProvider>('User', userSchema);

export { User, IUserProvider, UserProvider };
