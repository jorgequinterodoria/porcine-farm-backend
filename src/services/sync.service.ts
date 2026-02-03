
import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

// Define the models that should be synchronized
const SYNC_MODELS = [
  'Animal',
  'Task',
  'FeedConsumption',
  'HealthRecord',
  'AnimalMovement',
  'WeightRecord',
  'BreedingService',
  'Pregnancy',
  'Farrowing',
  'Weaning',
  'Vaccination',
  'MedicationTreatment',
  'MortalityRecord',
  'FeedInventory',
  'FeedMovement',
  'FinancialTransaction',
  'AnimalSale',
  'AnimalSaleDetail',
  'Facility',
  'Pen',
  'FeedType',
  'Medication',
  'Vaccine',
  'Disease',
  'TransactionCategory'
];

export class SyncService {
  /**
   * Retrieve changes since the last sync
   */
  async getChanges(tenantId: string, lastSyncAt: Date | null) {
    const changes: Record<string, any[]> = {};
    const timestamp = lastSyncAt || new Date(0); // If null, get all (initial sync)

    for (const modelName of SYNC_MODELS) {
      // @ts-ignore - Dynamic access to prisma models
      const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      
      if (!model) {
        console.warn(`Model ${modelName} not found in Prisma client`);
        continue;
      }

      // Find records updated or deleted since lastSyncAt
      // Note: deleted records should be handled if we use Soft Delete (deletedAt field)
      // If we hard delete, we need a separate "DeletedLog" table to track deletions for sync.
      // Current schema has 'deletedAt' for Soft Delete support on most tables.
      
      try {
        const records = await model.findMany({
          where: {
            tenantId: tenantId,
            updatedAt: {
              gt: timestamp
            }
          }
        });
        
        if (records.length > 0) {
          changes[modelName] = records;
        }
      } catch (error: any) {
        // Some models might not have tenantId (e.g. shared catalogs if any), but here most have it.
        // Also handle models without updatedAt if any remained (but we fixed them).
        console.error(`Error fetching changes for ${modelName}:`, error);
      }
    }

    return {
      timestamp: new Date(),
      changes
    };
  }

  /**
   * Process changes pushed from the client
   */
  async processChanges(tenantId: string, payload: { changes: Record<string, any[]> }) {
    const results: Record<string, { success: number; errors: any[] }> = {};

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const [modelName, records] of Object.entries(payload.changes)) {
        // @ts-ignore
        const model = tx[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) continue;

        results[modelName] = { success: 0, errors: [] };

        for (const record of records) {
          try {
            // Optimistic locking or "Last Write Wins" strategy
            // We assume the client sends the full record including 'id'
            
            // If the record has a temporary ID (from client), we might need to handle ID mapping.
            // But usually offline-first apps use UUIDs generated on client, so IDs match.
            
            const { id, ...data } = record;
            
            // Ensure tenantId security
            if (data.tenantId && data.tenantId !== tenantId) {
              throw new Error('Security violation: Tenant ID mismatch');
            }
            data.tenantId = tenantId;

            // Remove timestamps managed by server if present in payload (optional, depending on trust)
            // But we want to respect client's updatedAt if it's newer? 
            // For simplicity: Server overwrite updatedAt.
            delete data.updatedAt;
            delete data.createdAt; 

            // Upsert: Update if exists, Create if not
            await model.upsert({
              where: { id },
              update: data,
              create: { id, ...data }
            });

            results[modelName].success++;
          } catch (error: any) {
            console.error(`Error processing ${modelName} record ${record.id}:`, error);
            results[modelName].errors.push({ id: record.id, error: error.message });
          }
        }
      }
    });

    return results;
  }
}

export const syncService = new SyncService();
