import { Router } from 'express';
import { upload } from '../service/multer';
import { ReviewsController } from '../controller';

const router = Router();

router.get('/:id/user/:user_id', ReviewsController.getProductReview);
router.post('/:id/user/:user_id',upload.array('images', 12),  ReviewsController.createProductReview  );
router.put('/:id/user/:user_id', upload.array('images', 12), ReviewsController.updateProductReview  );
router.delete('/:id/user/:user_id', ReviewsController.deleteProductReview  );
export default router;