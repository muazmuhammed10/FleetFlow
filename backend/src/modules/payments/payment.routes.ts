import { Router } from 'express';
import * as controller from './payment.controller';
import { authenticate, requireStaff } from '../../middleware/authenticate';

const router = Router();

// Customer initiates payment for their own booking
router.post('/initiate', authenticate, controller.initiatePayment);

// Payment history (own for customers, all for staff)
router.get('/history', authenticate, controller.getPaymentHistory);

// Booking payments
router.get('/bookings/:bookingId', authenticate, controller.listBookingPayments);
router.post('/bookings/:bookingId', authenticate, requireStaff, controller.recordPayment);

// Refunds — staff only
router.post('/:paymentId/refund', authenticate, requireStaff, controller.processRefund);

export default router;
