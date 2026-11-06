import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import shopRoutes from './shop.routes';
import orderRoutes from './order.routes';
import meRoutes from './me.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/shops', shopRoutes);
router.use('/orders', orderRoutes);
router.use('/me', meRoutes);

export default router;
