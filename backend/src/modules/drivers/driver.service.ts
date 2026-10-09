import { DriverAvailability, Role, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';

export async function listDrivers(query: Record<string, unknown>) {
  const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
  const skip = getSkip(page, limit);

  const where: Prisma.DriverProfileWhereInput = {};
  if (query.availability) where.availability = query.availability as DriverAvailability;
  if (search) {
    where.OR = [
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { licenceNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [drivers, total] = await prisma.$transaction([
    prisma.driverProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [['createdAt', 'availability'].includes(sortBy) ? sortBy : 'createdAt']: sortOrder },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignments: {
          where: { unassignedAt: null },
          include: { booking: { select: { bookingReference: true, status: true } } },
          take: 1,
        },
      },
    }),
    prisma.driverProfile.count({ where }),
  ]);

  return { data: drivers, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getDriverById(id: string) {
  const driver = await prisma.driverProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      assignments: {
        orderBy: { assignedAt: 'desc' },
        take: 10,
        include: {
          booking: {
            select: {
              bookingReference: true, status: true, pickupDate: true, returnDate: true,
              vehicle: { select: { make: true, model: true, registrationNumber: true } },
            },
          },
        },
      },
    },
  });
  if (!driver) throw { status: 404, message: 'Driver not found' };
  return driver;
}

export async function createDriver(input: {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenceNumber: string;
  licenceExpiryDate: string;
  licenceClass?: string;
  experienceYears?: number;
  notes?: string;
}, actorId: string) {
  // Check if creating a new user for this driver or using existing
  let userId = input.userId;

  if (!userId) {
    // Check email not taken
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      // Use existing user
      userId = existing.id;
    } else {
      // Create a stub user account
      const newUser = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash: 'DRIVER_NO_LOGIN', // Drivers don't need to login by default
          role: Role.RENTAL_AGENT,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      });
      userId = newUser.id;
    }
  }

  // Check licence not already registered
  const existingLicence = await prisma.driverProfile.findUnique({ where: { licenceNumber: input.licenceNumber } });
  if (existingLicence) throw { status: 409, message: 'A driver with this licence number already exists' };

  // Check user doesn't already have a driver profile
  const existingProfile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (existingProfile) throw { status: 409, message: 'This user already has a driver profile' };

  return prisma.driverProfile.create({
    data: {
      userId,
      licenceNumber: input.licenceNumber,
      licenceExpiryDate: new Date(input.licenceExpiryDate),
      licenceClass: input.licenceClass,
      experienceYears: input.experienceYears,
      notes: input.notes,
      availability: DriverAvailability.AVAILABLE,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });
}

export async function updateDriverAvailability(id: string, availability: DriverAvailability) {
  const driver = await prisma.driverProfile.findUnique({ where: { id } });
  if (!driver) throw { status: 404, message: 'Driver not found' };
  return prisma.driverProfile.update({ where: { id }, data: { availability } });
}

export async function assignDriverToBooking(driverId: string, bookingId: string, actorId: string) {
  const [driver, booking] = await Promise.all([
    prisma.driverProfile.findUnique({ where: { id: driverId } }),
    prisma.booking.findUnique({ where: { id: bookingId } }),
  ]);

  if (!driver) throw { status: 404, message: 'Driver not found' };
  if (!booking) throw { status: 404, message: 'Booking not found' };
  if (driver.availability !== DriverAvailability.AVAILABLE) {
    throw { status: 409, message: 'Driver is not available' };
  }

  // Check no overlapping assignment
  const conflict = await prisma.driverAssignment.findFirst({
    where: {
      driverProfileId: driverId,
      unassignedAt: null,
      booking: {
        AND: [{ pickupDate: { lt: booking.returnDate } }, { returnDate: { gt: booking.pickupDate } }],
        status: { in: ['APPROVED', 'CONFIRMED', 'ACTIVE'] },
      },
    },
  });
  if (conflict) throw { status: 409, message: 'Driver has a conflicting assignment for these dates' };

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.driverAssignment.create({
      data: { driverProfileId: driverId, bookingId },
    });
    await tx.driverProfile.update({
      where: { id: driverId },
      data: { availability: DriverAvailability.ON_ASSIGNMENT },
    });
    await tx.auditLog.create({
      data: {
        action: 'DRIVER_ASSIGNED',
        actorId,
        resourceType: 'DriverAssignment',
        resourceId: assignment.id,
        description: `Driver assigned to booking ${booking.bookingReference}`,
      },
    });
    return assignment;
  });
}

export async function unassignDriver(assignmentId: string, actorId: string) {
  const assignment = await prisma.driverAssignment.findUnique({
    where: { id: assignmentId },
    include: { booking: true },
  });
  if (!assignment) throw { status: 404, message: 'Assignment not found' };

  return prisma.$transaction(async (tx) => {
    await tx.driverAssignment.update({
      where: { id: assignmentId },
      data: { unassignedAt: new Date() },
    });
    await tx.driverProfile.update({
      where: { id: assignment.driverProfileId },
      data: { availability: DriverAvailability.AVAILABLE },
    });
    await tx.auditLog.create({
      data: {
        action: 'DRIVER_UNASSIGNED',
        actorId,
        resourceType: 'DriverAssignment',
        resourceId: assignmentId,
        description: `Driver unassigned from booking ${assignment.booking.bookingReference}`,
      },
    });
  });
}
