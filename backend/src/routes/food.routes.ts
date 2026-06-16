import { Router } from 'express';
import { FoodController } from '../controllers/food.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createFoodSchema, updateFoodSchema } from '../validators/food.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', FoodController.getFoods);
router.post('/', validateRequest(createFoodSchema), FoodController.createFood);
router.get('/recommendations', FoodController.getRecommendations);
router.get('/search', FoodController.searchFoods);
router.get('/favorites', FoodController.getFavorites);
router.get('/:id', FoodController.getFoodById);
router.put('/:id', validateRequest(updateFoodSchema), FoodController.updateFood);
router.delete('/:id', FoodController.deleteFood);
router.post('/:id/favorite', FoodController.toggleFavorite);

export default router;
