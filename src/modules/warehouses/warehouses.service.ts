import { Decimal } from '@prisma/client/runtime/library';
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

export async function receiveGoods(input: GrnInput, receivedByUserId: number) {
  const grnNumber = generateGrnNumber();
  return prisma.$transaction(async (tx) => {
    // Create GRN
    const grn = await tx.goodsReceivedNote.create({
      data: { ...input, grnNumber, receivedByUserId },
    });
    // Upsert inventory
    await tx.inventory.upsert({
      where: {
        uk_wh_comm_var_grade: {
          warehouseId: input.warehouseId,
          commodityId: input.commodityId,
          varietyId: input.varietyId ?? null,
          grade: input.grade ?? 'Grade A',
        },
      },
      create: {
        warehouseId: input.warehouseId,
        commodityId: input.commodityId,
        varietyId: input.varietyId ?? null,
        grade: input.grade ?? 'Grade A',
        quantityKg: input.quantityReceivedKg,
      },
      update: { quantityKg: { increment: input.quantityReceivedKg } },
    });
    // Record movement
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
    // Check source stock
    const source = await tx.inventory.findFirst({
      where: {
        warehouseId: input.sourceWarehouseId,
        commodityId: input.commodityId,
        grade: input.grade ?? 'Grade A',
        ...(input.varietyId ? { varietyId: input.varietyId } : {}),
      },
    });
    if (!source || new Decimal(source.quantityKg).lessThan(input.quantityKg)) {
      throw Object.assign(new Error('Insufficient stock in source warehouse'), { status: 400 });
    }
    // Decrement source
    await tx.inventory.update({
      where: { id: source.id },
      data: { quantityKg: { decrement: input.quantityKg } },
    });
    // Upsert destination
    await tx.inventory.upsert({
      where: {
        uk_wh_comm_var_grade: {
          warehouseId: input.destWarehouseId,
          commodityId: input.commodityId,
          varietyId: input.varietyId ?? null,
          grade: input.grade ?? 'Grade A',
        },
      },
      create: {
        warehouseId: input.destWarehouseId,
        commodityId: input.commodityId,
        varietyId: input.varietyId ?? null,
        grade: input.grade ?? 'Grade A',
        quantityKg: input.quantityKg,
      },
      update: { quantityKg: { increment: input.quantityKg } },
    });
    // Record two movements
    await tx.stockMovement.createMany({
      data: [
        {
          movementType: 'transfer_out',
          sourceWarehouseId: input.sourceWarehouseId,
          commodityId: input.commodityId,
          varietyId: input.varietyId ?? null,
          grade: input.grade ?? 'Grade A',
          quantityKg: input.quantityKg,
          referenceNo: input.referenceNo ?? null,
          createdByUserId: userId,
        },
        {
          movementType: 'transfer_in',
          destWarehouseId: input.destWarehouseId,
          commodityId: input.commodityId,
          varietyId: input.varietyId ?? null,
          grade: input.grade ?? 'Grade A',
          quantityKg: input.quantityKg,
          referenceNo: input.referenceNo ?? null,
          createdByUserId: userId,
        },
      ],
    });
    return { message: 'Transfer completed' };
  });
}
