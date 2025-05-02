import { Router } from 'express';
import productController from '../controller/product';
import { IRequestHandler } from '../types';

const router = Router();
const typedProductController = productController as IRequestHandler;

// get requests
router.get('/', typedProductController.getAllProducts!);
router.get('/combos', typedProductController.getBrandsAndCategories!);
router.get('/custome', typedProductController.getLimitedProducts !);
router.get('/search', typedProductController.searchProduct !);
router.get('/:id', typedProductController.getProductById!);

// post requests
router.post('/create', typedProductController.createProduct!);

// put requests
router.put('/:id', typedProductController.updateProduct!);

// delete requests
router.delete('/:id', typedProductController.deleteProduct!);

export default router;