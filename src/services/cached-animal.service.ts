import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../config/cache';

/**
 * Enhanced animal service with caching
 */
export class CachedAnimalService {
  private animalService: any; // Import your existing animal service

  constructor(animalService: any) {
    this.animalService = animalService;
  }

  async findAll(tenantId: string, filters: any = {}) {
    const cacheKey = `animals:${tenantId}:${JSON.stringify(filters)}`;
    
    return await cacheService.cacheTenantQuery(
      tenantId,
      `animals:${JSON.stringify(filters)}`,
      () => this.animalService.findAll(tenantId, filters),
      300 // 5 minutes
    );
  }

  async findOne(tenantId: string, id: string) {
    const cacheKey = `animal:${tenantId}:${id}`;
    
    return await cacheService.cacheTenantQuery(
      tenantId,
      `animal:${id}`,
      () => this.animalService.findOne(tenantId, id),
      600 // 10 minutes
    );
  }

  async create(tenantId: string, data: any) {
    const result = await this.animalService.create(tenantId, data);
    
    // Invalidate related caches
    await cacheService.invalidateAllTenantCache(tenantId);
    
    return result;
  }

  async update(tenantId: string, id: string, data: any) {
    const result = await this.animalService.update(tenantId, id, data);
    
    // Invalidate specific and list caches
    await cacheService.invalidateTenantCache(tenantId, `animal:${id}`);
    await cacheService.invalidatePattern(`tenant:${tenantId}:animals:*`);
    
    return result;
  }

  async delete(tenantId: string, id: string) {
    const result = await this.animalService.delete(tenantId, id);
    
    // Invalidate all animal-related caches for tenant
    await cacheService.invalidateAllTenantCache(tenantId);
    
    return result;
  }
}

/**
 * Cache utilities for common patterns
 */
export const CacheUtils = {
  /**
   * Generate cache key for tenant resources
   */
  tenantKey: (tenantId: string, resource: string, identifier?: string) => {
    return identifier 
      ? `tenant:${tenantId}:${resource}:${identifier}`
      : `tenant:${tenantId}:${resource}`;
  },

  /**
   * Invalidate all caches for a specific resource type
   */
  invalidateResource: async (tenantId: string, resource: string) => {
    const pattern = `tenant:${tenantId}:${resource}:*`;
    await cacheService.invalidatePattern(pattern);
  },

  /**
   * Warm up frequently accessed data
   */
  warmupTenantData: async (tenantId: string) => {
    const warmupFunctions = [
      {
        key: `tenant:${tenantId}:animals:basic`,
        fn: async () => {
          // Import and call animal service
          const { animalService } = await import('../services/animal.service');
          return animalService.findAll(tenantId, { limit: 50 });
        },
        ttl: 300
      },
      {
        key: `tenant:${tenantId}:facilities:basic`,
        fn: async () => {
          const { facilityService } = await import('../services/facility.service');
          return facilityService.findAll(tenantId);
        },
        ttl: 600
      }
    ];

    for (const { key, fn, ttl } of warmupFunctions) {
      try {
        const exists = await cacheService.exists(key);
        if (!exists) {
          const data = await fn();
          await cacheService.set(key, data, ttl);
          console.log(`✅ Warmed up cache for tenant ${tenantId}: ${key}`);
        }
      } catch (error) {
        console.error(`❌ Failed to warm up cache ${key}:`, error);
      }
    }
  }
};