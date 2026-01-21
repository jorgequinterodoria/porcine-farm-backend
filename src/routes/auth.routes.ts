import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate, isFarmAdminOrAbove } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  inviteUserSchema
} from '../validators/auth.validators';

const router = Router();

// Rutas públicas
router.post(
  '/register',
  rateLimit(5, 15 * 60 * 1000), // 5 registros por 15 minutos
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  rateLimit(10, 15 * 60 * 1000), // 10 intentos por 15 minutos
  validate(loginSchema),
  authController.login
);

router.post(
  '/forgot-password',
  rateLimit(3, 15 * 60 * 1000), // 3 intentos por 15 minutos
  validate(resetPasswordRequestSchema),
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  rateLimit(3, 15 * 60 * 1000),
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Rutas protegidas
router.use(authenticate); // Todas las rutas siguientes requieren autenticación

router.get('/profile', authController.getProfile);

router.put('/profile', authController.updateProfile);

router.post(
  '/change-password',
  validate(changePasswordSchema),
  authController.changePassword
);

router.post('/logout', authController.logout);

// Solo admins pueden invitar usuarios
router.post(
  '/invite',
  isFarmAdminOrAbove,
  validate(inviteUserSchema),
  authController.inviteUser
);

export default router;