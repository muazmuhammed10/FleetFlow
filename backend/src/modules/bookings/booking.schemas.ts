import { z } from 'zod';

export const createBookingSchema = z
  .object({
    vehicleId: z.string().uuid(),
    pickupDate: z.string().datetime(),
    returnDate: z.string().datetime(),
    pickupLocation: z.string().max(200).optional(),
    returnLocation: z.string().max(200).optional(),
    includeDriver: z.boolean().optional().default(false),
    specialRequests: z.string().max(500).optional(),
  })
  .refine(
    (data) => new Date(data.returnDate) > new Date(data.pickupDate),
    { message: 'Return date must be after pickup date', path: ['returnDate'] }
  )
  .refine(
    (data) => new Date(data.pickupDate) >= new Date(),
    { message: 'Pickup date cannot be in the past', path: ['pickupDate'] }
  );

export const updateBookingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  reason: z.string().max(500).optional(),
});

export const bookingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z
    .enum(['PENDING', 'APPROVED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED', 'OVERDUE'])
    .optional(),
  vehicleId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
