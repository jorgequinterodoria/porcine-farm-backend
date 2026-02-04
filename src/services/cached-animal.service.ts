import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../config/cache';




export class CachedAnimalService {
  private animalService: any; 

  constructor(animalService: any) {
    this.animalService = animalService;
  }

  async findAll(tenantId: string, filters: any = {}) {
    const cacheKey = `animals:${tenantId}:${JSON.stringify(filters)}`;
    
    return await cacheService.cacheTenantQuery(
      tenantId,
      `animals:${JSON.stringify(filters)}`,
      () => this.animalService.findAll(tenantId, filters),
      300 
    );
  }

  async findOne(tenantId: string, id: string) {
    const cacheKey = `animal:${tenantId}:${id}`;
    
    return await cacheService.cacheTenantQuery(
      tenantId,
      `animal:${id}`,
      () => this.animalService.findOne(tenantId, id),
      600 
    );
  }

  async create(tenantId: string, data: any) {
    const result = await this.animalService.create(tenantId, data);
    
    
    await cacheService.invalidateAllTenantCache(tenantId);
    
    return result;
  }

  async update(tenantId: string, id: string, data: any) {
    const result = await this.animalService.update(tenantId, id, data);
    
    
    await cacheService.invalidateTenantCache(tenantId, `animal:${id}`);
    await cacheService.invalidatePattern(`tenant:${tenantId}:animals:*`);
    
    return result;
  }

  async delete(tenantId: string, id: string) {
    const result = await this.animalService.delete(tenantId, id);
    
    
    await cacheService.invalidateAllTenantCache(tenantId);
    
    return result;
  }
}




export const CacheUtils = {
  


  tenantKey: (tenantId: string, resource: string, identifier?: string) => {
    return identifier 
      ? `tenant:${tenantId}:${resource}:${identifier}`
      : `tenant:${tenantId}:${resource}`;
  },

  


  invalidateResource: async (tenantId: string, resource: string) => {
    const pattern = `tenant:${tenantId}:${resource}:*`;
    await cacheService.invalidatePattern(pattern);
  },

  


  warmupTenantData: async (tenantId: string) => {
    const warmupFunctions = [
      {
        key: `tenant:${tenantId}:animals:basic`,
        fn: async () => {
          
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