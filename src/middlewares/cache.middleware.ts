import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../config/cache';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean; // Cache condition
  skipCache?: (req: Request) => boolean; // Skip cache condition
}

interface CachedResponse {
  statusCode: number;
  data: any;
  headers: Record<string, any>;
  timestamp: string;
}

/**
 * Cache middleware for GET requests
 * Usage: app.get('/api/animals', cacheMiddleware({ ttl: 300 }), getAnimalsHandler);
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}:${req.user?.tenantId || 'anonymous'}`,
    condition = (req) => req.method === 'GET', // Only cache GET requests by default
    skipCache = (req) => false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching based on conditions
    if (!condition(req) || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedResponse = await cacheService.get<CachedResponse>(cacheKey);
      
      if (cachedResponse && typeof cachedResponse === 'object') {
        // Return cached response
        res.set(cachedResponse.headers);
        return res.status(cachedResponse.statusCode).json(cachedResponse.data);
      }

      // Intercept response to cache it
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

      // Cache the response after it's sent
      res.on('finish', async () => {
        // Only cache successful responses
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
      next(); // Continue without caching if there's an error
    }
  };
};

/**
 * Tenant-specific cache invalidation middleware
 */
export const invalidateTenantCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.user?.tenantId;
    
    if (tenantId) {
      // Invalidate cache patterns after the request completes
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

/**
 * Cache warming middleware for frequently accessed data
 */
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

/**
 * Cache statistics middleware
 */
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