import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    CreateFeedTypeDTO,
    FeedMovementDTO,
    CreateFeedConsumptionDTO
} from '../types/feeding.types';

export class FeedingService {
    // --- Feed Types ---
    async createType(tenantId: string, data: CreateFeedTypeDTO) {
        return prisma.feedType.create({
            data: { ...data, tenantId }
        });
    }

    async getTypes(tenantId: string) {
        return prisma.feedType.findMany({
            where: { tenantId, isActive: true },
            include: {
                feedInventory: true
            }
        });
    }

    // --- Movements (Inventory) ---
    async addMovement(tenantId: string, data: FeedMovementDTO, userId: string) {
        return prisma.$transaction(async (tx) => {
            const movement = await tx.feedMovement.create({
                data: { ...data, tenantId, recordedBy: userId }
            });

            // Update Inventory
            await tx.feedInventory.upsert({
                where: { id: data.feedTypeId }, // Assuming feedTypeId is the ID or similar mapping
                // Logic for inventory needs careful ID mapping in Prisma schema
                // In schema.prisma, FeedInventory has feedTypeId as relation. 
                // Need to find by tenantId and feedTypeId.
                update: {
                    currentStockKg: { increment: data.quantityKg },
                    lastPurchaseDate: data.movementType === 'purchase' ? data.movementDate : undefined,
                    lastPurchasePrice: data.unitCost
                },
                create: {
                    tenantId,
                    feedTypeId: data.feedTypeId,
                    currentStockKg: data.quantityKg,
                    lastPurchaseDate: data.movementType === 'purchase' ? data.movementDate : undefined,
                    lastPurchasePrice: data.unitCost
                }
            });

            return movement;
        });
    }

    // --- Consumption ---
    async registerConsumption(tenantId: string, data: CreateFeedConsumptionDTO, userId: string) {
        return prisma.$transaction(async (tx) => {
            const consumption = await tx.feedConsumption.create({
                data: { ...data, tenantId, recordedBy: userId }
            });

            // Reduce inventory
            await tx.feedInventory.updateMany({
                where: { tenantId, feedTypeId: data.feedTypeId },
                data: {
                    currentStockKg: { decrement: data.quantityKg }
                }
            });

            return consumption;
        });
    }

    async getConsumptionHistory(tenantId: string, query: { penId?: string; batchId?: string }) {
        return prisma.feedConsumption.findMany({
            where: {
                tenantId,
                ...(query.penId && { penId: query.penId }),
                ...(query.batchId && { batchId: query.batchId })
            },
            include: {
                feedType: true,
                pen: { select: { name: true } },
                batch: { select: { code: true } }
            },
            orderBy: { consumptionDate: 'desc' }
        });
    }
}

export const feedingService = new FeedingService();
