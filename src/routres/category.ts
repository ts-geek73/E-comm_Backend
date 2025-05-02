import { Router } from 'express';
import CategoryController from '../controller/category';

const router = Router();

// get requests
router.get('/', CategoryController.getAllCategory  );

export default router;