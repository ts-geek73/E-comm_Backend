import { Router } from 'express';
import theUserController from '../controller/user';
import { whishListController } from '../controller/whichlist';
import { IRequestHandler } from '../types';



const router = Router();

let UserController = theUserController as IRequestHandler; 

router.get('/protected', UserController.protected!);
router.get('/whishlist', whishListController.getWhishList);

router.post('/whishlist', whishListController.addToWhishList);

router.put('/create', UserController.createUser);

router.delete('/whishlist', whishListController.removeToWhishList);

export default router;