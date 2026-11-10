
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

import { config } from './config/env';
import { redis } from './config/redis';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';
import { globalLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFound } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import messageRoutes from './routes/message.routes';
import apiRoutes from './routes/index';

const app = express();

app.set('trust proxy', 1);

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression
app.use(
  compression({
    filter: (req, res) => {
      const type = res.getHeader('Content-Type');

      if (
        typeof type === 'string' &&
        type.includes('text/event-stream')
      ) {
        return false;
      }

      return compression.filter(req, res);
    },
  }),
);

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (msg) => logger.http(msg.trim()),
      },
    }),
  );
}

// Rate limiting
app.use(globalLimiter);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      error: String(err),
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', apiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export { app };
