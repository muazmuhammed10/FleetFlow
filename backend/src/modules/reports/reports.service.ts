import prisma from '../../config/database';
import { stringify } from 'csv-stringify/sync';

function sanitizeCsvField(value: unknown): string {
  const str = String(value ?? '');
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
  return str;
}

export async function getBookingReport(fromDate?: string, toDate?: string) {
  const where: Record<string, unknown> = {};
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) (where.createdAt as Record<string, unknown>).gte = new Date(fromDate);
    if (toDate) (where.createdAt as Record<string, unknown>).lte = new Date(toDate);
  }

  return prisma.booking.findMany({
    where,
    include: {
      vehicle: { select: { registrationNumber: true, make: true, model: true } },
      customerProfile: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRevenueReport(fromDate?: string, toDate?: string) {
  const where: Record<string, unknown> = { status: 'PAID' };
  if (fromDate || toDate) {
    where.paidAt = {};
    if (fromDate) (where.paidAt as Record<string, unknown>).gte = new Date(fromDate);
    if (toDate) (where.paidAt as Record<string, unknown>).lte = new Date(toDate);
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            bookingReference: true,
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where }),
  ]);

  return { payments, totalRevenue: Number(total._sum.amount ?? 0) };
}

export async function exportBookingsCSV(fromDate?: string, toDate?: string): Promise<string> {
  const bookings = await getBookingReport(fromDate, toDate);

  const rows = bookings.map((b) => [
    sanitizeCsvField(b.bookingReference),
    sanitizeCsvField(b.customerProfile.user.firstName + ' ' + b.customerProfile.user.lastName),
    sanitizeCsvField(b.customerProfile.user.email),
    sanitizeCsvField(b.vehicle.make + ' ' + b.vehicle.model),
    sanitizeCsvField(b.vehicle.registrationNumber),
    sanitizeCsvField(b.status),
    sanitizeCsvField(b.pickupDate.toISOString()),
    sanitizeCsvField(b.returnDate.toISOString()),
    sanitizeCsvField(b.rentalDays),
    sanitizeCsvField(Number(b.dailyRate)),
    sanitizeCsvField(Number(b.totalAmount)),
    sanitizeCsvField(true ? 'SIMULATED' : 'REAL'),
    sanitizeCsvField(b.createdAt.toISOString()),
  ]);

  return stringify(
    [
      [
        'Reference', 'Customer', 'Email', 'Vehicle', 'Registration',
        'Status', 'Pickup', 'Return', 'Days', 'Daily Rate', 'Total',
        'Payment Type', 'Created At',
      ],
      ...rows,
    ]
  );
}

export async function exportPaymentsCSV(fromDate?: string, toDate?: string): Promise<string> {
  const { payments } = await getRevenueReport(fromDate, toDate);

  const rows = payments.map((p) => [
    sanitizeCsvField(p.paymentReference),
    sanitizeCsvField(p.booking.bookingReference),
    sanitizeCsvField(p.booking.vehicle.make + ' ' + p.booking.vehicle.model),
    sanitizeCsvField(p.paymentMethod),
    sanitizeCsvField(p.status),
    sanitizeCsvField(Number(p.amount)),
    sanitizeCsvField('SIMULATED'),
    sanitizeCsvField(p.paidAt?.toISOString() ?? ''),
    sanitizeCsvField(p.createdAt.toISOString()),
  ]);

  return stringify([
    ['Reference', 'Booking', 'Vehicle', 'Method', 'Status', 'Amount', 'Type', 'Paid At', 'Created At'],
    ...rows,
  ]);
}

// All payments in FleetFlow are simulated
