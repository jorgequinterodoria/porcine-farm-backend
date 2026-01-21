import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    CreateBreedingServiceDTO,
    CreatePregnancyDTO,
    CreateFarrowingDTO,
    CreateWeaningDTO
} from '../types/reproduction.types';

export class ReproductionService {
    // --- Breeding Services ---
    async createBreeding(tenantId: string, data: CreateBreedingServiceDTO) {
        const female = await prisma.animal.findFirst({
            where: { id: data.femaleId, tenantId, sex: 'female' }
        });
        if (!female) throw new AppError('Female animal not found', 404);

        return prisma.breedingService.create({
            data: { ...data, tenantId }
        });
    }

    async getBreedingHistory(tenantId: string, femaleId: string) {
        return prisma.breedingService.findMany({
            where: { tenantId, femaleId },
            include: { male: true, technician: true },
            orderBy: { serviceDate: 'desc' }
        });
    }

    // --- Pregnancies ---
    async createPregnancy(tenantId: string, data: CreatePregnancyDTO) {
        const animal = await prisma.animal.findFirst({ where: { id: data.animalId, tenantId } });
        if (!animal) throw new AppError('Animal not found', 404);

        return prisma.pregnancy.create({
            data: { ...data, tenantId, pregnancyStatus: 'confirmed' }
        });
    }

    async getPregnancies(tenantId: string, animalId?: string) {
        return prisma.pregnancy.findMany({
            where: { tenantId, ...(animalId && { animalId }) },
            include: { animal: true, breedingService: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // --- Farrowing (Partos) ---
    async createFarrowing(tenantId: string, data: CreateFarrowingDTO) {
        const pregnancy = await prisma.pregnancy.findFirst({
            where: { id: data.pregnancyId, tenantId, pregnancyStatus: 'confirmed' }
        });
        if (!pregnancy) throw new AppError('Confirmed pregnancy not found', 404);

        return prisma.$transaction(async (tx) => {
            const farrowing = await tx.farrowing.create({
                data: { ...data, tenantId }
            });

            await tx.pregnancy.update({
                where: { id: data.pregnancyId },
                data: { pregnancyStatus: 'completed', actualFarrowingDate: data.farrowingDate }
            });

            return farrowing;
        });
    }

    // --- Weaning (Destete) ---
    async createWeaning(tenantId: string, data: CreateWeaningDTO) {
        const farrowing = await prisma.farrowing.findFirst({
            where: { id: data.farrowingId, tenantId }
        });
        if (!farrowing) throw new AppError('Farrowing record not found', 404);

        return prisma.weaning.create({
            data: { ...data, tenantId }
        });
    }
}

export const reproductionService = new ReproductionService();
