const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { recordPurchase, getPurchases, getPurchaseByRef } = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');
const { sendError } = require('../utils/responseHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());
  next();
};

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Record a commodity purchase from a farmer
 *     tags: [Purchases]
 */
router.post(
  '/',
  [
    authenticate,
    authorize('admin', 'marketing_officer', 'ipc_manager'),
    body('farmer_id').notEmpty().withMessage('Farmer ID is required'),
    body('commodity_id').notEmpty().withMessage('Commodity ID is required'),
    body('quantity_kg').isNumeric().withMessage('Quantity in KG is required'),
    body('unit_price').isNumeric().withMessage('Unit price is required'),
    validate
  ],
  recordPurchase
);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Search & list purchases
 *     tags: [Purchases]
 */
router.get('/', authenticate, getPurchases);

/**
 * @swagger
 * /api/purchases/{ref}:
 *   get:
 *     summary: Get purchase receipt by transaction reference
 *     tags: [Purchases]
 */
router.get('/:ref', authenticate, getPurchaseByRef);

module.exports = router;
