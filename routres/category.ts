import { RequestHandler, Router } from 'express';
import CategoryController from '../controller/category';

const router = Router();

router.get('/', CategoryController.getAllCategory as unknown as RequestHandler );

export default router;