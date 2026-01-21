import { z } from 'zod';

const dateSchema = z.string().transform(v => new Date(v));

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        dueDate: dateSchema,
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assignedToId: z.string().uuid().optional(),
        facilityId: z.string().uuid().optional(),
        penId: z.string().uuid().optional(),
        animalId: z.string().uuid().optional(),
        batchId: z.string().uuid().optional(),
    })
});

export const updateTaskStatusSchema = z.object({
    body: z.object({
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    })
});
