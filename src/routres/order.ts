import express from 'express';
import { OrderController } from '../controller';

const router = express.Router();

router.get('/invoice', OrderController.getOrderAndInvoiceFunction);

// router.post('/invoice/sync',  async (req, res) => {
//   const result = await OrderController.syncStripeInvoices();
//   if (result.success) {
//     res.status(200).json({ message: result.message });
//   } else {
//     res.status(500).json({ message: result.message, error: result.error });
//   }
// });

export default router;
