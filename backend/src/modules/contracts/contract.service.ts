import { ContractStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { generateContractNumber } from '../../utils/tokens';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';

export async function createContract(bookingId: string, actorId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw { status: 404, message: 'Booking not found' };
  if (!['APPROVED', 'CONFIRMED', 'ACTIVE'].includes(booking.status)) {
    throw { status: 409, message: 'Contract can only be created for approved or active bookings' };
  }

  const existing = await prisma.rentalContract.findUnique({ where: { bookingId } });
  if (existing) throw { status: 409, message: 'A contract already exists for this booking' };

  let contractNumber = generateContractNumber();
  while (await prisma.rentalContract.findUnique({ where: { contractNumber } })) {
    contractNumber = generateContractNumber();
  }

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.rentalContract.create({
      data: {
        contractNumber,
        bookingId,
        status: ContractStatus.ACTIVE,
        terms: `Standard rental agreement for booking ${booking.bookingReference}. The renter agrees to return the vehicle in the same condition as received, comply with all traffic laws, and report any damage immediately.`,
        signedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            vehicle: { select: { make: true, model: true, year: true, registrationNumber: true } },
            customerProfile: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'CONTRACT_CREATED',
        actorId,
        resourceType: 'RentalContract',
        resourceId: c.id,
        description: `Contract created: ${contractNumber} for booking ${booking.bookingReference}`,
      },
    });

    return c;
  });

  return contract;
}

export async function listContracts(query: Record<string, unknown>) {
  const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
  const skip = getSkip(page, limit);

  const where: Prisma.RentalContractWhereInput = {};
  if (query.status) where.status = query.status as ContractStatus;
  if (search) {
    where.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { booking: { bookingReference: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const allowedSort = ['createdAt', 'contractNumber'];
  const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

  const [contracts, total] = await prisma.$transaction([
    prisma.rentalContract.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
      include: {
        booking: {
          include: {
            vehicle: { select: { make: true, model: true, year: true, registrationNumber: true } },
            customerProfile: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
    }),
    prisma.rentalContract.count({ where }),
  ]);

  return { data: contracts, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getContractById(id: string) {
  const contract = await prisma.rentalContract.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          vehicle: { select: { make: true, model: true, year: true, registrationNumber: true, dailyRate: true } },
          customerProfile: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
          payments: true,
        },
      },
    },
  });
  if (!contract) throw { status: 404, message: 'Contract not found' };
  return contract;
}

export async function getContractByBooking(bookingId: string) {
  const contract = await prisma.rentalContract.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          vehicle: { select: { make: true, model: true, year: true, registrationNumber: true } },
          customerProfile: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        },
      },
    },
  });
  if (!contract) throw { status: 404, message: 'No contract found for this booking' };
  return contract;
}

export async function updateContractStatus(id: string, status: ContractStatus, actorId: string) {
  const contract = await prisma.rentalContract.findUnique({ where: { id } });
  if (!contract) throw { status: 404, message: 'Contract not found' };

  const actionMap: Record<string, 'CONTRACT_COMPLETED' | 'CONTRACT_CANCELLED'> = {
    COMPLETED: 'CONTRACT_COMPLETED',
    CANCELLED: 'CONTRACT_CANCELLED',
  };

  return prisma.$transaction(async (tx) => {
    const c = await tx.rentalContract.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
      },
    });

    if (actionMap[status]) {
      await tx.auditLog.create({
        data: {
          action: actionMap[status],
          actorId,
          resourceType: 'RentalContract',
          resourceId: id,
          description: `Contract ${status.toLowerCase()}: ${contract.contractNumber}`,
        },
      });
    }

    return c;
  });
}
