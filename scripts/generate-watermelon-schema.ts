import fs from 'fs';
import path from 'path';

// CONFIGURACIÓN
const SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma');
// Lo guardaremos temporalmente en la raíz del backend para que lo copies
const OUTPUT_PATH = path.join(process.cwd(), 'watermelon-schema-output.js');

console.log('🍉 Generando Esquema de WatermelonDB desde Prisma...');

try {
  const fileLines = fs.readFileSync(SCHEMA_PATH, 'utf-8').split('\n');
  
  let currentModel: string | null = null;
  let tableName: string | null = null;
  let columns: string[] = [];
  let braceCount = 0;
  
  // Salida final
  let schemaOutput = `import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1,
  tables: [
`;

  for (const line of fileLines) {
    const trimmed = line.trim();

    // 1. Detectar inicio de modelo
    const modelStart = trimmed.match(/^model\s+(\w+)\s+/);
    if (modelStart) {
      currentModel = modelStart[1];
      tableName = currentModel.toLowerCase(); // Default fallback
      columns = [];
      braceCount = 0;
    }

    if (currentModel) {
      // Control de llaves
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // 2. Detectar nombre real de la tabla @@map("nombre")
      const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
      if (mapMatch) {
        tableName = mapMatch[1];
      }

      // 3. Detectar Columnas (ignorando relaciones y configuraciones de bloque)
      // Formato típico: nombreTipo @decoradores
      // Ignoramos líneas que empiezan con @@, //, o relaciones (tipos que no son escalares)
      const colMatch = trimmed.match(/^(\w+)\s+(\w+)(\?|\[\])?/);
      
      if (colMatch && !trimmed.startsWith('@@') && !trimmed.startsWith('//')) {
        const colName = colMatch[1];
        const colType = colMatch[2];
        const isArray = trimmed.includes('[]'); // Relaciones One-to-Many se ignoran en el schema de tabla

        // Mapeo de tipos Prisma -> Watermelon
        // Tipos soportados por Watermelon: string, number, boolean
        let watermelonType = '';
        
        // Mapear campos especiales
        const mapColMatch = trimmed.match(/@map\("([^"]+)"\)/);
        const dbColName = mapColMatch ? mapColMatch[1] : colName;

        if (!isArray) {
            switch (colType) {
                case 'String':
                case 'Uuid': // Prisma usa String para UUID usualmente o tipo custom
                case 'Json': // Watermelon guarda JSON como string
                    watermelonType = 'string';
                    break;
                case 'Int':
                case 'Float':
                case 'Decimal':
                case 'DateTime': // Watermelon usa timestamps (number)
                    watermelonType = 'number';
                    break;
                case 'Boolean':
                    watermelonType = 'boolean';
                    break;
                default:
                    // Si es un tipo enum o relación One-to-One que guarda ID
                    // Asumimos string si no es un tipo básico conocido (ej: User, Tenant)
                    // Verificamos si parece una relación por ID (termina en Id)
                    if (colName.endsWith('Id')) {
                        watermelonType = 'string';
                    }
                    break;
            }

            if (watermelonType) {
                // Watermelon requiere que las columnas sean snake_case generalmente si la BD es snake_case
                // Agregamos la definición
                if (dbColName !== 'id') { // ID es implícito en Watermelon
                     // Detectar si es indexado (opcional, por ahora simple)
                     const isIndexed = trimmed.includes('@index') || colName.endsWith('Id');
                     columns.push(`      { name: '${dbColName}', type: '${watermelonType}'${isIndexed ? ', isIndexed: true' : ''} },`);
                }
            }
        }
      }

      // 4. Fin del modelo
      if (braceCount === 0 && columns.length > 0) {
        // Solo incluimos si tiene deleted_at (es syncable)
        const hasDeletedAt = columns.some(c => c.includes('deleted_at') || c.includes('deletedAt'));
        
        if (hasDeletedAt) {
            schemaOutput += `    tableSchema({
      name: '${tableName}',
      columns: [
${columns.join('\n')}
      ]
    }),
`;
        }
        currentModel = null;
      }
    }
  }

  schemaOutput += `  ]
})`;

  fs.writeFileSync(OUTPUT_PATH, schemaOutput);
  console.log(`✅ Schema generado en: ${OUTPUT_PATH}`);
  console.log('👉 Ahora ve a la carpeta Frontend y pega este contenido en src/model/schema.js');

} catch (e) {
  console.error(e);
}