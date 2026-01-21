import { z } from 'zod';

const dateSchema = z.string().transform(v => new Date(v));

export const createTransactionCategorySchema = z.object({
    body: z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        type: z.enum(['income', 'expense']),
        parentCategoryId: z.string().uuid().optional(),
    })
});

export const createFinancialTransactionSchema = z.object({
    body: z.object({
        transactionDate: dateSchema,
        transactionType: z.enum(['income', 'expense']),
        categoryId: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().optional(),
        description: z.string().min(1),
        animalId: z.string().uuid().optional(),
        batchId: z.string().uuid().optional(),
    })
});

export const createAnimalSaleSchema = z.object({
    body: z.object({
        saleDate: dateSchema,
        customerName: z.string().min(1),
        totalAmount: z.number().positive(),
        details: z.array(z.object({
            animalId: z.string().uuid(),
            subtotal: z.number().positive(),
        })).min(1),
    })
});
