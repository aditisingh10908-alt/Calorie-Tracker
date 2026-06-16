import { z } from 'zod';

const mealItemSchema = z.object({
  foodId: z.string().min(1, 'Food ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
});

export const createMealSchema = z.object({
  date: z.string().datetime({ message: 'Invalid ISO date string' }),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  notes: z.string().optional(),
  items: z.array(mealItemSchema).min(1, 'At least one food item is required'),
});

export const updateMealSchema = createMealSchema.partial();
