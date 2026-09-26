import Razorpay from 'razorpay';
import { ENV } from './env.js';

export const isRazorpayTestMode =
  !ENV.RAZORPAY_KEY_ID ||
  ENV.RAZORPAY_KEY_ID.includes('placeholder') ||
  !ENV.RAZORPAY_KEY_SECRET ||
  ENV.RAZORPAY_KEY_SECRET.includes('placeholder');

export const razorpay = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID,
  key_secret: ENV.RAZORPAY_KEY_SECRET,
});
