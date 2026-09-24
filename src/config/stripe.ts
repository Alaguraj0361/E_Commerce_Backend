import Stripe from 'stripe';
import { ENV } from './env.js';

export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any,
  typescript: true,
});
