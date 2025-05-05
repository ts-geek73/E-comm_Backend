import express from 'express';
import productRoutes from './product';
import userRoutes from './user';
import categoryRoutes from './category';
import reviewasRoutes from './reviews';

const router = express.Router();

router.use('/product', productRoutes);
router.use('/users', userRoutes);
router.use('/category', categoryRoutes);
router.use('/review', reviewasRoutes);

export default router;
