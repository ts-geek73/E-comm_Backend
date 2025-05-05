import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Brand , Product , Category, ProductBrand, ProductCategory, ProductImage} from "../models"
import { 
  IProduct, 
  IRequestHandler, 
  IImage, 
  ICategory,
  IProductQueryParams,
} from '../types';
import { findOrCreateImage, handleProductBrands, handleProductCategories, handleProductImages, sendErrorResponse, sendSuccessResponse, validateNumericFields, validateRequiredFields } from '../functions/product';

const productController: IRequestHandler = {
  createProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Backend Product create');
      const { 
        name, 
        long_description, 
        status, 
        short_description, 
        price, 
        brands, 
        rating, 
        features, 
        categories, 
        imageUrls 
      } = req.body;

      // Validate required fields
      const requiredFields = ['name', 'status', 'short_description', 'long_description', 'price', 'categories', 'imageUrls'];
      const missingField = validateRequiredFields(req.body, requiredFields);
      if (missingField) {
        sendErrorResponse(res, missingField);
        return;
      }

      // Validate numeric fields
      const priceValue = parseFloat(price);
      const ratingValue = parseFloat(rating || 0);
      const numericError = validateNumericFields(
        { price: priceValue, rating: ratingValue },
        { price: { min: 0 }, rating: { min: 0, max: 5 } }
      );
      
      if (numericError) {
        sendErrorResponse(res, numericError);
        return;
      }

      console.log("Product Data", req.body);

      // Get or create main image
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        sendErrorResponse(res, {
          message: 'Invalid image data',
          field: 'imageUrls',
          details: 'At least one image is required'
        });
        return;
      }

      const mainImageId = await findOrCreateImage(imageUrls[0], `Image for ${name}`);

      // Find or create product
      const productExist = await Product.findOne({ name });
      let product: IProduct;

      if (productExist) {
        productExist.set({
          name,
          status,
          long_description,
          short_description,
          price: priceValue,
          rating: ratingValue,
          features,
          image: mainImageId,
        });
        product = await productExist.save();
        console.log("Product updated");
      } else {
        // Create new product
        const newProduct = new Product({
          name,
          long_description,
          short_description,
          price: priceValue,
          status,
          rating: ratingValue,
          features,
          image: mainImageId,
        });
        product = await newProduct.save();
        console.log("New product created");
      }

      // Handle product images
      await handleProductImages(product._id, imageUrls, name);
      
      // Handle brands if provided
      if (brands && Array.isArray(brands) && brands.length > 0) {
        await handleProductBrands(product._id, brands);
      }
      
      // Handle categories if provided
      if (categories && Array.isArray(categories) && categories.length > 0) {
        await handleProductCategories(product._id, categories);
      }

      console.log("All product relationships processed");
      
      sendSuccessResponse(
        res, 
        { product }, 
        productExist ? 'Product updated successfully.' : 'Product created successfully.'
      );
    } catch (error: any) {
      console.error('Error creating/updating product:', error);
      sendErrorResponse(
        res, 
        {
          message: 'Failed to create/update product',
          details: error.message
        }, 
        500
      );
    }
  },

  getBrandsAndCategories: async (_req: Request, res: Response): Promise<void> => {
    try {
      console.log("Get Brands and Categories API");
      
      const brands = await Brand.find()
        .populate('logo', 'url name')
        .sort({ name: 1 });
        
      const categories = await Category.find()
        .populate('imageUrl', 'url name')
        .sort({ name: 1 });
        
      sendSuccessResponse(res, { brands, categories });
    } catch (error: any) {
      console.error('Error fetching brands and categories:', error);
      sendErrorResponse(res, {
        message: 'Failed to fetch brands and categories',
        details: error.message
      }, 500);
    }
  },

  getProducts: async (req: Request, res: Response): Promise<void> => {
    console.log("Get all Products");
    
    try {
      const {
        start = '0',
        length = '12',
        brand,
        category,
        pricemin,
        pricemax,
        sort,
        search,
      } = req.query as IProductQueryParams;
  
      const startNum = parseInt(start, 10);
      const lengthNum = parseInt(length, 10);
      const filter: Record<string, any> = {};
  
      // Search filter
      if (search && search !== "undefined") {
        filter.name = { $regex: search, $options: 'i' };
      }
  
      // Brand filter
      if (brand && Types.ObjectId.isValid(brand)) {
        const ids = await ProductBrand.find({ brands: brand }).distinct('productId');
        filter._id = { $in: ids };
      }
  
      // Category filter
      if (category && Types.ObjectId.isValid(category)) {
        const ids = await ProductCategory.find({ categories: category }).distinct('productId');
        filter._id = filter._id
          ? { $in: ids.filter(id => filter._id.$in.includes(id)) }
          : { $in: ids };
      }
  
      // Price filter
      const priceRange: Record<string, number> = {};
      const min = parseFloat(pricemin || '');
      const max = parseFloat(pricemax || '');
      if (!isNaN(min)) priceRange.$gte = min;
      if (!isNaN(max)) priceRange.$lte = max;
      if (Object.keys(priceRange).length) filter.price = priceRange;
  
      // Sorting
      const sortBy: Record<string, 1 | -1> = {
        price: 1,
        rating: -1,
        default: 1,
      };

      console.log("filters" , filter);
      
  
      // Main query
      const totalCount = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .sort(sortBy)
        .skip(startNum)
        .limit(lengthNum)
        .populate('image', 'url name')
        .lean();
  
      const productIds = products.map(p => p._id);
  
      const [brandRelations, categoryRelations, imageRelations] = await Promise.all([
        ProductBrand.find({ productId: { $in: productIds } }).populate('brands', 'name'),
        ProductCategory.find({ productId: { $in: productIds } }).populate('categories', 'name'),
        ProductImage.find({ productId: { $in: productIds } }).populate('imageUrl', 'url name'),
      ]);

      console.log("Pass 1");
      
  
      const getRelations = (list: any[], productId: any, key: string) =>
        list.filter(r => r.productId.toString() === productId.toString()).flatMap(r => r[key]);
  
      const productsWithDetails = products.map(product => ({
        ...product,
        brands: getRelations(brandRelations, product._id, 'brands'),
        categories: getRelations(categoryRelations, product._id, 'categories'),
        images: getRelations(imageRelations, product._id, 'imageUrl'),
      }));

      console.log("Pass 2", productsWithDetails.length);
      

      
  
      if (!productsWithDetails.length && search !== undefined) {
        sendErrorResponse(res, {
          message: 'Product not found',
          details: `No products match the search term: ${search}`,
        }, 404);
        return;
      }

      console.log("Pass 3");
      
  
      // Optional related products if search is used
      if (search && search !== "undefined") {
        console.log("Inside the search");
        
        const relatedProducts = await Product.find({
          name: { $not: { $regex: search, $options: 'i' } },
        }).limit(10).populate('image', 'url name');
  
        const relatedFullProducts = await Promise.all(relatedProducts.map(async (product) => {
          const brandRel = await ProductBrand.findOne({ productId: product._id }).populate({
            path: 'brands',
            populate: { path: 'logo', select: 'url name' },
          });
          return {
            ...product.toObject(),
            brands: brandRel?.brands || [],
          };
        }));

        console.log("pass 4");
        
  
        sendSuccessResponse(res, {
          data: productsWithDetails,
          related: relatedFullProducts,
        });
      } else {
        sendSuccessResponse(res, {
          data: productsWithDetails,
          length: totalCount,
        });
      }

      console.log("final successs");
      
  
    } catch (error: any) {
      console.error('Error fetching products:', error);
      sendErrorResponse(res, {
        message: 'Failed to fetch products',
        details: error.message,
      }, 500);
    }
  },
  

  getProductById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log("getProducts with Id", id);
      
      if (!Types.ObjectId.isValid(id)) {
        sendErrorResponse(res, {
          message: 'Invalid product ID',
          field: 'id',
          details: 'The provided ID is not a valid ObjectId'
        });
        return;
      }
      
      const product = await Product.findById(id)
        .populate('image', 'url name');
      
      if (!product) {
        sendErrorResponse(res, {
          message: 'Product not found',
          field: 'id',
          details: `No product exists with ID: ${id}`
        }, 404);
        return;
      }
      
      const productBrands = await ProductBrand.findOne({ productId: product._id })
        .populate({
          path: 'brands',
          populate: { path: 'logo', select: 'url name' }
        });
      
      const productCategories = await ProductCategory.findOne({ productId: product._id })
        .populate({
          path: 'categories',
          populate: { path: 'imageUrl', select: 'url name' }
        });
      
      const productImages = await ProductImage.findOne({ productId: product._id })
        .populate('imageUrl', 'url name');

      const fullProduct = {
        ...product.toObject(),
        brands: productBrands?.brands || [],
        categories: productCategories?.categories || [],
        images: productImages?.imageUrl || []
      };
      
      const categoryIds: Types.ObjectId[] = productCategories?.categories || [];
      let relatedProducts: any[] = [];
      
      if (categoryIds.length > 0) {
        const relatedProductCategories = await ProductCategory.find({
          productId: { $ne: product._id },
          categories: { $in: categoryIds }
        }).limit(3);
        
        const relatedProductIds = relatedProductCategories.map((pc: any) => pc.productId);
        
        if (relatedProductIds.length > 0) {
          const relatedProductsData = await Product.find({
            _id: { $in: relatedProductIds }
          }).populate('image', 'url name');
          
          // Get additional data for related products
          relatedProducts = await Promise.all(relatedProductsData.map(async (relProduct) => {
            const relBrands = await ProductBrand.findOne({ productId: relProduct._id })
              .populate({
                path: 'brands',
                populate: { path: 'logo', select: 'url name' }
              });
            
            const relCategories = await ProductCategory.findOne({ productId: relProduct._id })
              .populate({
                path: 'categories',
                select: 'name'
              });
            
            return {
              ...relProduct.toObject(),
              brands: relBrands?.brands || [],
              categories: relCategories?.categories || []
            };
          }));
        }
      }
      
      sendSuccessResponse(res, { product: fullProduct, relatedProducts });
    } catch (error: any) {
      console.error('Error fetching product by ID:', error);
      sendErrorResponse(res, {
        message: 'Failed to fetch product',
        details: error.message
      }, 500);
    }
  },

  updateProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log("Update Product API");
      
      if (!Types.ObjectId.isValid(id)) {
        sendErrorResponse(res, {
          message: 'Invalid product ID',
          field: 'id',
          details: 'The provided ID is not a valid ObjectId'
        });
        return;
      }
      
      const product = await Product.findById(id);
      if (!product) {
        sendErrorResponse(res, {
          message: 'Product not found',
          field: 'id',
          details: `No product exists with ID: ${id}`
        }, 404);
        return;
      }

      const { 
        name, 
        status, 
        long_description, 
        short_description, 
        price, 
        brands, 
        categories, 
        imageUrls 
      } = req.body;
      
      if (imageUrls !== undefined && !Array.isArray(imageUrls)) {
        sendErrorResponse(res, {
          message: 'Invalid image data',
          field: 'imageUrls',
          details: 'imageUrls must be an array'
        });
        return;
      }

      const updatedProductData: Partial<IProduct> = {
        ...(name !== undefined && { name }),
        ...(long_description !== undefined && { long_description }),
        ...(short_description !== undefined && { short_description }),
        ...(status !== undefined && { status }),
        ...(price !== undefined && { price: parseFloat(price) }),
      };

      if (imageUrls && imageUrls.length > 0) {
        const mainImageId = await findOrCreateImage(
          imageUrls[0], 
          `Image for ${name || product.name}`
        );
        updatedProductData.image = mainImageId;
      }
      
      Object.assign(product, updatedProductData);
      await product.save();

      if (imageUrls && imageUrls.length > 0) {
        await handleProductImages(product._id, imageUrls, product.name);
      }
      
      if (brands && Array.isArray(brands) && brands.length > 0) {
        await handleProductBrands(product._id, brands);
      }
      
      // Handle categories if provided
      if (categories && Array.isArray(categories) && categories.length > 0) {
        await handleProductCategories(product._id, categories);
      }
      
      // Get full updated product data with relationships
      await product.populate('image', 'url name');
      
      const productBrands = await ProductBrand.findOne({ productId: product._id })
        .populate({ 
          path: 'brands', 
          populate: { path: 'logo', select: 'url name' } 
        });
      
      const productCategories = await ProductCategory.findOne({ productId: product._id })
        .populate({ 
          path: 'categories', 
          populate: { path: 'imageUrl', select: 'url name' } 
        });
      
      const productImages = await ProductImage.findOne({ productId: product._id })
        .populate('imageUrl', 'url name');
      
        const allImages = (productImages?.imageUrl || []).filter(
          (img) =>
            !product.image || img._id.toString() !== (product.image._id?.toString?.() || "")
        );
        
      
      const fullProduct = {
        ...product.toObject(),
        brands: productBrands?.brands || [],
        categories: productCategories?.categories || [],
        images: product.image ? [product.image, ...allImages] : allImages
      };
      
      sendSuccessResponse(res, { product: fullProduct }, 'Product updated successfully');
    } catch (error: any) {
      console.error('Error updating product:', error);
      sendErrorResponse(res, {
        message: 'Failed to update product',
        details: error.message
      }, 500);
    }
  },

  deleteProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Delete Product API");
      const { id } = req.params;
      
      if (!Types.ObjectId.isValid(id)) {
        sendErrorResponse(res, {
          message: 'Invalid product ID',
          field: 'id',
          details: 'The provided ID is not a valid ObjectId'
        });
        return;
      }
      
      const product = await Product.findById(id);
      if (!product) {
        sendErrorResponse(res, {
          message: 'Product not found',
          field: 'id',
          details: `No product exists with ID: ${id}`
        }, 404);
        return;
      }
      
      // Delete all related records in one transaction
      await Promise.all([
        ProductBrand.deleteMany({ productId: id }),
        ProductCategory.deleteMany({ productId: id }),
        ProductImage.deleteMany({ productId: id }),
        Product.findByIdAndDelete(id)
      ]);
      
      sendSuccessResponse(res, null, 'Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      sendErrorResponse(res, {
        message: 'Failed to delete product',
        details: error.message
      }, 500);
    }
  },
};

export default productController;