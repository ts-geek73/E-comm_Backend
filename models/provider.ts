import { Schema, model, Document } from 'mongoose';

// Enum to define types of user providers
enum UserProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  NORMAL = 'normal'
}

interface IUser extends Document {
  name: string;
  email: string;
  password?: string; 
  provider: UserProvider; 
  authKey?: string; 
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
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

const User = model<IUser>('User', userSchema);

export { User, IUser, UserProvider };
