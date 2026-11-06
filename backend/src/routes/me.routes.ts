import { Router } from 'express';
import { MeController } from '../controllers/me.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', MeController.getSummary);

export default router;
