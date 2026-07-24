import { prisma } from '../../config/database';
import { generateFarmerId, generatePurchaseRef } from '../../utils/idGenerator';
import { SyncPushInput } from './sync.schema';

function paginateLocal(page = 1, limit = 20) {
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export async function pushSync(input: SyncPushInput, userId: number) {
  let farmersProcessed = 0;
  let purchasesProcessed = 0;
  const errors: string[] = [];

  const log = await prisma.syncLog.create({
    data: { deviceId: input.deviceId ?? null, userId, status: 'PENDING' },
  });

  try {
    // ── Process farmers (upsert by uuid, last-write-wins) ─────────────────
    for (const f of input.farmers) {
      try {
        const { uuid, updatedAt, dateOfBirth, ...rest } = f;
        const existingByUuid = await prisma.farmer.findUnique({ where: { uuid } });

        if (existingByUuid) {
          if (!updatedAt || new Date(updatedAt) > existingByUuid.updatedAt) {
            await prisma.farmer.update({
              where: { uuid },
              data: { ...rest, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, lastSyncedAt: new Date() },
            });
          }
        } else {
          const byNrc = await prisma.farmer.findUnique({ where: { nrcId: f.nrcId } });
          if (byNrc) { errors.push(`Farmer NRC ${f.nrcId} already exists — skipped`); continue; }
          await prisma.farmer.create({
            data: {
              uuid,
              farmerId: generateFarmerId(),
              firstName: f.firstName,
              lastName: f.lastName,
              nrcId: f.nrcId,
              phone: f.phone,
              gender: f.gender,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              address: f.address,
              village: f.village,
              district: f.district,
              clubId: f.clubId ?? null,
              gpsLatitude: f.gpsLatitude ?? null,
              gpsLongitude: f.gpsLongitude ?? null,
              registeredByUserId: userId,
              lastSyncedAt: new Date(),
            },
          });
        }
        farmersProcessed++;
      } catch (e) {
        errors.push(`Farmer ${f.uuid}: ${(e as Error).message}`);
      }
    }

    // ── Process purchases (upsert by uuid, idempotent) ────────────────────
    for (const p of input.purchases) {
      try {
        const existing = await prisma.purchase.findUnique({ where: { uuid: p.uuid } });
        if (existing) { purchasesProcessed++; continue; }

        const farmer = await prisma.farmer.findUnique({ where: { uuid: p.farmerUuid } });
        if (!farmer) { errors.push(`Purchase ${p.uuid}: farmer UUID ${p.farmerUuid} not found`); continue; }

        await prisma.$transaction(async (tx) => {
          const totalAmount = Number(p.quantityKg) * Number(p.unitPrice);
          const activeLoans = await tx.seedLoan.findMany({
            where: { farmerId: farmer.id, status: 'active' },
            orderBy: { createdAt: 'asc' },
          });

          let recovered = 0;
          const maxRecovery = totalAmount * 0.5;

          if (activeLoans.length > 0) {
            const totalBalance = activeLoans.reduce((s, l) => s + Number(l.loanBalance), 0);
            const cap = p.manualLoanDeduction != null
              ? Math.min(p.manualLoanDeduction, totalBalance, maxRecovery)
              : Math.min(totalBalance, maxRecovery);
            recovered = cap;
            let remaining = recovered;
            for (const loan of activeLoans) {
              if (remaining <= 0) break;
              const deduct = Math.min(remaining, Number(loan.loanBalance));
              const newBalance = Number(loan.loanBalance) - deduct;
              await tx.seedLoan.update({
                where: { id: loan.id },
                data: { loanBalance: newBalance, status: newBalance <= 0.01 ? 'paid' : 'active' },
              });
              remaining -= deduct;
            }
          }

          const netPayout = totalAmount - recovered;
          await tx.purchase.create({
            data: {
              uuid: p.uuid,
              purchaseRef: generatePurchaseRef(),
              farmerId: farmer.id,
              commodityId: p.commodityId,
              varietyId: p.varietyId ?? null,
              grade: p.grade ?? 'Grade A',
              quantityKg: p.quantityKg,
              unitPrice: p.unitPrice,
              totalAmount,
              loanRecoveredAmount: recovered,
              netPayout,
              buyingCenterIpcId: p.buyingCenterIpcId,
              officerUserId: userId,
              gpsLatitude: p.gpsLatitude ?? null,
              gpsLongitude: p.gpsLongitude ?? null,
              lastSyncedAt: new Date(),
            },
          });
        });
        purchasesProcessed++;
      } catch (e) {
        errors.push(`Purchase ${p.uuid}: ${(e as Error).message}`);
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'SUCCESS', farmersProcessed, purchasesProcessed },
    });

    return { farmersProcessed, purchasesProcessed, errors, syncLogId: log.id };
  } catch (e) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', errorMessage: (e as Error).message },
    });
    throw e;
  }
}

export async function pullSync(lastSyncTimestamp?: string) {
  const since = lastSyncTimestamp ? new Date(Number(lastSyncTimestamp) * 1000) : new Date(0);
  const [ipcs, commodities, varieties, clubs, farmers] = await Promise.all([
    prisma.ipc.findMany({ orderBy: { name: 'asc' } }),
    prisma.commodity.findMany({ orderBy: { name: 'asc' } }),
    prisma.commodityVariety.findMany({ include: { commodity: { select: { id: true, code: true } } } }),
    prisma.clubsAssociation.findMany({ orderBy: { name: 'asc' } }),
    prisma.farmer.findMany({
      where: { status: 'active', updatedAt: { gte: since } },
      include: { crops: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  return { masterData: { ipcs, commodities, varieties, clubs }, farmers, syncTimestamp: Math.floor(Date.now() / 1000) };
}

export async function getSyncStatus() {
  const [total, success, failed, pending] = await Promise.all([
    prisma.syncLog.count(),
    prisma.syncLog.count({ where: { status: 'SUCCESS' } }),
    prisma.syncLog.count({ where: { status: 'FAILED' } }),
    prisma.syncLog.count({ where: { status: 'PENDING' } }),
  ]);
  const recent = await prisma.syncLog.findFirst({ where: { status: 'SUCCESS' }, orderBy: { createdAt: 'desc' } });
  return { total, success, failed, pending, lastSuccessfulSync: recent?.createdAt ?? null };
}

export async function getSyncHistory(params: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = paginateLocal(params.page, params.limit);
  const [total, data] = await Promise.all([
    prisma.syncLog.count(),
    prisma.syncLog.findMany({
      skip, take, orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
