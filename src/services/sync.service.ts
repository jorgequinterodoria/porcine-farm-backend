import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../config/database'; 
import { SYNC_MODEL_MAP, SyncModelName, SyncTableName } from '../config/sync-map';

export class SyncService {
  
  



  private getPrismaDelegate(modelName: string) {
    const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    // @ts-ignore - Acceso dinámico a prisma
    return prisma[delegateName];
  }

  


  private getModelFromTableName(tableName: string): string | undefined {
    return Object.keys(SYNC_MODEL_MAP).find(
      key => SYNC_MODEL_MAP[key as SyncModelName] === tableName
    );
  }

  


  async getChanges(tenantId: string, lastSyncAt: Date | null) {
    const changes: Record<string, { created: any[], updated: any[], deleted: string[] }> = {};
    const timestamp = lastSyncAt || new Date(0); 

    
    for (const modelName of Object.keys(SYNC_MODEL_MAP) as SyncModelName[]) {
      const tableName = SYNC_MODEL_MAP[modelName];
      const model = this.getPrismaDelegate(modelName);

      if (!model) {
        console.warn(`⚠️ Modelo Prisma no encontrado para: ${modelName}`);
        continue;
      }

      
      changes[tableName] = { created: [], updated: [], deleted: [] };

      try {
        
        const records = await model.findMany({
          where: {
            tenantId: tenantId,
            updatedAt: { gt: timestamp },
            deletedAt: null 
          }
        });

        for (const record of records) {
          const recordForClient = this.formatRecordForClient(record);
          
          
          if (record.createdAt > timestamp) {
            changes[tableName].created.push(recordForClient);
          } else {
            changes[tableName].updated.push(recordForClient);
          }
        }

        
        const deletedRecords = await model.findMany({
          where: {
            tenantId: tenantId,
            deletedAt: { gt: timestamp }
          },
          select: { id: true }
        });

        changes[tableName].deleted = deletedRecords.map((r: any) => r.id);

      } catch (error: any) {
        console.error(`❌ Error en sync PULL para ${modelName}:`, error);
      }
    }

    return {
      changes,
      timestamp: new Date().getTime(),
    };
  }

  


  async processChanges(tenantId: string, payload: { changes: Record<string, { created: any[], updated: any[], deleted: string[] }> }) {
    const results: Record<string, { success: number; errors: any[] }> = {};

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      
      for (const [tableName, changeSet] of Object.entries(payload.changes)) {
        
        const modelName = this.getModelFromTableName(tableName);
        if (!modelName) {
            console.warn(`⚠️ Tabla desconocida en PUSH: ${tableName}`);
            continue; 
        }

        // @ts-ignore - Obtenemos el delegado dentro de la transacción
        const model = tx[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) continue;

        results[tableName] = { success: 0, errors: [] };

        
        if (changeSet.created?.length > 0) {
          for (const record of changeSet.created) {
            await this.applyChange(model, record, 'create', tenantId, results[tableName]);
          }
        }

        
        if (changeSet.updated?.length > 0) {
          for (const record of changeSet.updated) {
            await this.applyChange(model, record, 'update', tenantId, results[tableName]);
          }
        }

        
        if (changeSet.deleted?.length > 0) {
          for (const id of changeSet.deleted) {
            try {
              await model.update({
                where: { id },
                data: { 
                    deletedAt: new Date(),
                    updatedAt: new Date() 
                }
              });
              results[tableName].success++;
            } catch (error: any) {
              console.error(`Error borrando ${modelName} ID ${id}:`, error);
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
      
      
      if (data.tenantId && data.tenantId !== tenantId) {
        throw new Error('Violación de seguridad: Tenant ID no coincide');
      }
      data.tenantId = tenantId;

      
      this.formatRecordForServer(data);

      
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
      
      if (type === 'create' && error.code === 'P2002') {
        return this.applyChange(model, record, 'update', tenantId, result);
      }
      console.error(`Error aplicando ${type} registro ${record.id}:`, error.message);
      result.errors.push({ id: record.id, error: error.message });
    }
  }

  

  private formatRecordForClient(record: any) {
    const result = { ...record };
    
    for (const key in result) {
      if (result[key] instanceof Date) {
        result[key] = result[key].getTime();
      }
      
      if (result[key] instanceof Prisma.Decimal) {
          result[key] = result[key].toNumber(); 
      }
    }
    return result;
  }

  private formatRecordForServer(record: any) {
    
    
    for (const key in record) {
      const value = record[key];
      
      if (
        typeof value === 'number' && 
        value > 0 &&
        (key.endsWith('At') || key.endsWith('Date') || key === 'date' || key === 'birthDate')
      ) {
        record[key] = new Date(value);
      }
    }
  }
}

export const syncService = new SyncService();