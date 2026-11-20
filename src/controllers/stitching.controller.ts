import { Request, Response, NextFunction } from 'express';
import { StitchingCategory } from '../models/StitchingCategory.js';
import { StitchingMeasurement } from '../models/StitchingMeasurement.js';
import { StitchingOrder } from '../models/StitchingOrder.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendEmail } from '../config/mail.js';

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

// =========================================================================
// 4. PUBLIC STOREFRONT BESPOKE STITCHING BOOKING
// =========================================================================
export const bookStitchingService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerCity,
      customerAddress,
      categorySlug,
      categoryName,
      styleName,
      step1Value,
      step2Value,
      step3Value,
      step4Choice,
      customInfoSummary,
      addons,
      measurementMode,
      measurements,
      specialInstructions,
      fitPreference,
      unit,
      stitchingCharge,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !categorySlug) {
      sendError(res, 'Customer name, phone number, and stitching category are required', 400);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Create Measurement Record
    const measCount = await StitchingMeasurement.countDocuments();
    const measurementCode = `MEAS-${measCount + 1001}`;

    const newMeasurement = await StitchingMeasurement.create({
      measurementCode,
      date: todayStr,
      customerName,
      customerPhone,
      customerEmail: customerEmail || 'stitching@nalmarafashion.com',
      customerCity: customerCity || 'Thoothukudi',
      categorySlug,
      categoryName: categoryName || categorySlug,
      measurements: measurements || {},
      specialInstructions: specialInstructions || notes || '',
      fitPreference: fitPreference || 'Comfort Fit',
      unit: unit || 'inches',
    });

    // 2. Format additional information summary
    const additionalParts = [
      styleName ? `Style: ${styleName}` : '',
      step1Value ? `Step 1: ${step1Value}` : '',
      step2Value ? `Step 2: ${step2Value}` : '',
      step3Value ? `Step 3: ${step3Value}` : '',
      step4Choice ? `Lining: ${step4Choice}` : '',
      customInfoSummary ? `Customizations: ${customInfoSummary}` : '',
      Array.isArray(addons) && addons.length > 0 ? `Add-ons: ${addons.join(', ')}` : '',
      measurementMode ? `Measurement Mode: ${measurementMode}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    // 3. Estimated Dispatch Date (7 business days default)
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + 7);
    const estimatedDispatchDate = estDate.toISOString().split('T')[0];

    // 4. Create Stitching Dispatch Order
    const orderCount = await StitchingOrder.countDocuments();
    const stitchingOrderNumber = `STITCH-${orderCount + 2001}`;
    const charge = Number(stitchingCharge) || 0;

    const newOrder = await StitchingOrder.create({
      stitchingOrderNumber,
      date: todayStr,
      customerName,
      customerPhone,
      customerAddress: customerAddress || customerCity || 'Thoothukudi',
      categorySlug,
      categoryName: categoryName || categorySlug,
      measurementId: newMeasurement._id,
      measurementCode,
      measurementSummary:
        measurementMode === 'whatsapp'
          ? 'Measurements via WhatsApp / Sample Garment'
          : Object.entries(measurements || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ') || 'Online Bespoke Custom Measurement Form',
      estimatedDispatchDate,
      additionalInformation: additionalParts,
      liningType: step4Choice || 'Pure Mulmul Cotton (Pre-Washed)',
      fabricProvidedBy: 'Customer Provided',
      assignedTailor: 'Master Murugan (Atelier 1)',
      priority: 'Normal',
      status: 'Order Confirmed',
      stitchingCharge: charge,
      advancePaid: 0,
      balanceDue: charge,
      notes: notes || '',
    });

    // 5. Send notification email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'support@nalmarafashion.com',
        subject: `[New Stitching Order ${stitchingOrderNumber}] ${customerName} - ${categoryName || categorySlug}`,
        html: `
          <div style="font-family: serif; color: #1a1a1a; max-width: 600px; border: 1px solid #D4AF37; padding: 24px; border-radius: 12px; background: #FAF8F5;">
            <h2 style="color: #760159; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">New Bespoke Stitching Order Received</h2>
            <p><strong>Order Number:</strong> <span style="color: #760159; font-weight: bold;">${stitchingOrderNumber}</span></p>
            <p><strong>Measurement Code:</strong> ${measurementCode}</p>
            <p><strong>Customer Name:</strong> ${customerName}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
            <p><strong>City / Address:</strong> ${customerAddress || customerCity || 'Thoothukudi'}</p>
            <p><strong>Service / Category:</strong> ${categoryName || categorySlug}</p>
            <p><strong>Specifications:</strong> ${additionalParts || 'Standard'}</p>
            <p><strong>Estimated Dispatch:</strong> ${estimatedDispatchDate}</p>
            <p><strong>Stitching Charge:</strong> ₹${charge}</p>
            <p style="margin-top: 20px; font-size: 11px; color: #777;">Access live order details in Nalmara Fashion Admin Panel &gt; Stitching &amp; Dispatch</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn('Failed to send admin email notification for stitching booking:', e);
    }

    sendSuccess(
      res,
      'Bespoke stitching booking submitted successfully',
      {
        order: newOrder,
        measurement: newMeasurement,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};
