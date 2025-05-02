import { Request, Response } from 'express';
import { Types } from 'mongoose';

export interface IRequestHandler {
  createProduct ?: (req: Request, res: Response) => Promise<void>;
  getBrandsAndCategories ?: (req: Request, res: Response) => Promise<void>;
  getAllProducts ?: (req: Request, res: Response) => Promise<void>;
  getLimitedProducts ?: (req: Request, res: Response) => Promise<void>;
  getProductById?: (req: Request, res: Response) => Promise<void>;
  searchProduct?:(req: Request, res: Response) => Promise<void>;
  updateProduct?: (req: Request, res: Response) => Promise<void>;
  deleteProduct?: (req: Request, res: Response) => Promise<void>;
  protected?: (req: Request, res: Response) => Promise<void>;
  createUser?: (req: Request, res: Response) => Promise<void | Request>;
}

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  status: boolean;
  short_description: string;
  long_description: string;
  price: number;
  image?: Types.ObjectId;
}

export enum UserProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  NORMAL = 'normal'
}

export interface IRolePermission extends Document{
  role_id: Types.ObjectId;
  permission_id: Types.ObjectId;
}

export interface IRole extends Document {
  name: string;
  description?: string;
}

export interface IUser extends Document {
  clerkId: string;
  userId: string;
  sessionId: string;
  name: string;
  email: string;
  roles_id?: Types.ObjectId[]; // Reference to the Role
}

export interface IUserProvider extends Document {
  name: string;
  email: string;
  password?: string; 
  provider: UserProvider; 
  authKey?: string; 
}


export interface IBrand {
  _id?: Types.ObjectId;
  name: string;
  logo?: Types.ObjectId;
  site?: string;
}

export interface ICategory extends Document {
  name: string;
  parentCategory_id?: Types.ObjectId | null;
  imageUrl?: Types.ObjectId; 
}

export interface IImage {
  _id?: Types.ObjectId;
  name: string;
  url: string;
}

export interface IProductBrand {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  brands: Types.ObjectId[];
}

export interface IProductCategoty extends Document {
  _id?: Types.ObjectId;
  productId: Types.ObjectId; 
  categories: Types.ObjectId[]; 
}

export interface IProductImage {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  imageUrl: Types.ObjectId[];
}

export interface UserData {
  jwtToken: string;
  clerkId: string;
  userId: string;
  sessionId: string;
  name: string;
  email: string;
  provider: string;
}

export interface IPermission extends Document {
  name: string;
  key: string;
  description?: string;
}