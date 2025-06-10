import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import request from 'supertest';
import { app, closeDatabase, connect } from '../jest.setup';
import { Product, User, WhishList } from '../src/models';

describe('Product Endpoints', () => {

    beforeAll(async () => {
        await connect();

        const dummyUser = await User.create({
            clerkId: 'user_2to1ikz0GlZxmlEr2yz9ZSY3f2W',
            sessionId: 'sess_test123',
            userId: 'user_test456',
            name: 'Test User',
            email: 'test@example.com',
            roles_id: [],
        });

        await WhishList.create({
            user_id: dummyUser._id,
            productIds: [new mongoose.Types.ObjectId()],
        });
    })

    afterAll(async () => {
        const user = await User.findOne({ userId: "user_test456" })
        await WhishList.findOneAndDelete({ user_id: user?._id })
        await User.deleteOne({ userId: 'user_test456' })
        await closeDatabase();
    });

    describe('Product CRUD', () => {
        const fakeProduct = {
            name: faker.commerce.productName().toString(),
            short_description: faker.commerce.productDescription(),
            long_description: faker.lorem.paragraphs(2),
            price: parseFloat(faker.commerce.price().toString()),
            status: 'true',
            brands: JSON.stringify([{
                _id: faker.database.mongodbObjectId(),
                name: faker.company.name(),
            }]),
            categories: JSON.stringify([
                faker.database.mongodbObjectId(),
            ]),
            imageFiles: Array.from({ length: 2 }, () => ({
                fileName: faker.system.fileName(),
                fileExtension: faker.system.fileExt(),
                mimeType: faker.system.mimeType(),
                filePath: faker.system.filePath()
            }))
        };


        const fakeProduct2 = {
            name: faker.commerce.productName().toString(),
            short_description: faker.commerce.productDescription(),
            long_description: faker.lorem.paragraphs(2),
            price: parseFloat(faker.commerce.price().toString()),
            status: 'true',
            brands: JSON.stringify([{
                _id: faker.database.mongodbObjectId(),
                name: faker.company.name(),
            }]),
            categories: JSON.stringify([
                { "_id": faker.database.mongodbObjectId() }
            ]),
            imageFiles: Array.from({ length: 2 }, () => ({
                fileName: faker.system.fileName(),
                fileExtension: faker.system.fileExt(),
                mimeType: faker.system.mimeType(),
                filePath: faker.system.filePath()
            }))
        };



        it('should GET all products', async () => {
            const res = await request(app).get('/product');
            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('data');
            expect(Array.isArray(res.body.data.data)).toBe(true);
            expect(Number.isInteger(res.body.data.length)).toBe(true);
        }, 15000);

        it('should handle search conditionally based on product availability', async () => {
            const searchQuery = 'techstaunch';
            const res = await request(app).get(`/product?search=${searchQuery}`);

            // If products are found
            if (res.statusCode === 200) {
                expect(res.body.data).toHaveProperty('data');
                expect(Array.isArray(res.body.data.data)).toBe(true);
                expect(Array.isArray(res.body.data.related)).toBe(true);
            }

            // If no products are found
            else if (res.statusCode === 404) {
                expect(res.body).toHaveProperty('message', 'Product not found');
                expect(res.body.details).toContain(searchQuery);
            }

            // Any other unexpected status code
            else {
                throw new Error(`Unexpected status code: ${res.statusCode}`);
            }
        });

        it('should GET brands and categories', async () => {
            const res = await request(app).get('/product/combos');
            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('brands');
            expect(res.body.data).toHaveProperty('categories');
        });

        it('should return 404 for non-existing product ID', async () => {
            const fakeId = '60e6c5f4a3cbe024d8a1c9a7';
            const res = await request(app).get(`/product/${fakeId}`);
            expect(res.statusCode).toBe(404);
        });

        // Create Product

        it('should create a new product successfully', async () => {
            // console.log("Fake Product", fakeProduct);

            const res = await request(app)
                .post('/product/create')
                .set('Accept', 'application/json')
                .set('Content-Type', 'multipart/form-data')
                .field('name', fakeProduct.name)
                .field('short_description', fakeProduct.short_description)
                .field('long_description', fakeProduct.long_description)
                .field('price', fakeProduct.price.toString())
                .field('status', fakeProduct.status.toString())
                .field('brands', fakeProduct.brands)
                .field('categories', fakeProduct.categories)
                .field('imageFiles', fakeProduct.imageFiles[0].filePath, fakeProduct.imageFiles[0].fileName);


            console.log("🚀 ~ it ~ res.body:", res.body)
            // expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('product');
            expect(res.body.message).toMatch(/product (created|updated) successfully/i);
        });

        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/product/create')
                .send({})
                .set('Accept', 'application/json');

            console.log("🚀 ~ should return 400 for missing required fields ~ res.body:", res.body)
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty("details");
            expect(res.body.details).toBe("Validation error");
        });

        it('should return 400 for invalid category format', async () => {
            const res = await request(app)
                .post('/product/create')
                .set('Accept', 'application/json')
                .set('Content-Type', 'multipart/form-data')
                .field('name', fakeProduct2.name)
                .field('short_description', fakeProduct2.short_description)
                .field('long_description', fakeProduct2.long_description)
                .field('price', fakeProduct2.price.toString())
                .field('status', fakeProduct2.status.toString())
                .field('brands', fakeProduct2.brands)
                .field('imageFiles', fakeProduct2.imageFiles[0].filePath, fakeProduct2.imageFiles[0].fileName)
                .set('Accept', 'application/json');
            console.log("should return 400 for invalid category format",res.body);


            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch("At least one category is required");
        });
        // Update Product

        it('Update Product', async () => {


            // const data = await Product.create({
            //     image:fakeProduct?.imageFiles
            // })
            const data = await Product.findOne({ name: fakeProduct.name });
            const res = await request(app)
                .put(`/product/update/${data?._id}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'multipart/form-data')
                .field('name', fakeProduct.name)
                .field('short_description', fakeProduct.short_description)
                .field('long_description', fakeProduct.long_description)
                .field('price', fakeProduct.price.toString())
                .field('status', fakeProduct.status)
                .field('brands', fakeProduct.brands)
                .field('imageFiles', fakeProduct.imageFiles[0].filePath, fakeProduct.imageFiles[0].fileName)
                .field('categories', fakeProduct.categories);

            console.log("🚀 ~ it ~ res.body:", res.body)
            expect(res.statusCode).toBe(200);
        });
        // delete Product
    })

    describe('Product Whish List', () => {
        it('should return 404 for non-existing User WhishList', async () => {
            const fakeUserId = '60e6c5f4a3cbe024d8a1c9a7';
            const res = await request(app).get(`/users/whishlist?user_id=${fakeUserId}`);
            expect(res.statusCode).toBe(404);
        });

        it('should return productIds User WhishList', async () => {
            const userId = 'user_test456';
            // this is original id but not use a Differebnt DB
            const res = await request(app).get(`/users/whishlist?user_id=${userId}`);

            if (res.statusCode === 200) {
                expect(res.body.data).toHaveProperty('productIds');
                expect(Array.isArray(res.body.data.productIds)).toBe(true);
            }
            else {
                throw new Error(`Unexpected status code: ${res.statusCode}`);
            }
        });
    })

});
