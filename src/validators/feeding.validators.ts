import { z } from 'zod';

const dateSchema = z.string().transform(v => new Date(v));

export const createFeedTypeSchema = z.object({
    body: z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        category: z.string().optional(),
        proteinPercentage: z.number().min(0).max(100).optional(),
        energyMcalKg: z.number().min(0).optional(),
        crudeFiberPercentage: z.number().min(0).max(100).optional(),
        formula: z.string().optional(),
        manufacturer: z.string().optional(),
        costPerKg: z.number().positive().optional(),
        minimumStockKg: z.number().min(0).optional(),
        maximumStockKg: z.number().min(0).optional(),
        initialStockKg: z.number().min(0).optional(),
    })
});

export const createFeedMovementSchema = z.object({
    body: z.object({
        feedTypeId: z.string().uuid(),
        movementType: z.enum(['purchase', 'adjustment_in', 'adjustment_out', 'out']),
        quantityKg: z.number().positive(),
        movementDate: dateSchema,
        unitCost: z.number().positive().optional(),
        supplier: z.string().optional(),
        invoiceNumber: z.string().optional(),
        notes: z.string().optional(),
    })
});

export const createFeedConsumptionSchema = z.object({
    body: z.object({
        consumptionDate: dateSchema,
        feedTypeId: z.string().uuid(),
        quantityKg: z.number().positive(),
        penId: z.string().uuid().optional(),
        batchId: z.string().uuid().optional(),
        animalId: z.string().uuid().optional(),
        numberOfAnimals: z.number().int().positive().optional(),
    })
});
