import { Router } from 'express';
import CartControoler from '../controller/cart';
import { userIdValidate } from '../middleware/productValidation';

const router = Router()
router.get("/" , CartControoler.getCart )

router.put("/" , userIdValidate , CartControoler.updateCart )

router.delete("/item" , userIdValidate , CartControoler.removeItemfromCart )
router.delete("/" , userIdValidate , CartControoler.clearCart )

export default router