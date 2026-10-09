import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { sendUnauthorized } from '../utils/apiResponse';
import { Role } from '@prisma/client';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'No authentication token provided');
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// Convenience role guards
export const requireAdmin = requireRoles(Role.ADMINISTRATOR);
export const requireFleetManager = requireRoles(Role.ADMINISTRATOR, Role.FLEET_MANAGER);
export const requireAgent = requireRoles(
  Role.ADMINISTRATOR,
  Role.FLEET_MANAGER,
  Role.RENTAL_AGENT
);
export const requireStaff = requireRoles(
  Role.ADMINISTRATOR,
  Role.FLEET_MANAGER,
  Role.RENTAL_AGENT
);
