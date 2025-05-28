// routes/order.ts
import express, { Request, Response } from 'express';
import { Order } from '../models';
import stripe from '../service/stripe';
import Stripe from 'stripe';

const router = express.Router();

const dataFunction = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    try {
        console.log("come request");

        const order = await Order.findById(orderId).populate([
            { path: 'billing_address' },
            { path: 'shipping_address' },
        ]);

        if (!order || !order.session_id) {
            res.status(404).json({ message: 'Order or session not found' });
            return;
        }
        // console.log(order);


        const session: Stripe.Checkout.Session = await stripe.checkout.sessions.retrieve(order.session_id);
        // console.log(session);
        const chargesList = await stripe.charges.list({
            payment_intent: session.payment_intent as string,
            limit: 1,
        });
        console.log(chargesList);

        const receiptUrl = chargesList.data[0]?.receipt_url;

        res.status(200).json({ receiptUrl, order });

    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ message: 'Failed to fetch invoice' });
    }
};


router.get('/invoice/:orderId', dataFunction);

export default router;
