import { vi } from 'vitest';
void vi; // suppress unused warning in setup file

// Mock environment for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/fleetflow_test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters-long!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DEFAULT_TAX_RATE = '0.10';
process.env.DEFAULT_SECURITY_DEPOSIT = '200.00';
