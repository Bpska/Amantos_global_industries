import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Accessible by both admin and field sales representatives
router.use(authenticate);
router.get('/', ProductController.listActive);

export default router;

