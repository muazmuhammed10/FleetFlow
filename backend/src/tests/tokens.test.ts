import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, generateBookingReference, generateSecureToken } from '../utils/tokens';
import { Role } from '@prisma/client';

describe('JWT tokens', () => {
  const payload = {
    sub: 'user-id-123',
    email: 'test@example.com',
    role: Role.CUSTOMER,
    firstName: 'Test',
    lastName: 'User',
  };

  it('signs and verifies an access token', () => {
    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');
    const verified = verifyAccessToken(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(Role.CUSTOMER);
  });

  it('throws on tampered token', () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe('generateBookingReference', () => {
  it('generates a reference starting with BK', () => {
    const ref = generateBookingReference();
    expect(ref.startsWith('BK')).toBe(true);
    expect(ref.length).toBe(10);
  });

  it('generates unique references', () => {
    const refs = new Set(Array.from({ length: 1000 }, generateBookingReference));
    expect(refs.size).toBeGreaterThan(990);
  });
});

describe('generateSecureToken', () => {
  it('generates a hex string of correct length', () => {
    const token = generateSecureToken(32);
    expect(token.length).toBe(64); // 32 bytes = 64 hex chars
  });
});
