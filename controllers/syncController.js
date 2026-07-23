const { sendSuccess } = require('../utils/responseHandler');
const { syncPush: syncPushService, syncPull: syncPullService } = require('../services/syncService');

/**
 * Mobile Offline Data Sync Push (MFR-9, MFR-10)
 */
const syncPush = async (req, res, next) => {
  try {
    const results = await syncPushService(req.body, req.user);
    return sendSuccess(res, 'Mobile offline synchronization completed', results);
  } catch (error) {
    next(error);
  }
};

/**
 * Mobile Offline Data Sync Pull (MFR-10)
 */
const syncPull = async (req, res, next) => {
  try {
    const data = await syncPullService();

    return sendSuccess(res, 'Master data downloaded for offline cache', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncPush,
  syncPull
};
