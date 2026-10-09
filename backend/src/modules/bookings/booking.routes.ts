import { Router } from 'express';
import * as controller from './booking.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/dashboard-stats', authenticate, controller.getDashboardStats);
router.get('/', authenticate, controller.listBookings);
router.get('/:id', authenticate, controller.getBooking);
router.post('/', authenticate, controller.createBooking);
router.patch('/:id/status', authenticate, controller.updateBookingStatus);

export default router;
