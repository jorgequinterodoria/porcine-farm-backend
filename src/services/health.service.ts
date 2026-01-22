import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    CreateMedicationDTO,
    CreateVaccineDTO,
    CreateDiseaseDTO,
    CreateHealthRecordDTO
} from '../types/health.types';

export class HealthService {
    // --- Medications CRUD ---
    async createMedication(data: CreateMedicationDTO) {
        return prisma.medication.create({ data });
    }

    async getMedications() {
        return prisma.medication.findMany({ where: { isActive: true } });
    }

    async updateMedication(id: string, data: Partial<CreateMedicationDTO>) {
        const exists = await prisma.medication.findUnique({ where: { id } });
        if (!exists) throw new AppError('Medicamento no encontrado', 404);

        return prisma.medication.update({
            where: { id },
            data
        });
    }

    async deleteMedication(id: string) {
        const exists = await prisma.medication.findUnique({ where: { id } });
        if (!exists) throw new AppError('Medicamento no encontrado', 404);

        return prisma.medication.update({
            where: { id },
            data: { isActive: false }
        });
    }

    // --- Vaccines CRUD ---
    async createVaccine(data: CreateVaccineDTO) {
        return prisma.vaccine.create({ data });
    }

    async getVaccines() {
        return prisma.vaccine.findMany({ where: { isActive: true } });
    }

    async updateVaccine(id: string, data: Partial<CreateVaccineDTO>) {
        const exists = await prisma.vaccine.findUnique({ where: { id } });
        if (!exists) throw new AppError('Vacuna no encontrada', 404);

        return prisma.vaccine.update({
            where: { id },
            data
        });
    }

    async deleteVaccine(id: string) {
        const exists = await prisma.vaccine.findUnique({ where: { id } });
        if (!exists) throw new AppError('Vacuna no encontrada', 404);

        return prisma.vaccine.update({
            where: { id },
            data: { isActive: false }
        });
    }

    // --- Diseases CRUD ---
    async createDisease(data: CreateDiseaseDTO) {
        return prisma.disease.create({ data });
    }

    async getDiseases() {
        return prisma.disease.findMany({ where: { isActive: true } });
    }

    async updateDisease(id: string, data: Partial<CreateDiseaseDTO>) {
        const exists = await prisma.disease.findUnique({ where: { id } });
        if (!exists) throw new AppError('Enfermedad no encontrada', 404);

        return prisma.disease.update({
            where: { id },
            data
        });
    }

    async deleteDisease(id: string) {
        const exists = await prisma.disease.findUnique({ where: { id } });
        if (!exists) throw new AppError('Enfermedad no encontrada', 404);

        return prisma.disease.update({
            where: { id },
            data: { isActive: false }
        });
    }

    // --- Health Records ---
    async createHealthRecord(tenantId: string, data: CreateHealthRecordDTO) {
        // Basic verification
        if (data.animalId) {
            const animal = await prisma.animal.findFirst({ where: { id: data.animalId, tenantId } });
            if (!animal) throw new AppError('Animal not found', 404);
        }

        if (data.batchId) {
            const batch = await prisma.batch.findFirst({ where: { id: data.batchId, tenantId } });
            if (!batch) throw new AppError('Batch not found', 404);
        }

        return prisma.healthRecord.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    async getHealthRecords(tenantId: string, query: { animalId?: string; batchId?: string }) {
        return prisma.healthRecord.findMany({
            where: {
                tenantId,
                ...(query.animalId && { animalId: query.animalId }),
                ...(query.batchId && { batchId: query.batchId }),
            },
            include: {
                animal: { select: { internalCode: true } },
                batch: { select: { code: true, name: true } },
                disease: true,
                veterinarian: { select: { firstName: true, lastName: true } }
            },
            orderBy: { recordDate: 'desc' }
        });
    }

    async findOneRecord(tenantId: string, id: string) {
        const record = await prisma.healthRecord.findFirst({
            where: { id, tenantId },
            include: {
                animal: true,
                batch: true,
                disease: true,
                medicationTreatments: {
                    include: { medication: true }
                }
            }
        });
        if (!record) throw new AppError('Health record not found', 404);
        return record;
    }
}

export const healthService = new HealthService();
