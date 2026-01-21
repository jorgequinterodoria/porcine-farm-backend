import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    CreateAnimalDTO,
    UpdateAnimalDTO,
    RecordWeightDTO,
    RecordMovementDTO
} from '../types/animal.types';

export class AnimalService {
    /**
     * Crear un nuevo animal
     */
    async create(tenantId: string, data: CreateAnimalDTO) {
        const {
            birthDate,
            entryDate,
            motherId,
            fatherId,
            currentPenId,
            breedId,
            ...otherData
        } = data;

        // Verificar si el código interno ya existe en este tenant
        const existing = await prisma.animal.findFirst({
            where: {
                tenantId,
                internalCode: data.internalCode,
                deletedAt: null
            }
        });

        if (existing) {
            throw new AppError('Animal internal code already exists', 400);
        }

        return prisma.animal.create({
            data: {
                tenantId,
                ...otherData,
                birthDate: new Date(birthDate),
                entryDate: entryDate ? new Date(entryDate) : null,
                motherId,
                fatherId,
                currentPenId,
                breedId
            }
        });
    }

    /**
     * Obtener todos los animales del tenant
     */
    async findAll(tenantId: string, filters: any = {}) {
        const { status, penId, batchId } = filters;

        return prisma.animal.findMany({
            where: {
                tenantId,
                deletedAt: null,
                ...(status && { currentStatus: status }),
                ...(penId && { currentPenId: penId }),
                ...(batchId && {
                    batchAnimals: {
                        some: { batchId, exitDate: null }
                    }
                })
            },
            include: {
                breed: true,
                currentPen: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Obtener un animal por ID
     */
    async findOne(tenantId: string, id: string) {
        const animal = await prisma.animal.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                breed: true,
                currentPen: true,
                mother: { select: { id: true, internalCode: true } },
                father: { select: { id: true, internalCode: true } },
                weightRecords: {
                    orderBy: { measurementDate: 'desc' },
                    take: 10
                },
                movements: {
                    orderBy: { movementDate: 'desc' },
                    take: 10,
                    include: {
                        fromPen: true,
                        toPen: true
                    }
                }
            }
        });

        if (!animal) {
            throw new AppError('Animal not found', 404);
        }

        return animal;
    }

    /**
     * Actualizar animal
     */
    async update(tenantId: string, id: string, data: UpdateAnimalDTO) {
        const animal = await this.findOne(tenantId, id);

        const {
            birthDate,
            entryDate,
            ...otherData
        } = data;

        return prisma.animal.update({
            where: { id: animal.id },
            data: {
                ...otherData,
                ...(birthDate && { birthDate: new Date(birthDate) }),
                ...(entryDate && { entryDate: new Date(entryDate) })
            }
        });
    }

    /**
     * Eliminar animal (soft delete)
     */
    async delete(tenantId: string, id: string) {
        const animal = await this.findOne(tenantId, id);

        await prisma.animal.update({
            where: { id: animal.id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });

        return { message: 'Animal deleted successfully' };
    }

    /**
     * Registrar peso
     */
    async recordWeight(tenantId: string, animalId: string, userId: string, data: RecordWeightDTO) {
        const animal = await this.findOne(tenantId, animalId);

        return prisma.weightRecord.create({
            data: {
                tenantId,
                animalId: animal.id,
                weightKg: data.weightKg,
                measurementDate: new Date(data.measurementDate),
                recordedBy: userId,
                notes: data.notes
            }
        });
    }

    /**
     * Registrar movimiento
     */
    async recordMovement(tenantId: string, animalId: string, userId: string, data: RecordMovementDTO) {
        const animal = await this.findOne(tenantId, animalId);

        // Si hay un toPenId, actualizar el currentPenId del animal
        return prisma.$transaction(async (tx) => {
            const movement = await tx.animalMovement.create({
                data: {
                    tenantId,
                    animalId: animal.id,
                    movementType: data.movementType,
                    fromPenId: data.fromPenId || animal.currentPenId,
                    toPenId: data.toPenId,
                    movementDate: data.movementDate ? new Date(data.movementDate) : new Date(),
                    reason: data.reason,
                    recordedBy: userId,
                    notes: data.notes
                }
            });

            if (data.toPenId) {
                await tx.animal.update({
                    where: { id: animal.id },
                    data: { currentPenId: data.toPenId }
                });
            }

            return movement;
        });
    }
}

export const animalService = new AnimalService();
