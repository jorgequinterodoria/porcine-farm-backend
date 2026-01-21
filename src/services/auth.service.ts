import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
    RegisterDTO,
    LoginDTO,
    AuthResponse,
    ChangePasswordDTO,
    ResetPasswordRequestDTO,
    ResetPasswordDTO
} from '../types/auth.types';

export class AuthService {
    private readonly SALT_ROUNDS = 10;
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    /**
     * Registrar un nuevo usuario y opcionalmente un nuevo tenant
     */
    async register(data: RegisterDTO): Promise<AuthResponse> {
        const {
            email,
            password,
            firstName,
            lastName,
            phone,
            role,
            tenantName,
            tenantSubdomain
        } = data;

        // Verificar si el email ya existe
        const existingUser = await prisma.user.findFirst({
            where: { email }
        });

        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

        let tenant;
        let userRole = role || 'operator';

        // Si se proporciona información del tenant, crear uno nuevo
        if (tenantName && tenantSubdomain) {
            // Verificar que el subdominio no exista
            const existingTenant = await prisma.tenant.findUnique({
                where: { subdomain: tenantSubdomain }
            });

            if (existingTenant) {
                throw new AppError('Subdomain already taken', 400);
            }

            // Crear tenant
            tenant = await prisma.tenant.create({
                data: {
                    name: tenantName,
                    subdomain: tenantSubdomain,
                    email: email,
                    subscriptionPlan: 'free',
                    subscriptionStatus: 'active',
                    subscriptionStartDate: new Date()
                }
            });

            // El primer usuario del tenant es admin
            userRole = 'farm_admin';
        } else {
            throw new AppError(
                'Tenant information is required for new registrations',
                400
            );
        }

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                role: userRole,
                emailVerified: false
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                tenantId: true
            }
        });

        // Generar token
        const token = this.generateToken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role
        });

        return {
            user,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                subscriptionPlan: tenant.subscriptionPlan
            },
            token,
            expiresIn: this.JWT_EXPIRES_IN
        };
    }

    /**
     * Login de usuario
     */
    async login(data: LoginDTO): Promise<AuthResponse> {
        const { email, password } = data;

        // Buscar usuario
        const user = await prisma.user.findFirst({
            where: {
                email,
                isActive: true,
                deletedAt: null
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        subdomain: true,
                        subscriptionPlan: true,
                        subscriptionStatus: true,
                        isActive: true,
                        deletedAt: true
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Verificar que el tenant esté activo
        if (user.tenant) {
            if (!user.tenant.isActive || user.tenant.deletedAt) {
                throw new AppError('Your organization account is inactive', 403);
            }

            if (user.tenant.subscriptionStatus !== 'active') {
                throw new AppError(
                    'Your organization subscription is not active. Please contact support.',
                    403
                );
            }
        }

        // Verificar password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        // Actualizar last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Generar token
        const token = this.generateToken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenantId: user.tenantId,
                farmId: user.tenantId // Compatibility fallback
            },
            tenant: user.tenant ? {
                id: user.tenant.id,
                name: user.tenant.name,
                subdomain: user.tenant.subdomain,
                subscriptionPlan: user.tenant.subscriptionPlan
            } : null,
            token,
            expiresIn: this.JWT_EXPIRES_IN
        };
    }

    /**
     * Cambiar contraseña
     */
    async changePassword(
        userId: string,
        data: ChangePasswordDTO
    ): Promise<{ message: string }> {
        const { currentPassword, newPassword } = data;

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Verificar password actual
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new AppError('Current password is incorrect', 400);
        }

        // Hash nueva contraseña
        const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        // Actualizar password
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });

        return { message: 'Password changed successfully' };
    }

    /**
     * Solicitar reset de contraseña
     */
    async requestPasswordReset(
        data: ResetPasswordRequestDTO
    ): Promise<{ message: string }> {
        const { email } = data;

        const user = await prisma.user.findFirst({
            where: {
                email,
                isActive: true,
                deletedAt: null
            }
        });

        // Por seguridad, siempre devolver el mismo mensaje
        if (!user) {
            return {
                message: 'If the email exists, a reset link has been sent'
            };
        }

        // Generar token de reset
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpires
            }
        });

        // TODO: Enviar email con el token
        // En desarrollo, puedes loggearlo:
        if (process.env.NODE_ENV === 'development') {
            console.log('Reset Token:', resetToken);
            console.log('Reset URL:', `http://localhost:5173/reset-password?token=${resetToken}`);
        }

        return {
            message: 'If the email exists, a reset link has been sent'
        };
    }

    /**
     * Resetear contraseña con token
     */
    async resetPassword(data: ResetPasswordDTO): Promise<{ message: string }> {
        const { token, newPassword } = data;

        // Buscar usuario con el token válido
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date()
                },
                isActive: true,
                deletedAt: null
            }
        });

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        // Hash nueva contraseña
        const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        // Actualizar password y limpiar token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        return { message: 'Password reset successfully' };
    }

    /**
     * Obtener perfil del usuario
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                role: true,
                emailVerified: true,
                lastLogin: true,
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        subdomain: true,
                        subscriptionPlan: true,
                        subscriptionStatus: true
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    /**
     * Actualizar perfil
     */
    async updateProfile(
        userId: string,
        data: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            avatarUrl?: string;
        }
    ) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                role: true
            }
        });

        return user;
    }

    /**
     * Invitar usuario a un tenant existente (solo admins)
     */
    async inviteUser(
        tenantId: string,
        data: {
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            phone?: string;
        }
    ) {
        // Verificar límite de usuarios
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { maxUsers: true }
        });

        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        const userCount = await prisma.user.count({
            where: {
                tenantId,
                isActive: true,
                deletedAt: null
            }
        });

        if (userCount >= tenant.maxUsers) {
            throw new AppError(
                `You have reached your plan limit of ${tenant.maxUsers} users`,
                403
            );
        }

        // Verificar que el email no exista
        const existingUser = await prisma.user.findFirst({
            where: {
                email: data.email,
                tenantId
            }
        });

        if (existingUser) {
            throw new AppError('User with this email already exists in your organization', 400);
        }

        // Generar contraseña temporal
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, this.SALT_ROUNDS);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                tenantId,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: data.role,
                passwordHash,
                emailVerified: false
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

        // TODO: Enviar email con contraseña temporal
        if (process.env.NODE_ENV === 'development') {
            console.log('Temporary Password:', tempPassword);
        }

        return {
            user,
            message: 'User invited successfully. An email has been sent with login instructions.'
        };
    }

    /**
     * Generar JWT token
     */
    private generateToken(payload: {
        userId: string;
        tenantId: string;
        role: string;
    }): string {
        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN as any
        });
    }

    /**
     * Verificar token
     */
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new AppError('Invalid or expired token', 401);
        }
    }
}

export const authService = new AuthService();