const express = require('express');
const router = express.Router();
const { traceCommodity } = require('../controllers/traceabilityController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/traceability/search:
 *   get:
 *     summary: Trace commodity through the entire supply chain
 *     tags: [Traceability]
 */
router.get('/search', authenticate, traceCommodity);

module.exports = router;
