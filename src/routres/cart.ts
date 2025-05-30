import { Router } from 'express';
import { userIdValidate } from '../middleware/productValidation';
import { CartController } from '../controller';

const router = Router()
router.get("/" , CartController.getCart )

router.put("/" , userIdValidate , CartController.updateCart )

router.delete("/item" , userIdValidate , CartController.removeItemfromCart )
router.delete("/" , userIdValidate , CartController.clearCart )

export default router