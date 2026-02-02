import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Test data factory for creating realistic test data
export class TestDataFactory {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
        },
      },
    });
  }

  // Clean all test data
  async cleanup() {
    // Delete in order respecting foreign key constraints
    const tablenames = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          console.log(`Error truncating ${tablename}:`, error);
        }
      }
    }
  }

  // Create test tenant
  async createTenant(overrides: Partial<any> = {}) {
    return await this.prisma.tenant.create({
      data: {
        name: 'Test Farm',
        subdomain: 'testfarm',
        email: 'test@farm.com',
        subscriptionPlan: 'basic',
        subscriptionStatus: 'active',
        maxUsers: 5,
        maxAnimals: 100,
        isActive: true,
        ...overrides,
      },
    });
  }

  // Create test user
  async createUser(tenantId: string, overrides: Partial<any> = {}) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    return await this.prisma.user.create({
      data: {
        tenantId,
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'farm_admin',
        isActive: true,
        emailVerified: true,
        ...overrides,
      },
    });
  }

  // Create test facility
  async createFacility(tenantId: string, overrides: Partial<any> = {}) {
    return await this.prisma.facility.create({
      data: {
        tenantId,
        name: 'Test Facility',
        type: 'breeding',
        capacity: 100,
        currentOccupancy: 0,
        isActive: true,
        ...overrides,
      },
    });
  }

  // Create test pen
  async createPen(tenantId: string, facilityId: string, overrides: Partial<any> = {}) {
    return await this.prisma.pen.create({
      data: {
        tenantId,
        facilityId,
        name: 'Test Pen',
        code: 'TP-001',
        type: 'breeding',
        capacity: 20,
        currentOccupancy: 0,
        isActive: true,
        ...overrides,
      },
    });
  }

  // Create test animal
  async createAnimal(tenantId: string, overrides: Partial<any> = {}) {
    return await this.prisma.animal.create({
      data: {
        tenantId,
        internalCode: `ANIMAL-${Date.now()}`,
        identificationNumber: `ID-${Date.now()}`,
        sex: 'male',
        birthDate: new Date('2024-01-01'),
        birthWeight: 1.5,
        currentStatus: 'active',
        stage: 'nursery',
        isActive: true,
        ...overrides,
      },
    });
  }

  // Create complete test dataset
  async createCompleteDataset() {
    // Create tenant
    const tenant = await this.createTenant({
      name: 'Complete Test Farm',
      subdomain: 'complete-test',
    });

    // Create users with different roles
    const adminUser = await this.createUser(tenant.id, {
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'farm_admin',
    });

    const operatorUser = await this.createUser(tenant.id, {
      email: 'operator@test.com',
      firstName: 'Operator',
      lastName: 'User',
      role: 'operator',
    });

    // Create facilities
    const breedingFacility = await this.createFacility(tenant.id, {
      name: 'Breeding Facility',
      type: 'breeding',
      capacity: 200,
    });

    const fatteningFacility = await this.createFacility(tenant.id, {
      name: 'Fattening Facility',
      type: 'fattening',
      capacity: 500,
    });

    // Create pens
    const breedingPen1 = await this.createPen(tenant.id, breedingFacility.id, {
      name: 'Breeding Pen A',
      code: 'BP-A',
      type: 'breeding',
      capacity: 20,
    });

    const breedingPen2 = await this.createPen(tenant.id, breedingFacility.id, {
      name: 'Breeding Pen B',
      code: 'BP-B',
      type: 'breeding',
      capacity: 20,
    });

    const fatteningPen1 = await this.createPen(tenant.id, fatteningFacility.id, {
      name: 'Fattening Pen A',
      code: 'FP-A',
      type: 'fattening',
      capacity: 50,
    });

    // Create animals with different statuses
    const activeAnimal = await this.createAnimal(tenant.id, {
      internalCode: 'ACTIVE-001',
      sex: 'male',
      currentStatus: 'active',
      currentPenId: breedingPen1.id,
    });

    const soldAnimal = await this.createAnimal(tenant.id, {
      internalCode: 'SOLD-001',
      sex: 'female',
      currentStatus: 'sold',
    });

    const sickAnimal = await this.createAnimal(tenant.id, {
      internalCode: 'SICK-001',
      sex: 'male',
      currentStatus: 'sick',
      currentPenId: breedingPen2.id,
    });

    const quarantineAnimal = await this.createAnimal(tenant.id, {
      internalCode: 'QUAR-001',
      sex: 'female',
      currentStatus: 'quarantine',
      currentPenId: fatteningPen1.id,
    });

    return {
      tenant,
      users: { adminUser, operatorUser },
      facilities: { breedingFacility, fatteningFacility },
      pens: { breedingPen1, breedingPen2, fatteningPen1 },
      animals: { activeAnimal, soldAnimal, sickAnimal, quarantineAnimal },
    };
  }

  // Disconnect from database
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const testDataFactory = new TestDataFactory();