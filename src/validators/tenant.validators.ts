import { z } from 'zod';

export const createTenantSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(255),
        subdomain: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers and hyphens'),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        country: z.string().optional(),
        stateProvince: z.string().optional(),
        city: z.string().optional(),
        subscriptionPlan: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
        maxAnimals: z.number().int().positive().optional(),
        maxUsers: z.number().int().positive().optional(),
        // Admin fields
        adminFirstName: z.string().min(2),
        adminLastName: z.string().min(2),
        adminEmail: z.string().email(),
        adminPassword: z.string().min(8).optional(),
    })
});

export const updateTenantSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(255).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        country: z.string().optional(),
        stateProvince: z.string().optional(),
        city: z.string().optional(),
        subscriptionPlan: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
        subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
        maxAnimals: z.number().int().positive().optional(),
        maxUsers: z.number().int().positive().optional(),
        isActive: z.boolean().optional(),
    })
});
