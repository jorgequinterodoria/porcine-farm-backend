import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

const SALT_ROUNDS = 10;

export const getUsers = async (req: Request, res: Response) => {
    // @ts-ignore - req.user is added by middleware
    const { tenantId } = req.user;

    const users = await prisma.user.findMany({
        where: {
            tenantId,
            deletedAt: null
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLogin: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    res.json({
        status: 'success',
        data: users
    });
};

export const createUser = async (req: Request, res: Response) => {
    // @ts-ignore
    const { tenantId } = req.user;
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
        throw new AppError('Todos los campos son requeridos', 400);
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
        where: { email, tenantId }
    });

    if (existingUser) {
        throw new AppError('El usuario ya existe en esta granja', 400);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
        data: {
            tenantId,
            email,
            passwordHash,
            firstName,
            lastName,
            role,
            isActive: true,
            emailVerified: true // Direct creation by admin assumes verification
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true
        }
    });

    res.status(201).json({
        status: 'success',
        data: newUser
    });
};

export const updateUser = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    // @ts-ignore
    const { tenantId } = req.user;
    const { role, isActive, firstName, lastName } = req.body;

    const user = await prisma.user.findFirst({
        where: { id, tenantId }
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            role,
            isActive,
            firstName,
            lastName
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true
        }
    });

    res.json({
        status: 'success',
        data: updatedUser
    });
};

export const deleteUser = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    // @ts-ignore
    const { tenantId, id: currentUserId } = req.user;

    if (id === currentUserId) {
        throw new AppError('No puedes eliminar tu propia cuenta', 400);
    }

    const user = await prisma.user.findFirst({
        where: { id, tenantId }
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Soft delete
    await prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            isActive: false
        }
    });

    res.json({
        status: 'success',
        message: 'Usuario eliminado correctamente'
    });
};
