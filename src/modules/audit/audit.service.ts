import { prisma } from '../../config/database';

function paginate(page = 1, limit = 20) {
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export async function listAuditLogs(params: {
  page?: number; limit?: number; userId?: number;
  action?: string; entityType?: string; from?: string; to?: string;
}) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.action ? { action: { contains: params.action } } : {}),
    ...(params.entityType ? { entityType: params.entityType } : {}),
    ...(params.from || params.to ? {
      createdAt: {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      },
    } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
