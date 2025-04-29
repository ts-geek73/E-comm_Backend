import { Request, Response } from 'express';
import Product from '../models/product';
import Brand from '../models/brand';
import Category from '../models/category'
import ImageURL from '../models/Image';


const productController = {
  createProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log('Backend Product create');
      let { name, description, price, brand, rating, features, category_id, imageUrl, stock } = req.body;

      if (!name || !description || !price || !category_id || !imageUrl || !stock) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }

      price = parseFloat(price);
      rating = parseFloat(rating);
      stock = parseInt(stock);

      if (price < 0 || stock < 0 || rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Invalid numeric values.' });
      }

      let brandId;
      if (brand) {
        let brandExists = await Brand.findOne({ name: brand });
        if (!brandExists) {
          brandExists = new Brand({ name: brand, count: 1 });
          await brandExists.save();
        } else {
          brandExists.count = (brandExists.count || 0) + 1;
          await brandExists.save();
        }
        brandId = brandExists._id;
      }

      let imageExists = await ImageURL.findOne({ url: imageUrl });
      if (!imageExists) {
        imageExists = new ImageURL({ name: `Image for ${name}`, url: imageUrl });
        await imageExists.save();
      }

      const productExist = await Product.findOne({ name });
      if (productExist) {
        productExist.set({
          name,
          description,
          price,
          rating,
          features,
          category_id,
          imageUrl: imageExists._id,
          brand: brandId,
          stock,
        });

        await productExist.save();

        return res.status(200).json({ message: 'Product updated successfully.' });
      }

      const newProduct = new Product({
        name,
        description,
        price,
        imageUrl: imageExists._id,
        brand: brandId,
        rating,
        features,
        category_id,
        stock,
      });

      await newProduct.save();

      return res.status(200).json({ message: 'Product created successfully.' });
    } catch (error: any) {
      console.error('Error creating product:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  getBrandsandCategory: async (req: Request, res: Response): Promise<Response> => {
    try {
      const brands = await Brand.find().sort({ name: 1 })
      const category = await Category.find({ parentCategory_id: { $ne: null } }).sort({ name: 1 })
      return res.status(200).json({ brand: brands, category: category })
    } catch (err) {
      return res.status(500).send("Internal Server Error")
    }
  },

  getAllProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log("Get App Api");

      const allProducts = await Product.find()
        .populate('brand', 'name')
        .populate('imageUrl', 'url')
        .populate('category_id', 'name')
        .sort({ name: 1 }) // Sort by name in ascending order



      return res.status(200).json(allProducts);
    } catch (error) {
      console.error('Error fetching all products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getLimitedProducts: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { start, length } = req.query;
      console.log("getLimitedProducts with start", start, ", length: ", length);

      const { brand, category, pricemin, pricemax, sort } = req.query;
      console.log("getLimitedProducts with brand", brand, ", category: ", category, ", pricemin: ", pricemin, ", pricemax: ", pricemax, ", sort: ", sort);

      if (!start || !length) {
        return res.status(400).json({ message: 'Start and length query parameters are required.' });
      }

      let filter: any = {};
      console.log("Filter : ", filter);
      
      if (brand && brand !== 'undefined') {
        const brandExists = await Brand.findOne({ _id: brand });
        if (!brandExists) {
          console.log("Brand not found");
          return res.status(400).json({ message: 'Brand not found.' });
        }
        console.log("Brand found");
        console.log("Brand : ", brandExists);

        filter.brand = brand;
      }
      console.log("Brand : ", brand);
      

      if (category && category !== 'undefined') {
        const categoryExists = await Category.findOne({ _id: category });
        if (!categoryExists) {
          console.log("Category not found");

          return res.status(400).json({ message: 'Category not found.' });
        }
        console.log("Category found");
        console.log("Category : ", categoryExists);
        filter.category_id = category;
      }
      console.log("Category : ", category);

      if (pricemin || pricemax ) {
        const filterPrice: any = {};
      
        // Handle pricemin
        if (pricemin && pricemin !== 'undefined'  ) {
          const priceMinNum = parseInt(pricemin as string, 10);
          if (isNaN(priceMinNum)) {
            return res.status(400).json({ message: 'Invalid price minimum value.' });
          }
          filterPrice.$gte = priceMinNum;
          console.log("Price Min found", priceMinNum);
        }
      
        // Handle pricemax
        if (pricemax && pricemax !== 'undefined' || 0 ) {
          const priceMaxNum = parseInt(pricemax as string, 10);
          if (isNaN(priceMaxNum)) {
            return res.status(400).json({ message: 'Invalid price maximum value.' });
          }
          filterPrice.$lte = priceMaxNum;
          console.log("Price Max found", priceMaxNum);
        }
      
        // If we have price filters, apply them
        if (Object.keys(filterPrice).length > 0) {
          filter.price = filterPrice;
        }
      }
      console.log("Price : ", filter.price);
      
      let sortBy: any = {};
      if (sort) {
        if (sort === 'name') {
          sortBy = { name: 1 }; 
        } else if (sort === 'price') {
          sortBy = { price: 1 }; 
        } else if (sort === 'rating') {
          sortBy = { rating: 1 }; 
        }
      }
      console.log("Filter : ", filter);


      const startNum = parseInt(start as string, 10) || 0;
      const lengthNum = parseInt(length as string, 10) || 10;
      console.log("StartNum : ", startNum);
      console.log("LengthNum : ", lengthNum);

      const limitedProducts = await Product.find(filter)
        .limit(lengthNum)
        .skip(startNum)
        .sort(sortBy)
        .populate('brand', 'name')
        .populate('imageUrl', 'url')
        .populate('category_id', 'name')
      // console.log("limited Dats : ", limitedProducts);

      const totalLength = await Product.countDocuments(filter);

      return res.status(200).json({ datas: limitedProducts, length: totalLength });
    } catch (error) {
      console.error('Error fetching limited products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getProductById: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      console.log("getProducts with Id", id);



      const product = await Product.findOne({ _id: id })
        .populate('brand', 'name')
        .populate('imageUrl', 'url').populate('category_id', 'name')
      // console.log("limited Dats : ", limitedProducts);

      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      const relatedProducts = await Product.find({ _id: { $ne: product._id }, category_id: product.category_id })
        .limit(3)
        .populate('brand', 'name')
        .populate('imageUrl', 'url')


      return res.status(200).json({ product, relatedProducts });
    } catch (error) {
      console.error('Error fetching limited products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  searchProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { search } = req.query;
      console.log("Search api with, search: ", search);


      if (!search) {
        return res.status(400).json({ message: 'Search query is required.' });
      }

      const products = await Product.find({
        name: { $regex: search as string, $options: 'i' },
      })
        .populate('brand', 'name')
        .populate('imageUrl', 'url')

      if (products.length === 0) {
        const relatedProducts = await Product.find().limit(10)
          .populate('brand', 'name')
          .populate('imageUrl', 'url')
        return res.status(404).json({ message: 'Product not found.', data: [], related: relatedProducts });
      }

      let relatedProducts: any[] = [];

      if (products.length > 0 && products[0].category_id) {
        relatedProducts = await Product.find({
          name: { $not: { $regex: search, $options: 'i' } },
        }).limit(10)
          .populate('brand', 'name')
          .populate('imageUrl', 'url')
      }

      return res.status(200).json({ data: products, related: relatedProducts });
    } catch (error) {
      console.error('Error searching products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log("Update Product API");
      const { id } = req.params; // Correctly extract product id from params
      console.log("Update Product : ", id);
      const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true }); // Update the product

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      return res.status(200).json({ message: 'Product updated successfully.', product: updatedProduct });
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log("Delete Product API");
      const { id } = req.params;

      const deletedProduct = await Product.findById(id);
      if (!deletedProduct) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      await Product.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

};

export default productController;
