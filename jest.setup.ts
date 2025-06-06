import mongoose from 'mongoose';

beforeAll(async () => {
  const uri = process.env.MONGO_URL as string;
  await mongoose.connect(uri, {
    dbName: 'jest',
  });
});

jest.setTimeout(20000);

afterEach(async () => {
  // Clear all collections
  const collections = await mongoose?.connection?.db?.collections();
  for (let collection of collections!) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
