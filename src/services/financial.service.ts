import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    CreateTransactionCategoryDTO,
    CreateFinancialTransactionDTO,
    CreateAnimalSaleDTO
} from '../types/financial.types';

export class FinancialService {
    
    async createCategory(tenantId: string, data: CreateTransactionCategoryDTO) {
        return prisma.transactionCategory.create({
            data: { ...data, tenantId }
        });
    }

    async getCategories(tenantId: string) {
        return prisma.transactionCategory.findMany({
            where: { tenantId, isActive: true },
            include: { parentCategory: true }
        });
    }

    
    async createTransaction(tenantId: string, data: CreateFinancialTransactionDTO, userId: string) {
        return prisma.financialTransaction.create({
            data: { ...data, tenantId, recordedBy: userId }
        });
    }

    async getTransactions(tenantId: string, query: { categoryId?: string; animalId?: string }) {
        return prisma.financialTransaction.findMany({
            where: {
                tenantId,
                ...(query.categoryId && { categoryId: query.categoryId }),
                ...(query.animalId && { animalId: query.animalId })
            },
            include: { category: true, recorder: { select: { firstName: true, email: true } } },
            orderBy: { transactionDate: 'desc' }
        });
    }

    
    async createSale(tenantId: string, data: CreateAnimalSaleDTO, userId: string) {
        return prisma.$transaction(async (tx) => {
            
            const sale = await tx.animalSale.create({
                data: {
                    tenantId,
                    saleDate: data.saleDate,
                    customerName: data.customerName,
                    customerContact: data.customerContact,
                    totalAmount: data.totalAmount,
                    paymentStatus: data.paymentStatus || 'paid',
                    paymentMethod: data.paymentMethod,
                    invoiceNumber: data.invoiceNumber,
                    notes: data.notes,
                    recordedBy: userId,
                    animalSaleDetails: {
                        create: data.details.map(d => ({
                            ...d,
                            tenantId
                        }))
                    }
                }
            });

            
            const animalIds = data.details.map(d => d.animalId);
            await tx.animal.updateMany({
                where: { id: { in: animalIds }, tenantId },
                data: { currentStatus: 'sold', isActive: false }
            });

            
            await tx.financialTransaction.create({
                data: {
                    tenantId,
                    transactionDate: data.saleDate,
                    transactionType: 'income',
                    categoryId: 'SALES_CAT_ID', 
                    amount: data.totalAmount,
                    description: `Sale of ${animalIds.length} animals to ${data.customerName}`,
                    recordedBy: userId
                }
            });

            return sale;
        });
    }
}

export const financialService = new FinancialService();
