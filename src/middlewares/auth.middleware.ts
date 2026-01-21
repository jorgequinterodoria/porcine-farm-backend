import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, asyncHandler } from './errorHandler.middleware';
import { prisma } from '../config/database';

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
}

// Extender Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as JwtPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    // 3. Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        deletedAt: true
      }
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError('User not found or inactive', 401);
    }

    // 4. Adjuntar usuario al request
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Actualizar last_login (opcional, puede afectar performance)
    // prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLogin: new Date() }
    // }).catch(console.error); // Fire and forget

    next();
  }
);

// Middleware para verificar roles específicos
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action',
        403
      );
    }

    next();
  };
};

// Middleware para verificar si es super admin
export const isSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'super_admin') {
    throw new AppError('Super admin access required', 403);
  }

  next();
};

// Middleware para verificar si es admin de la granja o superior
export const isFarmAdminOrAbove = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const adminRoles = ['super_admin', 'farm_admin'];
  
  if (!adminRoles.includes(req.user.role)) {
    throw new AppError('Admin access required', 403);
  }

  next();
};