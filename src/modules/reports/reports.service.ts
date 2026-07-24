import { prisma } from '../../config/database';

export async function getFarmerReport() {
  const [total, byGender, byStatus, byClub] = await Promise.all([
    prisma.farmer.count(),
    prisma.farmer.groupBy({ by: ['gender'], _count: { id: true } }),
    prisma.farmer.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.farmer.groupBy({
      by: ['clubId'], _count: { id: true },
      orderBy: { _count: { id: 'desc' } }, take: 10,
    }),
  ]);
  return { total, byGender, byStatus, topClubs: byClub };
}

export async function getPurchaseReport(params: { from?: string; to?: string; ipcId?: number }) {
  const dateFilter = params.from || params.to ? {
    createdAt: {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to) } : {}),
    },
  } : {};

  const [byIpc, byCommodity, totals] = await Promise.all([
    prisma.purchase.groupBy({
      by: ['buyingCenterIpcId'],
      where: { ...dateFilter, ...(params.ipcId ? { buyingCenterIpcId: params.ipcId } : {}) },
      _sum: { quantityKg: true, totalAmount: true, loanRecoveredAmount: true, netPayout: true },
      _count: { id: true },
    }),
    prisma.purchase.groupBy({
      by: ['commodityId'],
      where: dateFilter,
      _sum: { quantityKg: true, totalAmount: true, loanRecoveredAmount: true, netPayout: true },
      _count: { id: true },
    }),
    prisma.purchase.aggregate({
      where: dateFilter,
      _sum: { quantityKg: true, totalAmount: true, loanRecoveredAmount: true, netPayout: true },
      _count: { id: true },
    }),
  ]);
  return { byIpc, byCommodity, totals };
}

export async function getLoanReport() {
  const [byCommodity, summary] = await Promise.all([
    prisma.seedLoan.groupBy({
      by: ['commodityId'],
      _sum: { loanAmount: true, loanBalance: true },
      _count: { id: true },
    }),
    prisma.seedLoan.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { loanAmount: true, loanBalance: true },
    }),
  ]);
  return { byCommodity, byStatus: summary };
}

export async function getInventoryReport() {
  const [byWarehouse, lowStockResult] = await Promise.all([
    prisma.inventory.groupBy({
      by: ['warehouseId'],
      _sum: { quantityKg: true },
      _count: { id: true },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM inventory WHERE quantity_kg < min_threshold_kg`,
  ]);
  return { byWarehouse, lowStockCount: Number(lowStockResult[0]?.count ?? 0) };
}
