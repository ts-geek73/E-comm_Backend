import { Request } from 'express';
import { Image } from '../models';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();


export const findOrCreateImage = async (url: string, name: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const existingImage = await Image.findOne({ url });
    if (existingImage) return existingImage._id;

    const newImage = new Image({ url, name });
    await newImage.save();
    return newImage._id;
  }

  const existingImage = await Image.findOne({ url });
  if (existingImage) return existingImage._id;

  const newImage = new Image({ url, name });
  await newImage.save();
  return newImage._id;
};


export const processUploadedImages = async (req: Request, productName: string): Promise<string[]> => {
  const files = req.files as Express.Multer.File[];
  const imageIds: string[] = [];

  if (!files || files.length === 0) {
    return imageIds;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = `/uploads/products/${path.basename(file.path)}`;

    // Create image document
    const imageDoc = new Image({
      url: relativePath,
      name: `${productName.replace(/\s+/g, '_')}_${i + 1}`
    });

    await imageDoc.save();
    imageIds.push(imageDoc._id.toString());
  }

  return imageIds;
};

export const getAbsoluteImageUrl = (req: Request, relativePath: string): string => {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  const ngrokUrl = process.env.NGROK_URL; 
  const baseUrl = ngrokUrl || `${req.protocol}://${req.get('host')}`;
  
  // Properly encode the URL to handle spaces and special characters
  const encodedPath = encodeURI(relativePath);
  
  // console.log('Encoded URL:', baseUrl + encodedPath);
  return baseUrl + encodedPath;
};

export const getImageUrlsFromFiles = (req: Request): string[] => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return [];
  }

  return files.map(file => {
    return `/uploads/products/${path.basename(file.path)}`;
  });
};


export const removeImageFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error removing image file:', error);
  }
};