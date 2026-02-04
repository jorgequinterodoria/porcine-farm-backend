import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../config/cache';

interface CacheOptions {
  ttl?: number; 
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean; 
  skipCache?: (req: Request) => boolean; 
}

interface CachedResponse {
  statusCode: number;
  data: any;
  headers: Record<string, any>;
  timestamp: string;
}





export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, 
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}:${req.user?.tenantId || 'anonymous'}`,
    condition = (req) => req.method === 'GET', 
    skipCache = (req) => false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    
    if (!condition(req) || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      
      const cachedResponse = await cacheService.get<CachedResponse>(cacheKey);
      
      if (cachedResponse && typeof cachedResponse === 'object') {
        
        res.set(cachedResponse.headers);
        return res.status(cachedResponse.statusCode).json(cachedResponse.data);
      }

      
      const originalJson = res.json;
      const originalStatus = res.status;
      let statusCode = 200;
      let responseData: any;

      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      
      res.on('finish', async () => {
        
        if (statusCode >= 200 && statusCode < 300 && responseData) {
          const cacheData: CachedResponse = {
            statusCode,
            data: responseData,
            headers: res.getHeaders() as Record<string, any>,
            timestamp: new Date().toISOString(),
          };
          
          await cacheService.set(cacheKey, cacheData, ttl);
        }
      });

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); 
    }
  };
};




export const invalidateTenantCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user?.tenantId;
    
    if (tenantId) {
      
      res.on('finish', async () => {
        for (const pattern of patterns) {
          const fullPattern = pattern.replace(':tenantId', tenantId);
          await cacheService.invalidatePattern(fullPattern);
        }
      });
    }
    
    next();
  };
};




export const warmupCache = async (
  warmupFunctions: Array<{
    key: string;
    fn: () => Promise<any>;
    ttl?: number;
  }>
) => {
  for (const { key, fn, ttl = 300 } of warmupFunctions) {
    try {
      const exists = await cacheService.exists(key);
      if (!exists) {
        const data = await fn();
        await cacheService.set(key, data, ttl);
        console.log(`✅ Warmed up cache: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Failed to warm up cache ${key}:`, error);
    }
  }
};




export const cacheStats = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health/cache') {
    return cacheService.getStats()
      .then(stats => res.json(stats))
      .catch(error => {
        console.error('Cache stats error:', error);
        res.status(500).json({ error: 'Failed to get cache stats' });
      });
  }
  next();
};