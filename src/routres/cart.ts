import { Router } from 'express';
import CartControoler from '../controller/cart';
import { userValidate } from '../middleware/productValidation';

const router = Router()
router.get("/" , CartControoler.getCart )

router.put("/" , userValidate , CartControoler.updateCart )

router.delete("/item" , userValidate , CartControoler.removeItemfromCart )
router.delete("/" , userValidate , CartControoler.clearCart )

export default router