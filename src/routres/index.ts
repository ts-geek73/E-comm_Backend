import express from 'express';
import productRoutes from './product';
import userRoutes from './user';
import categoryRoutes from './category';
import reviewasRoutes from './reviews';
import cartRoute from './cart'

const router = express.Router();

router.use('/product', productRoutes);
router.use('/users', userRoutes);
router.use('/category', categoryRoutes);
router.use('/review', reviewasRoutes);
router.use('/cart', cartRoute);

export default router;
