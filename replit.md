# GTMS Backend — Grain Traceability Management System

## Overview

Production-ready Express.js + TypeScript REST API for the NASFAM GTMS platform.  
Serves both the **Next.js dashboard** and the **Flutter mobile app** (offline-first sync).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript (strict) |
| Database | MySQL (via Prisma ORM) |
| Auth | JWT — HTTP-only cookies + refresh token rotation |
| Validation | Zod |
| Logging | Winston + Morgan |
| Docs | Swagger/OpenAPI 3.0 at `/api-docs` |

## Project Structure

```
src/
├── config/          # env validation, Prisma client, Swagger spec
├── middlewares/     # authenticate, authorize, validate (Zod), auditLog, rateLimiter, upload
├── modules/         # Feature-based modules
│   ├── auth/        # login, logout, refresh, /me
│   ├── users/       # CRUD (admin)
│   ├── ipcs/        # IPC / buying-centre management
│   ├── warehouses/  # Warehouse ops, GRN, stock transfer
│   ├── farmers/     # Farmer registration & tracking
│   ├── purchases/   # Commodity purchase recording + loan recovery
│   ├── seed-loans/  # Seed loan issuance & payments
│   ├── inventory/   # Stock levels, low-stock alerts, movements
│   ├── sync/        # Mobile offline-first push/pull sync
│   ├── audit/       # System audit logs
│   ├── traceability/# End-to-end grain traceability
│   ├── reports/     # Analytics reports
│   └── health/      # Health check
├── types/           # Shared TypeScript types
├── utils/           # logger, response helpers, idGenerator, token
└── app.ts           # Express app setup
server.ts            # Entry point (connects DB, starts server)
```

## Running the Server

```bash
# Development (hot-reload)
npm run dev

# Production build
npm run build && npm start
```

## Required Environment Variables

Set these as Replit Secrets or in `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string — `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | Access token secret (≥16 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (≥16 chars, different from JWT_SECRET) |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment |
| `JWT_ACCESS_EXPIRES_IN` | 15m | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token lifetime |
| `ALLOWED_ORIGINS` | http://localhost:3000 | Comma-separated CORS origins |
| `MAX_FILE_SIZE` | 10485760 | Upload limit in bytes |
| `EMAIL_USER` / `EMAIL_PASSWORD` | — | Nodemailer credentials (optional) |

## Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (fresh database)
npm run prisma:migrate

# Browse data
npm run prisma:studio
```

## API Base URL

All endpoints are prefixed with `/api/v1/`.

## Authentication

- **Dashboard (Next.js):** JWT stored in HTTP-only cookies — set automatically on login.
- **Mobile (Flutter):** Send `Authorization: Bearer <access_token>` header.
- Refresh tokens automatically rotate on `/api/v1/auth/refresh`.
- Access token expiry: 15 min; Refresh token expiry: 7 days.

## RBAC Roles

`admin` · `headoffice_manager` · `ipc_manager` · `warehouse_officer` · `marketing_officer` · `extension_officer` · `registration_officer`

## Mobile Sync API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sync/push` | POST | Upload offline-created farmers & purchases (idempotent via UUID) |
| `/api/v1/sync/pull` | GET | Download master data + records updated since `?last_sync_timestamp=<unix>` |
| `/api/v1/sync/status` | GET | Dashboard sync metrics |
| `/api/v1/sync/history` | GET | Paginated sync logs |

Sync uses **last-write-wins** conflict resolution and database transactions for purchase + loan deductions.

## User Preferences

- Keep TypeScript strict mode enabled.
- Use Prisma ORM — no raw SQL unless unavoidable.
- All API responses follow `{ success, message, data }` envelope.
- New modules go in `src/modules/<feature>/` with schema, service, controller, routes files.
