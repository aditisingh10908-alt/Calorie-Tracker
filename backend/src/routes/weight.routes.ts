import { Router } from 'express';
import { WeightController } from '../controllers/weight.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { logWeightSchema } from '../validators/weight.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(logWeightSchema), WeightController.logWeight);
router.get('/history', WeightController.getWeightHistory);
router.get('/latest', WeightController.getLatestWeight);
router.delete('/:id', WeightController.deleteWeightLog);

export default router;
