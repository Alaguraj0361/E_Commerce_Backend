import { Response, NextFunction } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getDashboardStats = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockProducts,
      paidOrders,
      recentOrders,
      categories,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ orderStatus: 'Pending' }),
      Product.find({ stock: { $lte: 5 }, isActive: true }).select('name sku stock price images'),
      Order.find({ paymentStatus: 'Paid' }).select('total createdAt'),
      Order.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(6),
      Category.find({ isActive: true }).select('name slug'),
    ]);

    // Total Revenue
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Sales over last 7 days
    const last7Days: { date: string; sales: number; orders: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayOrders = paidOrders.filter((o) => o.createdAt.toISOString().slice(0, 10) === dateStr);
      const daySales = dayOrders.reduce((sum, o) => sum + o.total, 0);

      last7Days.push({
        date: dateStr,
        sales: Math.round(daySales * 100) / 100,
        orders: dayOrders.length,
      });
    }

    // Top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort({ bestSeller: -1, reviewCount: -1 })
      .limit(5)
      .select('name price stock rating reviewCount images sku');

    sendSuccess(res, 'Admin analytics retrieved successfully', {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      salesChart: last7Days,
      recentOrders,
      topProducts,
      categoriesCount: categories.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    sendSuccess(res, 'Customers list retrieved', customers);
  } catch (error) {
    next(error);
  }
};
