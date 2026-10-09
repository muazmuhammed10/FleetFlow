import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta, getSkip } from '../../utils/pagination';
import { sendSuccess } from '../../utils/apiResponse';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, sortOrder, search } = parsePagination(req.query as Record<string, unknown>);
    const skip = getSkip(page, limit);

    const where: Prisma.AuditLogWhereInput = {};
    if (req.query.userId) where.userId = req.query.userId as string;
    if (req.query.action) where.action = req.query.action as Prisma.EnumAuditActionFilter['equals'];
    if (req.query.resourceType) where.resourceType = req.query.resourceType as string;
    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          actor: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendSuccess(res, { data: logs, pagination: buildPaginationMeta(page, limit, total) });
  } catch (err) { next(err); }
}
