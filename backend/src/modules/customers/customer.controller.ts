import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AccountStatus } from '@prisma/client';
import * as customerService from './customer.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  drivingLicenceNumber: z.string().max(50).optional(),
  licenceExpiryDate: z.string().datetime().optional(),
  licenceCountry: z.string().max(50).optional(),
});

export async function listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerService.listCustomers(req.query as Record<string, unknown>);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerService.getCustomerById(param(req.params.id));
    sendSuccess(res, customer);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await customerService.getCustomerProfile(req.user!.id);
    sendSuccess(res, profile);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateProfileSchema.parse(req.body);
    const profile = await customerService.updateCustomerProfile(req.user!.id, input as Record<string, unknown>, req.user!.id);
    sendSuccess(res, profile, 'Profile updated');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function verifyCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerService.verifyCustomer(param(req.params.id), req.user!.id);
    sendSuccess(res, customer, 'Customer verified');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = z.object({ status: z.nativeEnum(AccountStatus) }).parse(req.body);
    await customerService.updateUserStatus(param(req.params.userId), status, req.user!.id);
    sendSuccess(res, null, 'User status updated');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}
