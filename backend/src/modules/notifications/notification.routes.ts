import { Router } from 'express';
import * as controller from './notification.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', authenticate, controller.getNotifications);
router.patch('/:id/read', authenticate, controller.markRead);
router.patch('/read-all', authenticate, controller.markAllRead);

export default router;
