import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/weekly', AnalyticsController.getWeeklyReport);
router.get('/monthly', AnalyticsController.getMonthlyReport);
router.get('/trends', AnalyticsController.getTrends);

export default router;
