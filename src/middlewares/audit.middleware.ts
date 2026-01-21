import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const auditLog = (action: string, entityType?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para capturar la respuesta
    res.json = function (data: any) {
      // Solo registrar si la operación fue exitosa
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = 
          data?.data?.id || 
          req.params.id || 
          req.body.id || 
          null;

        // Fire and forget - no bloquear la respuesta
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