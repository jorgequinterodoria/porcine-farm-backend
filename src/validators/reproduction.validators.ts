import { z } from 'zod';

const dateSchema = z.string().transform(v => new Date(v));

export const createBreedingSchema = z.object({
    body: z.object({
        femaleId: z.string().uuid(),
        serviceDate: dateSchema,
        serviceType: z.enum(['natural', 'ai', 'other']),
        maleId: z.string().uuid().optional(),
        semenBatch: z.string().optional(),
        semenProvider: z.string().optional(),
        heatDetectionMethod: z.string().optional(),
        technicianId: z.string().uuid().optional(),
        notes: z.string().optional(),
    })
});

export const createPregnancySchema = z.object({
    body: z.object({
        animalId: z.string().uuid(),
        breedingServiceId: z.string().uuid().optional(),
        confirmationDate: dateSchema.optional(),
        confirmationMethod: z.string().optional(),
        expectedFarrowingDate: dateSchema.optional(),
        notes: z.string().optional(),
    })
});

export const createFarrowingSchema = z.object({
    body: z.object({
        pregnancyId: z.string().uuid(),
        motherId: z.string().uuid(),
        farrowingDate: dateSchema,
        pigletsBornAlive: z.number().int().nonnegative(),
        pigletsBornDead: z.number().int().nonnegative(),
        pigletsMummified: z.number().int().nonnegative(),
        totalLitterWeight: z.number().positive().optional(),
        assistanceRequired: z.boolean().optional(),
        attendedBy: z.string().uuid().optional(),
        notes: z.string().optional(),
    })
});

export const createWeaningSchema = z.object({
    body: z.object({
        farrowingId: z.string().uuid(),
        weaningDate: dateSchema,
        pigletsWeaned: z.number().int().positive(),
        averageWeaningWeight: z.number().positive().optional(),
        notes: z.string().optional(),
    })
});
