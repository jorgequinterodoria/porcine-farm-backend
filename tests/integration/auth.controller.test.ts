import request from 'supertest';
import { app } from '../../../src/index';
import { prisma } from '../../../src/config/database';
import bcrypt from 'bcrypt';


jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');

const mockPrisma = prisma as any;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      tenantName: 'Test Farm',
      tenantSubdomain: 'testfarm'
    };

    it('should register new user successfully', async () => {
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

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 if email already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email already registered');
    });

    it('should return 400 if required fields missing', async () => {
      const invalidData = {
        email: 'test@example.com'
        
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
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

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 401 for wrong password', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'hashedpassword',
        isActive: true,
        tenant: {
          subscriptionStatus: 'active',
          isActive: true,
          deletedAt: null
        }
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for inactive tenant', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'hashedpassword',
        isActive: true,
        tenant: {
          subscriptionStatus: 'inactive',
          isActive: true,
          deletedAt: null
        }
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('subscription');
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should always return success message for security', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('If the email exists');
    });

    it('should process reset request for existing user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isActive: true,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpires: expect.any(Date),
        }),
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = {
        id: 'user-1',
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

      
      const mockToken = 'validtoken';
      const mockDecodedToken = { userId: 'user-1', tenantId: 'tenant-1', role: 'farm_admin' };

      
      jest.doMock('../../../src/middlewares/auth.middleware', () => ({
        authMiddleware: (req: any, res: any, next: any) => {
          req.user = mockDecodedToken;
          next();
        }
      }));

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });
});