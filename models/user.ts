import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the User document
export interface IUser extends Document {
  clerkId: string;
  userId: string;
  sessionId: string;
  name: string;
  email: string;
  provider: string;
  password ?: string
  roles_id?: mongoose.Types.ObjectId[]; // Reference to the Role
  provider_key?: string;
}

const userSchema = new Schema<IUser>({
  
  provider: { type: String, required: true },
  provider_key: { type: String, required: true },
  clerkId: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  roles_id: [{ type: Array(Schema.Types.ObjectId), ref: "Role" }],
});


const User = mongoose.model<IUser>('User', userSchema);

export default User;
