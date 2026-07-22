const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { testConnection } = require('./config/database');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy error: Origin ${origin} is not allowed.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static File Uploads
app.use('/uploads', express.static('uploads'));

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount API routes
app.use('/api', routes);

// Root System Info Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    system: 'IPC Grain Traceability Management System (GTMS-Backend)',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      farmers: '/api/farmers',
      seedLoans: '/api/seed-loans',
      purchases: '/api/purchases',
      warehouses: '/api/warehouses',
      inventory: '/api/inventory',
      traceability: '/api/traceability',
      reports: '/api/reports',
      mobileSync: '/api/sync'
    }
  });
});

// Central Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`🚀 IPC Grain Traceability System (GTMS-Backend) running on port ${PORT}`);
  console.log(`📑 OpenAPI / Swagger Docs: http://localhost:${PORT}/api-docs`);
  await testConnection();
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

module.exports = app;
