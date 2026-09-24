import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401);
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      sendError(res, 'User session expired or user no longer exists.', 401);
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token. Please log in again.', 401);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);
      if (user) {
        req.user = user;
        req.tokenPayload = payload;
      }
    }
  } catch (error) {
    // Continue as guest
  }
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    sendError(res, 'Access denied. Administrator privileges required.', 403);
    return;
  }
  next();
};
