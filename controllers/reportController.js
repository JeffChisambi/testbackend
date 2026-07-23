const { sendSuccess } = require('../utils/responseHandler');
const {
  getFarmerReport: getFarmerReportService,
  getPurchaseReport: getPurchaseReportService,
  getLoanRecoveryReport: getLoanRecoveryReportService
} = require('../services/reportService');

/**
 * Farmer Summary Report (FR-8.1)
 */
const getFarmerSummaryReport = async (req, res, next) => {
  try {
    const report = await getFarmerReportService();

    return sendSuccess(res, 'Farmer summary report generated', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Purchase Analytics Report (FR-8.2)
 */
const getPurchaseAnalyticsReport = async (req, res, next) => {
  try {
    const { start_date, end_date, ipc_id, commodity_id } = req.query;

    const report = await getPurchaseReportService({ startDate: start_date, endDate: end_date, ipcId: ipc_id, commodityId: commodity_id });

    return sendSuccess(res, 'Purchase analytics report generated', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Seed Loan Recovery Report (FR-8.6)
 */
const getLoanRecoverySummaryReport = async (req, res, next) => {
  try {
    const summary = await getLoanRecoveryReportService();

    return sendSuccess(res, 'Seed loan recovery report generated', summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFarmerReport: getFarmerSummaryReport,
  getPurchaseReport: getPurchaseAnalyticsReport,
  getLoanRecoveryReport: getLoanRecoverySummaryReport
};
