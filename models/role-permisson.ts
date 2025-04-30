import mongoose, { Schema, Document } from 'mongoose';

export interface IRolePermission extends Document{
    role_id: mongoose.Types.ObjectId;
    permission_id: mongoose.Types.ObjectId;
}

const RolePermissionSchema = new Schema<IRolePermission>({
    role_id: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
    },
    permission_id: {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        required: true,
    },
});

const RolePermission = mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);
export default RolePermission;