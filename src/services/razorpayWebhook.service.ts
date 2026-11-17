import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { Order, IOrder } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { ProcessedWebhookEvent } from '../models/ProcessedWebhookEvent.js';
import { decrementInventoryAtomic } from '../utils/inventory.js';

export class WebhookSignatureError extends Error {
  constructor(message = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}

export interface RazorpayWebhookResult {
  status: 'ok' | 'ignored' | 'duplicate';
  event: string;
  orderNumber?: string;
  message?: string;
}

/**
 * Constant-time HMAC SHA256 signature verification for Razorpay webhooks.
 * Prevents timing attacks and ensures the payload was not tampered with.
 */
export function verifyRazorpaySignature(
  rawPayload: string | Buffer,
  signature: string | undefined,
  secret: string = ENV.RAZORPAY_WEBHOOK_SECRET
): boolean {
  if (!signature || !secret || secret.includes('placeholder')) {
    return false;
  }

  try {
    const payloadStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Helper to safely extract payment method details without logging sensitive PII.
 */
function extractPaymentDetails(payment: any) {
  if (!payment) return undefined;
  return {
    bank: payment.bank || undefined,
    wallet: payment.wallet || undefined,
    vpa: payment.vpa || undefined,
    cardNetwork: payment.card?.network || undefined,
    cardLast4: payment.card?.last4 || undefined,
  };
}

/**
 * Resolves an order using Razorpay order ID or metadata notes.
 */
async function findOrderByRazorpayRef(orderId?: string, notes?: any): Promise<IOrder | null> {
  if (orderId) {
    const order = await Order.findOne({ razorpayOrderId: orderId });
    if (order) return order;
  }

  if (notes?.orderId) {
    try {
      const order = await Order.findById(notes.orderId);
      if (order) return order;
    } catch {
      // Invalid ObjectId format in notes
    }
  }

  if (notes?.orderNumber) {
    const order = await Order.findOne({ orderNumber: notes.orderNumber });
    if (order) return order;
  }

  return null;
}

/**
 * Resolves an order using payment ID, order refunds array, or metadata notes.
 */
async function findOrderByPaymentOrRefundRef(paymentId?: string, notes?: any): Promise<IOrder | null> {
  if (paymentId) {
    const order = await Order.findOne({
      $or: [{ razorpayPaymentId: paymentId }, { 'refunds.paymentId': paymentId }],
    });
    if (order) return order;
  }

  if (notes?.orderId) {
    try {
      const order = await Order.findById(notes.orderId);
      if (order) return order;
    } catch {
      // Invalid ObjectId format in notes
    }
  }

  if (notes?.orderNumber) {
    const order = await Order.findOne({ orderNumber: notes.orderNumber });
    if (order) return order;
  }

  return null;
}

/**
 * Atomically marks an order as Paid and executes side-effects (stock, cart, coupon) EXACTLY ONCE.
 * If multiple concurrent webhooks (e.g. order.paid and payment.captured) arrive in parallel,
 * MongoDB atomic conditional update ensures only one request succeeds in transitioning the state.
 */
async function fulfillOrderOnce(
  order: IOrder,
  sourceEvent: string,
  paymentId?: string,
  paymentMethod?: string,
  paymentDetails?: any
): Promise<boolean> {
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: { $ne: 'Paid' },
    },
    {
      $set: {
        paymentStatus: 'Paid',
        orderStatus: order.orderStatus === 'Pending' ? 'Confirmed' : order.orderStatus,
        razorpayPaymentId: paymentId || order.razorpayPaymentId,
        razorpayPaymentStatus: 'captured',
        razorpayPaymentMethod: paymentMethod || order.razorpayPaymentMethod,
        ...(paymentDetails ? { razorpayPaymentDetails: paymentDetails } : {}),
      },
      $push: {
        timeline: {
          status: 'Confirmed',
          timestamp: new Date(),
          note: `Payment confirmed via Razorpay webhook (${sourceEvent})`,
        },
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    // Order was already marked Paid (by verify API or previous webhook event)
    return false;
  }

  // 1. Atomically decrement inventory stock
  if (updatedOrder.items && updatedOrder.items.length > 0) {
    try {
      await decrementInventoryAtomic(updatedOrder.items);
    } catch (stockErr: any) {
      console.error(`[Razorpay Webhook Error] Failed to decrement inventory for order ${updatedOrder.orderNumber}:`, stockErr.message);
    }
  }

  // 2. Clear customer's cart
  if (updatedOrder.user) {
    try {
      await Cart.findOneAndUpdate({ user: updatedOrder.user }, { items: [] });
    } catch (cartErr: any) {
      console.warn(`[Razorpay Webhook Warning] Could not clear cart for user ${updatedOrder.user}:`, cartErr.message);
    }
  }

  // 3. Record coupon usage
  if (updatedOrder.couponCode) {
    try {
      await Coupon.findOneAndUpdate(
        { code: updatedOrder.couponCode },
        {
          $inc: {
            usedCount: 1,
            [`userUsages.${updatedOrder.user}`]: 1,
          },
        }
      );
    } catch (couponErr: any) {
      console.warn(`[Razorpay Webhook Warning] Could not record coupon ${updatedOrder.couponCode}:`, couponErr.message);
    }
  }

  console.log(`[Razorpay Webhook] Successfully fulfilled order ${updatedOrder.orderNumber} via ${sourceEvent}`);
  return true;
}

/**
 * Handles all 7 Razorpay webhook events with end-to-end idempotency,
 * atomic concurrency management, and refund calculations.
 */
export async function processRazorpayWebhook(
  rawBody: Buffer | string,
  signature: string | undefined,
  eventIdHeader?: string
): Promise<RazorpayWebhookResult> {
  // 1. Signature Verification
  if (ENV.RAZORPAY_WEBHOOK_SECRET && !ENV.RAZORPAY_WEBHOOK_SECRET.includes('placeholder')) {
    const isValid = verifyRazorpaySignature(rawBody, signature, ENV.RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn('[Razorpay Webhook Security] Rejected invalid webhook signature');
      throw new WebhookSignatureError('Invalid webhook signature');
    }
  }

  // 2. Parse Payload
  const rawPayload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  let event: any;
  try {
    event = typeof rawBody === 'object' && !Buffer.isBuffer(rawBody) ? rawBody : JSON.parse(rawPayload);
  } catch (err) {
    throw new Error('Malformed JSON payload');
  }

  const eventType: string = event.event;
  if (!eventType) {
    return { status: 'ignored', event: 'unknown', message: 'Missing event field' };
  }

  // 3. Extract Unique Event ID for Idempotency
  const paymentEntity = event.payload?.payment?.entity;
  const orderEntity = event.payload?.order?.entity;
  const refundEntity = event.payload?.refund?.entity;

  const resourceId =
    refundEntity?.id || paymentEntity?.id || orderEntity?.id || event.payload?.payment_id;

  const eventId =
    eventIdHeader ||
    event.id ||
    `${eventType}_${resourceId || 'generic'}_${event.created_at || Date.now()}`;

  // 4. Duplicate Event Protection (Database-level)
  const isNewEvent = await ProcessedWebhookEvent.recordIfNew(
    eventId,
    'razorpay',
    eventType,
    resourceId
  );

  if (!isNewEvent) {
    console.log(`[Razorpay Webhook] Ignored duplicate event delivery: ${eventId} (${eventType})`);
    return {
      status: 'duplicate',
      event: eventType,
      message: 'Event was previously processed',
    };
  }

  console.log(`[Razorpay Webhook] Processing event: ${eventType} (ID: ${eventId})`);

  // 5. Handle the 7 Webhook Events
  switch (eventType) {
    // -------------------------------------------------------------
    // EVENT 1: payment.authorized
    // -------------------------------------------------------------
    case 'payment.authorized': {
      if (!paymentEntity) {
        return { status: 'ignored', event: eventType, message: 'Missing payment entity' };
      }

      const order = await findOrderByRazorpayRef(paymentEntity.order_id, paymentEntity.notes);
      if (!order) {
        console.warn(`[Razorpay Webhook] Order not found for payment.authorized: order_id=${paymentEntity.order_id}`);
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      // Do not alter if order is already Paid
      if (order.paymentStatus === 'Paid') {
        return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
      }

      order.paymentStatus = 'Authorized';
      order.razorpayPaymentId = paymentEntity.id;
      order.razorpayPaymentStatus = 'authorized';
      order.razorpayPaymentMethod = paymentEntity.method;
      order.razorpayPaymentDetails = extractPaymentDetails(paymentEntity);

      order.timeline.push({
        status: 'Authorized',
        timestamp: new Date(),
        note: `Payment authorized via Razorpay (${paymentEntity.id}). Awaiting capture confirmation.`,
      });

      await order.save();
      console.log(`[Razorpay Webhook] Order ${order.orderNumber} updated to Authorized (${paymentEntity.id})`);
      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    // -------------------------------------------------------------
    // EVENT 2: payment.captured
    // -------------------------------------------------------------
    case 'payment.captured': {
      if (!paymentEntity) {
        return { status: 'ignored', event: eventType, message: 'Missing payment entity' };
      }

      const order = await findOrderByRazorpayRef(paymentEntity.order_id, paymentEntity.notes);
      if (!order) {
        console.warn(`[Razorpay Webhook] Order not found for payment.captured: order_id=${paymentEntity.order_id}`);
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      await fulfillOrderOnce(
        order,
        eventType,
        paymentEntity.id,
        paymentEntity.method,
        extractPaymentDetails(paymentEntity)
      );

      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    // -------------------------------------------------------------
    // EVENT 3: order.paid
    // -------------------------------------------------------------
    case 'order.paid': {
      const rzpOrderId = orderEntity?.id || paymentEntity?.order_id;
      if (!rzpOrderId) {
        return { status: 'ignored', event: eventType, message: 'Missing order_id in order.paid' };
      }

      const order = await findOrderByRazorpayRef(rzpOrderId, orderEntity?.notes || paymentEntity?.notes);
      if (!order) {
        console.warn(`[Razorpay Webhook] Order not found for order.paid: rzpOrderId=${rzpOrderId}`);
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      await fulfillOrderOnce(
        order,
        eventType,
        paymentEntity?.id || order.razorpayPaymentId,
        paymentEntity?.method,
        extractPaymentDetails(paymentEntity)
      );

      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    // -------------------------------------------------------------
    // EVENT 4: payment.failed
    // -------------------------------------------------------------
    case 'payment.failed': {
      if (!paymentEntity) {
        return { status: 'ignored', event: eventType, message: 'Missing payment entity' };
      }

      const order = await findOrderByRazorpayRef(paymentEntity.order_id, paymentEntity.notes);
      if (!order) {
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      // Never overwrite an already successfully captured payment
      if (order.paymentStatus === 'Paid') {
        console.warn(`[Razorpay Webhook] Ignoring payment.failed for already paid order ${order.orderNumber}`);
        return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
      }

      order.paymentStatus = 'Failed';
      order.razorpayPaymentStatus = 'failed';
      order.razorpayPaymentDetails = {
        ...extractPaymentDetails(paymentEntity),
        errorCode: paymentEntity.error_code || 'GATEWAY_ERROR',
        errorDescription:
          paymentEntity.error_description || paymentEntity.error_reason || 'Payment declined',
      };

      order.timeline.push({
        status: 'Payment Failed',
        timestamp: new Date(),
        note: `Payment attempt failed via Razorpay (${paymentEntity.error_code || 'ERROR'}: ${paymentEntity.error_description || 'Declined'})`,
      });

      await order.save();
      console.warn(`[Razorpay Webhook] Order ${order.orderNumber} payment marked as Failed`);
      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    // -------------------------------------------------------------
    // EVENT 5: refund.created
    // -------------------------------------------------------------
    case 'refund.created': {
      if (!refundEntity) {
        return { status: 'ignored', event: eventType, message: 'Missing refund entity' };
      }

      const order = await findOrderByPaymentOrRefundRef(refundEntity.payment_id, refundEntity.notes);
      if (!order) {
        console.warn(`[Razorpay Webhook] Order not found for refund.created: payment_id=${refundEntity.payment_id}`);
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      const amountInRupees = (refundEntity.amount || 0) / 100;
      const existingRefund = order.refunds?.find((r) => r.refundId === refundEntity.id);

      if (!existingRefund) {
        if (!order.refunds) order.refunds = [];
        order.refunds.push({
          refundId: refundEntity.id,
          paymentId: refundEntity.payment_id,
          amount: amountInRupees,
          currency: refundEntity.currency || 'INR',
          status: 'Pending',
          reason: refundEntity.notes?.reason || refundEntity.reason || 'Customer refund requested',
          createdAt: new Date(refundEntity.created_at ? refundEntity.created_at * 1000 : Date.now()),
        });

        order.timeline.push({
          status: 'Refund Pending',
          timestamp: new Date(),
          note: `Refund request initiated on Razorpay (ID: ${refundEntity.id}, Amount: ₹${amountInRupees.toFixed(2)})`,
        });

        await order.save();
        console.log(`[Razorpay Webhook] Order ${order.orderNumber} recorded pending refund ${refundEntity.id}`);
      }

      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    // -------------------------------------------------------------
    // EVENT 6: refund.processed
    // -------------------------------------------------------------
    case 'refund.processed': {
      if (!refundEntity) {
        return { status: 'ignored', event: eventType, message: 'Missing refund entity' };
      }

      const order = await findOrderByPaymentOrRefundRef(refundEntity.payment_id, refundEntity.notes);
      if (!order) {
        console.warn(`[Razorpay Webhook] Order not found for refund.processed: payment_id=${refundEntity.payment_id}`);
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      const amountInRupees = (refundEntity.amount || 0) / 100;
      if (!order.refunds) order.refunds = [];

      const existingIndex = order.refunds.findIndex((r) => r.refundId === refundEntity.id);

      if (existingIndex >= 0) {
        order.refunds[existingIndex].status = 'Processed';
        order.refunds[existingIndex].processedAt = new Date();
      } else {
        order.refunds.push({
          refundId: refundEntity.id,
          paymentId: refundEntity.payment_id,
          amount: amountInRupees,
          currency: refundEntity.currency || 'INR',
          status: 'Processed',
          reason: refundEntity.notes?.reason || refundEntity.reason || '',
          createdAt: new Date(refundEntity.created_at ? refundEntity.created_at * 1000 : Date.now()),
          processedAt: new Date(),
        });
      }

      // Calculate total refunded from all Processed refunds
      const totalRefunded = order.refunds
        .filter((r) => r.status === 'Processed')
        .reduce((sum, r) => sum + r.amount, 0);

      order.totalRefunded = totalRefunded;

      // Handle full vs partial refund
      if (totalRefunded >= order.total) {
        order.paymentStatus = 'Refunded';
        order.orderStatus = 'Refunded';
        order.razorpayPaymentStatus = 'refunded';
      } else if (totalRefunded > 0) {
        order.paymentStatus = 'Partially Refunded';
      }

      order.timeline.push({
        status: totalRefunded >= order.total ? 'Refunded' : 'Partially Refunded',
        timestamp: new Date(),
        note: `Refund of ₹${amountInRupees.toFixed(2)} processed via Razorpay (${refundEntity.id}). Total refunded: ₹${totalRefunded.toFixed(2)} / ₹${order.total.toFixed(2)}`,
      });

      await order.save();
      console.log(`[Razorpay Webhook] Order ${order.orderNumber} refund processed: status=${order.paymentStatus}, totalRefunded=₹${totalRefunded.toFixed(2)}`);
      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    // -------------------------------------------------------------
    // EVENT 7: refund.failed
    // -------------------------------------------------------------
    case 'refund.failed': {
      if (!refundEntity) {
        return { status: 'ignored', event: eventType, message: 'Missing refund entity' };
      }

      const order = await findOrderByPaymentOrRefundRef(refundEntity.payment_id, refundEntity.notes);
      if (!order) {
        return { status: 'ignored', event: eventType, message: 'Order not found' };
      }

      const errorCode = refundEntity.error_code || 'REFUND_FAILED';
      const errorDescription =
        refundEntity.error_description || refundEntity.error_reason || 'Refund failed at gateway';

      if (!order.refunds) order.refunds = [];
      const existingIndex = order.refunds.findIndex((r) => r.refundId === refundEntity.id);

      if (existingIndex >= 0) {
        order.refunds[existingIndex].status = 'Failed';
        order.refunds[existingIndex].errorCode = errorCode;
        order.refunds[existingIndex].errorDescription = errorDescription;
      } else {
        order.refunds.push({
          refundId: refundEntity.id,
          paymentId: refundEntity.payment_id,
          amount: (refundEntity.amount || 0) / 100,
          currency: refundEntity.currency || 'INR',
          status: 'Failed',
          errorCode,
          errorDescription,
          createdAt: new Date(refundEntity.created_at ? refundEntity.created_at * 1000 : Date.now()),
        });
      }

      // Recalculate total refunded from Processed only
      const totalRefunded = order.refunds
        .filter((r) => r.status === 'Processed')
        .reduce((sum, r) => sum + r.amount, 0);

      order.totalRefunded = totalRefunded;

      // Do NOT mark order refunded if no processed refund matches total
      if (totalRefunded === 0 && (order.paymentStatus === 'Refunded' || order.paymentStatus === 'Partially Refunded')) {
        order.paymentStatus = 'Paid';
      } else if (totalRefunded > 0 && totalRefunded < order.total) {
        order.paymentStatus = 'Partially Refunded';
      }

      order.timeline.push({
        status: 'Refund Failed',
        timestamp: new Date(),
        note: `Refund attempt failed via Razorpay (${refundEntity.id}): ${errorDescription}`,
      });

      await order.save();
      console.warn(`[Razorpay Webhook] Order ${order.orderNumber} refund ${refundEntity.id} marked as Failed: ${errorDescription}`);
      return { status: 'ok', event: eventType, orderNumber: order.orderNumber };
    }

    default: {
      console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
      return { status: 'ignored', event: eventType, message: `Unhandled event type: ${eventType}` };
    }
  }
}

