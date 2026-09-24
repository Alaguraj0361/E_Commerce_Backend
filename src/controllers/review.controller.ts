import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total, allRatings] = await Promise.all([
      Review.find({ product: id })
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ product: id }),
      Review.find({ product: id }).select('rating'),
    ]);

    // Calculate rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of allRatings) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    }

    const averageRating = allRatings.length > 0 ? Math.round((sum / allRatings.length) * 10) / 10 : 0;

    sendSuccess(
      res,
      'Reviews retrieved successfully',
      {
        reviews,
        averageRating,
        distribution,
        totalReviews: total,
      },
      200,
      {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    );
  } catch (error) {
    next(error);
  }
};

export const createReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: productId } = req.params;
    const { rating, title, comment, images = [] } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: req.user!._id });
    if (existing) {
      sendError(res, 'You have already submitted a review for this product', 409);
      return;
    }

    // Check if user is a verified buyer
    const purchasedOrder = await Order.findOne({
      user: req.user!._id,
      'items.product': productId,
      paymentStatus: 'Paid',
    });

    const isVerifiedPurchase = !!purchasedOrder;

    const review = await Review.create({
      product: productId,
      user: req.user!._id,
      order: purchasedOrder?._id,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase,
    });

    // Recompute product rating & count
    const allReviews = await Review.find({ product: productId }).select('rating');
    const totalRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = Math.round((totalRating / allReviews.length) * 10) / 10;

    product.rating = avg;
    product.reviewCount = allReviews.length;
    await product.save();

    const populated = await Review.findById(review._id).populate('user', 'firstName lastName avatar');
    sendSuccess(res, 'Review submitted successfully', populated, 201);
  } catch (error) {
    next(error);
  }
};

export const voteHelpful = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      sendError(res, 'Review not found', 404);
      return;
    }

    sendSuccess(res, 'Marked as helpful', { helpfulVotes: review.helpfulVotes });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('product', 'name slug images')
        .populate('user', 'firstName lastName email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(),
    ]);

    sendSuccess(res, 'Reviews retrieved for admin', reviews, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      sendError(res, 'Review not found', 404);
      return;
    }

    // Recalculate product rating
    const allReviews = await Review.find({ product: review.product }).select('rating');
    const totalRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = allReviews.length > 0 ? Math.round((totalRating / allReviews.length) * 10) / 10 : 0;

    await Product.findByIdAndUpdate(review.product, {
      rating: avg,
      reviewCount: allReviews.length,
    });

    sendSuccess(res, 'Review moderated and removed successfully');
  } catch (error) {
    next(error);
  }
};

