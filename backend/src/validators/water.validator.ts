import { z } from 'zod';

export const logWaterSchema = z.object({
  amount: z.number().int().positive('Water amount must be positive and in ml'),
  date: z.string().datetime({ message: 'Invalid ISO date string' }),
  time: z.string().optional(),
});
