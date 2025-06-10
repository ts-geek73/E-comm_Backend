import express from 'express';
import { RoleController, UserRoleController, PermissionController } from '../controller';
import { userIdAndPermissionValidate } from '../middleware/productValidation';

const router = express.Router();

// ================== ROLE ROUTES ==================
router.post('/roles',
    userIdAndPermissionValidate(),
    RoleController.createRole
);
router.get('/roles', RoleController.getRoles);
router.put('/roles/:id',
    userIdAndPermissionValidate(),
    RoleController.updateRole
);
router.delete('/roles/:id',
    userIdAndPermissionValidate(),
    RoleController.deleteRole
);

// ================== ROLE-PERMISSION ROUTES ==================
router.post('/roles/:id/permissions', userIdAndPermissionValidate(), RoleController.assignPermissionsToRole);
router.get('/roles/:id/permissions', RoleController.getRolePermissions);

// ================== PERMISSION ROUTES ==================
router.post('/permissions',
    userIdAndPermissionValidate('permission.create'),
    PermissionController.createPermission
);

router.get('/permissions', PermissionController.getPermissions);
router.put('/permissions/:id',
    userIdAndPermissionValidate('permission.update'),
    PermissionController.updatePermission
);
router.delete('/permissions/:id',
    userIdAndPermissionValidate('permission.delete'),
    PermissionController.deletePermission
);

// ================== USER-ROLE ROUTES ==================
router.post('/users/:userId/roles',
    userIdAndPermissionValidate('roles.assign'),
    UserRoleController.assignRolesToUser);

router.get('/users', UserRoleController.getUserAccessDetails);
router.delete('/users/:userId/roles/:roleId',
    userIdAndPermissionValidate('roles.assign'),
    UserRoleController.removeRoleFromUser);

export default router;
