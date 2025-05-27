import { Request, Response } from 'express';
import stripe from '../service/stripe';

export const createCheckoutSession = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { products, finalPrice, email, coupons } = req.body.body;

        if (!products || !products.cart || !Array.isArray(products.cart)) {
            res.status(400).json({ message: 'Invalid products data' });
            return
        }

        const productLines = products.cart.map((item: {
            name: string;
            image: { url: string };
            price: number;
            qty: number;
        }) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.name,
                    images: [item.image.url],
                },
                unit_amount: item.price * 100,
            },
            quantity: item.qty,
        }));

        let discount: { coupon: string }[] = [];

        if (finalPrice && finalPrice > 0) {
            const discountAmount = products.totalPrice - finalPrice;

            if (discountAmount > 0) {
                const newCoupon = await stripe.coupons.create({
                    amount_off: Math.round(discountAmount * 100), // Convert to paisa
                    currency: 'inr',
                    duration: 'once',
                    name: 'Discount',
                });

                discount = [{ coupon: newCoupon.id }];
            }
        } else if (coupons?.length > 0) {
            discount = [{ coupon: coupons[0] }];
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: productLines,
            mode: 'payment',
            discounts: discount,
            customer_email: email,
            success_url: `${process.env.CLIENT_URL}/checkout/success`,
            cancel_url: `${process.env.CLIENT_URL}/checkout/fail`,
            metadata: {
                coupons: coupons.join(",")  // ✅ Now a valid string
            }
        });

        res.json({ session });
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

export default createCheckoutSession;
