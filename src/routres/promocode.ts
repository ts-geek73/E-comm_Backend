import express from 'express';
import { PromoCodeController } from '../controller';
import { userIdAndPermissionValidate } from '../middleware/productValidation';

const router = express.Router();

router.post('/',
    userIdAndPermissionValidate('promo.create'),
    PromoCodeController.createPromoCode
);
router.get('/', PromoCodeController.getPromoCodes);
router.put('/:id',
    userIdAndPermissionValidate('promo.update'),
    PromoCodeController.updatePromoCode
);
router.delete('/:id',
    userIdAndPermissionValidate('promo.delete'),
    PromoCodeController.deletePromoCode);

export default router;
