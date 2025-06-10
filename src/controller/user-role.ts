import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { Role, RolePermission, User } from "../models";

const UserRoleController = {
  assignRolesToUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      console.log(`assign Roles To User`);


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

      if (validRoles.length !== roleIds.length) {
        console.log("dfail hetre");

        return sendErrorResponse(res, {
          message: "Validation Error",
          details: "Some role IDs are invalid",
        }, 400);
      }
      console.log("roleIds:=", roleIds);


      user.roles_id = roleIds;
      console.log('User RoleId:=', user.roles_id);
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

  getUserAccessDetails: async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;

      const includeRoles = true;

      // If no userId is provided, fetch all users
      if (!userId) {
        console.log(`Fetching access details for all users`);

        // Fetch all users with roles if requested
        const users = includeRoles
          ? await User.find().populate({ path: 'roles_id', select: 'name description' })
          : await User.find();

        // Build response for each user
        const usersResponse = await Promise.all(users.map(async (user: any) => {
          const userData: any = {
            _id: user._id,
            name: user.name,
            email: user.email,
            userId: user.userId,
          };

          if (includeRoles) {
            userData.roles = user.roles_id;
          }

            const roleIds = user.roles_id?.map((role: any) => role._id);

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

            const permissionsList = Array.from(permissionsMap.values());
            userData.permissions = permissionsList;
          

          return userData;
        }));

        return sendSuccessResponse(res, { users: usersResponse }, "All user access details retrieved successfully", 200);
      }

      // If userId is provided, fetch specific user
      console.log(`Fetching access details for userId: ${userId}`);

      const user = includeRoles
        ? await User.findOne({ userId }).populate({ path: 'roles_id', select: 'name description' })
        : await User.findOne({ userId });

      if (!user) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "User not found",
        }, 404);
      }

      const responseData: any = {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        }
      };

      if (includeRoles) {
        responseData.user.roles = user.roles_id;
      }

        const roleIds = user.roles_id?.map((role: any) => role._id);

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

        const permissionsList = Array.from(permissionsMap.values());
        responseData.permissions = permissionsList;
        responseData.permissionKeys = permissionsList.map(p => p.key);
      

      return sendSuccessResponse(res, responseData, "User access details retrieved successfully", 200);

    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch user access details",
        details: error.message,
      }, 500);
    }
  },


  removeRoleFromUser: async (req: Request, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      console.log(`remove Role From User`);


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
