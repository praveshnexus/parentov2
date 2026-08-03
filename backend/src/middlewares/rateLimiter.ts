import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../utils/errors';

const createLimiter = (max: number, windowMs: number, message: string) =>
  rateLimit({
    max,
    windowMs,
    message: { success: false, message, code: 'TOO_MANY_REQUESTS' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyRequestsError(message)),
  });

export const globalLimiter = createLimiter(200, 15 * 60 * 1000, 'Too many requests');
export const authLimiter = createLimiter(10, 15 * 60 * 1000, 'Too many auth attempts. Try again in 15 minutes.');
export const uploadLimiter = createLimiter(20, 60 * 60 * 1000, 'Upload limit reached. Try again in 1 hour.');
export const searchLimiter = createLimiter(60, 60 * 1000, 'Search rate limit exceeded.');
