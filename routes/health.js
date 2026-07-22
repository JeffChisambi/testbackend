const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server and database status operational
 */
router.get('/', getHealthStatus);

module.exports = router;
