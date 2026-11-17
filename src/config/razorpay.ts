import Razorpay from 'razorpay';
import { ENV } from './env.js';

export const isRazorpayConfigured =
  Boolean(ENV.RAZORPAY_KEY_ID) &&
  !ENV.RAZORPAY_KEY_ID.includes('placeholder') &&
  Boolean(ENV.RAZORPAY_KEY_SECRET) &&
  !ENV.RAZORPAY_KEY_SECRET.includes('placeholder');

export const isRazorpayLiveMode =
  isRazorpayConfigured && (ENV.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ?? false);

export const isRazorpayTestMode =
  !isRazorpayConfigured || (ENV.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ?? false);

export const isRazorpayWebhookConfigured =
  Boolean(ENV.RAZORPAY_WEBHOOK_SECRET) &&
  !ENV.RAZORPAY_WEBHOOK_SECRET.includes('placeholder') &&
  ENV.RAZORPAY_WEBHOOK_SECRET.length > 0;

export const getRazorpayEnvironment = (): 'live' | 'test' | 'unconfigured' => {
  if (!isRazorpayConfigured) return 'unconfigured';
  if (isRazorpayLiveMode) return 'live';
  return 'test';
};

export const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    })
  : new Razorpay({
      key_id: 'rzp_test_placeholder',
      key_secret: 'rzp_test_placeholder',
    });


