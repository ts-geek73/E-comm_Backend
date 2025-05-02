import mongoose, { Schema, Document } from 'mongoose';
import { IPermission } from '../types';

const permissionSchema = new Schema<IPermission>({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    key:{
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default: 'No description provided',
    },
});

const Permission = mongoose.model<IPermission>('Permission', permissionSchema);

export default Permission;
