import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { Permission, RolePermission } from "../models";
import mongoose from "mongoose";

const PermissionController = {
  // Create a new permission
  createPermission: async (req: Request, res: Response) => {
    try {
      const { name, key, description } = req.body;

      if (!name || !key) {
        return sendErrorResponse(res, {
          message: "Validation Error",  
          details: "Name and key are required",
        }, 400);
      }

      // Check if permission already exists
      const existingPermission = await Permission.findOne({
        $or: [
          { name: name.trim() },
          { key: key.trim() }
        ]
      });

      if (existingPermission) {
        return sendErrorResponse(res, {
          message: "Conflict",
          details: "Permission with this name or key already exists",
        }, 400);
      }

      const permission = new Permission({
        name: name.trim(),
        key: key.trim(),
        description: description || 'No description provided',
      });

      await permission.save();

      return sendSuccessResponse(res, { permission }, "Permission created successfully", 201);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to create permission",
        details: error.message,
      }, 500);
    }
  },

  // Get all permissions
  getPermissions: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Permission.countDocuments();
      const sortObj: any = { [sortField as string]: sortOrder === 'asc' ? 1 : -1 };

      const permissions = await Permission.find()
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit));

      return sendSuccessResponse(res, {
        permissions,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      }, "Permissions retrieved successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to fetch permissions",
        details: error.message,
      }, 500);
    }
  },

  // Update a permission
  updatePermission: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, key, description } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid permission ID format",
        }, 400);
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (key) updateData.key = key.trim();
      if (description !== undefined) updateData.description = description;

      // Check for conflicts if updating name or key
      if (name || key) {
        const conflictQuery: any = { _id: { $ne: id } };
        if (name && key) {
          conflictQuery.$or = [
            { name: name.trim() },
            { key: key.trim() }
          ];
        } else if (name) {
          conflictQuery.name = name.trim();
        } else if (key) {
          conflictQuery.key = key.trim();
        }

        const existingPermission = await Permission.findOne(conflictQuery);
        if (existingPermission) {
          return sendErrorResponse(res, {
            message: "Conflict",
            details: "Permission with this name or key already exists",
          }, 400);
        }
      }

      const updatedPermission = await Permission.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedPermission) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Permission not found",
        }, 404);
      }

      return sendSuccessResponse(res, { permission: updatedPermission }, "Permission updated successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to update permission",
        details: error.message,
      }, 500);
    }
  },

  // Delete a permission
  deletePermission: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendErrorResponse(res, {
          message: "Invalid ID",
          details: "Invalid permission ID format",
        }, 400);
      }

      // Check if permission exists
      const permission = await Permission.findById(id);
      if (!permission) {
        return sendErrorResponse(res, {
          message: "Not Found",
          details: "Permission not found",
        }, 404);
      }

      // Delete all role permissions associated with this permission
      await RolePermission.deleteMany({ permission_id: id });

      // Delete the permission
      await Permission.findByIdAndDelete(id);

      return sendSuccessResponse(res, {}, "Permission deleted successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, {
        message: "Failed to delete permission",
        details: error.message,
      }, 500);
    }
  },
};

export default PermissionController;