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
        const { minimumStockKg, maximumStockKg, initialStockKg, ...typeData } = data;

        return prisma.$transaction(async (tx) => {
            const feedType = await tx.feedType.create({
                data: { ...typeData, tenantId }
            });

            // Create initial inventory record
            await tx.feedInventory.create({
                data: {
                    tenantId,
                    feedTypeId: feedType.id,
                    currentStockKg: initialStockKg || 0,
                    minimumStockKg: minimumStockKg,
                    maximumStockKg: maximumStockKg,
                    // If there is initial stock, we should probably record it as an adjustment or purchase
                    // But for now, we just set the initial value as requested.
                    // Ideally, we would also create a feedMovement here if initialStockKg > 0
                }
            });

            if (initialStockKg && initialStockKg > 0) {
                 await tx.feedMovement.create({
                    data: {
                        tenantId,
                        feedTypeId: feedType.id,
                        movementType: 'adjustment_in',
                        quantityKg: initialStockKg,
                        movementDate: new Date(),
                        notes: 'Inventario inicial al crear el tipo de alimento'
                    }
                });
            }

            return feedType;
        });
    }

    async updateType(tenantId: string, id: string, data: Partial<CreateFeedTypeDTO>) {
        const { minimumStockKg, maximumStockKg, ...typeData } = data;

        const exists = await prisma.feedType.findUnique({ where: { id } });
        if (!exists || exists.tenantId !== tenantId) throw new AppError('Feed type not found', 404);

        return prisma.$transaction(async (tx) => {
            const updatedType = await tx.feedType.update({
                where: { id },
                data: typeData
            });

            if (minimumStockKg !== undefined || maximumStockKg !== undefined) {
                // Find or create inventory
                const inventory = await tx.feedInventory.findFirst({
                    where: { tenantId, feedTypeId: id }
                });

                if (inventory) {
                    await tx.feedInventory.update({
                        where: { id: inventory.id },
                        data: {
                            minimumStockKg,
                            maximumStockKg
                        }
                    });
                } else {
                    await tx.feedInventory.create({
                        data: {
                            tenantId,
                            feedTypeId: id,
                            currentStockKg: 0,
                            minimumStockKg,
                            maximumStockKg
                        }
                    });
                }
            }

            return updatedType;
        });
    }

    async deleteType(tenantId: string, id: string) {
        const exists = await prisma.feedType.findUnique({ where: { id } });
        if (!exists || exists.tenantId !== tenantId) throw new AppError('Feed type not found', 404);

        return prisma.feedType.update({
            where: { id },
            data: { isActive: false }
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

            // Adjust inventory quantity based on movement type
            const adjustment = data.movementType === 'out' || data.movementType === 'adjustment_out' 
                ? -data.quantityKg 
                : data.quantityKg;

            // Find existing inventory record
            const existingInventory = await tx.feedInventory.findFirst({
                where: { tenantId, feedTypeId: data.feedTypeId }
            });

            if (existingInventory) {
                await tx.feedInventory.update({
                    where: { id: existingInventory.id },
                    data: {
                        currentStockKg: { increment: adjustment },
                        lastPurchaseDate: data.movementType === 'purchase' ? data.movementDate : undefined,
                        lastPurchasePrice: data.movementType === 'purchase' ? data.unitCost : undefined
                    }
                });
            } else {
                // If no inventory record exists, create one (only logical for positive adjustments)
                if (adjustment < 0) throw new AppError('Cannot reduce stock from non-existent inventory', 400);
                
                await tx.feedInventory.create({
                    data: {
                        tenantId,
                        feedTypeId: data.feedTypeId,
                        currentStockKg: adjustment,
                        lastPurchaseDate: data.movementType === 'purchase' ? data.movementDate : undefined,
                        lastPurchasePrice: data.movementType === 'purchase' ? data.unitCost : undefined
                    }
                });
            }

            return movement;
        });
    }

    // --- Consumption ---
    async registerConsumption(tenantId: string, data: CreateFeedConsumptionDTO, userId: string) {
        return prisma.$transaction(async (tx) => {
            // Check current stock
            const inventory = await tx.feedInventory.findFirst({
                where: { tenantId, feedTypeId: data.feedTypeId }
            });

            if (!inventory) {
                throw new AppError('No inventory record found for this feed type', 404);
            }

            if (inventory.currentStockKg.toNumber() < data.quantityKg) {
                throw new AppError(`Insufficient stock. Available: ${inventory.currentStockKg}kg`, 400);
            }

            // Create main consumption record
            const consumption = await tx.feedConsumption.create({
                data: { ...data, tenantId, recordedBy: userId }
            });

            // Reduce inventory
            await tx.feedInventory.update({
                where: { id: inventory.id },
                data: {
                    currentStockKg: { decrement: data.quantityKg }
                }
            });

            // Distribute consumption among animals if penId is provided
            if (data.penId) {
                // Find all active animals in the pen
                const animalsInPen = await tx.animal.findMany({
                    where: { 
                        tenantId, 
                        currentPenId: data.penId,
                        isActive: true,
                        currentStatus: { notIn: ['sold', 'dead'] }
                    },
                    select: { id: true }
                });

                if (animalsInPen.length > 0) {
                    const quantityPerAnimal = data.quantityKg / animalsInPen.length;
                    
                    // We can either create individual consumption records for each animal (detailed but heavy)
                    // OR we can rely on the fact that consumption is linked to the pen, and we can calculate per-animal consumption on the fly.
                    // Given the requirement "must be divided equally", it usually implies calculating costs or stats per animal.
                    
                    // For now, let's just update the numberOfAnimals in the main record if not provided
                    if (!data.numberOfAnimals) {
                         await tx.feedConsumption.update({
                            where: { id: consumption.id },
                            data: { numberOfAnimals: animalsInPen.length }
                        });
                    }

                    // NOTE: If we wanted to track individual animal consumption history explicitly, we would create records here.
                    // However, typically for "Feed Consumption by Pen", it's an aggregate record. 
                    // To support "cost per animal" later, we can use the (total_quantity / number_of_animals) logic derived from this record.
                }
            }

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
                batch: { select: { code: true } },
                recorder: { select: { firstName: true, lastName: true } }
            },
            orderBy: { consumptionDate: 'desc' }
        });
    }

    // --- Alerts ---
    async getLowStockAlerts(tenantId: string) {
        // Fetch all active feed types with their inventory
        const types = await prisma.feedType.findMany({
            where: { tenantId, isActive: true },
            include: { feedInventory: true }
        });

        const alerts = types
            .map(type => {
                const inventory = type.feedInventory[0];
                if (!inventory) return null; // No inventory record means 0 stock usually, but let's handle strictly

                const current = inventory.currentStockKg.toNumber();
                const min = inventory.minimumStockKg?.toNumber() || 0;

                if (current <= min && min > 0) {
                    return {
                        feedTypeId: type.id,
                        feedName: type.name,
                        code: type.code,
                        currentStock: current,
                        minimumStock: min,
                        severity: current === 0 ? 'critical' : 'warning'
                    };
                }
                return null;
            })
            .filter(alert => alert !== null);

        return alerts;
    }
}

export const feedingService = new FeedingService();
