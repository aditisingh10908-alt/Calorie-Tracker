import { Router } from 'express';
import { MlController } from '../controllers/ml.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/predict-weight', MlController.predictWeight);
router.post('/predict-goal', MlController.predictGoal);
router.post('/analyze-deficit', MlController.analyzeDeficit);
router.get('/recommendations', MlController.getRecommendations);

export default router;
