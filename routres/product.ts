import { RequestHandler, Router } from 'express';
import productController from '../controller/product';

const router = Router();

router.post('/create', productController.createProduct as unknown as RequestHandler );
router.get('/', productController.getAllProduct as unknown as RequestHandler );


export default router;