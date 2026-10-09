import { Router } from 'express';
import * as controller from './driver.controller';
import { authenticate, requireStaff } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, requireStaff, controller.listDrivers);
router.get('/:id', authenticate, requireStaff, controller.getDriver);
router.post('/', authenticate, requireStaff, controller.createDriver);
router.patch('/:id/availability', authenticate, requireStaff, controller.updateAvailability);
router.post('/:id/assign', authenticate, requireStaff, controller.assignDriver);
router.delete('/assignments/:assignmentId', authenticate, requireStaff, controller.unassignDriver);

export default router;
