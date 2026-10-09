import { Request, Response, NextFunction } from 'express';
import * as vehicleService from './vehicle.service';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleQuerySchema,
  createCategorySchema,
} from './vehicle.schemas';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

export async function listVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = vehicleQuerySchema.parse(req.query);
    const result = await vehicleService.listVehicles(query as Record<string, unknown>);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicle = await vehicleService.getVehicleById(param(req.params.id));
    sendSuccess(res, vehicle);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.createVehicle(input, req.user!.id);
    sendCreated(res, vehicle, 'Vehicle created successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.updateVehicle(param(req.params.id), input, req.user!.id);
    sendSuccess(res, vehicle, 'Vehicle updated successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function archiveVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await vehicleService.archiveVehicle(param(req.params.id), req.user!.id);
    sendSuccess(res, null, 'Vehicle archived successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}

export async function checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pickupDate, returnDate } = req.query;
    if (!pickupDate || !returnDate) {
      sendError(res, 'pickupDate and returnDate are required', 400);
      return;
    }
    const pickup = new Date(pickupDate as string);
    const ret = new Date(returnDate as string);
    if (isNaN(pickup.getTime()) || isNaN(ret.getTime())) {
      sendError(res, 'Invalid date format', 400);
      return;
    }
    if (ret <= pickup) {
      sendError(res, 'Return date must be after pickup date', 400);
      return;
    }
    const available = await vehicleService.checkAvailability(param(req.params.id), pickup, ret);
    sendSuccess(res, { available });
  } catch (err) {
    next(err);
  }
}

export async function listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await vehicleService.listCategories();
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await vehicleService.createCategory(input);
    sendCreated(res, category, 'Category created');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status);
      return;
    }
    next(err);
  }
}
