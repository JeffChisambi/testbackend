const prisma = require('../lib/prisma');

/**
 * Generate formatted unique reference IDs
 */
const generateFarmerId = async () => {
  const year = new Date().getFullYear();
  const [rows] = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM farmers');
  const count = Number(rows.count) + 1;
  const sequence = String(count).padStart(5, '0');
  return `FARM-${year}-${sequence}`;
};

const generatePurchaseRef = async () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `PUR-${year}-${timestamp}${randomSuffix}`;
};

const generateGrnNumber = async () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `GRN-${year}-${timestamp}${randomSuffix}`;
};

const generateDeliveryRef = async () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `DEL-${year}-${timestamp}${randomSuffix}`;
};

module.exports = {
  generateFarmerId,
  generatePurchaseRef,
  generateGrnNumber,
  generateDeliveryRef
};
