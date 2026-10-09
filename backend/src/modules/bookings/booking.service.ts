import { BookingStatus, VehicleStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';
import { calculateRentalPricing } from '../../utils/pricing';
import { generateBookingReference } from '../../utils/tokens';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { CreateBookingInput } from './booking.schemas';
import { createNotification } from '../notifications/notification.service';

export async function createBooking(input: CreateBookingInput, userId: string) {
  // Get customer profile
  const customerProfile = await prisma.customerProfile.findUnique({ where: { userId } });
  if (!customerProfile) throw { status: 404, message: 'Customer profile not found' };

  const pickupDate = new Date(input.pickupDate);
  const returnDate = new Date(input.returnDate);

  // Get vehicle (with lock via transaction)
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, archivedAt: null },
  });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw { status: 409, message: 'Vehicle is not available for booking' };
  }

  // Check availability inside a serializable transaction to prevent double-booking
  const booking = await prisma.$transaction(
    async (tx) => {
      // Re-check availability with lock
      const conflict = await tx.booking.findFirst({
        where: {
          vehicleId: input.vehicleId,
          status: { in: ['PENDING', 'APPROVED', 'CONFIRMED', 'ACTIVE'] },
          AND: [{ pickupDate: { lt: returnDate } }, { returnDate: { gt: pickupDate } }],
        },
      });
      if (conflict) {
        throw { status: 409, message: 'Vehicle is not available for the selected dates' };
      }

      const pricing = calculateRentalPricing({
        dailyRate: Number(vehicle.dailyRate),
        pickupDate,
        returnDate,
        taxRate: env.DEFAULT_TAX_RATE,
        securityDeposit: env.DEFAULT_SECURITY_DEPOSIT,
      });

      let ref = generateBookingReference();
      // Ensure unique
      while (await tx.booking.findUnique({ where: { bookingReference: ref } })) {
        ref = generateBookingReference();
      }

      const b = await tx.booking.create({
        data: {
          bookingReference: ref,
          customerProfileId: customerProfile.id,
          vehicleId: input.vehicleId,
          status: BookingStatus.PENDING,
          pickupDate,
          returnDate,
          pickupLocation: input.pickupLocation,
          returnLocation: input.returnLocation,
          includeDriver: input.includeDriver,
          specialRequests: input.specialRequests,
          dailyRate: pricing.dailyRate.toNumber(),
          rentalDays: pricing.rentalDays,
          subtotal: pricing.subtotal.toNumber(),
          taxRate: pricing.taxRate.toNumber(),
          taxAmount: pricing.taxAmount.toNumber(),
          securityDeposit: pricing.securityDeposit.toNumber(),
          discountAmount: 0,
          totalAmount: pricing.totalAmount.toNumber(),
        },
        include: {
          vehicle: { include: { category: true } },
          customerProfile: { include: { user: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_CREATED',
          userId,
          actorId: userId,
          resourceType: 'Booking',
          resourceId: b.id,
          description: `Booking created: ${b.bookingReference}`,
        },
      });

      return b;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  // Send notifications (outside transaction)
  await createNotification({
    userId,
    type: 'BOOKING_SUBMITTED',
    title: 'Booking Submitted',
    message: `Your booking ${booking.bookingReference} has been submitted and is pending approval.`,
    bookingId: booking.id,
  });

  logger.info('Booking created', { bookingId: booking.id, userId });
  return booking;
}

export async function listBookings(query: Record<string, unknown>, userId: string, userRole: string) {
  const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
  const skip = getSkip(page, limit);

  const where: Prisma.BookingWhereInput = {};

  // Customers only see their own bookings
  if (userRole === 'CUSTOMER') {
    const customerProfile = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!customerProfile) return { data: [], pagination: buildPaginationMeta(page, limit, 0) };
    where.customerProfileId = customerProfile.id;
  }

  if (query.status) where.status = query.status as BookingStatus;
  if (query.vehicleId) where.vehicleId = query.vehicleId as string;
  if (query.customerId) {
    if (userRole !== 'CUSTOMER') where.customerProfileId = query.customerId as string;
  }

  if (query.fromDate || query.toDate) {
    where.pickupDate = {};
    if (query.fromDate) where.pickupDate.gte = new Date(query.fromDate as string);
    if (query.toDate) where.pickupDate.lte = new Date(query.toDate as string);
  }

  if (search) {
    where.OR = [
      { bookingReference: { contains: search, mode: 'insensitive' } },
      { vehicle: { make: { contains: search, mode: 'insensitive' } } },
      { vehicle: { model: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const allowedSort = ['createdAt', 'pickupDate', 'returnDate', 'totalAmount', 'status'];
  const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
      include: {
        vehicle: { include: { category: true, images: { where: { isPrimary: true }, take: 1 } } },
        customerProfile: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        agent: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { data: bookings, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getBookingById(id: string, userId: string, userRole: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      vehicle: { include: { category: true, images: true } },
      customerProfile: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      },
      agent: { select: { firstName: true, lastName: true } },
      contract: true,
      payments: true,
      inspections: true,
      driverAssignment: { include: { driverProfile: { include: { user: { select: { firstName: true, lastName: true } } } } } },
    },
  });

  if (!booking) throw { status: 404, message: 'Booking not found' };

  // IDOR protection: customers only see their own bookings
  if (userRole === 'CUSTOMER') {
    const customerProfile = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!customerProfile || booking.customerProfileId !== customerProfile.id) {
      throw { status: 403, message: 'Access denied' };
    }
  }

  return booking;
}

export async function updateBookingStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
  reason: string | undefined,
  actorId: string,
  userRole: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { customerProfile: true },
  });
  if (!booking) throw { status: 404, message: 'Booking not found' };

  // Customers can only cancel their own bookings
  if (userRole === 'CUSTOMER') {
    const customerProfile = await prisma.customerProfile.findUnique({ where: { userId: actorId } });
    if (!customerProfile || booking.customerProfileId !== customerProfile.id) {
      throw { status: 403, message: 'Access denied' };
    }
    if (status !== 'CANCELLED') throw { status: 403, message: 'Customers can only cancel bookings' };
    if (!['PENDING', 'APPROVED'].includes(booking.status)) {
      throw { status: 409, message: 'Booking cannot be cancelled at this stage' };
    }
  }

  // Staff transitions
  if (userRole !== 'CUSTOMER') {
    if (status === 'APPROVED' && booking.status !== 'PENDING') {
      throw { status: 409, message: 'Only pending bookings can be approved' };
    }
    if (status === 'REJECTED' && !['PENDING', 'APPROVED'].includes(booking.status)) {
      throw { status: 409, message: 'Booking cannot be rejected at this stage' };
    }
  }

  const updateData: Prisma.BookingUpdateInput = {
    status,
    ...(status === 'APPROVED' && { approvedAt: new Date(), approvedById: actorId }),
    ...(status === 'REJECTED' && { rejectionReason: reason }),
    ...(status === 'CANCELLED' && { cancellationReason: reason, cancelledAt: new Date() }),
  };

  const actionMap: Record<string, 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED'> = {
    APPROVED: 'BOOKING_APPROVED',
    REJECTED: 'BOOKING_REJECTED',
    CANCELLED: 'BOOKING_CANCELLED',
  };

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({ where: { id }, data: updateData });

    await tx.auditLog.create({
      data: {
        action: actionMap[status],
        actorId,
        resourceType: 'Booking',
        resourceId: id,
        description: `Booking ${status.toLowerCase()}: ${booking.bookingReference}${reason ? ` — ${reason}` : ''}`,
      },
    });

    return b;
  });

  // Notifications
  const notifMap: Record<string, { type: 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED'; title: string; msg: string }> = {
    APPROVED: { type: 'BOOKING_APPROVED', title: 'Booking Approved', msg: `Your booking ${booking.bookingReference} has been approved.` },
    REJECTED: { type: 'BOOKING_REJECTED', title: 'Booking Rejected', msg: `Your booking ${booking.bookingReference} was rejected.${reason ? ` Reason: ${reason}` : ''}` },
    CANCELLED: { type: 'BOOKING_CANCELLED', title: 'Booking Cancelled', msg: `Booking ${booking.bookingReference} has been cancelled.` },
  };

  const n = notifMap[status];
  await createNotification({
    userId: booking.customerProfile.userId,
    type: n.type,
    title: n.title,
    message: n.msg,
    bookingId: id,
  });

  return updated;
}

export async function getDashboardStats(userRole: string, userId: string) {
  if (userRole === 'CUSTOMER') {
    const cp = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!cp) return {};
    const [upcoming, active, history] = await Promise.all([
      prisma.booking.count({ where: { customerProfileId: cp.id, status: { in: ['APPROVED', 'CONFIRMED'] } } }),
      prisma.booking.count({ where: { customerProfileId: cp.id, status: 'ACTIVE' } }),
      prisma.booking.count({ where: { customerProfileId: cp.id, status: 'COMPLETED' } }),
    ]);
    return { upcomingBookings: upcoming, activeRentals: active, completedRentals: history };
  }

  const [totalVehicles, availableVehicles, totalBookings, pendingBookings, activeRentals, overdueRentals] =
    await Promise.all([
      prisma.vehicle.count({ where: { archivedAt: null } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE', archivedAt: null } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count({ where: { status: 'OVERDUE' } }),
    ]);

  const revenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'PAID' },
  });

  const revenue = Number(revenueResult._sum.amount ?? 0);

  if (userRole === 'ADMINISTRATOR' || userRole === 'FLEET_MANAGER') {
    const [totalCustomers, maintenanceDue, upcomingReturns] = await Promise.all([
      prisma.customerProfile.count(),
      prisma.maintenanceRecord.count({ where: { status: { in: ['REPORTED', 'SCHEDULED'] } } }),
      prisma.booking.count({
        where: {
          status: 'ACTIVE',
          returnDate: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalVehicles,
      availableVehicles,
      totalBookings,
      pendingBookings,
      activeRentals,
      overdueRentals,
      totalRevenue: revenue,
      totalCustomers,
      maintenanceDue,
      upcomingReturns,
    };
  }

  // Rental Agent
  return { pendingBookings, activeRentals, overdueRentals, availableVehicles };
}
