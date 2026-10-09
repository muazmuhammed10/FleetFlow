import Decimal from 'decimal.js';
import { differenceInHours } from 'date-fns';

Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

export interface PricingInput {
  dailyRate: number | string;
  pickupDate: Date;
  returnDate: Date;
  taxRate: number;
  securityDeposit: number;
  discountAmount?: number;
}

export interface PricingResult {
  rentalDays: number;
  dailyRate: Decimal;
  subtotal: Decimal;
  taxRate: Decimal;
  taxAmount: Decimal;
  discountAmount: Decimal;
  securityDeposit: Decimal;
  totalAmount: Decimal;
}

export function calculateRentalPricing(input: PricingInput): PricingResult {
  const { dailyRate, pickupDate, returnDate, taxRate, securityDeposit, discountAmount = 0 } =
    input;

  // Calculate rental days — minimum 1 day, partial days count as full
  const hours = differenceInHours(returnDate, pickupDate);
  const days = Math.max(1, Math.ceil(hours / 24));

  const rate = new Decimal(dailyRate);
  const subtotal = rate.mul(days);
  const discount = new Decimal(discountAmount);
  const discountedSubtotal = subtotal.minus(discount);
  const tax = new Decimal(taxRate);
  const taxAmount = discountedSubtotal.mul(tax).toDecimalPlaces(2);
  const deposit = new Decimal(securityDeposit);
  const totalAmount = discountedSubtotal.plus(taxAmount).plus(deposit);

  return {
    rentalDays: days,
    dailyRate: rate,
    subtotal: subtotal.toDecimalPlaces(2),
    taxRate: tax,
    taxAmount,
    discountAmount: discount,
    securityDeposit: deposit,
    totalAmount: totalAmount.toDecimalPlaces(2),
  };
}

export function calculateLateFee(
  expectedReturn: Date,
  actualReturn: Date,
  dailyRate: number | string
): Decimal {
  const rate = new Decimal(dailyRate);
  const hoursLate = differenceInHours(actualReturn, expectedReturn);

  if (hoursLate <= 0) return new Decimal(0);

  // Under 2 hours grace period, then charge per day
  if (hoursLate <= 2) return new Decimal(0);

  const daysLate = Math.ceil(hoursLate / 24);
  // Late fee: 1.5x daily rate per late day
  return rate.mul(1.5).mul(daysLate).toDecimalPlaces(2);
}
