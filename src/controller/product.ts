import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Product from '../models/product';
import Brand from '../models/brand';
import Category from '../models/category';
import Image from '../models/Image';
import ProductBrand from '../models/product-brand';
import ProductCategory from '../models/product-category';
import ProductImage from '../models/product-image';
import { IRequestHandler as IProductRequestHandler } from '../types';

const productController: IProductRequestHandler = {
  createProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Backend Product create');
      let { name, long_description, status, short_description, price, brands, rating, features, categories, imageUrls } = req.body;

      if (!name || !status || !short_description || !long_description || !price || !categories || !imageUrls) {
        res.status(400).json({ message: 'Missing required fields.' });
        return;
      }
      console.log("Product Data", req.body);

      price = parseFloat(price);
      rating = parseFloat(rating || 0);

      if (price < 0 || rating < 0 || rating > 5) {
        res.status(400).json({ message: 'Invalid numeric values.' });
        return;
      }

      const mainImage = imageUrls[0];
      let imageExists = await Image.findOne({ url: mainImage.url });
      if (!imageExists) {
        imageExists = new Image({
          name: mainImage.name || `Image for ${name}`,
          url: mainImage.url
        });
        await imageExists.save();
      }

      console.log("Pass 1");

      const productExist = await Product.findOne({ name });

      let product;
      if (productExist) {
        productExist.set({
          name,
          status,
          long_description,
          short_description,
          price,
          rating,
          features,
          image: imageExists._id,
        });

        product = await productExist.save();
        console.log("Pass Product Save");
      } else {
        // Create new product
        const newProduct = new Product({
          name,
          long_description,
          short_description,
          price,
          status,
          rating,
          features,
          image: imageExists._id,
        });

        product = await newProduct.save();
        console.log("Pass new Product Save");
      }

      console.log("Pass 2");
      if (imageUrls && imageUrls.length > 0) {
        await ProductImage.findOneAndDelete({ productId: product._id });

        const imageIds: string[] = [];
        for (const imgData of imageUrls) {
          let img = await Image.findOne({ url: imgData.url });
          if (!img) {
            img = new Image({ name: imgData.name || `Image for ${name}`, url: imgData.url });
            await img.save();
          }
          imageIds.push(img._id);
        }

        const productImages = new ProductImage({
          productId: product._id,
          imageUrl: imageIds
        });
        await productImages.save();
      }

      console.log("Pass 3");

      if (brands && brands.length > 0) {
        await ProductBrand.findOneAndDelete({ productId: product._id });

        const brandIds: string[] = [];
        for (const brandData of brands) {
          let brand = await Brand.findOne({ name: brandData.name });

          if (!brand && brandData.logo) {
            let logoImage = await Image.findOne({ url: brandData.logo.url });
            if (!logoImage) {
              logoImage = new Image({
                name: brandData.logo.name || `Logo for ${brandData.name}`,
                url: brandData.logo.url
              });
              await logoImage.save();
            }

            brand = new Brand({
              name: brandData.name,
              logo: logoImage._id,
              site: brandData.site || ''
            });
            await brand.save();
          }
          if (brand) {
            brandIds.push(brand._id);
          }
        }

        if (brandIds.length > 0) {
          const productBrands = new ProductBrand({
            productId: product._id,
            brands: brandIds
          });
          await productBrands.save();
        }
      }

      console.log("Pass 4");

      if (categories && categories.length > 0) {
        await ProductCategory.findOneAndDelete({ productId: product._id });

        const categoryIds: Types.ObjectId[] = [];
        for (const catData of categories) {
          if (catData && catData._id) {
            let category = await Category.findById(catData._id);
            if (category) {
              categoryIds.push(category._id as Types.ObjectId);
            }
          }
        }

        if (categoryIds.length > 0) {
          const productCategories = new ProductCategory({
            productId: product._id,
            categories: categoryIds
          });
          await productCategories.save();
        }
      }

      console.log("Pass All");

      res.status(200).json({
        message: productExist ? 'Product updated successfully.' : 'Product created successfully.',
        product
      });
    } catch (error: any) {
      console.error('Error creating/updating product:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  getBrandsAndCategories: async (req: Request, res: Response): Promise<void> => {
    console.log("Get Brands and Categories API");
    try {
      const brands = await Brand.find()
        .populate('logo', 'url name')
        .sort({ name: 1 });

      const categories = await Category.find()
        .populate('imageUrl', 'url name')
        .sort({ name: 1 });

      res.status(200).json({ brands, categories });
    } catch (err) {
      console.error('Error fetching brands and categories:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAllProducts: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Get All Products API");

      const products = await Product.find()
        .populate('image', 'url name')
        .sort({ name: 1 });

      const allProducts = await Promise.all(products.map(async (product) => {
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

        return {
          ...product.toObject(),
          brands: productBrands?.brands || [],
          categories: productCategories?.categories || [],
          images: productImages?.imageUrl || []
        };
      }));

      res.status(200).json(allProducts);
    } catch (error) {
      console.error('Error fetching all products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getLimitedProducts: async (req: Request, res: Response): Promise<void> => {
    try {
      const { start = 0, length = 10, brand, category, pricemin, pricemax, sort } = req.query;
      console.log("Get Limited Products API");
      console.log("Query Params", req.query);
      const startNum = parseInt(start as string, 10);
      const lengthNum = parseInt(length as string, 10);
      let filter: any = {};

      if (brand && Types.ObjectId.isValid(brand as string)) {
        const brandRelations = await ProductBrand.find({ brands: brand }).select('productId');
        const brandMatchingProductIds = brandRelations.map((relation) => relation.productId);
        filter._id = { $in: brandMatchingProductIds };
      }

      if (category && Types.ObjectId.isValid(category as string)) {
        const categoryRelations = await ProductCategory.find({ categories: category }).select('productId');
        const categoryMatchingProductIds = categoryRelations.map((relation) => relation.productId);
        filter._id = filter._id ? { $in: categoryMatchingProductIds.filter((id) => filter._id.$in.includes(id)) } : { $in: categoryMatchingProductIds };
      }

      if (pricemin || pricemax) {
        const priceFilter: any = {};
        const min = parseFloat(pricemin as string);
        const max = parseFloat(pricemax as string);

        if (!isNaN(min)) priceFilter.$gte = min;
        if (!isNaN(max)) priceFilter.$lte = max;

        if (Object.keys(priceFilter).length > 0) {
          filter.price = priceFilter;
        }
      }

      const sortBy: any = sort === 'price' ? { price: 1 } : sort === 'rating' ? { rating: -1 } : { name: 1 };

      const totalCount = await Product.countDocuments(filter);

      const products = await Product.find(filter)
        .sort(sortBy)
        .skip(startNum)
        .limit(lengthNum)
        .populate('image', 'url name')
        .lean();

      const productIds = products.map(product => product._id);
      const productBrands = await ProductBrand.find({ productId: { $in: productIds } }).populate('brands', "name");
      const productCategories = await ProductCategory.find({ productId: { $in: productIds } }).populate('categories', 'name');
      const productImages = await ProductImage.find({ productId: { $in: productIds } }).populate('imageUrl', "url name");

      const productsWithDetails = products.map((product) => {
        const brands = productBrands.filter(item => item.productId.toString() === product._id.toString()).map(item => item.brands);
        const categories = productCategories.filter(item => item.productId.toString() === product._id.toString()).map(item => item.categories);
        const images = productImages.filter(item => item.productId.toString() === product._id.toString()).map(item => item.imageUrl);

        return {
          ...product,
          brands: brands.flat(),
          categories: categories.flat(),
          images: images.flat()
        };
      });

      res.status(200).json({
        datas: productsWithDetails,
        length: totalCount,
      });
    } catch (error) {
      console.error('Error fetching limited products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getProductById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log("getProducts with Id", id);

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID.' });
        return;
      }

      const product = await Product.findById(id)
        .populate('image', 'url name');

      if (!product) {
        res.status(404).json({ message: 'Product not found.' });
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

      type Category = { _id: Types.ObjectId; name?: string };
      const categoryIds = productCategories?.categories?.map((cat: Category) => cat._id) || [];

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

      res.status(200).json({ product: fullProduct, relatedProducts });
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  searchProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search } = req.query;
      console.log("Search api with, search: ", search);

      if (!search) {
        res.status(400).json({ message: 'Search query is required.' });
        return;
      }

      const products = await Product.find({
        name: { $regex: search as string, $options: 'i' },
      }).populate('image', 'url name');

      const fullProducts = await Promise.all(products.map(async (product) => {
        const productBrands = await ProductBrand.findOne({ productId: product._id })
          .populate("brands", "name");

        const productCategories = await ProductCategory.findOne({ productId: product._id })
          .populate("categories", "name");

        const productImages = await ProductImage.findOne({ productId: product._id })
          .populate('imageUrl', 'url name');

        return {
          ...product.toObject(),
          brands: productBrands?.brands || [],
          categories: productCategories?.categories || [],
          images: productImages?.imageUrl || []
        };
      }));

      if (fullProducts.length === 0) {
        // If no products found, return some related products
        const relatedProducts = await Product.find()
          .limit(10)
          .populate('image', 'url name');

        const relatedFullProducts = await Promise.all(relatedProducts.map(async (product) => {
          const productBrands = await ProductBrand.findOne({ productId: product._id })
            .populate({
              path: 'brands',
              populate: { path: 'logo', select: 'url name' }
            });

          return {
            ...product.toObject(),
            brands: productBrands?.brands || []
          };
        }));

        res.status(404).json({
          message: 'Product not found.',
          data: [],
          related: relatedFullProducts
        });
        return;
      }

      // Get some related products
      const relatedProducts = await Product.find({
        name: { $not: { $regex: search as string, $options: 'i' } },
      }).limit(10).populate('image', 'url name');

      const relatedFullProducts = await Promise.all(relatedProducts.map(async (product) => {
        const productBrands = await ProductBrand.findOne({ productId: product._id })
          .populate({
            path: 'brands',
            populate: { path: 'logo', select: 'url name' }
          });

        return {
          ...product.toObject(),
          brands: productBrands?.brands || []
        };
      }));

      res.status(200).json({
        data: fullProducts,
        related: relatedFullProducts
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log("Update Product API");

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID.' });
        return;
      }

      const product = await Product.findById(id);
      if (!product) {
        res.status(404).json({ message: 'Product not found.' });
        return;
      }

      const { name, status, long_description, short_description, features, price, brands, rating, categories, imageUrls } = req.body;

      if (imageUrls && !Array.isArray(imageUrls)) {
        res.status(400).json({ message: 'imageUrls must be an array.' });
        return;
      }

      if (name) product.name = name;
      if (long_description) product.long_description = long_description;
      if (short_description) product.short_description = short_description;
      if (status) product.status = status;
      if (price) product.price = parseFloat(price);

      if (imageUrls && imageUrls.length > 0) {
        const mainImage = imageUrls[0];
        let imageExists = await Image.findOne({ url: mainImage.url });
        if (!imageExists) {
          imageExists = new Image({
            name: mainImage.name || `Image for ${name || product.name}`,
            url: mainImage.url
          });
          await imageExists.save();
        }
        product.image = imageExists._id;
      }

      await product.save();

      if (imageUrls && imageUrls.length > 0) {
        const existingProductImages = await ProductImage.findOne({ productId: product._id });

        const imageIds: Types.ObjectId[] = [];
        for (const imgData of imageUrls) {
          let img = await Image.findOne({ url: imgData.url });
          if (!img) {
            img = new Image({
              name: imgData.name || `Image for ${product.name}`,
              url: imgData.url
            });
            await img.save();
          }
          imageIds.push(img._id);
        }
        
        if (existingProductImages) {
          // If product images exist, update the imageUrl array
          existingProductImages.imageUrl = imageIds;
          await existingProductImages.save();
        } else {
          // If no existing product images, create a new one
          const productImages = new ProductImage({ productId: product._id, imageUrl: imageIds });
          await productImages.save();
        }
      }

      // Handle brands
      if (brands && brands.length > 0) {
        await ProductBrand.findOneAndDelete({ productId: product._id });

        const brandIds: Types.ObjectId[] = [];
        for (const brandData of brands) {
          let brand = await Brand.findOne({ name: brandData.name });
          if (!brand && brandData.logo) {
            let logoImage = await Image.findOne({ url: brandData.logo.url })
            if (!logoImage) {
              logoImage = new Image({
                name: brandData.logo.name || `Logo for ${brandData.name}`,
                url: brandData.logo.url
              });
              await logoImage.save()
            }
            brand = new Brand({
              name: brandData.name,
              logo: logoImage._id,
              site: brandData.site || ''
            });
            await brand.save();
          }
          if (brand) brandIds.push(brand._id);
        }

        if (brandIds.length > 0) {
          const productBrands = new ProductBrand({ productId: product._id, brands: brandIds });
          await productBrands.save();
        }
      }

      // Handle categories
      if (categories && categories.length > 0) {
        await ProductCategory.findOneAndDelete({ productId: product._id });

        const categoryIds: Types.ObjectId[] = [];
        for (const catData of categories) {
          const category = await Category.findById(catData._id || catData);
          if (category) categoryIds.push(category._id as Types.ObjectId);
        }

        if (categoryIds.length > 0) {
          const productCategories = new ProductCategory({ productId: product._id, categories: categoryIds });
          await productCategories.save();
        }
      }

      // Populate in-place
      await product.populate('image', 'url name');

      const productBrands = await ProductBrand.findOne({ productId: product._id })
        .populate({ path: 'brands', populate: { path: 'logo', select: 'url name' }});

      const productCategories = await ProductCategory.findOne({ productId: product._id })
        .populate({ path: 'categories', populate: { path: 'imageUrl', select: 'url name' }});

      const productImages = await ProductImage.findOne({ productId: product._id })
        .populate('imageUrl', 'url name');

      // Avoid duplicating main image in the images array
      const allImages = (productImages?.imageUrl || []).filter(
        (img: any) => !product.image || String(img._id) !== String(product.image._id)
      );

      const fullProduct = {
        ...product.toObject(),
        brands: productBrands?.brands || [],
        categories: productCategories?.categories || [],
        images: product.image ? [product.image, ...allImages] : allImages
      };

      res.status(200).json({ message: 'Product updated successfully.', product: fullProduct });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Delete Product API");
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID.' });
        return;
      }

      const product = await Product.findById(id);
      if (!product) {
        res.status(404).json({ message: 'Product not found.' });
        return;
      }

      // Delete all related records
      await ProductBrand.deleteMany({ productId: id });
      await ProductCategory.deleteMany({ productId: id });
      await ProductImage.deleteMany({ productId: id });

      // Finally delete the product
      await Product.findByIdAndDelete(id);

      res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default productController;