const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { registerFarmer, getFarmers, getFarmerById, updateFarmer } = require('../controllers/farmerController');
const { authenticate, authorize } = require('../middleware/auth');
const { sendError } = require('../utils/responseHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation error', 400, errors.array());
  }
  next();
};

/**
 * @swagger
 * /api/farmers:
 *   post:
 *     summary: Register a new farmer (Mobile/Web)
 *     tags: [Farmers]
 */
router.post(
  '/',
  [
    authenticate,
    authorize('admin', 'registration_officer', 'extension_officer', 'ipc_manager'),
    body('first_name').notEmpty().withMessage('First name is required').trim(),
    body('last_name').notEmpty().withMessage('Last name is required').trim(),
    body('nrc_id').notEmpty().withMessage('NRC / National ID is required').trim(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender required'),
    validate
  ],
  registerFarmer
);

/**
 * @swagger
 * /api/farmers:
 *   get:
 *     summary: Search & list farmers
 *     tags: [Farmers]
 */
router.get('/', authenticate, getFarmers);

/**
 * @swagger
 * /api/farmers/{id}:
 *   get:
 *     summary: Get complete farmer profile & transaction history
 *     tags: [Farmers]
 */
router.get('/:id', authenticate, getFarmerById);

/**
 * @swagger
 * /api/farmers/{id}:
 *   put:
 *     summary: Update farmer details
 *     tags: [Farmers]
 */
router.put(
  '/:id',
  [
    authenticate,
    authorize('admin', 'registration_officer', 'extension_officer', 'ipc_manager'),
    validate
  ],
  updateFarmer
);

module.exports = router;
