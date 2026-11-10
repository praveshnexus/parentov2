
import winston from 'winston';
import { isDev } from '../config/env';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

if (isDev) {
  logger.transports
    .filter((transport) => transport instanceof winston.transports.Console)
    .forEach((transport) => {
      transport.format = combine(colorize(), simple());
    });
}
