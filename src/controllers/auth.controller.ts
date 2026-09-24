import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendEmail } from '../config/mail.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      sendError(res, 'Email address is already registered. Please login.', 409);
      return;
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'customer',
    });

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(
      res,
      'Registration successful. Welcome to our store!',
      {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        },
        token: accessToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    setAuthCookies(res, accessToken, refreshToken);

    sendSuccess(res, 'Login successful. Welcome back!', {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  clearAuthCookies(res);
  sendSuccess(res, 'Logged out successfully');
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }

  sendSuccess(res, 'User profile retrieved', {
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt,
    },
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Do not reveal user existence
      sendSuccess(res, 'If an account exists with that email, a password reset link has been sent.');
      return;
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${ENV.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please click on the link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested a password reset for your account. Click the button below to reset your password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </p>
          <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    sendSuccess(res, 'If an account exists with that email, a password reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      sendError(res, 'Password reset token is invalid or has expired', 400);
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!._id).select('+password');

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
