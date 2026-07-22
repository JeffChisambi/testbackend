const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const farmerRoutes = require('./farmers');
const seedLoanRoutes = require('./seedLoans');
const purchaseRoutes = require('./purchases');
const warehouseRoutes = require('./warehouses');
const inventoryRoutes = require('./inventory');
const traceabilityRoutes = require('./traceability');
const reportRoutes = require('./reports');
const syncRoutes = require('./sync');
const healthRoutes = require('./health');

// Mount Modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/farmers', farmerRoutes);
router.use('/seed-loans', seedLoanRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/traceability', traceabilityRoutes);
router.use('/reports', reportRoutes);
router.use('/sync', syncRoutes);
router.use('/health', healthRoutes);

module.exports = router;
