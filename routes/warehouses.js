const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { createWarehouse, getWarehouses, receiveGoods, transferStock } = require('../controllers/warehouseController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendError } = require('../utils/responseHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());
  next();
};

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: List all warehouses
 *     tags: [Warehouse]
 */
router.get('/', authenticate, getWarehouses);

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Create a warehouse
 *     tags: [Warehouse]
 */
router.post(
  '/',
  [
    authenticate,
    authorize('admin', 'ipc_manager', 'headoffice_manager'),
    body('name').notEmpty().withMessage('Warehouse name is required'),
    body('ipc_id').notEmpty().withMessage('IPC ID is required'),
    body('location').notEmpty().withMessage('Location is required'),
    validate
  ],
  createWarehouse
);

/**
 * @swagger
 * /api/warehouses/grn:
 *   post:
 *     summary: Receive commodities into warehouse & Generate Goods Received Note (GRN)
 *     tags: [Warehouse]
 */
router.post(
  '/grn',
  [
    authenticate,
    authorize('admin', 'warehouse_officer', 'ipc_manager'),
    upload.single('document'),
    body('warehouse_id').notEmpty().withMessage('Warehouse ID is required'),
    body('commodity_id').notEmpty().withMessage('Commodity ID is required'),
    body('quantity_received_kg').isNumeric().withMessage('Quantity in KG is required'),
    validate
  ],
  receiveGoods
);

/**
 * @swagger
 * /api/warehouses/transfer:
 *   post:
 *     summary: Transfer stock between warehouses
 *     tags: [Warehouse]
 */
router.post(
  '/transfer',
  [
    authenticate,
    authorize('admin', 'warehouse_officer', 'ipc_manager'),
    body('source_warehouse_id').notEmpty().withMessage('Source warehouse ID is required'),
    body('dest_warehouse_id').notEmpty().withMessage('Destination warehouse ID is required'),
    body('commodity_id').notEmpty().withMessage('Commodity ID is required'),
    body('quantity_kg').isNumeric().withMessage('Quantity in KG is required'),
    validate
  ],
  transferStock
);

module.exports = router;
