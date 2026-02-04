import { Request, Response, NextFunction } from 'express';
import { loggers, LogUtils } from '../config/logger';


export const advancedRateLimitingMiddleware = (options: {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
}) => {
  const {
    windowMs = 15 * 60 * 1000, 
    max = 100,
    keyGenerator = (req: Request) => LogUtils.generateCorrelationId(),
  } = options;

  const getClientIdentifier = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    return forwarded ? `${forwarded}:${req.ip}:${userAgent}` : `${req.ip}:${userAgent}`;
  };

  return (req: Request, res: Response, next: NextFunction) => {
    
    if ((req.user as any)?.role === 'super_admin') {
      return next();
    }

    
    if (req.path.startsWith('/health')) {
      return next();
    }

    
    const clientId = getClientIdentifier(req);
    const rateLimitKey = `rate-limit:${clientId}`;
    
    
    const rateLimitStore = new Map<string, { count: number; resetTime: number; violations: number }>();
    
    const now = Date.now();
    const limit = max;
    const windowMsDuration = windowMs;
    
    
    const current = rateLimitStore.get(clientId) || { count: 0, resetTime: now, violations: 0 };
    const timeSinceReset = now - current.resetTime;
    
    
    if (timeSinceReset > windowMsDuration) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now, violations: 0 });
    } else {
      current.count++;
    }
    
    
    if (current.count > limit) {
      current.violations++;
      
      
      loggers.security.logSecurity('RATE_LIMIT_EXCEEDED', {
        clientId,
        currentCount: current.count,
        limit,
        violations: current.violations,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      
      
      const delay = Math.min(1000 * Math.pow(2, current.violations - 1), 10000); 
      
      
      if (current.violations > 10) {
        loggers.security.logSecurity('RATE_LIMIT_BLOCKED', {
          clientId,
          violations: current.violations,
          reason: 'Too many violations - blocking',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000),
          violations: current.violations,
        });
        return;
      }
      
      
      if (current.violations > 5) {
        loggers.security.logSecurity('RATE_LIMIT_DELAYED', {
          clientId,
          delay,
          violations: current.violations,
          reason: 'Rate limiting - adding delay',
        });
        
        setTimeout(() => next(), delay);
        return;
      }
      
      
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current.count));
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
        violations: current.violations,
      });
      return;
    }
    
    
    rateLimitStore.set(clientId, current);
    
    next();
  };
};


export const apiGatewayMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    const logger = loggers.request.withContext(LogUtils.extractUserInfo(req));
    
    logger.info(`API Gateway: ${req.method} ${req.path}`, {
      headers: req.headers,
      body: req.body,
      query: req.query,
      ip: req.ip,
    });
    
    
    res.setHeader('API-Version', 'v1.0');
    
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    
    const correlationId = LogUtils.generateCorrelationId();
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  };
};


export const securityHeadersMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' 'data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'self'",
      "media-src 'self'",
      "frame-ancestors 'self'",
    ];
    
    res.setHeader('Content-Security-Policy', csp.join('; '));
    
    
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'interest-rate=10');
    
    next();
  };
};


export const tracingMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId = LogUtils.generateCorrelationId();
    const startTime = Date.now();
    
    
    res.setHeader('X-Request-ID', correlationId);
    res.setHeader('X-Request-Start-Time', startTime.toISOString());
    
    
    loggers.app.info(`Request started: ${req.method} ${req.path}`, {
      requestId: correlationId,
      startTime,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logger = loggers.app.withContext({
        requestId: correlationId,
        duration,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      });
      
      
      if (res.statusCode < 400) {
        logger.info(`Request completed successfully`, {
          duration,
          statusCode: res.statusCode,
          requestId: correlationId,
        });
      } else {
        logger.warn(`Request completed with error`, {
          duration,
          statusCode: res.statusCode,
          requestId: correlationId,
        });
      }
    });
    
    
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const logger = loggers.app.withContext({
        requestId: correlationId,
        duration,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseSize: JSON.stringify(data).length,
      });
      
      
      if (res.statusCode < 400) {
        logger.info(`Response sent`, {
          duration,
          requestId: correlationId,
          responseSize: JSON.stringify(data).length,
        });
      }
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const duration = Date.now() - startTime;
      const logger = loggers.app.withContext({
        requestId: correlationId,
        duration,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseSize: JSON.stringify(data).length,
      });
      
      
      if (res.statusCode < 400) {
        logger.info(`Response sent`, {
          duration,
          requestId: correlationId,
          responseSize: JSON.stringify(data).length,
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};