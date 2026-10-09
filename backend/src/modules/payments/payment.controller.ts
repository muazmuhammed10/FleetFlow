import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import * as paymentService from './payment.service';
import { initiatePaymentSchema } from './payment.schemas';
import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse';

function param(p: string | string[]): string {
  return Array.isArray(p) ? p[0] : p;
}

// Customer-facing: initiate own payment
export async function initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = initiatePaymentSchema.parse(req.body);
    const payment = await paymentService.initiatePayment(input, req.user!.id);
    sendCreated(res, payment, 'Payment successful! Your booking is now confirmed. (Simulated transaction)');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

// Staff: record payment manually
export async function recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      paymentMethod: z.nativeEnum(PaymentMethod),
      description: z.string().max(200).optional(),
    });
    const input = schema.parse(req.body);
    const payment = await paymentService.recordPayment(
      param(req.params.bookingId),
      input.amount,
      input.paymentMethod,
      input.description,
      req.user!.id
    );
    sendCreated(res, payment, 'Payment recorded (simulated)');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function listBookingPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payments = await paymentService.listPayments(param(req.params.bookingId), req.user!.id, req.user!.role);
    sendSuccess(res, payments);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ amount: z.number().positive(), reason: z.string().min(1).max(500) });
    const input = schema.parse(req.body);
    const refund = await paymentService.processRefund(param(req.params.paymentId), input.amount, input.reason, req.user!.id);
    sendCreated(res, refund, 'Refund processed (simulated)');
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; message: string };
      sendError(res, e.message, e.status); return;
    }
    next(err);
  }
}

export async function getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentService.getPaymentHistory(req.query as Record<string, unknown>, req.user!.id, req.user!.role);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
