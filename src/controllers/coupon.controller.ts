import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/Coupon.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const validateCoupon = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code, orderTotal } = req.body;

    if (!code || orderTotal === undefined) {
      sendError(res, 'Coupon code and order total are required', 400);
      return;
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      sendError(res, 'Invalid coupon code', 404);
      return;
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      sendError(res, 'This coupon is not yet active', 400);
      return;
    }

    if (coupon.expiryDate < now) {
      sendError(res, 'This coupon has expired', 400);
      return;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      sendError(res, 'Coupon usage limit has been reached', 400);
      return;
    }

    if (coupon.minimumOrderAmount && orderTotal < coupon.minimumOrderAmount) {
      sendError(
        res,
        `Minimum order amount of $${coupon.minimumOrderAmount.toFixed(2)} required for this coupon`,
        400
      );
      return;
    }

    // Per user usage check
    if (req.user && coupon.perUserLimit) {
      const userUsage = coupon.userUsages.get(req.user._id.toString()) || 0;
      if (userUsage >= coupon.perUserLimit) {
        sendError(res, 'You have already reached the maximum usage limit for this coupon', 400);
        return;
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
        discountAmount = coupon.maximumDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, orderTotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, Math.round((orderTotal - discountAmount) * 100) / 100);

    sendSuccess(res, 'Coupon applied successfully', {
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalTotal,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    sendSuccess(res, 'Coupons retrieved successfully', coupons);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const code = req.body.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code });

    if (existing) {
      sendError(res, 'Coupon code already exists', 409);
      return;
    }

    const coupon = await Coupon.create({
      ...req.body,
      code,
    });

    sendSuccess(res, 'Coupon created successfully', coupon, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.body.code) {
      req.body.code = req.body.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      sendError(res, 'Coupon not found', 404);
      return;
    }

    sendSuccess(res, 'Coupon updated successfully', coupon);
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      sendError(res, 'Coupon not found', 404);
      return;
    }

    sendSuccess(res, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};
