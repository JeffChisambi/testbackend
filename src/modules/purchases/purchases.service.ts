import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { paginate } from '../../types';
import { generatePurchaseRef } from '../../utils/idGenerator';
import { CreatePurchaseInput } from './purchases.schema';

const PURCHASE_INCLUDE = {
  farmer: { select: { id: true, farmerId: true, firstName: true, lastName: true, phone: true } },
  commodity: { select: { id: true, name: true, code: true, unitOfMeasure: true } },
  buyingCenter: { select: { id: true, name: true, code: true } },
  officer: { select: { id: true, name: true } },
} as const;

export async function listPurchases(params: {
  page?: number; limit?: number; farmerId?: number;
  commodityId?: number; ipcId?: number; from?: string; to?: string;
}) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.farmerId ? { farmerId: params.farmerId } : {}),
    ...(params.commodityId ? { commodityId: params.commodityId } : {}),
    ...(params.ipcId ? { buyingCenterIpcId: params.ipcId } : {}),
    ...(params.from || params.to ? {
      createdAt: {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      },
    } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({ where, include: PURCHASE_INCLUDE, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getPurchaseById(id: number) {
  const p = await prisma.purchase.findUnique({ where: { id }, include: { ...PURCHASE_INCLUDE, goodsReceivedNotes: true } });
  if (!p) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  return p;
}

export async function getPurchaseByReceipt(purchaseRef: string) {
  const p = await prisma.purchase.findUnique({ where: { purchaseRef }, include: PURCHASE_INCLUDE });
  if (!p) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  return p;
}

export async function createPurchase(input: CreatePurchaseInput, officerUserId: number) {
  // Idempotency: if a uuid is provided and already exists, return existing record
  if (input.uuid) {
    const existing = await prisma.purchase.findUnique({ where: { uuid: input.uuid } });
    if (existing) return existing;
  }

  return prisma.$transaction(async (tx) => {
    const farmer = await tx.farmer.findUnique({ where: { id: input.farmerId } });
    if (!farmer) throw Object.assign(new Error('Farmer not found'), { status: 404 });

    const totalAmount = new Decimal(input.quantityKg).mul(input.unitPrice);

    // Loan recovery: max 50% of total unless manual override
    const activeLoans = await tx.seedLoan.findMany({
      where: { farmerId: input.farmerId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    let recovered = new Decimal(0);
    const maxRecovery = totalAmount.mul(0.5);

    if (activeLoans.length > 0) {
      const totalBalance = activeLoans.reduce((s, l) => s.add(l.loanBalance), new Decimal(0));
      const cap = input.manualLoanDeduction != null
        ? new Decimal(Math.min(input.manualLoanDeduction, totalBalance.toNumber(), maxRecovery.toNumber()))
        : Decimal.min(totalBalance, maxRecovery);

      recovered = cap;

      // Deduct from loans oldest-first
      let remaining = recovered;
      for (const loan of activeLoans) {
        if (remaining.lte(0)) break;
        const deduct = Decimal.min(remaining, loan.loanBalance);
        const newBalance = new Decimal(loan.loanBalance).sub(deduct);
        await tx.seedLoan.update({
          where: { id: loan.id },
          data: {
            loanBalance: newBalance,
            status: newBalance.lte(0.01) ? 'paid' : 'active',
          },
        });
        remaining = remaining.sub(deduct);
      }
    }

    const netPayout = totalAmount.sub(recovered);

    const purchase = await tx.purchase.create({
      data: {
        uuid: input.uuid,
        purchaseRef: generatePurchaseRef(),
        farmerId: input.farmerId,
        commodityId: input.commodityId,
        varietyId: input.varietyId ?? null,
        grade: input.grade ?? 'Grade A',
        quantityKg: input.quantityKg,
        unitPrice: input.unitPrice,
        totalAmount,
        loanRecoveredAmount: recovered,
        netPayout,
        buyingCenterIpcId: input.buyingCenterIpcId,
        officerUserId,
        gpsLatitude: input.gpsLatitude ?? null,
        gpsLongitude: input.gpsLongitude ?? null,
      },
      include: PURCHASE_INCLUDE,
    });

    // SMS notification record
    await tx.notification.create({
      data: {
        farmerId: input.farmerId,
        phone: farmer.phone,
        message: `Purchase recorded: ${input.quantityKg}kg @ K${input.unitPrice}/kg. Total: K${totalAmount}. Loan recovered: K${recovered}. Net payout: K${netPayout}. Ref: ${purchase.purchaseRef}`,
        type: 'purchase_receipt',
      },
    });

    return purchase;
  });
}

export async function cancelPurchase(id: number) {
  const purchase = await getPurchaseById(id);
  if (purchase.status === 'cancelled') throw Object.assign(new Error('Purchase already cancelled'), { status: 400 });
  return prisma.purchase.update({ where: { id }, data: { status: 'cancelled' }, include: PURCHASE_INCLUDE });
}
