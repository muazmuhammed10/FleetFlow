import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContractStatus } from '@prisma/client';
import * as contractService from './contract.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

export async function listContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await contractService.listContracts(req.query as Record<string, unknown>);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contract = await contractService.getContractById(param(req.params.id));
    sendSuccess(res, contract);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function getContractByBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contract = await contractService.getContractByBooking(param(req.params.bookingId));
    sendSuccess(res, contract);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function createContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookingId } = z.object({ bookingId: z.string().uuid() }).parse(req.body);
    const contract = await contractService.createContract(bookingId, req.user!.id);
    sendCreated(res, contract, 'Contract created successfully');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function updateContractStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = z.object({ status: z.nativeEnum(ContractStatus) }).parse(req.body);
    const contract = await contractService.updateContractStatus(param(req.params.id), status, req.user!.id);
    sendSuccess(res, contract, 'Contract updated');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}
