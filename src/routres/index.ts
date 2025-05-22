import express from 'express';
import productRoutes from './product';
import userRoutes from './user';
import categoryRoutes from './category';
import reviewasRoutes from './reviews';
import cartRoute from './cart'
import AddresssRoute from './address'

const router = express.Router();

router.use('/product', productRoutes);
router.use('/users', userRoutes);
router.use('/category', categoryRoutes);
router.use('/review', reviewasRoutes);
router.use('/cart', cartRoute);
router.use('/address', AddresssRoute);

export default router;
