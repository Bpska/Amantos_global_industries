import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, changePasswordSchema } from '../validations/auth.validation';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, requireAdmin, validate(changePasswordSchema), AuthController.changePassword);
router.patch('/password', authenticate, requireAdmin, validate(changePasswordSchema), AuthController.changePassword);

export default router;
