import { Request, Response, NextFunction } from 'express';
import * as bookingService from './booking.service';
import { createBookingSchema, updateBookingStatusSchema, bookingQuerySchema } from './booking.schemas';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

export async function listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingService.listBookings(
      query as Record<string, unknown>,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.getBookingById(
      param(req.params.id),
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, booking);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking(input, req.user!.id);
    sendCreated(res, booking, 'Booking submitted successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function updateBookingStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, reason } = updateBookingStatusSchema.parse(req.body);
    const booking = await bookingService.updateBookingStatus(
      param(req.params.id),
      status,
      reason,
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, booking, `Booking ${status.toLowerCase()} successfully`);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await bookingService.getDashboardStats(req.user!.role, req.user!.id);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}
