import { prisma } from '../../config/database';
import { paginate } from '../../types';

export async function listInventory(params: {
  page?: number; limit?: number; warehouseId?: number; commodityId?: number;
}) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
    ...(params.commodityId ? { commodityId: params.commodityId } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where, skip, take, orderBy: { updatedAt: 'desc' },
      include: {
        warehouse: { select: { id: true, name: true, location: true } },
        commodity: { select: { id: true, name: true, code: true, unitOfMeasure: true } },
      },
    }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getLowStockAlerts(params: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  // Filter rows where quantityKg < minThresholdKg (column comparison via raw)
  const [countResult, data] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM inventory WHERE quantity_kg < min_threshold_kg
    `,
    prisma.$queryRaw<unknown[]>`
      SELECT i.*, w.name as warehouse_name, c.name as commodity_name, c.code as commodity_code
      FROM inventory i
      JOIN warehouses w ON w.id = i.warehouse_id
      JOIN commodities c ON c.id = i.commodity_id
      WHERE i.quantity_kg < i.min_threshold_kg
      ORDER BY i.quantity_kg ASC
      LIMIT ${take} OFFSET ${skip}
    `,
  ]);
  const total = Number(countResult[0]?.count ?? 0);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function listStockMovements(params: {
  page?: number; limit?: number; warehouseId?: number; commodityId?: number;
}) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.warehouseId ? {
      OR: [
        { sourceWarehouseId: params.warehouseId },
        { destWarehouseId: params.warehouseId },
      ],
    } : {}),
    ...(params.commodityId ? { commodityId: params.commodityId } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { commodity: true, createdBy: { select: { id: true, name: true } } },
    }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
