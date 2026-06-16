import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import foodRoutes from './food.routes';
import mealRoutes from './meal.routes';
import waterRoutes from './water.routes';
import weightRoutes from './weight.routes';
import proteinRoutes from './protein.routes';
import calorieRoutes from './calorie.routes';
import analyticsRoutes from './analytics.routes';
import streakRoutes from './streak.routes';
import mlRoutes from './ml.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/foods', foodRoutes);
router.use('/meals', mealRoutes);
router.use('/water', waterRoutes);
router.use('/weight', weightRoutes);
router.use('/protein', proteinRoutes);
router.use('/calories', calorieRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/streaks', streakRoutes);
router.use('/ml', mlRoutes);
router.use('/notifications', notificationRoutes);

export default router;
