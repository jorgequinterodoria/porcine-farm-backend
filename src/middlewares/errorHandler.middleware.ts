import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any = undefined;

  // Operational errors (custom AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    
    switch (err.code) {
      case 'P2002':
        message = 'Duplicate field value';
        errors = {
          field: err.meta?.target,
          message: `A record with this ${err.meta?.target} already exists`
        };
        break;
      
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      
      case 'P2003':
        message = 'Foreign key constraint failed';
        errors = {
          field: err.meta?.field_name,
          message: 'Referenced record does not exist'
        };
        break;
      
      case 'P2014':
        message = 'Invalid ID';
        break;
      
      default:
        message = 'Database error';
        errors = { code: err.code, meta: err.meta };
    }
  }
  
  // Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Validation error';
    errors = { details: err.message };
  }
  
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Validation errors (from zod or other validators)
  else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    errors = (err as any).errors;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};