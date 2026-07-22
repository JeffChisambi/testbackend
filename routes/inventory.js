const express = require('express');
const router = express.Router();
const { getInventory, getLowStockAlerts } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: View real-time stock levels
 *     tags: [Inventory]
 */
router.get('/', authenticate, getInventory);

/**
 * @swagger
 * /api/inventory/low-stock-alerts:
 *   get:
 *     summary: Get items below minimum stock threshold
 *     tags: [Inventory]
 */
router.get('/low-stock-alerts', authenticate, getLowStockAlerts);

module.exports = router;
