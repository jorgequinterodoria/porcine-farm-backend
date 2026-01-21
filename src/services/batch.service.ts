import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    CreateBatchDTO,
    UpdateBatchDTO,
    BatchAnimalDTO,
    RemoveBatchAnimalDTO
} from '../types/batch.types';

export class BatchService {
    /**
     * Crear un nuevo lote
     */
    async create(tenantId: string, data: CreateBatchDTO) {
        const { startDate, expectedEndDate, ...otherData } = data;

        // Verificar si el código ya existe
        const existing = await prisma.batch.findFirst({
            where: { tenantId, code: data.code }
        });

        if (existing) {
            throw new AppError('Batch code already exists', 400);
        }

        return prisma.batch.create({
            data: {
                tenantId,
                ...otherData,
                startDate: new Date(startDate),
                expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
                status: 'active'
            }
        });
    }

    /**
     * Obtener todos los lotes
     */
    async findAll(tenantId: string) {
        return prisma.batch.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { batchAnimals: { where: { exitDate: null } } }
                }
            }
        });
    }

    /**
     * Obtener un lote por ID
     */
    async findOne(tenantId: string, id: string) {
        const batch = await prisma.batch.findFirst({
            where: { id, tenantId },
            include: {
                batchAnimals: {
                    where: { exitDate: null },
                    include: {
                        animal: {
                            include: {
                                breed: true,
                                currentPen: true
                            }
                        }
                    }
                }
            }
        });

        if (!batch) {
            throw new AppError('Batch not found', 404);
        }

        return batch;
    }

    /**
     * Actualizar lote
     */
    async update(tenantId: string, id: string, data: UpdateBatchDTO) {
        const batch = await this.findOne(tenantId, id);

        const { startDate, expectedEndDate, actualEndDate, ...otherData } = data;

        return prisma.batch.update({
            where: { id: batch.id },
            data: {
                ...otherData,
                ...(startDate && { startDate: new Date(startDate) }),
                ...(expectedEndDate && { expectedEndDate: new Date(expectedEndDate) }),
                ...(actualEndDate && { actualEndDate: new Date(actualEndDate) })
            }
        });
    }

    /**
     * Agregar animal al lote
     */
    async addAnimal(tenantId: string, batchId: string, data: BatchAnimalDTO) {
        const batch = await this.findOne(tenantId, batchId);

        // Verificar si el animal ya está en el lote (activo)
        const existing = await prisma.batchAnimal.findFirst({
            where: {
                batchId: batch.id,
                animalId: data.animalId,
                exitDate: null
            }
        });

        if (existing) {
            throw new AppError('Animal is already in this batch', 400);
        }

        return prisma.$transaction(async (tx) => {
            const batchAnimal = await tx.batchAnimal.create({
                data: {
                    tenantId,
                    batchId: batch.id,
                    animalId: data.animalId,
                    joinDate: data.joinDate ? new Date(data.joinDate) : new Date()
                }
            });

            // Actualizar contador actual del lote
            await tx.batch.update({
                where: { id: batch.id },
                data: { currentCount: { increment: 1 } }
            });

            return batchAnimal;
        });
    }

    /**
     * Remover animal del lote
     */
    async removeAnimal(tenantId: string, batchId: string, data: RemoveBatchAnimalDTO) {
        const batch = await this.findOne(tenantId, batchId);

        const record = await prisma.batchAnimal.findFirst({
            where: {
                batchId: batch.id,
                animalId: data.animalId,
                exitDate: null
            }
        });

        if (!record) {
            throw new AppError('Animal not found in this batch', 404);
        }

        return prisma.$transaction(async (tx) => {
            await tx.batchAnimal.update({
                where: { id: record.id },
                data: {
                    exitDate: data.exitDate ? new Date(data.exitDate) : new Date(),
                    exitReason: data.exitReason
                }
            });

            // Actualizar contador actual del lote
            await tx.batch.update({
                where: { id: batch.id },
                data: { currentCount: { decrement: 1 } }
            });

            return { message: 'Animal removed from batch' };
        });
    }
}

export const batchService = new BatchService();
