import { z } from 'zod';

export const createFacilitySchema = z.object({
    body: z.object({
        code: z.string().min(1, 'Code is required').max(50),
        name: z.string().min(1, 'Name is required').max(255),
        facilityType: z.string().min(1, 'Facility type is required'),
        parentFacilityId: z.string().uuid().optional(),
        capacity: z.number().int().positive().optional(),
        areaSqm: z.number().positive().optional(),
        description: z.string().optional(),
        locationDescription: z.string().optional(),
        coordinates: z.string().optional(),
    })
});

export const updateFacilitySchema = z.object({
    body: createFacilitySchema.shape.body.partial().extend({
        isActive: z.boolean().optional(),
    })
});

export const createPenSchema = z.object({
    body: z.object({
        facilityId: z.string().uuid('Invalid facility ID'),
        code: z.string().min(1, 'Code is required').max(50),
        name: z.string().min(1, 'Name is required').max(100),
        capacity: z.number().int().positive('Capacity must be positive'),
        areaSqm: z.number().positive().optional(),
        hasFeeder: z.boolean().optional(),
        hasWaterer: z.boolean().optional(),
        hasClimateControl: z.boolean().optional(),
        notes: z.string().optional(),
    })
});

export const updatePenSchema = z.object({
    body: createPenSchema.shape.body.partial().extend({
        isActive: z.boolean().optional(),
    })
});
