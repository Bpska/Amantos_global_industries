import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import shopRoutes from './shop.routes';
import orderRoutes from './order.routes';
import meRoutes from './me.routes';
import productRoutes from './product.routes';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.use('/auth', authRoutes);
router.get('/me', authRoutes); // mounts /api/v1/me for getMe
router.use('/admin', adminRoutes);
router.use('/shops', shopRoutes);
router.use('/orders', orderRoutes);
router.use('/me', meRoutes);
router.use('/products', productRoutes);
router.get('/billing-settings', AdminController.getBillingSettings);

export default router;
