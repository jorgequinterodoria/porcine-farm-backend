import { AnimalService } from '../../../src/services/animal.service';
import { prisma } from '../../../src/config/database';
import { AppError } from '../../../src/middlewares/errorHandler.middleware';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  prisma: {
    animal: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    weightRecord: {
      create: jest.fn(),
    },
    animalMovement: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as any;

describe('AnimalService', () => {
  let animalService: AnimalService;
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(() => {
    animalService = new AnimalService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validAnimalData = {
      internalCode: 'ANIMAL-001',
      identificationNumber: 'ID-001',
      breed: 'Yorkshire',
      gender: 'male',
      birthDate: '2024-01-01',
    };

    it('should create animal successfully', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue(null);
      mockPrisma.animal.create.mockResolvedValue({
        id: 'animal-1',
        ...validAnimalData,
        tenantId,
      });

      const result = await animalService.create(tenantId, validAnimalData);

      expect(result.id).toBe('animal-1');
      expect(mockPrisma.animal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          internalCode: 'ANIMAL-001',
          birthDate: expect.any(Date),
        }),
      });
    });

    it('should throw error if internal code already exists', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue({ id: 'existing-animal' });

      await expect(animalService.create(tenantId, validAnimalData))
        .rejects.toThrow(AppError);
    });
  });

  describe('findAll', () => {
    it('should return all animals for tenant', async () => {
      const mockAnimals = [
        { id: 'animal-1', internalCode: 'ANIMAL-001' },
        { id: 'animal-2', internalCode: 'ANIMAL-002' },
      ];

      mockPrisma.animal.findMany.mockResolvedValue(mockAnimals);

      const result = await animalService.findAll(tenantId);

      expect(result).toEqual(mockAnimals);
      expect(mockPrisma.animal.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          deletedAt: null,
        },
        include: {
          breed: true,
          currentPen: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter animals by status', async () => {
      mockPrisma.animal.findMany.mockResolvedValue([]);

      await animalService.findAll(tenantId, { status: 'active' });

      expect(mockPrisma.animal.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          deletedAt: null,
          currentStatus: 'active',
        },
        include: {
          breed: true,
          currentPen: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter animals by pen ID', async () => {
      mockPrisma.animal.findMany.mockResolvedValue([]);

      await animalService.findAll(tenantId, { penId: 'pen-1' });

      expect(mockPrisma.animal.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          deletedAt: null,
          currentPenId: 'pen-1',
        },
        include: {
          breed: true,
          currentPen: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    const animalId = 'animal-1';

    it('should return animal with relations', async () => {
      const mockAnimal = {
        id: animalId,
        internalCode: 'ANIMAL-001',
        breed: { id: 'breed-1', name: 'Yorkshire' },
        currentPen: { id: 'pen-1', name: 'Pen A' },
        weightRecords: [],
        movements: [],
      };

      mockPrisma.animal.findFirst.mockResolvedValue(mockAnimal);

      const result = await animalService.findOne(tenantId, animalId);

      expect(result).toEqual(mockAnimal);
      expect(mockPrisma.animal.findFirst).toHaveBeenCalledWith({
        where: { id: animalId, tenantId, deletedAt: null },
        include: expect.objectContaining({
          breed: true,
          currentPen: true,
          weightRecords: {
            orderBy: { measurementDate: 'desc' },
            take: 10,
          },
        }),
      });
    });

    it('should throw error if animal not found', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue(null);

      await expect(animalService.findOne(tenantId, animalId))
        .rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    const animalId = 'animal-1';
    const updateData = {
      identificationNumber: 'UPDATED-001',
      birthDate: '2024-01-15',
    };

    it('should update animal successfully', async () => {
      const mockAnimal = { id: animalId, internalCode: 'ANIMAL-001' };
      mockPrisma.animal.findFirst.mockResolvedValue(mockAnimal);
      mockPrisma.animal.update.mockResolvedValue({ ...mockAnimal, ...updateData });

      const result = await animalService.update(tenantId, animalId, updateData);

      expect(result).toEqual(expect.objectContaining(updateData));
      expect(mockPrisma.animal.update).toHaveBeenCalledWith({
        where: { id: animalId },
        data: expect.objectContaining({
          identificationNumber: 'UPDATED-001',
          birthDate: expect.any(Date),
        }),
      });
    });

    it('should throw error if animal not found', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue(null);

      await expect(animalService.update(tenantId, animalId, updateData))
        .rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    const animalId = 'animal-1';

    it('should soft delete animal successfully', async () => {
      const mockAnimal = { id: animalId, internalCode: 'ANIMAL-001' };
      mockPrisma.animal.findFirst.mockResolvedValue(mockAnimal);
      mockPrisma.animal.update.mockResolvedValue({});

      const result = await animalService.delete(tenantId, animalId);

      expect(result.message).toBe('Animal deleted successfully');
      expect(mockPrisma.animal.update).toHaveBeenCalledWith({
        where: { id: animalId },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      });
    });

    it('should throw error if animal not found', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue(null);

      await expect(animalService.delete(tenantId, animalId))
        .rejects.toThrow(AppError);
    });
  });

  describe('recordWeight', () => {
    const animalId = 'animal-1';
    const weightData = {
      weightKg: 50.5,
      measurementDate: '2024-01-15',
      notes: 'Healthy weight',
    };

    it('should record weight successfully', async () => {
      const mockAnimal = { id: animalId, internalCode: 'ANIMAL-001' };
      mockPrisma.animal.findFirst.mockResolvedValue(mockAnimal);
      mockPrisma.weightRecord.create.mockResolvedValue({
        id: 'weight-1',
        animalId,
        ...weightData,
      });

      const result = await animalService.recordWeight(tenantId, animalId, userId, weightData);

      expect(result.animalId).toBe(animalId);
      expect(result.weightKg).toBe(50.5);
      expect(mockPrisma.weightRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          animalId,
          weightKg: 50.5,
          recordedBy: userId,
          measurementDate: expect.any(Date),
        }),
      });
    });

    it('should throw error if animal not found', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue(null);

      await expect(animalService.recordWeight(tenantId, animalId, userId, weightData))
        .rejects.toThrow(AppError);
    });
  });

  describe('recordMovement', () => {
    const animalId = 'animal-1';
    const movementData = {
      movementType: 'transfer',
      fromPenId: 'pen-1',
      toPenId: 'pen-2',
      reason: 'Feed optimization',
    };

    it('should record movement successfully', async () => {
      const mockAnimal = { id: animalId, currentPenId: 'pen-1' };
      const mockMovement = { id: 'movement-1', animalId };
      
      mockPrisma.animal.findFirst.mockResolvedValue(mockAnimal);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.animalMovement.create.mockResolvedValue(mockMovement);
      mockPrisma.animal.update.mockResolvedValue({});

      const result = await animalService.recordMovement(tenantId, animalId, userId, movementData);

      expect(result.id).toBe('movement-1');
      expect(mockPrisma.animalMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          animalId,
          movementType: 'transfer',
          toPenId: 'pen-2',
        }),
      });
    });

    it('should throw error if animal not found', async () => {
      mockPrisma.animal.findFirst.mockResolvedValue(null);

      await expect(animalService.recordMovement(tenantId, animalId, userId, movementData))
        .rejects.toThrow(AppError);
    });
  });
});