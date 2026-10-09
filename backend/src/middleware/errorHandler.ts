import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      errors[path] = errors[path] ?? [];
      errors[path].push(issue.message);
    }
    res.status(422).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) ?? [];
      res.status(409).json({
        success: false,
        message: `A record with this ${fields.join(', ')} already exists`,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
  }

  // Log unexpected errors (never expose stack trace in production)
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  const message =
    env.NODE_ENV === 'production' ? 'An internal server error occurred' : String(err);

  res.status(500).json({ success: false, message });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}
