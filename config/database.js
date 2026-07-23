const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return prisma;

  try {
    await prisma.$connect();
    await prisma.$queryRawUnsafe('SELECT 1');
    isConnected = true;
    logger.info('✅ Connected to database via Prisma');
    return prisma;
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  if (!isConnected) return;
  await prisma.$disconnect();
  isConnected = false;
};

const getDatabaseHealth = async () => {
  try {
    await connectDatabase();
    return { status: 'UP', connected: true };
  } catch (error) {
    return { status: 'DOWN', connected: false, error: error.message };
  }
};

const testConnection = async () => {
  try {
    await connectDatabase();
    return true;
  } catch (error) {
    return false;
  }
};

const query = async (sql, params = []) => {
  if (Array.isArray(params) && params.length > 0) {
    return prisma.$queryRawUnsafe(sql, ...params);
  }

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    return prisma.$queryRawUnsafe(sql, params);
  }

  return prisma.$queryRawUnsafe(sql);
};

module.exports = {
  prisma,
  query,
  connectDatabase,
  disconnectDatabase,
  getDatabaseHealth,
  testConnection
};
