import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { sendSuccess } from '../../utils/apiResponse';
import { logger } from '../../config/logger';

export async function getBookingReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>;
    const data = await reportsService.getBookingReport(fromDate, toDate);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>;
    const data = await reportsService.getRevenueReport(fromDate, toDate);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function exportBookingsCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>;
    const csv = await reportsService.exportBookingsCSV(fromDate, toDate);

    logger.info('Bookings CSV exported', { actorId: req.user!.id });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

export async function exportPaymentsCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>;
    const csv = await reportsService.exportPaymentsCSV(fromDate, toDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}
