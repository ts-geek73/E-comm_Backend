import { Request, Response , RequestHandler} from 'express';
import { Types , Document} from 'mongoose';

// type Handler = (req: Request, res: Response) => Promise<void | Request>;


export interface IRequestHandler {
  [key: string]: RequestHandler ;
}

export interface IResponseData<T> {
  success: boolean;
  message: string;
  data: T | null;
  field?: string;
  details?: string;
}


export interface ErrorResponse {
  message: string;
  field?: string;
  details?: string;
}

export interface IProductQueryParams {
  start?: string;
  length?: string;
  brand?: string;
  category?: string;
  pricemin?: string;
  pricemax?: string;
  sort?: string;
  search?: string;
}

export interface IProduct extends Document{

  _id: Types.ObjectId;
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
  _id: Types.ObjectId;
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
  _id: Types.ObjectId;
  name: string;
  url: string;
}

export interface IProductBrand {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  brands: Types.ObjectId[];
}

export interface IProductCategoty extends Document {
  _id: Types.ObjectId;
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

export interface IProductReview extends Document{
  product_id : Types.ObjectId 
  user_id : string 
  rate: number
  description : string
}

export interface IReviewImages{
  product_id : Types.ObjectId;
  user_id : string
  review_images : Types.ObjectId[];
}

export interface IProductCart{
  product_id : Types.ObjectId
  qty : number
  notes ?: string
}

export interface IShoppingCart extends Document{
  user_id : string
  products : IProductCart[];
}



export interface IAddressEntry extends Document{
  _id:Types.ObjectId
  address_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  addressType: 'billing' | 'shipping';
}

export interface IAddress extends Document {
  email: string;
  addresses: IAddressEntry[];
}

export interface IPromoCode extends Document {
  stripeCouponId: string| null;
  code: string;
  type: "flat" | "percentage";
  amount: number;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  email: string;
  items: IProductCart[];
  amount: number;
  shipping_address: Types.ObjectId;
  session_id: string 
  billing_address: Types.ObjectId;
  status: 'pending' | 'paid' | 'failed' | 'shipped' | 'complete' | 'cancelled';
}

export interface IUserInvoice extends Document {
  email: string;
  invoices: {
    orderId : Types.ObjectId,
    invoice : string,
  }[];
}

export interface IWishlist extends Document {
  user_id: Types.ObjectId;
  products: Types.ObjectId[]; // array of product IDs
}
