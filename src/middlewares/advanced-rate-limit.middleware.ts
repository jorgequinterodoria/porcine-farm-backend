import rateLimit from 'express-rate-limit';
import RateLimitRedisStore from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../config/cache';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface TenantRateLimitOptions extends RateLimitOptions {
  planBasedLimits?: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
}

interface UserRateLimitOptions extends RateLimitOptions {
  roleBasedLimits?: {
    super_admin: number;
    farm_admin: number;
    operator: number;
  };
}

/**
 * Create Redis store for rate limiting
 */
const createRedisStore = () => {
  try {
    return new RateLimitRedisStore({
      sendCommand: (...args: string[]) => (cacheService as any).redis.call(...args),
      prefix: 'rl:',
    });
  } catch (error) {
    console.warn('Redis not available for rate limiting, using memory store:', error);
    return undefined;
  }
};

/**
 * Default rate limiting configuration
 */
export const createRateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = {
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: windowMs / 1000,
    },
    skipSuccessfulRequests = false,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    skip = () => false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    keyGenerator,
    skip,
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      trustProxy: process.env.TRUST_PROXY === 'true',
    },
  });
};

/**
 * Tenant-based rate limiting with plan-specific limits
 */
export const createTenantRateLimit = (options: TenantRateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    planBasedLimits = {
      free: 50,
      basic: 200,
      premium: 1000,
      enterprise: 5000,
    },
    ...options,
  } = options;

  return rateLimit({
    windowMs,
    max: async (req: Request) => {
      const user = req.user as any;
      const tenant = user?.tenant;
      
      if (!tenant || !planBasedLimits) {
        return 200; // Default fallback
      }

      // Return limit based on tenant plan
      return planBasedLimits[tenant.plan] || planBasedLimits.basic;
    },
    message: {
      success: false,
      error: 'Rate limit exceeded for your plan. Consider upgrading for higher limits.',
      retryAfter: windowMs / 1000,
    },
    keyGenerator: (req: Request) => {
      const user = req.user as any;
      return `tenant:${user?.tenantId || 'anonymous'}:${req.ip}`;
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks and static assets
      const path = req.path;
      return path.startsWith('/health') || path.startsWith('/static') || path.startsWith('/api-docs');
    },
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * User-based rate limiting with role-specific limits
 */
export const createUserRateLimit = (options: UserRateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    roleBasedLimits = {
      super_admin: 1000,
      farm_admin: 500,
      operator: 200,
    },
    ...options,
  } = options;

  return rateLimit({
    windowMs,
    max: async (req: Request) => {
      const user = req.user as any;
      
      if (!user || !roleBasedLimits) {
        return 100; // Default fallback
      }

      // Return limit based on user role
      return roleBasedLimits[user.role] || roleBasedLimits.operator;
    },
    message: {
      success: false,
      error: 'Rate limit exceeded for your user role.',
      retryAfter: windowMs / 1000,
    },
    keyGenerator: (req: Request) => {
      const user = req.user as any;
      return `user:${user?.id || 'anonymous'}:${req.ip}`;
    },
    skip: (req: Request) => {
      // Skip rate limiting for authenticated admins
      const user = req.user as any;
      return user?.role === 'super_admin';
    },
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * API endpoint specific rate limiting
 */
export const createEndpointRateLimit = (endpoint: string, options: RateLimitOptions = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 20, // 20 requests per minute
    message = `Rate limit exceeded for ${endpoint}. Please try again later.`,
    ...options,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: windowMs / 1000,
    },
    keyGenerator: (req: Request) => `endpoint:${endpoint}:${req.user?.id || 'anonymous'}:${req.ip}`,
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Auth-specific rate limiting (stricter for sensitive operations)
 */
export const createAuthRateLimit = (options: RateLimitOptions = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: 15 * 60,
    },
    skipSuccessfulRequests: true, // Don't count successful auth attempts
    keyGenerator: (req: Request) => `auth:${req.ip}`,
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

/**
 * Data modification rate limiting (create, update, delete operations)
 */
export const createMutationRateLimit = (options: RateLimitOptions = {}) => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 mutations per minute
    message: {
      success: false,
      error: 'Too many data modifications. Please wait before making more changes.',
      retryAfter: 60,
    },
    keyGenerator: (req: Request) => {
      const user = req.user as any;
      return `mutation:${user?.tenantId}:${user?.id}:${req.ip}`;
    },
    skip: (req: Request) => {
      // Skip for GET requests
      return req.method === 'GET';
    },
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

/**
 * File upload rate limiting
 */
export const createUploadRateLimit = (options: RateLimitOptions = {}) => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: {
      success: false,
      error: 'Too many file uploads. Please wait before uploading more files.',
      retryAfter: 3600,
    },
    keyGenerator: (req: Request) => {
      const user = req.user as any;
      return `upload:${user?.tenantId}:${user?.id}:${req.ip}`;
    },
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

/**
 * Progressively restrictive rate limiting (adaptive)
 */
export const createAdaptiveRateLimit = (options: RateLimitOptions = {}) => {
  const baseOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: 'Rate limit exceeded.',
      retryAfter: 15 * 60,
    },
    ...options,
  };

  return rateLimit({
    ...baseOptions,
    max: async (req: Request) => {
      const key = `adaptive:${req.ip}`;
      
      try {
        // Get current request count
        const currentCount = await cacheService.get<number>(key) || 0;
        
        // Adaptively adjust limit based on current usage
        if (currentCount < 10) {
          return baseOptions.max; // Full limit available
        } else if (currentCount < 25) {
          return Math.floor(baseOptions.max * 0.8); // 80% of limit
        } else if (currentCount < 50) {
          return Math.floor(baseOptions.max * 0.6); // 60% of limit
        } else {
          return Math.floor(baseOptions.max * 0.4); // 40% of limit
        }
      } catch (error) {
        console.error('Error in adaptive rate limiting:', error);
        return baseOptions.max;
      }
    },
    onLimitReached: (req: Request, res: Response) => {
      // Log rate limit violations
      console.warn(`Rate limit reached for IP: ${req.ip}, Path: ${req.path}, User: ${(req.user as any)?.id}`);
      
      // Optionally implement IP blocking after multiple violations
      const violationKey = `violations:${req.ip}`;
      cacheService.incrementCounter(violationKey, 1, 3600); // Count violations for 1 hour
    },
    store: createRedisStore(),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Rate limiting middleware factory for different scenarios
 */
export const RateLimitMiddleware = {
  /**
   * General API rate limiting
   */
  general: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  }),

  /**
   * Authentication endpoint rate limiting
   */
  auth: createAuthRateLimit(),

  /**
   * Data modification rate limiting
   */
  mutation: createMutationRateLimit(),

  /**
   * File upload rate limiting
   */
  upload: createUploadRateLimit(),

  /**
   * Tenant-aware rate limiting
   */
  tenant: createTenantRateLimit({
    windowMs: 60 * 1000, // 1 minute
    planBasedLimits: {
      free: 50,
      basic: 200,
      premium: 1000,
      enterprise: 5000,
    },
  }),

  /**
   * User-aware rate limiting
   */
  user: createUserRateLimit({
    windowMs: 60 * 1000, // 1 minute
    roleBasedLimits: {
      super_admin: 1000,
      farm_admin: 500,
      operator: 200,
    },
  }),

  /**
   * API endpoint specific
   */
  endpoint: (endpoint: string, options: RateLimitOptions = {}) => 
    createEndpointRateLimit(endpoint, options),

  /**
   * Adaptive rate limiting
   */
  adaptive: createAdaptiveRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  }),
};

/**
 * Rate limiting utilities
 */
export const RateLimitUtils = {
  /**
   * Check if a request would be rate limited
   */
  checkRateLimit: async (key: string, limit: number, windowMs: number): Promise<boolean> => {
    const current = await cacheService.get<number>(key) || 0;
    return current >= limit;
  },

  /**
   * Get remaining requests for a rate limit
   */
  getRemainingRequests: async (key: string, limit: number): Promise<number> => {
    const current = await cacheService.get<number>(key) || 0;
    return Math.max(0, limit - current);
  },

  /**
   * Increment rate limit counter
   */
  incrementCounter: async (key: string, increment: number = 1, ttl?: number): Promise<void> => {
    const current = await cacheService.get<number>(key) || 0;
    await cacheService.set(key, current + increment, ttl || 3600);
  },

  /**
   * Reset rate limit counter
   */
  resetCounter: async (key: string): Promise<void> => {
    await cacheService.del(key);
  },

  /**
   * Get rate limit statistics
   */
  getStats: async (): Promise<{
    totalRequests: number;
    blockedRequests: number;
    topIps: Array<{ ip: string; count: number }>;
  }> => {
    // This would require more comprehensive logging
    // Implementation depends on your monitoring setup
    return {
      totalRequests: 0,
      blockedRequests: 0,
      topIps: [],
    };
  },
};

// Extend cache service with rate limiting utilities
declare module '../config/cache' {
  interface CacheService {
    incrementCounter(key: string, increment?: number, ttl?: number): Promise<void>;
  }
}