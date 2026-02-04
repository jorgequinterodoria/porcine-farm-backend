
import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

// Mapping between Prisma Models and WatermelonDB Tables
// Key: Prisma Model Name, Value: WatermelonDB Table Name
const MODEL_TO_TABLE: Record<string, string> = {
  'Animal': 'animals',
  'Task': 'tasks',
  'FeedConsumption': 'feed_consumption',
  // Add other mappings as you implement them in the frontend schema
  // 'HealthRecord': 'health_records',
  // 'Facility': 'facilities',
  // 'Pen': 'pens',
};

// Reverse mapping for Push
const TABLE_TO_MODEL: Record<string, string> = Object.entries(MODEL_TO_TABLE).reduce((acc, [model, table]) => {
  acc[table] = model;
  return acc;
}, {} as Record<string, string>);

export class SyncService {
  /**
   * Retrieve changes since the last sync
   */
  async getChanges(tenantId: string, lastSyncAt: Date | null) {
    const changes: Record<string, { created: any[], updated: any[], deleted: string[] }> = {};
    const timestamp = lastSyncAt || new Date(0); // If null, get all (initial sync)

    for (const [modelName, tableName] of Object.entries(MODEL_TO_TABLE)) {
      // @ts-ignore - Dynamic access to prisma models
      const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      
      if (!model) {
        console.warn(`Model ${modelName} not found in Prisma client`);
        continue;
      }

      changes[tableName] = { created: [], updated: [], deleted: [] };
      
      try {
        // 1. Fetch created/updated records
        // We look for records updated OR created after the timestamp
        // Ideally, we distinguish created vs updated based on createdAt
        const records = await model.findMany({
          where: {
            tenantId: tenantId,
            updatedAt: { gt: timestamp },
            deletedAt: null // Only active records
          }
        });

        for (const record of records) {
          // Convert Date objects to timestamps (number) for WatermelonDB
          const recordForClient = this.formatRecordForClient(record);
          
          if (record.createdAt > timestamp) {
            changes[tableName].created.push(recordForClient);
          } else {
            changes[tableName].updated.push(recordForClient);
          }
        }

        // 2. Fetch deleted records
        // We need Soft Delete logic here. 
        // Assuming models have deletedAt field.
        const deletedRecords = await model.findMany({
          where: {
            tenantId: tenantId,
            deletedAt: { gt: timestamp }
          },
          select: { id: true }
        });

        changes[tableName].deleted = deletedRecords.map((r: any) => r.id);

      } catch (error: any) {
        console.error(`Error fetching changes for ${modelName}:`, error);
      }
    }

    return {
      changes,
      timestamp: new Date().getTime(), // Return current server time as timestamp
    };
  }

  /**
   * Process changes pushed from the client
   */
  async processChanges(tenantId: string, payload: { changes: Record<string, { created: any[], updated: any[], deleted: string[] }> }) {
    const results: Record<string, { success: number; errors: any[] }> = {};

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const [tableName, changeSet] of Object.entries(payload.changes)) {
        const modelName = TABLE_TO_MODEL[tableName];
        if (!modelName) continue; // Skip unknown tables

        // @ts-ignore
        const model = tx[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) continue;

        results[tableName] = { success: 0, errors: [] };

        // 1. Handle Created Records
        if (changeSet.created && Array.isArray(changeSet.created)) {
            for (const record of changeSet.created) {
                await this.applyChange(model, record, 'create', tenantId, results[tableName]);
            }
        }

        // 2. Handle Updated Records
        if (changeSet.updated && Array.isArray(changeSet.updated)) {
            for (const record of changeSet.updated) {
                await this.applyChange(model, record, 'update', tenantId, results[tableName]);
            }
        }

        // 3. Handle Deleted Records
        if (changeSet.deleted && Array.isArray(changeSet.deleted)) {
            for (const id of changeSet.deleted) {
                try {
                    // Soft delete
                    await model.update({
                        where: { id },
                        data: { deletedAt: new Date() }
                    });
                    results[tableName].success++;
                } catch (error: any) {
                    console.error(`Error deleting ${modelName} record ${id}:`, error);
                    results[tableName].errors.push({ id, error: error.message });
                }
            }
        }
      }
    });

    return results;
  }

  private async applyChange(model: any, record: any, type: 'create' | 'update', tenantId: string, result: { success: number; errors: any[] }): Promise<void> {
      try {
        const { id, ...data } = record;
        
        // Ensure tenantId security
        // If client sends tenantId, verify it. If not, inject it.
        if (data.tenantId && data.tenantId !== tenantId) {
            throw new Error('Security violation: Tenant ID mismatch');
        }
        data.tenantId = tenantId;

        // Convert timestamps from number (WatermelonDB) to Date (Prisma)
        this.formatRecordForServer(data);

        // Remove system fields if present
        delete data._status;
        delete data._changed;

        if (type === 'create') {
            await model.create({
                data: { id, ...data }
            });
        } else {
            await model.update({
                where: { id },
                data: data
            });
        }
        result.success++;
      } catch (error: any) {
          // If create fails because it exists, try update (idempotency)
          if (type === 'create' && error.code === 'P2002') {
             return this.applyChange(model, record, 'update', tenantId, result);
          }
          console.error(`Error applying ${type} for record ${record.id}:`, error);
          result.errors.push({ id: record.id, error: error.message });
      }
  }

  private formatRecordForClient(record: any) {
      const result = { ...record };
      // Convert Date objects to unix timestamps (ms)
      for (const key in result) {
          if (result[key] instanceof Date) {
              result[key] = result[key].getTime();
          }
      }
      return result;
  }

  private formatRecordForServer(record: any) {
      // Convert timestamps fields ending in 'At' or 'Date' from number to Date
      // This is a heuristic, might need strict schema mapping
      for (const key in record) {
          if ((key.endsWith('At') || key.endsWith('Date') || key === 'date') && typeof record[key] === 'number') {
              record[key] = new Date(record[key]);
          }
      }
  }
}

export const syncService = new SyncService();
