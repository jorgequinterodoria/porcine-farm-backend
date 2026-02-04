import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';


const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    const identifier = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();

    const requestData = requestCounts.get(identifier);

    
    if (!requestData || now > requestData.resetTime) {
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    
    requestData.count++;

    
    if (requestData.count > maxRequests) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
      
      res.set('Retry-After', String(retryAfter));
      
      throw new AppError(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
        429
      );
    }

    
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - requestData.count));
    res.set('X-RateLimit-Reset', String(requestData.resetTime));

    next();
  };
};


setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 1000); 