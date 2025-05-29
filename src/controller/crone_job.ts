import { PromoCode } from "../models";
import stripe from "../service/stripe";
import { deleteStripeIds } from "./promocode";

const CroneJobController = {
    syncCoupons :  async () => {
        console.log('🕒 Syncing local promo codes to Stripe...');

        const unsyncedCodes = await PromoCode.find({
            stripeCouponId: { $eq: null }
        });
        console.log(unsyncedCodes);


        for (const promo of unsyncedCodes) {
            try {
                const stripeCoupon = await stripe.coupons.create({
                    name: promo.code,
                    duration: promo.type === 'percentage' ? 'forever' : 'once',
                    currency: 'inr',
                    amount_off: promo.type === 'flat' ? Math.round(promo.amount * 100) : undefined,
                    percent_off: promo.type === 'percentage' ? promo.amount : undefined,
                    redeem_by: promo.expiryDate ? Math.floor(new Date(promo.expiryDate).getTime() / 1000) : undefined,
                });

                promo.stripeCouponId = stripeCoupon.id;
                await promo.save();

                console.log(`✅ Synced promo code: ${promo.code}`);
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'message' in err) {
                    console.error(`❌ Failed to sync ${promo.code}:`, (err as { message: string }).message);
                } else {
                    console.error(`❌ Failed to sync ${promo.code}: Unknown error`, err);
                }
            }

        }
    }
}

export default CroneJobController