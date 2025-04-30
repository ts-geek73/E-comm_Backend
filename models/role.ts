import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: 'No description provided',
  },
});
const Role = mongoose.model<IRole>('Role', roleSchema);
export default Role;
