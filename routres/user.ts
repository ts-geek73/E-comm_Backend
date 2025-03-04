import { RequestHandler, Router } from 'express';
import UserController from '../controller/user';

const router = Router();

router.put('/create', UserController.createUser as unknown as RequestHandler );
router.get('/protected', UserController.protected as unknown as RequestHandler );

export default router;