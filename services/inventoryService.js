const prisma = require('../lib/prisma');

const getInventoryItems = async ({ warehouseId, commodityId, grade }) => {
  let sql = `
    SELECT inv.*, w.name as warehouse_name, com.name as commodity_name, var.variety_name
    FROM inventory inv
    JOIN warehouses w ON inv.warehouse_id = w.id
    JOIN commodities com ON inv.commodity_id = com.id
    LEFT JOIN commodity_varieties var ON inv.variety_id = var.id
    WHERE 1=1
  `;
  const params = [];

  if (warehouseId) {
    sql += ` AND inv.warehouse_id = ?`;
    params.push(warehouseId);
  }

  if (commodityId) {
    sql += ` AND inv.commodity_id = ?`;
    params.push(commodityId);
  }

  if (grade) {
    sql += ` AND inv.grade = ?`;
    params.push(grade);
  }

  sql += ` ORDER BY inv.quantity_kg DESC`;

  return prisma.$queryRawUnsafe(sql, ...params);
};

const getLowStockAlerts = async () => {
  return prisma.$queryRawUnsafe(
    `SELECT inv.*, w.name as warehouse_name, com.name as commodity_name
     FROM inventory inv
     JOIN warehouses w ON inv.warehouse_id = w.id
     JOIN commodities com ON inv.commodity_id = com.id
     WHERE inv.quantity_kg <= inv.min_threshold_kg`
  );
};

module.exports = {
  getInventoryItems,
  getLowStockAlerts
};
