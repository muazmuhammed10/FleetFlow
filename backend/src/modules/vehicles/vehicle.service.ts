import { VehicleStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicle.schemas';
import { logger } from '../../config/logger';

export async function listVehicles(query: Record<string, unknown>) {
  const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
  const skip = getSkip(page, limit);

  const where: Prisma.VehicleWhereInput = {
    archivedAt: null,
  };

  if (search) {
    where.OR = [
      { make: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { registrationNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (query.status) where.status = query.status as VehicleStatus;
  if (query.categoryId) where.categoryId = query.categoryId as string;
  if (query.transmission) where.transmission = query.transmission as Prisma.EnumTransmissionTypeFilter['equals'];
  if (query.fuelType) where.fuelType = query.fuelType as Prisma.EnumFuelTypeFilter['equals'];

  if (query.minRate || query.maxRate) {
    where.dailyRate = {};
    if (query.minRate) where.dailyRate.gte = Number(query.minRate);
    if (query.maxRate) where.dailyRate.lte = Number(query.maxRate);
  }

  if (query.available === 'true') {
    where.status = VehicleStatus.AVAILABLE;
  }

  const allowedSortFields = ['make', 'model', 'year', 'dailyRate', 'status', 'createdAt', 'mileage'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const [vehicles, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { data: vehicles, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getVehicleById(id: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, archivedAt: null },
    include: {
      category: true,
      images: true,
      maintenances: { orderBy: { createdAt: 'desc' }, take: 5 },
      bookings: {
        where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customerProfile: { include: { user: { select: { firstName: true, lastName: true } } } } },
      },
    },
  });

  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };
  return vehicle;
}

export async function createVehicle(input: CreateVehicleInput, actorId: string) {
  // Check category exists
  const category = await prisma.vehicleCategory.findUnique({ where: { id: input.categoryId } });
  if (!category) throw { status: 404, message: 'Vehicle category not found' };

  const vehicle = await prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.create({
      data: {
        registrationNumber: input.registrationNumber,
        make: input.make,
        model: input.model,
        year: input.year,
        categoryId: input.categoryId,
        transmission: input.transmission,
        fuelType: input.fuelType,
        seatingCapacity: input.seatingCapacity,
        dailyRate: input.dailyRate,
        mileage: input.mileage ?? 0,
        description: input.description,
        color: input.color,
        vin: input.vin,
        insuranceExpiryDate: input.insuranceExpiryDate ? new Date(input.insuranceExpiryDate) : null,
        registrationExpiryDate: input.registrationExpiryDate
          ? new Date(input.registrationExpiryDate)
          : null,
      },
      include: { category: true, images: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'VEHICLE_CREATED',
        actorId,
        resourceType: 'Vehicle',
        resourceId: v.id,
        description: `Vehicle created: ${v.registrationNumber} - ${v.make} ${v.model}`,
      },
    });

    return v;
  });

  logger.info('Vehicle created', { vehicleId: vehicle.id, actorId });
  return vehicle;
}

export async function updateVehicle(id: string, input: UpdateVehicleInput, actorId: string) {
  const existing = await prisma.vehicle.findFirst({ where: { id, archivedAt: null } });
  if (!existing) throw { status: 404, message: 'Vehicle not found' };

  if (input.categoryId) {
    const category = await prisma.vehicleCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw { status: 404, message: 'Vehicle category not found' };
  }

  const vehicle = await prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.update({
      where: { id },
      data: {
        ...input,
        insuranceExpiryDate: input.insuranceExpiryDate
          ? new Date(input.insuranceExpiryDate)
          : undefined,
        registrationExpiryDate: input.registrationExpiryDate
          ? new Date(input.registrationExpiryDate)
          : undefined,
      },
      include: { category: true, images: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'VEHICLE_UPDATED',
        actorId,
        resourceType: 'Vehicle',
        resourceId: id,
        description: `Vehicle updated: ${v.registrationNumber}`,
      },
    });

    return v;
  });

  return vehicle;
}

export async function archiveVehicle(id: string, actorId: string) {
  const existing = await prisma.vehicle.findFirst({ where: { id, archivedAt: null } });
  if (!existing) throw { status: 404, message: 'Vehicle not found' };

  // Check no active bookings
  const activeBooking = await prisma.booking.findFirst({
    where: { vehicleId: id, status: { in: ['PENDING', 'APPROVED', 'CONFIRMED', 'ACTIVE'] } },
  });
  if (activeBooking) {
    throw { status: 409, message: 'Cannot archive vehicle with active bookings' };
  }

  await prisma.$transaction([
    prisma.vehicle.update({
      where: { id },
      data: { archivedAt: new Date(), status: VehicleStatus.INACTIVE },
    }),
    prisma.auditLog.create({
      data: {
        action: 'VEHICLE_ARCHIVED',
        actorId,
        resourceType: 'Vehicle',
        resourceId: id,
        description: `Vehicle archived: ${existing.registrationNumber}`,
      },
    }),
  ]);
}

export async function listCategories() {
  return prisma.vehicleCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(input: { name: string; description?: string }) {
  const existing = await prisma.vehicleCategory.findUnique({ where: { name: input.name } });
  if (existing) throw { status: 409, message: 'Category with this name already exists' };
  return prisma.vehicleCategory.create({ data: input });
}

export async function checkAvailability(
  vehicleId: string,
  pickupDate: Date,
  returnDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      vehicleId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: ['PENDING', 'APPROVED', 'CONFIRMED', 'ACTIVE'] },
      AND: [
        { pickupDate: { lt: returnDate } },
        { returnDate: { gt: pickupDate } },
      ],
    },
  });
  return !conflict;
}
