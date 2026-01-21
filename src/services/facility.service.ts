import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { CreateFacilityDTO, UpdateFacilityDTO } from '../types/infrastructure.types';

export class FacilityService {
    async create(tenantId: string, data: CreateFacilityDTO) {
        const existing = await prisma.facility.findUnique({
            where: {
                tenantId_code: {
                    tenantId,
                    code: data.code
                }
            }
        });

        if (existing) {
            throw new AppError('Facility code already exists in this tenant', 400);
        }

        return prisma.facility.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    async findAll(tenantId: string) {
        return prisma.facility.findMany({
            where: { tenantId, deletedAt: null },
            include: {
                pens: {
                    where: { deletedAt: null }
                },
                _count: {
                    select: { pens: true }
                }
            }
        });
    }

    async findOne(tenantId: string, id: string) {
        const facility = await prisma.facility.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                pens: { where: { deletedAt: null } },
                parentFacility: true,
                childFacilities: true
            }
        });

        if (!facility) {
            throw new AppError('Facility not found', 404);
        }

        return facility;
    }

    async update(tenantId: string, id: string, data: UpdateFacilityDTO) {
        await this.findOne(tenantId, id);

        return prisma.facility.update({
            where: { id },
            data
        });
    }

    async delete(tenantId: string, id: string) {
        await this.findOne(tenantId, id);

        return prisma.facility.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });
    }
}

export const facilityService = new FacilityService();
