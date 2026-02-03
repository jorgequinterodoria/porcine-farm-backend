import swaggerJsdoc from 'swagger-jsdoc';
import { options } from '../src/config/swagger';
import fs from 'fs';
import path from 'path';

// Asegurar que existe el directorio public
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Generar especificación
console.log('Generating Swagger JSON...');
const specs = swaggerJsdoc(options);

// Escribir archivo
const outputPath = path.join(publicDir, 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
console.log(`Swagger JSON generated at ${outputPath}`);
