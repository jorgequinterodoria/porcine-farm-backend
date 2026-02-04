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


router.post(
  '/register',
  rateLimit(5, 15 * 60 * 1000), 
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  rateLimit(10, 15 * 60 * 1000), 
  validate(loginSchema),
  authController.login
);

router.post(
  '/forgot-password',
  rateLimit(3, 15 * 60 * 1000), 
  validate(resetPasswordRequestSchema),
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  rateLimit(3, 15 * 60 * 1000),
  validate(resetPasswordSchema),
  authController.resetPassword
);


router.use(authenticate); 

router.get('/profile', authController.getProfile);

router.put('/profile', authController.updateProfile);

router.post(
  '/change-password',
  validate(changePasswordSchema),
  authController.changePassword
);

router.post('/logout', authController.logout);


router.post(
  '/invite',
  isFarmAdminOrAbove,
  validate(inviteUserSchema),
  authController.inviteUser
);

export default router;