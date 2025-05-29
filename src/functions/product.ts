import { Types } from "mongoose";
import { Request, Response } from 'express';
import Image from '../models/Image';
import { ErrorResponse, IResponseData } from "../types";
import { Brand, ProductBrand, Category, ProductImage, ProductCategory } from "../models"

const sendSuccessResponse = <T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): void => {
  const responseData: IResponseData<T> = {
    success: true,
    message,
    data
  };
  console.log("success");

  res.status(statusCode).json(responseData);
};

const sendErrorResponse = (res: Response, error: ErrorResponse | string, statusCode: number = 400): void => {
  const message = typeof error === 'string' ? error : error.message;
  const responseData: IResponseData<null> = {
    success: false,
    message,
    data: null,
    ...(typeof error !== 'string' && error.field && { field: error.field }),
    ...(typeof error !== 'string' && error.details && { details: error.details })
  };
  console.log("fail", message);

  res.status(statusCode).json(responseData);
};

// Field validation function
const validateRequiredFields = (fields: Record<string, any>, requiredFields: string[]): ErrorResponse | null => {
  for (const field of requiredFields) {
    if (fields[field] === undefined || fields[field] === null || fields[field] === '') {
      return {
        message: 'Missing required field',
        field,
        details: `The ${field} field is required`
      };
    }
  }
  return null;
};


const validateNumericFields = (fields: Record<string, number>, validations: Record<string, { min?: number; max?: number }>): ErrorResponse | null => {
  for (const [field, value] of Object.entries(fields)) {
    const validation = validations[field];
    if (isNaN(value)) {
      return {
        message: 'Invalid numeric value',
        field,
        details: `The ${field} must be a valid number`
      };
    }

    if (validation.min !== undefined && value < validation.min) {
      return {
        message: 'Value too small',
        field,
        details: `The ${field} must be at least ${validation.min}`
      };
    }

    if (validation.max !== undefined && value > validation.max) {
      return {
        message: 'Value too large',
        field,
        details: `The ${field} must be at most ${validation.max}`
      };
    }
  }
  return null;
};

const findOrCreateImage = async (imageData: { url: string; name?: string }, defaultName: string): Promise<Types.ObjectId> => {
  let image = await Image.findOne({ url: imageData.url });
  if (!image) {
    image = new Image({
      name: imageData.name || defaultName,
      url: imageData.url
    });
    await image.save();
  }
  return image._id;
};

const handleProductImages = async (productId: Types.ObjectId, imageUrls: Array<{ url: string; name?: string }>, productName: string): Promise<Types.ObjectId[]> => {
  const imageIds: Types.ObjectId[] = [];

  for (const imgData of imageUrls) {
    const imageId = await findOrCreateImage(imgData, `Image for ${productName}`);
    imageIds.push(imageId);
  }

  await ProductImage.findOneAndDelete({ productId });
  if (imageIds.length > 0) {
    const productImages = new ProductImage({
      productId,
      imageUrl: imageIds
    });
    await productImages.save();
  }

  return imageIds;
};

const handleProductBrands = async (productId: Types.ObjectId, brands: Array<{ name: string; logo?: { url: string; name?: string }; site?: string }>): Promise<Types.ObjectId[]> => {
  const brandIds: Types.ObjectId[] = [];

  for (const brandData of brands) {
    let brand = await Brand.findOne({ name: brandData.name });

    if (!brand && brandData.logo) {
      const logoId = await findOrCreateImage(brandData.logo, `Logo for ${brandData.name}`);

      brand = new Brand({
        name: brandData.name,
        logo: logoId,
        site: brandData.site || ''
      });
      await brand.save();
    }

    if (brand) {
      brandIds.push(brand._id);
    }
  }

  await ProductBrand.findOneAndDelete({ productId });
  if (brandIds.length > 0) {
    const productBrands = new ProductBrand({
      productId,
      brands: brandIds
    });
    await productBrands.save();
  }

  return brandIds;
};


const handleProductCategories = async (productId: Types.ObjectId, categories: Array<{ _id?: string | Types.ObjectId }>): Promise<Types.ObjectId[]> => {
  const categoryIds: Types.ObjectId[] = [];

  for (const catData of categories) {
    const catId = catData._id as Types.ObjectId; // Type assertion
    const category = await Category.findById(catId);
    if (Types.ObjectId.isValid(catId)) {
      const category = await Category.findById(catId);
      if (category) {
        categoryIds.push(category._id as Types.ObjectId);
      }
    }
  }

  await ProductCategory.findOneAndDelete({ productId });
  if (categoryIds.length > 0) {
    const productCategories = new ProductCategory({
      productId,
      categories: categoryIds
    });
    await productCategories.save();
  }

  return categoryIds;
};


export {
  validateRequiredFields,
  validateNumericFields,
  findOrCreateImage,
  handleProductImages,
  handleProductBrands,
  handleProductCategories,
  sendSuccessResponse,
  sendErrorResponse
};


export const formateDate = (date: Date) => {
  const formatted = new Date(date as Date).toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatted
} 