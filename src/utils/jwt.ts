import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { ENV } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  role: 'customer' | 'admin';
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, ENV.JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
  };
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken?: string): void => {
  const isProduction = ENV.NODE_ENV === 'production';

  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }
};

export const clearAuthCookies = (res: Response): void => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};
