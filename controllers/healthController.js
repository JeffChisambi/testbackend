const { getDatabaseHealth } = require('../config/database');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * Health Check Controller
 */
const getHealthStatus = async (req, res, next) => {
  try {
    const health = await getDatabaseHealth();

    return sendSuccess(res, 'GTMS Backend Service is operating normally', {
      status: health.status === 'UP' ? 'UP' : 'DOWN',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: health.connected ? 'CONNECTED' : 'DISCONNECTED',
      environment: process.env.NODE_ENV || 'development',
      details: health
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus
};
