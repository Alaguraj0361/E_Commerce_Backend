import { Router } from 'express';
import {
  getOrderSummary,
  createCheckoutSession,
  createPaymentIntent,
} from '../controllers/checkout.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/summary', optionalAuth, getOrderSummary);
router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.post('/create-payment-intent', optionalAuth, createPaymentIntent);

export default router;
