import { Request, Response } from 'express';
import stripe from '../service/stripe';

export const createCheckoutSession = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { products, totalPrice } = req.body.body;

        if (!products) {
            res.status(400).json({ message: 'Invalid products data' });
            return
        }

        if (!totalPrice || totalPrice <= 0) {
            res.status(400).json({ message: 'Invalid total price' });
            return
        }
        console.log("pass 1");

        const productLines = products.cart.map((item: any) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price*100, 
            },
            quantity: item.qty,
        }));

        // const totalLine = {
        //     price_data: {
        //         currency: 'inr',
        //         product_data: {
        //             name: 'Total',
        //         },
        //         unit_amount: Math.round(totalPrice * 100), // final price
        //     },
        //     quantity: 1,
        // };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [...productLines],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/checkout/success`,
            cancel_url: `${process.env.CLIENT_URL}/checkout/fail`,
        });


        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ['card'],
        //     line_items: lineItems,
        //     mode: 'payment',
        //     success_url: `${process.env.CLIENT_URL}/checkout/success`,
        //     cancel_url: `${process.env.CLIENT_URL}/checkout/fail`,
        // });

        console.log("pass 1");


        res.json({ session });
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};


export default createCheckoutSession;
