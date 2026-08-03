import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// AI-specific rate limiter: 30 requests per hour per user
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'unknown',
  message: { success: false, message: 'AI usage limit reached. Try again in an hour.', code: 'AI_RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Only PARENT role can use AI (doctors have their own tools)
router.post('/chat/:childId', authenticate, authorize('PARENT'), aiLimiter, AiController.chat);
router.get('/summary/:childId', authenticate, authorize('PARENT'), AiController.summary);

export default router;
