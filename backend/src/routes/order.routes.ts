import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createPaymentSchema } from '../validations/order.validation';
import { adminOrdersQuerySchema } from '../validations/admin.validation';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

// Staff and Admin can list orders
router.get(
  '/',
  validate(adminOrdersQuerySchema),
  (req, res, next) => {
    // If not admin, restrict query to the logged-in staff member
    if (req.user?.role !== 'ADMIN') {
      req.query.salespersonId = req.user!.id;
    }
    return AdminController.getOrders(req, res, next);
  }
);

// Record payment (collect baki) - supports both /:id/payments and /:id/pay
router.post('/:id/payments', validate(createPaymentSchema), OrderController.recordPayment);
router.post('/:id/pay', validate(createPaymentSchema), OrderController.recordPayment);

export default router;
