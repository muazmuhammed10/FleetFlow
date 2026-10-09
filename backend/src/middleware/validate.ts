import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || 'body';
          errors[path] = errors[path] ?? [];
          errors[path].push(issue.message);
        }
        res.status(422).json({ success: false, message: 'Validation failed', errors });
        return;
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || 'query';
          errors[path] = errors[path] ?? [];
          errors[path].push(issue.message);
        }
        res.status(422).json({ success: false, message: 'Validation failed', errors });
        return;
      }
      next(err);
    }
  };
}
