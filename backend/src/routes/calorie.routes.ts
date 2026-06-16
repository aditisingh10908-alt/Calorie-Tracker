import { Router } from 'express';
import { CalorieController } from '../controllers/calorie.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', CalorieController.getDailySummary);
router.get('/tdee', CalorieController.calculateTDEE);

export default router;
