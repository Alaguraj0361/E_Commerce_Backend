import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
} from '../controllers/cart.controller.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getCart);
router.post('/', optionalAuth, addToCart);
router.put('/:itemId', optionalAuth, updateCartItem);
router.delete('/:itemId', optionalAuth, removeFromCart);
router.delete('/', optionalAuth, clearCart);
router.post('/merge', authenticate, mergeGuestCart);

export default router;
