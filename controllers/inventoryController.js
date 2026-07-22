const { query } = require('../config/database');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * Get current stock levels (FR-6.1, FR-6.2, FR-6.3)
 */
const getInventory = async (req, res, next) => {
  try {
    const { warehouse_id, commodity_id, grade } = req.query;

    let sql = `
      SELECT inv.*, w.name as warehouse_name, com.name as commodity_name, var.variety_name 
      FROM inventory inv 
      JOIN warehouses w ON inv.warehouse_id = w.id 
      JOIN commodities com ON inv.commodity_id = com.id 
      LEFT JOIN commodity_varieties var ON inv.variety_id = var.id 
      WHERE 1=1
    `;
    const params = [];

    if (warehouse_id) {
      sql += ` AND inv.warehouse_id = ?`;
      params.push(warehouse_id);
    }

    if (commodity_id) {
      sql += ` AND inv.commodity_id = ?`;
      params.push(commodity_id);
    }

    if (grade) {
      sql += ` AND inv.grade = ?`;
      params.push(grade);
    }

    sql += ` ORDER BY inv.quantity_kg DESC`;

    const [items] = await query(sql, params);

    return sendSuccess(res, 'Inventory retrieved successfully', items);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Low Stock Threshold Alerts (FR-6.6)
 */
const getLowStockAlerts = async (req, res, next) => {
  try {
    const [alerts] = await query(
      `SELECT inv.*, w.name as warehouse_name, com.name as commodity_name 
       FROM inventory inv 
       JOIN warehouses w ON inv.warehouse_id = w.id 
       JOIN commodities com ON inv.commodity_id = com.id 
       WHERE inv.quantity_kg <= inv.min_threshold_kg`
    );

    return sendSuccess(res, 'Low stock threshold alerts retrieved', alerts);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getLowStockAlerts
};
