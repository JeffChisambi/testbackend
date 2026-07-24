import { prisma } from '../../config/database';
import { paginate } from '../../types';
import { CreateIpcInput } from './ipcs.schema';

export async function listIpcs(params: { page?: number; limit?: number; search?: string }) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = params.search
    ? { OR: [{ name: { contains: params.search } }, { code: { contains: params.search } }] }
    : {};

  const [total, data] = await Promise.all([
    prisma.ipc.count({ where }),
    prisma.ipc.findMany({
      where, skip, take, orderBy: { name: 'asc' },
      include: { _count: { select: { users: true, warehouses: true, purchases: true } } },
    }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getIpcById(id: number) {
  const ipc = await prisma.ipc.findUnique({
    where: { id },
    include: {
      warehouses: true,
      _count: { select: { users: true, purchases: true, clubsAssociations: true } },
    },
  });
  if (!ipc) throw Object.assign(new Error('IPC not found'), { status: 404 });
  return ipc;
}

export async function createIpc(input: CreateIpcInput) {
  return prisma.ipc.create({ data: input });
}

export async function updateIpc(id: number, input: Partial<CreateIpcInput>) {
  await getIpcById(id);
  return prisma.ipc.update({ where: { id }, data: input });
}

export async function deleteIpc(id: number) {
  await getIpcById(id);
  return prisma.ipc.delete({ where: { id } });
}
