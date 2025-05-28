import { Request, Response } from 'express';
import stripe from '../service/stripe';
import { IOrder, IRequestHandler } from '../types';
import Stripe from 'stripe';
import { Order, ShoppingCart } from '../models';
const endpointSecret = process.env.STRIPE_WEBHOOK_KEY;

const stripeController: IRequestHandler = {
    createCheckoutSession: async (req: Request, res: Response): Promise<void> => {
        try {
            const { products, finalPrice, email, coupons, billing, shipping } = req.body.body;

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

            const newOrder = new Order({
                email,
                billing_address: billing._id,
                shipping_address: shipping._id,
                amount: finalPrice * 100,
                status: 'pending',
                items: products.cart.map((item: { _id: string; qty: number; notes: string; }) => ({
                    product_id: item._id,
                    qty: item.qty,
                    notes: item.notes ?? "",
                })),
            })

            await newOrder.save();
            const orderId = newOrder._id as string

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: productLines,
                mode: 'payment',
                discounts: discount,
                customer_email: email,
                success_url: `${process.env.CLIENT_URL}/checkout/success?order=${newOrder._id}`,
                cancel_url: `${process.env.CLIENT_URL}/checkout/fail`,
                invoice_creation: {
                    enabled: true, 
                },
                metadata: {
                    coupons: (coupons && coupons.length > 0) ? coupons.join(",") : "",
                    orderId: orderId.toString(),
                    billing: JSON.stringify(billing),
                    cartId: products.cartId.toString(),
                    shipping: JSON.stringify(shipping),
                }
            });

            newOrder.session_id = session.id;
            await newOrder.save();

            res.json({ session });
        } catch (error) {
            console.error('Stripe Error:', error);
            res.status(500).json({ message: 'Something went wrong' });
        }
    },

    webhookCall: async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'] as string;
        console.log("webhook call");

        if (!sig) {
            console.log('❌ No Stripe-Signature header found');
            res.sendStatus(400);
            return
        }

        if (!endpointSecret) {
            res.status(500).send("Missing Stripe webhook secret");
            return;
        }



        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

            console.log('✅ Event received:', event.type);

            switch (event.type) {
                case "checkout.session.async_payment_succeeded": {
                    console.log("Webhook Trigger:=", event.type,);
                    break;
                }
                case "checkout.session.completed": {
                    const session = event.data.object as Stripe.Checkout.Session;

                    const customerEmail = session.customer_email;
                    const metadata = session.metadata;

                    if (!metadata) {
                        console.warn("No metadata in session");
                        res.status(400).send("Missing metadata");
                        return
                    }

                    const { billing, shipping, coupons, cartId, orderId } = metadata;
                    const order = await Order.findById(orderId);


                    const billingParsed = typeof billing === 'string' ? JSON.parse(billing) : billing;
                    const shippingParsed = typeof shipping === 'string' ? JSON.parse(shipping) : shipping;
                    // const couponParse = coupons.split(",")

                    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                        limit: 100,
                    });

                    if (lineItems && billingParsed._id && shippingParsed._id && order) {
                        order.status = 'complete';
                        order.amount = session.amount_total ? session.amount_total / 100 : 0;
                        await order.save();

                        await ShoppingCart.findByIdAndDelete(cartId)


                    }

                    break;
                }
                case "checkout.session.expired": {
                    const data = event.data.object
                    console.log("Webhook Trigger:=", event.type,);
                    break;
                }
                default:
                    // console.log("Webhook Trigger:=",event.type, data);
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.sendStatus(200);
        } catch (err: any) {
            console.error('❌ Error verifying webhook:', err);
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

}

export default stripeController;
