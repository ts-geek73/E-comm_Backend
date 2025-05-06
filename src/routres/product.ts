import { Router } from 'express';
import productController from '../controller/product';
import { IRequestHandler } from '../types';
import { upload } from '../service/multer';
import { productIdValidation, productValidationRules, validate } from '../middleware/productValidation';

const router = Router();
const typedProductController = productController as IRequestHandler;

router.get('/', typedProductController.getProducts);
router.get('/combos', typedProductController.getBrandsAndCategories);
router.get('/:id', productIdValidation, validate, typedProductController.getProductById);

// POST requests
router.post(
  '/create', 
  upload.array('imageFiles', 12),
  productValidationRules,
  validate,
  typedProductController.createProduct
);

// PUT requests
router.put(
  '/update/:id', 
  upload.array('imageFiles', 12),
  productIdValidation,
  productValidationRules,
  validate,
  typedProductController.updateProduct
);

// DELETE requests
router.delete(
  '/:id', 
  productIdValidation, 
  validate, 
  typedProductController.deleteProduct
);

export default router;