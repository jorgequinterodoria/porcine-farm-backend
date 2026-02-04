import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const auditLog = (action: string, entityType?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    
    const originalJson = res.json.bind(res);

    
    res.json = function (data: any) {
      
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = 
          data?.data?.id || 
          req.params.id || 
          req.body.id || 
          null;

        
        prisma.auditLog.create({
          data: {
            tenantId: req.user.tenantId,
            userId: req.user.id,
            action,
            entityType: entityType || req.baseUrl.split('/').pop() || 'unknown',
            entityId,
            oldValues: req.method === 'PUT' || req.method === 'PATCH' 
              ? req.body._old || null 
              : null,
            newValues: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
              ? req.body
              : null,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || null
          }
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
};