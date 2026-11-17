import mongoose from 'mongoose';
import crypto from 'crypto';
import { ENV } from './config/env.js';
import { Order } from './models/Order.js';
import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Cart } from './models/Cart.js';
import { Coupon } from './models/Coupon.js';
import { Category } from './models/Category.js';
import { ProcessedWebhookEvent } from './models/ProcessedWebhookEvent.js';
import {
  processRazorpayWebhook,
  verifyRazorpaySignature,
  WebhookSignatureError,
} from './services/razorpayWebhook.service.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    testResults.push({ name: testName, passed: true });
  } else {
    console.error(`  ✗ [FAIL] ${testName} -> ${failureDetails || 'Assertion failed'}`);
    testResults.push({ name: testName, passed: false, error: failureDetails });
  }
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function runRazorpayWebhookTestSuite() {
  console.log('===============================================================');
  console.log('  RAZORPAY PRODUCTION WEBHOOK SUITE: 7 EVENTS, IDEMPOTENCY & AUDIT');
  console.log('===============================================================\n');

  try {
    await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB.\n');

    const testSecret = 'nalmara_test_secret_2026';
    ENV.RAZORPAY_WEBHOOK_SECRET = testSecret;

    // Clean up test events
    await ProcessedWebhookEvent.deleteMany({ source: 'razorpay' });

    // Setup dummy user & product for test orders
    let testUser = await User.findOne({ email: 'webhook_test@nalmara.com' });
    if (!testUser) {
      testUser = await User.create({
        firstName: 'Webhook',
        lastName: 'Tester',
        email: 'webhook_test@nalmara.com',
        phone: '+919876543210',
        password: 'Password@123',
        role: 'customer',
        isEmailVerified: true,
      });
    }

    let testCategory = await Category.findOne();
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test Category',
      });
    }

    let testProduct = await Product.findOne({ sku: 'TEST-SKU-WEBHOOK' });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Webhook Pure Silk Saree',
        slug: 'webhook-silk-saree',
        description: 'Test item for stock management',
        category: testCategory._id,
        price: 5000,
        sku: 'TEST-SKU-WEBHOOK',
        stock: 50,
      });
    } else {
      testProduct.stock = 50;
      await testProduct.save();
    }

    // Helper to generate fresh test orders
    let orderCounter = 1;
    async function createTestOrder(total = 5000, itemsCount = 1) {
      const uniqueId = `${Date.now()}_${orderCounter++}`;
      return await Order.create({
        orderNumber: `ORD-TEST-${uniqueId}`,
        user: testUser!._id,
        items: [
          {
            product: testProduct!._id,
            name: testProduct!.name,
            image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
            price: total,
            quantity: itemsCount,
            sku: testProduct!.sku,
          },
        ],
        shippingAddress: {
          fullName: 'Test Receiver',
          phone: '+919876543210',
          addressLine1: 'Test Address Line 1',
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '600001',
          country: 'India',
        },
        subtotal: total,
        total,
        paymentMethod: 'razorpay',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        razorpayOrderId: `order_rzp_${uniqueId}`,
        timeline: [{ status: 'Pending', timestamp: new Date() }],
      });
    }

    // -------------------------------------------------------------
    // SUITE 1: Webhook Signature Verification
    // -------------------------------------------------------------
    console.log('--- Suite 1: Signature Verification ---');
    const validBody = JSON.stringify({ event: 'order.paid', id: 'evt_test_sig' });
    const validSig = generateSignature(validBody, testSecret);
    const tamperedSig = generateSignature('tampered', testSecret);

    assert(verifyRazorpaySignature(validBody, validSig, testSecret) === true, 'Valid signature verifies successfully');
    assert(verifyRazorpaySignature(validBody, tamperedSig, testSecret) === false, 'Tampered signature fails verification');
    assert(verifyRazorpaySignature(validBody, undefined, testSecret) === false, 'Missing signature fails verification');

    let signatureErrorCaught = false;
    try {
      await processRazorpayWebhook(validBody, 'invalid_sig');
    } catch (e) {
      signatureErrorCaught = e instanceof WebhookSignatureError;
    }
    assert(signatureErrorCaught, 'processRazorpayWebhook throws WebhookSignatureError on invalid signature');

    // -------------------------------------------------------------
    // SUITE 2: Event 1 - payment.authorized
    // -------------------------------------------------------------
    console.log('\n--- Suite 2: payment.authorized ---');
    const orderAuth = await createTestOrder(4000);
    const authEventPayload = {
      id: `evt_auth_${Date.now()}`,
      event: 'payment.authorized',
      payload: {
        payment: {
          entity: {
            id: `pay_auth_${Date.now()}`,
            order_id: orderAuth.razorpayOrderId,
            amount: 400000,
            currency: 'INR',
            status: 'authorized',
            method: 'upi',
            vpa: 'user@okaxis',
          },
        },
      },
    };

    const authBody = JSON.stringify(authEventPayload);
    const authRes = await processRazorpayWebhook(authBody, generateSignature(authBody, testSecret));
    assert(authRes.status === 'ok', 'payment.authorized accepted');

    const orderAuthAfter = await Order.findById(orderAuth._id);
    assert(orderAuthAfter?.paymentStatus === 'Authorized', 'Payment status updated to Authorized');
    assert(orderAuthAfter?.orderStatus === 'Pending', 'Order status remains Pending (not marked Paid)');
    assert(orderAuthAfter?.razorpayPaymentId === authEventPayload.payload.payment.entity.id, 'Payment ID saved');

    // Verify stock was not touched
    const prodAfterAuth = await Product.findById(testProduct._id);
    assert(prodAfterAuth?.stock === 50, 'Stock was not decremented during authorization');

    // -------------------------------------------------------------
    // SUITE 3: Event 2 - payment.captured
    // -------------------------------------------------------------
    console.log('\n--- Suite 3: payment.captured ---');
    const orderCap = await createTestOrder(5000, 2);
    // Put item in cart for user
    await Cart.findOneAndUpdate({ user: testUser._id }, { items: [{ product: testProduct._id, quantity: 2 }] }, { upsert: true });

    const capturedEventPayload = {
      id: `evt_cap_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_cap_${Date.now()}`,
            order_id: orderCap.razorpayOrderId,
            amount: 500000,
            currency: 'INR',
            status: 'captured',
            method: 'card',
            card: {
              network: 'Visa',
              last4: '4242',
            },
          },
        },
      },
    };

    const capBody = JSON.stringify(capturedEventPayload);
    const capRes = await processRazorpayWebhook(capBody, generateSignature(capBody, testSecret));
    assert(capRes.status === 'ok', 'payment.captured accepted');

    const orderCapAfter = await Order.findById(orderCap._id);
    assert(orderCapAfter?.paymentStatus === 'Paid', 'Payment status updated to Paid');
    assert(orderCapAfter?.orderStatus === 'Confirmed', 'Order status updated to Confirmed');
    assert(orderCapAfter?.razorpayPaymentDetails?.cardNetwork === 'Visa', 'Card network stored');

    // Verify stock decremented by 2
    const prodAfterCap = await Product.findById(testProduct._id);
    assert(prodAfterCap?.stock === 48, 'Product stock decremented by 2');

    // Verify cart cleared
    const cartAfterCap = await Cart.findOne({ user: testUser._id });
    assert(cartAfterCap?.items.length === 0, 'User cart cleared upon payment capture');

    // -------------------------------------------------------------
    // SUITE 4: Event 3 - order.paid
    // -------------------------------------------------------------
    console.log('\n--- Suite 4: order.paid ---');
    const orderPaidTest = await createTestOrder(3500, 1);
    const orderPaidPayload = {
      id: `evt_ord_paid_${Date.now()}`,
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: orderPaidTest.razorpayOrderId,
            amount: 350000,
            amount_paid: 350000,
            status: 'paid',
          },
        },
        payment: {
          entity: {
            id: `pay_ord_paid_${Date.now()}`,
            order_id: orderPaidTest.razorpayOrderId,
            method: 'netbanking',
            bank: 'HDFC',
          },
        },
      },
    };

    const opBody = JSON.stringify(orderPaidPayload);
    const opRes = await processRazorpayWebhook(opBody, generateSignature(opBody, testSecret));
    assert(opRes.status === 'ok', 'order.paid processed successfully');

    const orderPaidAfter = await Order.findById(orderPaidTest._id);
    assert(orderPaidAfter?.paymentStatus === 'Paid', 'Order paymentStatus updated to Paid via order.paid');
    assert(orderPaidAfter?.orderStatus === 'Confirmed', 'Order orderStatus updated to Confirmed');

    // -------------------------------------------------------------
    // SUITE 5: Duplicate Webhook Delivery & Multi-Event Idempotency
    // -------------------------------------------------------------
    console.log('\n--- Suite 5: Idempotency & Duplicate Deliveries ---');
    // 5A: Same event ID sent again
    const dupRes = await processRazorpayWebhook(opBody, generateSignature(opBody, testSecret));
    assert(dupRes.status === 'duplicate', 'Exact duplicate webhook detected and rejected safely');

    // 5B: order.paid followed by payment.captured for same order
    const stockBefore = (await Product.findById(testProduct._id))?.stock || 0;
    const secondCapPayload = {
      id: `evt_cap_second_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_second_${Date.now()}`,
            order_id: orderPaidTest.razorpayOrderId,
            amount: 350000,
            status: 'captured',
            method: 'netbanking',
          },
        },
      },
    };
    const scBody = JSON.stringify(secondCapPayload);
    await processRazorpayWebhook(scBody, generateSignature(scBody, testSecret));

    const stockAfter = (await Product.findById(testProduct._id))?.stock || 0;
    assert(stockBefore === stockAfter, 'Stock was NOT decremented twice when payment.captured arrived after order.paid');

    // -------------------------------------------------------------
    // SUITE 6: Event 4 - payment.failed
    // -------------------------------------------------------------
    console.log('\n--- Suite 6: payment.failed ---');
    const orderFail = await createTestOrder(2500);
    const failPayload = {
      id: `evt_fail_${Date.now()}`,
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: orderFail.razorpayOrderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Payment was declined by issuing bank',
          },
        },
      },
    };
    const failBody = JSON.stringify(failPayload);
    await processRazorpayWebhook(failBody, generateSignature(failBody, testSecret));

    const orderFailAfter = await Order.findById(orderFail._id);
    assert(orderFailAfter?.paymentStatus === 'Failed', 'Payment status marked as Failed');
    assert(orderFailAfter?.razorpayPaymentDetails?.errorCode === 'BAD_REQUEST_ERROR', 'Error code recorded');
    assert(Boolean(orderFailAfter?.razorpayPaymentDetails?.errorDescription?.includes('declined')), 'Error description recorded');

    // Test that payment.failed cannot overwrite an already Paid order
    const failOnPaidPayload = {
      id: `evt_fail_on_paid_${Date.now()}`,
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_fail_late_${Date.now()}`,
            order_id: orderCap.razorpayOrderId, // orderCap is already Paid
            error_code: 'GATEWAY_ERROR',
            error_description: 'Belated failure should not overwrite paid',
          },
        },
      },
    };
    const fopBody = JSON.stringify(failOnPaidPayload);
    await processRazorpayWebhook(fopBody, generateSignature(fopBody, testSecret));
    const orderStillPaid = await Order.findById(orderCap._id);
    assert(orderStillPaid?.paymentStatus === 'Paid', 'payment.failed did NOT overwrite an already captured/paid order');

    // -------------------------------------------------------------
    // SUITE 7: Event 5 - refund.created
    // -------------------------------------------------------------
    console.log('\n--- Suite 7: refund.created ---');
    const refundCreatedPayload = {
      id: `evt_ref_created_${Date.now()}`,
      event: 'refund.created',
      payload: {
        refund: {
          entity: {
            id: `rfnd_cr_${Date.now()}`,
            payment_id: orderCapAfter?.razorpayPaymentId,
            amount: 200000, // ₹2,000 partial refund request
            status: 'created',
            currency: 'INR',
            notes: { reason: 'Customer requested size exchange' },
          },
        },
      },
    };
    const rcBody = JSON.stringify(refundCreatedPayload);
    await processRazorpayWebhook(rcBody, generateSignature(rcBody, testSecret));

    const orderAfterRefCreated = await Order.findById(orderCap._id);
    assert(orderAfterRefCreated?.refunds?.length === 1, 'Refund record created in order');
    assert(orderAfterRefCreated?.refunds[0].status === 'Pending', 'Refund status is Pending upon refund.created');
    assert(orderAfterRefCreated?.paymentStatus === 'Paid', 'Order remains Paid while refund is only pending');

    // -------------------------------------------------------------
    // SUITE 8: Event 6 - refund.processed (Partial & Full)
    // -------------------------------------------------------------
    console.log('\n--- Suite 8: refund.processed (Partial and Multiple Refunds) ---');
    // 8A: Partial refund processed (₹2,000 out of ₹5,000)
    const refundProcessed1 = {
      id: `evt_ref_proc_1_${Date.now()}`,
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: refundCreatedPayload.payload.refund.entity.id,
            payment_id: orderCapAfter?.razorpayPaymentId,
            amount: 200000,
            status: 'processed',
          },
        },
      },
    };
    const rpBody1 = JSON.stringify(refundProcessed1);
    await processRazorpayWebhook(rpBody1, generateSignature(rpBody1, testSecret));

    const orderPartiallyRefunded = await Order.findById(orderCap._id);
    assert(orderPartiallyRefunded?.paymentStatus === 'Partially Refunded', 'Order marked as Partially Refunded (₹2,000 < ₹5,000)');
    assert(orderPartiallyRefunded?.totalRefunded === 2000, 'totalRefunded is ₹2,000');

    // 8B: Second refund processed (remaining ₹3,000 -> accumulates to ₹5,000 full refund)
    const refundProcessed2 = {
      id: `evt_ref_proc_2_${Date.now()}`,
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: `rfnd_full_${Date.now()}`,
            payment_id: orderCapAfter?.razorpayPaymentId,
            amount: 300000, // ₹3,000
            status: 'processed',
          },
        },
      },
    };
    const rpBody2 = JSON.stringify(refundProcessed2);
    await processRazorpayWebhook(rpBody2, generateSignature(rpBody2, testSecret));

    const orderFullyRefunded = await Order.findById(orderCap._id);
    assert(orderFullyRefunded?.totalRefunded === 5000, 'totalRefunded accurately sums multiple refunds (₹5,000)');
    assert(orderFullyRefunded?.paymentStatus === 'Refunded', 'Order marked as Fully Refunded when total refunds >= order total');
    assert(orderFullyRefunded?.orderStatus === 'Refunded', 'Order orderStatus updated to Refunded');

    // -------------------------------------------------------------
    // SUITE 9: Event 7 - refund.failed
    // -------------------------------------------------------------
    console.log('\n--- Suite 9: refund.failed ---');
    const orderForFailRefund = await createTestOrder(3000);
    // Mark order as paid first
    orderForFailRefund.paymentStatus = 'Paid';
    orderForFailRefund.razorpayPaymentId = `pay_for_ref_fail_${Date.now()}`;
    await orderForFailRefund.save();

    const refundFailedPayload = {
      id: `evt_ref_failed_${Date.now()}`,
      event: 'refund.failed',
      payload: {
        refund: {
          entity: {
            id: `rfnd_failed_${Date.now()}`,
            payment_id: orderForFailRefund.razorpayPaymentId,
            amount: 300000,
            error_code: 'BANK_ACCOUNT_CLOSED',
            error_description: 'Beneficiary bank account is closed',
          },
        },
      },
    };
    const rfBody = JSON.stringify(refundFailedPayload);
    await processRazorpayWebhook(rfBody, generateSignature(rfBody, testSecret));

    const orderAfterFailRefund = await Order.findById(orderForFailRefund._id);
    assert(orderAfterFailRefund?.paymentStatus === 'Paid', 'Order was NOT marked refunded on failed refund');
    const failedRefundItem = orderAfterFailRefund?.refunds.find(r => r.refundId === refundFailedPayload.payload.refund.entity.id);
    assert(failedRefundItem?.status === 'Failed', 'Refund item marked with status Failed');
    assert(failedRefundItem?.errorCode === 'BANK_ACCOUNT_CLOSED', 'Error code recorded for failed refund');

    // -------------------------------------------------------------
    // SUITE 10: Concurrent Webhook Requests
    // -------------------------------------------------------------
    console.log('\n--- Suite 10: Concurrent Webhook Requests ---');
    const orderConcurrent = await createTestOrder(6000, 1);
    const stockStart = (await Product.findById(testProduct._id))?.stock || 0;

    const concurrentEvent1 = {
      id: `evt_conc_1_${Date.now()}`,
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: orderConcurrent.razorpayOrderId,
            amount: 600000,
            status: 'paid',
          },
        },
        payment: {
          entity: {
            id: `pay_conc_1_${Date.now()}`,
            order_id: orderConcurrent.razorpayOrderId,
          },
        },
      },
    };

    const concurrentEvent2 = {
      id: `evt_conc_2_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_conc_2_${Date.now()}`,
            order_id: orderConcurrent.razorpayOrderId,
            amount: 600000,
            status: 'captured',
          },
        },
      },
    };

    const b1 = JSON.stringify(concurrentEvent1);
    const b2 = JSON.stringify(concurrentEvent2);

    // Fire in parallel
    const [c1Res, c2Res] = await Promise.all([
      processRazorpayWebhook(b1, generateSignature(b1, testSecret)),
      processRazorpayWebhook(b2, generateSignature(b2, testSecret)),
    ]);

    assert(c1Res.status === 'ok' && c2Res.status === 'ok', 'Both concurrent webhook requests completed safely');
    const stockEnd = (await Product.findById(testProduct._id))?.stock || 0;
    assert(stockStart - stockEnd === 1, 'Inventory decremented exactly ONCE under concurrent webhook arrival');

    // -------------------------------------------------------------
    // SUITE 11: Non-Existent / Invalid Reference
    // -------------------------------------------------------------
    console.log('\n--- Suite 11: Non-Existent References ---');
    const nonExistentPayload = {
      id: `evt_non_exist_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_non_exist_${Date.now()}`,
            order_id: 'order_non_existent_999999',
            amount: 10000,
          },
        },
      },
    };
    const neBody = JSON.stringify(nonExistentPayload);
    const neRes = await processRazorpayWebhook(neBody, generateSignature(neBody, testSecret));
    assert(neRes.status === 'ignored', 'Non-existent order reference handled gracefully with ignored status');

    console.log('\n===============================================================');
    const allPassed = testResults.every((r) => r.passed);
    const passCount = testResults.filter((r) => r.passed).length;
    const failCount = testResults.filter((r) => !r.passed).length;
    console.log(`  SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${testResults.length})`);
    console.log('===============================================================');

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Fatal Test Runner Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runRazorpayWebhookTestSuite();

