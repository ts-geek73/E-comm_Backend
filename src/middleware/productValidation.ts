import { NextFunction, Request, Response } from 'express';
import { body, param, ValidationError, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { sendErrorResponse } from '../functions/product';
import { Permission, RolePermission, User } from '../models';

// Product validation rules
export const productValidationRules = [
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isString().withMessage('Product name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),

  body('short_description')
    .notEmpty().withMessage('Short description is required')
    .isString().withMessage('Short description must be a string')
    .isLength({ min: 10, max: 200 }).withMessage('Short description must be between 10 and 200 characters'),

  body('long_description')
    .notEmpty().withMessage('Long description is required')
    .isString().withMessage('Long description must be a string')
    .isLength({ min: 20 }).withMessage('Long description must be at least 20 characters'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['true', 'false']).withMessage('Status must be active, inactive, or draft'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isNumeric().withMessage('Price must be a number')
    .custom((value) => value >= 0).withMessage('Price must be a positive number'),

  body('rating')
    .optional()
    .isNumeric().withMessage('Rating must be a number')
    .custom((value) => value >= 0 && value <= 5).withMessage('Rating must be between 0 and 5'),

  body('categories')
    .notEmpty().withMessage('At least one category is required')
    .custom((value) => {
      try {
        console.log("Categorys", value);
        const categories = JSON.parse(value);

        if (value !== undefined && !Array.isArray(categories)) {
          throw new Error('Categories must be an array');
        }
        if (categories.length === 0) {
          throw new Error('At least one category is required');
        }
      } catch (err) {
        throw new Error('Categories must be a valid JSON array');
      }
      return true;
    }),


  body('brands')
    .optional()
    .custom((value) => {
      try {
        // Parse the JSON string
        const brands = JSON.parse(value);

        // Check if the parsed value is an array
        if (!Array.isArray(brands)) {
          throw new Error('Brands must be an array');
        }

        // Optionally, you can add further checks (like ensuring it's not an empty array)
        if (brands.length === 0) {
          throw new Error('At least one brand is required');
        }
      } catch (err) {
        throw new Error('Brands must be a valid JSON array');
      }
      return true;
    }),
];

// Product ID validation
export const productIdValidation = [
  param('id')
    .notEmpty().withMessage('Product ID is required')
    .custom((value) => Types.ObjectId.isValid(value)).withMessage('Invalid product ID format')
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0] as ValidationError & { param: string };

    return sendErrorResponse(res, {
      message: firstError.msg,
      field: firstError.param,
      details: 'Validation error'
    }, 400);
  }
  next();
};

export const userIdAndPermissionValidate = (  key?: string ) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.user_id || req.params.userId || req.query.user_id as string;

    if (!userId) {
      return sendErrorResponse(res, {
        message: 'User ID is missing in the request body.',
        field: 'user_id',
        details: 'Authentication required'
      }, 401);
    }

    try {
      const user = await User.findOne({ userId });
      if (!user) {
        return sendErrorResponse(res, {
          message: 'Invalid User ID.',
          field: 'user_id',
          details: 'User not found'
        }, 404);
      }
      
      // If no permission key is provided, proceed
      if (!key) {
        return next();
      }
      
      const validPermissionKey = await Permission.findOne({ key});
      if(!validPermissionKey){
        return sendErrorResponse(res, {
          message: 'Invalid Permission Key.',
          field: 'key',
          details: 'Permission Not found'
        }, 404);
      }
      
      const rolePermissions = await RolePermission.find({
        role_id: { $in: user.roles_id }
      });


      const permissionIds = rolePermissions.map(rp => rp.permission_id);

      const permissions = await Permission.find({
        _id: { $in: permissionIds }
      });      

      const hasPermission = permissions.some(permission => permission.key === key);
      console.log(`User Have ${hasPermission ? " ": "not"} the permission of ${key}.`);
      

      if (!hasPermission) {
        return sendErrorResponse(res, {
          message: 'Permission denied.',
          field: 'permission',
          details: `Missing permission: ${key}`
        }, 403);
      }

      next();
    } catch (error) {
      console.error('Error validating user or permission:', error);
      return sendErrorResponse(res, {
        message: 'Internal server error while validating user or permission.',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  };
}