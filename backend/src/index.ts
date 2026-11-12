
import 'dotenv/config';

import http from 'http';

import { app } from './app';
import { config } from './config/env';
import { redis } from './config/redis';
import { prisma } from './config/prisma';
import { initSocket } from './config/socket';
import { logger } from './utils/logger';
import { ensureDemoAccounts } from './services/demo-seed.service';

const httpServer = http.createServer(app);

// Socket.io
initSocket(httpServer);

// Startup
const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');

    // Automatically ensure demo accounts exist on deployment
    await ensureDemoAccounts();

    await redis.connect();

    httpServer.listen(config.PORT, () => {
      logger.info(
        `🚀 Server running on port ${config.PORT} [${config.NODE_ENV}]`,
      );
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully');

  httpServer.close();

  try {
    await prisma.$disconnect();
    await redis.quit();
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server only outside tests
if (config.NODE_ENV !== 'test') {
  void start();
}

export { app, httpServer };
