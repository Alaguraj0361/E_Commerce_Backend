import { Router } from 'express';
import {
  getStitchingCategories,
  createStitchingCategory,
  updateStitchingCategory,
  deleteStitchingCategory,
  getStitchingMeasurements,
  createStitchingMeasurement,
  updateStitchingMeasurement,
  deleteStitchingMeasurement,
  getStitchingOrders,
  createStitchingOrder,
  updateStitchingOrder,
  deleteStitchingOrder,
  bookStitchingService,
} from '../controllers/stitching.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public Customer Booking Routes
router.post('/book', bookStitchingService);
router.post('/public-booking', bookStitchingService);

// Category Routes
router.get('/categories', getStitchingCategories);
router.post('/categories', authenticate, requireAdmin, createStitchingCategory);
router.put('/categories/:id', authenticate, requireAdmin, updateStitchingCategory);
router.delete('/categories/:id', authenticate, requireAdmin, deleteStitchingCategory);

// Measurement Routes
router.get('/measurements', authenticate, requireAdmin, getStitchingMeasurements);
router.post('/measurements', authenticate, requireAdmin, createStitchingMeasurement);
router.put('/measurements/:id', authenticate, requireAdmin, updateStitchingMeasurement);
router.delete('/measurements/:id', authenticate, requireAdmin, deleteStitchingMeasurement);

// Dispatch Order Routes
router.get('/dispatch-orders', authenticate, requireAdmin, getStitchingOrders);
router.post('/dispatch-orders', authenticate, requireAdmin, createStitchingOrder);
router.put('/dispatch-orders/:id', authenticate, requireAdmin, updateStitchingOrder);
router.delete('/dispatch-orders/:id', authenticate, requireAdmin, deleteStitchingOrder);

export default router;
