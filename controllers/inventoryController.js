const { sendSuccess } = require('../utils/responseHandler');
const { getInventoryItems, getLowStockAlerts: getLowStockAlertsService } = require('../services/inventoryService');

/**
 * Get current stock levels (FR-6.1, FR-6.2, FR-6.3)
 */
const getInventory = async (req, res, next) => {
  try {
    const { warehouse_id, commodity_id, grade } = req.query;

    const items = await getInventoryItems({ warehouseId: warehouse_id, commodityId: commodity_id, grade });

    return sendSuccess(res, 'Inventory retrieved successfully', items);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Low Stock Threshold Alerts (FR-6.6)
 */
const getLowStockAlertsHandler = async (req, res, next) => {
  try {
    const alerts = await getLowStockAlertsService();

    return sendSuccess(res, 'Low stock threshold alerts retrieved', alerts);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getLowStockAlerts: getLowStockAlertsHandler
};
