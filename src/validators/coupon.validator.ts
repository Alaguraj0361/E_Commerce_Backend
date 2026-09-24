import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscount: z.number().positive().optional(),
  startDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  orderTotal: z.number().min(0, 'Order total is required'),
});
