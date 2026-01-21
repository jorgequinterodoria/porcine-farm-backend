import { z } from 'zod';

// Schema para registro
export const registerSchema = z.object({
    body: z.object({
        email: z
            .string({
                message: 'Email is required'
            })
            .email('Invalid email format')
            .toLowerCase()
            .trim(),

        password: z
            .string({
                message: 'Password is required'
            })
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ),

        firstName: z
            .string({
                message: 'First name is required'
            })
            .min(2, 'First name must be at least 2 characters')
            .max(100, 'First name must be less than 100 characters')
            .trim(),

        lastName: z
            .string({
                message: 'Last name is required'
            })
            .min(2, 'Last name must be at least 2 characters')
            .max(100, 'Last name must be less than 100 characters')
            .trim(),

        phone: z
            .string()
            .optional()
            .transform(val => val?.trim()),

        role: z
            .enum(['farm_admin', 'veterinarian', 'technician', 'operator', 'viewer'])
            .optional()
            .default('operator'),

        // Datos del tenant (solo para el primer usuario)
        tenantName: z
            .string()
            .min(2, 'Tenant name must be at least 2 characters')
            .max(255)
            .optional()
            .transform(val => val?.trim()),

        tenantSubdomain: z
            .string()
            .min(3, 'Subdomain must be at least 3 characters')
            .max(100)
            .regex(
                /^[a-z0-9-]+$/,
                'Subdomain can only contain lowercase letters, numbers, and hyphens'
            )
            .optional()
            .transform(val => val?.toLowerCase().trim())
    })
});

// Schema para login
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({
                message: 'Email is required'
            })
            .email('Invalid email format')
            .toLowerCase()
            .trim(),

        password: z
            .string({
                message: 'Password is required'
            })
            .min(1, 'Password is required')
    })
});

// Schema para cambio de contraseña
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z
            .string({
                message: 'Current password is required'
            })
            .min(1, 'Current password is required'),

        newPassword: z
            .string({
                message: 'New password is required'
            })
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            )
    }).refine(
        (data) => data.currentPassword !== data.newPassword,
        {
            message: 'New password must be different from current password',
            path: ['newPassword']
        }
    )
});

// Schema para solicitar reset de contraseña
export const resetPasswordRequestSchema = z.object({
    body: z.object({
        email: z
            .string({
                message: 'Email is required'
            })
            .email('Invalid email format')
            .toLowerCase()
            .trim()
    })
});

// Schema para resetear contraseña
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z
            .string({
                message: 'Reset token is required'
            })
            .min(1, 'Reset token is required'),

        newPassword: z
            .string({
                message: 'New password is required'
            })
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            )
    })
});

// Schema para invitar usuario
export const inviteUserSchema = z.object({
    body: z.object({
        email: z
            .string({
                message: 'Email is required'
            })
            .email('Invalid email format')
            .toLowerCase()
            .trim(),

        firstName: z
            .string({
                message: 'First name is required'
            })
            .min(2)
            .max(100)
            .trim(),

        lastName: z
            .string({
                message: 'Last name is required'
            })
            .min(2)
            .max(100)
            .trim(),

        role: z.enum(['farm_admin', 'veterinarian', 'technician', 'operator', 'viewer']),

        phone: z.string().optional()
    })
});