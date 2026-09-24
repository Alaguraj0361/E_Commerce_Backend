import { Response, NextFunction } from 'express';
import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user!._id }).populate({
      path: 'products',
      match: { isActive: true },
      populate: { path: 'category', select: 'name slug' },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user!._id, products: [] });
    }

    sendSuccess(res, 'Wishlist retrieved successfully', wishlist);
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    let wishlist = await Wishlist.findOne({ user: req.user!._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user!._id, products: [] });
    }

    const exists = wishlist.products.some((p) => p.toString() === productId);
    if (!exists) {
      wishlist.products.push(product._id);
      await wishlist.save();
    }

    const populated = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug' },
    });

    sendSuccess(res, 'Product added to wishlist', populated);
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user!._id });
    if (!wishlist) {
      sendError(res, 'Wishlist not found', 404);
      return;
    }

    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug' },
    });

    sendSuccess(res, 'Product removed from wishlist', populated);
  } catch (error) {
    next(error);
  }
};
