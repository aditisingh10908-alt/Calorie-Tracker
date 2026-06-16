import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), AuthController.resetPassword);

export default router;
