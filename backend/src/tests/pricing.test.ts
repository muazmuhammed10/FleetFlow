import { describe, it, expect } from 'vitest';
import { calculateRentalPricing, calculateLateFee } from '../utils/pricing';

describe('calculateRentalPricing', () => {
  const base = {
    dailyRate: 50,
    taxRate: 0.1,
    securityDeposit: 200,
  };

  it('calculates 1 day correctly', () => {
    const pickup = new Date('2026-01-01T10:00:00Z');
    const ret = new Date('2026-01-02T10:00:00Z');
    const result = calculateRentalPricing({ ...base, pickupDate: pickup, returnDate: ret });
    expect(result.rentalDays).toBe(1);
    expect(result.subtotal.toNumber()).toBe(50);
    expect(result.taxAmount.toNumber()).toBe(5);
    expect(result.totalAmount.toNumber()).toBe(255); // 50 + 5 + 200
  });

  it('calculates 3 days correctly', () => {
    const pickup = new Date('2026-01-01T10:00:00Z');
    const ret = new Date('2026-01-04T10:00:00Z');
    const result = calculateRentalPricing({ ...base, pickupDate: pickup, returnDate: ret });
    expect(result.rentalDays).toBe(3);
    expect(result.subtotal.toNumber()).toBe(150);
    expect(result.taxAmount.toNumber()).toBe(15);
    expect(result.totalAmount.toNumber()).toBe(365);
  });

  it('rounds up partial days to full days', () => {
    const pickup = new Date('2026-01-01T08:00:00Z');
    const ret = new Date('2026-01-02T09:00:00Z'); // 25 hours → 2 days
    const result = calculateRentalPricing({ ...base, pickupDate: pickup, returnDate: ret });
    expect(result.rentalDays).toBe(2);
  });

  it('applies discount correctly', () => {
    const pickup = new Date('2026-01-01T10:00:00Z');
    const ret = new Date('2026-01-04T10:00:00Z');
    const result = calculateRentalPricing({
      ...base,
      pickupDate: pickup,
      returnDate: ret,
      discountAmount: 20,
    });
    expect(result.subtotal.toNumber()).toBe(150);
    expect(result.taxAmount.toNumber()).toBe(13); // (150-20)*0.1 = 13
    expect(result.totalAmount.toNumber()).toBe(343); // 130 + 13 + 200
  });

  it('never goes below 1 day', () => {
    const pickup = new Date('2026-01-01T10:00:00Z');
    const ret = new Date('2026-01-01T11:00:00Z'); // 1 hour
    const result = calculateRentalPricing({ ...base, pickupDate: pickup, returnDate: ret });
    expect(result.rentalDays).toBe(1);
  });
});

describe('calculateLateFee', () => {
  it('returns 0 for on-time return', () => {
    const expected = new Date('2026-01-05T10:00:00Z');
    const actual = new Date('2026-01-05T09:00:00Z');
    expect(calculateLateFee(expected, actual, 50).toNumber()).toBe(0);
  });

  it('returns 0 within grace period (≤2 hours)', () => {
    const expected = new Date('2026-01-05T10:00:00Z');
    const actual = new Date('2026-01-05T11:30:00Z'); // 1.5 hours late
    expect(calculateLateFee(expected, actual, 50).toNumber()).toBe(0);
  });

  it('charges 1.5x daily rate for 1 day late', () => {
    const expected = new Date('2026-01-05T10:00:00Z');
    const actual = new Date('2026-01-06T11:00:00Z'); // ~25 hours late → 2 day ceil
    const fee = calculateLateFee(expected, actual, 50);
    expect(fee.toNumber()).toBe(150); // 1.5 * 50 * 2
  });
});
