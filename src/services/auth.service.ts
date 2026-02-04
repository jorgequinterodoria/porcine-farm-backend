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

        
        const existingUser = await prisma.user.findFirst({
            where: { email }
        });

        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        
        const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

        let tenant;
        let userRole = role || 'operator';

        
        if (tenantName && tenantSubdomain) {
            
            const existingTenant = await prisma.tenant.findUnique({
                where: { subdomain: tenantSubdomain }
            });

            if (existingTenant) {
                throw new AppError('Subdomain already taken', 400);
            }

            
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

            
            userRole = 'farm_admin';
        } else {
            throw new AppError(
                'Tenant information is required for new registrations',
                400
            );
        }

        
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

    


    async login(data: LoginDTO): Promise<AuthResponse> {
        const { email, password } = data;

        
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

        
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        
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
                farmId: user.tenantId 
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

    


    async changePassword(
        userId: string,
        data: ChangePasswordDTO
    ): Promise<{ message: string }> {
        const { currentPassword, newPassword } = data;

        
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new AppError('Current password is incorrect', 400);
        }

        
        const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });

        return { message: 'Password changed successfully' };
    }

    


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

        
        if (!user) {
            return {
                message: 'If the email exists, a reset link has been sent'
            };
        }

        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); 

        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpires
            }
        });

        // TODO: Enviar email con el token
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Reset Token:', resetToken);
            console.log('Reset URL:', `http://localhost:5173/reset-password?token=${resetToken}`);
        }

        return {
            message: 'If the email exists, a reset link has been sent'
        };
    }

    


    async resetPassword(data: ResetPasswordDTO): Promise<{ message: string }> {
        const { token, newPassword } = data;

        
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

        
        const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        
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

        
        const existingUser = await prisma.user.findFirst({
            where: {
                email: data.email,
                tenantId
            }
        });

        if (existingUser) {
            throw new AppError('User with this email already exists in your organization', 400);
        }

        
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, this.SALT_ROUNDS);

        
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

    


    private generateToken(payload: {
        userId: string;
        tenantId: string;
        role: string;
    }): string {
        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN as any
        });
    }

    


    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new AppError('Invalid or expired token', 401);
        }
    }
}

export const authService = new AuthService();