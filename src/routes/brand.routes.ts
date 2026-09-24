import { Router } from 'express';
import { getBrands, createBrand, deleteBrand } from '../controllers/brand.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getBrands);
router.post('/', authenticate, requireAdmin, createBrand);
router.delete('/:id', authenticate, requireAdmin, deleteBrand);

export default router;
