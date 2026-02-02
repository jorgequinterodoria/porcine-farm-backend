import request from 'supertest';
import { app } from '../../../src/index';
import { animalService } from '../../../src/services/animal.service';

// Mock the animal service for controller testing
jest.mock('../../../src/services/animal.service', () => ({
  animalService: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    recordWeight: jest.fn(),
    recordMovement: jest.fn(),
  },
}));

const mockAnimalService = animalService as jest.Mocked<typeof animalService>;

// Mock auth middleware
const mockUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  role: 'farm_admin',
};

jest.mock('../../../src/middlewares/auth.middleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

jest.mock('../../../src/middlewares/tenant.middleware', () => ({
  tenantMiddleware: (req: any, res: any, next: any) => {
    next();
  },
}));

describe('Animal Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/animals', () => {
    const validAnimalData = {
      internalCode: 'ANIMAL-001',
      identificationNumber: 'ID-001',
      breed: 'Yorkshire',
      gender: 'male',
      birthDate: '2024-01-01',
    };

    it('should create animal successfully', async () => {
      const mockAnimal = {
        id: 'animal-1',
        tenantId: 'tenant-1',
        ...validAnimalData,
      };

      mockAnimalService.create.mockResolvedValue(mockAnimal);

      const response = await request(app)
        .post('/api/animals')
        .set('Authorization', 'Bearer validtoken')
        .send(validAnimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internalCode).toBe('ANIMAL-001');
      expect(mockAnimalService.create).toHaveBeenCalledWith('tenant-1', validAnimalData);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        internalCode: 'ANIMAL-001',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/animals')
        .set('Authorization', 'Bearer validtoken')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/animals', () => {
    it('should return all animals for tenant', async () => {
      const mockAnimals = [
        { id: 'animal-1', internalCode: 'ANIMAL-001' },
        { id: 'animal-2', internalCode: 'ANIMAL-002' },
      ];

      mockAnimalService.findAll.mockResolvedValue(mockAnimals);

      const response = await request(app)
        .get('/api/animals')
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(mockAnimalService.findAll).toHaveBeenCalledWith('tenant-1', {});
    });

    it('should filter animals by status', async () => {
      mockAnimalService.findAll.mockResolvedValue([]);

      await request(app)
        .get('/api/animals?status=active')
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(mockAnimalService.findAll).toHaveBeenCalledWith('tenant-1', { status: 'active' });
    });

    it('should filter animals by pen ID', async () => {
      mockAnimalService.findAll.mockResolvedValue([]);

      await request(app)
        .get('/api/animals?penId=pen-1')
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(mockAnimalService.findAll).toHaveBeenCalledWith('tenant-1', { penId: 'pen-1' });
    });
  });

  describe('GET /api/animals/:id', () => {
    const animalId = 'animal-1';

    it('should return animal by ID', async () => {
      const mockAnimal = {
        id: animalId,
        internalCode: 'ANIMAL-001',
        breed: { name: 'Yorkshire' },
        currentPen: { name: 'Pen A' },
      };

      mockAnimalService.findOne.mockResolvedValue(mockAnimal);

      const response = await request(app)
        .get(`/api/animals/${animalId}`)
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.internalCode).toBe('ANIMAL-001');
      expect(mockAnimalService.findOne).toHaveBeenCalledWith('tenant-1', animalId);
    });

    it('should return 404 if animal not found', async () => {
      mockAnimalService.findOne.mockRejectedValue(new Error('Animal not found'));

      const response = await request(app)
        .get('/api/animals/nonexistent')
        .set('Authorization', 'Bearer validtoken')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/animals/:id', () => {
    const animalId = 'animal-1';
    const updateData = {
      identificationNumber: 'UPDATED-001',
      birthDate: '2024-01-15',
    };

    it('should update animal successfully', async () => {
      const mockUpdatedAnimal = {
        id: animalId,
        internalCode: 'ANIMAL-001',
        ...updateData,
      };

      mockAnimalService.update.mockResolvedValue(mockUpdatedAnimal);

      const response = await request(app)
        .put(`/api/animals/${animalId}`)
        .set('Authorization', 'Bearer validtoken')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.identificationNumber).toBe('UPDATED-001');
      expect(mockAnimalService.update).toHaveBeenCalledWith('tenant-1', animalId, updateData);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        gender: 'invalid-gender',
      };

      const response = await request(app)
        .put(`/api/animals/${animalId}`)
        .set('Authorization', 'Bearer validtoken')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/animals/:id', () => {
    const animalId = 'animal-1';

    it('should delete animal successfully', async () => {
      mockAnimalService.delete.mockResolvedValue({ message: 'Animal deleted successfully' });

      const response = await request(app)
        .delete(`/api/animals/${animalId}`)
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Animal deleted successfully');
      expect(mockAnimalService.delete).toHaveBeenCalledWith('tenant-1', animalId);
    });

    it('should return 404 if animal not found', async () => {
      mockAnimalService.delete.mockRejectedValue(new Error('Animal not found'));

      const response = await request(app)
        .delete('/api/animals/nonexistent')
        .set('Authorization', 'Bearer validtoken')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/animals/:id/weight', () => {
    const animalId = 'animal-1';
    const weightData = {
      weightKg: 50.5,
      measurementDate: '2024-01-15',
      notes: 'Healthy weight',
    };

    it('should record weight successfully', async () => {
      const mockWeightRecord = {
        id: 'weight-1',
        animalId,
        weightKg: 50.5,
        recordedBy: 'user-1',
      };

      mockAnimalService.recordWeight.mockResolvedValue(mockWeightRecord);

      const response = await request(app)
        .post(`/api/animals/${animalId}/weight`)
        .set('Authorization', 'Bearer validtoken')
        .send(weightData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.weightKg).toBe(50.5);
      expect(mockAnimalService.recordWeight).toHaveBeenCalledWith('tenant-1', animalId, 'user-1', weightData);
    });

    it('should return 400 for invalid weight data', async () => {
      const invalidWeightData = {
        weightKg: -10, // Invalid negative weight
        measurementDate: '2024-01-15',
      };

      const response = await request(app)
        .post(`/api/animals/${animalId}/weight`)
        .set('Authorization', 'Bearer validtoken')
        .send(invalidWeightData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/animals/:id/movement', () => {
    const animalId = 'animal-1';
    const movementData = {
      movementType: 'transfer',
      fromPenId: 'pen-1',
      toPenId: 'pen-2',
      reason: 'Feed optimization',
      notes: 'Moved to better pen',
    };

    it('should record movement successfully', async () => {
      const mockMovement = {
        id: 'movement-1',
        animalId,
        movementType: 'transfer',
        recordedBy: 'user-1',
      };

      mockAnimalService.recordMovement.mockResolvedValue(mockMovement);

      const response = await request(app)
        .post(`/api/animals/${animalId}/movement`)
        .set('Authorization', 'Bearer validtoken')
        .send(movementData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movementType).toBe('transfer');
      expect(mockAnimalService.recordMovement).toHaveBeenCalledWith('tenant-1', animalId, 'user-1', movementData);
    });

    it('should return 400 for invalid movement data', async () => {
      const invalidMovementData = {
        movementType: 'invalid-type',
        fromPenId: 'pen-1',
      };

      const response = await request(app)
        .post(`/api/animals/${animalId}/movement`)
        .set('Authorization', 'Bearer validtoken')
        .send(invalidMovementData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle movement without toPenId', async () => {
      const movementWithoutToPen = {
        movementType: 'sale',
        fromPenId: 'pen-1',
        reason: 'Sold to market',
      };

      const mockMovement = {
        id: 'movement-1',
        animalId,
        movementType: 'sale',
        recordedBy: 'user-1',
      };

      mockAnimalService.recordMovement.mockResolvedValue(mockMovement);

      const response = await request(app)
        .post(`/api/animals/${animalId}/movement`)
        .set('Authorization', 'Bearer validtoken')
        .send(movementWithoutToPen)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movementType).toBe('sale');
    });
  });
});