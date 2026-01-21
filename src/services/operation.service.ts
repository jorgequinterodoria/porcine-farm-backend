import { prisma } from '../config/database';
import { CreateTaskDTO, UpdateTaskStatusDTO } from '../types/operations.types';

export class OperationService {
    // --- Tasks ---
    async createTask(tenantId: string, data: CreateTaskDTO, creatorId: string) {
        const { assignedToId, ...rest } = data;
        return prisma.task.create({
            data: {
                ...rest,
                tenantId,
                assignedTo: assignedToId,
                createdBy: creatorId
            }
        });
    }

    async getTasks(tenantId: string, filters: any) {
        return prisma.task.findMany({
            where: {
                tenantId,
                ...(filters.status && { status: filters.status }),
                ...(filters.assignedToId && { assignedTo: filters.assignedToId })
            },
            include: {
                assignee: { select: { firstName: true, email: true } },
                creator: { select: { firstName: true } }
            },
            orderBy: { dueDate: 'asc' }
        });
    }

    async updateTaskStatus(tenantId: string, id: string, data: UpdateTaskStatusDTO) {
        return prisma.task.update({
            where: { id },
            data: { status: data.status }
        });
    }

    // --- Notifications ---
    async getNotifications(userId: string) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    // --- Audit Logs ---
    async registerLog(tenantId: string, userId: string, action: string, entity: string, entityId: string, details?: any) {
        return prisma.auditLog.create({
            data: {
                tenantId,
                userId,
                action,
                entityType: entity,
                entityId,
                newValues: details ? JSON.parse(JSON.stringify(details)) : undefined
            }
        });
    }
}

export const operationService = new OperationService();
