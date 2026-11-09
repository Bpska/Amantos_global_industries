import { Router } from 'express';
import { ShopController } from '../controllers/shop.controller';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  onboardShopSchema,
  shopsMineQuerySchema,
  shopIdParamSchema,
} from '../validations/shop.validation';
import { createRepeatOrderSchema } from '../validations/order.validation';

const router = Router();

// All shop endpoints require authentication
router.use(authenticate);

// Onboard shop + first order
router.post('/', validate(onboardShopSchema), ShopController.onboardShop);

// List current salesperson's shops
router.get('/mine', validate(shopsMineQuerySchema), ShopController.getMyShops);

// Get specific shop details
router.get('/:id', validate(shopIdParamSchema), ShopController.getShopById);

// Repeat order for an existing shop
router.post('/:id/orders', validate(createRepeatOrderSchema), OrderController.createRepeatOrder);

export default router;
