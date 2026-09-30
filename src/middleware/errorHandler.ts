import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Occurred]:', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    sendError(res, `Duplicate entry for ${field}. Please use another value.`, 409);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    const detailedMessage =
      errors.map((e: any) => e.message).filter(Boolean).join(', ') || 'Database validation failed';
    sendError(res, detailedMessage, 400, errors);
    return;
  }

  // CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `No matching order or record found for "${err.value}". Please check your details.`, 404);
    return;
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const errors = ENV.NODE_ENV === 'development' ? [err.stack] : [];

  sendError(res, message, statusCode, errors);
};
