import { Router } from 'express';
import * as controller from './inspection.controller';
import { authenticate, requireStaff } from '../../middleware/authenticate';

const router = Router();

router.post('/pickup', authenticate, requireStaff, controller.recordPickup);
router.post('/return', authenticate, requireStaff, controller.recordReturn);
router.get('/bookings/:bookingId', authenticate, controller.getBookingInspections);

export default router;
