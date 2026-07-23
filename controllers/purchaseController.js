const { sendSuccess, sendError } = require('../utils/responseHandler');
const { createPurchase: createPurchaseService, listPurchases, getPurchaseByRef: getPurchaseByRefService } = require('../services/purchaseService');

/**
 * Record a commodity purchase with automatic seed loan recovery (FR-4.1 - FR-4.11)
 */
const recordPurchase = async (req, res, next) => {
  try {
    const { purchase, smsNotification } = await createPurchaseService(req.body, req.user);

    return sendSuccess(res, 'Commodity purchase recorded successfully', {
      purchase,
      sms_notification: smsNotification
    }, 201);
  } catch (error) {
    if (error.message.includes('Farmer is not registered')) {
      return sendError(res, 'Farmer is not registered in the system (BR-2). Registration required before recording purchases.', 404);
    }
    next(error);
  }
};

/**
 * List purchases
 */
const getPurchases = async (req, res, next) => {
  try {
    const { search, farmer_id, ipc_id, commodity_id, page = 1, limit = 10 } = req.query;
    const purchases = await listPurchases({ search, farmerId: farmer_id, ipcId: ipc_id, commodityId: commodity_id, page, limit });

    return sendSuccess(res, 'Purchases retrieved successfully', purchases);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Purchase details by reference
 */
const getPurchaseByRefHandler = async (req, res, next) => {
  try {
    const { ref } = req.params;

    const purchase = await getPurchaseByRefService(ref);

    if (!purchase) {
      return sendError(res, 'Purchase transaction record not found.', 404);
    }

    return sendSuccess(res, 'Purchase receipt details retrieved', purchase);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPurchase,
  getPurchases,
  getPurchaseByRef: getPurchaseByRefHandler
};
