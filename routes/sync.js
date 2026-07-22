const express = require('express');
const router = express.Router();
const { syncPush, syncPull } = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/sync/push:
 *   post:
 *     summary: Push offline mobile records to server
 *     tags: [Sync]
 */
router.post('/push', authenticate, syncPush);

/**
 * @swagger
 * /api/sync/pull:
 *   get:
 *     summary: Download master data for mobile offline storage
 *     tags: [Sync]
 */
router.get('/pull', authenticate, syncPull);

module.exports = router;
