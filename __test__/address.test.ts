import request from 'supertest';
import CartController from '../src/controller/address'; // adjust path
import { Address } from '../src/models';
import express from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../src/functions/product';

jest.mock('../src/models', () => ({
  Address: {
    findOne: jest.fn(),
  },
}));

jest.mock('../src/functions/product', () => ({
  sendErrorResponse: jest.fn((res, msg, code = 500) => {
    res.status(code).json({ success: false, message: msg });
  }),
  sendSuccessResponse: jest.fn((res, data, msg = 'Success', code = 200) => {
    res.status(code).json({ success: true, message: msg, data });
  }),
}));

const app = express();
app.use(express.json());

app.get('/address', CartController.getAddresses);
app.delete('/address', CartController.deleteAddress);
app.post('/address', CartController.saveOrUpdateAddresses);

describe.skip('Address Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAddresses', () => {
    it('should return error when email is missing', async () => {
      await request(app).get('/address').expect(400);
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should return empty array if no address found', async () => {
      (Address.findOne as jest.Mock).mockResolvedValue(null);
      await request(app).get('/address?email=test@example.com').expect(200);
      expect(sendSuccessResponse).toHaveBeenCalledWith(expect.anything(), { addresses: [] }, expect.any(String), 200);
    });
  });

  describe('saveOrUpdateAddresses', () => {
    it('should return error for invalid payload', async () => {
      await request(app).post('/address').send({}).expect(400);
      expect(sendErrorResponse).toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should return error when email is missing', async () => {
      await request(app).delete('/address').send({ address: { _id: '123' } }).expect(400);
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should return error when address is missing', async () => {
      await request(app).delete('/address?email=test@example.com').send({}).expect(400);
      expect(sendErrorResponse).toHaveBeenCalled();
    });
  });
});
