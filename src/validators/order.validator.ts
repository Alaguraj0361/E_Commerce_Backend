import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
  billingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }).optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.string().default('stripe'),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Refunded',
  ]),
  trackingNumber: z.string().optional(),
  note: z.string().optional(),
});
