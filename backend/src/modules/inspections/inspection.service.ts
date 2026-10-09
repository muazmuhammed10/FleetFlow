import { InspectionType, VehicleStatus, BookingStatus } from '@prisma/client';
import prisma from '../../config/database';
import { calculateLateFee } from '../../utils/pricing';
import { createNotification } from '../notifications/notification.service';

interface InspectionInput {
  bookingId: string;
  inspectionType: InspectionType;
  mileageAtInspection: number;
  fuelLevel: number;
  overallCondition?: string;
  damageNotes?: string;
  additionalNotes?: string;
}

export async function recordPickupInspection(input: InspectionInput, actorId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { vehicle: true, customerProfile: true },
  });
  if (!booking) throw { status: 404, message: 'Booking not found' };
  if (!['APPROVED', 'CONFIRMED'].includes(booking.status)) {
    throw { status: 409, message: 'Booking must be approved or confirmed before pickup' };
  }

  const inspection = await prisma.$transaction(async (tx) => {
    const insp = await tx.vehicleInspection.create({
      data: {
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        inspectionType: InspectionType.PRE_RENTAL,
        inspectorId: actorId,
        mileageAtInspection: input.mileageAtInspection,
        fuelLevel: input.fuelLevel,
        overallCondition: input.overallCondition,
        damageNotes: input.damageNotes,
        additionalNotes: input.additionalNotes,
      },
    });

    // Activate booking and set vehicle to rented
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.ACTIVE,
        actualPickupDate: new Date(),
        agentId: actorId,
      },
    });

    await tx.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: VehicleStatus.RENTED, mileage: input.mileageAtInspection },
    });

    await tx.auditLog.create({
      data: {
        action: 'PICKUP_RECORDED',
        actorId,
        resourceType: 'Booking',
        resourceId: booking.id,
        description: `Pickup recorded for booking ${booking.bookingReference}`,
      },
    });

    return insp;
  });

  return inspection;
}

export async function recordReturnInspection(
  input: InspectionInput & { damageCost?: number },
  actorId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { vehicle: true, customerProfile: true },
  });
  if (!booking) throw { status: 404, message: 'Booking not found' };
  if (booking.status !== BookingStatus.ACTIVE && booking.status !== BookingStatus.OVERDUE) {
    throw { status: 409, message: 'Booking must be active or overdue for return' };
  }

  const actualReturn = new Date();
  const lateFee = calculateLateFee(booking.returnDate, actualReturn, Number(booking.dailyRate));

  const inspection = await prisma.$transaction(async (tx) => {
    const insp = await tx.vehicleInspection.create({
      data: {
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        inspectionType: InspectionType.POST_RENTAL,
        inspectorId: actorId,
        mileageAtInspection: input.mileageAtInspection,
        fuelLevel: input.fuelLevel,
        overallCondition: input.overallCondition,
        damageNotes: input.damageNotes,
        additionalNotes: input.additionalNotes,
        lateReturnCharge: lateFee.toNumber(),
        damageCost: input.damageCost ?? 0,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.COMPLETED,
        actualReturnDate: actualReturn,
      },
    });

    await tx.vehicle.update({
      where: { id: booking.vehicleId },
      data: {
        status: VehicleStatus.AVAILABLE,
        mileage: input.mileageAtInspection,
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'RETURN_RECORDED',
        actorId,
        resourceType: 'Booking',
        resourceId: booking.id,
        description: `Return recorded for booking ${booking.bookingReference}. Late fee: $${lateFee}`,
      },
    });

    return insp;
  });

  await createNotification({
    userId: booking.customerProfile.userId,
    type: 'PAYMENT_RECORDED',
    title: 'Rental Completed',
    message: `Your rental for booking ${booking.bookingReference} has been completed.${lateFee.gt(0) ? ` Late return fee: $${lateFee}.` : ''}`,
    bookingId: booking.id,
  });

  return inspection;
}

export async function getBookingInspections(bookingId: string, userId: string, userRole: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customerProfile: true },
  });
  if (!booking) throw { status: 404, message: 'Booking not found' };

  if (userRole === 'CUSTOMER') {
    const cp = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!cp || booking.customerProfileId !== cp.id) throw { status: 403, message: 'Access denied' };
  }

  return prisma.vehicleInspection.findMany({
    where: { bookingId },
    orderBy: { inspectedAt: 'asc' },
  });
}
