const { testConnection } = require('../config/database');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * Health Check Controller
 */
const getHealthStatus = async (req, res, next) => {
  try {
    const dbConnected = await testConnection();

    return sendSuccess(res, 'GTMS Backend Service is operating normally', {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus
};
