import { z } from 'zod';

export const createAnimalSchema = z.object({
    body: z.object({
        internalCode: z.string().min(1).max(50),
        electronicId: z.string().max(100).optional().nullable(),
        visualId: z.string().max(50).optional().nullable(),
        breedId: z.string().uuid().optional().nullable(),
        sex: z.enum(['male', 'female']),
        birthDate: z.string().or(z.date()),
        birthWeight: z.number().positive().optional().nullable(),
        motherId: z.string().uuid().optional().nullable(),
        fatherId: z.string().uuid().optional().nullable(),
        geneticLine: z.string().max(100).optional().nullable(),
        currentStatus: z.string().max(50).default('active'),
        currentPenId: z.string().uuid().optional().nullable(),
        entryDate: z.string().or(z.date()).optional().nullable(),
        purpose: z.string().max(50).optional().nullable(),
        origin: z.string().max(255).optional().nullable(),
        acquisitionCost: z.number().nonnegative().optional().nullable(),
        notes: z.string().optional().nullable(),
        customFields: z.any().optional(),
    })
});

export const updateAnimalSchema = z.object({
    body: createAnimalSchema.shape.body.partial().extend({
        isActive: z.boolean().optional(),
    })
});

export const recordWeightSchema = z.object({
    body: z.object({
        weightKg: z.number().positive(),
        measurementDate: z.string().or(z.date()).default(() => new Date()),
        notes: z.string().optional().nullable(),
    })
});

export const recordMovementSchema = z.object({
    body: z.object({
        movementType: z.string().min(1).max(50),
        fromPenId: z.string().uuid().optional().nullable(),
        toPenId: z.string().uuid().optional().nullable(),
        movementDate: z.string().or(z.date()).default(() => new Date()),
        reason: z.string().max(255).optional().nullable(),
        notes: z.string().optional().nullable(),
    })
});
