import { Request, Response } from 'express';
import Product from '../models/product';
import Brand from '../models/brand';
import ImageURL from '../models/Image';

const productController = {
  createProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log('Backend Product create');
      let { name, description, price, brand, rating, features, category_id, parentCategory_id, imageUrl, stock } = req.body;
      console.log("Back Body : ", req.body);

      if (!name || !description || !price || !brand || !category_id || !parentCategory_id || !imageUrl || !stock) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }


      price = parseFloat(price);
      rating = parseFloat(rating);
      stock = parseInt(stock);

      if (price < 0 || stock < 0 || rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Invalid numeric values.' });
      }

      const productExist = await Product.findOne({ name });
      if (productExist) {
        productExist.set({
          name,
          description,
          price,
          brand,
          rating,
          features,
          category_id,
          parentCategory_id,
          imageUrl,
          stock,
        });

        await productExist.save();

        return res.status(200).json({ message: 'Product Update successfully.' });
      }

      // if (typeof name !== 'string' || typeof description !== 'string' || typeof brand !== 'string' || typeof imageUrl !== 'string' || !Array.isArray(features)) {
      //   return res.status(400).json({ message: 'Invalid data types.' });
      // }


      const newProduct = new Product({
        name,
        description,
        price,
        brand,
        rating,
        features,
        category_id,
        parentCategory_id,
        imageUrl,
        stock,
      });

      await newProduct.save();

      return res.status(200).json({ message: 'Product created successfully.' });
    } catch (error: any) {
      console.error('Error creating product:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  getAllProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      const allProducts = await Product.find();

      if (allProducts.length === 0) {
        return res.status(404).json({ message: 'No products found.' });
      }

      return res.status(200).json(allProducts);
    } catch (error) {
      console.error('Error fetching all products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  getLimitedProducts: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { start, length } = req.query;

      const startNum = parseInt(start as string, 10) || 0;
      const lengthNum = parseInt(length as string, 10) || 10;

      const limitedProducts = await Product.find().limit(lengthNum).skip(startNum).sort({ createdAt: -1 });
      const totalLength = await Product.countDocuments();

      return res.status(200).json({ datas: limitedProducts, length: totalLength });
    } catch (error) {
      console.error('Error fetching limited products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  serachProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { search } = req.query;

      if (!search) {
        return res.status(400).json({ message: 'Search query is required.' });
      }

      const products = await Product.find({
        name: { $regex: search as string, $options: 'i' },
      });

      if (products.length === 0) {
        const relatedProducts = await Product.find().limit(10)
        console.log("Related := ", relatedProducts.length)
        return res.status(404).json({ message: 'Product not found.', data: [], related: relatedProducts });
      }
      console.log("Product Length: =", products.length);
      
      let relatedProducts: any[] = [];
      // console.log(products);

      if (products.length > 0 && products[0].category_id) {
        console.log("Category ID from product:", products[0].category_id);
        console.log("Search Term:", search);

        relatedProducts = await Product.find({
          name: { $not: { $regex: search, $options: 'i' } },          
        }).limit(10);

        console.log("Related := ", relatedProducts.length)
      } else {
        console.log('Category ID not found, or no products found');
      }

      return res.status(200).json({ data: products, related: relatedProducts });
    } catch (error) {
      console.error('Error searching products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      const products = await Product.find(); // Use Product.find()

      const updatePromises = products.map(async (product) => {
        console.log('Brand (before):', product.brand);
        console.log('Product:', product);
        let brandName = product.brand;
        console.log('Brand (after):', brandName);
  
        if (!brandName) {
          console.log('Brand name is empty, skipping product:', product.name);
          return;
        }
  
        console.log('Searching for brand:', brandName);
        let brand = await Brand.findOne({ name: brandName });
  
        if (!brand) {
          brand = await Brand.findOne({
            name: { $regex: new RegExp(`^${brandName}$`, 'i') }, // Correct regex
          });
          if (!brand) {
            brand = new Brand({
              name: brandName,
              logo: 'https://plus.unsplash.com/premium_photo-1669077047180-9628d4e1efc6',
              count: 1,
            });
            await brand.save();
          }
        } else {
          brand.count += 1;
          await brand.save();
        }
  
        let imageUrl = await ImageURL.findOne({ url: product.imageUrl });
  
        if (!imageUrl) {
          imageUrl = new ImageURL({
            name: product.name,
            url: product.imageUrl,
          });
          await imageUrl.save();
        }
  
        product.brand_id = brand._id;
        product.imageUrl = imageUrl._id;
        await product.save();
  
        console.log(`Product updated: ${product.name}`);
      });
  
      await Promise.all(updatePromises);
      console.log('Products update completed.');
      console.log('Database update completed.');
      return res.status(200).json({ message: 'Product updated successfully.' });
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const deletedProduct = await Product.findByIdAndDelete(id);

      if (!deletedProduct) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      return res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default productController;
