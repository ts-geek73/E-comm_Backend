import { Request, Response } from 'express';
import { IRequestHandler as IProductRequestHandler } from '../types';
import { Product , Image , User, Review, ReviewImages, } from '../models';

export const ReviewsController: IProductRequestHandler = {
   createProductReview: async (req: Request, res: Response): Promise<void> => {
      try {
         console.log("create Product Review Api");

         const { id, user_id } = req.params;
         const { rate, description, images } = req.body;
         console.log(req.body);
         

         if (!id) {
            res.status(400).json({ message: 'Product ID is missing' });
            return;
         }

         if (!user_id) {
            res.status(400).json({ message: 'User ID is missing' });
            return;
         }

         if (!rate || !description || !images || images.length === 0) {
            res.status(400).json({ message: 'Some fields are missing' });
            return;
         }
         
         if (rate && rate > 5) {
            res.status(400).json({ message: 'Rate Should be Less than 5' });
            return;
         }

         const productExist = await Product.findById(id);
         if (!productExist) {
            res.status(404).json({ message: 'Product does not exist' });
            return;
         }

         const userExist = await User.findOne({ userId: user_id });
         if (!userExist) {
            res.status(404).json({ message: 'User does not exist' });
            return;
         }

         const newReview = new Review({
            user_id,
            product_id: id,
            rate,
            description,
         });

         await newReview.save();

         const savedImageDocs = await Promise.all(
            images.map(async (url: string, index: number) => {
               const imageExist = await Image.findOne({ url });
               if (!imageExist) {
                  const imageDoc = new Image({
                     url,
                     name: `product_${id}_user_${user_id}_${index + 1}`,
                  });
                  return await imageDoc.save();
               } else {
                  return imageExist;
               }
            })
         );

         // Save reference to ReviewImages
         const reviewImage = new ReviewImages({
            product_id: id,
            user_id,
            review_images: savedImageDocs.map((img) => img._id),
         });

         await reviewImage.save();
         console.log("Review created successfully");

         res.status(201).json({ message: 'Review created successfully' });
         return;
      } catch (error: any) {
         console.error('Error creating product Review:', error);
         res.status(500).json({ message: 'Internal server error', error: error.message });
         return;
      }
   },
   getProductReview: async (req: Request, res: Response): Promise<void> => {
      try {
         const { id, user_id } = req.params;
   
         if (!id || !user_id) {
            res.status(400).json({ message: 'Product ID or User ID is missing' });
            return;
         }
   
         const reviews = await Review.find({ product_id: id });
   
         if (!reviews || reviews.length === 0) {
            res.status(404).json({ message: 'No reviews found for this product' });
            return;
         }
   
         // Fetch review images
         const reviewImageDocs = await ReviewImages.find({ product_id: id }).populate('review_images');
   
         // Merge reviews with images
         const reviewsWithImages = reviews.map((review: any) => {
            const reviewImageDoc = reviewImageDocs.find((imgDoc) => imgDoc.product_id.toString() === review.product_id.toString());
            return {
               ...review.toObject(), // Only convert individual review objects to plain objects
               images: reviewImageDoc?.review_images || [],
            };
         });
   
         res.status(200).json({ reviews: reviewsWithImages });
         return;
      } catch (error: any) {
         console.error('Error fetching product reviews:', error);
         res.status(500).json({ message: 'Internal server error', error: error.message });
         return;
      }
   },
   

   updateProductReview: async (req: Request, res: Response): Promise<void> => {
      try {
         const { id, user_id } = req.params;
         const {  rate, description, images } = req.body;

         if (!id || !user_id) {
            res.status(400).json({ message: 'Product ID or User ID is missing' });
            return;
         }

         const review = await Review.findOne({ product_id: id, user_id });

         if (!review) {
            res.status(404).json({ message: 'Review not found for this product and user' });
            return;
         } else {
            review.rate = rate || review.rate;
            review.description = description || review.description;
            await review.save();
         }

         const savedImageDocs = await Promise.all(
            images.map(async (url: string, index: number) => {
               const imageExist = await Image.findOne({ url });
               if (!imageExist) {
                  const imageDoc = new Image({
                     url,
                     name: `product_${id}_user_${user_id}_${index + 1}`,
                  });
                  return await imageDoc.save();
               } else {
                  return imageExist;
               }
            })
         );

         // Update ReviewImages reference
         const reviewImage = await ReviewImages.findOne({ product_id: id, user_id });
         if (reviewImage) {
            reviewImage.review_images = savedImageDocs.map((img) => img._id);
            await reviewImage.save();
         }

         res.status(200).json({ message: 'Review updated successfully' });
         return;
      } catch (error: any) {
         console.error('Error updating product review:', error);
         res.status(500).json({ message: 'Internal server error', error: error.message });
         return;
      }
   },
   
   deleteProductReview: async (req: Request, res: Response): Promise<void> => {
      try {
         const { id, user_id } = req.params;
         
         if (!id || !user_id) {
            res.status(400).json({ message: 'Product ID or User ID is missing' });
            return;
         }

         const review = await Review.findOneAndDelete({ product_id: id, user_id });

         if (!review) {
            res.status(404).json({ message: 'Review not found for this product and user' });
            return;
         }
         
         await ReviewImages.findOneAndDelete({ product_id: id, user_id });

         res.status(200).json({ message: 'Review deleted successfully' });
         return;
      } catch (error: any) {
         console.error('Error deleting product review:', error);
         res.status(500).json({ message: 'Internal server error', error: error.message });
         return;
      }
   }
};