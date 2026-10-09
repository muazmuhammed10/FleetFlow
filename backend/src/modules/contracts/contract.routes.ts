import { Router } from 'express';
import * as controller from './contract.controller';
import { authenticate, requireStaff } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, requireStaff, controller.listContracts);
router.get('/booking/:bookingId', authenticate, requireStaff, controller.getContractByBooking);
router.get('/:id', authenticate, requireStaff, controller.getContract);
router.post('/', authenticate, requireStaff, controller.createContract);
router.patch('/:id/status', authenticate, requireStaff, controller.updateContractStatus);

export default router;
