import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });
    sendSuccess(res, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }
    sendSuccess(res, 'Category retrieved successfully', category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, image } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) {
      sendError(res, 'Category with this name already exists', 409);
      return;
    }

    const category = await Category.create({ name, slug, description, image });
    sendSuccess(res, 'Category created successfully', category, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }
    sendSuccess(res, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }
    sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
