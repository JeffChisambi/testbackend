import { prisma } from '../../config/database';
import { paginate } from '../../types';
import { generateFarmerId } from '../../utils/idGenerator';
import { CreateFarmerInput, UpdateFarmerInput } from './farmers.schema';

const FARMER_SELECT = {
  id: true, uuid: true, farmerId: true, firstName: true, lastName: true,
  nrcId: true, phone: true, gender: true, dateOfBirth: true, address: true,
  village: true, district: true, clubId: true, gpsLatitude: true, gpsLongitude: true,
  seedLoanBalance: true, status: true, createdAt: true, updatedAt: true,
  club: { select: { id: true, name: true, associationName: true } },
  registeredBy: { select: { id: true, name: true } },
  crops: { include: { commodity: { select: { id: true, name: true, code: true } } } },
} as const;

export async function listFarmers(params: {
  page?: number; limit?: number; search?: string;
  clubId?: number; district?: string; status?: string;
}) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.search ? {
      OR: [
        { farmerId: { contains: params.search } },
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { nrcId: { contains: params.search } },
        { phone: { contains: params.search } },
      ],
    } : {}),
    ...(params.clubId ? { clubId: params.clubId } : {}),
    ...(params.district ? { district: { contains: params.district } } : {}),
    ...(params.status ? { status: params.status as never } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.farmer.count({ where }),
    prisma.farmer.findMany({ where, select: FARMER_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getFarmerById(id: number) {
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      club: true,
      registeredBy: { select: { id: true, name: true } },
      crops: { include: { commodity: true } },
      seedLoans: { include: { commodity: true }, orderBy: { createdAt: 'desc' }, take: 5 },
      purchases: {
        include: { commodity: true, buyingCenter: true },
        orderBy: { createdAt: 'desc' }, take: 10,
      },
    },
  });
  if (!farmer) throw Object.assign(new Error('Farmer not found'), { status: 404 });
  return farmer;
}

export async function getFarmerByUuid(uuid: string) {
  const farmer = await prisma.farmer.findUnique({ where: { uuid } });
  if (!farmer) throw Object.assign(new Error('Farmer not found'), { status: 404 });
  return farmer;
}

export async function createFarmer(input: CreateFarmerInput, registeredByUserId: number) {
  // Check NRC uniqueness
  const existing = await prisma.farmer.findUnique({ where: { nrcId: input.nrcId } });
  if (existing) throw Object.assign(new Error(`Farmer with NRC ID '${input.nrcId}' already registered`), { status: 409 });

  const { crops, dateOfBirth, ...rest } = input;
  return prisma.farmer.create({
    data: {
      ...rest,
      farmerId: generateFarmerId(),
      registeredByUserId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      crops: crops?.length ? { create: crops } : undefined,
    },
    select: FARMER_SELECT,
  });
}

export async function updateFarmer(id: number, input: UpdateFarmerInput) {
  await getFarmerById(id);
  const { crops, dateOfBirth, ...rest } = input;
  return prisma.farmer.update({
    where: { id },
    data: {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    },
    select: FARMER_SELECT,
  });
}

export async function deleteFarmer(id: number) {
  await getFarmerById(id);
  return prisma.farmer.delete({ where: { id } });
}
