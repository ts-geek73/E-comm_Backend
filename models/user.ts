import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the User document
export interface IUser extends Document {
  jwtToken: string;
  clerkId: string;
  userId: string;
  sessionId: string;
  username: string;
  email: string;
  provider: string;
  password ?: string
  roles?: string[];
  permissions?: string[];
  customClaim?: string;

}

const userSchema = new Schema<IUser>({
  jwtToken : { type: String, required: true },
  provider: { type: String, required: true },
  clerkId: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  roles: [{ type: String }],
  permissions: [{ type: String }],
  customClaim: { type: String },
});


const User = mongoose.model<IUser>('User', userSchema);

export default User;
