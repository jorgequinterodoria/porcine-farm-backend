import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { CreatePenDTO, UpdatePenDTO } from '../types/infrastructure.types';

export class PenService {
    async create(tenantId: string, data: CreatePenDTO) {
        // Verify facility exists
        const facility = await prisma.facility.findFirst({
            where: { id: data.facilityId, tenantId, deletedAt: null }
        });

        if (!facility) {
            throw new AppError('Facility not found', 404);
        }

        const existing = await prisma.pen.findUnique({
            where: {
                tenantId_facilityId_code: {
                    tenantId,
                    facilityId: data.facilityId,
                    code: data.code
                }
            }
        });

        if (existing) {
            throw new AppError('Pen code already exists in this facility', 400);
        }

        return prisma.pen.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    async findAll(tenantId: string, facilityId?: string) {
        return prisma.pen.findMany({
            where: {
                tenantId,
                ...(facilityId && { facilityId }),
                deletedAt: null
            },
            include: {
                facility: {
                    select: { name: true, code: true }
                },
                _count: {
                    select: { animals: true }
                }
            }
        });
    }

    async findOne(tenantId: string, id: string) {
        const pen = await prisma.pen.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                facility: true,
                animals: {
                    where: { isActive: true },
                    select: { id: true, internalCode: true, currentStatus: true }
                }
            }
        });

        if (!pen) {
            throw new AppError('Pen not found', 404);
        }

        return pen;
    }

    async update(tenantId: string, id: string, data: UpdatePenDTO) {
        await this.findOne(tenantId, id);

        return prisma.pen.update({
            where: { id },
            data
        });
    }

    async delete(tenantId: string, id: string) {
        await this.findOne(tenantId, id);

        return prisma.pen.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });
    }
}

export const penService = new PenService();
