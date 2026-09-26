import { Router } from 'express';
import {
  getOrderSummary,
  createCheckoutSession,
  createPaymentIntent,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCodOrder,
} from '../controllers/checkout.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Order Summary
router.post('/summary', optionalAuth, getOrderSummary);

// Stripe Checkout (International Cards)
router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.post('/create-payment-intent', optionalAuth, createPaymentIntent);

// Razorpay Checkout (UPI - GPay, PhonePe, Paytm, QR, Net Banking, Domestic Cards)
router.post('/razorpay/create-order', authenticate, createRazorpayOrder);
router.post('/razorpay/verify-payment', authenticate, verifyRazorpayPayment);

// Cash on Delivery (COD)
router.post('/cod/create-order', authenticate, createCodOrder);

export default router;
