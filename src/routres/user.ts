import { Router } from 'express';
import { IRequestHandler } from '../types';
import { whishListController, UserController as theUserController } from '../controller';
import OTPCOntroller from '../controller/otpGeneartoer';

const router = Router();

let UserController = theUserController as IRequestHandler;

router.get('/protected', UserController.protected!);
router.get('/whishlist', whishListController.getWhishList);

router.post('/whishlist', whishListController.addToWhishList);

router.put('/create', UserController.createUser);

router.delete('/whishlist', whishListController.removeToWhishList);
router.get('/send-otp', OTPCOntroller.sendOtp);
router.post('/verify-otp', OTPCOntroller.verifyOtp);

export default router;