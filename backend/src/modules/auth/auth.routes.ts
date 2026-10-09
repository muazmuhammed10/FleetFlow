import { Router } from 'express';
import * as controller from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/forgot-password', passwordResetLimiter, controller.forgotPassword);
router.post('/reset-password', passwordResetLimiter, controller.resetPassword);

// Protected routes
router.get('/me', authenticate, controller.getMe);
router.post('/logout', authenticate, controller.logout);
router.put('/change-password', authenticate, controller.changePassword);

export default router;
