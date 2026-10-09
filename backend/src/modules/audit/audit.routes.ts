import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { authenticate, requireAdmin } from '../../middleware/authenticate';

const router = Router();
router.get('/', authenticate, requireAdmin, getAuditLogs);
export default router;
