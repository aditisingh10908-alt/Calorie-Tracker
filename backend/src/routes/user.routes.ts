import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateProfileSchema } from '../validators/profile.validator';

const router = Router();

router.use(authMiddleware);

router.get('/profile', UserController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), UserController.updateProfile);
router.delete('/profile', UserController.deleteAccount);

export default router;
