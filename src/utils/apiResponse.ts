import { Response } from 'express';

export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string = 'Operation successful',
  data?: T,
  statusCode: number = 200,
  meta?: ApiResponseData['meta']
): Response => {
  const responsePayload: ApiResponseData<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string = 'Something went wrong',
  statusCode: number = 500,
  errors: any[] = []
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
