import { Request, Response } from 'express';
import path from 'path';
import { findOrCreateImage, getAbsoluteImageUrl, removeImageFile } from '../functions/image';
import { Product, Review, ReviewImages, User } from '../models';
import { IImage, IRequestHandler as IProductRequestHandler, IReviewImages } from '../types';

export const ReviewsController: IProductRequestHandler = {
   createProductReview: async (req: Request, res: Response): Promise<void> => {
      try {
         console.log("Create Product Review API");

         const { id, user_id } = req.params;
         const { rate, description } = req.body;
         console.log(req.body);

         // Files uploaded through multer
         const uploadedFiles = req.files as Express.Multer.File[];

         if (!id) {
            res.status(400).json({ message: 'Product ID is missing' });
            return;
         }

         if (!user_id) {
            res.status(400).json({ message: 'User ID is missing' });
            return;
         }

         if (!rate || !description || !uploadedFiles || uploadedFiles.length === 0) {
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

         // Create image documents from uploaded files
         const imageIds = await Promise.all(
            uploadedFiles.map(async (file, index) => {
               const imageUrl = `/uploads/procudts/${file.filename}`;
               const imageName = `product_${id}_user_${user_id}_${index + 1}`;
               return await findOrCreateImage(imageUrl, imageName);
            })
         );

         // Save reference to ReviewImages
         const reviewImage = new ReviewImages({
            product_id: id,
            user_id,
            review_images: imageIds,
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
        console.log("Product Review Call with Product Id ", req.params.id);
    
        const { id, user_id } = req.params;
    
        if (!id) {
          res.status(400).json({ message: 'Product ID is missing' });
          return;
        }
    
        let userReviews: any[] = [];
        let otherReviews: any[] = [];
    
        if (user_id) {
          userReviews = await Review.find({ product_id: id, user_id });
          otherReviews = await Review.find({ product_id: id, user_id: { $ne: user_id } });
        } else {
          // No user_id provided, get all reviews
          userReviews = await Review.find({ product_id: id });
        }
    
        if (userReviews.length === 0 && otherReviews.length === 0) {
          res.status(404).json({ message: 'No reviews found for this product' });
          return;
        }
    
        // Fetch review images for the product
        const reviewImageDocs = await ReviewImages.find({ product_id: id }).populate('review_images');
    
        const getReviewImages = (reviewUserId: string): IImage[] => {
          const reviewImageDoc = reviewImageDocs.find(
            imgDoc =>
              imgDoc.product_id.toString() === id &&
              imgDoc.user_id.toString() === reviewUserId
          );
    
          if (!reviewImageDoc || !reviewImageDoc.review_images) return [];
    
          return (reviewImageDoc.review_images as unknown as IImage[]).map((img: IImage) => ({
            ...img,
            url: getAbsoluteImageUrl(req, img.url),
          }));
        };
    
        const getUserInfo = async (id: string) => {
          const user = await User.findOne({ userId: id });
          return user ? user.email : "customer";
        };
    
        // Process a review list with images and user email
        const processReviews = async (reviews: any[]) => {
          return await Promise.all(
            reviews.map(async (review: any) => {
              const email = await getUserInfo(review.user_id.toString());
              return {
                ...review.toObject(),
                email,
                images: getReviewImages(review.user_id.toString()),
              };
            })
          );
        };
    
        const processedUserReviews = await processReviews(userReviews);
        const processedOtherReviews = await processReviews(otherReviews);
    
        console.log("Review Success");
    
        res.status(200).json({
          reviews: processedUserReviews,
          otherReviews: user_id ? processedOtherReviews : [],
        });
    
      } catch (error: any) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    },
    

   updateProductReview: async (req: Request, res: Response): Promise<void> => {
      try {
         console.log("Update Review Call");

         const { id, user_id } = req.params;
         const { rate, description } = req.body;

         console.log("Body", req.body, id, user_id);

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
         }

         console.log("Pass review");

         const uploadedFiles = req.files as Express.Multer.File[];

         if (uploadedFiles && uploadedFiles.length > 0) {
            const existingReviewImages = await ReviewImages.findOne({ product_id: id, user_id })
               .populate('review_images');

            const imageIds = await Promise.all(
               uploadedFiles.map(async (file, index) => {
                  const imageUrl = `/uploads/products/${file.filename}`;
                  const imageName = `product_${id}_user_${user_id}_${index + 1}`;
                  return await findOrCreateImage(imageUrl, imageName);
               })
            );

            // Update review images
            let reviewImage = await ReviewImages.findOne({ product_id: id, user_id });
            if (reviewImage) {
               // Optionally remove old image files if needed
               if (existingReviewImages && existingReviewImages.review_images) {
                  existingReviewImages.review_images.forEach((img: any) => {
                     if (!img.url.startsWith('http')) {
                        // Convert relative path to absolute file path
                        const filePath = path.join(process.cwd(), 'public', img.url);
                        removeImageFile(filePath);
                     }
                  });
               }

               reviewImage.review_images = imageIds;
               await reviewImage.save();
            } else {
               // Create new review images if not found
               reviewImage = new ReviewImages({
                  product_id: id,
                  user_id,
                  review_images: imageIds,
               });
               await reviewImage.save();
            }
         }

         await review.save();

         res.status(200).json({ message: 'Review updated successfully' });
         console.log('Review updated successfully');

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

         const reviewImages = await ReviewImages.findOne({ product_id: id, user_id })
            .populate('review_images');

         if (reviewImages) {
            // Delete physical image files
            reviewImages.review_images.forEach((img: any) => {
               if (!img.url.startsWith('http')) {
                  const filePath = path.join(process.cwd(), 'public', img.url);
                  removeImageFile(filePath);
               }
            });

            await ReviewImages.findByIdAndDelete(reviewImages._id);
         }

         res.status(200).json({ message: 'Review deleted successfully' });
         return;
      } catch (error: any) {
         console.error('Error deleting product review:', error);
         res.status(500).json({ message: 'Internal server error', error: error.message });
         return;
      }
   }
};