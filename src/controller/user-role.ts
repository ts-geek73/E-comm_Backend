import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { User, Role, Permission, RolePermission } from "../models";
import mongoose from "mongoose";

const UserRoleController = {
  assignRolesToUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;

      if (!userId) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Missing userId param",
        }, 400);
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Role IDs array is required",
        }, 400);
      }

      const user = await User.findOne({ userId });
      if (!user) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "User not found",
        }, 404);
      }

      // Validate role IDs
      const validRoles = await Role.find({ _id: { $in: roleIds } });
      console.log("Valid:=",validRoles);
      
      if (validRoles.length !== roleIds.length) {
        console.log("dfail hetre");
        
        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Some role IDs are invalid",
        }, 400);
      }
      console.log("roleIds:=", roleIds);
      

      user.roles_id = roleIds;
      console.log('User RoleId:=',user.roles_id);
      await user.save();
      

      const updatedUser = await User.findOne({ userId }).populate('roles_id', 'name description');

      return sendSuccessResponse(res, {
        user: updatedUser,
        message: `${roleIds.length} roles assigned to user`
      }, "Roles assigned successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to assign roles",
        details: error.message,
      }, 500);
    }
  },

  getUserRoles: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await User.findOne({ userId }).populate('roles_id', 'name description');
      if (!user) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "User not found",
        }, 404);
      }

      return sendSuccessResponse(res, {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles_id,
        },
      }, "User roles retrieved successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch user roles",
        details: error.message,
      }, 500);
    }
  },

  getUserPermissions: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await User.findOne({ userId }).populate('roles_id');
      if (!user) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "User not found",
        }, 404);
      }

      const roleIds = user.roles_id && user.roles_id.map((role: any) => role._id);

      const rolePermissions = await RolePermission.find({
        role_id: { $in: roleIds }
      }).populate('permission_id', 'name key description');

      const permissionsMap = new Map();
      rolePermissions.forEach(rp => {
        const permission = rp.permission_id as any;
        if (permission && !permissionsMap.has(permission._id.toString())) {
          permissionsMap.set(permission._id.toString(), permission);
        }
      });

      const permissions = Array.from(permissionsMap.values());

      return sendSuccessResponse(res, {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        permissions,
        permissionKeys: permissions.map(p => p.key),
      }, "User permissions retrieved successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch user permissions",
        details: error.message,
      }, 500);
    }
  },

  removeRoleFromUser: async (req: Request, res: Response) => {
    try {
      const { userId, roleId } = req.params;

      const user = await User.findOne({ userId });
      if (!user) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "User not found",
        }, 404);
      }

      user.roles_id = user.roles_id && user.roles_id.filter(id => id.toString() !== roleId);
      await user.save();

      const updatedUser = await User.findOne({ userId }).populate('roles_id', 'name description');

      return sendSuccessResponse(res, {
        user: updatedUser,
      }, "Role removed from user successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to remove role from user",
        details: error.message,
      }, 500);
    }
  },
};

export default UserRoleController;
