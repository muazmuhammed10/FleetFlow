import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './config/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import vehicleRoutes from './modules/vehicles/vehicle.routes';
import bookingRoutes from './modules/bookings/booking.routes';
import customerRoutes from './modules/customers/customer.routes';
import paymentRoutes from './modules/payments/payment.routes';
import inspectionRoutes from './modules/inspections/inspection.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import auditRoutes from './modules/audit/audit.routes';
import reportRoutes from './modules/reports/reports.routes';
import contractRoutes from './modules/contracts/contract.routes';
import driverRoutes from './modules/drivers/driver.routes';

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── General Middleware ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Trust proxy for accurate IP in rate limiting
app.set('trust proxy', 1);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/vehicles`, vehicleRoutes);
app.use(`${API}/bookings`, bookingRoutes);
app.use(`${API}/customers`, customerRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/inspections`, inspectionRoutes);
app.use(`${API}/maintenance`, maintenanceRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/audit`, auditRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/contracts`, contractRoutes);
app.use(`${API}/drivers`, driverRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 FleetFlow API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
