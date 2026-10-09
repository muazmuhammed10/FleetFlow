import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  // Card details — stored only as masked reference, NEVER store real card numbers
  cardHolderName: z.string().min(1).max(100).optional(),
  // Last 4 digits only for display — never store full card
  cardLastFour: z.string().length(4).regex(/^\d{4}$/).optional(),
  // Property / collateral details
  collateralType: z.enum(['NONE', 'ID_DOCUMENT', 'CREDIT_CARD_HOLD', 'CASH_DEPOSIT']).default('NONE'),
  collateralReference: z.string().max(100).optional(),
  collateralNotes: z.string().max(500).optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
