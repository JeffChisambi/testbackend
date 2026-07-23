const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getTraceability } = require('../services/traceabilityService');

/**
 * End-to-End Commodity Traceability Lookup (FR-7.1 - FR-7.7, BR-15)
 */
const traceCommodity = async (req, res, next) => {
  try {
    const { query: searchQuery } = req.query;

    if (!searchQuery) {
      return sendError(res, 'Traceability search query parameter required (Farmer ID, Purchase Ref, GRN Number, or Delivery Ref).', 400);
    }

    const term = searchQuery.trim();
    const traceData = await getTraceability(term);

    if (!traceData) {
      return sendError(res, 'No matching traceability records found for query.', 404);
    }

    if (traceData.mode === 'grn') {
      return sendSuccess(res, 'Traceability chain retrieved via GRN Number', traceData);
    }

    return sendSuccess(res, 'Supply chain traceability records retrieved successfully', traceData.traceResults);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  traceCommodity
};
