import { Router } from 'express';
import { productController } from '../controller';
import { productIdValidation, productValidationRules, userIdAndPermissionValidate, validate } from '../middleware/productValidation';
import { upload } from '../service/multer';

const router = Router();

router.get('/', productController.getProducts);
router.get('/combos', productController.getBrandsAndCategories);
router.get('/:id', productIdValidation, validate, productController.getProductById);

// POST requests
router.post(
  '/create', 
  // userIdAndPermissionValidate('product.create'),
  upload.array('imageFiles', 12),
  productValidationRules,
  validate,
  productController.createProduct
);

router.post(
  '/file', 
  upload.single('file'),
  productController.importViaFile
);

// PUT requests
router.put(
  '/update/:id', 
  // userIdAndPermissionValidate('product.update'),
  upload.array('imageFiles', 12),
  productIdValidation,
  productValidationRules,
  validate,
  productController.updateProduct
);

// DELETE requests
router.delete(
  '/:id', 
  // userIdAndPermissionValidate('product.delete'),
  productIdValidation, 
  validate, 
  productController.deleteProduct
);

export default router;