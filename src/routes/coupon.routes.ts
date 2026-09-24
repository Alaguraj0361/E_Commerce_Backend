import { Router } from 'express';
import {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  validateCouponSchema,
  createCouponSchema,
} from '../validators/coupon.validator.js';

const router = Router();

router.post('/validate', optionalAuth, validate(validateCouponSchema), validateCoupon);

// Admin routes
router.get('/', authenticate, requireAdmin, getAllCoupons);
router.post('/', authenticate, requireAdmin, validate(createCouponSchema), createCoupon);
router.put('/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);

export default router;
