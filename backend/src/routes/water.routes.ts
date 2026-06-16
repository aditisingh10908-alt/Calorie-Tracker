import { Router } from 'express';
import { WaterController } from '../controllers/water.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { logWaterSchema } from '../validators/water.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(logWaterSchema), WaterController.logWater);
router.get('/daily', WaterController.getDailyWater);
router.get('/history', WaterController.getWaterHistory);
router.delete('/:id', WaterController.deleteWaterLog);

export default router;
