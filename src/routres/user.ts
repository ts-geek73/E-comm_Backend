import { RequestHandler, Router } from 'express';
import theUserController from '../controller/user';
import { IRequestHandler } from '../types';


const router = Router();

let UserController = theUserController as IRequestHandler; 
      // Add other methods as needed
// get requests
router.get('/protected', UserController.protected!);

// Put requests
router.put('/create', UserController.createUser as unknown as RequestHandler);

export default router;