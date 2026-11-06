import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createSalespersonSchema,
  updateSalespersonSchema,
  resetPasswordSchema,
  adminShopsQuerySchema,
  adminOrdersQuerySchema,
} from '../validations/admin.validation';
import { shopIdParamSchema } from '../validations/shop.validation';

const router = Router();

// All routes here require valid JWT and ADMIN role
router.use(authenticate, requireAdmin);

router.post(
  '/salespersons',
  validate(createSalespersonSchema),
  AdminController.createSalesperson
);

router.get('/salespersons', AdminController.listSalespersons);

router.patch(
  '/salespersons/:id',
  validate(updateSalespersonSchema),
  AdminController.updateSalesperson
);

router.post(
  '/salespersons/:id/reset-password',
  validate(resetPasswordSchema),
  AdminController.resetPassword
);

router.get('/shops', validate(adminShopsQuerySchema), AdminController.getShops);
router.get('/shops/:id', validate(shopIdParamSchema), AdminController.getShopById);

router.get('/orders', validate(adminOrdersQuerySchema), AdminController.getOrders);
router.get('/dashboard', AdminController.getDashboard);
router.get('/export/orders.csv', AdminController.exportOrdersCsv);

export default router;
