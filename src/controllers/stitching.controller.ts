import { Request, Response, NextFunction } from 'express';
import { StitchingCategory } from '../models/StitchingCategory.js';
import { StitchingMeasurement } from '../models/StitchingMeasurement.js';
import { StitchingOrder } from '../models/StitchingOrder.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// =========================================================================
// 1. CATEGORY CONTROLLERS
// =========================================================================
export const getStitchingCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await StitchingCategory.find().sort({ createdAt: -1 });
    sendSuccess(res, 'Stitching categories fetched successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const createStitchingCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, description, basePrice, estimatedTurnaroundDays, fields, isActive } = req.body;
    if (!name || !slug) {
      sendError(res, 'Name and slug are required', 400);
      return;
    }
    const created = await StitchingCategory.create({
      name,
      slug,
      description,
      basePrice,
      estimatedTurnaroundDays,
      fields,
      isActive: isActive !== undefined ? isActive : true,
    });
    sendSuccess(res, 'Category created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStitchingCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await StitchingCategory.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      sendError(res, 'Category not found', 404);
      return;
    }
    sendSuccess(res, 'Category updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteStitchingCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await StitchingCategory.findByIdAndDelete(id);
    if (!deleted) {
      sendError(res, 'Category not found', 404);
      return;
    }
    sendSuccess(res, 'Category deleted successfully', deleted);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. MEASUREMENT CONTROLLERS
// =========================================================================
export const getStitchingMeasurements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, category, date } = req.query;
    const query: any = {};

    if (category) {
      query.categorySlug = category;
    }
    if (date) {
      query.date = date;
    }
    if (search) {
      const q = String(search).trim();
      query.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
        { measurementCode: { $regex: q, $options: 'i' } },
      ];
    }

    const measurements = await StitchingMeasurement.find(query).sort({ createdAt: -1 });
    sendSuccess(res, 'Customer measurements fetched successfully', measurements);
  } catch (error) {
    next(error);
  }
};

export const createStitchingMeasurement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      date,
      customerName,
      customerPhone,
      customerEmail,
      customerCity,
      categorySlug,
      categoryName,
      measurements,
      specialInstructions,
      fitPreference,
      unit,
    } = req.body;

    if (!customerName || !customerPhone || !categorySlug) {
      sendError(res, 'Customer name, phone, and category are required', 400);
      return;
    }

    const count = await StitchingMeasurement.countDocuments();
    const measurementCode = `MEAS-${count + 1001}`;

    const created = await StitchingMeasurement.create({
      measurementCode,
      date: date || new Date().toISOString().split('T')[0],
      customerName,
      customerPhone,
      customerEmail,
      customerCity,
      categorySlug,
      categoryName,
      measurements: measurements || {},
      specialInstructions,
      fitPreference,
      unit: unit || 'inches',
    });

    sendSuccess(res, 'Measurement recorded successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStitchingMeasurement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await StitchingMeasurement.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      sendError(res, 'Measurement record not found', 404);
      return;
    }
    sendSuccess(res, 'Measurement updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteStitchingMeasurement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await StitchingMeasurement.findByIdAndDelete(id);
    if (!deleted) {
      sendError(res, 'Measurement record not found', 404);
      return;
    }
    sendSuccess(res, 'Measurement record deleted successfully', deleted);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 3. DISPATCH ORDER CONTROLLERS
// =========================================================================
export const getStitchingOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, category, priority } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category) {
      query.categorySlug = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (search) {
      const q = String(search).trim();
      query.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
        { stitchingOrderNumber: { $regex: q, $options: 'i' } },
        { trackingNumber: { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await StitchingOrder.find(query).sort({ createdAt: -1 });
    sendSuccess(res, 'Stitching dispatch orders fetched successfully', orders);
  } catch (error) {
    next(error);
  }
};

export const createStitchingOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      date,
      customerName,
      customerPhone,
      customerAddress,
      categorySlug,
      categoryName,
      measurementId,
      measurementCode,
      measurementSummary,
      estimatedDispatchDate,
      additionalInformation,
      liningType,
      fabricProvidedBy,
      assignedTailor,
      priority,
      status,
      stitchingCharge,
      advancePaid,
      courierPartner,
      trackingNumber,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !estimatedDispatchDate) {
      sendError(res, 'Customer name, phone, and estimated dispatch date are required', 400);
      return;
    }

    const count = await StitchingOrder.countDocuments();
    const stitchingOrderNumber = `STITCH-${count + 2001}`;
    const charge = Number(stitchingCharge) || 0;
    const advance = Number(advancePaid) || 0;
    const balanceDue = Math.max(0, charge - advance);

    const created = await StitchingOrder.create({
      stitchingOrderNumber,
      date: date || new Date().toISOString().split('T')[0],
      customerName,
      customerPhone,
      customerAddress,
      categorySlug,
      categoryName,
      measurementId,
      measurementCode,
      measurementSummary,
      estimatedDispatchDate,
      additionalInformation,
      liningType,
      fabricProvidedBy,
      assignedTailor,
      priority: priority || 'Normal',
      status: status || 'Order Confirmed',
      stitchingCharge: charge,
      advancePaid: advance,
      balanceDue,
      courierPartner,
      trackingNumber,
      notes,
    });

    sendSuccess(res, 'Stitching order created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStitchingOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.body.stitchingCharge !== undefined || req.body.advancePaid !== undefined) {
      const charge = req.body.stitchingCharge !== undefined ? Number(req.body.stitchingCharge) : undefined;
      const advance = req.body.advancePaid !== undefined ? Number(req.body.advancePaid) : undefined;
      if (charge !== undefined && advance !== undefined) {
        req.body.balanceDue = Math.max(0, charge - advance);
      }
    }

    const updated = await StitchingOrder.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      sendError(res, 'Stitching order not found', 404);
      return;
    }
    sendSuccess(res, 'Stitching order updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteStitchingOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await StitchingOrder.findByIdAndDelete(id);
    if (!deleted) {
      sendError(res, 'Stitching order not found', 404);
      return;
    }
    sendSuccess(res, 'Stitching order deleted successfully', deleted);
  } catch (error) {
    next(error);
  }
};
