import { Router } from 'express';
import {
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  clearAllOrders,
} from '../controllers/order.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateOrderStatusSchema } from '../validators/order.validator.js';

const router = Router();

router.get('/', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);
router.put(
  '/admin/:id/status',
  authenticate,
  requireAdmin,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);
router.delete('/admin/clear-all', authenticate, requireAdmin, clearAllOrders);
router.delete('/admin/:id', authenticate, requireAdmin, deleteOrder);

export default router;
