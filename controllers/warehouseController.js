const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  createWarehouse: createWarehouseService,
  listWarehouses: listWarehousesService,
  receiveGoods: receiveGoodsService,
  transferStock: transferStockService
} = require('../services/warehouseService');

/**
 * Create a new warehouse
 */
const createWarehouse = async (req, res, next) => {
  try {
    const { name, ipc_id, location, capacity_tonnes, manager_user_id } = req.body;

    const newWh = await createWarehouseService({ name, ipcId: ipc_id, location, capacityTonnes: capacity_tonnes, managerUserId: manager_user_id });

    return sendSuccess(res, 'Warehouse created successfully', newWh, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * List warehouses
 */
const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await listWarehousesService();

    return sendSuccess(res, 'Warehouses list retrieved', warehouses);
  } catch (error) {
    next(error);
  }
};

/**
 * Receive Goods & Generate Goods Received Note (GRN) (FR-5.1, FR-5.2, FR-6.4)
 */
const receiveGoods = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      document_url: req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || null)
    };
    const grnRecord = await receiveGoodsService(payload, req.user);

    return sendSuccess(res, 'Goods received and GRN generated successfully', grnRecord, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer Stock between warehouses (FR-5.6, BR-5)
 */
const transferStock = async (req, res, next) => {
  try {
    const result = await transferStockService(req.body, req.user);
    return sendSuccess(res, 'Stock transfer completed successfully', result);
  } catch (error) {
    if (error.message.includes('Insufficient inventory')) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  receiveGoods,
  transferStock
};
