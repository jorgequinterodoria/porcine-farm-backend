import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registrar nuevo usuario y tenant
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  /**
   * POST /api/auth/login
   * Login de usuario
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  /**
   * GET /api/auth/profile
   * Obtener perfil del usuario autenticado
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: profile
    });
  });

  /**
   * PUT /api/auth/profile
   * Actualizar perfil del usuario
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await authService.updateProfile(userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.changePassword(userId, req.body);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * POST /api/auth/forgot-password
   * Solicitar reset de contraseña
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestPasswordReset(req.body);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * POST /api/auth/reset-password
   * Resetear contraseña con token
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * POST /api/auth/invite
   * Invitar usuario (solo admins)
   */
  inviteUser = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const result = await authService.inviteUser(tenantId, req.body);

    res.status(201).json({
      success: true,
      ...result
    });
  });

  /**
   * POST /api/auth/logout
   * Logout (en este caso solo retorna éxito, el cliente debe eliminar el token)
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    // En un sistema con tokens JWT stateless, el logout se maneja en el cliente
    // Si quisieras implementar un blacklist de tokens, lo harías aquí

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });
}

export const authController = new AuthController();