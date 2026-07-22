const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { issueSeedLoan, getSeedLoans } = require('../controllers/seedLoanController');
const { authenticate, authorize } = require('../middleware/auth');
const { sendError } = require('../utils/responseHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());
  next();
};

/**
 * @swagger
 * /api/seed-loans:
 *   post:
 *     summary: Issue a seed loan to a farmer
 *     tags: [Seed Loans]
 */
router.post(
  '/',
  [
    authenticate,
    authorize('admin', 'extension_officer', 'ipc_manager'),
    body('farmer_id').notEmpty().withMessage('Farmer ID is required'),
    body('commodity_id').notEmpty().withMessage('Commodity ID is required'),
    body('loan_amount').isNumeric().withMessage('Valid loan amount is required'),
    validate
  ],
  issueSeedLoan
);

/**
 * @swagger
 * /api/seed-loans:
 *   get:
 *     summary: Get seed loans list
 *     tags: [Seed Loans]
 */
router.get('/', authenticate, getSeedLoans);

module.exports = router;
