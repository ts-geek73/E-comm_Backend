import { Router } from 'express';
import { productController } from '../controller';
import { productIdValidation, productValidationRules, validate } from '../middleware/productValidation';
import { upload } from '../service/multer';

const router = Router();

router.get('/', productController.getProducts);
router.get('/combos', productController.getBrandsAndCategories);
router.get('/:id', productIdValidation, validate, productController.getProductById);

// POST requests
router.post(
  '/create', 
  upload.array('imageFiles', 12),
  productValidationRules,
  validate,
  productController.createProduct
);

// PUT requests
router.put(
  '/update/:id', 
  upload.array('imageFiles', 12),
  productIdValidation,
  productValidationRules,
  validate,
  productController.updateProduct
);

// DELETE requests
router.delete(
  '/:id', 
  productIdValidation, 
  validate, 
  productController.deleteProduct
);

export default router;