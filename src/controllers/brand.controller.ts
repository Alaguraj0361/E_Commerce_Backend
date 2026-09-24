import { Request, Response, NextFunction } from 'express';
import { Brand } from '../models/Brand.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getBrands = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, 'Brands retrieved successfully', brands);
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, logo, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await Brand.findOne({ slug });
    if (existing) {
      sendError(res, 'Brand with this name already exists', 409);
      return;
    }

    const brand = await Brand.create({ name, slug, logo, description });
    sendSuccess(res, 'Brand created successfully', brand, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      sendError(res, 'Brand not found', 404);
      return;
    }
    sendSuccess(res, 'Brand deleted successfully');
  } catch (error) {
    next(error);
  }
};
