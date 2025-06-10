import { Router } from 'express';
import { CartController } from '../controller';
import { userIdAndPermissionValidate } from '../middleware/productValidation';

const router = Router()
router.get("/" , CartController.getCart )

router.put("/" , userIdAndPermissionValidate() , CartController.updateCart )

router.delete("/item" , userIdAndPermissionValidate() , CartController.removeItemfromCart )
router.delete("/" , userIdAndPermissionValidate() , CartController.clearCart )

export default router