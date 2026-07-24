import { prisma } from '../../config/database';

export async function traceByRef(query: string) {
  // Try purchase_ref first
  const purchase = await prisma.purchase.findFirst({
    where: {
      OR: [
        { purchaseRef: query },
        { uuid: query },
      ],
    },
    include: {
      farmer: { include: { crops: { include: { commodity: true } }, club: true } },
      commodity: true,
      buyingCenter: true,
      officer: { select: { id: true, name: true } },
      goodsReceivedNotes: {
        include: {
          warehouse: true,
          commodity: true,
        },
      },
    },
  });

  if (purchase) {
    return {
      type: 'purchase',
      origin: {
        farmer: purchase.farmer,
        registeredAt: purchase.farmer.createdAt,
      },
      transaction: purchase,
      warehouseReceipts: purchase.goodsReceivedNotes,
    };
  }

  // Try GRN
  const grn = await prisma.goodsReceivedNote.findFirst({
    where: { grnNumber: query },
    include: {
      warehouse: true,
      commodity: true,
      purchase: {
        include: {
          farmer: true,
          buyingCenter: true,
        },
      },
      receivedBy: { select: { id: true, name: true } },
    },
  });

  if (grn) return { type: 'grn', grn };

  // Try farmer
  const farmer = await prisma.farmer.findFirst({
    where: {
      OR: [
        { farmerId: query },
        { nrcId: query },
        { uuid: query },
      ],
    },
    include: {
      crops: { include: { commodity: true } },
      seedLoans: { include: { commodity: true } },
      purchases: {
        include: { commodity: true, buyingCenter: true, goodsReceivedNotes: { include: { warehouse: true } } },
        orderBy: { createdAt: 'desc' },
      },
      club: true,
    },
  });

  if (farmer) return { type: 'farmer', farmer };

  return null;
}
