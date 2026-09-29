import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe.js';
import { ENV } from '../config/env.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    if (!sig || !ENV.STRIPE_WEBHOOK_SECRET) {
      console.warn('[Webhook Warning] Missing stripe-signature or webhook secret');
      res.status(400).send('Webhook signature verification failed');
      return;
    }

    event = stripe.webhooks.constructEvent(
      req.body, // Raw Buffer provided by express.raw({ type: 'application/json' })
      sig,
      ENV.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`[Webhook Error]: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle event idempotently
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Confirmed';
            order.stripePaymentIntentId = session.payment_intent as string;
            order.timeline.push({
              status: 'Confirmed',
              timestamp: new Date(),
              note: 'Payment successfully received via Stripe Checkout',
            });
            await order.save();

            // Decrement product inventory safely
            for (const item of order.items) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
              });
              if (item.variantId) {
                await Product.updateOne(
                  { _id: item.product, 'variants._id': item.variantId },
                  { $inc: { 'variants.$.stock': -item.quantity } }
                );
              }
            }

            // Clear user's cart
            if (order.user) {
              await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
            }

            // Record coupon usage
            if (order.couponCode) {
              await Coupon.findOneAndUpdate(
                { code: order.couponCode },
                {
                  $inc: {
                    usedCount: 1,
                    [`userUsages.${order.user}`]: 1,
                  },
                }
              );
            }
            console.log(`[Order Confirmed] Order ${order.orderNumber} fulfilled`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[PaymentIntent Succeeded] ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(`[PaymentIntent Failed] ${paymentIntent.id}`);
        const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (order) {
          order.paymentStatus = 'Failed';
          order.timeline.push({
            status: 'Payment Failed',
            timestamp: new Date(),
            note: paymentIntent.last_payment_error?.message || 'Payment attempt failed',
          });
          await order.save();
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const order = await Order.findOne({ stripePaymentIntentId: charge.payment_intent as string });
        if (order) {
          order.paymentStatus = 'Refunded';
          order.orderStatus = 'Refunded';
          order.timeline.push({
            status: 'Refunded',
            timestamp: new Date(),
            note: 'Order payment refunded via Stripe',
          });
          await order.save();
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Processing Error]:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;

  try {
    const rawPayload = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

    // Verify webhook signature if secret configured
    if (ENV.RAZORPAY_WEBHOOK_SECRET && !ENV.RAZORPAY_WEBHOOK_SECRET.includes('placeholder')) {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('[Razorpay Webhook Warning] Webhook signature verification failed');
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    const event = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(rawPayload);

    console.log(`[Razorpay Webhook] Received event: ${event.event}`);

    const payment = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const razorpayOrderId = payment?.order_id || orderEntity?.id;
    const razorpayPaymentId = payment?.id;

    if (razorpayOrderId) {
      const order = await Order.findOne({ razorpayOrderId });

      if (order) {
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
          if (order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Confirmed';
            order.razorpayPaymentId = razorpayPaymentId || order.razorpayPaymentId;
            order.timeline.push({
              status: 'Confirmed',
              timestamp: new Date(),
              note: `Payment verified via Razorpay Webhook (${event.event})`,
            });
            await order.save();

            // Safely decrement inventory stock
            for (const item of order.items) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
              });
              if (item.variantId) {
                await Product.updateOne(
                  { _id: item.product, 'variants._id': item.variantId },
                  { $inc: { 'variants.$.stock': -item.quantity } }
                );
              }
            }

            // Clear cart
            if (order.user) {
              await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
            }
            console.log(`[Razorpay Webhook] Order ${order.orderNumber} successfully confirmed`);
          }
        } else if (event.event === 'payment.failed') {
          if (order.paymentStatus !== 'Paid') {
            order.paymentStatus = 'Failed';
            order.timeline.push({
              status: 'Payment Failed',
              timestamp: new Date(),
              note: payment?.error_description || 'Payment failed on Razorpay gateway',
            });
            await order.save();
            console.warn(`[Razorpay Webhook] Order ${order.orderNumber} payment marked failed`);
          }
        }
      }
    }

    // Handle refund events
    if (event.event === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const order = await Order.findOne({ razorpayPaymentId: paymentId });
        if (order) {
          order.paymentStatus = 'Refunded';
          order.orderStatus = 'Refunded';
          order.timeline.push({
            status: 'Refunded',
            timestamp: new Date(),
            note: `Refund of ₹${((refundEntity.amount || 0) / 100).toFixed(2)} processed via Razorpay (${refundEntity.id})`,
          });
          await order.save();
          console.log(`[Razorpay Webhook] Order ${order.orderNumber} marked as Refunded`);
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error('[Razorpay Webhook Processing Error]:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

