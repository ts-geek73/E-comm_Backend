import express from 'express';
import { OrderController } from '../controller';
import { userIdAndPermissionValidate } from '../middleware/productValidation';

const router = express.Router();

router.get('/invoice', OrderController.getOrderAndInvoiceFunction);
router.put('/cancel-return', userIdAndPermissionValidate() ,OrderController.cancelOrReturnOrderFunction);

export default router;
