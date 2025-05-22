import express from 'express';
import addressController from '../controller/address';

const router = express.Router();

router.get('/',  addressController.getAddresses);
router.post('/',  addressController.saveOrUpdateAddresses);
router.delete('/',  addressController.deleteAddress);

export default router;
