import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

// ── Module routes ─────────────────────────────────────────────────────────────
import authRoutes         from './modules/auth/auth.routes';
import userRoutes         from './modules/users/users.routes';
import ipcRoutes          from './modules/ipcs/ipcs.routes';
import warehouseRoutes    from './modules/warehouses/warehouses.routes';
import farmerRoutes       from './modules/farmers/farmers.routes';
import purchaseRoutes     from './modules/purchases/purchases.routes';
import seedLoanRoutes     from './modules/seed-loans/seed-loans.routes';
import inventoryRoutes    from './modules/inventory/inventory.routes';
import syncRoutes         from './modules/sync/sync.routes';
import auditRoutes        from './modules/audit/audit.routes';
import traceabilityRoutes from './modules/traceability/traceability.routes';
import reportRoutes       from './modules/reports/reports.routes';
import healthRoutes       from './modules/health/health.routes';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile/curl) or listed origins
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // In development also allow any *.replit.dev domain
      if (env.NODE_ENV === 'development' && origin.endsWith('.replit.dev')) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`), false);
    },
    credentials: true,
  })
);

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: () => env.NODE_ENV === 'test',
  })
);

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ── Swagger docs ──────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ── API routes ────────────────────────────────────────────────────────────────
const v1 = express.Router();
v1.use(apiLimiter);

v1.use('/auth',         authRoutes);
v1.use('/users',        userRoutes);
v1.use('/ipcs',         ipcRoutes);
v1.use('/warehouses',   warehouseRoutes);
v1.use('/farmers',      farmerRoutes);
v1.use('/purchases',    purchaseRoutes);
v1.use('/seed-loans',   seedLoanRoutes);
v1.use('/inventory',    inventoryRoutes);
v1.use('/sync',         syncRoutes);
v1.use('/audit-logs',   auditRoutes);
v1.use('/traceability', traceabilityRoutes);
v1.use('/reports',      reportRoutes);
v1.use('/health',       healthRoutes);

app.use('/api/v1', v1);

// ── Root info ─────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    system: 'GTMS — IPC Grain Traceability Management System',
    version: '2.0.0',
    documentation: '/api-docs',
    health: '/api/v1/health',
    endpoints: {
      auth:         '/api/v1/auth',
      users:        '/api/v1/users',
      ipcs:         '/api/v1/ipcs',
      warehouses:   '/api/v1/warehouses',
      farmers:      '/api/v1/farmers',
      purchases:    '/api/v1/purchases',
      seedLoans:    '/api/v1/seed-loans',
      inventory:    '/api/v1/inventory',
      sync:         '/api/v1/sync',
      audit:        '/api/v1/audit-logs',
      traceability: '/api/v1/traceability',
      reports:      '/api/v1/reports',
    },
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
