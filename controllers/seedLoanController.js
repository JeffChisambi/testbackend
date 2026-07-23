const { sendSuccess, sendError } = require('../utils/responseHandler');
const { issueSeedLoan: issueSeedLoanService, listSeedLoans: listSeedLoansService } = require('../services/seedLoanService');

/**
 * Issue a new seed loan to a farmer (FR-3.7)
 */
const issueSeedLoan = async (req, res, next) => {
  try {
    const { farmer_id, commodity_id, loan_amount, issue_date, due_date, notes } = req.body;

    const newLoan = await issueSeedLoanService({
      farmerId: farmer_id,
      commodityId: commodity_id,
      loanAmount: loan_amount,
      issueDate: issue_date,
      dueDate: due_date,
      notes
    });

    if (!newLoan) {
      return sendError(res, 'Farmer record not found.', 404);
    }

    return sendSuccess(res, 'Seed loan issued successfully', newLoan, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * List & search seed loans
 */
const getSeedLoans = async (req, res, next) => {
  try {
    const { farmer_id, status, page = 1, limit = 10 } = req.query;
    const loans = await listSeedLoansService({ farmerId: farmer_id, status, page, limit });

    return sendSuccess(res, 'Seed loans list retrieved', loans);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueSeedLoan,
  getSeedLoans
};
