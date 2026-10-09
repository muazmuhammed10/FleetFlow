import { PaymentStatus, PaymentMethod, BookingStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { generatePaymentReference } from '../../utils/tokens';
import { createNotification } from '../notifications/notification.service';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';
import { InitiatePaymentInput } from './payment.schemas';

// ─── Customer initiates payment for their booking ────────────────────────────
export async function initiatePayment(input: InitiatePaymentInput, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { customerProfile: true, payments: true },
  });

  if (!booking) throw { status: 404, message: 'Booking not found' };

  // Authorization: only the booking owner can pay
  const cp = await prisma.customerProfile.findUnique({ where: { userId } });
  if (!cp || booking.customerProfileId !== cp.id) {
    throw { status: 403, message: 'You can only pay for your own bookings' };
  }

  // Booking must be APPROVED before payment
  if (booking.status !== BookingStatus.APPROVED) {
    throw {
      status: 409,
      message:
        booking.status === 'PENDING'
          ? 'Your booking is still pending approval. You can pay once it is approved by our team.'
          : booking.status === 'COMPLETED'
          ? 'This booking is already completed.'
          : booking.status === 'CANCELLED'
          ? 'This booking has been cancelled.'
          : `Payment is not available for a booking in ${booking.status} status.`,
    };
  }

  // Check not already fully paid
  const totalPaid = booking.payments
    .filter((p) => p.status === PaymentStatus.PAID)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalRequired = Number(booking.totalAmount);
  if (totalPaid >= totalRequired) {
    throw { status: 409, message: 'This booking has already been fully paid.' };
  }

  const ref = generatePaymentReference();

  // Build description including collateral info
  let description = `Rental payment for booking ${booking.bookingReference} (SIMULATED)`;
  if (input.collateralType && input.collateralType !== 'NONE') {
    description += ` | Security: ${input.collateralType.replace(/_/g, ' ')}`;
    if (input.collateralReference) description += ` ref: ${input.collateralReference}`;
  }

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        paymentReference: ref,
        bookingId: input.bookingId,
        amount: totalRequired - totalPaid, // pay the remaining balance
        paymentMethod: input.paymentMethod,
        status: PaymentStatus.PAID,
        isSimulated: true,
        description,
        paidAt: new Date(),
        transactionRef: input.cardLastFour ? `****${input.cardLastFour}` : undefined,
      },
    });

    // Advance booking to CONFIRMED once paid
    await tx.booking.update({
      where: { id: input.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    await tx.auditLog.create({
      data: {
        action: 'PAYMENT_RECORDED',
        userId,
        actorId: userId,
        resourceType: 'Payment',
        resourceId: p.id,
        description: `Customer payment: ${ref} — $${p.amount} (SIMULATED)`,
      },
    });

    return p;
  });

  await createNotification({
    userId,
    type: 'PAYMENT_RECORDED',
    title: 'Payment Confirmed',
    message: `Your payment of $${Number(payment.amount).toFixed(2)} for booking ${booking.bookingReference} has been received. Your booking is now confirmed!`,
    bookingId: input.bookingId,
  });

  return payment;
}

// ─── Staff records a payment manually ────────────────────────────────────────
export async function recordPayment(
  bookingId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  description: string | undefined,
  actorId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customerProfile: true },
  });
  if (!booking) throw { status: 404, message: 'Booking not found' };
  if (!['APPROVED', 'CONFIRMED', 'ACTIVE'].includes(booking.status)) {
    throw { status: 409, message: 'Payment can only be recorded for approved or active bookings' };
  }

  const ref = generatePaymentReference();

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        paymentReference: ref,
        bookingId,
        amount,
        paymentMethod,
        status: PaymentStatus.PAID,
        isSimulated: true,
        description: description ?? 'Staff-recorded rental payment (simulated)',
        paidAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'PAYMENT_RECORDED',
        actorId,
        resourceType: 'Payment',
        resourceId: p.id,
        description: `Staff payment recorded: ${ref} — $${amount} (SIMULATED)`,
      },
    });

    return p;
  });

  await createNotification({
    userId: booking.customerProfile.userId,
    type: 'PAYMENT_RECORDED',
    title: 'Payment Recorded',
    message: `A payment of $${amount} has been recorded for booking ${booking.bookingReference}.`,
    bookingId,
  });

  return payment;
}

// ─── List payments for a booking ─────────────────────────────────────────────
export async function listPayments(bookingId: string, userId: string, userRole: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customerProfile: true },
  });
  if (!booking) throw { status: 404, message: 'Booking not found' };

  if (userRole === 'CUSTOMER') {
    const cp = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!cp || booking.customerProfileId !== cp.id) {
      throw { status: 403, message: 'Access denied' };
    }
  }

  return prisma.payment.findMany({
    where: { bookingId },
    include: { refunds: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Refund ───────────────────────────────────────────────────────────────────
export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string,
  actorId: string
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { refunds: true },
  });
  if (!payment) throw { status: 404, message: 'Payment not found' };
  if (payment.status !== PaymentStatus.PAID) {
    throw { status: 409, message: 'Only paid payments can be refunded' };
  }

  const totalRefunded = payment.refunds.reduce((s, r) => s + Number(r.amount), 0);
  if (totalRefunded + amount > Number(payment.amount)) {
    throw { status: 400, message: 'Refund amount exceeds payment amount' };
  }

  const isFullRefund = totalRefunded + amount >= Number(payment.amount);

  const refund = await prisma.$transaction(async (tx) => {
    const r = await tx.refund.create({
      data: { paymentId, amount, reason, isSimulated: true, processedAt: new Date() },
    });
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED },
    });
    await tx.auditLog.create({
      data: {
        action: 'PAYMENT_REFUNDED',
        actorId,
        resourceType: 'Payment',
        resourceId: paymentId,
        description: `Refund: $${amount} (SIMULATED)${reason ? ` — ${reason}` : ''}`,
      },
    });
    return r;
  });

  return refund;
}

// ─── Payment history ──────────────────────────────────────────────────────────
export async function getPaymentHistory(
  query: Record<string, unknown>,
  userId: string,
  userRole: string
) {
  const { page, limit, sortBy, sortOrder } = parsePagination(query);
  const skip = getSkip(page, limit);
  const where: Prisma.PaymentWhereInput = {};

  if (userRole === 'CUSTOMER') {
    const cp = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!cp) return { data: [], pagination: buildPaginationMeta(page, limit, 0) };
    where.booking = { customerProfileId: cp.id };
  }

  if (query.status) where.status = query.status as PaymentStatus;

  const safe = ['createdAt', 'amount', 'paidAt'].includes(sortBy) ? sortBy : 'createdAt';
  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safe]: sortOrder },
      include: {
        booking: {
          select: {
            bookingReference: true,
            status: true,
            vehicle: { select: { make: true, model: true } },
          },
        },
        refunds: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return { data: payments, pagination: buildPaginationMeta(page, limit, total) };
}
