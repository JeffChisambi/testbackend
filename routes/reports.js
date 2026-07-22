const express = require('express');
const router = express.Router();
const { getFarmerReport, getPurchaseReport, getLoanRecoveryReport } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/reports/farmers:
 *   get:
 *     summary: Farmer demographics & club report
 *     tags: [Reports]
 */
router.get('/farmers', authenticate, getFarmerReport);

/**
 * @swagger
 * /api/reports/purchases:
 *   get:
 *     summary: Commodity purchases & financial report
 *     tags: [Reports]
 */
router.get('/purchases', authenticate, getPurchaseReport);

/**
 * @swagger
 * /api/reports/loans:
 *   get:
 *     summary: Seed loan recovery & balance report
 *     tags: [Reports]
 */
router.get('/loans', authenticate, getLoanRecoveryReport);

module.exports = router;
