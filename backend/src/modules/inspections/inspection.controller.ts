import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as inspectionService from './inspection.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

const inspectionSchema = z.object({
  bookingId: z.string().uuid(),
  mileageAtInspection: z.number().int().min(0),
  fuelLevel: z.number().int().min(0).max(100),
  overallCondition: z.string().max(100).optional(),
  damageNotes: z.string().max(1000).optional(),
  additionalNotes: z.string().max(1000).optional(),
  damageCost: z.number().min(0).optional(),
});

export async function recordPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = inspectionSchema.parse(req.body);
    const inspection = await inspectionService.recordPickupInspection(
      { ...input, inspectionType: 'PRE_RENTAL' },
      req.user!.id
    );
    sendCreated(res, inspection, 'Pickup recorded successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function recordReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = inspectionSchema.parse(req.body);
    const inspection = await inspectionService.recordReturnInspection(
      { ...input, inspectionType: 'POST_RENTAL' },
      req.user!.id
    );
    sendCreated(res, inspection, 'Return recorded successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function getBookingInspections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inspections = await inspectionService.getBookingInspections(
      param(req.params.bookingId),
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, inspections);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}
