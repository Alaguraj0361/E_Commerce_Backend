import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      hasDiscount,
      sort = 'featured',
      featured,
      bestSeller,
      newArrival,
    } = req.query;

    const query: any = {};
    if (req.query.isActive === 'false') {
      query.isActive = false;
    } else if (req.query.isActive === 'all') {
      // allow both active and inactive
    } else {
      query.isActive = true;
    }

    // Search query
    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    // Category filter by ID or slug
    if (category) {
      const isObjectId =
        typeof category === 'string' &&
        mongoose.Types.ObjectId.isValid(category) &&
        category.length === 24;

      const catDoc = await Category.findOne(
        isObjectId
          ? { $or: [{ slug: category }, { _id: category }] }
          : { slug: category }
      );
      if (catDoc) {
        query.category = catDoc._id;
      } else if (isObjectId) {
        query.category = category;
      }
    }

    // Brand filter by ID or slug
    if (brand) {
      const isObjectId =
        typeof brand === 'string' &&
        mongoose.Types.ObjectId.isValid(brand) &&
        brand.length === 24;

      if (isObjectId) {
        query.brand = brand;
      } else {
        const brandDoc = await Brand.findOne({ slug: brand });
        if (brandDoc) {
          query.brand = brandDoc._id;
        }
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // In Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Discount filter
    if (hasDiscount === 'true') {
      query.$expr = { $gt: ['$compareAtPrice', '$price'] };
    }

    // Flags
    if (featured === 'true') query.featured = true;
    if (bestSeller === 'true') query.bestSeller = true;
    if (newArrival === 'true') query.newArrival = true;

    // Sorting
    let sortObj: any = { createdAt: -1 };
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'price-asc':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'best-seller':
        sortObj = { bestSeller: -1, rating: -1 };
        break;
      case 'top-rated':
        sortObj = { rating: -1, reviewCount: -1 };
        break;
      case 'featured':
      default:
        sortObj = { featured: -1, createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    sendSuccess(res, 'Products retrieved successfully', products, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug description')
      .populate('brand', 'name slug logo description');

    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, 'Product details retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, 'Product retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      sendError(res, 'Product not found', 404);
      return;
    }

    const related = await Product.find({
      category: currentProduct.category,
      _id: { $ne: currentProduct._id },
      isActive: true,
    })
      .populate('category', 'name slug')
      .limit(6);

    sendSuccess(res, 'Related products retrieved successfully', related);
  } catch (error) {
    next(error);
  }
};

export const getHomeCollections = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [featured, trending, newArrivals, bestSellers] = await Promise.all([
      Product.find({ featured: true, isActive: true }).populate('category', 'name slug').limit(8),
      Product.find({ rating: { $gte: 4 }, isActive: true }).populate('category', 'name slug').limit(8),
      Product.find({ newArrival: true, isActive: true }).populate('category', 'name slug').sort({ createdAt: -1 }).limit(8),
      Product.find({ bestSeller: true, isActive: true }).populate('category', 'name slug').limit(8),
    ]);

    sendSuccess(res, 'Home collections retrieved', {
      featured,
      trending,
      newArrivals,
      bestSellers,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, ...rest } = req.body;

    // Generate slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await Product.create({
      name,
      slug,
      ...rest,
    });

    sendSuccess(res, 'Product created successfully', product, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category brand');

    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, 'Product updated successfully', product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};
