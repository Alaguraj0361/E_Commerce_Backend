import Razorpay from 'razorpay';
import { ENV } from './env.js';

export const isRazorpayConfigured =
  Boolean(ENV.RAZORPAY_KEY_ID) &&
  !ENV.RAZORPAY_KEY_ID.includes('placeholder') &&
  Boolean(ENV.RAZORPAY_KEY_SECRET) &&
  !ENV.RAZORPAY_KEY_SECRET.includes('placeholder');

export const isRazorpayTestMode =
  !isRazorpayConfigured || (ENV.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ?? false);

export const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    })
  : new Razorpay({
      key_id: 'rzp_test_placeholder',
      key_secret: 'rzp_test_placeholder',
    });

