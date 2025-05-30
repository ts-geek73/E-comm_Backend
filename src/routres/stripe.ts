import express from 'express';
import { stripeController } from '../controller';

const router = express.Router();

router.post('/create-checkout-session', stripeController.createCheckoutSession);

export default router;
