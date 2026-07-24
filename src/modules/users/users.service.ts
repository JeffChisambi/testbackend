import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { paginate } from '../../types';
import { CreateUserInput, UpdateUserInput } from './users.schema';

const USER_SELECT = {
  id: true, name: true, email: true, phone: true,
  role: true, status: true, avatar: true, ipcId: true,
  createdAt: true, updatedAt: true,
  ipc: { select: { id: true, name: true, code: true } },
} as const;

export async function listUsers(params: { page?: number; limit?: number; search?: string; role?: string }) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.search ? {
      OR: [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
      ],
    } : {}),
    ...(params.role ? { role: params.role as never } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: USER_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);

  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

export async function createUser(input: CreateUserInput) {
  const hashed = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { ...input, password: hashed },
    select: USER_SELECT,
  });
}

export async function updateUser(id: number, input: UpdateUserInput) {
  await getUserById(id); // ensure exists
  return prisma.user.update({ where: { id }, data: input, select: USER_SELECT });
}

export async function deleteUser(id: number) {
  await getUserById(id);
  return prisma.user.delete({ where: { id }, select: USER_SELECT });
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
