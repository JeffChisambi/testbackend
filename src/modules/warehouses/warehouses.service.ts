import { prisma } from '../../config/database';
import { paginate } from '../../types';
import { generateGrnNumber } from '../../utils/idGenerator';
import { CreateWarehouseInput, GrnInput, StockTransferInput } from './warehouses.schema';

export async function listWarehouses(params: { page?: number; limit?: number; ipcId?: number }) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = params.ipcId ? { ipcId: params.ipcId } : {};
  const [total, data] = await Promise.all([
    prisma.warehouse.count({ where }),
    prisma.warehouse.findMany({
      where, skip, take, orderBy: { name: 'asc' },
      include: {
        ipc: { select: { id: true, name: true, code: true } },
        _count: { select: { inventoryItems: true } },
      },
    }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getWarehouseById(id: number) {
  const wh = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      ipc: true,
      inventoryItems: { include: { commodity: true } },
    },
  });
  if (!wh) throw Object.assign(new Error('Warehouse not found'), { status: 404 });
  return wh;
}

export async function createWarehouse(input: CreateWarehouseInput) {
  return prisma.warehouse.create({ data: input });
}

export async function updateWarehouse(id: number, input: Partial<CreateWarehouseInput>) {
  await getWarehouseById(id);
  return prisma.warehouse.update({ where: { id }, data: input });
}

/** Upsert an inventory row — works correctly with nullable varietyId */
async function upsertInventory(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  warehouseId: number,
  commodityId: number,
  varietyId: number | null,
  grade: string,
  incrementKg: number
) {
  const existing = await tx.inventory.findFirst({
    where: { warehouseId, commodityId, varietyId, grade },
  });
  if (existing) {
    await tx.inventory.update({
      where: { id: existing.id },
      data: { quantityKg: { increment: incrementKg } },
    });
  } else {
    await tx.inventory.create({
      data: { warehouseId, commodityId, varietyId, grade, quantityKg: incrementKg },
    });
  }
}

export async function receiveGoods(input: GrnInput, receivedByUserId: number) {
  const grnNumber = generateGrnNumber();
  return prisma.$transaction(async (tx) => {
    const grn = await tx.goodsReceivedNote.create({
      data: { ...input, grnNumber, receivedByUserId },
    });
    await upsertInventory(
      tx,
      input.warehouseId,
      input.commodityId,
      input.varietyId ?? null,
      input.grade ?? 'Grade A',
      input.quantityReceivedKg
    );
    await tx.stockMovement.create({
      data: {
        movementType: 'receipt',
        destWarehouseId: input.warehouseId,
        commodityId: input.commodityId,
        varietyId: input.varietyId ?? null,
        grade: input.grade ?? 'Grade A',
        quantityKg: input.quantityReceivedKg,
        referenceNo: grnNumber,
        createdByUserId: receivedByUserId,
      },
    });
    return grn;
  });
}

export async function transferStock(input: StockTransferInput, userId: number) {
  return prisma.$transaction(async (tx) => {
    const grade = input.grade ?? 'Grade A';
    const source = await tx.inventory.findFirst({
      where: {
        warehouseId: input.sourceWarehouseId,
        commodityId: input.commodityId,
        varietyId: input.varietyId ?? null,
        grade,
      },
    });
    if (!source || Number(source.quantityKg) < input.quantityKg) {
      throw Object.assign(new Error('Insufficient stock in source warehouse'), { status: 400 });
    }
    // Decrement source
    await tx.inventory.update({
      where: { id: source.id },
      data: { quantityKg: { decrement: input.quantityKg } },
    });
    // Upsert destination
    await upsertInventory(
      tx,
      input.destWarehouseId,
      input.commodityId,
      input.varietyId ?? null,
      grade,
      input.quantityKg
    );
    await tx.stockMovement.createMany({
      data: [
        {
          movementType: 'transfer_out',
          sourceWarehouseId: input.sourceWarehouseId,
          commodityId: input.commodityId,
          varietyId: input.varietyId ?? null,
          grade,
          quantityKg: input.quantityKg,
          referenceNo: input.referenceNo ?? null,
          createdByUserId: userId,
        },
        {
          movementType: 'transfer_in',
          destWarehouseId: input.destWarehouseId,
          commodityId: input.commodityId,
          varietyId: input.varietyId ?? null,
          grade,
          quantityKg: input.quantityKg,
          referenceNo: input.referenceNo ?? null,
          createdByUserId: userId,
        },
      ],
    });
    return { message: 'Transfer completed' };
  });
}
