import { Response } from 'express';
import { ApiResponse } from '../types/api';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const response: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
): Response {
  const response: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, message = 'Resource not found'): Response {
  return sendError(res, message, 404);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden'): Response {
  return sendError(res, message, 403);
}

export function sendConflict(res: Response, message: string): Response {
  return sendError(res, message, 409);
}
