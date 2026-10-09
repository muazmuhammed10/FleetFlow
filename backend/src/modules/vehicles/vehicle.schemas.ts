import { z } from 'zod';
import { TransmissionType, FuelType, VehicleStatus } from '@prisma/client';

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(2).max(20).trim().toUpperCase(),
  make: z.string().min(1).max(50).trim(),
  model: z.string().min(1).max(50).trim(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  categoryId: z.string().uuid(),
  transmission: z.nativeEnum(TransmissionType),
  fuelType: z.nativeEnum(FuelType),
  seatingCapacity: z.number().int().min(1).max(100),
  dailyRate: z.number().positive().multipleOf(0.01),
  mileage: z.number().int().min(0).optional().default(0),
  description: z.string().max(2000).optional(),
  color: z.string().max(30).optional(),
  vin: z.string().max(17).optional(),
  insuranceExpiryDate: z.string().datetime().optional().nullable(),
  registrationExpiryDate: z.string().datetime().optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const vehicleQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  categoryId: z.string().uuid().optional(),
  transmission: z.nativeEnum(TransmissionType).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  minRate: z.string().optional(),
  maxRate: z.string().optional(),
  available: z.enum(['true', 'false']).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(200).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
