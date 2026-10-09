import winston from 'winston';
import { env } from './env';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// Custom format to strip sensitive fields from logs
const sanitize = winston.format((info) => {
  const sensitive = ['password', 'passwordHash', 'token', 'authorization', 'cookie', 'cvv', 'cardNumber'];
  const sanitized = { ...info };
  for (const key of sensitive) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'warn' : 'info',
  format: combine(
    sanitize(),
    timestamp(),
    errors({ stack: true }),
    env.NODE_ENV === 'production' ? json() : combine(colorize(), simple())
  ),
  transports: [
    new winston.transports.Console(),
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

export default logger;
