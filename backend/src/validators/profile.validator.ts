import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  age: z.number().int().positive().nullable().optional(),
  gender: z.string().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  currentWeight: z.number().positive().nullable().optional(),
  goalWeight: z.number().positive().nullable().optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).nullable().optional(),
});
