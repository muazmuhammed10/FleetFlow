import { AccountStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';

export async function listCustomers(query: Record<string, unknown>) {
  const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
  const skip = getSkip(page, limit);

  const where: Prisma.CustomerProfileWhereInput = {};
  if (search) {
    where.OR = [
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (query.isVerified !== undefined) where.isVerified = query.isVerified === 'true';

  const allowedSort = ['createdAt', 'isVerified'];
  const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

  const [customers, total] = await prisma.$transaction([
    prisma.customerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.customerProfile.count({ where }),
  ]);

  return { data: customers, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, status: true, createdAt: true, lastLoginAt: true,
        },
      },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { vehicle: { select: { make: true, model: true, registrationNumber: true } } },
      },
    },
  });
  if (!customer) throw { status: 404, message: 'Customer not found' };
  return customer;
}

export async function getCustomerProfile(userId: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, status: true, avatarUrl: true, createdAt: true,
        },
      },
    },
  });
  if (!profile) throw { status: 404, message: 'Profile not found' };
  return profile;
}

export async function updateCustomerProfile(
  userId: string,
  input: Record<string, unknown>,
  actorId: string
) {
  const profile = await prisma.customerProfile.findUnique({ where: { userId } });
  if (!profile) throw { status: 404, message: 'Profile not found' };

  const allowedFields = [
    'dateOfBirth', 'address', 'city', 'state', 'country', 'postalCode',
    'drivingLicenceNumber', 'licenceExpiryDate', 'licenceCountry',
  ];

  const safeData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in input) safeData[key] = input[key];
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.customerProfile.update({
      where: { userId },
      data: safeData as Prisma.CustomerProfileUpdateInput,
    });

    // Update user name/phone if provided
    const userFields: Record<string, unknown> = {};
    if (input.firstName) userFields.firstName = String(input.firstName).slice(0, 50);
    if (input.lastName) userFields.lastName = String(input.lastName).slice(0, 50);
    if (input.phone) userFields.phone = String(input.phone).slice(0, 20);

    if (Object.keys(userFields).length > 0) {
      await tx.user.update({ where: { id: userId }, data: userFields });
    }

    await tx.auditLog.create({
      data: {
        action: 'USER_PROFILE_UPDATED',
        userId,
        actorId,
        description: 'Customer profile updated',
      },
    });

    return p;
  });

  return updated;
}

export async function verifyCustomer(customerId: string, actorId: string) {
  const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
  if (!customer) throw { status: 404, message: 'Customer not found' };

  return prisma.customerProfile.update({
    where: { id: customerId },
    data: { isVerified: true, verifiedAt: new Date(), verifiedById: actorId },
  });
}

export async function updateUserStatus(userId: string, status: AccountStatus, actorId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  return prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        action: 'USER_STATUS_CHANGED',
        userId,
        actorId,
        description: `User status changed to ${status}`,
      },
    }),
  ]);
}
