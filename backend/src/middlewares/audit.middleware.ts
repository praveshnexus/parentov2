import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export const auditLog = (action: string, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (res.statusCode < 400 && req.user) {
        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entity,
            entityId: req.params.id,
            newValue: body?.data ?? null,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        }).catch((err) => logger.error('Audit log error:', err));
      }
      return originalJson(body);
    };

    next();
  };
};
