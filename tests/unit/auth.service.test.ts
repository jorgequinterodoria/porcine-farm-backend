import { AuthService } from '../../../src/services/auth.service';
import { prisma } from '../../../src/config/database';
import { AppError } from '../../../src/middlewares/errorHandler.middleware';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockPrisma = prisma as any;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      tenantName: 'Test Farm',
      tenantSubdomain: 'testfarm'
    };

    it('should register a new user with tenant successfully', async () => {
      
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword');
      mockPrisma.tenant.create.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Farm',
        subdomain: 'testfarm',
        subscriptionPlan: 'free'
      });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'farm_admin',
        tenantId: 'tenant-1'
      });
      mockJwt.sign.mockReturnValue('mocktoken');

      const result = await authService.register(validRegisterData);

      expect(result.user.email).toBe('test@example.com');
      expect(result.tenant.name).toBe('Test Farm');
      expect(result.token).toBe('mocktoken');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw error if email already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(authService.register(validRegisterData))
        .rejects.toThrow(AppError);
    });

    it('should throw error if subdomain already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant' });

      await expect(authService.register(validRegisterData))
        .rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'farm_admin',
        tenantId: 'tenant-1',
        isActive: true,
        tenant: {
          id: 'tenant-1',
          name: 'Test Farm',
          subdomain: 'testfarm',
          subscriptionPlan: 'basic',
          subscriptionStatus: 'active',
          isActive: true,
          deletedAt: null
        }
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockJwt.sign.mockReturnValue('mocktoken');

      const result = await authService.login(validLoginData);

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mocktoken');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLogin: expect.any(Date) }
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.login(validLoginData))
        .rejects.toThrow(AppError);
    });

    it('should throw error for incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'hashedpassword',
        isActive: true
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(validLoginData))
        .rejects.toThrow(AppError);
    });

    it('should throw error for inactive tenant', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'hashedpassword',
        isActive: true,
        tenant: {
          subscriptionStatus: 'active',
          isActive: false,
          deletedAt: null
        }
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      await expect(authService.login(validLoginData))
        .rejects.toThrow(AppError);
    });
  });

  describe('changePassword', () => {
    const userId = 'user-1';
    const validPasswordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword'
    };

    it('should change password successfully', async () => {
      const mockUser = {
        id: userId,
        passwordHash: 'hashedpassword'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue('newhashedpassword');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.changePassword(userId, validPasswordData);

      expect(result.message).toBe('Password changed successfully');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should throw error for user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.changePassword(userId, validPasswordData))
        .rejects.toThrow(AppError);
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        id: userId,
        passwordHash: 'hashedpassword'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(authService.changePassword(userId, validPasswordData))
        .rejects.toThrow(AppError);
    });
  });

  describe('getProfile', () => {
    const userId = 'user-1';

    it('should get user profile successfully', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'farm_admin',
        tenant: {
          id: 'tenant-1',
          name: 'Test Farm',
          subscriptionPlan: 'basic'
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getProfile(userId);

      expect(result.email).toBe('test@example.com');
      expect(result.tenant.name).toBe('Test Farm');
    });

    it('should throw error for user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile(userId))
        .rejects.toThrow(AppError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', async () => {
      const mockPayload = { userId: 'user-1', tenantId: 'tenant-1', role: 'farm_admin' };
      mockJwt.verify.mockReturnValue(mockPayload);

      const result = authService.verifyToken('validtoken');

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith('validtoken', expect.any(String));
    });

    it('should throw error for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken('invalidtoken'))
        .rejects.toThrow(AppError);
    });
  });
});