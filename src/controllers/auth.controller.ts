import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user and tenant
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['email', 'password', 'firstName', 'lastName', 'farmName']
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               farmName:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
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
   * @swagger
   * /auth/login:
   *   post:
   *     summary: User login
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['email', 'password']
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                     user:
   *                       $ref: '#/components/schemas/User'
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
   * @swagger
   * /auth/profile:
   *   get:
   *     summary: Get authenticated user profile
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
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
   * @swagger
   * /auth/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       200:
   *         description: Profile updated
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
   * @swagger
   * /auth/change-password:
   *   post:
   *     summary: Change password
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['currentPassword', 'newPassword']
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password changed successfully
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
   * @swagger
   * /auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['email']
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Reset email sent
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestPasswordReset(req.body);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * @swagger
   * /auth/reset-password:
   *   post:
   *     summary: Reset password with token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['token', 'password']
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password reset successful
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * @swagger
   * /auth/invite:
   *   post:
   *     summary: Invite a user (Admin only)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['email', 'role']
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               role:
   *                 type: string
   *                 enum: ['farm_admin', 'operator']
   *     responses:
   *       201:
   *         description: Invitation sent
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
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
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