import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getWishlist);
router.post('/:productId', authenticate, addToWishlist);
router.delete('/:productId', authenticate, removeFromWishlist);

export default router;
