import express from 'express';
import { AddressController } from '../controller';

const router = express.Router();

router.get('/',  AddressController.getAddresses);
router.post('/',  AddressController.saveOrUpdateAddresses);
router.delete('/',  AddressController.deleteAddress);

export default router;
