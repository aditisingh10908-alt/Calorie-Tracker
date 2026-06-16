import { z } from 'zod';

export const logWeightSchema = z.object({
  weight: z.number().positive('Weight must be positive and in kg'),
  date: z.string().datetime({ message: 'Invalid ISO date string' }),
  note: z.string().optional(),
});
