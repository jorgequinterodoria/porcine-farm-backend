import { z } from 'zod';

export const createBatchSchema = z.object({
    body: z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        batchType: z.string().min(1).max(50),
        startDate: z.string().or(z.date()),
        expectedEndDate: z.string().or(z.date()).optional().nullable(),
        initialCount: z.number().int().nonnegative().optional().nullable(),
        targetWeight: z.number().positive().optional().nullable(),
        notes: z.string().optional().nullable(),
    })
});

export const updateBatchSchema = z.object({
    body: createBatchSchema.shape.body.partial().extend({
        actualEndDate: z.string().or(z.date()).optional().nullable(),
        currentCount: z.number().int().nonnegative().optional().nullable(),
        status: z.string().max(50).optional(),
    })
});

export const addBatchAnimalSchema = z.object({
    body: z.object({
        animalId: z.string().uuid(),
        joinDate: z.string().or(z.date()).default(() => new Date()),
    })
});

export const removeBatchAnimalSchema = z.object({
    body: z.object({
        animalId: z.string().uuid(),
        exitDate: z.string().or(z.date()).default(() => new Date()),
        exitReason: z.string().max(100).optional().nullable(),
    })
});
