import { env } from './src/config/env';
import { connectDatabase, disconnectDatabase } from './src/config/database';
import { logger } from './src/utils/logger';
import app from './src/app';

const PORT = env.PORT;

async function startServer() {
  try {
    await connectDatabase();
    logger.info('✅  Database connected');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀  GTMS API running on port ${PORT}`);
      logger.info(`📑  Swagger docs: http://localhost:${PORT}/api-docs`);
      logger.info(`🌍  Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();
