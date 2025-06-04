import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  clerkId: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  roles_id: { type: Array(Schema.Types.ObjectId), ref: "Role" },
});


const User = mongoose.model<IUser>('User', userSchema);

export default User;
