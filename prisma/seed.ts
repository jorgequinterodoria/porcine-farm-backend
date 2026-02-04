import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    
    const systemTenant = await prisma.tenant.upsert({
        where: { subdomain: 'system' },
        update: {},
        create: {
            name: 'System Administration',
            subdomain: 'system',
            email: 'admin@system.com',
            subscriptionPlan: 'enterprise',
            subscriptionStatus: 'active',
        }
    });

    console.log('✅ System tenant created/verified');

    
    const superadminEmail = 'jquintedori@gmail.com';
    const hashedPassword = await bcrypt.hash('FJ-3V&tzm', 10);

    await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: systemTenant.id,
                email: superadminEmail
            }
        },
        update: {
            passwordHash: hashedPassword,
            role: 'super_admin'
        },
        create: {
            tenantId: systemTenant.id,
            email: superadminEmail,
            passwordHash: hashedPassword,
            firstName: 'Jorge',
            lastName: 'Quintero',
            role: 'super_admin',
            isActive: true,
            emailVerified: true
        }
    });

    console.log('✅ Superadmin user created/verified');

    
    const breeds = [
        { code: 'DUR', name: 'Duroc', description: 'Raza americana conocida por su carne de calidad', originCountry: 'Estados Unidos' },
        { code: 'YORK', name: 'Yorkshire', description: 'Excelente para producción de carne magra', originCountry: 'Reino Unido' },
        { code: 'LAND', name: 'Landrace', description: 'Raza con alta prolificidad', originCountry: 'Dinamarca' },
    ];

    for (const breed of breeds) {
        await prisma.breed.upsert({
            where: { code: breed.code },
            update: breed,
            create: breed
        });
    }

    console.log('✅ Breeds created/verified');
    console.log('🏁 Seed completed successfully');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });