import { MaintenanceStatus, MaintenanceType, VehicleStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';

interface CreateMaintenanceInput {
  vehicleId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  scheduledDate?: string;
  assignedTechnicianName?: string;
  cost?: number;
  mileageAtService?: number;
  nextServiceDate?: string;
  notes?: string;
}

export async function createMaintenanceRecord(input: CreateMaintenanceInput, actorId: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: input.vehicleId, archivedAt: null } });
  if (!vehicle) throw { status: 404, message: 'Vehicle not found' };

  const record = await prisma.$transaction(async (tx) => {
    const m = await tx.maintenanceRecord.create({
      data: {
        vehicleId: input.vehicleId,
        maintenanceType: input.maintenanceType,
        title: input.title,
        description: input.description,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
        assignedTechnicianName: input.assignedTechnicianName,
        cost: input.cost,
        mileageAtService: input.mileageAtService,
        nextServiceDate: input.nextServiceDate ? new Date(input.nextServiceDate) : null,
        notes: input.notes,
        reportedById: actorId,
        status: MaintenanceStatus.REPORTED,
      },
    });

    // Set vehicle to UNDER_MAINTENANCE if scheduled immediately
    if (!input.scheduledDate) {
      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: VehicleStatus.UNDER_MAINTENANCE },
      });
    }

    await tx.auditLog.create({
      data: {
        action: 'MAINTENANCE_CREATED',
        actorId,
        resourceType: 'MaintenanceRecord',
        resourceId: m.id,
        description: `Maintenance record created for vehicle ${vehicle.registrationNumber}: ${input.title}`,
      },
    });

    return m;
  });

  return record;
}

export async function updateMaintenanceRecord(
  id: string,
  input: Partial<CreateMaintenanceInput> & { status?: MaintenanceStatus },
  actorId: string
) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id }, include: { vehicle: true } });
  if (!record) throw { status: 404, message: 'Maintenance record not found' };

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.maintenanceRecord.update({
      where: { id },
      data: {
        ...input,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
        nextServiceDate: input.nextServiceDate ? new Date(input.nextServiceDate) : undefined,
        startedAt: input.status === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
        cancelledAt: input.status === 'CANCELLED' ? new Date() : undefined,
      },
    });

    // When completed, restore vehicle status
    if (input.status === 'COMPLETED') {
      await tx.vehicle.update({
        where: { id: record.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
    }

    // When scheduled, mark under maintenance
    if (input.status === 'IN_PROGRESS') {
      await tx.vehicle.update({
        where: { id: record.vehicleId },
        data: { status: VehicleStatus.UNDER_MAINTENANCE },
      });
    }

    await tx.auditLog.create({
      data: {
        action: 'MAINTENANCE_UPDATED',
        actorId,
        resourceType: 'MaintenanceRecord',
        resourceId: id,
        description: `Maintenance record updated: ${record.title}${input.status ? ` → ${input.status}` : ''}`,
      },
    });

    return m;
  });

  return updated;
}

export async function listMaintenanceRecords(query: Record<string, unknown>) {
  const { page, limit, sortBy, sortOrder, search } = parsePagination(query);
  const skip = getSkip(page, limit);

  const where: Prisma.MaintenanceRecordWhereInput = {};
  if (query.vehicleId) where.vehicleId = query.vehicleId as string;
  if (query.status) where.status = query.status as MaintenanceStatus;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { vehicle: { registrationNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [records, total] = await prisma.$transaction([
    prisma.maintenanceRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [['createdAt', 'scheduledDate', 'cost'].includes(sortBy) ? sortBy : 'createdAt']: sortOrder },
      include: { vehicle: { select: { registrationNumber: true, make: true, model: true } } },
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  return { data: records, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getMaintenanceById(id: string) {
  const record = await prisma.maintenanceRecord.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!record) throw { status: 404, message: 'Maintenance record not found' };
  return record;
}
