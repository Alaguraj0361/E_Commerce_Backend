import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const detailedMessage =
          formattedErrors.map((err) => err.message).filter(Boolean).join(', ') || 'Validation failed';
        sendError(res, detailedMessage, 400, formattedErrors);
        return;
      }
      sendError(res, 'Invalid request data', 400);
    }
  };
};
