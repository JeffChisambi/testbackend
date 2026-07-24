import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GTMS API — Grain Traceability Management System',
      version: '2.0.0',
      description:
        'RESTful API serving the NASFAM GTMS dashboard (Next.js) and mobile app (Flutter). ' +
        'Supports offline-first sync, JWT auth with refresh tokens, and full RBAC.',
    },
    servers: [
      { url: `http://localhost:${env.PORT}/api/v1`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & token management' },
      { name: 'Users', description: 'User management (admin)' },
      { name: 'IPCs', description: 'IPC / buying-centre management' },
      { name: 'Warehouses', description: 'Warehouse operations & GRN' },
      { name: 'Farmers', description: 'Farmer registration & tracking' },
      { name: 'Purchases', description: 'Commodity purchase recording' },
      { name: 'SeedLoans', description: 'Seed loan issuance & recovery' },
      { name: 'Inventory', description: 'Stock levels & movements' },
      { name: 'Sync', description: 'Mobile offline-first synchronisation' },
      { name: 'Traceability', description: 'End-to-end grain traceability' },
      { name: 'Reports', description: 'Analytics & summary reports' },
      { name: 'Audit', description: 'System audit logs (admin only)' },
      { name: 'Health', description: 'Service health check' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
