import { Router } from 'express';
import { ProteinController } from '../controllers/protein.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/daily', ProteinController.getDailyProtein);
router.get('/history', ProteinController.getProteinHistory);

export default router;
