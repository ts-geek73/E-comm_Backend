import { Router } from 'express';
import stockController from '../controller/stock';
import { userIdAndPermissionValidate } from '../middleware/productValidation';
const router = Router();

router.post('/',
    userIdAndPermissionValidate(),
    stockController.addStock
);

router.get('/',
    stockController.getStockEntries
);

export default router;
