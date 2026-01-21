import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { CreateTenantDTO, UpdateTenantDTO, TenantResponse } from '../types/tenant.types';

export class TenantService {
    private readonly SALT_ROUNDS = 10;

    /**
     * Crear un nuevo tenant y su usuario administrador
     */
    async createTenantWithAdmin(data: CreateTenantDTO): Promise<{ tenant: TenantResponse; admin: any; password?: string }> {
        const {
            name,
            subdomain,
            email: tenantEmail,
            adminEmail,
            adminFirstName,
            adminLastName,
            adminPassword,
            ...otherData
        } = data;

        // 1. Verificar si el subdominio ya existe
        const existingTenant = await prisma.tenant.findUnique({
            where: { subdomain }
        });

        if (existingTenant) {
            throw new AppError('Subdomain already taken', 400);
        }

        // 2. Verificar si el adminEmail ya existe (en cualquier tenant para este flujo de superadmin)
        const existingUser = await prisma.user.findFirst({
            where: { email: adminEmail }
        });

        if (existingUser) {
            throw new AppError('Admin email already registered', 400);
        }

        // 3. Generar password si no se proporcionó
        const password = adminPassword || crypto.randomBytes(12).toString('hex');
        const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

        // 4. Crear Tenant y User en una transacción
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    subdomain,
                    email: tenantEmail,
                    ...otherData
                }
            });

            const admin = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: adminEmail,
                    passwordHash,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    role: 'farm_admin',
                    emailVerified: false,
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true
                }
            });

            return { tenant, admin };
        });

        // TODO: Enviar email con credenciales
        if (process.env.NODE_ENV === 'development') {
            console.log('--- NEW TENANT CREATED ---');
            console.log('Subdomain:', subdomain);
            console.log('Admin Email:', adminEmail);
            console.log('Temp Password:', password);
            console.log('---------------------------');
        }

        return { ...result, password };
    }

    /**
     * Obtener estadísticas globales para Super Admin
     */
    async getGlobalStats(): Promise<any> {
        const totalTenants = await prisma.tenant.count({
            where: { deletedAt: null }
        });

        const activeTenants = await prisma.tenant.count({
            where: { deletedAt: null, isActive: true }
        });

        const totalUsers = await prisma.user.count({
            where: { deletedAt: null }
        });

        const tenants = await prisma.tenant.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                subdomain: true,
                subscriptionPlan: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        animals: true,
                        users: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalAnimals = tenants.reduce((acc, curr) => acc + curr._count.animals, 0);

        return {
            summary: {
                totalTenants,
                activeTenants,
                totalUsers,
                totalAnimals
            },
            tenants
        };
    }

    /**
     * Obtener todos los tenants
     */
    async findAll(): Promise<TenantResponse[]> {
        return prisma.tenant.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Obtener un tenant por ID
     */
    async findOne(id: string): Promise<TenantResponse> {
        const tenant = await prisma.tenant.findUnique({
            where: { id, deletedAt: null }
        });

        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        return tenant;
    }

    /**
     * Actualizar tenant
     */
    async update(id: string, data: UpdateTenantDTO): Promise<TenantResponse> {
        const tenant = await prisma.tenant.findUnique({
            where: { id, deletedAt: null }
        });

        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        return prisma.tenant.update({
            where: { id },
            data
        });
    }

    /**
     * Eliminar tenant (soft delete)
     */
    async delete(id: string): Promise<{ message: string }> {
        const tenant = await prisma.tenant.findUnique({
            where: { id, deletedAt: null }
        });

        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        await prisma.tenant.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });

        // Opcional: Desactivar todos los usuarios del tenant
        await prisma.user.updateMany({
            where: { tenantId: id },
            data: { isActive: false }
        });

        return { message: 'Tenant deleted successfully' };
    }
}

export const tenantService = new TenantService();
