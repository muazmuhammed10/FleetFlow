import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const user = await authService.registerCustomer(input);
    sendCreated(res, user, 'Account created successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    const result = await authService.login(input, ipAddress, userAgent);
    sendSuccess(res, result, 'Logged in successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    await authService.logout(refreshToken, req.user!.id);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, input, req.ip);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(email, req.ip);
    // Always return success to prevent email enumeration
    sendSuccess(
      res,
      null,
      'If an account exists with that email, a password reset link has been sent.'
    );
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input.token, input.newPassword, req.ip);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export function getMe(req: Request, res: Response): void {
  sendSuccess(res, req.user);
}
