import { Router } from 'express';
import { StreakController } from '../controllers/streak.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', StreakController.getStreaks);
router.put('/:type', StreakController.updateStreak);

export default router;
