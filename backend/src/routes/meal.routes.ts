import { Router } from 'express';
import { MealController } from '../controllers/meal.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createMealSchema, updateMealSchema } from '../validators/meal.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createMealSchema), MealController.createMeal);
router.get('/', MealController.getMealsByDate);
router.get('/:id', MealController.getMealById);
router.put('/:id', validateRequest(updateMealSchema), MealController.updateMeal);
router.delete('/:id', MealController.deleteMeal);

export default router;
