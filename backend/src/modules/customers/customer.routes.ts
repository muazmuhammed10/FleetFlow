import { Router } from 'express';
import * as controller from './customer.controller';
import { authenticate, requireStaff, requireAdmin } from '../../middleware/authenticate';

const router = Router();

// Own profile (any authenticated user)
router.get('/me', authenticate, controller.getMyProfile);
router.put('/me', authenticate, controller.updateMyProfile);

// Staff access
router.get('/', authenticate, requireStaff, controller.listCustomers);
router.get('/:id', authenticate, requireStaff, controller.getCustomer);
router.post('/:id/verify', authenticate, requireStaff, controller.verifyCustomer);

// Admin only
router.patch('/users/:userId/status', authenticate, requireAdmin, controller.updateUserStatus);

export default router;
