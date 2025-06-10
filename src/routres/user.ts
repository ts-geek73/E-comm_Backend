import { Router } from 'express';
import { IRequestHandler } from '../types';
import { whishListController, UserController as theUserController } from '../controller';
import OTPCOntroller from '../controller/otpGeneartoer';
import { userIdAndPermissionValidate } from '../middleware/productValidation';

const router = Router();

let UserController = theUserController as IRequestHandler;

// ================== User ROUTES ==================
router.get('/protected', UserController.protected!);
router.put('/create', UserController.createUser);

// ================== User Wish List ROUTES ==================
router.get('/whishlist', whishListController.getWhishList);
router.post('/whishlist',
    userIdAndPermissionValidate(),
    whishListController.addToWhishList);
router.delete('/whishlist',
    userIdAndPermissionValidate(),
    whishListController.removeToWhishList);

// ================== OTP ROUTES ==================
router.get('/send-otp', OTPCOntroller.sendOtp);
router.post('/verify-otp', OTPCOntroller.verifyOtp);

export default router;