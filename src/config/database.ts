import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple instances in dev (hot-reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function getDatabaseHealth(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() - start };
  } catch {
    return { status: 'unhealthy' };
  }
}
