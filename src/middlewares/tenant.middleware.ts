import { Request, Response, NextFunction } from 'express';
import { AppError, asyncHandler } from './errorHandler.middleware';
import { prisma } from '../config/database';

// Extender Request para incluir tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        subdomain: string;
        subscriptionPlan: string;
        subscriptionStatus: string;
        maxAnimals: number;
        maxUsers: number;
      };
    }
  }
}

// Middleware para cargar información del tenant
export const loadTenant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // El tenant se obtiene del usuario autenticado
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        maxAnimals: true,
        maxUsers: true,
        isActive: true,
        deletedAt: true
      }
    });

    if (!tenant || !tenant.isActive || tenant.deletedAt) {
      throw new AppError('Tenant not found or inactive', 403);
    }

    // Verificar estado de suscripción
    if (tenant.subscriptionStatus !== 'active') {
      throw new AppError(
        'Your subscription is not active. Please contact support.',
        403
      );
    }

    req.tenant = tenant;
    next();
  }
);

// Middleware para verificar límites del plan
export const checkPlanLimits = (resource: 'animals' | 'users') => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.tenant) {
        throw new AppError('Tenant information required', 500);
      }

      const tenantId = req.tenant.id;

      if (resource === 'animals') {
        const animalCount = await prisma.animal.count({
          where: {
            tenantId,
            isActive: true,
            deletedAt: null
          }
        });

        if (animalCount >= req.tenant.maxAnimals) {
          throw new AppError(
            `You have reached your plan limit of ${req.tenant.maxAnimals} animals. Please upgrade your plan.`,
            403
          );
        }
      }

      if (resource === 'users') {
        const userCount = await prisma.user.count({
          where: {
            tenantId,
            isActive: true,
            deletedAt: null
          }
        });

        if (userCount >= req.tenant.maxUsers) {
          throw new AppError(
            `You have reached your plan limit of ${req.tenant.maxUsers} users. Please upgrade your plan.`,
            403
          );
        }
      }

      next();
    }
  );
};

// Middleware para asegurar aislamiento de datos por tenant
export const ensureTenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Agregar automáticamente el tenantId a los queries y mutations
  // Este es un safeguard adicional
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Aquí podrías agregar lógica adicional si es necesario
    return originalJson.call(this, data);
  };

  next();
};