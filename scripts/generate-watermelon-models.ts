import fs from 'fs';
import path from 'path';

// CONFIGURACIÓN
const SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma');
const OUTPUT_DIR = path.join(process.cwd(), 'watermelon-models-out');

console.log('🍉 Generando Modelos TypeScript para WatermelonDB...');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

try {
  const fileLines = fs.readFileSync(SCHEMA_PATH, 'utf-8').split('\n');
  
  let currentModel: string | null = null;
  let tableName: string | null = null;
  let fieldLines: string[] = [];
  let imports: Set<string> = new Set(['Model']); // Siempre importamos Model
  let decorators: Set<string> = new Set([]); 
  let braceCount = 0;
  
  const generatedFiles: string[] = [];

  for (const line of fileLines) {
    const trimmed = line.trim();

    // 1. Detectar inicio de modelo
    const modelStart = trimmed.match(/^model\s+(\w+)\s+/);
    if (modelStart) {
      currentModel = modelStart[1];
      tableName = currentModel.toLowerCase(); // Fallback
      fieldLines = [];
      imports = new Set(['Model']);
      decorators = new Set([]);
      braceCount = 0;
    }

    if (currentModel) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // 2. Detectar nombre real de la tabla @@map("nombre")
      const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
      if (mapMatch) {
        tableName = mapMatch[1];
      }

      // 3. Procesar columnas
      // Regex: nombreTipo (String, Int, etc)
      const colMatch = trimmed.match(/^(\w+)\s+(\w+)(\?|\[\])?/);
      
      if (colMatch && !trimmed.startsWith('@@') && !trimmed.startsWith('//')) {
        const propName = colMatch[1];
        const prismaType = colMatch[2];
        const isOptional = colMatch[3] === '?';
        const isArray = line.includes('[]');

        // Mapeo de columnas @@map("col_name")
        const mapColMatch = trimmed.match(/@map\("([^"]+)"\)/);
        const dbColName = mapColMatch ? mapColMatch[1] : propName;

        // Ignoramos relaciones (arrays o tipos que no son básicos) salvo que sean IDs
        const isRelation = !['String', 'Boolean', 'Int', 'Float', 'Decimal', 'DateTime', 'Json', 'Bytes', 'BigInt'].includes(prismaType);

        // Si es el ID principal, Watermelon lo maneja interno, no lo declaramos
        if (dbColName !== 'id' && !isArray && !isRelation) {
            
            let decorator = '';
            let tsType = 'any';

            switch (prismaType) {
                case 'String':
                case 'Uuid':
                    decorator = 'text';
                    tsType = 'string';
                    break;
                case 'Int':
                case 'Float':
                case 'Decimal':
                    decorator = 'field';
                    tsType = 'number';
                    break;
                case 'Boolean':
                    decorator = 'field'; // O 'writer'? No, field está bien.
                    tsType = 'boolean';
                    break;
                case 'DateTime':
                    decorator = 'date';
                    tsType = 'number'; // Watermelon dates are timestamps
                    break;
                case 'Json':
                    decorator = 'json';
                    tsType = 'any';
                    break;
                default:
                    decorator = 'field';
                    tsType = 'any';
            }

            // Manejo de readonly para fechas de auditoría
            const isReadOnly = ['created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(dbColName);
            if (isReadOnly) {
                imports.add('readonly');
                decorator = 'readonly @' + decorator; // Truco para añadir el readonly antes
            }

            // Agregamos a los sets
            if (decorator.includes('readonly')) {
                 decorators.add('readonly');
                 decorators.add(decorator.split('@')[1]); // el tipo real (date, text)
            } else {
                 decorators.add(decorator);
            }

            // Generar línea de código
            // @text('column_name') propName!: string
            
            // Si usamos readonly, el formato es @readonly @date(...)
            const finalDecorator = isReadOnly 
                ? `@readonly @${decorator.split('@')[1]}('${dbColName}')` 
                : `@${decorator}('${dbColName}')`;

            fieldLines.push(`  ${finalDecorator} ${propName}${isOptional ? '?' : '!'}: ${tsType}`);
        } else if (propName.endsWith('Id') && propName !== 'id') {
            // Es una Foreign Key (ej: tenantId)
            // La tratamos como texto/campo simple para asegurar que se sincronice el ID
            decorators.add('text');
            fieldLines.push(`  @text('${dbColName}') ${propName}!: string`);
        }
      }

      // 4. Fin del modelo - Escribir archivo
      if (braceCount === 0 && fieldLines.length > 0) {
        
        // Verificar si es tabla syncable (tiene deletedAt)
        const content = fieldLines.join('\n');
        // Si no tiene deletedAt en los campos procesados, probablemente no es syncable (o no lo detectamos bien)
        // Pero asumiremos que el usuario filtrará manual si sobra algo.

        const decoratorImports = Array.from(decorators).join(', ');
        
        const fileContent = `import { Model } from '@nozbe/watermelondb'
import { ${decoratorImports} } from '@nozbe/watermelondb/decorators'

export default class ${currentModel} extends Model {
  static table = '${tableName}'

${content}
}
`;
        fs.writeFileSync(path.join(OUTPUT_DIR, `${currentModel}.ts`), fileContent);
        generatedFiles.push(currentModel!);
        
        currentModel = null;
      }
    }
  }

  // Generar index.ts
  const indexContent = generatedFiles.map(m => `export { default as ${m} } from './${m}'`).join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);

  console.log(`✅ ${generatedFiles.length} Modelos generados en: ${OUTPUT_DIR}`);
  console.log('👉 Copia el CONTENIDO de esa carpeta a tu frontend: src/database/models/');

} catch (e) {
  console.error(e);
}