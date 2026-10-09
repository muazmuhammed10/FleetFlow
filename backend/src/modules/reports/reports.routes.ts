import { Router } from 'express';
import * as controller from './reports.controller';
import { authenticate, requireStaff } from '../../middleware/authenticate';

const router = Router();

router.get('/bookings', authenticate, requireStaff, controller.getBookingReport);
router.get('/revenue', authenticate, requireStaff, controller.getRevenueReport);
router.get('/export/bookings', authenticate, requireStaff, controller.exportBookingsCSV);
router.get('/export/payments', authenticate, requireStaff, controller.exportPaymentsCSV);

export default router;
