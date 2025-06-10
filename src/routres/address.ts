import express from 'express';
import { AddressController } from '../controller';

const router = express.Router();

router.get('/', AddressController.getAddresses);

router.post('/',
    // userIdAndPermissionValidate("address.update"),
    AddressController.saveOrUpdateAddresses
);

router.delete('/',
    // userIdAndPermissionValidate('address.delete'),
    AddressController.deleteAddress
);

export default router;
