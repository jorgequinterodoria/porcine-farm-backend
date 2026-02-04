import fs from 'fs';
import path from 'path';


const SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma');
const OUTPUT_PATH = path.join(process.cwd(), 'src/config/sync-map.ts');

console.log('🔄 Iniciando generación del Mapa de Sincronización (Versión Robusta)...');

try {
    if (!fs.existsSync(SCHEMA_PATH)) {
        throw new Error(`No se encontró el schema en: ${SCHEMA_PATH}`);
    }

    const fileLines = fs.readFileSync(SCHEMA_PATH, 'utf-8').split('\n');
    const syncModels: Record<string, string> = {};

    let currentModel: string | null = null;
    let currentBody: string = '';
    let braceCount = 0; 

    for (const line of fileLines) {
        const trimmedLine = line.trim();

        
        const modelStart = trimmedLine.match(/^model\s+(\w+)\s+/);

        if (modelStart) {
            currentModel = modelStart[1];
            currentBody = '';
            braceCount = 0;
        }

        if (currentModel) {
            currentBody += line + '\n';

            
            
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            
            if (braceCount === 0 && currentBody.trim().length > 0) {

                
                const hasDeletedAt = /deletedAt\s+DateTime\?/.test(currentBody);

                if (hasDeletedAt) {
                    
                    const mapMatch = currentBody.match(/@@map\("([^"]+)"\)/);
                    const tableName = mapMatch ? mapMatch[1] : currentModel.toLowerCase();

                    syncModels[currentModel] = tableName;
                }

                
                currentModel = null;
            }
        }
    }

    
    const fileContent = `// ⚠️ ESTE ARCHIVO ES GENERADO AUTOMÁTICAMENTE.
// No lo edites manualmente. Ejecuta: npx tsx scripts/generate-sync-map.ts

export const SYNC_MODEL_MAP = ${JSON.stringify(syncModels, null, 2)} as const;

export type SyncModelName = keyof typeof SYNC_MODEL_MAP;
export type SyncTableName = (typeof SYNC_MODEL_MAP)[SyncModelName];

export const isSyncableTable = (tableName: string): boolean => {
  return Object.values(SYNC_MODEL_MAP).includes(tableName as SyncTableName);
};
`;

    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, fileContent);

    console.log(`✅ Mapa generado con éxito en: ${OUTPUT_PATH}`);
    console.log(`📊 Modelos detectados para sync: ${Object.keys(syncModels).length}`);
    
    console.log(Object.keys(syncModels).sort());

} catch (error) {
    console.error('❌ Error generando el mapa:', error);
    process.exit(1);
}