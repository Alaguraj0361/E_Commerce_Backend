import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getUserOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 });
    sendSuccess(res, 'User orders retrieved successfully', orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const clean = (id || '').trim();

    let query: any = {};
    if (mongoose.Types.ObjectId.isValid(clean)) {
      query = { $or: [{ _id: clean }, { orderNumber: clean }] };
    } else {
      query = { orderNumber: { $regex: new RegExp(`^${clean}$`, 'i') } };
    }

    const order = await Order.findOne(query).populate('items.product', 'name slug images price');

    if (!order) {
      sendError(res, `Order #${clean} not found. Please verify your order number.`, 404);
      return;
    }

    // Verify ownership or admin
    if (
      req.user &&
      req.user.role !== 'admin' &&
      order.user &&
      order.user.toString() !== req.user._id.toString()
    ) {
      sendError(res, 'Unauthorized to view this order', 403);
      return;
    }

    sendSuccess(res, 'Order retrieved successfully', order);
  } catch (error) {
    next(error);
  }
};

export const trackOrderPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;
    const clean = (identifier || '').trim();

    if (!clean) {
      sendError(res, 'Please provide an Order ID or Order Number', 400);
      return;
    }

    let query: any = {};
    if (mongoose.Types.ObjectId.isValid(clean)) {
      query = { $or: [{ _id: clean }, { orderNumber: clean }] };
    } else {
      query = { orderNumber: { $regex: new RegExp(`^${clean}$`, 'i') } };
    }

    const order = await Order.findOne(query).populate('items.product', 'name slug images price');

    if (!order) {
      sendError(res, `No order found matching "${clean}". Please verify your details.`, 404);
      return;
    }

    sendSuccess(res, 'Order tracking details retrieved successfully', order);
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 15, status, paymentStatus, search } = req.query;

    const query: any = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    sendSuccess(res, 'Orders retrieved successfully', orders, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    order.orderStatus = orderStatus;
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    order.timeline.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Order marked as ${orderStatus}`,
    });

    await order.save();
    sendSuccess(res, 'Order status updated successfully', order);
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    sendSuccess(res, 'Order permanently deleted', {
      id: order._id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await Order.deleteMany({});
    sendSuccess(res, `All orders cleared successfully (${result.deletedCount} removed)`, {
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

