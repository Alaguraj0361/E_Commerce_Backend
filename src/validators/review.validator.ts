import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1, 'Review title is required').max(100),
  comment: z.string().min(1, 'Review comment is required').max(1000),
  images: z.array(z.string()).optional(),
  orderId: z.string().optional(),
});
