const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { connectDatabase, disconnectDatabase, getDatabaseHealth } = require('./config/database');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(new Error(`CORS policy error: Origin ${origin} is not allowed.`), false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

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

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    const server = app.listen(PORT, () => {
      logger.info(`🚀 IPC Grain Traceability System (GTMS-Backend) running on port ${PORT}`);
      logger.info(`📑 OpenAPI / Swagger Docs: http://localhost:${PORT}/api-docs`);
    });

    server.on('close', async () => {
      await disconnectDatabase();
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = app;
