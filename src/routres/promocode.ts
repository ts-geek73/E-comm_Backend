import express from 'express';
import { PromoCodeController } from '../controller';

const router = express.Router();

router.post('/', PromoCodeController.createPromoCode);
router.get('/', PromoCodeController.getPromoCodes);
router.put('/:id', PromoCodeController.updatePromoCode);
router.delete('/:id', PromoCodeController.deletePromoCode);

export default router;
