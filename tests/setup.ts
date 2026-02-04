import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';


const prisma = new PrismaClient({
  // @ts-ignore
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
    },
  },
});


beforeAll(async () => {
  
  await cleanupDatabase();
});

afterAll(async () => {
  
  await prisma.$disconnect();
});

beforeEach(async () => {
  
  await cleanupDatabase();
});


async function cleanupDatabase() {
  
  const tablenames = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }
}


export const createTestTenant = async (overrides: any = {}) => {
  return await prisma.tenant.create({
    data: {
      name: 'Test Farm',
      plan: 'basic',
      maxUsers: 5,
      maxAnimals: 100,
      isActive: true,
      ...overrides,
    },
  });
};

export const createTestUser = async (tenantId: string, overrides: any = {}) => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  return await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'farm_admin',
      tenantId,
      isActive: true,
      ...overrides,
    },
  });
};

export const createTestAnimal = async (tenantId: string, overrides: any = {}) => {
  return await prisma.animal.create({
    data: {
      identificationNumber: 'TEST-001',
      breed: 'Yorkshire',
      gender: 'male',
      birthDate: new Date('2024-01-01'),
      status: 'active',
      tenantId,
      ...overrides,
    },
  });
};

export const createTestFacility = async (tenantId: string, overrides: any = {}) => {
  return await prisma.facility.create({
    data: {
      name: 'Test Facility',
      type: 'breeding',
      capacity: 100,
      tenantId,
      ...overrides,
    },
  });
};

export { prisma };