import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class CacheService {
  private redis: Redis;
  private memoryCache: Map<string, CacheEntry<any>>;
  private static instance: CacheService;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Memory cache fallback
    this.memoryCache = new Map();

    // Redis event handlers
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    this.redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Generic cache methods
  // Memory cache fallback methods
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  private setInMemory(key: string, value: any, ttlSeconds: number): void {
    const entry: CacheEntry<any> = {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    };
    this.memoryCache.set(key, entry);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache get error, using fallback:', error);
      return this.getFromMemory<T>(key);
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.warn('Cache set error, using fallback:', error);
      this.setInMemory(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Cache delete error, using fallback:', error);
      this.memoryCache.delete(key);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache invalidate pattern error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Cache exists error:', error);
      const value = this.getFromMemory(key);
      return value !== null;
    }
  }

  // Tenant-specific cache methods
  async getTenantCache<T>(tenantId: string, key: string): Promise<T | null> {
    const fullKey = `tenant:${tenantId}:${key}`;
    return this.get<T>(fullKey);
  }

  async setTenantCache(tenantId: string, key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const fullKey = `tenant:${tenantId}:${key}`;
    await this.set(fullKey, value, ttlSeconds);
  }

  async invalidateTenantCache(tenantId: string, key: string): Promise<void> {
    const fullKey = `tenant:${tenantId}:${key}`;
    await this.del(fullKey);
  }

  async invalidateAllTenantCache(tenantId: string): Promise<void> {
    const pattern = `tenant:${tenantId}:*`;
    await this.invalidatePattern(pattern);
  }

  // Session management
  async setSession(sessionId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, sessionData, ttlSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return this.get<T>(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Query result caching
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    const result = await queryFn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  async cacheTenantQuery<T>(
    tenantId: string,
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const fullKey = `tenant:${tenantId}:query:${key}`;
    return this.cacheQuery(fullKey, queryFn, ttlSeconds);
  }

  // Cache warming and bulk operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => 
        value ? JSON.parse(value) : null
      );
    } catch (error) {
      console.warn('Cache mget error:', error);
      return Promise.all(keys.map(key => this.get<T>(key)));
    }
  }

  async mset(entries: Array<{key: string, value: any, ttl?: number}>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      entries.forEach(({ key, value, ttl }) => {
        const stringValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, stringValue);
        } else {
          pipeline.set(key, stringValue);
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.warn('Cache mset error:', error);
      await Promise.all(
        entries.map(({ key, value, ttl }) => 
          this.set(key, value, ttl)
        )
      );
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', redis: boolean, fallback: boolean }> {
    try {
      await this.redis.ping();
      return { status: 'healthy', redis: true, fallback: true };
    } catch (error) {
      return { status: 'unhealthy', redis: false, fallback: true };
    }
  }

  // Statistics
  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      return {
        connected: this.redis.status === 'ready',
        memory: info.split('\r\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1] || 'unknown',
        keys: keyCount,
      };
    } catch (error) {
      return {
        connected: false,
        memory: 'unknown',
        keys: 0,
      };
    }
  }

  // Cleanup and disconnect
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('✅ Redis disconnected gracefully');
    } catch (error) {
      console.warn('❌ Redis disconnect error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();