import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { Role, Permission, RolePermission } from "../models";
import mongoose from "mongoose";

const RoleController = {
  // Create a new role
  createRole: async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Role name is required",
        }, 400);
      }

      // Check if role already exists
      const existingRole = await Role.findOne({ name: name.trim() });
      if (existingRole) {
        return sendErrorResponse(res, {
          message: "Conflict",
          details: "Role already exists",
        }, 400);
      }

      const role = new Role({
        name: name.trim(),
        description: description || 'No description provided',
      });

      await role.save();

      return sendSuccessResponse(res, { role }, "Role created successfully", 201);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to create role",
        details: error.message,
      }, 500);
    }
  },

  // Get all roles
  getRoles: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Role.countDocuments();
      const sortObj: any = { [sortField as string]: sortOrder === 'asc' ? 1 : -1 };

      const roles = await Role.find()
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit));

      return sendSuccessResponse(res, {
        roles,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      }, "Roles retrieved successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch roles",
        details: error.message,
      }, 500);
    }
  },

  // Update a role
  updateRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid role ID format",
        }, 400);
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;

      const updatedRole = await Role.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedRole) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Role not found",
        }, 404);
      }

      return sendSuccessResponse(res, { role: updatedRole }, "Role updated successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to update role",
        details: error.message,
      }, 500);
    }
  },

  // Delete a role
  deleteRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid role ID format",
        }, 400);
      }

      // Check if role exists
      const role = await Role.findById(id);
      if (!role) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Role not found",
        }, 404);
      }

      // Delete all role permissions associated with this role
      await RolePermission.deleteMany({ role_id: id });

      // Delete the role
      await Role.findByIdAndDelete(id);

      return sendSuccessResponse(res, {}, "Role deleted successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to delete role",
        details: error.message,
      }, 500);
    }
  },

  // Assign permissions to a role
  assignPermissionsToRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid role ID format",
        }, 400);
      }

      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Permission IDs array is required",
        }, 400);
      }

      // Check if role exists
      const role = await Role.findById(id);
      if (!role) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Role not found",
        }, 404);
      }

      // Validate permission IDs
      const validPermissions = await Permission.find({
        _id: { $in: permissionIds }
      });

      if (validPermissions.length !== permissionIds.length) {
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Some permission IDs are invalid",
        }, 400);
      }

      // Remove existing permissions for this role
      await RolePermission.deleteMany({ role_id: id });

      // Create new role permissions
      const rolePermissions = permissionIds.map((permissionId: string) => ({
        role_id: id,
        permission_id: permissionId,
      }));

      await RolePermission.insertMany(rolePermissions);

      return sendSuccessResponse(res, { 
        message: `${permissionIds.length} permissions assigned to role` 
      }, "Permissions assigned successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to assign permissions",
        details: error.message,
      }, 500);
    }
  },

  // Get role permissions
  getRolePermissions: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid role ID format",
        }, 400);
      }

      const rolePermissions = await RolePermission.find({ role_id: id })
        .populate('permission_id', 'name key description')
        .populate('role_id', 'name description');

      const permissions = rolePermissions.map(rp => rp.permission_id);

      return sendSuccessResponse(res, {
        role: rolePermissions[0]?.role_id || null,
        permissions,
      }, "Role permissions retrieved successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch role permissions",
        details: error.message,
      }, 500);
    }
  },

  // Remove permission from role
  removePermissionFromRole: async (req: Request, res: Response) => {
    try {
      const { id, permissionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(permissionId)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid role or permission ID format",
        }, 400);
      }

      const deleted = await RolePermission.findOneAndDelete({
        role_id: id,
        permission_id: permissionId,
      });

      if (!deleted) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Role permission not found",
        }, 404);
      }

      return sendSuccessResponse(res, {}, "Permission removed from role successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to remove permission from role",
        details: error.message,
      }, 500);
    }
  },
};

export default RoleController;