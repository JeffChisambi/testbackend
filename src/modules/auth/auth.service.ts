import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token';
import { AuthPayload } from '../../types';

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  if (user.status !== 'active') throw Object.assign(new Error('Account is not active'), { status: 403 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    ipcId: user.ipcId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id });

  // Store refresh token (7d expiry)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  return { accessToken, refreshToken, user: payload };
}

export async function refreshTokens(rawToken: string) {
  let payload: { userId: number };
  try {
    payload = verifyRefreshToken(rawToken) as { userId: number };
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: rawToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token revoked or expired'), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== 'active') {
    throw Object.assign(new Error('User not found or inactive'), { status: 401 });
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { token: rawToken } });

  const authPayload: AuthPayload = { userId: user.id, email: user.email, role: user.role, ipcId: user.ipcId };
  const newAccess = signAccessToken(authPayload);
  const newRefresh = signRefreshToken({ userId: user.id });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: newRefresh, userId: user.id, expiresAt } });

  return { accessToken: newAccess, refreshToken: newRefresh };
}

export async function logoutUser(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, status: true, avatar: true, ipcId: true,
      createdAt: true, updatedAt: true,
      ipc: { select: { id: true, name: true, code: true } },
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}
