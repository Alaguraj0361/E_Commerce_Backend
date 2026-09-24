import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  voteHelpful,
  getAllReviewsAdmin,
  deleteReviewAdmin,
} from '../controllers/review.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema } from '../validators/review.validator.js';

const router = Router();

router.get('/admin/all', authenticate, requireAdmin, getAllReviewsAdmin);
router.delete('/admin/:id', authenticate, requireAdmin, deleteReviewAdmin);

router.get('/product/:id', getProductReviews);
router.post('/product/:id', authenticate, validate(createReviewSchema), createReview);
router.post('/:id/helpful', voteHelpful);

export default router;
