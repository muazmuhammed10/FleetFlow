import argon2 from 'argon2';
import { addMinutes, addDays } from 'date-fns';
import { Role, AccountStatus } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateSecureToken,
} from '../../utils/tokens';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schemas';
import { sendPasswordResetEmail } from '../notifications/email.service';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export async function registerCustomer(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw { status: 409, message: 'An account with this email already exists' };
  }

  const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: Role.CUSTOMER, // public registration is always CUSTOMER
        status: AccountStatus.ACTIVE,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
    });

    // Create customer profile
    await tx.customerProfile.create({
      data: { userId: newUser.id },
    });

    await tx.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        userId: newUser.id,
        description: `New customer registered: ${newUser.email}`,
      },
    });

    return newUser;
  });

  logger.info('New customer registered', { userId: user.id, email: user.email });

  return sanitizeUser(user);
}

export async function login(
  input: LoginInput,
  ipAddress?: string,
  userAgent?: string
) {
  // Always compute hash to prevent timing attacks
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const dummyHash =
    '$argon2id$v=19$m=65536,t=3,p=4$dummysalt$dummyhash'; // never valid

  const isValid = user
    ? await argon2.verify(user.passwordHash, input.password)
    : await argon2.verify(dummyHash, input.password).catch(() => false);

  if (!user || !isValid) {
    // Log failed attempt
    if (user) {
      await prisma.auditLog.create({
        data: {
          action: 'USER_LOGIN_FAILED',
          userId: user.id,
          description: `Failed login attempt for ${input.email}`,
          ipAddress,
          userAgent,
        },
      });
    }
    throw { status: 401, message: 'Invalid email or password' };
  }

  if (user.status !== AccountStatus.ACTIVE) {
    throw { status: 403, message: 'Account is not active. Please contact support.' };
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Parse refresh expiry
  const refreshDays = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10) || 7;
  const expiresAt = addDays(new Date(), refreshDays);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        userId: user.id,
        actorId: user.id,
        description: `User logged in: ${user.email}`,
        ipAddress,
        userAgent,
      },
    }),
  ]);

  logger.info('User logged in', { userId: user.id });

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw { status: 401, message: 'Refresh token is invalid or expired' };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== AccountStatus.ACTIVE) {
    throw { status: 401, message: 'User account is not active' };
  }

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  return { accessToken: newAccessToken };
}

export async function logout(refreshToken: string, userId: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, userId },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: 'USER_LOGOUT',
      userId,
      actorId: userId,
      description: 'User logged out',
    },
  });
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  ipAddress?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  const isValid = await argon2.verify(user.passwordHash, input.currentPassword);
  if (!isValid) throw { status: 400, message: 'Current password is incorrect' };

  const newHash = await argon2.hash(input.newPassword, ARGON2_OPTIONS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } }),
    // Revoke all existing refresh tokens on password change
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_CHANGED',
        userId,
        actorId: userId,
        description: 'User changed their password',
        ipAddress,
      },
    }),
  ]);
}

export async function requestPasswordReset(email: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return;

  // Expire any existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateSecureToken(32);
  const expiresAt = addMinutes(new Date(), 60); // 1 hour

  await prisma.$transaction([
    prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    }),
    prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_RESET_REQUESTED',
        userId: user.id,
        description: 'Password reset requested',
        ipAddress,
      },
    }),
  ]);

  await sendPasswordResetEmail(user.email, user.firstName, token);
  logger.info('Password reset requested', { userId: user.id });
}

export async function resetPassword(token: string, newPassword: string, ipAddress?: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw { status: 400, message: 'Reset token is invalid or expired' };
  }

  const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_RESET_COMPLETED',
        userId: resetToken.userId,
        description: 'Password reset completed',
        ipAddress,
      },
    }),
  ]);

  logger.info('Password reset completed', { userId: resetToken.userId });
}

function sanitizeUser(user: {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
