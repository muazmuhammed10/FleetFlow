import { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await notificationService.getUserNotifications(req.user!.id, page, limit, unreadOnly);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationService.markAsRead(param(req.params.id), req.user!.id);
    sendSuccess(res, notification);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
}
