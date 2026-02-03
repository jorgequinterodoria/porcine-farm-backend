import { Request, Response, NextFunction } from 'express';
import { loggers, LogUtils } from '../config/logger';

// Logging middleware factory
export const createLoggingMiddleware = (module: string = 'http-request') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add request start time
    const startTime = Date.now();
    const correlationId = LogUtils.generateCorrelationId();
    
    // Extract user info for context
    const userContext = LogUtils.extractUserInfo(req);
    
    // Create logger with request context
    const logger = loggers.request.withContext({
      requestId: correlationId,
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      ...userContext,
    });
    
    // Log request start
    logger.info(`Request started: ${req.method} ${req.path}`, {
      headers: req.headers,
      body: req.body,
    });
    
    // Intercept response to capture timing
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseSent = false;
    
    res.send = function(data) {
      if (responseSent) return;
      responseSent = true;
      
      const responseTime = LogUtils.calculateResponseTime(startTime);
      
      logger.info(`Request completed: ${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        responseTime,
        responseSize: JSON.stringify(data).length,
      });
      
      originalSend.call(this, data);
    };
    
    res.json = function(data) {
      if (responseSent) return;
      responseSent = true;
      
      const responseTime = LogUtils.calculateResponseTime(startTime);
      
      logger.info(`Request completed: ${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        responseTime,
        responseSize: JSON.stringify(data).length,
      });
      
      originalJson.call(this, data);
    };
    
    // Handle response finish
    res.on('finish', () => {
      if (!responseSent) {
        const responseTime = LogUtils.calculateResponseTime(startTime);
        
        logger.info(`Request finished: ${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          responseTime,
        });
      }
    });
    
    next();
  };
};

// Performance monitoring middleware
export const performanceMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const logger = loggers.performance.withContext(LogUtils.extractUserInfo(req));
    
    // Intercept response to measure performance
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      const responseTime = LogUtils.calculateResponseTime(startTime);
      
      // Log slow responses
      LogUtils.logSlowApi(req.path, req.method, res.statusCode, responseTime);
      
      originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const responseTime = LogUtils.calculateResponseTime(startTime);
      
      // Log slow responses
      LogUtils.logSlowApi(req.path, req.method, res.statusCode, responseTime);
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Error logging middleware
export const errorLoggingMiddleware = () => {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    const logger = loggers.app.withContext(LogUtils.extractUserInfo(req));
    
    logger.error('Unhandled error in middleware', error, {
      url: req.url,
      method: req.method,
      headers: req.headers,
    });
    
    next(error);
  };
};

// Rate limiting logging middleware
export const rateLimitLoggingMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Listen for rate limit headers
    res.on('finish', () => {
      const rateLimitHeaders = {
        'X-RateLimit-Limit': res.getHeader('X-RateLimit-Limit'),
        'X-RateLimit-Remaining': res.getHeader('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': res.getHeader('X-RateLimit-Reset'),
      };
      
      if (rateLimitHeaders['X-RateLimit-Limit']) {
        LogUtils.logRateLimit(req, 
          parseInt(rateLimitHeaders['X-RateLimit-Limit']), 
          parseInt(rateLimitHeaders['X-RateLimit-Reset'])
        );
      }
    });
    
    next();
  };
};

// Database operation logging utility
export const dbOperationLogger = (operation: string, table: string) => {
  return async (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const logger = loggers.database.withContext({ operation, table });
    
    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = LogUtils.calculateResponseTime(startTime);
        
        LogUtils.logDbOperation(operation, table, duration, true);
        return result;
        
      } catch (error) {
        const duration = LogUtils.calculateResponseTime(startTime);
        
        LogUtils.logDbOperation(operation, table, duration, false, error);
        throw error;
      }
    };
    
    Object.defineProperty(target, propertyKey, descriptor);
    return descriptor;
  };
};