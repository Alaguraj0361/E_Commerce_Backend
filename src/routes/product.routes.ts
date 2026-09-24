import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  getHomeCollections,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const router = Router();

router.get('/collections/home', getHomeCollections);
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);

// Admin routes
router.post('/', authenticate, requireAdmin, validate(createProductSchema), createProduct);
router.put('/:id', authenticate, requireAdmin, validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
