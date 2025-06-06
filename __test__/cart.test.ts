import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import CartController from '../src/controller/cart';
import ShoppingCart from '../src/models/shoppingCart';

const app = express();
app.use(express.json());

app.get('/cart', CartController.getCart);
app.post('/cart/update', CartController.updateCart);
app.post('/cart/remove', CartController.removeItemfromCart);
app.post('/cart/clear', CartController.clearCart);

describe('CartController Integration', () => {
    const fakeProductId = new mongoose.Types.ObjectId();
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL!, {
            dbName: 'jest',
        });
    });

    afterEach(async () => {
        await ShoppingCart.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should return empty cart when none exists', async () => {
        const res = await request(app).get('/cart').query({ user_id: 'user1' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.cart).toEqual([]);
    });

    it('should update cart and add product', async () => {
        const res = await request(app).post('/cart/update').send({
            user_id: 'user1',
            products: [{ product_id: fakeProductId, qty: 2 }],

        });

        expect(res.statusCode).toBe(200);
        // expect(res.body.data.cart.length).toBe(1);
    });

    it('should remove item from cart', async () => {
        await new ShoppingCart({
            user_id: 'user2',
            products: [{ product_id: fakeProductId, qty: 1 }],
        }).save();

        const res = await request(app).post('/cart/remove').send({
            user_id: 'user2',
            product_id: fakeProductId,
        });

        expect(res.statusCode).toBe(200);
        // expect(res.body.data.cart.length).toBe(0);
    });

    it('should clear the cart', async () => {
        await new ShoppingCart({
            user_id: 'user3',
            products: [{ product_id: fakeProductId, qty: 2 }],
        }).save();

        const res = await request(app).post('/cart/clear').send({ user_id: 'user3' });
        expect(res.statusCode).toBe(200);
    });
});
