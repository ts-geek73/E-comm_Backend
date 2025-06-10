import { Router } from 'express';
import { upload } from '../service/multer';
import { ReviewsController } from '../controller';
import { userIdAndPermissionValidate } from '../middleware/productValidation';

const router = Router();

router.get('/:id/user/:userId', ReviewsController.getProductReview);

router.post('/:id/user/:userId',
    userIdAndPermissionValidate('review.create'),
    upload.array('images', 12),
    ReviewsController.createProductReview
);
router.put('/:id/user/:userId',
    userIdAndPermissionValidate('review.update'),
    upload.array('images', 12),
    ReviewsController.updateProductReview
);
router.delete('/:id/user/:userId',
    userIdAndPermissionValidate('review.delete'),
    ReviewsController.deleteProductReview
);
export default router;