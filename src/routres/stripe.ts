import express from 'express';
import createCheckoutSession from "../controller/stripe"

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);

export default router;
