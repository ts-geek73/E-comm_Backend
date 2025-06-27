import express from 'express';
import productRoutes from './product';
import userRoutes from './user';
import categoryRoutes from './category';
import reviewasRoutes from './reviews';
import cartRoute from './cart'
import AddresssRoute from './address'
import PromocodeRoute from './promocode'
import PayMentRoute from './stripe'
import OrderRoute from './order'
import StockRoute from './stock'
import rolePermissionRoute from './rolePermission'

const router = express.Router();

router.use('/product', productRoutes);
router.use('/users', userRoutes);
router.use('/category', categoryRoutes);
router.use('/review', reviewasRoutes);
router.use('/cart', cartRoute);
router.use('/address', AddresssRoute);
router.use('/promocode', PromocodeRoute);
router.use('/payment', PayMentRoute);
router.use('/stock', StockRoute);
router.use('/order', OrderRoute);
router.use('/role-permission', rolePermissionRoute);

export default router;
