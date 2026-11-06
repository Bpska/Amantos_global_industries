import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createPaymentSchema } from '../validations/order.validation';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

// Record payment (collect baki)
router.post('/:id/payments', validate(createPaymentSchema), OrderController.recordPayment);

export default router;
