import { z } from 'zod';

export const createMedicationSchema = z.object({
    body: z.object({
        code: z.string().min(1).max(50),
        commercialName: z.string().min(1).max(255),
        genericName: z.string().optional(),
        category: z.string().optional(),
        presentation: z.string().optional(),
        withdrawalPeriodDays: z.number().int().nonnegative().optional(),
        dosageInstructions: z.string().optional(),
        manufacturer: z.string().optional(),
    })
});

export const createVaccineSchema = z.object({
    body: z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        disease: z.string().min(1),
        type: z.string().optional(),
        manufacturer: z.string().optional(),
        applicationRoute: z.string().optional(),
        dosage: z.string().optional(),
        boosterRequired: z.boolean().optional(),
        boosterIntervalDays: z.number().int().positive().optional(),
    })
});

export const createDiseaseSchema = z.object({
    body: z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        scientificName: z.string().optional(),
        category: z.string().optional(),
        severity: z.string().optional(),
        symptoms: z.string().optional(),
        treatmentProtocol: z.string().optional(),
        preventionMeasures: z.string().optional(),
        isZoonotic: z.boolean().optional(),
    })
});

export const createHealthRecordSchema = z.object({
    body: z.object({
        animalId: z.string().uuid().optional(),
        batchId: z.string().uuid().optional(),
        recordType: z.enum(['individual', 'batch']),
        recordDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
        diseaseId: z.string().uuid().optional(),
        symptoms: z.string().optional(),
        diagnosis: z.string().optional(),
        temperature: z.number().optional(),
        treatmentPlan: z.string().optional(),
        prognosis: z.string().optional(),
        veterinarianId: z.string().uuid().optional(),
        notes: z.string().optional(),
    })
});
