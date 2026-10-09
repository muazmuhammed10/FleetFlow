import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DriverAvailability } from '@prisma/client';
import * as driverService from './driver.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

const createDriverSchema = z.object({
  userId: z.string().uuid().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  licenceNumber: z.string().min(1).max(50),
  licenceExpiryDate: z.string().datetime(),
  licenceClass: z.string().max(10).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  notes: z.string().max(500).optional(),
});

export async function listDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await driverService.listDrivers(req.query as Record<string, unknown>);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverById(param(req.params.id));
    sendSuccess(res, driver);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createDriverSchema.parse(req.body);
    const driver = await driverService.createDriver(input, req.user!.id);
    sendCreated(res, driver, 'Driver created successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { availability } = z.object({ availability: z.nativeEnum(DriverAvailability) }).parse(req.body);
    const driver = await driverService.updateDriverAvailability(param(req.params.id), availability);
    sendSuccess(res, driver, 'Driver availability updated');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function assignDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookingId } = z.object({ bookingId: z.string().uuid() }).parse(req.body);
    const assignment = await driverService.assignDriverToBooking(param(req.params.id), bookingId, req.user!.id);
    sendCreated(res, assignment, 'Driver assigned successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function unassignDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await driverService.unassignDriver(param(req.params.assignmentId), req.user!.id);
    sendSuccess(res, null, 'Driver unassigned');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}
