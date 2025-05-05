import { Router } from 'express';
import { ReviewsController } from '../controller/reviews';

const router = Router();

router.get('/:id/user/:user_id', ReviewsController.getProductReview);
router.post('/:id/user/:user_id', ReviewsController.createProductReview  );
router.put('/:id/user/:user_id', ReviewsController.updateProductReview  );
router.delete('/:id/user/:user_id', ReviewsController.deleteProductReview  );
export default router;