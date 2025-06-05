import express from 'express';
import { RoleController, UserRoleController, PermissionController } from '../controller';

const router = express.Router();

// ================== ROLE ROUTES ==================
router.post('/roles', RoleController.createRole);
router.get('/roles', RoleController.getRoles);
router.put('/roles/:id', RoleController.updateRole);
router.delete('/roles/:id', RoleController.deleteRole);

// ================== ROLE-PERMISSION ROUTES ==================
router.post('/roles/:id/permissions', RoleController.assignPermissionsToRole);
router.get('/roles/:id/permissions', RoleController.getRolePermissions);
// router.delete('/roles/:id/permissions/:permissionId', RoleController.removePermissionFromRole);

// ================== PERMISSION ROUTES ==================
router.post('/permissions', PermissionController.createPermission);
router.get('/permissions', PermissionController.getPermissions);
router.put('/permissions/:id', PermissionController.updatePermission);
router.delete('/permissions/:id', PermissionController.deletePermission);

// ================== USER-ROLE ROUTES ==================
router.post('/users/:userId/roles', UserRoleController.assignRolesToUser);
router.get('/users', UserRoleController.getUserAccessDetails);
router.delete('/users/:userId/roles/:roleId', UserRoleController.removeRoleFromUser);

export default router;
