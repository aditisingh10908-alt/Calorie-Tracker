import { z } from 'zod';

export const createFoodSchema = z.object({
  name: z.string().min(1, 'Food name is required'),
  servingSize: z.number().positive('Serving size must be positive'),
  servingUnit: z.string().min(1, 'Serving unit is required'),
  calories: z.number().nonnegative('Calories cannot be negative'),
  protein: z.number().nonnegative('Protein cannot be negative'),
  carbs: z.number().nonnegative('Carbohydrates cannot be negative'),
  fats: z.number().nonnegative('Fats cannot be negative'),
  category: z.string().optional(),
});

export const updateFoodSchema = createFoodSchema.partial();

export const searchFoodSchema = z.object({
  q: z.string().optional(),
});
