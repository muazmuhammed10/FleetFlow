import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MaintenanceType, MaintenanceStatus } from '@prisma/client';
import * as maintenanceService from './maintenance.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  maintenanceType: z.nativeEnum(MaintenanceType),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime().optional(),
  assignedTechnicianName: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  mileageAtService: z.number().int().min(0).optional(),
  nextServiceDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  status: z.nativeEnum(MaintenanceStatus).optional(),
});

export async function listMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await maintenanceService.listMaintenanceRecords(req.query as Record<string, unknown>);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await maintenanceService.getMaintenanceById(param(req.params.id));
    sendSuccess(res, record);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function createMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createMaintenanceSchema.parse(req.body);
    const record = await maintenanceService.createMaintenanceRecord(input, req.user!.id);
    sendCreated(res, record, 'Maintenance record created');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function updateMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateMaintenanceSchema.parse(req.body);
    const record = await maintenanceService.updateMaintenanceRecord(
      param(req.params.id),
      input,
      req.user!.id
    );
    sendSuccess(res, record, 'Maintenance record updated');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}
