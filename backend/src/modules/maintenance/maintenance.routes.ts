import { Router } from 'express';
import * as controller from './maintenance.controller';
import { authenticate, requireStaff } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, requireStaff, controller.listMaintenance);
router.get('/:id', authenticate, requireStaff, controller.getMaintenance);
router.post('/', authenticate, requireStaff, controller.createMaintenance);
router.put('/:id', authenticate, requireStaff, controller.updateMaintenance);

export default router;
